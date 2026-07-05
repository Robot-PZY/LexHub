export type AuditLogEntry = {
  id: string;
  sequence: number;
  type: string;
  actor: string;
  detail: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  hash: string;
};

export type AuditLog = {
  workspaceName: string;
  sessionId: string;
  username: string;
  title: string;
  chainHash: string;
  entryCount: number;
  entries: AuditLogEntry[];
  stats: Record<string, unknown>;
  source: string;
};

export type AuditLogApiResponse = {
  code: number;
  message?: string;
  data?: AuditLog;
};
