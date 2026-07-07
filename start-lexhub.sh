#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${LEXHUB_HOME:-$SCRIPT_DIR}"
ROOT="$REPO_ROOT/Co-Sight-master"
FRONTEND="$ROOT/cosight_frontend"
BACKEND_ENTRY="$ROOT/cosight_server/deep_research/main.py"
VENV="$ROOT/.venv"
BACKEND_PORT="${BACKEND_PORT:-7788}"
FRONTEND_PORT="${FRONTEND_PORT:-5174}"
LEXHUB_HOST="${LEXHUB_HOST:-127.0.0.1}"
LEXHUB_OPEN_BROWSER="${LEXHUB_OPEN_BROWSER:-1}"
LEXHUB_SKIP_INSTALL="${LEXHUB_SKIP_INSTALL:-0}"

echo "========================================"
echo "              LexHub"
echo "========================================"
echo
echo "[INFO] Project root: $REPO_ROOT"
echo "[INFO] Backend port: $BACKEND_PORT"
echo "[INFO] Frontend port: $FRONTEND_PORT"
echo

if [[ ! -d "$ROOT" ]]; then
  echo "[ERROR] Co-Sight-master not found: $ROOT"
  exit 1
fi

if [[ ! -f "$BACKEND_ENTRY" ]]; then
  echo "[ERROR] Backend entry not found: $BACKEND_ENTRY"
  exit 1
fi

if [[ ! -f "$FRONTEND/package.json" ]]; then
  echo "[ERROR] Frontend project not found: $FRONTEND/package.json"
  exit 1
fi

cd "$ROOT"

if [[ ! -f .env ]]; then
  if [[ -f .env_template ]]; then
    cp .env_template .env
    echo "[INFO] Created .env from .env_template"
    echo "[INFO] Configure API keys in: $ROOT/.env"
    echo
  else
    echo "[WARN] .env missing; backend may fail without API keys"
    echo
  fi
fi

find_python() {
  local candidates=(python3.11 python3 python)
  for cmd in "${candidates[@]}"; do
    if command -v "$cmd" >/dev/null 2>&1; then
      if "$cmd" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)' >/dev/null 2>&1; then
        echo "$cmd"
        return 0
      fi
    fi
  done
  return 1
}

PY="$(find_python || true)"
if [[ -z "$PY" ]]; then
  echo "[ERROR] Python 3.11+ required"
  exit 1
fi

echo "[INFO] Using Python: $PY"
"$PY" --version
echo

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js not found - install Node.js 18+"
  exit 1
fi

if ! node -e "const v=parseInt(process.versions.node.split('.')[0],10); process.exit(v>=18?0:1)"; then
  echo "[ERROR] Node.js 18+ required"
  node --version
  exit 1
fi

echo "[INFO] Using Node:"
node --version
echo

check_port() {
  local port="$1"
  local name="$2"
  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"$port" -sTCP:LISTEN -Pn >/dev/null 2>&1; then
      echo "[WARN] Port $port already in use - $name may fail to start"
      echo
    fi
  elif command -v ss >/dev/null 2>&1; then
    if ss -ltn | grep -q ":$port "; then
      echo "[WARN] Port $port already in use - $name may fail to start"
      echo
    fi
  fi
}

check_port "$BACKEND_PORT" "backend"
check_port "$FRONTEND_PORT" "frontend"

if [[ ! -x "$VENV/bin/python" ]]; then
  if [[ "$LEXHUB_SKIP_INSTALL" == "1" ]]; then
    echo "[ERROR] Python virtual environment missing, but LEXHUB_SKIP_INSTALL=1"
    echo "        Expected: $VENV/bin/python"
    exit 1
  fi
  echo "[INFO] Creating Python virtual environment..."
  "$PY" -m venv "$VENV"
  echo
fi

PY_EXE="$VENV/bin/python"

