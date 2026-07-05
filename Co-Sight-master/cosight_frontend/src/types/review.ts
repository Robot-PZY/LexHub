import type { AuditLog } from './audit';

export type ReviewItem = {
  label: string;
  value: string;
  detail: string;
  tone: 'success' | 'warning' | 'primary' | 'danger';
};

export type ReviewResult = {
  overallVerdict: string;
  reviewItems: ReviewItem[];
  riskFindings: string[];
  stats: {
    dimensions: number;
    passed: number;
    warnings: number;
    outputLevel: string;
  };
  auditLog?: AuditLog;
  auditChainHash?: string;
  dataSource?: 'replay' | 'baseline';
};

export type ReviewResultApiResponse = {
  code: number;
  message?: string;
  data?: ReviewResult;
};
