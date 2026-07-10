import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, Eye, Layers, Save, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import type { ModelCapabilityType, ModelProviderConfig } from '../../types/admin-config';

const capabilityMeta: Record<ModelCapabilityType, { label: string; icon: typeof BrainCircuit; tone: string }> = {
  text_llm: { label: '语言推理模型', icon: BrainCircuit, tone: 'text' },
  vision_ocr: { label: '视觉 / OCR', icon: Eye, tone: 'vision' },
  multimodal: { label: '多模态复核', icon: Layers, tone: 'multi' },
  embedding: { label: '向量嵌入', icon: Sparkles, tone: 'embed' },
};

const sectionOrder: Array<{ type: ModelCapabilityType; title: string; desc: string }> = [
  { type: 'text_llm', title: '语言推理模型', desc: '事项受理、法规研究、文书生成等文本能力。' },
  { type: 'vision_ocr', title: '视觉与 OCR 能力', desc: '合同扫描、票据识图、PDF 解析，支持材料质检。' },
  { type: 'multimodal', title: '多模态与复核', desc: '结合文本、材料与规则引擎的交叉审查能力。' },
];

const modelProviderPresets = [
  { id: 'manual', label: '手动填写', modelName: '', baseUrl: '', note: '用于接入私有网关或课堂演示环境，保存时只记录当前填写值。' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat（演示推荐）', modelName: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1', note: '适合默认演示路线，覆盖事项理解、法规研究和文书生成等文本任务。' },
  { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', modelName: 'deepseek-reasoner', baseUrl: 'https://api.deepseek.com/v1', note: '适合展示复杂推理或复核场景，可作为交叉审查智能体的备选。' },
  { id: 'qwen-plus', label: '通义千问 Qwen Plus', modelName: 'qwen-plus', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', note: '适合展示国产模型兼容接入，接口形态与 OpenAI Compatible 类似。' },
  { id: 'qwen-vl', label: '通义千问视觉 Qwen VL', modelName: 'qwen-vl-max', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', note: '适合证据质检、票据识别、扫描件理解等视觉/OCR 演示。' },
  { id: 'moonshot', label: 'Kimi / Moonshot', modelName: 'moonshot-v1-8k', baseUrl: 'https://api.moonshot.cn/v1', note: '适合长文本合同阅读、材料摘要和多轮审查说明。' },
  { id: 'zhipu', label: '智谱 GLM', modelName: 'glm-4-flash', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', note: '适合展示多供应商扩展能力，演示时可作为备用国产模型。' },
  { id: 'openai-compatible', label: 'OpenAI Compatible', modelName: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1', note: '适合说明系统兼容 OpenAI 风格 API 网关，不要求评审现场真实配置。' },
  { id: 'ollama-local', label: '本地 Ollama', modelName: 'qwen2.5:7b', baseUrl: 'http://127.0.0.1:11434/v1', note: '适合离线或内网演示，但需要本机提前启动 Ollama OpenAI 兼容服务。' },
];

function AdminModelsPage() {
  const { settings, saveSettings, savedHint } = useAdminSettings();
  const [draft, setDraft] = useState<ModelProviderConfig[]>(settings.models);

  useEffect(() => {
    setDraft(settings.models);
  }, [settings.models]);

  const updateDraft = (id: string, patch: Partial<ModelProviderConfig>) => {
    setDraft((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const applyModelPreset = (id: string, presetId: string) => {
    const preset = modelProviderPresets.find((item) => item.id === presetId);
    if (!preset) return;
    updateDraft(id, {
      providerId: preset.id,
      ...(preset.id === 'manual' ? {} : { modelName: preset.modelName, baseUrl: preset.baseUrl }),
    });
  };

  const runtimeSummary = useMemo(() => {
    const textReady = draft.filter((item) => item.capabilityType === 'text_llm' && item.enabled && item.modelName).length;
    const visionReady = draft.filter((item) => item.capabilityType === 'vision_ocr' && item.enabled && item.modelName).length;
    const multiReady = draft.filter((item) => item.capabilityType === 'multimodal' && item.enabled && item.modelName).length;
    const enabled = draft.filter((item) => item.enabled).length;
    const configured = draft.filter((item) => item.enabled && item.modelName).length;
    return { textReady, visionReady, multiReady, enabled, configured };
  }, [draft]);

  return (
    <AdminShell title="模型配置" subtitle="按能力类型配置语言模型、视觉 OCR 与多模态复核。">
      <PageHeader
        icon={SlidersHorizontal}
        title="协作角色能力配置"
        subtitle="协作角色不等于单一模型：证据质检需要 OCR/视觉模型，结论复核可结合规则引擎与多模态能力。"
        action={<button type="button" className="btn btn-primary" onClick={() => saveSettings({ models: draft })}><Save size={16} />保存配置</button>}
      />

      {savedHint && <div className="admin-save-hint">{savedHint}</div>}
      <p className="admin-form-desc">保存后将更新后端运行配置，下一次事项办理自动生效；未填写的项沿用默认配置。</p>

      <section className="admin-config-hero admin-models-hero" aria-label="模型编排台">
        <div className="admin-config-hero-copy">
          <p className="eyebrow">MODEL ORCHESTRATION</p>
          <h2>按法律办理角色配置模型能力。</h2>
          <p>
            LexHub 不把所有步骤塞给一个模型：事项规划、材料识别、法规研究、文书生成和结论复核可以分别选择更合适的模型能力。
          </p>
          <div className="admin-config-hero-badges">
            <Badge tone="primary" icon={<BrainCircuit size={13} />}>多模型编排</Badge>
            <Badge tone="success" icon={<CheckCircle2 size={13} />}>{runtimeSummary.configured}/{draft.length} 已配置</Badge>
          </div>
        </div>
        <div className="admin-config-hero-metrics">
          <article>
            <span>启用能力</span>
            <strong>{runtimeSummary.enabled}</strong>
            <em>模型配置项</em>
          </article>
          <article>
            <span>语言推理</span>
            <strong>{runtimeSummary.textReady}</strong>
            <em>事项与文书处理</em>
          </article>
          <article>
            <span>视觉 OCR</span>
            <strong>{runtimeSummary.visionReady}</strong>
            <em>材料识别</em>
          </article>
          <article>
            <span>复核能力</span>
            <strong>{runtimeSummary.multiReady}</strong>
            <em>风险交叉审查</em>
          </article>
        </div>
      </section>

      <section className="admin-runtime-banner">
        <article>
          <strong>{runtimeSummary.textReady}</strong>
          <span>语言模型已配置</span>
        </article>
        <article>
          <strong>{runtimeSummary.visionReady}</strong>
          <span>视觉 / OCR 已配置</span>
        </article>
        <article>
          <strong>{runtimeSummary.multiReady}</strong>
          <span>复核能力已配置</span>
        </article>
      </section>

      {sectionOrder.map((section) => {
        const items = draft.filter((item) => item.capabilityType === section.type);
        if (items.length === 0) return null;

        return (
          <section key={section.type} className="admin-config-section">
            <div className="admin-config-section-head">
              <div>
                <h3>{section.title}</h3>
                <p>{section.desc}</p>
              </div>
            </div>

            <div className="admin-capability-grid">
              {items.map((model) => {
                const meta = capabilityMeta[model.capabilityType];
                const Icon = meta.icon;
                const selectedPreset = modelProviderPresets.find((preset) => preset.id === (model.providerId || 'manual'));
                return (
                  <article key={model.id} className={`ds-card admin-capability-card admin-capability-card-${meta.tone}`}>
                    <div className="admin-capability-card-head">
                      <div className="admin-capability-title">
                        <span className={`admin-capability-icon admin-capability-icon-${meta.tone}`}>
                          <Icon size={18} />
                        </span>
                        <div>
                          <strong>{model.label}</strong>
                          <span>{model.agentName}</span>
                        </div>
                      </div>
                      <label className="admin-toggle">
                        <input
                          type="checkbox"
                          checked={model.enabled}
                          onChange={(event) => updateDraft(model.id, { enabled: event.target.checked })}
                        />
                        <span>{model.enabled ? '启用' : '停用'}</span>
                      </label>
                    </div>

                    <p className="admin-form-desc">{model.description}</p>

                    <div className="admin-capability-tags">
                      <em className={`admin-capability-type admin-capability-type-${meta.tone}`}>{meta.label}</em>
                      {model.capabilities.map((cap) => (
                        <span key={cap} className="admin-capability-tag">{cap}</span>
                      ))}
                    </div>

                    {model.infraNote && (
                      <p className="admin-infra-note">{model.infraNote}</p>
                    )}

                    <label className="admin-field">
                      <span>模型供应商 / 预设</span>
                      <select
                        value={model.providerId || 'manual'}
                        onChange={(event) => applyModelPreset(model.id, event.target.value)}
                      >
                        {modelProviderPresets.map((preset) => (
                          <option key={preset.id} value={preset.id}>{preset.label}</option>
                        ))}
                      </select>
                    </label>

                    {selectedPreset && (
                      <div className="admin-config-guidance">
                        <strong>{selectedPreset.label}</strong>
                        <span>{selectedPreset.note}</span>
                      </div>
                    )}

                    <label className="admin-field">
                      <span>模型名称</span>
                      <input
                        value={model.modelName}
                        onChange={(event) => updateDraft(model.id, { modelName: event.target.value })}
                        placeholder={model.capabilityType === 'vision_ocr' ? '例如：qwen-vl-max / gpt-4o / paddleocr-api' : '例如：gpt-4.1 / deepseek-chat / qwen-max'}
                      />
                    </label>

                    {model.capabilityType === 'vision_ocr' && (
                      <label className="admin-field">
                        <span>支持材料格式</span>
                        <input
                          value={model.ocrFormats ?? ''}
                          onChange={(event) => updateDraft(model.id, { ocrFormats: event.target.value })}
                          placeholder="PDF、JPG、PNG、扫描件"
                        />
                      </label>
                    )}

                    <div className="admin-field-row">
                      <label className="admin-field">
                        <span>访问密钥</span>
                        <input
                          type="password"
                          value={model.apiKey}
                          onChange={(event) => updateDraft(model.id, { apiKey: event.target.value })}
                          placeholder="输入该能力对应的访问密钥"
                        />
                      </label>
                      <label className="admin-field">
                        <span>接口地址 Base URL</span>
                        <input
                          value={model.baseUrl}
                          onChange={(event) => updateDraft(model.id, { baseUrl: event.target.value })}
                          placeholder="https://api.example.com/v1"
                        />
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </AdminShell>
  );
}

export default AdminModelsPage;