if ! "$PY_EXE" -c "import importlib.util as u; mods=['fastapi','uvicorn','dotenv','chromadb','aiohttp']; missing=[m for m in mods if u.find_spec(m) is None]; import sys; sys.exit(1 if missing else 0)" >/dev/null 2>&1; then
  if [[ "$LEXHUB_SKIP_INSTALL" == "1" ]]; then
    echo "[ERROR] Python dependencies missing, but LEXHUB_SKIP_INSTALL=1"
    echo "        Run without LEXHUB_SKIP_INSTALL first, or install manually:"
    echo "        $PY_EXE -m pip install -r requirements.txt"
    exit 1
  fi
  echo "[INFO] Installing Python dependencies - first run may take several minutes..."
  PIP_INDEX_ARGS=()
  if [[ -n "${LEXHUB_PIP_INDEX_URL:-}" ]]; then
    PIP_INDEX_ARGS=(--index-url "$LEXHUB_PIP_INDEX_URL")
  fi
  "$PY_EXE" -m pip install "${PIP_INDEX_ARGS[@]}" --upgrade pip setuptools wheel
  "$PY_EXE" -m pip install "${PIP_INDEX_ARGS[@]}" -r requirements.txt
  "$PY_EXE" -m pip install "${PIP_INDEX_ARGS[@]}" "uvicorn[standard]" python-dotenv
  echo
fi

if [[ ! -d "$FRONTEND/node_modules" ]]; then
  if [[ "$LEXHUB_SKIP_INSTALL" == "1" ]]; then
    echo "[ERROR] Frontend dependencies missing, but LEXHUB_SKIP_INSTALL=1"
    echo "        Expected: $FRONTEND/node_modules"
    exit 1
  fi
  echo "[INFO] Installing frontend dependencies..."
  pushd "$FRONTEND" >/dev/null
  if [[ -n "${LEXHUB_NPM_REGISTRY:-}" ]]; then
    npm config set registry "$LEXHUB_NPM_REGISTRY"
  fi
  if [[ -f package-lock.json ]]; then
    npm ci || {
      echo "[WARN] npm ci failed; trying npm install..."
      npm install
    }
  else
    npm install
  fi
  popd >/dev/null
  echo
fi

wait_for_url() {
  local url="$1"
  local label="$2"
  local max_tries="$3"
  local tries=0
  while (( tries < max_tries )); do
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
      return 0
    fi
    tries=$((tries + 1))
    sleep 2
  done
  echo "[WARN] $label not ready - check terminal output for errors"
  return 1
}

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "[1/2] Starting backend  http://$LEXHUB_HOST:$BACKEND_PORT"
"$PY_EXE" "$BACKEND_ENTRY" &
BACKEND_PID=$!

echo "[2/2] Starting frontend  http://$LEXHUB_HOST:$FRONTEND_PORT"
pushd "$FRONTEND" >/dev/null
npm run dev -- --host "$LEXHUB_HOST" --port "$FRONTEND_PORT" &
FRONTEND_PID=$!
popd >/dev/null

echo
echo "[INFO] Waiting for services..."
wait_for_url "http://$LEXHUB_HOST:$BACKEND_PORT/api/nae-deep-research/v1/deep-research/server-timestamp" "Backend" 30 || true
wait_for_url "http://$LEXHUB_HOST:$FRONTEND_PORT/" "Frontend" 20 || true

if [[ "$LEXHUB_OPEN_BROWSER" == "1" ]]; then
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://$LEXHUB_HOST:$FRONTEND_PORT" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "http://$LEXHUB_HOST:$FRONTEND_PORT" >/dev/null 2>&1 || true
  fi
fi

echo
echo "  Backend:  http://$LEXHUB_HOST:$BACKEND_PORT"
echo "  Frontend: http://$LEXHUB_HOST:$FRONTEND_PORT"
echo "  Admin:    http://$LEXHUB_HOST:$FRONTEND_PORT/admin"
echo
echo "  Optional environment variables:"
echo "    BACKEND_PORT=7788"
echo "    FRONTEND_PORT=5174"
echo "    LEXHUB_PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple"
echo "    LEXHUB_NPM_REGISTRY=https://registry.npmmirror.com"
echo "    LEXHUB_SKIP_INSTALL=1"
echo "    LEXHUB_OPEN_BROWSER=0"
echo
echo "  Press Ctrl+C to stop services"
echo

wait
