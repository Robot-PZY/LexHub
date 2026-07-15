#!/usr/bin/env python3
"""One-click LexHub launcher for the backend and Vite frontend on Windows."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time
from urllib.request import urlopen
import webbrowser


ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "cosight_frontend"
PID_FILE = ROOT / ".lexhub-pids.json"
LOG_DIR = ROOT / "logs"
BACKEND_LOG = LOG_DIR / "launcher-backend.log"
FRONTEND_LOG = LOG_DIR / "launcher-frontend.log"
BACKEND_URL = "http://127.0.0.1:7788/api/nae-deep-research/v1/deep-research/server-timestamp"
FRONTEND_URL = "http://127.0.0.1:5174"


def _port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client:
        client.settimeout(0.4)
        return client.connect_ex(("127.0.0.1", port)) == 0


def _http_ready(url: str, timeout: float = 2.0) -> bool:
    try:
        with urlopen(url, timeout=timeout) as response:
            return 200 <= response.status < 500
    except Exception:
        return False


def _python_executable() -> str:
    candidates = [
        ROOT / ".venv" / "Scripts" / "python.exe",
        Path(sys.executable),
    ]
    for candidate in candidates:
        if not candidate.is_file():
            continue
        probe = subprocess.run(
            [str(candidate), "-c", "import fastapi, uvicorn, dotenv, aiohttp, chromadb, openai"],
            cwd=ROOT,
            capture_output=True,
        )
        if probe.returncode == 0:
            return str(candidate)
    raise RuntimeError("未找到已安装后端依赖的 Python；请先执行 pip install -r requirements.txt")


def _npm_executable() -> str:
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not npm:
        raise RuntimeError("未找到 npm；请安装 Node.js 并加入 PATH")
    if not (FRONTEND / "node_modules").is_dir():
        raise RuntimeError("前端依赖尚未安装；请先在 cosight_frontend 执行 npm install")
    return npm


def _preflight() -> tuple[str, str]:
    if sys.version_info < (3, 11):
        raise RuntimeError("需要 Python 3.11 或更高版本")
    if not (ROOT / ".env").is_file():
        raise RuntimeError("缺少 .env；请从 .env_template 复制并配置模型 API")
    if not (ROOT / "cosight_server/deep_research/main.py").is_file():
        raise RuntimeError("未找到后端入口")
    if not (FRONTEND / "package.json").is_file():
        raise RuntimeError("未找到前端工程")
    return _python_executable(), _npm_executable()


def _spawn(command: list[str], cwd: Path, log_path: Path) -> subprocess.Popen:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_handle = log_path.open("w", encoding="utf-8")
    if os.name == "nt":
        return subprocess.Popen(
            command,
            cwd=cwd,
            stdin=subprocess.DEVNULL,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW,
        )
    return subprocess.Popen(
        command,
        cwd=cwd,
        stdin=subprocess.DEVNULL,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )


def _tail_log(path: Path, line_count: int = 24) -> None:
    if not path.is_file():
        return
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return
    if lines:
        print(f"\n--- {path.name} 最近日志 ---")
        print("\n".join(lines[-line_count:]))


def _wait_for_service(
    name: str,
    url: str,
    process: subprocess.Popen | None,
    timeout: int,
    log_path: Path,
) -> bool:
    started = time.monotonic()
    next_report = 0
    while time.monotonic() - started < timeout:
        if _http_ready(url):
            elapsed = int(time.monotonic() - started)
            print(f"[就绪] {name}（{elapsed} 秒）")
            return True
        if process is not None and process.poll() is not None:
            print(f"[失败] {name}进程已退出，退出码 {process.returncode}")
            _tail_log(log_path)
            return False
        elapsed = int(time.monotonic() - started)
        if elapsed >= next_report:
            print(f"[等待] {name}正在启动… {elapsed}/{timeout} 秒")
            next_report += 10
        time.sleep(1)
    print(f"[超时] {name}未在 {timeout} 秒内就绪，请查看对应日志窗口")
    _tail_log(log_path)
    return False


def _save_pids(processes: dict[str, subprocess.Popen]) -> None:
    PID_FILE.write_text(
        json.dumps({name: process.pid for name, process in processes.items()}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _windows_listener_pids(ports: set[int]) -> set[int]:
    if os.name != "nt":
        return set()
    result = subprocess.run(
        ["netstat", "-ano", "-p", "tcp"],
        capture_output=True,
        text=True,
        errors="replace",
    )
    listener_pids: set[int] = set()
    for line in result.stdout.splitlines():
        columns = line.split()
        if len(columns) < 5 or columns[0].upper() != "TCP" or columns[3].upper() != "LISTENING":
            continue
        try:
            port = int(columns[1].rsplit(":", 1)[-1])
            pid = int(columns[-1])
        except ValueError:
            continue
        if port in ports and pid > 0:
            listener_pids.add(pid)
    return listener_pids


def stop_services() -> int:
    recorded: dict[str, int] = {}
    if PID_FILE.is_file():
        try:
            recorded = json.loads(PID_FILE.read_text(encoding="utf-8"))
        except Exception:
            recorded = {}

    targets = {pid for pid in recorded.values() if isinstance(pid, int)}
    targets.update(_windows_listener_pids({7788, 5174}))
    if not targets:
        print("[提示] 未发现由一键启动器创建的服务。")
        PID_FILE.unlink(missing_ok=True)
        return 0

    stopped = 0
    for pid in sorted(targets):
        if os.name == "nt":
            result = subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
        else:
            result = subprocess.run(["kill", str(pid)], capture_output=True)
        state = "已停止" if result.returncode == 0 else "未运行或已退出"
        if result.returncode == 0:
            stopped += 1
        print(f"[{state}] 服务进程 (PID {pid})")
    PID_FILE.unlink(missing_ok=True)
    if stopped:
        print(f"[完成] 已停止 {stopped} 个服务进程。")
    return 0


def start_services(check_only: bool = False, no_browser: bool = False) -> int:
    print("[检查] 正在检查配置与依赖…")
    python, npm = _preflight()
    print(f"[通过] Python: {python}")
    print(f"[通过] npm: {npm}")
    if check_only:
        print("[通过] 一键启动环境检查完成。")
        return 0

    processes: dict[str, subprocess.Popen] = {}
    backend_process = None
    frontend_process = None

    if _port_open(7788):
        if not _http_ready(BACKEND_URL):
            raise RuntimeError("端口 7788 已被其他程序占用；请先关闭该程序后重试")
        print("[复用] 后端服务已运行。")
    else:
        backend_process = _spawn(
            [python, "-u", str(ROOT / "cosight_server/deep_research/main.py")], ROOT, BACKEND_LOG
        )
        processes["backend"] = backend_process
        print(f"[启动] 后端 PID {backend_process.pid}（首次加载可能需要 1–3 分钟）")

    if _port_open(5174):
        if not _http_ready(FRONTEND_URL):
            raise RuntimeError("端口 5174 已被其他程序占用；请先关闭该程序后重试")
        print("[复用] 前端服务已运行。")
    else:
        frontend_process = _spawn(
            [npm, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5174", "--strictPort"],
            FRONTEND,
            FRONTEND_LOG,
        )
        processes["frontend"] = frontend_process
        print(f"[启动] 前端 PID {frontend_process.pid}")

    if processes:
        _save_pids(processes)

    backend_ready = _wait_for_service("后端", BACKEND_URL, backend_process, 240, BACKEND_LOG)
    frontend_ready = _wait_for_service("前端", FRONTEND_URL, frontend_process, 60, FRONTEND_LOG)
    if not (frontend_ready and backend_ready):
        print("[未完成] 服务未全部就绪，可双击项目外层 stop-lexhub.bat 清理本次启动进程。")
        return 1

    print("\n========================================")
    print("律枢 LexHub 已启动")
    print(f"访问地址：{FRONTEND_URL}")
    print("停止服务：双击项目外层 stop-lexhub.bat")
    print("========================================")
    if not no_browser:
        webbrowser.open(FRONTEND_URL)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="律枢 LexHub 一键启动器")
    parser.add_argument("--check", action="store_true", help="仅检查环境，不启动服务")
    parser.add_argument("--stop", action="store_true", help="停止由启动器创建的服务")
    parser.add_argument("--no-browser", action="store_true", help="就绪后不自动打开浏览器")
    args = parser.parse_args()
    try:
        if args.stop:
            return stop_services()
        return start_services(check_only=args.check, no_browser=args.no_browser)
    except RuntimeError as exc:
        print(f"[错误] {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
