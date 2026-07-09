import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { Badge } from '../components/ui';
import PageHeader from '../components/ui/PageHeader';
import DagGraphPanel from '../components/workspace/DagGraphPanel';
import ToolCallToast from '../components/workspace/ToolCallToast';
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

    if (isReplay && replayWorkspace) return '正在载入归档';
    if (isCompleted) return '办理完成';
    if (chatStatus === 'sending') return '事项已提交';
    if (steps.some((step) => step.status === 'running')) return '办理中';
    if (steps.length > 0 && steps.every((step) => step.status === 'completed')) return '办理完成';
    if (pendingCount > 0) return `${pendingCount} 项待处理`;
    return '正在生成路径';
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
    if (!human?.content) return '法律事项办理';
    return human.content.length > 42 ? `${human.content.slice(0, 42)}…` : human.content;
  }, [messages]);

  const canViewResult = isCompleted || steps.some((step) => step.status === 'completed') || messages.length > 1;

  return (
    <AppShell
      title="办理进度"
      subtitle="查看事实整理、材料审查、依据检索与结论复核的推进情况"
      badge={(
        <Badge tone="warning" icon={<Sparkles size={12} />}>
          {statusSummary}
        </Badge>
      )}
      actions={(
        <>
          <Link className="lex-button lex-button-secondary lex-button-md" to="/workspace">
            <ArrowLeft size={16} />
            <span>新建事项</span>
          </Link>
          {canViewResult ? (
            <Link className="lex-button lex-button-primary lex-button-md" to="/workspace/result">
              查看结论
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
          subtitle={isCompleted ? '办理已完成，可前往审查结论页查看完整报告。' : '系统正在整理办理路径；点击节点可查看阶段结论与依据来源。'}
          badge={<Badge tone="primary">{connectionText}</Badge>}
        />

        {isCompleted && (
          <div className="workspace-success-banner workspace-run-complete-banner">
            <strong>事项办理完成</strong>
            <span>阶段结论已汇总；完整报告与文书交付请前往审查结论页。</span>
            <Link className="lex-button lex-button-primary lex-button-md" to="/workspace/result">查看审查结论</Link>
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
            归档模式 · 正在载入案件工作区 {replayWorkspace ?? '本地缓存'} 的办理记录
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default WorkspaceRunPage;
