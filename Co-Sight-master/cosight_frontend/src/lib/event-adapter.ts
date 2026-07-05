import { formatToolArgsPreview } from './tool-display';
import type { AgentRegistry } from '../types/agent-registry';
import { defaultAgentRegistry } from './agent-registry';
import {
  buildDagGraphLayout,
  deriveStepsFromSnapshot,
  extractLatestPlanSnapshot,
} from './plan-graph';
import type { AgentRuntimeCard, AgentRole, AgentStep, ChatMessage, ResultCredibility, ResultInsight, ToolCallTrace } from '../types/chat';

export function extractMessageType(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const nestedData = (data.data as Record<string, unknown> | undefined) ?? data;
  const contentType = nestedData.contentType;
  const type = nestedData.type;

  if (typeof contentType === 'string' && contentType.trim()) {
    return contentType;
  }

  if (typeof type === 'string' && type.trim()) {
    return type;
  }

  return null;
}

function extractNestedData(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const data = payload as Record<string, unknown>;
  return (data.data as Record<string, unknown> | undefined) ?? data;
}

function extractMessagePreview(payload: unknown): string {
  const nestedData = extractNestedData(payload);
  const messageType = extractMessageType(payload);
  const content = nestedData.content;
  const initData = nestedData.initData;

  if (messageType === 'control-status-message') {
    return '本次处理已完成，可继续查看结果或补充说明。';
  }

  if (messageType === 'lui-message-manus-step') {
    const stepData = initData || content;
    if (stepData && typeof stepData === 'object') {
      const plan = stepData as Record<string, unknown>;
      const progress = plan.progress as Record<string, unknown> | undefined;
      const title = typeof plan.title === 'string' ? plan.title : '';
      const statusText = typeof plan.statusText === 'string' ? plan.statusText : '';
      const completed = Number(progress?.completed ?? 0);
      const total = Number(progress?.total ?? 0);
      if (title && total > 0) {
        return `DAG 更新：${title}（${completed}/${total}）${statusText ? ` · ${statusText}` : ''}`;
      }
      if (typeof plan.result === 'string' && plan.result.trim()) {
        return `阶段结论：${plan.result.trim().slice(0, 100)}`;
      }
      const stepInitData = plan.initData;
      if (stepInitData && typeof stepInitData === 'object') {
        const stepTitle = (stepInitData as Record<string, unknown>).title;
        if (typeof stepTitle === 'string' && stepTitle.trim()) {
          return `已进入「${stepTitle}」阶段`;
        }
      }
    }
    return '处理流程已更新，可继续查看当前阶段结果。';
  }

  if (messageType === 'lui-message-tool-event') {
    const toolEventData = initData || content;
    if (toolEventData && typeof toolEventData === 'object') {
      const toolName = (toolEventData as Record<string, unknown>).tool_name;
      const eventType = (toolEventData as Record<string, unknown>).event_type;

      if (typeof toolName === 'string' && typeof eventType === 'string') {
        const toolNameZh = (toolEventData as Record<string, unknown>).tool_name_zh;
        const label = typeof toolNameZh === 'string' && toolNameZh.trim() ? toolNameZh : toolName;
        if (eventType === 'tool_start') {
          return `正在执行「${label}」…`;
        }
        if (eventType === 'tool_complete') {
          const processed = (toolEventData as Record<string, unknown>).processed_result;
          const summary = processed && typeof processed === 'object'
            ? String((processed as Record<string, unknown>).summary || '')
            : '';
          return summary ? `「${label}」完成：${summary.slice(0, 100)}` : `「${label}」执行完成`;
        }
        if (eventType === 'tool_error') {
          const err = String((toolEventData as Record<string, unknown>).error || '未知错误');
          return `「${label}」执行失败：${err.slice(0, 120)}`;
        }
      }
    }
    return '系统已记录新的处理动作。';
  }

  if (typeof content === 'string' && content.trim()) {
    return content.slice(0, 120);
  }

  if (typeof initData === 'string' && initData.trim()) {
    return initData.slice(0, 120);
  }

  if (Array.isArray(initData) && initData.length > 0) {
    const first = initData[0] as { value?: string };
    if (typeof first?.value === 'string') {
      return first.value.slice(0, 120);
    }
  }

  return '已收到新的处理进展。';
}

function extractStepPayload(payload: unknown): unknown {
  const nestedData = extractNestedData(payload);
  return nestedData.initData || nestedData.content;
}

