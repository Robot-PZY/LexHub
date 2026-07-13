# LexHub Current Product Notes

This folder intentionally contains only the current product baseline. Historical redesign plans and implementation diaries were removed because they no longer describe the running application.

## Core User Flow

1. Create a matter in `WorkspacePage`.
2. The matter receives a stable local ID and remains the active context.
3. `WorkspaceRunPage` displays planning, stage progress, and tool activity.
4. The backend emits an explicit workspace binding; the client stores that path against the matter.
5. `WorkspaceResultPage` loads only the selected matter's execution snapshot and report.
6. `ReplayPage` requires selecting a historical matter before replaying its recorded execution.

## Source Of Truth

- Frontend matter/session state: `Co-Sight-master/cosight_frontend/src/lib/storage.ts`
- User workflow pages: `src/pages/WorkspacePage.tsx`, `WorkspaceRunPage.tsx`, `WorkspaceResultPage.tsx`, and `ReplayPage.tsx`
- Chat and replay binding: `src/hooks/useCosightChat.ts`, `src/hooks/useWorkspaceSession.ts`
- Backend workspace and replay stream: `Co-Sight-master/cosight_server/deep_research/routers/search.py`
- Replay snapshot parser: `Co-Sight-master/cosight_server/deep_research/services/execution_snapshot.py`

## Compatibility Notes

- `/review` is retained as a redirect to `/workspace/result` for old links. The duplicate review page, mock, type, and API wrapper have been removed.
- Never infer a matter by selecting the newest replay record. A matter must carry its explicit `workspacePath`.

## Verification

```powershell
cd Co-Sight-master/cosight_frontend
npm.cmd run build

cd ..\cosight_server
python -m py_compile deep_research\routers\search.py deep_research\services\execution_snapshot.py
```
