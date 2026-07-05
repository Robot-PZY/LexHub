import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Eye, Layers, Save, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import type { ModelCapabilityType, ModelProviderConfig } from '../../types/admin-config';

const capabilityMeta: Record<ModelCapabilityType, { label: string; icon: typeof BrainCircuit; tone: string }> = {
  text_llm: { label: '语言推理 LLM', icon: BrainCircuit, tone: 'text' },
  vision_ocr: { label: '视觉 / OCR', icon: Eye, tone: 'vision' },
  multimodal: { label: '多模态复核', icon: Layers, tone: 'multi' },
  embedding: { label: '向量嵌入', icon: Sparkles, tone: 'embed' },
};

const sectionOrder: Array<{ type: ModelCapabilityType; title: string; desc: string }> = [
  { type: 'text_llm', title: '语言推理模型', desc: '任务理解、法规研究、文书生成等文本智能体。' },
  { type: 'vision_ocr', title: '视觉与 OCR 能力', desc: '合同扫描、票据识图、PDF 解析，不仅依赖纯 LLM。' },
  { type: 'multimodal', title: '多模态与复核', desc: '结合文本、材料与规则引擎的交叉审查能力。' },
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

  const runtimeSummary = useMemo(() => {
    const textReady = draft.filter((item) => item.capabilityType === 'text_llm' && item.enabled && item.modelName).length;
    const visionReady = draft.filter((item) => item.capabilityType === 'vision_ocr' && item.enabled && item.modelName).length;
    const multiReady = draft.filter((item) => item.capabilityType === 'multimodal' && item.enabled && item.modelName).length;
    return { textReady, visionReady, multiReady };
  }, [draft]);

  return (
    <AdminShell title="模型配置" subtitle="按能力类型配置语言模型、视觉 OCR 与多模态复核。">
      <PageHeader
        icon={SlidersHorizontal}
        title="智能体能力配置"
        subtitle="智能体不等于单一 LLM：证据质检需要 OCR/视觉模型，交叉审查可结合规则引擎与多模态能力。"
        action={<button type="button" className="btn btn-primary" onClick={() => saveSettings({ models: draft })}><Save size={16} />保存配置</button>}
      />

      {savedHint && <div className="admin-save-hint">{savedHint}</div>}
      <p className="admin-form-desc">保存后将写入后端 `config/runtime/admin_settings.json`，下一任务自动生效；未填写的项仍使用 `.env`。</p>

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
                        <span>API Key</span>
                        <input
                          type="password"
                          value={model.apiKey}
                          onChange={(event) => updateDraft(model.id, { apiKey: event.target.value })}
                          placeholder="输入该能力对应的 API Key"
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
