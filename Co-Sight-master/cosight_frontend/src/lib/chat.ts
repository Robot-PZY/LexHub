import {
  clearPendingRequest,
  ensurePlanIdForTopic,
  markPendingRequest,
  updatePendingFlag,
} from './storage';

export type UploadedFileInfo = {
  uploadId: string;
  filename: string;
  sizeMb?: number;
};

export function createTopic(): string {
  return crypto.randomUUID();
}

export function buildOutgoingMessage(
  content: string,
  topic: string,
  uploadIds: string[] = [],
  scenario?: string,
  matter?: { id: string; title: string },
) {
  const planId = ensurePlanIdForTopic(topic);
  const fromBackEnd: Record<string, unknown> = {
    actualPrompt: JSON.stringify({ deepResearchEnabled: true, scenario: scenario || '' }),
  };

  if (scenario) {
    fromBackEnd.scenario = scenario;
  }

  if (uploadIds.length > 0) {
    fromBackEnd.uploadedFiles = uploadIds;
  }

  if (matter) {
    fromBackEnd.matterId = matter.id;
    fromBackEnd.matterTitle = matter.title;
  }

  return {
    uuid: crypto.randomUUID(),
    type: 'multi-modal',
    from: 'human',
    timestamp: Date.now(),
    initData: [{ type: 'text', value: content }],
    roleInfo: { name: 'admin' },
    mentions: [],
    extra: {
      fromBackEnd,
    },
    sessionInfo: {
      messageSerialNumber: planId,
    },
  };
}

export function buildReplayMessage(workspacePath: string, planId: string, matter?: { id: string; title: string }) {
  return {
    uuid: crypto.randomUUID(),
    type: 'multi-modal',
    from: 'human',
    timestamp: Date.now(),
    initData: [{ type: 'text', value: '[Replay] 请求回放历史处理记录' }],
    roleInfo: { name: 'admin' },
    mentions: [],
    extra: {
      replay: true,
      replayWorkspace: workspacePath,
      replayPlanId: planId,
      fromBackEnd: {
        actualPrompt: JSON.stringify({ deepResearchEnabled: true }),
        replay: true,
        replayWorkspace: workspacePath,
        replayPlanId: planId,
        matterId: matter?.id,
        matterTitle: matter?.title,
      },
    },
    sessionInfo: {
      messageSerialNumber: planId,
    },
  };
}

export function storePendingMessage(topic: string, message: unknown): void {
  markPendingRequest(topic, {
    message,
    savedAt: Date.now(),
    stillPending: true,
  });
}

export function markPendingMessageStarted(topic: string): void {
  updatePendingFlag(topic, false);
}

export function clearPendingMessage(topic: string): void {
  clearPendingRequest(topic);
}
