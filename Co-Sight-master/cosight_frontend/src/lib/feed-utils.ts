import type { ChatMessage } from '../types/chat';
import type { ToolCallTrace } from '../types/chat';

export function compactSessionMessages(messages: ChatMessage[], limit = 16): ChatMessage[] {
  const filtered = messages.filter((message) => {
    if (message.role === 'human' && !message.content.trim()) return false;
    if (message.messageType === 'lui-message-tool-event') return false;
    return true;
  });
  const deduped: ChatMessage[] = [];

  filtered.forEach((message) => {
    const prev = deduped[deduped.length - 1];
    if (
      prev
      && prev.messageType === message.messageType
      && prev.content === message.content
      && message.messageType === 'lui-message-tool-event'
    ) {
      return;
    }
    deduped.push(message);
  });

  return deduped.slice(-limit);
}

export function formatFeedContent(message: ChatMessage): string {
  const raw = message.content.trim();
  if (message.messageType === 'lui-message-tool-event') {
    return raw
      .replace(/^正在执行[「"]?/, '▶ ')
      .replace(/[」"]?\.\.\.$/, '')
      .replace(/Tool系统反馈/g, '工具')
      .slice(0, 220);
  }
  if (message.messageType === 'lui-message-manus-step') {
    return '阶段计划已更新，可在上方 DAG 查看节点状态。';
  }
  if (message.messageType === 'control-status-message') {
    return '任务执行完成，可查看结果或导出文书。';
  }
  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}

export function feedMessageLabel(message: ChatMessage): string {
  if (message.role === 'human') return '任务输入';
  if (message.messageType === 'lui-message-tool-event') {
    return message.content.includes('失败') ? '工具异常' : '工具调用';
  }
  if (message.messageType === 'lui-message-manus-step') return '阶段推进';
  if (message.messageType === 'control-status-message') return '执行完成';
  return '系统反馈';
}

export function summarizeToolCalls(toolCalls: ToolCallTrace[], limit = 20): ToolCallTrace[] {
  return toolCalls.slice(-limit).reverse();
}

export function shortenToolSummary(text: string, max = 160): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)}…`;
}
