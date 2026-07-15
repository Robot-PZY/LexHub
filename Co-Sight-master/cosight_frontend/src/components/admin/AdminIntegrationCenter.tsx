import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CirclePower,
  Code2,
  Database,
  Eye,
  EyeOff,
  FileOutput,
  Globe2,
  KeyRound,
  Link2,
  LoaderCircle,
  Network,
  Plus,
  ScanLine,
  Search,
  ServerCog,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { testAdminSettingsConnection } from '../../lib/api';
import { isApiReady } from '../../lib/admin-readiness';
import { defaultAgentRegistry } from '../../lib/agent-registry';
import {
  API_CONFIG_GUIDANCE,
  type AdminSettings,
  type ApiIntegrationType,
  type ApiProviderConfig,
  type McpToolConfig,
} from '../../types/admin-config';

type IntegrationMode = 'apis' | 'tools';

type AdminIntegrationCenterProps = {
  mode: IntegrationMode;
  apis: ApiProviderConfig[];
  mcpTools: McpToolConfig[];
  savedHint: string;
  onSave: (patch: Partial<AdminSettings>) => void;
};

const INTEGRATION_META: Record<ApiIntegrationType, { label: string; icon: typeof Search }> = {
  ocr_service: { label: 'OCR 服务', icon: ScanLine },
  search_api: { label: '检索服务', icon: Search },
  export_pipeline: { label: '导出管线', icon: FileOutput },
  vector_rag: { label: '知识库', icon: Database },
  rest_api: { label: '业务接口', icon: Globe2 },
};

