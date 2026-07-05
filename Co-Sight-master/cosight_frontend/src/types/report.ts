export type ReportSection = {
  title: string;
  desc: string;
};

export type ReportSummary = {
  title: string;
  sections: ReportSection[];
  agentInvocations: Array<{ name: string; count: number }>;
  exportFormats: Array<{ id: string; label: string; status: string }>;
  nextActions: Array<{ title: string; desc: string }>;
  stats: {
    agents: number;
    findings: number;
    status: string;
  };
};

export type ReportSummaryApiResponse = {
  code: number;
  message?: string;
  data?: ReportSummary;
};
