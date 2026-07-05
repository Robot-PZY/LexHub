import {
  Bot,
  BrainCircuit,
  Database,
  Eye,
  FileCheck,
  FileOutput,
  GitCompare,
  Globe,
  Layers,
  Library,
  ScanLine,
  Search,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataSourceBadge from '../ui/DataSourceBadge';
import LoadingState from '../ui/LoadingState';
import { fetchAgentRegistry, fetchToolchainStatus } from '../../lib/api';
import { defaultAgentRegistry, mergeAgentRegistry } from '../../lib/agent-registry';
import { fetchWithFallback } from '../../lib/demo-fetch';
import { mockToolchainStatus } from '../../mocks/analytics';
import type { ToolchainStatus } from '../../types/analytics';
import type { AgentRegistry } from '../../types/agent-registry';
import type { ApiProviderConfig, ModelCapabilityType, ModelProviderConfig } from '../../types/admin-config';
import type { ApiIntegration } from '../../types/legal';

type StackTab = 'overview' | 'models' | 'apis' | 'tools';

type StackStatus = 'ready' | 'partial' | 'missing' | 'off' | 'builtin';

const MODEL_ENV_HINT: Record<string, string> = {
  planner: 'PLAN_MODEL_NAME · PLAN_API_KEY',
  vision: 'VISION_MODEL_NAME · VISION_API_KEY',
  research: 'TOOL_MODEL_NAME · ACT_MODEL_NAME',
  drafting: 'ACT_MODEL_NAME · ACT_API_KEY',
  review: 'CREDIBILITY_MODEL_NAME',
};

const CAPABILITY_META: Record<ModelCapabilityType, { label: string; icon: typeof BrainCircuit; tone: string }> = {
  text_llm: { label: '语言推理', icon: BrainCircuit, tone: 'text' },
  vision_ocr: { label: '视觉 / OCR', icon: Eye, tone: 'vision' },
  multimodal: { label: '多模态复核', icon: Layers, tone: 'multi' },
  embedding: { label: '向量嵌入', icon: Database, tone: 'text' },
};

const TOOL_CATEGORY_LABEL: Record<string, string> = {
  search: '检索',
  legal: '法律',
  code: '代码',
  document: '文档',
  export: '导出',
  trust: '审计',
};

const TOOL_CATEGORY_ORDER = ['search', 'legal', 'code', 'document', 'export', 'trust'];

const API_INTEGRATION_META = {
  ocr_service: { label: 'OCR 服务', icon: ScanLine },
  search_api: { label: '检索 API', icon: Search },
  export_pipeline: { label: '导出管线', icon: FileOutput },
  vector_rag: { label: '向量 RAG', icon: Database },
  rest_api: { label: 'REST 接口', icon: Globe },
} as const;

const API_ICON_BY_ID: Record<string, typeof ScanLine> = {
  ocr: ScanLine,
  legal_search: Search,
  contract_documents: FileCheck,
  contract_review_external: FileCheck,
  contract_review: FileCheck,
  clause_library: Library,
  contract_compare: GitCompare,
  compliance_screen: ShieldAlert,
  web_search: Globe,
  export: FileOutput,
  vector_rag: Database,
};

const API_CATEGORY_ORDER = ['材料处理', '法律研究', '合同文书', '合同审查', '公开资料', '知识增强', '结果交付'];

const AGENT_ROLE_LABEL: Record<string, string> = {
  orchestrator: '编排',
  worker: '执行',
  reviewer: '复核',
};

function StatusPill({ status, label }: { status: StackStatus; label?: string }) {
  const fallback: Record<StackStatus, string> = {
    ready: '就绪',
    partial: '部分配置',
    missing: '待配置',
    off: '停用',
    builtin: '内置',
  };
  return (
    <span className={`admin-stack-pill admin-stack-pill-${status}`}>
      <i aria-hidden />
      {label ?? fallback[status]}
    </span>
  );
}

function StackInfoStrip({ children }: { children: React.ReactNode }) {
  return <div className="admin-stack-info-strip">{children}</div>;
}

function StackSpecList({ items }: { items: Array<{ label: string; value: string; mono?: boolean }> }) {
  return (
    <dl className="admin-stack-spec-list">
      {items.map((item) => (
        <div key={item.label} className="admin-stack-spec-item">
          <dt>{item.label}</dt>
          <dd className={item.mono ? 'mono' : undefined}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StackSection({
  title,
  hint,
  count,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-stack-section">
      <div className="admin-stack-section-title">
        <div>
          <h3>{title}</h3>
          {hint && <p>{hint}</p>}
        </div>
        {count !== undefined && <em>{count}</em>}
      </div>
      {children}
    </section>
  );
}

function resolveModelStatus(model: ModelProviderConfig): StackStatus {
  if (!model.enabled) return 'off';
  const hasModel = !!model.modelName.trim();
  const hasUrl = !!model.baseUrl.trim();
  const hasKey = !!model.apiKey.trim();
  if (hasModel && hasUrl && hasKey) return 'ready';
  if (hasModel || hasUrl || hasKey) return 'partial';
  return 'missing';
}

function resolveApiStatus(api: ApiProviderConfig, env?: ApiIntegration): StackStatus {
  if (!api.enabled) return 'off';
  if (api.integrationType === 'vector_rag') {
    return api.endpoint.trim() || env?.status === 'ready' ? 'ready' : 'missing';
  }
  if (api.integrationType === 'export_pipeline') {
    return env?.status === 'ready' ? 'ready' : 'partial';
  }
  if (api.apiKey.trim()) return 'ready';
  if (env?.status === 'ready') return 'ready';
  return 'missing';
}

function envStatusLabel(env?: ApiIntegration): string {
  if (!env) return '—';
  if (env.status === 'ready') return '就绪';
  if (env.status === 'missing_key') return '缺 Key';
  return '规划中';
}

function maskSecret(value: string): string {
  if (!value.trim()) return '未填写';
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

type AdminStackOverviewProps = {
  tab: StackTab;
  models: ModelProviderConfig[];
  apis: ApiProviderConfig[];
  mcpTools: NonNullable<import('../../types/admin-config').AdminSettings['mcpTools']>;
  syncState: string;
  runtimeInfo: string | null;
};

function AdminStackOverview({
  tab,
  models,
  apis,
  mcpTools,
  syncState,
  runtimeInfo,
}: AdminStackOverviewProps) {
  const [registry, setRegistry] = useState<AgentRegistry>(defaultAgentRegistry);
  const [toolchain, setToolchain] = useState<ToolchainStatus | null>(null);
  const [registrySource, setRegistrySource] = useState<'api' | 'mock'>('mock');
  const [toolchainSource, setToolchainSource] = useState<'api' | 'mock'>('mock');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [registryResult, toolchainResult] = await Promise.all([
        fetchAgentRegistry().then((data) => ({ data, source: 'api' as const })).catch(() => ({
          data: defaultAgentRegistry,
          source: 'mock' as const,
        })),
        fetchWithFallback(fetchToolchainStatus, mockToolchainStatus),
      ]);
      if (cancelled) return;
      setRegistry(mergeAgentRegistry(registryResult.data));
      setRegistrySource(registryResult.source);
      setToolchain(toolchainResult.data);
      setToolchainSource(toolchainResult.source);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const envMap = useMemo(() => {
    const map = new Map<string, ApiIntegration>();
    toolchain?.integrations.forEach((item) => map.set(item.id, item));
    return map;
  }, [toolchain]);

  const lookupEnv = (apiId: string) => envMap.get(apiId) ?? (apiId === 'export' ? envMap.get('document_export') : undefined);

  const modelReadyCount = models.filter((item) => resolveModelStatus(item) === 'ready').length;
  const apiReadyCount = apis.filter((item) => resolveApiStatus(item, lookupEnv(item.id)) === 'ready').length;
  const envReadyCount = toolchain?.summary.ready ?? 0;

  const sortedToolCatalog = useMemo(() => (
    [...registry.toolCatalog].sort((a, b) => {
      const ai = TOOL_CATEGORY_ORDER.indexOf(a.category);
      const bi = TOOL_CATEGORY_ORDER.indexOf(b.category);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
  ), [registry.toolCatalog]);

  if (loading) {
    return <LoadingState label="加载能力栈…" />;
  }

  if (tab === 'overview') {
    return (
      <div className="admin-stack-panel">
        <div className="admin-stack-banner">
          <div>
            <strong>Co-Sight 编排 + 律枢法律智能体</strong>
            <p>
              底层由 Co-Sight Planner / Actor 驱动任务拆解与工具调用；律枢在其上注册法律智能体，
              并通过模型、API 与本地知识库扩展能力。
            </p>
          </div>
          <div className="admin-stack-banner-badges">
            <span className="ds-badge">Co-Sight</span>
            <span className="ds-badge ds-badge-primary">律枢 LexHub</span>
            <DataSourceBadge source={registrySource} />
          </div>
        </div>

        {runtimeInfo && <div className="admin-save-hint">{runtimeInfo}</div>}
        {syncState === 'local' && (
          <div className="admin-save-hint">后端未连接，状态来自本地演示数据。</div>
        )}

        <section className="admin-stack-stat-grid">
          {[
            { icon: Bot, value: registry.agents.length, label: '注册智能体' },
            { icon: BrainCircuit, value: `${modelReadyCount}/${models.length}`, label: '模型已配置' },
            { icon: Globe, value: `${apiReadyCount}/${apis.length}`, label: 'API 就绪' },
            { icon: Wrench, value: registry.toolCatalog.length, label: 'Co-Sight 工具' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="ds-card admin-stack-stat">
                <span className="admin-stack-stat-icon"><Icon size={18} /></span>
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="ds-card admin-stack-flow-card">
          <div className="admin-stack-section-title">
            <div>
              <h3>运行时能力栈</h3>
              <p>编排 → 智能体 → 模型 → 外部服务</p>
            </div>
          </div>
          <div className="admin-stack-flow">
            <div className="admin-stack-flow-layer admin-stack-flow-layer-accent">
              <em>编排层</em>
              <strong>Co-Sight Planner / Actor</strong>
              <p>DAG · 工具轨迹 · WebSocket</p>
            </div>
            <div className="admin-stack-flow-agents">
              {registry.agents.map((agent) => (
                <div key={agent.id} className={`admin-stack-flow-agent ${agent.role}`}>
                  <strong>{agent.name.replace('智能体', '')}</strong>
                  <span>{agent.triggers[0]}</span>
                </div>
              ))}
            </div>
            <div className="admin-stack-flow-footer">
              <div className="admin-stack-flow-layer">
                <em>模型层</em>
                <strong>{modelReadyCount} 项</strong>
                <p>Plan · Vision · Act · Review</p>
              </div>
              <div className="admin-stack-flow-layer">
                <em>服务层</em>
                <strong>{envReadyCount}/{toolchain?.summary.total ?? 0}</strong>
                <p>OCR · 得理 · Chroma</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (tab === 'models') {
    const groups: ModelCapabilityType[] = ['text_llm', 'vision_ocr', 'multimodal', 'embedding'];
    return (
      <div className="admin-stack-panel">
        <StackInfoStrip>
          各法律智能体对应模型位；未填写时回退到 <code>.env</code> 中的 PLAN / ACT / VISION 等变量。
        </StackInfoStrip>

        {groups.map((type) => {
          const items = models.filter((item) => item.capabilityType === type);
          if (!items.length) return null;
          const meta = CAPABILITY_META[type];
          const Icon = meta.icon;
          return (
            <StackSection key={type} title={meta.label} hint={items[0]?.description} count={items.length}>
              <div className="admin-stack-model-grid">
                {items.map((model) => {
                  const status = resolveModelStatus(model);
                  return (
                    <article key={model.id} className={`ds-card admin-stack-model-card admin-stack-model-card-${meta.tone}`}>
                      <div className="admin-stack-model-card-head">
                        <div className="admin-capability-title admin-stack-card-title">
                          <span className={`admin-capability-icon admin-capability-icon-${meta.tone} admin-stack-card-icon`}>
                            <Icon size={18} />
                          </span>
                          <div className="admin-stack-card-text">
                            <strong>{model.label}</strong>
                            <span>{model.agentName}</span>
                          </div>
                        </div>
                        <StatusPill status={status} />
                      </div>
                      <StackSpecList items={[
                        { label: '模型', value: model.modelName || '沿用 .env', mono: true },
                        { label: 'Base URL', value: model.baseUrl || '沿用 .env', mono: true },
                        { label: 'API Key', value: model.apiKey ? maskSecret(model.apiKey) : '沿用 .env', mono: true },
                        { label: '环境变量', value: MODEL_ENV_HINT[model.id] ?? '—', mono: true },
                      ]} />
                      {model.capabilities.length > 0 && (
                        <div className="admin-stack-tag-row">
                          {model.capabilities.map((cap) => (
                            <span key={cap} className="admin-stack-tag">{cap}</span>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </StackSection>
          );
        })}
      </div>
    );
  }

  if (tab === 'apis') {
    const apisByCategory = API_CATEGORY_ORDER
      .map((category) => ({
        category,
        items: apis.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);

    const renderApiCard = (api: ApiProviderConfig) => {
      const env = lookupEnv(api.id);
      const status = resolveApiStatus(api, env);
      const meta = API_INTEGRATION_META[api.integrationType] ?? API_INTEGRATION_META.rest_api;
      const Icon = API_ICON_BY_ID[api.id] ?? meta.icon;
      return (
        <article key={api.id} className={`ds-card admin-stack-api-card admin-stack-api-card-${status}`}>
          <div className="admin-stack-api-card-head">
            <div className="admin-capability-title admin-stack-card-title">
              <span className={`admin-capability-icon admin-capability-icon-api admin-stack-card-icon`}>
                <Icon size={18} />
              </span>
              <div className="admin-stack-card-text">
                <strong>{api.name}</strong>
                <span>{api.category} · {meta.label}</span>
              </div>
            </div>
            <StatusPill status={status} />
          </div>
          <p className="admin-stack-api-desc">{api.purpose}</p>
          {api.dependsOn && api.dependsOn.length > 0 && (
            <div className="admin-stack-tag-row">
              {api.dependsOn.map((dep) => (
                <span key={dep} className="admin-stack-tag admin-stack-tag-agent">{dep}</span>
              ))}
            </div>
          )}
          <StackSpecList items={[
            { label: '管理端 Key', value: api.apiKey ? maskSecret(api.apiKey) : '未填写', mono: true },
            { label: 'Endpoint', value: api.endpoint || '—', mono: true },
            { label: '.env 检测', value: envStatusLabel(env) },
          ]} />
          {env?.envKeys && env.envKeys.length > 0 && (
            <div className="admin-stack-env-keys">
              {env.envKeys.map((key) => (
                <code key={key}>{key}</code>
              ))}
            </div>
          )}
        </article>
      );
    };

    return (
      <div className="admin-stack-panel">
        <StackInfoStrip>
          律枢外部 API 对接位，含合同审查类参考集成；<code>.env 检测</code> 来自后端启动扫描。
          <DataSourceBadge source={toolchainSource} />
        </StackInfoStrip>

        {apisByCategory.map((group) => (
          <StackSection key={group.category} title={group.category} count={group.items.length}>
            <div className="admin-stack-api-list">
              {group.items.map(renderApiCard)}
            </div>
          </StackSection>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-stack-panel">
      <StackInfoStrip>
        Co-Sight Actor 工具目录（<code>agent-registry.json</code>），对应各智能体 <code>registeredTools</code>。
      </StackInfoStrip>

      <StackSection title="智能体 ↔ 工具" hint="Planner 运行时动态选择调用" count={registry.agents.length}>
        <div className="admin-stack-agent-grid">
          {registry.agents.map((agent) => (
            <article key={agent.id} className={`ds-card admin-stack-agent-card role-${agent.role}`}>
              <div className="admin-stack-agent-card-head">
                <strong>{agent.name}</strong>
                <StatusPill status="builtin" label={AGENT_ROLE_LABEL[agent.role] ?? agent.role} />
              </div>
              <span className="admin-stack-agent-model">{agent.modelLabel ?? 'Co-Sight Model'}</span>
              <div className="admin-stack-tool-pills">
                {(agent.registeredTools.length ? agent.registeredTools : ['planner_only']).map((toolId) => {
                  const entry = registry.toolCatalog.find((t) => t.id === toolId);
                  return (
                    <span key={toolId} className="admin-stack-tool-pill">
                      {entry?.label ?? (toolId === 'planner_only' ? '无外挂工具' : toolId)}
                    </span>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </StackSection>

      <StackSection title="工具目录" hint="按分类汇总" count={sortedToolCatalog.length}>
        <div className="ds-card admin-stack-catalog-card">
          <table className="admin-stack-catalog-table">
            <thead>
              <tr>
                <th>分类</th>
                <th>工具 ID</th>
                <th>名称</th>
                <th>依赖 / 说明</th>
              </tr>
            </thead>
            <tbody>
              {sortedToolCatalog.map((tool) => (
                <tr key={tool.id}>
                  <td>
                    <span className={`admin-stack-cat-badge cat-${tool.category}`}>
                      {TOOL_CATEGORY_LABEL[tool.category] ?? tool.category}
                    </span>
                  </td>
                  <td><code>{tool.id}</code></td>
                  <td className="admin-stack-catalog-name">{tool.label}</td>
                  <td className="admin-stack-catalog-desc">{tool.apiLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StackSection>

      <StackSection title="自定义 MCP" hint="config/runtime/custom_mcp_tools.json" count={mcpTools.length}>
        {mcpTools.length === 0 ? (
          <div className="admin-stack-empty">
            <Wrench size={22} />
            <strong>暂无自定义 MCP</strong>
            <p>内置工具目录已覆盖法律工作流演示，无需额外挂载。</p>
          </div>
        ) : (
          <div className="admin-stack-mcp-grid">
            {mcpTools.map((tool) => (
              <article key={tool.skill_name} className="ds-card admin-stack-mcp-card">
                <strong>{tool.display_name_zh}</strong>
                <p>{tool.description_zh}</p>
                <StackSpecList items={[
                  { label: 'skill_name', value: tool.skill_name, mono: true },
                  { label: 'command', value: tool.mcp_server_config.command, mono: true },
                  { label: 'args', value: tool.mcp_server_config.args.join(' ') || '—', mono: true },
                ]} />
              </article>
            ))}
          </div>
        )}
      </StackSection>
    </div>
  );
}

export default AdminStackOverview;
export type { StackTab };
