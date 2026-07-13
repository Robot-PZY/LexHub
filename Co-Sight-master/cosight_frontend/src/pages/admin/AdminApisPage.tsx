import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Database, FileOutput, Globe, KeyRound, Plus, Save, ScanLine, Search, Trash2 } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { API_CONFIG_GUIDANCE, type ApiIntegrationType, type ApiProviderConfig, type McpToolConfig } from '../../types/admin-config';

const integrationMeta: Record<ApiIntegrationType, { label: string; icon: typeof Search }> = {
  ocr_service: { label: 'OCR 服务', icon: ScanLine },
  search_api: { label: '检索服务', icon: Search },
  export_pipeline: { label: '导出管线', icon: FileOutput },
  vector_rag: { label: '向量 RAG', icon: Database },
  rest_api: { label: 'REST 接口', icon: Globe },
};

const categoryOrder = ['材料处理', '法律研究', '公开资料', '结果交付', '知识增强'];

const apiProviderPresets: Record<string, Array<{ id: string; label: string; endpoint: string }>> = {
  ocr: [
    { id: 'manual', label: '手动填写', endpoint: '' },
    { id: 'paddle-local', label: 'PaddleOCR 本地服务', endpoint: 'http://127.0.0.1:8866/ocr' },
    { id: 'baidu-ocr', label: '百度智能云 OCR', endpoint: 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic' },
    { id: 'aliyun-ocr', label: '阿里云 OCR', endpoint: 'https://ocr-api.cn-hangzhou.aliyuncs.com' },
  ],
  legal_search: [
    { id: 'delilegal', label: '得理法律开放平台（推荐）', endpoint: 'https://openapi.delilegal.com' },
    { id: 'law-db', label: '自建法规检索 API', endpoint: '' },
  ],
  web_search: [
    { id: 'manual', label: '手动填写', endpoint: '' },
    { id: 'tavily', label: 'Tavily Search', endpoint: '' },
    { id: 'serpapi', label: 'SerpAPI', endpoint: 'https://serpapi.com/search' },
  ],
  export: [
    { id: 'local-docx', label: '本地 DOCX/PDF 导出', endpoint: '' },
    { id: 'external-export', label: '第三方导出流水线', endpoint: '' },
  ],
  vector_rag: [
    { id: 'chroma-local', label: '本地 Chroma 知识库（推荐）', endpoint: './chroma_lexhub' },
    { id: 'external-vector', label: '外部向量库', endpoint: '' },
  ],
  contract_review_external: [
    { id: 'baidu-textreview', label: '百度 TextReview', endpoint: 'https://aip.baidubce.com' },
    { id: 'external-review', label: '第三方合同审查 API', endpoint: '' },
  ],
  contract_documents: [
    { id: 'internal-llm', label: '内置 LLM + 模板 RAG（推荐）', endpoint: '' },
    { id: 'explinks', label: '幂简合同生成 API', endpoint: 'https://openapi.explinks.com' },
  ],
  clause_library: [
    { id: 'internal-clause', label: '内部条款库', endpoint: '' },
    { id: 'external-clause', label: '第三方条款库', endpoint: '' },
  ],
  contract_compare: [
    { id: 'internal-compare', label: '内部版本比对', endpoint: '' },
    { id: 'external-compare', label: '第三方比对 API', endpoint: '' },
  ],
  compliance_screen: [
    { id: 'internal-compliance', label: '内部合规规则', endpoint: '' },
    { id: 'external-compliance', label: '第三方合规引擎', endpoint: '' },
  ],
};

function AdminApisPage() {
  const { settings, saveSettings, savedHint } = useAdminSettings();
  const [draft, setDraft] = useState<ApiProviderConfig[]>(settings.apis);
  const [mcpDraft, setMcpDraft] = useState<McpToolConfig[]>(settings.mcpTools ?? []);

  useEffect(() => {
    setDraft(settings.apis);
    setMcpDraft(settings.mcpTools ?? []);
  }, [settings.apis, settings.mcpTools]);

  const updateDraft = (id: string, patch: Partial<ApiProviderConfig>) => {
    setDraft((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const applyApiPreset = (id: string, presetId: string) => {
    const preset = (apiProviderPresets[id] ?? []).find((item) => item.id === presetId);
    if (!preset) return;
    updateDraft(id, {
      providerId: preset.id,
      ...(preset.endpoint ? { endpoint: preset.endpoint } : {}),
    });
  };

  const grouped = useMemo(() => (
    categoryOrder
      .map((category) => ({
        category,
        items: draft.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0)
  ), [draft]);

  const readyCount = draft.filter((item) => item.enabled && item.apiKey).length;
  const enabledCount = draft.filter((item) => item.enabled).length;
  const mcpCount = mcpDraft.length;

  return (
    <AdminShell title="服务管理" subtitle="配置 OCR、检索、导出与知识增强等外部能力。">
      <PageHeader
        icon={KeyRound}
        title="外部服务管理"
        subtitle="外部能力按类型独立配置：OCR 处理图像材料，检索服务对接法规库，知识增强接入本地知识库。"
        action={<button type="button" className="btn btn-primary" onClick={() => saveSettings({ apis: draft, mcpTools: mcpDraft })}><Save size={16} />保存配置</button>}
      />

      {savedHint && <div className="admin-save-hint">{savedHint}</div>}
      <p className="admin-form-desc">得理法律检索服务可填 `appid|secret`；联网搜索填服务商密钥。保存后下一次事项办理生效。</p>

      <section className="admin-config-hero admin-apis-hero" aria-label="服务接入台">
        <div className="admin-config-hero-copy">
          <p className="eyebrow">SERVICE ROUTING</p>
          <h2>把外部能力接入法律事项办理链路。</h2>
          <p>
            OCR、法律检索、知识增强和导出服务分别支撑材料处理、依据检索、风险复核与文书交付；本页只维护接入位和扩展能力。
          </p>
          <div className="admin-config-hero-badges">
            <Badge tone="primary" icon={<KeyRound size={13} />}>服务接入</Badge>
            <Badge tone="success" icon={<CheckCircle2 size={13} />}>{readyCount}/{draft.length} 已就绪</Badge>
          </div>
        </div>
        <div className="admin-config-hero-metrics">
          <article>
            <span>就绪服务</span>
            <strong>{readyCount}</strong>
            <em>已启用且配置密钥</em>
          </article>
          <article>
            <span>启用能力</span>
            <strong>{enabledCount}</strong>
            <em>参与办理链路</em>
          </article>
          <article>
            <span>服务位</span>
            <strong>{draft.length}</strong>
            <em>OCR · 检索 · 导出</em>
          </article>
          <article>
            <span>扩展能力</span>
            <strong>{mcpCount}</strong>
            <em>本地 MCP 工具</em>
          </article>
        </div>
      </section>

      <section className="admin-runtime-banner">
        <article>
          <strong>{readyCount}</strong>
          <span>服务已就绪</span>
        </article>
        <article>
          <strong>{enabledCount}</strong>
          <span>已启用能力</span>
        </article>
        <article>
          <strong>{draft.length}</strong>
          <span>服务位总数</span>
        </article>
      </section>

      {grouped.map((group) => (
        <section key={group.category} className="admin-config-section">
          <div className="admin-config-section-head">
            <div>
              <h3>{group.category}</h3>
              <p>该分类下的外部服务可独立启用，并与上方模型能力联动。</p>
            </div>
          </div>

          <div className="admin-api-tool-grid">
            {group.items.map((api) => {
              const meta = integrationMeta[api.integrationType];
              const Icon = meta.icon;
              const guidance = API_CONFIG_GUIDANCE[api.id];
              const presets = apiProviderPresets[api.id] ?? [];
              return (
                <article key={api.id} className="ds-card admin-api-tool-card">
                  <div className="admin-api-tool-head">
                    <div className="admin-capability-title">
                      <span className="admin-capability-icon admin-capability-icon-api">
                        <Icon size={18} />
                      </span>
                      <div>
                        <strong>{api.name}</strong>
                        <span>{meta.label}</span>
                      </div>
                    </div>
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={api.enabled}
                        onChange={(event) => updateDraft(api.id, { enabled: event.target.checked })}
                      />
                      <span>{api.enabled ? '启用' : '停用'}</span>
                    </label>
                  </div>

                  <p className="admin-form-desc">{api.purpose}</p>

                  {api.dependsOn && api.dependsOn.length > 0 && (
                    <div className="admin-api-depends">
                      <span>联动角色</span>
                      {api.dependsOn.map((dep) => (
                        <em key={dep}>{dep}</em>
                      ))}
                    </div>
                  )}

                  {presets.length > 0 && (
                    <label className="admin-field">
                      <span>服务商 / 预设</span>
                      <select
                        value={api.providerId || presets[0].id}
                        onChange={(event) => applyApiPreset(api.id, event.target.value)}
                      >
                        {presets.map((preset) => (
                          <option key={preset.id} value={preset.id}>{preset.label}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  {guidance && (
                    <div className="admin-config-guidance">
                      <strong>配置提示</strong>
                      <span>{guidance.hint}</span>
                    </div>
                  )}

                  <label className="admin-field">
                    <span>访问密钥</span>
                    <input
                      type="password"
                      value={api.apiKey}
                      onChange={(event) => updateDraft(api.id, { apiKey: event.target.value })}
                      placeholder={guidance?.keyPlaceholder ?? '输入服务商访问密钥'}
                    />
                  </label>

                  <label className="admin-field">
                    <span>接口地址 / Endpoint</span>
                    <input
                      value={api.endpoint}
                      onChange={(event) => updateDraft(api.id, { endpoint: event.target.value })}
                      placeholder={guidance?.endpointPlaceholder ?? 'https://api.provider.com/v1/...'}
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="admin-config-section">
        <div className="admin-config-section-head">
          <div>
            <h3>自定义扩展能力</h3>
            <p>注册本地扩展服务能力，保存后下一次事项办理时加载。</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setMcpDraft((current) => ([
              ...current,
              {
                skill_name: `custom_tool_${current.length + 1}`,
                skill_type: 'local_mcp',
                display_name_zh: '自定义扩展能力',
                description_zh: '通过本地扩展服务暴露的外部能力',
                mcp_server_config: { command: 'python', args: ['mcp_server.py'] },
              },
            ]))}
          >
            <Plus size={16} /> 新增 MCP
          </button>
        </div>

        <div className="admin-api-tool-grid">
          {mcpDraft.map((tool, index) => (
            <article key={`${tool.skill_name}-${index}`} className="ds-card admin-api-tool-card">
              <div className="admin-api-tool-head">
                <strong>MCP #{index + 1}</strong>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setMcpDraft((current) => current.filter((_, idx) => idx !== index))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <label className="admin-field">
                <span>skill_name</span>
                <input
                  value={tool.skill_name}
                  onChange={(event) => setMcpDraft((current) => current.map((item, idx) => (
                    idx === index ? { ...item, skill_name: event.target.value } : item
                  )))}
                />
              </label>
              <label className="admin-field">
                <span>显示名称</span>
                <input
                  value={tool.display_name_zh}
                  onChange={(event) => setMcpDraft((current) => current.map((item, idx) => (
                    idx === index ? { ...item, display_name_zh: event.target.value } : item
                  )))}
                />
              </label>
              <label className="admin-field">
                <span>启动命令</span>
                <input
                  value={tool.mcp_server_config.command}
                  onChange={(event) => setMcpDraft((current) => current.map((item, idx) => (
                    idx === index ? {
                      ...item,
                      mcp_server_config: { ...item.mcp_server_config, command: event.target.value },
                    } : item
                  )))}
                />
              </label>
              <label className="admin-field">
                <span>args（逗号分隔）</span>
                <input
                  value={tool.mcp_server_config.args.join(', ')}
                  onChange={(event) => setMcpDraft((current) => current.map((item, idx) => (
                    idx === index ? {
                      ...item,
                      mcp_server_config: {
                        ...item.mcp_server_config,
                        args: event.target.value.split(',').map((part) => part.trim()).filter(Boolean),
                      },
                    } : item
                  )))}
                />
              </label>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminApisPage;
