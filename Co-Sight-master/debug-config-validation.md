# [OPEN] Debug Session: config-validation

## Goal
- Validate whether the current `Co-Sight-master` environment configuration works end-to-end.
- Verify model connectivity, search connectivity, and basic service startup behavior.

## Scope
- Runtime validation only
- No business logic modifications in initial phase

## Initial Hypotheses
- H1: The service still fails before startup because Python dependency versions are incompatible with the current environment.
- H2: The default text model configuration is now valid, but startup still fails due to unrelated import/runtime errors.
- H3: Search configuration is partially valid, but one of `Tavily` or `Google Custom Search` still fails at runtime because of request/auth/config mismatch.
- H4: The frontend can load statically, but backend API or WebSocket endpoints still fail because the server process never binds successfully.
- H5: Vision/OCR configuration is syntactically present, but no runtime path currently exercises it during startup validation.

## Plan
1. Capture current runtime behavior through startup commands.
2. Record concrete errors from terminal/runtime evidence.
3. Validate config loading paths and affected subsystems.
4. Decide whether instrumentation is needed based on observed failure point.

## Evidence
- E1: `start-cosight.bat` exits before real startup in current terminal environment; the script output is garbled and command parsing breaks before Python launch.
- E2: Direct startup via `python .\cosight_server\deep_research\main.py` successfully loads `.env` and logs valid values for `API_KEY`, `TAVILY_API_KEY`, `GOOGLE_API_KEY`, `SEARCH_ENGINE_ID`, and `VISION_*`.
- E3: Direct backend startup still crashes before server bind with:
  - `NotImplementedError: Pydantic does not support mixing more than one of TypeVar bounds, constraints and defaults`
  - failure path: `browser_use -> bubus -> pydantic`
- E4: Direct Tavily API probe returns `HTTP 200`, confirming the Tavily key is usable.
- E5: Direct Google Custom Search probe returns `HTTP 403 PERMISSION_DENIED` with message:
  - `This project does not have the access to Custom Search JSON API.`

## Hypothesis Status
- H1: Confirmed. There is a dependency/runtime incompatibility in the current Python environment, specifically on the `browser-use / bubus / pydantic` path.
- H2: Partially confirmed. The default model config is valid and is read correctly, but startup still fails due to unrelated dependency issues.
- H3: Partially confirmed. `Tavily` works; `Google Custom Search` is configured syntactically but not enabled for the current Google Cloud project.
- H4: Confirmed. Frontend static preview can exist, but backend/WebSocket cannot become available because the server process crashes before bind.
- H5: Not yet exercised beyond config load. Vision model config is recognized but was not invoked during startup validation.

## Status
- Runtime evidence collected. Next step is to decide whether to fix startup blockers or continue validating individual external providers.
