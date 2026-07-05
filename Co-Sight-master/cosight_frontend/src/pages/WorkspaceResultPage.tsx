import { ArrowRight, Briefcase, ChevronDown, FileClock } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import DocumentDeliverablePanel from '../components/workspace/DocumentDeliverablePanel';
import ScenarioPrimaryOutput from '../components/workspace/ScenarioPrimaryOutput';
import TaskReportPanel from '../components/workspace/TaskReportPanel';
import ToolTracePanel from '../components/workspace/ToolTracePanel';
import { useWorkspaceSession } from '../hooks/useWorkspaceSession';
import { getScenarioOutputProfile } from '../lib/scenarios';
import { clearAuthed, getPendingRequestsRaw } from '../lib/storage';

function WorkspaceResultPage() {
  const navigate = useNavigate();
  const [appendixOpen, setAppendixOpen] = useState(false);
  const [deliverableExpanded, setDeliverableExpanded] = useState(false);
  const deliverableRef = useRef<HTMLDivElement | null>(null);
  const {
    snapshot,
    workspacePath,
    loading,
    liveToolCalls,
    resultInsight,
    resultSummary,
    hasResult,
    isLive,
    isCompleted,
    query,
    scenario,
    documentIntake,
  } = useWorkspaceSession();

  const outputProfile = useMemo(() => getScenarioOutputProfile(scenario), [scenario]);
  const isDocumentPrimary = outputProfile.primary === 'document';

  const statusSummary = useMemo(() => {
    const pending = getPendingRequestsRaw();
    let pendingCount = 0;
    if (pending) {
      try {
        pendingCount = Object.keys(JSON.parse(pending) as Record<string, unknown>).length;
      } catch {
        pendingCount = 0;
      }
    }
    if (isLive && isCompleted) return '本次任务结果已同步';
    if (snapshot) return '已载入任务结果';
    if (pendingCount > 0) return `${pendingCount} 项待处理`;
    return '等待任务完成';
  }, [isLive, isCompleted, snapshot]);

  const handleOpenDeliverable = () => {
    setDeliverableExpanded(true);
    deliverableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  const deliverablePanel = outputProfile.showDeliverable ? (
    <div ref={deliverableRef}>
      <DocumentDeliverablePanel
        scenarioId={scenario}
        snapshot={snapshot}
        resultInsight={resultInsight}
        documentIntake={documentIntake}
        autoGenerate={outputProfile.autoGenerate}
        collapsed={outputProfile.deliverableCollapsed && !deliverableExpanded}
        prominent={isDocumentPrimary}
        forceExpanded={deliverableExpanded}
      />
    </div>
  ) : null;

  return (
    <AppShell
      title="任务结果"
      subtitle="查看结论、建议与导出"
      actions={(
        <>
          <Link className="btn btn-secondary" to="/workspace/run">查看执行过程</Link>
          <Link className="btn btn-secondary" to="/replay">归档与回放</Link>
          <Link className="btn btn-primary" to="/materials">材料库</Link>
        </>
      )}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={Briefcase}
        title={query ? `任务结果 · ${query.slice(0, 32)}${query.length > 32 ? '…' : ''}` : '任务结果'}
        subtitle={`${outputProfile.primaryLabel}为主交付 · 执行报告统一呈现 · 文书按需生成`}
        badge={<span className="ds-badge ds-badge-primary">{statusSummary}</span>}
      />

      {loading && <LoadingState label="载入任务结果…" />}

      {!loading && !hasResult && (
        <EmptyState
          icon={<FileClock size={22} />}
          title="暂无任务结果"
          description="请先在智能工作台发起任务，执行完成后结果会自动出现在这里。"
          action={(
            <Link className="btn btn-primary" to="/workspace" style={{ marginTop: 8 }}>
              发起任务
              <ArrowRight size={16} />
            </Link>
          )}
        />
      )}

      {!loading && hasResult && (
        <div className="workspace-result-layout workspace-result-layout-wide">
          {isCompleted && (
            <div className="workspace-success-banner">
              <strong>任务执行完成</strong>
              <span>
                本场景主交付为「{outputProfile.primaryLabel}」
                {outputProfile.showDeliverable ? '；正式文书可按需展开生成' : '；详见下方任务报告'}。
              </span>
            </div>
          )}

          {isDocumentPrimary && deliverablePanel}

          <TaskReportPanel
            title={query || '任务总结报告'}
            scenarioId={scenario}
            resultSummary={resultSummary || '任务仍在处理中，请稍后再查看完整结论。'}
            resultInsight={resultInsight}
            snapshot={snapshot}
            statusSummary={statusSummary}
          />

          <ScenarioPrimaryOutput
            scenarioId={scenario}
            resultSummary={resultSummary}
            resultInsight={resultInsight}
            snapshot={snapshot}
            onOpenDeliverable={handleOpenDeliverable}
          />

          {!isDocumentPrimary && deliverablePanel}

          {liveToolCalls.length > 0 && (
            <section className="ds-card workspace-appendix-card">
              <button
                type="button"
                className="workspace-appendix-toggle"
                onClick={() => setAppendixOpen((open) => !open)}
              >
                <div>
                  <strong>执行附录</strong>
                  <span>工具调用轨迹 · 最近 {liveToolCalls.length} 条</span>
                </div>
                <ChevronDown size={18} className={appendixOpen ? 'open' : ''} />
              </button>
              {appendixOpen && <ToolTracePanel toolCalls={liveToolCalls} />}
            </section>
          )}

          <section className="ds-card workspace-result-links">
            <strong>相关入口</strong>
            <div className="workspace-result-link-row">
              <Link className="text-button" to="/workspace/run">返回执行过程（DAG）</Link>
              <Link className="text-button" to="/replay">归档与回放</Link>
              <Link className="text-button" to="/materials">查看材料库</Link>
              {workspacePath ? (
                <Link className="text-button" to={`/workspace/run?replay=true&workspace=${encodeURIComponent(workspacePath)}`}>
                  回放本次任务
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

export default WorkspaceResultPage;
