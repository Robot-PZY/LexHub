import { useEffect, useMemo, useState } from 'react';
import { fetchExecutionSnapshot, fetchReplayWorkspaces } from '../lib/api';
import {
  deriveResultInsight,
  deriveSteps,
  deriveToolCalls,
} from '../lib/event-adapter';
import { buildExecutionSnapshotFromChat } from '../lib/execution-export';
import { loadWorkspaceSession, saveWorkspaceSession } from '../lib/storage';
import type { ChatMessage, ResultInsight } from '../types/chat';
import type { ExecutionSnapshot } from '../types/execution';

export function useWorkspaceSession() {
  const [liveSession] = useState(() => loadWorkspaceSession());
  const [replaySnapshot, setReplaySnapshot] = useState<ExecutionSnapshot | null>(null);
  const [workspacePath, setWorkspacePath] = useState<string | null>(liveSession?.workspacePath ?? null);
  const [loading, setLoading] = useState(true);

  const liveMessages: ChatMessage[] = useMemo(() => liveSession?.messages ?? [], [liveSession]);
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
        if (liveSession?.workspacePath) {
          const data = await fetchExecutionSnapshot(liveSession.workspacePath);
          if (!cancelled && data) {
            setReplaySnapshot({ ...data, source: 'replay' });
            setWorkspacePath(liveSession.workspacePath);
          }
          return;
        }

        const workspaces = await fetchReplayWorkspaces().catch(() => []);
        const latest = workspaces[0];
        if (!latest) return;

        const data = await fetchExecutionSnapshot(latest.workspace_path);
        if (cancelled) return;

        setWorkspacePath((current) => current ?? latest.workspace_path);
        if (!liveSnapshot) {
          setReplaySnapshot(data ? { ...data, source: 'replay' } : null);
        }

        if (liveSession && !liveSession.workspacePath) {
          saveWorkspaceSession({ ...liveSession, workspacePath: latest.workspace_path });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReplay();
    return () => {
      cancelled = true;
    };
  }, [liveSession, liveSnapshot]);

  const snapshot = liveSnapshot ?? replaySnapshot;
  const resultInsight = liveMessages.length > 0 ? liveInsight : deriveResultInsight([]);
  const resultSummary = snapshot?.result || liveInsight.conclusion || replaySnapshot?.result || '';
  const hasResult = Boolean(resultSummary || snapshot || liveMessages.length > 0);
  const isLive = liveMessages.length > 0;
  const isCompleted = Boolean(liveSession?.completedAt || liveInsight.conclusion.includes('已完成') || snapshot?.result);

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
    query: liveSession?.query ?? snapshot?.taskQuery ?? '',
    scenario: liveSession?.scenario,
    documentIntake: liveSession?.documentIntake,
  };
}
