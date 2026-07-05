import { useMemo } from 'react';
import type { ToolCallTrace } from '../../types/chat';
import { resolveToolCategoryLabel } from '../../lib/tool-catalog';
import { defaultAgentRegistry, resolveToolLabel } from '../../lib/agent-registry';
import { summarizeToolCalls } from '../../lib/feed-utils';
import { formatToolDisplaySummary } from '../../lib/tool-display';

type ToolTracePanelProps = {
  toolCalls: ToolCallTrace[];
};

function ToolTracePanel({ toolCalls }: ToolTracePanelProps) {
  const visibleCalls = useMemo(() => summarizeToolCalls(toolCalls, 18), [toolCalls]);

  return (
    <section className="records-panel-react workspace-side-panel-react tool-trace-panel-react">
      <div className="records-head-react">
        <strong>Co-Sight 工具调用轨迹</strong>
        <span className="workspace-side-caption-react">最近 {toolCalls.length} 条</span>
      </div>

      {visibleCalls.length === 0 ? (
        <article className="workspace-side-empty-react">
          <strong>尚未触发工具调用</strong>
          <span>进入检索、材料处理或法规研究阶段后，这里会展示真实工具事件。</span>
        </article>
      ) : (
        <div className="tool-trace-list-react">
          {visibleCalls.map((toolCall) => {
            const label = toolCall.toolLabel
              ?? resolveToolLabel(defaultAgentRegistry, toolCall.toolName).toolLabel;
            const summary = toolCall.errorDetail
              ? `错误：${toolCall.errorDetail}`
              : formatToolDisplaySummary(toolCall);
            return (
              <article
                key={toolCall.id}
                className={`tool-trace-item-react ${toolCall.status}${toolCall.errorDetail ? ' failed' : ''}`}
              >
                <div className="tool-trace-head-react">
                  <div>
                    <strong>{label}</strong>
                    <span className="tool-category-chip">{resolveToolCategoryLabel(toolCall.toolName)}</span>
                  </div>
                  <span className={`tool-status-react ${toolCall.status}`}>
                    {toolCall.status === 'running'
                      ? '执行中'
                      : toolCall.status === 'completed'
                        ? '已完成'
                        : toolCall.status === 'failed'
                          ? '异常'
                          : '等待中'}
                  </span>
                </div>
                <div className="tool-trace-meta-row">
                  {toolCall.stepIndex !== null && (
                    <span className="tool-trace-step-chip">步骤 {toolCall.stepIndex + 1}</span>
                  )}
                  {toolCall.duration !== undefined ? (
                    <span className="tool-trace-duration">{toolCall.duration}s</span>
                  ) : null}
                  <time>
                    {new Date(toolCall.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </time>
                </div>
                <p>{summary}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ToolTracePanel;
