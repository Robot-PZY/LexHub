const DEFAULT_STEPS = [
  { id: 'planner', label: '受理', title: '事项受理' },
  { id: 'retrieval', label: '检索', title: '依据检索' },
  { id: 'analysis', label: '分析', title: '风险分析' },
  { id: 'generation', label: '生成', title: '文书生成' },
  { id: 'review', label: '审查', title: '结果审查' },
] as const;

type AgentPipelineProps = {
  activeStep?: string;
  compact?: boolean;
};

function AgentPipeline({ activeStep = 'planner', compact = false }: AgentPipelineProps) {
  const activeIndex = Math.max(0, DEFAULT_STEPS.findIndex((s) => s.id === activeStep));

  return (
    <div className={`agent-pipeline${compact ? ' agent-pipeline-compact' : ''}`} role="list" aria-label="事项办理路径">
      {DEFAULT_STEPS.map((step, index) => {
        const isActive = step.id === activeStep;
        const isDone = index < activeIndex;
        return (
          <div key={step.id} className="agent-pipeline-item-wrap" role="listitem">
            <div
              className={`agent-pipeline-node${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
              title={step.title}
            >
              <span className="agent-pipeline-dot" aria-hidden="true" />
              <span>{compact ? step.label : step.title}</span>
            </div>
            {index < DEFAULT_STEPS.length - 1 && (
              <span className={`agent-pipeline-connector${isDone || isActive ? ' active' : ''}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AgentPipeline;