const API_PRESETS: Record<string, Array<{ id: string; label: string; endpoint: string }>> = {
  ocr: [
    { id: 'baidu-ocr', label: '百度智能云 OCR', endpoint: 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic' },
    { id: 'paddle-local', label: 'PaddleOCR 本地服务', endpoint: 'http://127.0.0.1:8866/ocr' },
    { id: 'manual', label: '自定义 OCR 接口', endpoint: '' },
  ],
  legal_search: [
    { id: 'delilegal', label: '得理法律开放平台', endpoint: 'https://openapi.delilegal.com' },
    { id: 'law-db', label: '自建法规检索服务', endpoint: '' },
  ],
  web_search: [
    { id: 'tavily', label: 'Tavily Search', endpoint: 'https://api.tavily.com/search' },
  ],
  contract_review_external: [
    { id: 'baidu-textreview', label: '百度 TextReview', endpoint: 'https://aip.baidubce.com' },
    { id: 'external-review', label: '第三方合同审查接口', endpoint: '' },
  ],
  contract_documents: [
    { id: 'internal-llm', label: '内置模型与模板库', endpoint: '' },
    { id: 'external-docs', label: '第三方文书接口', endpoint: '' },
  ],
  contract_compare: [
    { id: 'internal-compare', label: '内置合同版本比对', endpoint: '/api/demo/contract/compare' },
    { id: 'external-compare', label: '第三方文档比对接口', endpoint: '' },
  ],
  vector_rag: [
    { id: 'chroma-local', label: '本地 Chroma', endpoint: './chroma_lexhub' },
    { id: 'external-vector', label: '外部向量库', endpoint: '' },
  ],
  export: [
    { id: 'local-docx', label: '本地 DOCX / PDF 导出', endpoint: '' },
    { id: 'external-export', label: '第三方导出服务', endpoint: '' },
  ],
};

const BUILTIN_API_IDS = new Set(['contract_documents', 'contract_compare', 'vector_rag', 'export']);

const DEFAULT_MCP_SOURCE = `from mcp.server.fastmcp import FastMCP

mcp = FastMCP("LexHub Custom Tool")

@mcp.tool()
def run_tool(query: str) -> str:
    """说明工具用途、输入参数和返回结果。"""
    # 在这里编写工具逻辑，可调用数据库、内部服务或第三方 API。
    return f"已处理：{query}"

if __name__ == "__main__":
    mcp.run()
`;

function emptyTool(index: number): McpToolConfig {
  return {
    skill_name: `custom_tool_${index}`,
    skill_type: 'local_mcp',
    enabled: true,
    authorizedAgents: [],
    display_name_zh: '自定义工具',
    description_zh: '通过 MCP 服务接入的扩展处理能力。',
    source_code: DEFAULT_MCP_SOURCE,
    entry_file: `custom_tool_${index}.py`,
    mcp_server_config: { command: 'python', args: [`custom_tool_${index}.py`] },
  };
}

function AdminIntegrationCenter({ mode, apis, mcpTools, savedHint, onSave }: AdminIntegrationCenterProps) {
  const [apiDraft, setApiDraft] = useState<ApiProviderConfig | null>(null);
  const [toolDraft, setToolDraft] = useState<McpToolConfig | null>(null);
  const [originalToolId, setOriginalToolId] = useState<string | null>(null);
  const [apiCategory, setApiCategory] = useState('全部');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const drawerOpen = Boolean(apiDraft || toolDraft);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setApiDraft(null);
        setToolDraft(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const categories = useMemo(() => ['全部', ...Array.from(new Set(apis.map((item) => item.category)))], [apis]);
  const visibleApis = apiCategory === '全部' ? apis : apis.filter((item) => item.category === apiCategory);
  const activeApiCount = apis.filter((item) => item.enabled).length;
  const readyApiCount = apis.filter(isApiReady).length;
  const enabledTools = mcpTools.filter((item) => item.enabled !== false);
  const builtinToolCount = defaultAgentRegistry.toolCatalog.length;

  const closeDrawer = () => {
    setApiDraft(null);
    setToolDraft(null);
    setOriginalToolId(null);
    setFeedback(null);
    setShowKey(false);
  };

  const openApi = (api: ApiProviderConfig) => {
    setApiDraft({ ...api, dependsOn: [...(api.dependsOn ?? [])] });
    setToolDraft(null);
    setFeedback(null);
    setShowKey(false);
  };

  const openTool = (tool?: McpToolConfig) => {
    const next = tool ? {
      ...tool,
      source_code: tool.source_code || DEFAULT_MCP_SOURCE,
      authorizedAgents: [...(tool.authorizedAgents ?? [])],
      mcp_server_config: { ...tool.mcp_server_config, args: [...tool.mcp_server_config.args] },
    } : emptyTool(mcpTools.length + 1);
    setToolDraft(next);
    setOriginalToolId(tool?.skill_name ?? null);
    setApiDraft(null);
    setFeedback(null);
  };

  const applyApiPreset = (presetId: string) => {
    if (!apiDraft) return;
    const preset = (API_PRESETS[apiDraft.id] ?? []).find((item) => item.id === presetId);
    if (!preset) return;
    setApiDraft({ ...apiDraft, providerId: preset.id, endpoint: preset.endpoint || apiDraft.endpoint });
  };

  const testApi = async () => {
    if (!apiDraft) return;
    setTesting(true);
    setFeedback(null);
    try {
      const result = await testAdminSettingsConnection({ apis: [{ ...apiDraft, enabled: true }] });
      const row = result?.apis.find((item) => item.id === apiDraft.id);
      setFeedback({ ok: Boolean(row?.ok), text: row?.detail || '服务没有返回检测结果。' });
    } catch (error) {
      setFeedback({ ok: false, text: error instanceof Error ? error.message : '服务检测失败。' });
    } finally {
      setTesting(false);
    }
  };

  const testTool = async () => {
    if (!toolDraft) return;
    if (!toolDraft.mcp_server_config.command.trim()) {
      setFeedback({ ok: false, text: '请先填写启动命令。' });
      return;
    }
    setTesting(true);
    setFeedback(null);
    try {
      const result = await testAdminSettingsConnection({ mcpTools: [{ ...toolDraft, enabled: true }] });
      const row = result?.mcpTools.find((item) => item.skill_name === toolDraft.skill_name);
      setFeedback({ ok: Boolean(row?.ok), text: row?.detail || '工具没有返回检测结果。' });
    } catch (error) {
      setFeedback({ ok: false, text: error instanceof Error ? error.message : '工具检测失败。' });
    } finally {
      setTesting(false);
    }
  };

  const saveApi = () => {
    if (!apiDraft) return;
    if (!apiDraft.endpoint.trim() && !BUILTIN_API_IDS.has(apiDraft.id)) {
      setFeedback({ ok: false, text: '请填写服务接口地址。' });
      return;
    }
    onSave({ apis: apis.map((item) => (item.id === apiDraft.id ? apiDraft : item)) });
    closeDrawer();
  };

  const saveTool = () => {
    if (!toolDraft) return;
    if (!toolDraft.skill_name.trim() || !toolDraft.display_name_zh.trim() || !toolDraft.source_code?.trim()) {
      setFeedback({ ok: false, text: '工具 ID、名称和工具代码不能为空。' });
      return;
    }
    if (!(toolDraft.authorizedAgents?.length)) {
      setFeedback({ ok: false, text: '请至少授权一个智能体。' });
      return;
    }
    const duplicated = mcpTools.some((item) => item.skill_name === toolDraft.skill_name && item.skill_name !== originalToolId);
    if (duplicated) {
      setFeedback({ ok: false, text: '工具 ID 已存在，请换一个名称。' });
      return;
    }
    const preparedTool: McpToolConfig = {
      ...toolDraft,
      entry_file: `${toolDraft.skill_name}.py`,
      mcp_server_config: { command: 'python', args: [`${toolDraft.skill_name}.py`] },
    };
    const next = originalToolId
      ? mcpTools.map((item) => (item.skill_name === originalToolId ? preparedTool : item))
      : [...mcpTools, preparedTool];
    onSave({ mcpTools: next });
    closeDrawer();
  };

  const removeTool = () => {
    if (!toolDraft || !originalToolId) return;
    if (!window.confirm(`确认删除工具“${toolDraft.display_name_zh}”吗？`)) return;
    onSave({ mcpTools: mcpTools.filter((item) => item.skill_name !== originalToolId) });
    closeDrawer();
  };

  const toggleAgent = (agentId: string) => {
    if (!toolDraft) return;
    const current = toolDraft.authorizedAgents ?? [];
    setToolDraft({
      ...toolDraft,
      authorizedAgents: current.includes(agentId)
        ? current.filter((item) => item !== agentId)
        : [...current, agentId],
    });
  };

  return (
    <div className="admin-integration-center">
      <section className={`admin-integration-hero admin-integration-hero-${mode}`}>
        <div>
          <p className="eyebrow">{mode === 'apis' ? 'SERVICE CENTER' : 'TOOL REGISTRY'}</p>
          <h2>{mode === 'apis' ? '外部服务' : '工具与授权'}</h2>
          <p>{mode === 'apis' ? '配置材料识别、法律检索、合同处理和结果导出服务。' : '注册扩展工具，并指定可以调用它们的智能体。'}</p>
        </div>
        <div className="admin-integration-metrics">
          {mode === 'apis' ? (
            <>
              <article><strong>{readyApiCount}</strong><span>已就绪</span></article>
              <article><strong>{activeApiCount}</strong><span>已启用</span></article>
              <article><strong>{apis.length}</strong><span>服务位</span></article>
            </>
          ) : (
            <>
              <article><strong>{builtinToolCount}</strong><span>内置工具</span></article>
              <article><strong>{enabledTools.length}</strong><span>扩展工具</span></article>
              <article><strong>{defaultAgentRegistry.agents.length}</strong><span>智能体</span></article>
            </>
          )}
        </div>
      </section>

      {savedHint ? <div className="admin-save-hint" aria-live="polite"><CheckCircle2 size={16} />{savedHint}</div> : null}

      {mode === 'apis' ? (
        <>
          <div className="admin-service-filter" aria-label="服务分类">
            {categories.map((category) => (
              <button key={category} type="button" className={category === apiCategory ? 'active' : ''} aria-pressed={category === apiCategory} onClick={() => setApiCategory(category)}>
                {category}
              </button>
            ))}
          </div>
          <section className="admin-service-list" aria-label="外部服务列表">
            {visibleApis.map((api) => {
              const ready = isApiReady(api);
              const meta = INTEGRATION_META[api.integrationType];
              const Icon = meta.icon;
              return (
                <button key={api.id} type="button" className="admin-service-row" onClick={() => openApi(api)}>
                  <span className="admin-service-icon"><Icon size={20} /></span>
                  <span className="admin-service-copy">
                    <strong>{api.name}</strong>
                    <small>{api.purpose}</small>
                  </span>
                  <span className="admin-service-type">{api.category}<em>{meta.label}</em></span>
                  <span className="admin-service-endpoint">{api.endpoint || '内置处理'}</span>
                  <span className={`admin-integration-status${ready ? ' ready' : api.enabled ? ' partial' : ''}`}>
                    <i />{ready ? '已就绪' : api.enabled ? '待配置' : '已停用'}
                  </span>
                  <ChevronRight size={17} />
                </button>
              );
            })}
          </section>
        </>
      ) : (
        <>
          <section className="admin-tool-route" aria-label="工具注册流程">
            <article><span><Code2 size={19} /></span><div><strong>编写工具</strong><small>从 Python MCP 模板开始</small></div></article>
            <ChevronRight size={18} />
            <article><span><ShieldCheck size={19} /></span><div><strong>授权智能体</strong><small>限定可调用角色</small></div></article>
            <ChevronRight size={18} />
            <article><span><Network size={19} /></span><div><strong>加入任务</strong><small>下一次编排时加载</small></div></article>
          </section>

          <section className="admin-tool-section">
            <div className="admin-tool-section-head">
              <div><h3>扩展工具</h3><p>已注册的 MCP 工具会在后续任务中加载。</p></div>
              <button type="button" className="btn btn-primary" onClick={() => openTool()}><Plus size={16} />注册工具</button>
            </div>
            {mcpTools.length ? (
              <div className="admin-custom-tool-grid">
                {mcpTools.map((tool) => (
                  <button key={tool.skill_name} type="button" className="admin-custom-tool-card" onClick={() => openTool(tool)}>
                    <span className="admin-custom-tool-icon"><Code2 size={20} /></span>
                    <span className="admin-custom-tool-copy">
                      <strong>{tool.display_name_zh}</strong>
                      <code>{tool.skill_name}</code>
                      <small>{tool.description_zh}</small>
                    </span>
                    <span className="admin-custom-tool-meta">
                      <em>{tool.authorizedAgents?.length ?? 0} 个智能体</em>
                      <span className={`admin-integration-status${tool.enabled !== false ? ' ready' : ''}`}><i />{tool.enabled !== false ? '已启用' : '已停用'}</span>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="admin-tool-empty"><Wrench size={24} /><strong>还没有扩展工具</strong><p>注册后可授权给指定智能体使用。</p></div>
            )}
          </section>

          <section className="admin-tool-section">
            <div className="admin-tool-section-head"><div><h3>智能体调用关系</h3><p>内置工具与扩展工具的授权结果。</p></div></div>
            <div className="admin-agent-permission-grid">
              {defaultAgentRegistry.agents.map((agent) => {
                const custom = enabledTools.filter((tool) => tool.authorizedAgents?.includes(agent.id));
                const total = agent.registeredTools.length + custom.length;
                return (
                  <article key={agent.id}>
                    <span className="admin-agent-permission-index"><Bot size={17} /></span>
                    <div><strong>{agent.name}</strong><small>{agent.capabilities.slice(0, 2).join(' · ')}</small></div>
                    <em>{total} 项工具</em>
                    <div className="admin-agent-permission-tools">
                      {agent.registeredTools.slice(0, 3).map((toolId) => (
                        <span key={toolId}>{defaultAgentRegistry.toolCatalog.find((item) => item.id === toolId)?.label ?? toolId}</span>
                      ))}
                      {custom.map((tool) => <span key={tool.skill_name} className="custom">{tool.display_name_zh}</span>)}
                      {total === 0 ? <span>仅参与编排</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

      {drawerOpen ? (
        <div className="admin-model-drawer-backdrop" onMouseDown={(event) => {
          if (event.currentTarget === event.target) closeDrawer();
        }}>
          <aside className="admin-model-drawer admin-integration-drawer" role="dialog" aria-modal="true" aria-labelledby="integration-drawer-title">
            <header className="admin-model-drawer-header">
              <div>
                <p>{apiDraft ? '外部服务配置' : originalToolId ? '编辑扩展工具' : '注册扩展工具'}</p>
                <h2 id="integration-drawer-title">{apiDraft?.name ?? toolDraft?.display_name_zh}</h2>
              </div>
              <button type="button" aria-label="关闭" onClick={closeDrawer} autoFocus><X size={20} /></button>
            </header>

            <div className="admin-model-drawer-body">
              {apiDraft ? (
                <>
                  <fieldset className="admin-model-fieldset">
                    <legend>服务状态</legend>
                    <label className="admin-integration-toggle-row">
                      <span><CirclePower size={17} /><strong>参与任务办理</strong><small>停用后编排器不会选择此服务</small></span>
                      <input type="checkbox" checked={apiDraft.enabled} onChange={(event) => setApiDraft({ ...apiDraft, enabled: event.target.checked })} />
                    </label>
                  </fieldset>
                  <fieldset className="admin-model-fieldset">
                    <legend>接入信息</legend>
                    {(API_PRESETS[apiDraft.id] ?? []).length ? (
                      <label className="admin-model-field">
                        <span><ServerCog size={15} />服务商</span>
                        <select value={apiDraft.providerId ?? ''} onChange={(event) => applyApiPreset(event.target.value)}>
                          <option value="">选择服务商</option>
                          {(API_PRESETS[apiDraft.id] ?? []).map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                        </select>
                      </label>
                    ) : null}
                    <label className="admin-model-field">
                      <span><Link2 size={15} />接口地址</span>
                      <input value={apiDraft.endpoint} onChange={(event) => setApiDraft({ ...apiDraft, endpoint: event.target.value })} placeholder={API_CONFIG_GUIDANCE[apiDraft.id]?.endpointPlaceholder ?? 'https://api.example.com'} />
                    </label>
                    <label className="admin-model-field">
                      <span><KeyRound size={15} />访问密钥</span>
                      <span className="admin-model-secret-input">
                        <input type={showKey ? 'text' : 'password'} value={apiDraft.apiKey} onChange={(event) => setApiDraft({ ...apiDraft, apiKey: event.target.value })} placeholder={API_CONFIG_GUIDANCE[apiDraft.id]?.keyPlaceholder ?? '输入服务密钥'} />
                        <button type="button" aria-label={showKey ? '隐藏密钥' : '显示密钥'} onClick={() => setShowKey((value) => !value)}>{showKey ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                      </span>
                    </label>
                    {API_CONFIG_GUIDANCE[apiDraft.id] ? <p className="admin-model-field-note">{API_CONFIG_GUIDANCE[apiDraft.id].hint}</p> : null}
                  </fieldset>
                </>
              ) : toolDraft ? (
                <>
                  <fieldset className="admin-model-fieldset">
                    <legend>工具信息</legend>
                    <label className="admin-integration-toggle-row">
                      <span><CirclePower size={17} /><strong>启用工具</strong><small>启用后由运行时加载</small></span>
                      <input type="checkbox" checked={toolDraft.enabled !== false} onChange={(event) => setToolDraft({ ...toolDraft, enabled: event.target.checked })} />
                    </label>
                    <label className="admin-model-field"><span>工具 ID</span><input value={toolDraft.skill_name} onChange={(event) => setToolDraft({ ...toolDraft, skill_name: event.target.value.replace(/[^a-zA-Z0-9_-]/g, '_') })} placeholder="legal_tool_name" /></label>
                    <label className="admin-model-field"><span>显示名称</span><input value={toolDraft.display_name_zh} onChange={(event) => setToolDraft({ ...toolDraft, display_name_zh: event.target.value })} /></label>
                    <label className="admin-model-field"><span>功能说明</span><textarea value={toolDraft.description_zh} onChange={(event) => setToolDraft({ ...toolDraft, description_zh: event.target.value })} rows={3} /></label>
                  </fieldset>
                  <fieldset className="admin-model-fieldset admin-tool-code-fieldset">
                    <legend>Python MCP 代码</legend>
                    <div className="admin-tool-code-head">
                      <span><Code2 size={15} />{toolDraft.entry_file || `${toolDraft.skill_name || 'custom_tool'}.py`}</span>
                      <button type="button" onClick={() => setToolDraft({ ...toolDraft, source_code: DEFAULT_MCP_SOURCE })}>恢复模板</button>
                    </div>
                    <textarea
                      className="admin-tool-code-editor"
                      value={toolDraft.source_code ?? ''}
                      onChange={(event) => setToolDraft({ ...toolDraft, source_code: event.target.value })}
                      spellCheck={false}
                      aria-label="Python MCP 工具代码"
                    />
                    <p className="admin-model-field-note">保存后由后端生成独立脚本并写入工具注册表。请只添加经过审查的代码。</p>
                  </fieldset>
                  <fieldset className="admin-model-fieldset">
                    <legend>授权智能体</legend>
                    <div className="admin-agent-picker">
                      {defaultAgentRegistry.agents.map((agent) => {
                        const checked = toolDraft.authorizedAgents?.includes(agent.id) ?? false;
                        return (
                          <label key={agent.id} className={checked ? 'selected' : ''}>
                            <input type="checkbox" checked={checked} onChange={() => toggleAgent(agent.id)} />
                            <span><Bot size={16} /></span>
                            <div><strong>{agent.name}</strong><small>{agent.capabilities[0]}</small></div>
                            {checked ? <Check size={16} /> : null}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </>
              ) : null}

              {feedback ? <div className={`admin-model-test-result${feedback.ok ? ' success' : ' error'}`} role="status">{feedback.ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}{feedback.text}</div> : null}
            </div>

            <footer className="admin-model-drawer-footer admin-integration-drawer-footer">
              <div>
                {toolDraft && originalToolId ? <button type="button" className="btn btn-danger-ghost" onClick={removeTool}><Trash2 size={16} />删除</button> : null}
              </div>
              <div>
                <button type="button" className="btn btn-ghost" onClick={apiDraft ? testApi : testTool} disabled={testing}>
                  {testing ? <LoaderCircle className="spin" size={16} /> : <Wrench size={16} />}{testing ? '正在检测' : '检测连接'}
                </button>
                <button type="button" className="btn btn-primary" onClick={apiDraft ? saveApi : saveTool}>{apiDraft ? '保存配置' : originalToolId ? '保存修改' : '注册工具'}</button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default AdminIntegrationCenter;
export type { IntegrationMode };
