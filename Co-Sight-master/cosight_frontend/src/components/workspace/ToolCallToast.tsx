import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Wrench, XCircle } from 'lucide-react';
import type { ToolCallTrace } from '../../types/chat';
import { defaultAgentRegistry, resolveToolLabel } from '../../lib/agent-registry';
import { formatToolDisplaySummary } from '../../lib/tool-display';

type ToolCallToastProps = {
  toolCalls: ToolCallTrace[];
  processing?: boolean;
};

type ToastItem = {
  id: string;
  status: 'running' | 'completed' | 'failed';
  label: string;
  detail: string;
  stepLabel?: string;
};

function ToolCallToast({ toolCalls, processing = true }: ToolCallToastProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [fadeId, setFadeId] = useState<string | null>(null);

  const activeToast = useMemo<ToastItem | null>(() => {
    const running = toolCalls.find((tool) => tool.status === 'running');
    if (running) {
      const { toolLabel } = resolveToolLabel(defaultAgentRegistry, running.toolName);
      return {
        id: running.id,
        status: 'running',
        label: running.toolLabel ?? toolLabel,
        detail: formatToolDisplaySummary(running),
        stepLabel: running.stepIndex != null ? `步骤 ${running.stepIndex + 1}` : undefined,
      };
    }

    const latest = toolCalls[0];
    if (!latest || latest.id === dismissedId) return null;

    const { toolLabel } = resolveToolLabel(defaultAgentRegistry, latest.toolName);
    return {
      id: latest.id,
      status: latest.status === 'failed' ? 'failed' : 'completed',
      label: latest.toolLabel ?? toolLabel,
      detail: formatToolDisplaySummary(latest),
      stepLabel: latest.stepIndex != null ? `步骤 ${latest.stepIndex + 1}` : undefined,
    };
  }, [toolCalls, dismissedId]);

  useEffect(() => {
    if (!activeToast || activeToast.status === 'running') {
      setFadeId(null);
      return undefined;
    }

    const fadeTimer = window.setTimeout(() => setFadeId(activeToast.id), 2200);
    const hideTimer = window.setTimeout(() => setDismissedId(activeToast.id), 2800);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [activeToast]);

  useEffect(() => {
    if (!processing) return;
    const running = toolCalls.find((tool) => tool.status === 'running');
    if (running) setDismissedId(null);
  }, [toolCalls, processing]);

  if (!activeToast || !processing) return null;

  const isFading = fadeId === activeToast.id && activeToast.status !== 'running';

  return (
    <div className={`tool-call-toast-stack${isFading ? ' fading' : ''}`} aria-live="polite">
      <article className={`tool-call-toast ${activeToast.status}`}>
        <div className="tool-call-toast-icon">
          {activeToast.status === 'running' && <Loader2 size={18} className="dag-graph-spin" />}
          {activeToast.status === 'completed' && <CheckCircle2 size={18} />}
          {activeToast.status === 'failed' && <XCircle size={18} />}
        </div>
        <div className="tool-call-toast-copy">
          <div className="tool-call-toast-head">
            <Wrench size={12} />
            <strong>
              {activeToast.status === 'running' ? '正在处理' : activeToast.status === 'failed' ? '处理异常' : '处理完成'}
            </strong>
            {activeToast.stepLabel ? <span>{activeToast.stepLabel}</span> : null}
          </div>
          <em>{activeToast.label}</em>
          <p>{activeToast.detail}</p>
        </div>
      </article>
    </div>
  );
}

export default ToolCallToast;
