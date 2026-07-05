import { CheckCircle2, Clock3, FileClock, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ExecutionExportActions from '../components/documents/ExecutionExportActions';
import AuditLogPanel from '../components/audit/AuditLogPanel';
import AppShell from '../components/layout/AppShell';
import AgentEvidencePanel from '../components/workspace/AgentEvidencePanel';
import DagGraphPanel from '../components/workspace/DagGraphPanel';
import ToolTracePanel from '../components/workspace/ToolTracePanel';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { fetchAgentRegistry, fetchAuditLog, fetchDemoOverview, fetchExecutionSnapshot, fetchReplayWorkspaces } from '../lib/api';
import { mergeAgentRegistry, defaultAgentRegistry } from '../lib/agent-registry';
import { buildDagGraphFromExecutionSnapshot, executionToolsToToolCalls } from '../lib/plan-graph';
import { derivePlanGraph } from '../lib/event-adapter';
import type { AgentRegistry } from '../types/agent-registry';
import { buildExportPayloadFromSnapshot, buildExecutionSnapshotFromChat } from '../lib/execution-export';
import { clearAuthed, getLastManusStepRaw, getPendingRequestsRaw } from '../lib/storage';
import {
  buildIncomingChatMessage,
  deriveAgentCards,
  deriveResultInsight,
  deriveSteps,
  deriveToolCalls,
} from '../lib/event-adapter';
import type { ChatMessage } from '../types/chat';
import type { DemoOverview } from '../types/demo';
import type { AuditLog } from '../types/audit';
import type { ReplayWorkspace } from '../types/replay';

const archiveSignals = ['过程沉淀', '可继续处理', '评审可回放'];

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '最近';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractLocalStepTitle(raw: string | null): string {
  if (!raw) return '暂无最近处理记录';
  try {
    const parsed = JSON.parse(raw) as { message?: { data?: { initData?: { title?: string } } } };
    const title = parsed.message?.data?.initData?.title;
    return typeof title === 'string' && title.trim() ? title : '已发现最近处理记录';
  } catch {
    return '已发现最近处理记录';
  }
}

function extractPendingContent(message: unknown): string {
  if (!message || typeof message !== 'object') return '待恢复事项';
  const initData = (message as { initData?: unknown }).initData;
  if (Array.isArray(initData) && initData.length > 0) {
    const first = initData[0] as { value?: unknown };
    if (typeof first?.value === 'string' && first.value.trim()) return first.value;
  }
  return '待恢复事项';
}

function buildReplayMessages(rawLastStep: string | null, rawPending: string | null): ChatMessage[] {
  const messages: ChatMessage[] = [];

  if (rawPending) {
    try {
      const pendingMap = JSON.parse(rawPending) as Record<string, { message?: unknown; savedAt?: number }>;
      Object.entries(pendingMap).forEach(([topic, record], index) => {
        messages.push({
          id: `replay-pending-${topic}`,
          role: 'human',
          content: extractPendingContent(record.message),
          topic,
          timestamp: typeof record.savedAt === 'number' ? record.savedAt : Date.now() - (index + 1) * 1000,
        });
      });
    } catch {
      // Ignore malformed local cache.
    }
  }

  if (rawLastStep) {
    try {
      const parsed = JSON.parse(rawLastStep) as { message?: unknown; savedAt?: number };
      const stepMessage = buildIncomingChatMessage(parsed.message, 'local-replay');
      messages.push({
        ...stepMessage,
        id: 'replay-last-step',
        timestamp: typeof parsed.savedAt === 'number' ? parsed.savedAt : stepMessage.timestamp,
      });
    } catch {
      // Ignore malformed local cache.
    }
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

function buildReplayStatusSummary(hasSnapshot: boolean, pendingCount: number): string {
  if (hasSnapshot && pendingCount > 0) return `已载入最近快照，另有 ${pendingCount} 项待处理`;
  if (hasSnapshot) return '已载入最近快照';
  if (pendingCount > 0) return `${pendingCount} 项待处理`;
  return '暂无最近快照';
}


function ReplayPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReplayWorkspace[]>([]);
  const [overview, setOverview] = useState<DemoOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [remoteSnapshot, setRemoteSnapshot] = useState<ReturnType<typeof buildExecutionSnapshotFromChat> | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null);
  const [agentRegistry, setAgentRegistry] = useState<AgentRegistry>(() => defaultAgentRegistry);

  useEffect(() => {
    let cancelled = false;
    async function loadReplayList() {
      try {
        const data = await fetchReplayWorkspaces();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadReplayList();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadOverview() {
      try {
        const data = await fetchDemoOverview();
        if (!cancelled) setOverview(data);
      } catch {
        if (!cancelled) setOverview(null);
      }
    }
    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRegistry() {
      const data = await fetchAgentRegistry().catch(() => null);
      if (!cancelled) setAgentRegistry(mergeAgentRegistry(data));
    }
    void loadRegistry();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSnapshot() {
      if (items.length === 0) return;
      const workspacePath = items[0].workspace_path;
      const [data, audit] = await Promise.all([
        fetchExecutionSnapshot(workspacePath).catch(() => null),
        fetchAuditLog(workspacePath).catch(() => null),
      ]);
      if (!cancelled) {
        setRemoteSnapshot(data ? { ...data, source: 'replay' } : null);
        setAuditLog(audit);
      }
    }
    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const localReplaySummary = useMemo(() => {
    const rawLastStep = getLastManusStepRaw();
    const rawPending = getPendingRequestsRaw();
    let pendingCount = 0;
    if (rawPending) {
      try {
        pendingCount = Object.keys(JSON.parse(rawPending) as Record<string, unknown>).length;
      } catch {
        pendingCount = 0;
      }
    }
    const replayMessages = buildReplayMessages(rawLastStep, rawPending);
    const steps = deriveSteps(replayMessages);
    const toolCalls = deriveToolCalls(replayMessages);
    const resultInsight = deriveResultInsight(replayMessages);
    const agents = deriveAgentCards(steps, toolCalls);
    return {
      title: extractLocalStepTitle(rawLastStep),
      pendingCount,
      hasSnapshot: Boolean(rawLastStep),
      steps,
      toolCalls,
      resultInsight,
      resultSummary: resultInsight.conclusion,
      agents,
      statusSummary: buildReplayStatusSummary(Boolean(rawLastStep), pendingCount),
    };
  }, []);

  const replayGraph = useMemo(() => {
    if (remoteSnapshot) {
      return buildDagGraphFromExecutionSnapshot(remoteSnapshot, agentRegistry);
    }
    const replayMessages = buildReplayMessages(getLastManusStepRaw(), getPendingRequestsRaw());
    return derivePlanGraph(replayMessages, agentRegistry);
  }, [remoteSnapshot, agentRegistry]);

  const replayToolCalls = useMemo(() => {
    if (remoteSnapshot?.tools?.length) {
      return executionToolsToToolCalls(remoteSnapshot.tools);
    }
    return localReplaySummary.toolCalls;
  }, [remoteSnapshot, localReplaySummary.toolCalls]);

  const replaySteps = useMemo(() => {
    if (remoteSnapshot?.steps?.length) {
      return remoteSnapshot.steps.map((step) => ({
        key: `${step.index}-${step.title}`,
        index: step.index,
        title: step.title,
        status: step.status,
        statusLabel: step.statusLabel,
      }));
    }
    return localReplaySummary.steps.map((step, index) => ({
      key: `${index}-${step.title}`,
      index,
      title: step.title,
      status: step.status,
      statusLabel: step.status === 'completed' ? '已完成' : step.status === 'running' ? '执行中' : '待执行',
    }));
  }, [remoteSnapshot, localReplaySummary.steps]);

  const exportPayload = useMemo(() => {
    const localSnapshot = localReplaySummary.steps.length > 0 || localReplaySummary.toolCalls.length > 0
      ? buildExecutionSnapshotFromChat({
        messages: buildReplayMessages(getLastManusStepRaw(), getPendingRequestsRaw()),
        steps: localReplaySummary.steps,
        toolCalls: localReplaySummary.toolCalls,
        resultInsight: localReplaySummary.resultInsight,
      })
      : null;
    const snapshot = remoteSnapshot ?? localSnapshot;
    if (!snapshot) return null;
    return buildExportPayloadFromSnapshot(snapshot, 'task_summary_report', 'docx', localReplaySummary.resultInsight);
  }, [localReplaySummary, remoteSnapshot]);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="归档与回放"
      subtitle="任务历史、过程快照与继续处理入口"
      badge={(
        <span className="ds-badge ds-badge-primary">
          <Sparkles size={12} />
          {localReplaySummary.statusSummary}
        </span>
      )}
      actions={<Link className="btn btn-primary" to="/workspace">发起新任务</Link>}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={FileClock}
        title="归档与回放中心"
        subtitle="沉淀每次 Co-Sight 执行过程，并支持将 replay 真实记录导出为 DOCX/PDF。"
        action={(
          <ExecutionExportActions
            payload={exportPayload}
            className="documents-export-actions"
          />
        )}
      />

      <div className="landing-hero-chips">
        {archiveSignals.map((signal) => (
          <span key={signal} className="ds-chip">{signal}</span>
        ))}
      </div>

      <div className="replay-summary-grid">
        <StatCard label="历史记录" value={overview ? `${overview.stats.replay_count}` : '--'} description="已归档处理记录" />
        <StatCard label="待处理内容" value={`${localReplaySummary.pendingCount}`} description="可恢复推进的本地事项" />
        <StatCard label="可信等级" value={localReplaySummary.resultInsight.credibility.label} description="基于最近结果快照" />
        <StatCard label="复核等级" value={localReplaySummary.resultInsight.credibility.reviewLabel} description="反映人工复核建议强度" />
      </div>

      <section className="ds-card workspace-panel replay-snapshot-card">
        <div className="replay-section-head">
          <div>
            <p className="eyebrow">最近快照</p>
            <h2>{localReplaySummary.title}</h2>
          </div>
          {localReplaySummary.hasSnapshot && (
            <span className="ds-badge ds-badge-success">
              <CheckCircle2 size={12} />
              已恢复
            </span>
          )}
        </div>
        <p className="replay-snapshot-conclusion">
          {localReplaySummary.resultSummary || '提交任务后，这里会展示最近阶段结论。'}
        </p>
      </section>

      <DagGraphPanel
        graph={replayGraph}
        toolCalls={replayToolCalls}
        registry={agentRegistry}
        readOnly
      />

      <div className="workbench-grid workbench-grid-processing replay-workbench-grid">
        <div className="workbench-column">
          <section className="ds-card replay-timeline-card">
            <div className="replay-section-head">
              <div>
                <p className="eyebrow">执行轨迹</p>
                <h2>阶段回放</h2>
              </div>
            </div>
            <div className="replay-step-timeline">
              {replaySteps.map((step) => (
                <article key={step.key} className={`replay-step-chip ${step.status}`}>
                  <span className="replay-step-index">{step.index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <em>{step.statusLabel}</em>
                  </div>
                </article>
              ))}
              {replaySteps.length === 0 && (
                <p className="replay-timeline-empty">完成一次任务后，可在此按阶段回放执行过程。</p>
              )}
            </div>
          </section>
        </div>
        <div className="workbench-column">
          <ToolTracePanel toolCalls={replayToolCalls} />
        </div>
      </div>

      {(localReplaySummary.steps.length > 0 || localReplaySummary.toolCalls.length > 0) && (
        <section className="workspace-evidence-grid replay-evidence-compact">
          <AgentEvidencePanel
            agents={localReplaySummary.agents}
            steps={localReplaySummary.steps}
            toolCalls={localReplaySummary.toolCalls}
          />
        </section>
      )}

      {auditLog ? (
        <section className="landing-section">
          <AuditLogPanel auditLog={auditLog} />
        </section>
      ) : null}

      <section className="ds-card workspace-panel">
        <div className="replay-section-head">
          <div>
            <p className="eyebrow">历史归档</p>
            <h2>继续查看或恢复</h2>
          </div>
        </div>

        <div className="replay-list-react">
          {loading && <LoadingState label="读取历史记录中..." compact />}

          {!loading && items.length === 0 && (
            <EmptyState
              icon={<FileClock size={22} />}
              title="暂无历史记录"
              description="完成一次任务处理后，这里会保存对应记录，方便后续查看、演示和继续推进。"
              action={(
                <Link className="btn btn-primary" to="/workspace" style={{ marginTop: 8 }}>
                  发起第一项任务
                </Link>
              )}
            />
          )}

          {!loading && items.map((item) => (
            <article key={item.workspace_path} className="replay-item-react replay-item-enhanced">
              <div className="replay-item-icon">
                <FileClock size={18} />
              </div>
              <div className="replay-item-copy">
                <strong>{item.title}</strong>
                <span>{item.workspace_name} · {item.message_count} 条事件 · DAG 可回放</span>
              </div>
              <div className="replay-item-side">
                <div className="replay-item-time">
                  <Clock3 size={14} />
                  {formatTime(item.created_time)}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(`/workspace/run?replay=true&workspace=${encodeURIComponent(item.workspace_path)}`)}
                >
                  播放回放
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default ReplayPage;
