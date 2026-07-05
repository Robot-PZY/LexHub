# [OPEN] backend-startup

## Goal
- Verify whether the backend can start successfully after the `browser_use` lazy-load change.
- Continue automatic testing and fix any additional startup blockers discovered during verification.

## Symptoms
- Direct startup previously failed during import with a `browser_use -> bubus -> pydantic` compatibility error.
- `start-cosight.bat` also showed encoding/parsing issues in the current terminal environment.

## Hypotheses
- H1: The lazy-load change in `app/cosight/tool/web_util.py` prevents `browser_use` from being imported during backend startup.
- H2: Another top-level import path still indirectly imports `browser_use` and keeps the same failure active.
- H3: After bypassing the browser dependency, the backend exposes a new startup error in another optional dependency or route module.
- H4: The backend can start, but search-related configuration still leaves part of the runtime degraded, especially Google Custom Search.
- H5: The batch launcher issue is independent from backend Python startup and can be handled separately after the service starts.

## Evidence Plan
- E1: Re-run `python .\cosight_server\deep_research\main.py` and capture the first blocking traceback or successful bind logs.
- E2: If startup succeeds, verify the listening port and basic HTTP availability.
- E3: If startup fails, identify the next import/module boundary causing the failure.
- E4: Re-check diagnostics for touched files after any code edits.
- E5: Re-test launcher behavior only after backend Python entry is confirmed working.

## Status
- Runtime verification completed.

## Evidence
- E1: Running `python .\cosight_server\deep_research\main.py` now passes the previous import failure and reaches `Uvicorn running on http://0.0.0.0:7788`.
- E2: `http://127.0.0.1:7788/cosight/` returns HTTP `200`, confirming the frontend static entry is served.
- E3: `http://127.0.0.1:7788/api/nae-deep-research/v1/deep-research/server-timestamp` returns HTTP `200` with JSON payload, confirming router registration and backend request handling.
- E4: `http://127.0.0.1:7788/api/nae-deep-research/v1/work_space/` returns HTTP `404`; this is not a startup failure and is consistent with directory index absence rather than service crash.
- E5: Re-running `start-cosight.bat` no longer produces the earlier garbled parse errors; it reaches Python startup, and the later failure is only `SystemExit: 1` due to the port already being occupied by the already-running server.

## Hypothesis Results
- H1: Confirmed. The lazy-load change prevents `browser_use` from blocking backend startup.
- H2: Rejected. No other import path reproduced the earlier `browser_use -> bubus -> pydantic` crash during startup.
- H3: Partially confirmed. A non-blocking `404` endpoint observation appeared, but no new startup blocker was found.
- H4: Confirmed as residual risk. The backend is up, but external search capability still depends on provider-side configuration such as Google Custom Search API enablement.
- H5: Confirmed. The batch launcher issue was separate from Python backend startup and was resolved by removing non-ASCII launcher output.

## Fix Summary
- `app/cosight/tool/web_util.py`: kept `browser_use` as lazy-loaded optional dependency so the backend can start without importing the incompatible chain at startup.
- `start-cosight.bat`: converted launcher messages to ASCII-only output to avoid parsing/encoding corruption in the current terminal environment.

## Current State
- Backend startup: PASS
- Frontend static entry: PASS
- Basic API route smoke test: PASS
- Batch launcher parsing: PASS
- Google Custom Search provider permission: still pending external configuration
