import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildOutgoingMessage,
  buildReplayMessage,
  clearPendingMessage,
  createTopic,
  markPendingMessageStarted,
  storePendingMessage,
} from '../lib/chat';
import { buildIncomingChatMessage, deriveAgentCards, deriveResultInsight, deriveSteps, deriveToolCalls, extractMessageType } from '../lib/event-adapter';
import { markPlanCompleted, saveLastManusStep, saveWorkspaceSession, updateMatter } from '../lib/storage';
import { registerMaterialTask } from '../lib/api';
import { CosightWebSocketClient } from '../lib/websocket';
import type { ChatMessage, ChatStatus } from '../types/chat';
import { loadDemoUser } from '../lib/storage';

type TaskMeta = {
  matterId?: string;
  taskId: string;
  taskTitle: string;
  uploadIds: string[];
  scenario?: string;
  documentIntake?: import('../types/document-intake').DocumentIntake;
};

export function useCosightChat() {
  const clientRef = useRef<CosightWebSocketClient | null>(null);
  const activeScenarioRef = useRef<string | undefined>(undefined);
  const activeTaskMetaRef = useRef<TaskMeta | null>(null);
  const workspacePathByTopicRef = useRef(new Map<string, string>());
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  useEffect(() => {
    const client = new CosightWebSocketClient();
    clientRef.current = client;
    setStatus('connecting');
    client.connect();

    const unsubscribe = client.onStatusChange((nextStatus) => {
      if (nextStatus === 'error') {
        setStatus('error');
        return;
      }

      if (nextStatus === WebSocket.OPEN) {
        setStatus('connected');
        return;
      }

      if (nextStatus === WebSocket.CONNECTING) {
        setStatus('connecting');
        return;
      }

      if (nextStatus === WebSocket.CLOSED) {
        setStatus('idle');
      }
    });

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

  const subscribeTopic = useCallback((topic: string) => {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    client.subscribe(topic, (payload) => {
      markPendingMessageStarted(topic);
      const messageType = extractMessageType(payload.data);

      if (messageType === 'lui-message-workspace-binding') {
        const envelope = payload.data as { content?: { workspacePath?: unknown }; data?: { content?: { workspacePath?: unknown } } };
        const workspacePath = envelope?.content?.workspacePath ?? envelope?.data?.content?.workspacePath;
        if (typeof workspacePath === 'string' && workspacePath.trim()) {
          workspacePathByTopicRef.current.set(topic, workspacePath);
          const meta = activeTaskMetaRef.current;
          if (meta?.matterId) {
            updateMatter(meta.matterId, { workspacePath, status: 'running' });
          }
        }
      }

      if (messageType === 'lui-message-manus-step') {
        saveLastManusStep(payload.data);
      }

      const nextMessage = buildIncomingChatMessage(payload.data, topic);
      setMessages((current) => [...current, nextMessage]);

      const envelope = payload.data as { type?: string; data?: { type?: string } };
      const isComplete = envelope?.type === 'control-status-message'
        || envelope?.data?.type === 'control-status-message'
        || extractMessageType(payload.data) === 'control-status-message';

      if (isComplete) {
        clearPendingMessage(topic);
        markPlanCompleted(topic);
      }

      setStatus('connected');
    });
  }, []);

  const send = useCallback((content: string, uploadIds: string[] = [], scenario?: string, taskMeta?: TaskMeta) => {
    const client = clientRef.current;
    if (!client || !content.trim()) {
      return false;
    }

    const topic = createTopic();
    activeScenarioRef.current = scenario;
    activeTaskMetaRef.current = taskMeta ?? {
      taskId: topic,
      taskTitle: content.length > 48 ? `${content.slice(0, 48)}…` : content,
      uploadIds,
      scenario,
    };
    const outgoing = buildOutgoingMessage(content, topic, uploadIds, scenario, {
      id: activeTaskMetaRef.current.matterId ?? activeTaskMetaRef.current.taskId,
      title: activeTaskMetaRef.current.taskTitle,
    });
    if (activeTaskMetaRef.current.matterId) {
      updateMatter(activeTaskMetaRef.current.matterId, { status: 'running' });
    }
    storePendingMessage(topic, outgoing);

    setStatus('sending');
    setActiveTopic(topic);
    setMessages([
      {
        id: topic,
        role: 'human',
        content,
        topic,
        timestamp: Date.now(),
      },
    ]);

    subscribeTopic(topic);

    const sent = client.sendMessage(topic, outgoing);
    if (!sent) {
      setStatus('error');
      return false;
    }

    return true;
  }, [subscribeTopic]);

  const sendReplay = useCallback((workspacePath: string, replayPlanId?: string, taskMeta?: TaskMeta) => {
    const client = clientRef.current;
    if (!client || !workspacePath.trim()) {
      return false;
    }

    const topic = createTopic();
    const planId = replayPlanId || topic;
    activeTaskMetaRef.current = taskMeta ?? null;
    const outgoing = buildReplayMessage(workspacePath.trim(), planId, taskMeta ? {
      id: taskMeta.matterId ?? taskMeta.taskId,
      title: taskMeta.taskTitle,
    } : undefined);
    storePendingMessage(topic, outgoing);

    setStatus('sending');
    setActiveTopic(topic);
    setMessages([
      {
        id: topic,
        role: 'human',
        content: `[回放] ${workspacePath}`,
        topic,
        timestamp: Date.now(),
      },
    ]);

    subscribeTopic(topic);

    const sent = client.sendMessage(topic, outgoing);
    if (!sent) {
      setStatus('error');
      return false;
    }

    return true;
  }, [subscribeTopic]);

  const connectionLabel = useMemo(() => {
    if (status === 'connected') return '连接正常';
    if (status === 'connecting') return '正在连接';
    if (status === 'sending') return '正在发送';
    if (status === 'error') return '连接异常';
    return '等待开始';
  }, [status]);

  const steps = useMemo(() => deriveSteps(messages), [messages]);
  const toolCalls = useMemo(() => deriveToolCalls(messages), [messages]);
  const resultInsight = useMemo(() => deriveResultInsight(messages), [messages]);
  const agents = useMemo(() => deriveAgentCards(steps, toolCalls), [steps, toolCalls]);

  const isCompleted = useMemo(
    () => messages.some((message) =>
      message.messageType === 'control-status-message'
      || message.content.includes('本次处理已完成'),
    ),
    [messages],
  );

  useEffect(() => {
    if (messages.length === 0 || !activeTopic) return;
    const human = messages.find((message) => message.role === 'human');
    const record = {
      matterId: activeTaskMetaRef.current?.matterId,
      matterTitle: activeTaskMetaRef.current?.taskTitle,
      topic: activeTopic,
      query: human?.content ?? '',
      scenario: activeScenarioRef.current,
      documentIntake: activeTaskMetaRef.current?.documentIntake,
      messages,
      completedAt: isCompleted ? Date.now() : undefined,
      workspacePath: workspacePathByTopicRef.current.get(activeTopic),
    };
    saveWorkspaceSession(record);

    if (isCompleted) {
      const meta = activeTaskMetaRef.current;
      const workspacePath = workspacePathByTopicRef.current.get(activeTopic);
      if (meta?.matterId) {
        updateMatter(meta.matterId, {
          status: 'completed',
          completedAt: Date.now(),
          workspacePath,
        });
      }
      if (meta && workspacePath) {
        const profile = loadDemoUser();
        void registerMaterialTask({
          userAccount: profile?.account ?? 'user',
          taskId: meta.taskId,
          taskTitle: meta.taskTitle,
          scenario: meta.scenario ?? activeScenarioRef.current,
          workspacePath,
          uploadIds: meta.uploadIds,
        }).catch(() => undefined);
      }
    }
  }, [messages, activeTopic, isCompleted]);

  return {
    status,
    connectionLabel,
    activeTopic,
    messages,
    steps,
    toolCalls,
    resultSummary: resultInsight.conclusion,
    resultInsight,
    agents,
    isCompleted,
    send,
    sendReplay,
  };
}