function extractToolPayload(payload: unknown): unknown {
  const nestedData = extractNestedData(payload);
  return nestedData.content || nestedData.initData;
}

export function buildIncomingChatMessage(payload: unknown, topic: string): ChatMessage {
  const messageType = extractMessageType(payload);
  const preview = extractMessagePreview(payload);
  const timestamp = Date.now();

  if (messageType === 'lui-message-manus-step') {
    return {
      id: crypto.randomUUID(),
      role: 'system',
      content: preview,
      topic,
      timestamp,
      messageType,
      data: extractStepPayload(payload),
    };
  }

  if (messageType === 'lui-message-tool-event') {
    return {
      id: crypto.randomUUID(),
      role: 'system',
      content: preview,
      topic,
      timestamp,
      messageType,
      data: extractToolPayload(payload),
    };
  }

  if (messageType === 'control-status-message') {
    return {
      id: crypto.randomUUID(),
      role: 'system',
      content: preview,
      topic,
      timestamp,
      messageType,
      data: extractNestedData(payload),
    };
  }

  return {
    id: crypto.randomUUID(),
    role: 'system',
    content: preview,
    topic,
    timestamp,
  };
}

function resolveAgentRoleFromToolName(toolName: string): AgentRole {
  const normalized = toolName.toLowerCase();
  if (normalized.includes('search') || normalized.includes('retrieve') || normalized.includes('query')) {
    return 'retrieval';
  }
  if (normalized.includes('review') || normalized.includes('verify') || normalized.includes('check')) {
    return 'review';
  }
  if (normalized.includes('draft') || normalized.includes('write') || normalized.includes('generate')) {
    return 'generation';
  }
  return 'analysis';
}

function extractStepIndex(data: unknown): number | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const direct = (data as Record<string, unknown>).step_index;
  if (typeof direct === 'number') {
    return direct;
  }

  const initData = (data as Record<string, unknown>).initData;
  if (initData && typeof initData === 'object') {
    const nested = (initData as Record<string, unknown>).step_index;
    if (typeof nested === 'number') {
      return nested;
    }
  }

  return null;
}

function mapLegalAgentToRole(agentId: string): AgentRole {
  if (agentId === 'planner') return 'planner';
  if (agentId === 'research') return 'retrieval';
  if (agentId === 'drafting') return 'generation';
  if (agentId === 'review' || agentId === 'compliance') return 'review';
  return 'analysis';
}


function parseToolArgsPreview(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  return formatToolArgsPreview(raw);
}

function isSessionCompletedMessage(message: ChatMessage): boolean {
  return message.messageType === 'control-status-message'
    || message.content.includes('本次处理已完成');
}

export function deriveSteps(messages: ChatMessage[], registry: AgentRegistry = defaultAgentRegistry): AgentStep[] {
  const hasCompletedSession = messages.some(isSessionCompletedMessage);
  const snapshot = extractLatestPlanSnapshot(messages);
  const toolCalls = deriveToolCalls(messages);
  const layout = buildDagGraphLayout({ snapshot, toolCalls, registry, hasCompletedSession });
  const steps = deriveStepsFromSnapshot({ snapshot, toolCalls, registry, hasCompletedSession });
  return steps.map((step) => ({
    ...step,
    agent: mapLegalAgentToRole(layout?.nodes.find((node) => node.stepIndex === step.stepIndex)?.agentId ?? 'planner'),
  }));
}

