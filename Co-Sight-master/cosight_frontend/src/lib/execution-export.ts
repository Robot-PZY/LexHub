import type {
  AgentStep,
  ChatMessage,
  ResultInsight,
  ToolCallTrace,
} from '../types/chat';
import type { ExecutionSnapshot, ExecutionStep, ExecutionToolRecord } from '../types/execution';
import type { DocumentSection, DocumentTemplateId } from '../types/export';

function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    completed: '已完成',
    running: '执行中',
    in_progress: '执行中',
    not_started: '待开始',
    failed: '失败',
    blocked: '阻塞',
    pending: '待开始',
  };
  return map[status] ?? status;
}

function extractLatestPlanContent(messages: ChatMessage[]): Record<string, unknown> | null {
  const stepMessages = messages.filter((message) => message.messageType === 'lui-message-manus-step');
  const latest = stepMessages[stepMessages.length - 1];
  if (!latest?.data || typeof latest.data !== 'object') return null;
  return latest.data as Record<string, unknown>;
}

function extractTaskQuery(messages: ChatMessage[]): string {
  const human = messages.find((message) => message.role === 'human');
  return human?.content?.trim() || '';
}

function buildStepsFromPlan(plan: Record<string, unknown> | null, derivedSteps: AgentStep[]): ExecutionStep[] {
  const rawSteps = Array.isArray(plan?.steps) ? plan.steps as string[] : [];
  const statuses = (plan?.step_statuses && typeof plan.step_statuses === 'object')
    ? plan.step_statuses as Record<string, string>
    : {};
  const notes = (plan?.step_notes && typeof plan.step_notes === 'object')
    ? plan.step_notes as Record<string, string>
    : {};
  const details = (plan?.step_details && typeof plan.step_details === 'object')
    ? plan.step_details as Record<string, string>
    : {};

  if (rawSteps.length > 0) {
    return rawSteps.map((title, index) => {
      const status = statuses[title] || derivedSteps[index]?.status || 'not_started';
      return {
        index,
        title,
        status,
        statusLabel: normalizeStatus(status),
        note: notes[title] || details[title] || derivedSteps[index]?.summary,
      };
    });
  }

  return derivedSteps.map((step, index) => ({
    index,
    title: step.title,
    status: step.status,
    statusLabel: normalizeStatus(step.status),
    note: step.summary,
  }));
}

function buildToolsFromMessages(messages: ChatMessage[], toolCalls: ToolCallTrace[]): ExecutionToolRecord[] {
  const records: ExecutionToolRecord[] = [];
  messages
    .filter((message) => message.messageType === 'lui-message-tool-event')
    .forEach((message) => {
      if (!message.data || typeof message.data !== 'object') return;
      const data = message.data as Record<string, unknown>;
      if (data.event_type !== 'tool_complete') return;
      const processed = data.processed_result;
      let summary = '';
      if (processed && typeof processed === 'object') {
        summary = String((processed as Record<string, unknown>).summary || '');
      }
      records.push({
        toolName: String(data.tool_name || data.tool_name_zh || 'unknown'),
        stepIndex: typeof data.step_index === 'number' ? data.step_index : null,
        summary,
        timestamp: typeof data.timestamp === 'string' ? data.timestamp : undefined,
        duration: typeof data.duration === 'number' ? data.duration : undefined,
      });
    });

  if (records.length > 0) return records;

  return toolCalls.map((tool) => ({
    toolName: tool.toolName,
    stepIndex: tool.stepIndex,
    summary: tool.summary,
  }));
}

export function buildExecutionSnapshotFromChat(input: {
  messages: ChatMessage[];
  steps: AgentStep[];
  toolCalls: ToolCallTrace[];
  resultInsight: ResultInsight;
  workspacePath?: string;
}): ExecutionSnapshot {
  const plan = extractLatestPlanContent(input.messages);
  const steps = buildStepsFromPlan(plan, input.steps);
  const tools = buildToolsFromMessages(input.messages, input.toolCalls);
  const counter = new Map<string, number>();
  tools.forEach((tool) => counter.set(tool.toolName, (counter.get(tool.toolName) ?? 0) + 1));

  const progress = plan?.progress && typeof plan.progress === 'object'
    ? plan.progress as ExecutionSnapshot['progress']
    : undefined;
  const dependencies = plan?.dependencies && typeof plan.dependencies === 'object'
    ? plan.dependencies as Record<string, number[]>
    : undefined;

  const planResult = typeof plan?.result === 'string' ? plan.result.trim() : '';
  const result = planResult || input.resultInsight.conclusion;

  return {
    title: typeof plan?.title === 'string' && plan.title.trim()
      ? plan.title
      : steps[0]?.title || 'Co-Sight 法律任务',
    taskQuery: extractTaskQuery(input.messages),
    steps,
    dependencies,
    progress,
    result,
    statusText: typeof plan?.statusText === 'string' ? plan.statusText : undefined,
    tools,
    toolSummary: [...counter.entries()].map(([name, count]) => ({ name, count })),
    stats: {
      stepCount: steps.length,
      toolCallCount: tools.length,
      dagHopCount: Math.max(steps.length, 1),
      completedSteps: progress?.completed ?? steps.filter((step) => step.status === 'completed').length,
      messageCount: input.messages.length,
    },
    source: input.workspacePath ? 'replay' : 'live',
    workspacePath: input.workspacePath,
  };
}

