import type { ToolCallTrace } from '../types/chat';

export function formatToolArgsPreview(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.query === 'string') {
      return `检索「${parsed.query.slice(0, 72)}」`;
    }
    const fileValue = parsed.file_path ?? parsed.file ?? parsed.path ?? parsed.filename;
    if (typeof fileValue === 'string') {
      const name = fileValue.split(/[/\\]/).pop() || fileValue;
      return `读取 ${name}`;
    }
    if (typeof parsed.url === 'string') {
      return `访问 ${parsed.url.slice(0, 64)}`;
    }
  } catch {
    const fileMatch = raw.match(/[^/\\]+\.(txt|md|pdf|docx?|xlsx?)/i);
    if (fileMatch) return `读取 ${fileMatch[0]}`;
  }

  return undefined;
}

export function cleanToolSummary(summary: string): string {
  return summary
    .replace(/^正在执行[「"]?/, '')
    .replace(/[」"]?\.\.\.$/, '')
    .replace(/^「[^」]+」完成[:：]\s*/, '')
    .replace(/Tool系统反馈/g, '处理反馈')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatToolDisplaySummary(tool: Pick<ToolCallTrace, 'summary' | 'argsPreview' | 'errorDetail' | 'toolLabel' | 'toolName'>): string {
  if (tool.errorDetail) return `处理失败：${tool.errorDetail}`;

  const argsText = formatToolArgsPreview(tool.argsPreview);
  const cleaned = cleanToolSummary(tool.summary || '');
  const looksLikeJson = cleaned.startsWith('{') || cleaned.includes('{"file"');

  if (argsText) {
    const plain = argsText.replace(/^读取\s+/, '');
    if (cleaned.includes(plain)) return argsText;
    return argsText;
  }
  if (cleaned && !looksLikeJson && cleaned.length > 4) return cleaned.slice(0, 180);
  if (tool.toolLabel) return `调用 ${tool.toolLabel}`;
  return `调用 ${tool.toolName}`;
}

export function dedupeToolRecords<T extends { toolName: string; argsPreview?: string; summary: string; status: string }>(
  tools: T[],
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  [...tools].reverse().forEach((tool) => {
    const key = `${tool.toolName}|${formatToolArgsPreview(tool.argsPreview) ?? cleanToolSummary(tool.summary).slice(0, 48)}`;
    if (tool.status === 'completed' && seen.has(key)) return;
    seen.add(key);
    result.push(tool);
  });

  return result.reverse();
}

export function extractToolLabelFromMessage(content: string): string {
  const match = content.match(/[「"]([^」"]+)[」"]/);
  if (match) return match[1];
  return '处理动作';
}