export function deriveToolCalls(messages: ChatMessage[]): ToolCallTrace[] {
  const started = new Map<string, ToolCallTrace>();

  messages
    .filter((message) => message.messageType === 'lui-message-tool-event')
    .forEach((message) => {
      let toolName = '未知工具';
      let statusValue: ToolCallTrace['status'] = 'completed';
      const stepIndex = extractStepIndex(message.data);
      let eventKey = message.id;

      if (message.data && typeof message.data === 'object') {
        const toolData = message.data as Record<string, unknown>;
        const rawToolName = toolData.tool_name;
        const rawToolNameZh = toolData.tool_name_zh;
        const rawEventType = toolData.event_type;
        const sequence = toolData.sequence;
        if (typeof rawToolName === 'string' && rawToolName.trim()) {
          toolName = rawToolName;
        }
        const toolLabel = typeof rawToolNameZh === 'string' && rawToolNameZh.trim()
          ? rawToolNameZh.trim()
          : undefined;
        if (typeof sequence === 'number') {
          eventKey = `${toolName}-${sequence}`;
        }
        if (rawEventType === 'tool_start') {
          statusValue = 'running';
        } else if (rawEventType === 'tool_error') {
          statusValue = 'failed';
        } else {
          statusValue = 'completed';
        }

        const duration = typeof toolData.duration === 'number' ? toolData.duration : undefined;
        const argsPreview = parseToolArgsPreview(toolData.tool_args);
        const timestampLabel = typeof toolData.timestamp === 'string' ? toolData.timestamp : undefined;
        const errorDetail = typeof toolData.error === 'string' ? toolData.error : undefined;
        const summary = errorDetail
          ? `执行失败：${errorDetail.slice(0, 160)}`
          : message.content;

        started.set(eventKey, {
          id: eventKey,
          stepIndex,
          toolName,
          toolLabel,
          status: statusValue,
          summary,
          timestamp: message.timestamp,
          agent: resolveAgentRoleFromToolName(toolName),
          duration,
          argsPreview,
          timestampLabel,
          errorDetail,
        });
        return;
      }

      started.set(eventKey, {
        id: eventKey,
        stepIndex,
        toolName,
        status: statusValue,
        summary: message.content,
        timestamp: message.timestamp,
        agent: resolveAgentRoleFromToolName(toolName),
      });
    });

  return [...started.values()].sort((a, b) => b.timestamp - a.timestamp);
}

function clampScore(value: number): number {
  return Math.max(18, Math.min(96, value));
}

function buildCredibilityInsight(params: {
  hasCompletedSession: boolean;
  hasRunningStep: boolean;
  hasToolFailure: boolean;
  stepCount: number;
  toolCount: number;
}): ResultCredibility {
  const { hasCompletedSession, hasRunningStep, hasToolFailure, stepCount, toolCount } = params;

  let score = 46;
  score += Math.min(stepCount * 8, 18);
  score += Math.min(toolCount * 4, 12);

  if (hasCompletedSession) {
    score += 18;
  }

  if (hasRunningStep) {
    score -= 8;
  }

  if (hasToolFailure) {
    score -= 26;
  }

  const normalizedScore = clampScore(score);

  if (normalizedScore >= 78) {
    return {
      score: normalizedScore,
      label: '可信度较高',
      reviewLevel: 'low',
      reviewLabel: '低强度复核',
    };
  }

  if (normalizedScore >= 60) {
    return {
      score: normalizedScore,
      label: '可信度中等',
      reviewLevel: 'medium',
      reviewLabel: '常规复核',
    };
  }

  return {
    score: normalizedScore,
    label: '可信度待核验',
    reviewLevel: 'high',
    reviewLabel: '重点复核',
  };
}

function extractEvidenceReferences(messages: ChatMessage[]): string[] {
  const toolCalls = deriveToolCalls(messages);
  const refs: string[] = [];
  const seen = new Set<string>();

  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    refs.push(trimmed);
  };

  for (const call of toolCalls) {
    if (call.status !== 'completed') continue;
    const name = call.toolName.toLowerCase();
    const label = call.toolLabel || call.toolName;

    if (name.includes('legal_search') || name.includes('legal') || label.includes('法规')) {
      if (call.argsPreview) push(`法规检索 · ${call.argsPreview.replace(/^query="/, '').replace(/"$/, '')}`);
      const lawMatch = call.summary.match(/《[^》]+》|第[一二三四五六七八九十百千\d]+条/g);
      if (lawMatch) lawMatch.slice(0, 2).forEach((item) => push(item));
      continue;
    }

    if (name.includes('search') || name.includes('google') || label.includes('搜索')) {
      if (call.argsPreview) push(`公开检索 · ${call.argsPreview.replace(/^query="/, '').replace(/"$/, '')}`);
      continue;
    }

    if (name.includes('file_saver') || name.includes('file') || label.includes('文件')) {
      if (call.argsPreview) push(`材料输出 · ${call.argsPreview.replace(/^file="/, '').replace(/"$/, '')}`);
      continue;
    }
  }

  if (refs.length === 0) {
    return [
      '执行过程中未提取到明确引用，可在文书交付区生成正式依据列表。',
    ];
  }

  return refs.slice(0, 8);
}

