import type { AdminSettings } from '../types/admin-config';
import type { AuditLog } from '../types/audit';
import type { UploadedFileInfo } from './chat';
import type { DemoOverview, DemoOverviewApiResponse, DemoRuntimeStatus, DemoRuntimeStatusApiResponse } from '../types/demo';
import type { AnalyticsOverview, ToolchainStatus } from '../types/analytics';
import type { AgentRegistry } from '../types/agent-registry';
import type { ProfileAnalysis } from '../types/profile';
import type { ReportSummary } from '../types/report';
import type { ReviewResult } from '../types/review';
import type { AgentRoutingState, AgentRoutingApiResponse } from '../types/routing';
import type { MaterialLibrary, MaterialTaskRegistration } from '../types/material';
import type { ExecutionSnapshot } from '../types/execution';
import type { PerformanceBenchmark, WorkflowConfig } from '../types/workflow';
import type { LegalToolkitApiResponse, LegalToolkitProfile, TaskBlueprint, TaskBlueprintApiResponse } from '../types/legal';
import type { LegalSearchResult } from '../types/legal-search';
import type { ReplayApiResponse, ReplayWorkspace } from '../types/replay';

const DEFAULT_HTTP_BASE = 'http://127.0.0.1:7788';
const REPLAY_API_PATH = '/api/nae-deep-research/v1/replay/workspaces';
const DEMO_OVERVIEW_API_PATH = '/api/nae-deep-research/v1/demo/overview';
const DEMO_RUNTIME_STATUS_API_PATH = '/api/nae-deep-research/v1/demo/runtime-status';
const LEGAL_TOOLKIT_API_PATH = '/api/nae-deep-research/v1/demo/legal-capabilities';
const LEGAL_TASK_BLUEPRINT_API_PATH = '/api/nae-deep-research/v1/demo/task-blueprint';
const AGENT_ROUTING_API_PATH = '/api/nae-deep-research/v1/demo/agent-routing';
const REVIEW_RESULT_API_PATH = '/api/nae-deep-research/v1/demo/review-result';
const REPORT_SUMMARY_API_PATH = '/api/nae-deep-research/v1/demo/report-summary';
const PROFILE_ANALYSIS_API_PATH = '/api/nae-deep-research/v1/demo/profile-analysis';
const TOOLCHAIN_STATUS_API_PATH = '/api/nae-deep-research/v1/demo/toolchain-status';
const ANALYTICS_OVERVIEW_API_PATH = '/api/nae-deep-research/v1/demo/analytics-overview';
const WORKFLOW_CONFIG_API_PATH = '/api/nae-deep-research/v1/demo/workflow-config';
const AGENT_REGISTRY_API_PATH = '/api/nae-deep-research/v1/demo/agent-registry';
const PERFORMANCE_BENCHMARK_API_PATH = '/api/nae-deep-research/v1/demo/performance-benchmark';
const KNOWLEDGE_CRAWL_SEEDS_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/crawl/seeds';
const KNOWLEDGE_CRAWL_RUN_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/crawl/run';
const KNOWLEDGE_CRAWL_STATUS_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/crawl/status';
const KNOWLEDGE_CRAWL_SCHEDULE_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/crawl/schedule';
const KNOWLEDGE_CRAWL_RUN_SCHEDULED_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/crawl/run-scheduled';
const KNOWLEDGE_SEED_IMPORT_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/seed/import';
const KNOWLEDGE_INGEST_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/ingest';
const KNOWLEDGE_INGEST_UPLOAD_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/ingest/upload';
const KNOWLEDGE_VECTOR_STATS_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/vector/stats';
const KNOWLEDGE_VECTOR_ITEMS_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/vector/items';
const KNOWLEDGE_LIBRARY_SUMMARY_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/libraries/summary';
const KNOWLEDGE_STATUTE_DOCUMENTS_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/statutes/documents';
const KNOWLEDGE_BOOTSTRAP_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/bootstrap';
const KNOWLEDGE_CONFIG_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/config';
const KNOWLEDGE_CONTRACT_PACK_API_PATH = '/api/nae-deep-research/v1/demo/knowledge/seed/contract-pack';
const LEGAL_SEARCH_API_PATH = '/api/nae-deep-research/v1/demo/legal-search';
const GENERATE_DOCUMENT_API_PATH = '/api/nae-deep-research/v1/demo/generate-document';
const CONTRACT_CATALOG_API_PATH = '/api/nae-deep-research/v1/demo/contract/catalog';
const CONTRACT_GENERATE_API_PATH = '/api/nae-deep-research/v1/demo/contract/documents/generate';
const ADMIN_SETTINGS_API_PATH = '/api/nae-deep-research/v1/demo/admin/settings';
const AUDIT_LOG_API_PATH = '/api/nae-deep-research/v1/demo/audit-log';
const EXECUTION_SNAPSHOT_API_PATH = '/api/nae-deep-research/v1/demo/execution-snapshot';
const MATERIAL_LIBRARY_API_PATH = '/api/nae-deep-research/v1/demo/material-library';
const DEMO_RESET_API_PATH = '/api/nae-deep-research/v1/demo/reset-runtime';
const UPLOAD_API_PATH = '/api/nae-deep-research/v1/upload/files';

function resolveBaseUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_HTTP_BASE;
  }

  if (window.location.port === '5174' || window.location.port === '5175') {
    return window.location.origin;
  }

  return window.location.origin;
}

export function buildApiUrl(path: string): string {
  return `${resolveBaseUrl()}${path}`;
}

export async function fetchReplayWorkspaces(): Promise<ReplayWorkspace[]> {
  const response = await fetch(buildApiUrl(REPLAY_API_PATH));
  if (!response.ok) {
    throw new Error(`历史记录加载失败: ${response.status}`);
  }

  const payload = (await response.json()) as ReplayApiResponse;
  if (payload.code !== 0 || !payload.data) {
    return [];
  }

  return payload.data;
}

export async function fetchDemoOverview(): Promise<DemoOverview | null> {
  const response = await fetch(buildApiUrl(DEMO_OVERVIEW_API_PATH));
  if (!response.ok) {
    throw new Error(`概览信息加载失败: ${response.status}`);
  }

  const payload = (await response.json()) as DemoOverviewApiResponse;
  if (payload.code !== 0 || !payload.data) {
    return null;
  }

  return payload.data;
}

export async function uploadFiles(
  fileList: File[],
  meta?: { userAccount?: string; taskId?: string; taskTitle?: string },
): Promise<UploadedFileInfo[]> {
  if (fileList.length === 0) {
    return [];
  }

  const formData = new FormData();
  fileList.forEach((file) => formData.append('files', file));
  if (meta?.userAccount) formData.append('user_account', meta.userAccount);
  if (meta?.taskId) formData.append('task_id', meta.taskId);
  if (meta?.taskTitle) formData.append('task_title', meta.taskTitle);

  const response = await fetch(buildApiUrl(UPLOAD_API_PATH), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`材料上传失败: ${response.status}`);
  }

  const payload = (await response.json()) as {
    code: number;
    data?: { upload_id: string; files: Array<{ filename: string; size_mb?: number }> };
    message?: string;
  };

  if (payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '材料上传失败');
  }

  return payload.data.files.map((file) => ({
    uploadId: payload.data!.upload_id,
    filename: file.filename,
    sizeMb: file.size_mb,
  }));
}

async function fetchDemoJson<T>(path: string): Promise<T | null> {
  const response = await fetch(buildApiUrl(path));
  if (!response.ok) return null;
  const payload = (await response.json()) as { code: number; data?: T };
  if (payload.code !== 0 || !payload.data) return null;
  return payload.data;
}

export async function fetchMaterialLibrary(params?: {
  user?: string;
  task?: string;
  includeProcess?: boolean;
}): Promise<MaterialLibrary | null> {
  const query = new URLSearchParams();
  if (params?.user) query.set('user', params.user);
  if (params?.task) query.set('task', params.task);
  if (params?.includeProcess) query.set('include_process', 'true');
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return fetchDemoJson<MaterialLibrary>(`${MATERIAL_LIBRARY_API_PATH}${suffix}`);
}

