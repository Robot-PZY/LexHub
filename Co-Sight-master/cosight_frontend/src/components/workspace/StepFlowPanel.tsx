import { useEffect, useMemo, useState } from 'react';
import type { AgentStep, ToolCallTrace } from '../../types/chat';
import { formatLegalAgentLabel } from '../../lib/dag-utils';

type StepFlowPanelProps = {
  steps: AgentStep[];
  toolCalls: ToolCallTrace[];
};

function StepFlowPanel({ steps, toolCalls }: StepFlowPanelProps) {
  const initialStepId = useMemo(() => {
    const runningStep = steps.find((step) => step.status === 'running');
    return runningStep?.id ?? steps[0]?.id ?? null;
  }, [steps]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(initialStepId);

  useEffect(() => {
    setSelectedStepId(initialStepId);
  }, [initialStepId]);

  const selectedStep = steps.find((step) => step.id === selectedStepId) ?? null;
  const relatedToolCalls = selectedStep
    ? toolCalls.filter((toolCall) => toolCall.stepIndex === selectedStep.stepIndex)
    : [];

  return (
    <section className="records-panel-react workspace-side-panel-react">
      <div className="records-head-react">
        <strong>Co-Sight DAG 阶段推进</strong>
        <span className="workspace-side-caption-react">{steps.length} 个 DAG 节点</span>
      </div>

      {steps.length === 0 ? (
        <article className="workspace-side-empty-react">
          <strong>等待系统开始规划</strong>
          <span>任务提交后，这里会展示阶段节点、推进顺序和当前执行位置。</span>
        </article>
      ) : (
        <>
          <div className="step-dag-lite-react" aria-label="执行路径概览">
            {steps.map((step, index) => {
              const isSelected = step.id === selectedStepId;
              const isLast = index === steps.length - 1;
              return (
                <div key={step.id} className="step-dag-node-wrap-react">
                  <button
                    type="button"
                    className={`step-dag-node-react ${step.status} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedStepId(step.id)}
                  >
                    <span>{index + 1}</span>
                    <strong>{step.title}</strong>
                  </button>
                  {!isLast && <div className="step-dag-connector-react" aria-hidden="true" />}
                </div>
              );
            })}
          </div>

          <div className="step-flow-list-react">
            {steps.map((step, index) => {
              const isLatest = step.status === 'running';
              const isSelected = step.id === selectedStepId;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`step-flow-item-react ${isLatest ? 'active' : step.status} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedStepId(step.id)}
                >
                  <div className="step-flow-index-react">{index + 1}</div>
                  <div className="step-flow-copy-react">
                    <strong>{step.title}</strong>
                    <span>{step.summary}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedStep && (
            <article className="step-detail-card-react">
              <div className="step-detail-head-react">
                <strong>{selectedStep.title}</strong>
                <span className={`step-detail-status-react ${selectedStep.status}`}>
                  {selectedStep.status === 'running'
                    ? '执行中'
                    : selectedStep.status === 'completed'
                      ? '已完成'
                      : selectedStep.status === 'failed'
                        ? '需处理'
                        : '等待中'}
                </span>
              </div>
              <p>{selectedStep.summary}</p>
              <div className="step-detail-meta-react">
                <span>负责智能体: {formatLegalAgentLabel(selectedStep.agent)}</span>
                <span>
                  最近更新:
                  {new Date(selectedStep.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="step-detail-tools-react">
                <strong>关联工具调用</strong>
                {relatedToolCalls.length === 0 ? (
                  <span>当前阶段暂未产生独立工具调用记录。</span>
                ) : (
                  relatedToolCalls.map((toolCall) => (
                    <span key={toolCall.id} className="step-detail-tool-chip-react">
                      {toolCall.toolName}
                    </span>
                  ))
                )}
              </div>
            </article>
          )}
        </>
      )}
    </section>
  );
}

export default StepFlowPanel;