export function deriveResultInsight(messages: ChatMessage[]): ResultInsight {
  const snapshot = extractLatestPlanSnapshot(messages);
  const latestSystemMessage = [...messages].reverse().find((message) => message.role !== 'human');
  const completedMessage = messages.find(isSessionCompletedMessage);
  const stepNotes = snapshot?.stepNotes
    ? Object.values(snapshot.stepNotes).filter((note) => typeof note === 'string' && note.trim())
    : [];
  const conclusion = snapshot?.result?.trim()
    || (stepNotes.length > 0 ? stepNotes[stepNotes.length - 1] : '')
    || (completedMessage ? '任务已完成，请查看执行过程与工具调用详情。' : '')
    || latestSystemMessage?.content
    || '提交事项后，系统会在这里归纳当前阶段结论与下一步建议。';

  const toolFailure = messages.find((message) => message.content.includes('执行出错'));
  const hasRunningStep = messages.some((message) => message.content.includes('已进入'));
  const hasCompletedSession = messages.some(isSessionCompletedMessage);
  const stepCount = messages.filter((message) => message.messageType === 'lui-message-manus-step').length;
  const toolCount = messages.filter((message) => message.messageType === 'lui-message-tool-event').length;

  let risk = '当前仍以过程推进为主，建议继续结合依据与材料进行人工复核。';
  if (toolFailure) {
    risk = '检测到工具执行异常，当前阶段结果可能不完整，建议优先检查失败步骤。';
  } else if (hasCompletedSession) {
    risk = '本轮处理已完成，可重点核对结论、引用依据与业务风险项。';
  } else if (hasRunningStep) {
    risk = '任务仍在推进中，当前结果适合中途查看，不宜直接作为最终结论。';
  }

  const recommendation = hasCompletedSession
    ? '建议下一步查看完整结果、补充依据引用，并整理为可直接使用的结论材料。'
    : '建议继续补充业务背景、合同材料或关键证据，让后续输出更加完整。';

  const evidenceReferences = extractEvidenceReferences(messages);

  const reviewNote = hasCompletedSession
    ? '建议在提交或展示前，重点复核结论表述、依据引用和业务风险是否一致。'
    : '当前结果仍处于处理中，适合阶段性查看，正式使用前仍需人工复核。';
  const credibility = buildCredibilityInsight({
    hasCompletedSession,
    hasRunningStep,
    hasToolFailure: Boolean(toolFailure),
    stepCount,
    toolCount,
  });

  return {
    conclusion,
    risk,
    recommendation,
    evidenceReferences,
    reviewNote,
    credibility,
  };
}

function buildAgentCards(activeAgent: AgentRole | null, steps: AgentStep[], toolCalls: ToolCallTrace[]): AgentRuntimeCard[] {
  const cards: Omit<AgentRuntimeCard, 'status'>[] = [
    { id: 'planner', label: '任务理解智能体', description: 'Co-Sight 规划与任务拆解，生成 DAG 执行路径。' },
    { id: 'retrieval', label: '法规研究智能体', description: '调用搜索/法规库工具，补充引用依据。' },
    { id: 'analysis', label: '证据质检智能体', description: '解析材料、识别缺口与事实冲突。' },
    { id: 'generation', label: '文书生成智能体', description: '生成报告、律师函与结构化结论。' },
    { id: 'review', label: '交叉审查智能体', description: '复核事实、证据、法规与输出风险。' },
  ];

  return cards.map((card) => {
    const participated = card.id === 'planner' ? steps.length > 0 : toolCalls.some((item) => item.agent === card.id);
    return {
      ...card,
      status: card.id === activeAgent ? 'active' : participated ? 'completed' : 'idle',
    };
  });
}

export function deriveActiveAgent(steps: AgentStep[], toolCalls: ToolCallTrace[]): AgentRole | null {
  const latestRunningTool = toolCalls.find((tool) => tool.status === 'running');
  if (latestRunningTool) {
    return latestRunningTool.agent;
  }

  const latestTool = toolCalls[0];
  if (latestTool) {
    return latestTool.agent;
  }

  if (steps.length > 0) {
    return 'planner';
  }

  return null;
}

export function deriveAgentCards(steps: AgentStep[], toolCalls: ToolCallTrace[]): AgentRuntimeCard[] {
  return buildAgentCards(deriveActiveAgent(steps, toolCalls), steps, toolCalls);
}

export function derivePlanGraph(messages: ChatMessage[], registry: AgentRegistry = defaultAgentRegistry) {
  const hasCompletedSession = messages.some(isSessionCompletedMessage);
  return buildDagGraphLayout({
    snapshot: extractLatestPlanSnapshot(messages),
    toolCalls: deriveToolCalls(messages),
    registry,
    hasCompletedSession,
  });
}

export { extractLatestPlanSnapshot };
