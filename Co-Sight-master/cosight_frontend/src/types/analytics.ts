import type { ApiIntegration } from './legal';

import type { PerformanceBenchmark } from './workflow';

export type AnalyticsOverview = {
  summary: {
    totalCases: number;
    highRiskRatio: number;
    agentCalls: number;
    apiReadyRatio: number;
    dataSource?: 'replay' | 'baseline';
    replayCount?: number;
  };
  caseStages: Array<{ label: string; value: number }>;
  riskDistribution: Array<{ label: string; value: number; tone: string }>;
  completenessTrend: Array<{ label: string; value: number }>;
  agentCalls: Array<{ label: string; value: number }>;
  apiStatus: ApiIntegration[];
  performanceBenchmark?: PerformanceBenchmark;
};

export type AnalyticsOverviewApiResponse = {
  code: number;
  message?: string;
  data?: AnalyticsOverview;
};

export type ToolchainStatus = {
  integrations: ApiIntegration[];
  summary: {
    total: number;
    ready: number;
    missingKey: number;
    planned: number;
  };
};

export type ToolchainStatusApiResponse = {
  code: number;
  message?: string;
  data?: ToolchainStatus;
};
