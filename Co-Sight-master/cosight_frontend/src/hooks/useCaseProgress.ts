import { useEffect, useMemo, useState } from 'react';
import { fetchExecutionSnapshot, fetchMaterialLibrary, fetchReplayWorkspaces } from '../lib/api';
import { loadWorkspaceSession } from '../lib/storage';
import type { ExecutionSnapshot } from '../types/execution';
import type { MaterialItem } from '../types/material';

export type CaseProgressSource = 'live' | 'replay' | 'empty';

export function useCaseProgress() {
  const [snapshot, setSnapshot] = useState<ExecutionSnapshot | null>(null);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<CaseProgressSource>('empty');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const session = loadWorkspaceSession();
        let snap: ExecutionSnapshot | null = null;
        let wp: string | null = null;
        let resolvedSource: CaseProgressSource = 'empty';

        if (session?.workspacePath) {
          snap = await fetchExecutionSnapshot(session.workspacePath);
          if (snap) {
            wp = session.workspacePath;
            resolvedSource = 'live';
          }
        }

        if (!snap) {
          const workspaces = await fetchReplayWorkspaces().catch(() => []);
          const latest = workspaces[0];
          if (latest) {
            snap = await fetchExecutionSnapshot(latest.workspace_path);
            if (snap) {
              wp = latest.workspace_path;
              resolvedSource = 'replay';
            }
          }
        }

        const library = await fetchMaterialLibrary().catch(() => null);

        if (!cancelled) {
          setSnapshot(snap);
          setWorkspacePath(wp);
          setSource(resolvedSource);
          setMaterials((library?.items ?? []).filter((item) => item.kind === 'upload').slice(0, 6));
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

  const progress = useMemo(() => {
    if (!snapshot?.steps.length) {
      return { currentIndex: 0, total: 5, label: '场景识别', completedCount: 0 };
    }

    const steps = snapshot.steps;
    const completedCount = steps.filter((step) =>
      step.status === 'completed' || step.statusLabel.includes('完成'),
    ).length;
    const activeIndex = steps.findIndex((step) =>
      step.status === 'in_progress' || step.statusLabel.includes('进行'),
    );
    const currentIndex = activeIndex >= 0 ? activeIndex : Math.min(completedCount, steps.length - 1);

    return {
      currentIndex,
      total: steps.length,
      label: steps[currentIndex]?.title ?? '处理中',
      completedCount,
    };
  }, [snapshot]);

  return { snapshot, workspacePath, materials, loading, source, progress };
}
