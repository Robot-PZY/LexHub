import type { ExecutionSnapshot } from '../types/execution';

export type ReviewGate = {
  ready: boolean;
  message: string;
};

export function getReviewGate(snapshot: ExecutionSnapshot | null): ReviewGate {
  if (!snapshot?.result) return { ready: false, message: '请等待任务形成正式结论。' };
  if (snapshot.tools.some((tool) => tool.status === 'failed')) {
    return { ready: false, message: '存在失败的处理动作，修复后才能生成正式文书。' };
  }

  const reviewStep = snapshot.steps.find((step) => /交叉审查|交叉复核|cross[- ]?review|\breview\b/i.test(step.title));
  if (!reviewStep) return { ready: false, message: '尚未记录交叉审查节点，不能导出正式文书。' };
  if (reviewStep.status !== 'completed') return { ready: false, message: '交叉审查尚未完成，不能导出正式文书。' };
  return { ready: true, message: '交叉审查已完成，可生成与导出正式文书。' };
}
