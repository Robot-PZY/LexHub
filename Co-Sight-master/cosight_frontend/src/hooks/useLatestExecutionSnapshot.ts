import { useEffect, useState } from 'react';
import { fetchExecutionSnapshot, fetchReplayWorkspaces } from '../lib/api';
import type { ExecutionSnapshot } from '../types/execution';

export function useLatestExecutionSnapshot() {
  const [snapshot, setSnapshot] = useState<ExecutionSnapshot | null>(null);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const workspaces = await fetchReplayWorkspaces().catch(() => []);
        const latest = workspaces[0];
        if (!latest) {
          if (!cancelled) {
            setSnapshot(null);
            setWorkspacePath(null);
          }
          return;
        }
        const data = await fetchExecutionSnapshot(latest.workspace_path);
        if (!cancelled) {
          setWorkspacePath(latest.workspace_path);
          setSnapshot(data ? { ...data, source: 'replay' } : null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { snapshot, workspacePath, loading };
}
