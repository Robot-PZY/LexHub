import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import PageHeader from '../components/ui/PageHeader';
import DagGraphPanel from '../components/workspace/DagGraphPanel';
import ToolCallToast from '../components/workspace/ToolCallToast';
import { COSIGHT_TAGLINE } from '../lib/cosight-narrative';
import { useCosightChat } from '../hooks/useCosightChat';
import { fetchAgentRegistry } from '../lib/api';
import { mergeAgentRegistry } from '../lib/agent-registry';
import { derivePlanGraph } from '../lib/event-adapter';
import {
  clearAuthed,
  consumePendingWorkspaceTask,
  getLastManusStepRaw,
  getPendingRequestsRaw,
  storePendingWorkspaceTask,
} from '../lib/storage';
import type { AgentRegistry } from '../types/agent-registry';

function WorkspaceRunPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskStartedRef = useRef(false);
  const [agentRegistry, setAgentRegistry] = useState<AgentRegistry>(() => mergeAgentRegistry(null));

  const {
    send,
    sendReplay,
    messages,
    steps,
    toolCalls,
    status: chatStatus,
    isCompleted,
  } = useCosightChat();

  const replayWorkspace = searchParams.get('workspace') ?? undefined;
  const isReplay = searchParams.get('replay') === 'true';
  const planGraph = useMemo(() => derivePlanGraph(messages, agentRegistry), [messages, agentRegistry]);

  useEffect(() => {
    let cancelled = false;
    fetchAgentRegistry()
      .then((data) => {
        if (!cancelled) setAgentRegistry(mergeAgentRegistry(data));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (chatStatus !== 'connected') return;
    if (taskStartedRef.current) return;

    if (isReplay && replayWorkspace) {
      taskStartedRef.current = true;
      sendReplay(replayWorkspace);
      return;
    }

    const pending = consumePendingWorkspaceTask();
    if (pending) {
      taskStartedRef.current = true;
      const ok = send(
        pending.content,
        pending.uploadIds ?? [],
        pending.scenario,
        pending.taskId
          ? {
            taskId: pending.taskId,
            taskTitle: pending.taskTitle ?? pending.content.slice(0, 48),
            uploadIds: pending.uploadIds ?? [],
            scenario: pending.scenario,
            documentIntake: pending.documentIntake,
          }
          : undefined,
      );
      if (!ok) {
        storePendingWorkspaceTask(pending);
        taskStartedRef.current = false;
      }
      return;
    }

    if (messages.length === 0 && !getLastManusStepRaw()) {
      navigate('/workspace', { replace: true });
    }
  }, [chatStatus, isReplay, replayWorkspace, send, sendReplay, navigate, messages.length]);

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

    if (isReplay && replayWorkspace) return '正在载入回放';
    if (isCompleted) return '执行完成';
    if (chatStatus === 'sending') return '任务已提交';
    if (steps.some((step) => step.status === 'running')) return '处理中';
    if (steps.length > 0 && steps.every((step) => step.status === 'completed')) return '执行完成';
    if (pendingCount > 0) return `${pendingCount} 项待处理`;
    return '正在调度';
  }, [isReplay, replayWorkspace, chatStatus, steps, isCompleted]);

  const connectionText = useMemo(() => {
    if (chatStatus === 'connected') return '系统在线';
    if (chatStatus === 'connecting') return '连接中';
    if (chatStatus === 'sending') return '提交中';
    if (chatStatus === 'error') return '需要关注';
    return '连接中';
  }, [chatStatus]);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  const taskTitle = useMemo(() => {
    const human = messages.find((message) => message.role === 'human');
    if (!human?.content) return '法律任务执行';
    return human.content.length > 42 ? `${human.content.slice(0, 42)}…` : human.content;
  }, [messages]);

  const canViewResult = isCompleted || steps.some((step) => step.status === 'completed') || messages.length > 1;

  return (
    <AppShell
      title="任务执行"
      subtitle={COSIGHT_TAGLINE}
      badge={(
        <span className="ds-badge ds-badge-warning">
          <Sparkles size={12} />
          {statusSummary}
        </span>
      )}
      actions={(
        <>
          <Link className="btn btn-secondary" to="/workspace">
            <ArrowLeft size={16} />
            <span>新建任务</span>
          </Link>
          {canViewResult ? (
            <Link className="btn btn-primary" to="/workspace/result">
              查看结果
              <ArrowRight size={16} />
            </Link>
          ) : null}
        </>
      )}
      onLogout={handleLogout}
    >
      <div className="workbench-shell workspace-run-shell">
        <PageHeader
          icon={Briefcase}
          title={taskTitle}
          subtitle={isCompleted ? '任务已完成，可查看结果页获取完整报告。' : 'DAG 展示执行路径；右下角弹窗提示工具调用；点击节点查看阶段结果。'}
          badge={<span className="ds-badge ds-badge-primary">{connectionText}</span>}
        />

        {isCompleted && (
          <div className="workspace-success-banner workspace-run-complete-banner">
            <strong>任务执行完成</strong>
            <span>工具调用已通过弹窗提示；完整报告与文书交付请前往任务结果页。</span>
            <Link className="btn btn-primary" to="/workspace/result">查看任务结果</Link>
          </div>
        )}

        <DagGraphPanel
          graph={planGraph}
          toolCalls={toolCalls}
          registry={agentRegistry}
          processing={!isCompleted}
          readOnly={isReplay}
        />

        <ToolCallToast toolCalls={toolCalls} processing={!isCompleted} />

        {isReplay && (
          <div className="replay-mode-banner">
            回放模式 · 正在载入工作区 {replayWorkspace ?? '本地缓存'} 的执行记录
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default WorkspaceRunPage;