export async function registerMaterialTask(payload: MaterialTaskRegistration): Promise<boolean> {
  const response = await fetch(buildApiUrl(`${MATERIAL_LIBRARY_API_PATH}/register-task`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return false;
  const body = (await response.json()) as { code: number };
  return body.code === 0;
}

export async function resetDemoMaterials(): Promise<{ removedUploads: number; removedWorkspaces: number } | null> {
  const response = await fetch(buildApiUrl(DEMO_RESET_API_PATH), { method: 'POST' });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    code: number;
    data?: { removedUploads: number; removedWorkspaces: number };
  };
  if (payload.code !== 0 || !payload.data) return null;
  return payload.data;
}

export async function fetchDemoRuntimeStatus(): Promise<DemoRuntimeStatus | null> {
  const response = await fetch(buildApiUrl(DEMO_RUNTIME_STATUS_API_PATH));
  if (!response.ok) {
    throw new Error(`运行状态加载失败: ${response.status}`);
  }

  const payload = (await response.json()) as DemoRuntimeStatusApiResponse;
  if (payload.code !== 0 || !payload.data) {
    return null;
  }

  return payload.data;
}

export async function fetchLegalToolkit(): Promise<LegalToolkitProfile | null> {
  const response = await fetch(buildApiUrl(LEGAL_TOOLKIT_API_PATH));
  if (!response.ok) {
    throw new Error(`法律能力配置加载失败: ${response.status}`);
  }

  const payload = (await response.json()) as LegalToolkitApiResponse;
  if (payload.code !== 0 || !payload.data) {
    return null;
  }

  return payload.data;
}

export async function createTaskBlueprint(payload: {
  scenario?: string;
  description: string;
}): Promise<TaskBlueprint | null> {
  const response = await fetch(buildApiUrl(LEGAL_TASK_BLUEPRINT_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`任务拆解预览生成失败: ${response.status}`);
  }

  const data = (await response.json()) as TaskBlueprintApiResponse;
  if (data.code !== 0 || !data.data) {
    return null;
  }

  return data.data;
}

export async function fetchAgentRouting(payload: {
  scenario?: string;
  description: string;
}): Promise<AgentRoutingState | null> {
  const response = await fetch(buildApiUrl(AGENT_ROUTING_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as AgentRoutingApiResponse;
  if (data.code !== 0 || !data.data) return null;
  return data.data;
}

export async function fetchReviewResult(workspace?: string): Promise<ReviewResult | null> {
  const query = workspace ? `?workspace=${encodeURIComponent(workspace)}` : '';
  return fetchDemoJson<ReviewResult>(`${REVIEW_RESULT_API_PATH}${query}`);
}

export async function fetchAuditLog(workspace?: string): Promise<AuditLog | null> {
  const query = workspace ? `?workspace=${encodeURIComponent(workspace)}` : '';
  return fetchDemoJson<AuditLog>(`${AUDIT_LOG_API_PATH}${query}`);
}

export async function fetchReportSummary(): Promise<ReportSummary | null> {
  return fetchDemoJson<ReportSummary>(REPORT_SUMMARY_API_PATH);
}

export async function fetchProfileAnalysis(): Promise<ProfileAnalysis | null> {
  return fetchDemoJson<ProfileAnalysis>(PROFILE_ANALYSIS_API_PATH);
}

export async function fetchToolchainStatus(): Promise<ToolchainStatus | null> {
  return fetchDemoJson<ToolchainStatus>(TOOLCHAIN_STATUS_API_PATH);
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview | null> {
  return fetchDemoJson<AnalyticsOverview>(ANALYTICS_OVERVIEW_API_PATH);
}

export async function fetchWorkflowConfig(): Promise<WorkflowConfig | null> {
  return fetchDemoJson<WorkflowConfig>(WORKFLOW_CONFIG_API_PATH);
}

export async function fetchAgentRegistry(): Promise<AgentRegistry | null> {
  return fetchDemoJson<AgentRegistry>(AGENT_REGISTRY_API_PATH);
}

export async function fetchExecutionSnapshot(workspacePath: string): Promise<ExecutionSnapshot | null> {
  const url = `${buildApiUrl(EXECUTION_SNAPSHOT_API_PATH)}?workspace=${encodeURIComponent(workspacePath)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: ExecutionSnapshot };
  if (data.code !== 0 || !data.data) return null;
  return { ...data.data, source: 'replay' };
}

export async function fetchPerformanceBenchmark(): Promise<PerformanceBenchmark | null> {
  return fetchDemoJson<PerformanceBenchmark>(PERFORMANCE_BENCHMARK_API_PATH);
}

export async function runKnowledgeCrawl(payload: {
  seedIds?: string[];
  keywords?: string[];
  dryRun?: boolean;
}): Promise<Record<string, unknown> | null> {
  const response = await fetch(buildApiUrl(KNOWLEDGE_CRAWL_RUN_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seedIds: payload.seedIds ?? [],
      keywords: payload.keywords ?? [],
      dryRun: payload.dryRun ?? false,
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: Record<string, unknown> };
  return data.code === 0 ? data.data ?? null : null;
}

export async function importKnowledgeSeedBundle(): Promise<Record<string, unknown> | null> {
  const response = await fetch(buildApiUrl(KNOWLEDGE_SEED_IMPORT_API_PATH), { method: 'POST' });
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: Record<string, unknown> };
  return data.code === 0 ? data.data ?? null : null;
}

export async function fetchKnowledgeCrawlSeeds(): Promise<Record<string, unknown> | null> {
  return fetchDemoJson<Record<string, unknown>>(KNOWLEDGE_CRAWL_SEEDS_API_PATH);
}

export type KnowledgeCrawlScheduleStatus = {
  enabled: boolean;
  weekday: number;
  hour: number;
  minute: number;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  lastRunSummary?: Record<string, unknown> | null;
  nextRunAt?: string | null;
  running?: boolean;
  seenBbbsCount?: number;
  lastTaskBackfill?: Record<string, unknown> | null;
};

export async function fetchKnowledgeCrawlStatus(): Promise<KnowledgeCrawlScheduleStatus | null> {
  return fetchDemoJson<KnowledgeCrawlScheduleStatus>(KNOWLEDGE_CRAWL_STATUS_API_PATH);
}

export async function updateKnowledgeCrawlSchedule(enabled: boolean): Promise<KnowledgeCrawlScheduleStatus | null> {
  const response = await fetch(buildApiUrl(KNOWLEDGE_CRAWL_SCHEDULE_API_PATH), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: KnowledgeCrawlScheduleStatus };
  return data.code === 0 ? data.data ?? null : null;
}

export async function triggerScheduledKnowledgeCrawl(): Promise<KnowledgeCrawlScheduleStatus | null> {
  const response = await fetch(buildApiUrl(KNOWLEDGE_CRAWL_RUN_SCHEDULED_API_PATH), { method: 'POST' });
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: KnowledgeCrawlScheduleStatus };
  return data.code === 0 ? data.data ?? null : null;
}

export async function fetchKnowledgeVectorStats(): Promise<Record<string, unknown> | null> {
  return fetchDemoJson<Record<string, unknown>>(KNOWLEDGE_VECTOR_STATS_API_PATH);
}

export type KnowledgeVectorItem = {
  id: string;
  title: string;
  chunkTitle?: string;
  snippet: string;
  content: string;
  metadata?: Record<string, unknown>;
  collection: string;
  tags?: string[];
  source?: string;
  score?: number;
};

export type KnowledgeVectorItemsResponse = {
  available: boolean;
  items: KnowledgeVectorItem[];
  total: number;
  offset: number;
  limit: number;
  mode: 'browse' | 'search';
  error?: string;
};

export type KnowledgeLibrarySummary = {
  available: boolean;
  lawDocuments: number;
  lawArticles: number;
  templates: number;
  rules: number;
  cases: number;
};

export type StatuteDocument = {
  bbbs: string;
  lawName: string;
  articleCount: number;
  source: string;
  sourceUrl?: string;
  tags?: string[];
};

export async function fetchKnowledgeLibrarySummary(): Promise<KnowledgeLibrarySummary | null> {
  return fetchDemoJson<KnowledgeLibrarySummary>(KNOWLEDGE_LIBRARY_SUMMARY_API_PATH);
}

export async function fetchStatuteDocuments(params?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ documents: StatuteDocument[]; total: number } | null> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set('q', params.q.trim());
  search.set('limit', String(params?.limit ?? 20));
  search.set('offset', String(params?.offset ?? 0));
  const data = await fetchDemoJson<{ documents: StatuteDocument[]; total: number }>(
    `${KNOWLEDGE_STATUTE_DOCUMENTS_API_PATH}?${search.toString()}`,
  );
  return data;
}

export async function fetchStatuteArticles(
  bbbs: string,
  params?: { q?: string; limit?: number; offset?: number },
): Promise<{ lawName: string; items: KnowledgeVectorItem[]; total: number } | null> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set('q', params.q.trim());
  search.set('limit', String(params?.limit ?? 20));
  search.set('offset', String(params?.offset ?? 0));
  const data = await fetchDemoJson<{ lawName: string; items: KnowledgeVectorItem[]; total: number }>(
    `/api/nae-deep-research/v1/demo/knowledge/statutes/documents/${encodeURIComponent(bbbs)}/articles?${search.toString()}`,
  );
  return data;
}

export async function bootstrapKnowledge(): Promise<{
  imported: boolean;
  libraries?: KnowledgeLibrarySummary;
} | null> {
  const response = await fetch(buildApiUrl(KNOWLEDGE_BOOTSTRAP_API_PATH), { method: 'POST' });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    code: number;
    data?: { imported: boolean; libraries?: KnowledgeLibrarySummary };
  };
  return data.code === 0 ? data.data ?? null : null;
}

export type KnowledgeConfig = {
  chromaPersistDir: string;
  available: boolean;
  libraries: KnowledgeLibrarySummary;
  contractReadiness: {
    ready: boolean;
    templates: number;
    cases: number;
    lawArticles: number;
  };
  recommendedSteps: Array<{ id: string; label: string; status: 'done' | 'pending' }>;
  collections: Array<{ id: string; label: string; role: string }>;
};

export async function fetchKnowledgeConfig(): Promise<KnowledgeConfig | null> {
  return fetchDemoJson<KnowledgeConfig>(KNOWLEDGE_CONFIG_API_PATH);
}

export async function importContractSeedPack(): Promise<{
  import?: { templates?: number; knowledge?: number; total_items?: number };
  libraries?: KnowledgeLibrarySummary;
} | null> {
  const response = await fetch(buildApiUrl(KNOWLEDGE_CONTRACT_PACK_API_PATH), { method: 'POST' });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    code: number;
    data?: { import?: { templates?: number; knowledge?: number; total_items?: number }; libraries?: KnowledgeLibrarySummary };
  };
  return data.code === 0 ? data.data ?? null : null;
}

export async function fetchKnowledgeVectorItems(params: {
  collection: KnowledgeIngestCollection;
  limit?: number;
  offset?: number;
  q?: string;
  tag?: string;
  kind?: 'rule' | 'case';
}): Promise<KnowledgeVectorItemsResponse | null> {
  const search = new URLSearchParams();
  search.set('collection', params.collection);
  search.set('limit', String(params.limit ?? 15));
  search.set('offset', String(params.offset ?? 0));
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.tag?.trim()) search.set('tag', params.tag.trim());
  if (params.kind) search.set('kind', params.kind);
  return fetchDemoJson<KnowledgeVectorItemsResponse>(`${KNOWLEDGE_VECTOR_ITEMS_API_PATH}?${search.toString()}`);
}

export type KnowledgeIngestCollection = 'statutes' | 'templates' | 'knowledge';

export async function ingestKnowledgeText(payload: {
  title: string;
  content: string;
  collection?: KnowledgeIngestCollection;
  tags?: string[];
}): Promise<Record<string, unknown> | null> {
  const response = await fetch(buildApiUrl(KNOWLEDGE_INGEST_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: Record<string, unknown>; msg?: string };
  return data.code === 0 ? data.data ?? null : null;
}

export async function ingestKnowledgeFiles(
  files: File[],
  collection: KnowledgeIngestCollection,
  tags?: string[],
): Promise<{ ingested?: number; failed?: number; results?: Array<Record<string, unknown>>; errors?: string[] } | null> {
  if (files.length === 0) return null;

  const formData = new FormData();
  formData.append('collection', collection);
  if (tags && tags.length > 0) {
    formData.append('tags', tags.join(','));
  }
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(buildApiUrl(KNOWLEDGE_INGEST_UPLOAD_API_PATH), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    code: number;
    data?: { ingested?: number; failed?: number; results?: Array<Record<string, unknown>>; errors?: string[] };
  };
  return data.code === 0 ? data.data ?? null : null;
}

export async function legalSearch(query: string, limit = 5): Promise<LegalSearchResult | null> {
  const response = await fetch(buildApiUrl(LEGAL_SEARCH_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: LegalSearchResult };
  return data.code === 0 ? data.data ?? null : null;
}

export async function generateDocumentViaApi(payload: {
  templateId: string;
  caseFacts: string;
  extraInstructions?: string;
  useResearch?: boolean;
  exportFormat?: 'md' | 'docx' | 'pdf';
}): Promise<Record<string, unknown> | null> {
  const response = await fetch(buildApiUrl(GENERATE_DOCUMENT_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: Record<string, unknown>; msg?: string };
  if (data.code !== 0) throw new Error(data.msg || '文书生成失败');
  return data.data ?? null;
}

export type ContractDocumentCatalogItem = {
  id: string;
  label: string;
  description: string;
  category: string;
  recommended?: boolean;
};

export async function fetchContractDocumentCatalog(): Promise<{
  documents: ContractDocumentCatalogItem[];
  llmConfigured: boolean;
} | null> {
  return fetchDemoJson<{ documents: ContractDocumentCatalogItem[]; llmConfigured: boolean }>(
    CONTRACT_CATALOG_API_PATH,
  );
}

export async function generateContractDocumentViaApi(payload: {
  templateId: string;
  contractType?: string;
  partyA?: string;
  partyB?: string;
  subjectMatter?: string;
  keyClauses?: string;
  contractExcerpt?: string;
  materialNotes?: string;
  userGoal?: string;
  extraInstructions?: string;
  useResearch?: boolean;
  exportFormat?: 'md' | 'docx' | 'pdf';
}): Promise<Record<string, unknown> | null> {
  const response = await fetch(buildApiUrl(CONTRACT_GENERATE_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { code: number; data?: Record<string, unknown>; msg?: string };
  if (data.code !== 0) throw new Error(data.msg || '合同文书生成失败');
  return data.data ?? null;
}

export type AdminSettingsPayload = AdminSettings & {
  runtime?: {
    modelsApplied?: number;
    apisApplied?: number;
    mcpToolCount?: number;
    effective?: boolean;
    updatedAt?: string | null;
  };
};

export async function fetchAdminSettingsFromServer(): Promise<AdminSettingsPayload | null> {
  const response = await fetch(buildApiUrl(ADMIN_SETTINGS_API_PATH));
  if (!response.ok) return null;
  const payload = (await response.json()) as { code: number; data?: AdminSettingsPayload };
  return payload.code === 0 ? payload.data ?? null : null;
}

export async function saveAdminSettingsToServer(settings: Partial<AdminSettings>): Promise<AdminSettingsPayload | null> {
  const response = await fetch(buildApiUrl(ADMIN_SETTINGS_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { code: number; data?: AdminSettingsPayload; message?: string };
  if (payload.code !== 0) {
    throw new Error(payload.message || '管理端配置保存失败');
  }
  return payload.data ?? null;
}

export type AdminSettingsTestResult = {
  allOk: boolean;
  models: Array<{ label: string; ok: boolean; detail: string }>;
  apis: Array<{ id: string; label: string; ok: boolean; detail: string }>;
  mcpTools: Array<{ skill_name: string; ok: boolean; detail: string }>;
  summary: {
    modelPass: number;
    modelTotal: number;
    apiPass: number;
    apiTotal: number;
    mcpPass: number;
    mcpTotal: number;
  };
};

export async function testAdminSettingsConnection(settings?: Partial<AdminSettings>): Promise<AdminSettingsTestResult | null> {
  const response = await fetch(buildApiUrl(`${ADMIN_SETTINGS_API_PATH}/test`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings ?? {}),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { code: number; data?: AdminSettingsTestResult; message?: string };
  if (payload.code !== 0) {
    throw new Error(payload.message || '连接测试失败');
  }
  return payload.data ?? null;
}
