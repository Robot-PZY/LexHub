import { Archive, ArrowRight, Briefcase, CheckCircle2, ChevronDown, ClipboardList, FileClock, FileText, FolderOpen, Scale, ShieldCheck } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { Badge } from '../components/ui';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import DocumentDeliverablePanel from '../components/workspace/DocumentDeliverablePanel';
import ScenarioPrimaryOutput from '../components/workspace/ScenarioPrimaryOutput';
import TaskReportPanel from '../components/workspace/TaskReportPanel';
import ToolTracePanel from '../components/workspace/ToolTracePanel';
import { useWorkspaceSession } from '../hooks/useWorkspaceSession';
import { getScenarioOutputProfile } from '../lib/scenarios';
import { getReviewGate } from '../lib/review-gate';
import { clearAuthed, getPendingRequestsRaw } from '../lib/storage';
import type { ResultInsight } from '../types/chat';
import type { ExecutionSnapshot } from '../types/execution';

function ResultOverview({
  primaryLabel,
  resultInsight,
  snapshot,
  statusSummary,
  reviewReady,
}: {
  primaryLabel: string;
  resultInsight: ResultInsight;
  snapshot: ExecutionSnapshot | null;
  statusSummary: string;
  reviewReady: boolean;
}) {
  const completedSteps = snapshot?.stats.completedSteps
    ?? snapshot?.steps.filter((step) => step.status === 'completed').length
    ?? 0;
  const totalSteps = snapshot?.stats.stepCount ?? snapshot?.steps.length ?? 0;
  const evidenceCount = resultInsight.evidenceReferences.length;

  return (
    <section className="workspace-result-overview" aria-label="审查结论总览">
      <div className="workspace-result-overview-head">
        <div>
          <p className="eyebrow">REVIEW SUMMARY</p>
          <h2>结论、依据与交付状态已归集。</h2>
          <span>{statusSummary} · 主交付为「{primaryLabel}」</span>
        </div>
        <Badge tone={reviewReady ? 'success' : 'warning'} pill icon={<CheckCircle2 size={13} />}>
          {reviewReady ? '自动校验通过' : '自动校验中'}
        </Badge>
      </div>

      <div className="workspace-result-overview-grid">
        <article>
          <FileText size={18} />
          <span>主交付</span>
          <strong>{primaryLabel}</strong>
          <em>报告与文书按场景呈现</em>
        </article>
        <article>
          <ShieldCheck size={18} />
          <span>可信度</span>
          <strong>{resultInsight.credibility.score}</strong>
          <em>{resultInsight.credibility.reviewLabel}</em>
        </article>
        <article>
          <Scale size={18} />
          <span>引用依据</span>
          <strong>{evidenceCount}</strong>
          <em>条可追溯来源</em>
        </article>
        <article>
          <ClipboardList size={18} />
          <span>办理记录</span>
          <strong>{completedSteps}/{totalSteps || '—'}</strong>
          <em>阶段已沉淀</em>
        </article>
      </div>
    </section>
  );
}

function WorkspaceResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  } = useWorkspaceSession(searchParams.get('matter'));

  const outputProfile = useMemo(() => getScenarioOutputProfile(scenario), [scenario]);
  const isDocumentPrimary = outputProfile.primary === 'document';
  const reviewGate = useMemo(() => getReviewGate(snapshot), [snapshot]);

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
    if (isLive && isCompleted) return '本次结论已同步';
    if (snapshot) return '已载入审查结论';
    if (pendingCount > 0) return `${pendingCount} 项待处理`;
    return '等待办理完成';
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
        reviewReady={reviewGate.ready}
        reviewMessage={reviewGate.message}
      />
    </div>
  ) : null;

  return (
    <AppShell
      title="结论与交付"
      subtitle="查看本次事项的总结报告、风险提示、依据来源与正式交付物"
      actions={(
        <>
          <Link className="lex-button lex-button-secondary lex-button-md" to="/workspace/run">
            <ClipboardList size={16} />
            返回办理运行
          </Link>
          <Link className="lex-button lex-button-secondary lex-button-md" to="/replay">
            <Archive size={16} />
            历史回放
          </Link>
          <Link className="lex-button lex-button-primary lex-button-md" to="/materials">
            <FolderOpen size={16} />
            材料库
          </Link>
        </>
      )}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={Briefcase}
        title={query ? `总结报告 · ${query.slice(0, 32)}${query.length > 32 ? '…' : ''}` : '总结报告'}
        subtitle={`${outputProfile.primaryLabel}为主交付 · 报告统一呈现 · 文书按需生成`}
        badge={<Badge tone="primary" pill>{statusSummary}</Badge>}
      />

      {loading && <LoadingState label="载入审查结论…" />}

      {!loading && !hasResult && (
        <EmptyState
          icon={<FileClock size={22} />}
          title="暂无审查结论"
          description="请先在事项受理页提交材料与诉求，办理完成后结论会自动出现在这里。"
          action={(
            <Link className="lex-button lex-button-primary lex-button-md" to="/workspace" style={{ marginTop: 8 }}>
              发起事项
              <ArrowRight size={16} />
            </Link>
          )}
        />
      )}

      {!loading && hasResult && (
        <div className="workspace-result-layout workspace-result-layout-wide">
          {isCompleted && (
            <div className="workspace-success-banner workspace-result-complete-banner">
              <div className="workspace-result-complete-icon">
                <Briefcase size={18} />
              </div>
              <div>
                <strong>事项办理完成</strong>
                <span>
                  本场景主交付为「{outputProfile.primaryLabel}」
                  {outputProfile.showDeliverable ? '；正式文书可按需展开生成' : '；详见下方审查报告'}。
                </span>
              </div>
            </div>
          )}

          <ResultOverview
            primaryLabel={outputProfile.primaryLabel}
            resultInsight={resultInsight}
            snapshot={snapshot}
            statusSummary={statusSummary}
            reviewReady={reviewGate.ready}
          />

          {isDocumentPrimary && deliverablePanel}

          <TaskReportPanel
            title={query || '审查结论报告'}
            scenarioId={scenario}
            resultSummary={resultSummary || '事项仍在办理中，请稍后再查看完整结论。'}
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
                  <strong>办理附录</strong>
                  <span>处理动作记录 · 最近 {liveToolCalls.length} 条</span>
                </div>
                <ChevronDown size={18} className={appendixOpen ? 'open' : ''} />
              </button>
              {appendixOpen && <ToolTracePanel toolCalls={liveToolCalls} />}
            </section>
          )}

          <section className="ds-card workspace-result-links">
            <div>
              <strong>相关入口</strong>
              <p>继续追踪办理过程、归档记录或补充材料。</p>
            </div>
            <div className="workspace-result-link-row">
              <Link className="text-button" to="/workspace/run">返回办理进度</Link>
              <Link className="text-button" to="/replay">历史回放</Link>
              <Link className="text-button" to="/materials">查看材料库</Link>
              {workspacePath ? (
                <Link className="text-button" to={`/workspace/run?replay=true&workspace=${encodeURIComponent(workspacePath)}`}>
                  查看本次办理记录
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
