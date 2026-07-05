export type ReplayWorkspace = {
  workspace_path: string;
  workspace_name: string;
  title: string;
  created_time: string;
  message_count: number;
};

export type ReplayApiResponse = {
  code: number;
  data?: ReplayWorkspace[];
  message?: string;
};

export type RecentRecordItem = {
  title: string;
  subtitle: string;
  time: string;
  workspacePath?: string;
};

export type ToolEvent = {
  step_index: number;
  event_type: 'tool_start' | 'tool_complete' | 'tool_error';
  tool_name: string;
  tool_args?: string;
  processed_result?: string;
  raw_result?: string;
  duration?: number;
  timestamp?: number;
};

export type ManuStepData = {
  content?: unknown;
  initData?: {
    title?: string;
    steps?: Array<{
      id: number;
      title: string;
      description?: string;
    }>;
  };
};