export function buildExportSectionsFromSnapshot(
  snapshot: ExecutionSnapshot,
  templateId: DocumentTemplateId,
  resultInsight?: ResultInsight,
): { title: string; sections: DocumentSection[] } {
  const templateTitles: Record<DocumentTemplateId, string> = {
    contract_review_report: `${snapshot.title} · 合同审查报告`,
    commercial_contract_draft: `${snapshot.title} · 商业合同草稿`,
    clause_revision_memo: `${snapshot.title} · 条款修改备忘`,
    lawyer_letter_draft: `${snapshot.title} · 律师函初稿`,
    legal_opinion_summary: `${snapshot.title} · 法律意见摘要`,
    evidence_checklist: `${snapshot.title} · 证据清单`,
    task_summary_report: `${snapshot.title} · 任务总结报告`,
  };

  const overview = [
    `任务标题：${snapshot.title}`,
    `任务描述：${snapshot.taskQuery || '（见工作台提交内容）'}`,
    `执行状态：${snapshot.statusText || '已记录'}`,
    `阶段进度：${snapshot.progress?.completed ?? snapshot.stats.completedSteps}/${snapshot.progress?.total ?? snapshot.stats.stepCount}`,
    `DAG 跳数：${snapshot.stats.dagHopCount}`,
    `工具调用：${snapshot.stats.toolCallCount} 次`,
  ];

  const stepLines = snapshot.steps.map((step) => {
    let line = `${step.index + 1}. [${step.statusLabel}] ${step.title}`;
    if (step.note) line += `\n   备注：${step.note}`;
    return line;
  });

  const dependencyLines = snapshot.dependencies
    ? Object.entries(snapshot.dependencies).map(([target, sources]) => `节点 ${target} 依赖：${sources.join(', ')}`)
    : ['依赖关系由 Co-Sight Plan 动态生成。'];

  const toolLines = [
    ...snapshot.toolSummary.map((item) => `- ${item.name} × ${item.count}`),
    ...snapshot.tools.slice(0, 12).filter((tool) => tool.summary).map((tool) => `  · ${tool.toolName}: ${tool.summary}`),
  ];

  const riskBlock = resultInsight
    ? `风险提示：${resultInsight.risk}\n下一步建议：${resultInsight.recommendation}\n复核提示：${resultInsight.reviewNote}`
    : '请在正式使用前完成人工复核。';

  const provenance = [
    `数据来源：Co-Sight ${snapshot.source === 'live' ? '实时 WebSocket 执行' : 'replay.json 回放'}`,
    `工作区：${snapshot.workspacePath || '当前会话'}`,
    `事件条数：${snapshot.stats.messageCount}`,
    '导出策略：真实执行结果优先（参考 AgentScope / AgentReplay 溯源设计）',
  ];

  return {
    title: templateTitles[templateId] ?? snapshot.title,
    sections: [
      { title: '一、任务与执行概览', body: overview.join('\n') },
      { title: '二、Co-Sight DAG 阶段推进', body: stepLines.join('\n') || '暂无阶段记录。' },
      { title: '三、DAG 依赖关系', body: dependencyLines.join('\n') },
      { title: '四、工具链调用证据', body: toolLines.join('\n') || '暂无工具调用记录。' },
      { title: '五、阶段结论与输出', body: snapshot.result || '（尚未产出最终结论文本）' },
      { title: '六、风险与复核建议', body: riskBlock },
      { title: '附录 · 执行溯源', body: provenance.join('\n') },
    ],
  };
}

export function buildExportPayloadFromSnapshot(
  snapshot: ExecutionSnapshot,
  templateId: DocumentTemplateId,
  format: 'docx' | 'pdf',
  resultInsight?: ResultInsight,
  options?: { generationMode?: import('../types/export').DocumentGenerationMode; extraInstructions?: string },
) {
  const built = buildExportSectionsFromSnapshot(snapshot, templateId, resultInsight);
  return {
    templateId,
    format,
    title: built.title,
    sections: built.sections,
    executionSnapshot: snapshot,
    preferExecution: options?.generationMode !== 'llm',
    generationMode: options?.generationMode ?? 'execution',
    caseFacts: buildCaseFactsFromSnapshot(snapshot, resultInsight),
    useResearch: true,
    extraInstructions: options?.extraInstructions,
  };
}

export function buildCaseFactsFromSnapshot(
  snapshot: ExecutionSnapshot,
  resultInsight?: ResultInsight,
): string {
  const parts = [
    `任务：${snapshot.title}`,
    snapshot.taskQuery ? `用户诉求：${snapshot.taskQuery}` : '',
    snapshot.result ? `执行结论：${snapshot.result}` : '',
    snapshot.steps.length > 0
      ? `阶段摘要：\n${snapshot.steps.map((step) => `- [${step.statusLabel}] ${step.title}${step.note ? `：${step.note}` : ''}`).join('\n')}`
      : '',
    resultInsight
      ? `风险提示：${resultInsight.risk}\n建议：${resultInsight.recommendation}`
      : '',
  ];
  return parts.filter(Boolean).join('\n\n');
}
