import { useEffect, useMemo, useState } from 'react';
import { fetchExecutionSnapshot } from '../lib/api';
import {
  deriveResultInsight,
  deriveSteps,
  deriveToolCalls,
} from '../lib/event-adapter';
import { buildExecutionSnapshotFromChat } from '../lib/execution-export';
import { getMatter, loadWorkspaceSession } from '../lib/storage';
import type { ChatMessage, ResultInsight } from '../types/chat';
import type { ExecutionSnapshot } from '../types/execution';

export function useWorkspaceSession(matterId?: string | null) {
  const [liveSession] = useState(() => loadWorkspaceSession());
  const [matter] = useState(() => getMatter(matterId));
  const [replaySnapshot, setReplaySnapshot] = useState<ExecutionSnapshot | null>(null);
  const [workspacePath, setWorkspacePath] = useState<string | null>(
    matter?.workspacePath ?? (!matterId ? liveSession?.workspacePath ?? null : null),
  );
  const [loading, setLoading] = useState(true);

  // A URL-selected matter must never borrow the browser's last live session.
  // Otherwise a historical matter can render/export another matter's content.
  const liveSessionMatchesMatter = !matterId || liveSession?.matterId === matterId;
  const effectiveLiveSession = liveSessionMatchesMatter ? liveSession : null;
  const liveMessages: ChatMessage[] = useMemo(() => effectiveLiveSession?.messages ?? [], [effectiveLiveSession]);
  const liveSteps = useMemo(() => deriveSteps(liveMessages), [liveMessages]);
  const liveToolCalls = useMemo(() => deriveToolCalls(liveMessages), [liveMessages]);
  const liveInsight: ResultInsight = useMemo(() => deriveResultInsight(liveMessages), [liveMessages]);

  const liveSnapshot: ExecutionSnapshot | null = useMemo(() => {
    if (liveMessages.length === 0) return null;
    return buildExecutionSnapshotFromChat({
      messages: liveMessages,
      steps: liveSteps,
      toolCalls: liveToolCalls,
      resultInsight: liveInsight,
      workspacePath: workspacePath ?? undefined,
    });
  }, [liveMessages, liveSteps, liveToolCalls, liveInsight, workspacePath]);

  useEffect(() => {
    let cancelled = false;

    async function loadReplay() {
      try {
        const explicitWorkspace = matter?.workspacePath ?? effectiveLiveSession?.workspacePath;
        if (explicitWorkspace) {
          const data = await fetchExecutionSnapshot(explicitWorkspace);
          if (!cancelled && data) {
            setReplaySnapshot({ ...data, source: 'replay' });
            setWorkspacePath(explicitWorkspace);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReplay();
    return () => {
      cancelled = true;
    };
  }, [effectiveLiveSession, matter]);

  const snapshot = liveSnapshot ?? replaySnapshot;
  const resultInsight = liveMessages.length > 0 ? liveInsight : deriveResultInsight([]);
  const resultSummary = snapshot?.result || liveInsight.conclusion || replaySnapshot?.result || '';
  const hasResult = Boolean(resultSummary || snapshot || liveMessages.length > 0);
  const isLive = liveMessages.length > 0;
  const isCompleted = Boolean(effectiveLiveSession?.completedAt || liveInsight.conclusion.includes('已完成') || snapshot?.result);

  return {
    snapshot,
    workspacePath,
    loading,
    liveMessages,
    liveSteps,
    liveToolCalls,
    resultInsight,
    resultSummary,
    hasResult,
    isLive,
    isCompleted,
    query: matter?.query ?? effectiveLiveSession?.query ?? snapshot?.taskQuery ?? '',
    scenario: matter?.scenario ?? effectiveLiveSession?.scenario,
    documentIntake: matter?.documentIntake ?? effectiveLiveSession?.documentIntake,
    matter,
  };
}
