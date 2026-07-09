import type { ResultInsight } from '../types/chat';
import type { ExecutionSnapshot } from '../types/execution';

export type ReportRiskStats = {
  high: number;
  medium: number;
  low: number;
};

export function extractRiskStats(text: string): ReportRiskStats {
  const source = text || '';
  return {
    high: (source.match(/高风险|🔴/g) || []).length,
    medium: (source.match(/中风险|中等风险|🟡/g) || []).length,
    low: (source.match(/低风险|🟢/g) || []).length,
  };
}

function hasReportStructure(markdown: string): boolean {
  const text = (markdown || '').trim();
  if (!text) return false;
  if (/^#{1,3}\s+/m.test(text)) return true;
  if (text.includes('|') && text.includes('---')) return true;
  return text.length > 420;
}

export function enrichReportMarkdown(
  raw: string,
  snapshot: ExecutionSnapshot | null | undefined,
  resultInsight: ResultInsight,
  scenarioTitle?: string,
): string {
  const trimmed = (raw || '').trim();
  if (hasReportStructure(trimmed)) return trimmed;

  const steps = snapshot?.steps ?? [];
  const completed = snapshot?.stats.completedSteps
    ?? steps.filter((step) => step.status === 'completed').length;
  const total = snapshot?.stats.stepCount ?? steps.length;
  const toolCount = snapshot?.stats.toolCallCount ?? snapshot?.tools.length ?? 0;
  const body = trimmed || resultInsight.conclusion || '事项已完成，详见下方阶段办理与建议。';

  const lines: string[] = ['## 事项概览'];
  if (scenarioTitle) lines.push(`**场景类型**：${scenarioTitle}`);
  if (snapshot?.taskQuery) lines.push(`**事项描述**：${snapshot.taskQuery}`);
  lines.push(`**办理进度**：${completed}/${total} 步骤已完成`);
  if (toolCount > 0) lines.push(`**处理动作**：${toolCount} 次`);
  lines.push(
    `**可信度评分**：${resultInsight.credibility.score}（${resultInsight.credibility.label}）`,
    '',
    '## 办理摘要',
    body,
    '',
  );

  if (steps.length > 0) {
    lines.push('## 阶段办理结果', '| 阶段 | 状态 | 说明 |', '| --- | --- | --- |');
    steps.forEach((step) => {
      const note = (step.note || '—').replace(/\|/g, '/').slice(0, 72);
      lines.push(`| ${step.title} | ${step.statusLabel} | ${note} |`);
    });
    lines.push('');
  }

  const refs = resultInsight.evidenceReferences.filter((item) => !item.includes('未提取'));
  if (refs.length > 0) {
    lines.push('## 引用依据');
    refs.forEach((ref) => lines.push(`- ${ref}`));
    lines.push('');
  }

  lines.push(
    '## 风险与建议',
    `**风险提示**：${resultInsight.risk}`,
    `**下一步建议**：${resultInsight.recommendation}`,
    `**复核提示**：${resultInsight.reviewNote}`,
  );

  return lines.join('\n');
}

export function buildExecutiveSummary(
  resultSummary: string,
  resultInsight: ResultInsight,
  snapshot?: ExecutionSnapshot | null,
): string {
  const firstParagraph = (resultSummary || resultInsight.conclusion)
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim())
    .find((line) => line.length > 12);
  if (firstParagraph) return firstParagraph.slice(0, 220);

  const completed = snapshot?.stats.completedSteps ?? snapshot?.steps.filter((s) => s.status === 'completed').length ?? 0;
  const total = snapshot?.stats.stepCount ?? snapshot?.steps.length ?? 0;
  return `已完成 ${completed}/${total} 个办理阶段，共记录 ${snapshot?.stats.toolCallCount ?? 0} 次处理动作。${resultInsight.recommendation}`;
}
