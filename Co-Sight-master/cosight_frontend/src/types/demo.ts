export type DemoOverviewStats = {
  workspace_root: string;
  replay_count: number;
  latest_replay_time: string | null;
  active_workspace_count: number;
};

export type DemoOverview = {
  product_name: string;
  system_name: string;
  positioning: string;
  primary_story: string;
  framework: string;
  capabilities: string[];
  scenarios: string[];
  stats: DemoOverviewStats;
};

export type DemoOverviewApiResponse = {
  code: number;
  data?: DemoOverview;
  message?: string;
};

export type DemoRuntimeStatus = {
  status: 'ready' | 'degraded';
  summary: string;
  required_envs: Record<string, boolean>;
  optional_tools: Record<string, boolean>;
  workspace_ready: boolean;
  websocket_path: string;
  server_uptime_seconds: number;
  server_start_timestamp: number;
  stats: DemoOverviewStats;
};

export type DemoRuntimeStatusApiResponse = {
  code: number;
  data?: DemoRuntimeStatus;
  message?: string;
};
