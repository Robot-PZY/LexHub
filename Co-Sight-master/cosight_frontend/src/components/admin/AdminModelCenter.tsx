import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  LoaderCircle,
  PlugZap,
  Server,
  X,
} from 'lucide-react';
import { testAdminSettingsConnection } from '../../lib/api';
import type {
  AdminSettings,
  ModelConnectionConfig,
  SystemModelSlotConfig,
  SystemModelSlotId,
} from '../../types/admin-config';

type AdminModelCenterProps = {
  providers: ModelConnectionConfig[];
  slots: SystemModelSlotConfig[];
  savedHint: string;
  onSave: (patch: Partial<AdminSettings>) => void;
};

type DrawerState = {
  slotId: SystemModelSlotId | null;
  providerId: string;
};

const MODEL_PRESETS: Record<string, Record<SystemModelSlotId, string[]>> = {
  openai: {
    language: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5'],
    vision: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5'],
  },
  gemini: {
    language: ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'],
    vision: ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'],
  },
  openrouter: {
    language: ['anthropic/claude-sonnet-5', 'anthropic/claude-opus-4.8', 'openai/gpt-5.6-sol', 'google/gemini-3.1-pro-preview'],
    vision: ['anthropic/claude-sonnet-5', 'anthropic/claude-opus-4.8', 'openai/gpt-5.6-sol', 'google/gemini-3.1-pro-preview'],
  },
  deepseek: {
    language: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v4-flash', 'deepseek-v4-pro'],
    vision: [],
  },
  qwen: {
    language: ['qwen-max', 'qwen-plus', 'qwen3-max', 'qwen3-coder-plus'],
    vision: ['qwen-vl-max', 'qwen-vl-plus', 'qwen3-vl-plus', 'qwen3-vl-flash'],
  },
  zhipu: {
    language: ['glm-5', 'glm-4.5', 'glm-4-plus', 'glm-4-flash'],
    vision: ['glm-4.6v', 'glm-4.5v', 'glm-4v-plus'],
  },
  moonshot: {
    language: ['kimi-k2.5', 'kimi-k2-thinking', 'moonshot-v1-128k', 'moonshot-v1-32k'],
    vision: [],
  },
  custom: { language: [], vision: [] },
};

const CAPABILITY_LABELS: Record<string, string> = {
  text: '文本理解',
  reasoning: '分析推理',
  vision: '图像理解',
  document: '文档解析',
};

function isProviderReady(provider: ModelConnectionConfig | undefined) {
  if (!provider?.enabled || !provider.baseUrl.trim()) return false;
  return Boolean(provider.local || provider.apiKey.trim());
}

function AdminModelCenter({ providers, slots, savedHint, onSave }: AdminModelCenterProps) {
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [draftProvider, setDraftProvider] = useState<ModelConnectionConfig | null>(null);
  const [draftModel, setDraftModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const slotById = useMemo(
    () => Object.fromEntries(slots.map((slot) => [slot.id, slot])) as Record<SystemModelSlotId, SystemModelSlotConfig>,
    [slots],
  );

  const openDrawer = (slotId: SystemModelSlotId | null, providerId?: string) => {
    const targetProviderId = providerId ?? (slotId ? slotById[slotId]?.providerId : providers[0]?.id);
    const provider = providers.find((item) => item.id === targetProviderId) ?? providers[0];
    if (!provider) return;
    setDrawer({ slotId, providerId: provider.id });
    setDraftProvider({ ...provider });
    setDraftModel(slotId ? slotById[slotId]?.modelName ?? '' : '');
    setShowKey(false);
    setTestMessage(null);
  };

  const closeDrawer = () => {
    setDrawer(null);
    setDraftProvider(null);
    setTestMessage(null);
  };

  useEffect(() => {
    if (!drawer) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawer]);

  const chooseProvider = (providerId: string) => {
    const provider = providers.find((item) => item.id === providerId);
    if (!provider) return;
    setDrawer((current) => (current ? { ...current, providerId } : current));
    setDraftProvider({ ...provider });
    if (drawer?.slotId) {
      const presets = MODEL_PRESETS[provider.presetId]?.[drawer.slotId] ?? [];
      setDraftModel(presets[0] ?? '');
    }
    setTestMessage(null);
  };

  const buildPatch = (): Pick<AdminSettings, 'modelProviders' | 'modelSlots'> | null => {
    if (!drawer || !draftProvider) return null;
    const nextProvider = { ...draftProvider, enabled: true };
    return {
      modelProviders: providers.map((item) => (item.id === nextProvider.id ? nextProvider : item)),
      modelSlots: slots.map((item) => (
        drawer.slotId && item.id === drawer.slotId
          ? { ...item, providerId: nextProvider.id, modelName: draftModel.trim(), enabled: true }
          : item
      )),
    };
  };

  const testConnection = async () => {
    const patch = buildPatch();
    if (!patch || !draftProvider) return;
    if (!draftProvider.baseUrl.trim()) {
      setTestMessage({ ok: false, text: '请先填写接口地址。' });
      return;
    }
    if (!draftProvider.local && !draftProvider.apiKey.trim()) {
      setTestMessage({ ok: false, text: '请先填写 API Key。' });
      return;
    }
    setTesting(true);
    setTestMessage(null);
    try {
      const result = await testAdminSettingsConnection(patch);
      const ok = Boolean(result && result.summary.modelPass > 0);
      setTestMessage({
        ok,
        text: ok
          ? `连接成功，已通过 ${result?.summary.modelPass ?? 0} 项模型检测。`
          : '接口已响应，但模型检测未通过，请检查模型名称与权限。',
      });
    } catch (error) {
      setTestMessage({ ok: false, text: error instanceof Error ? error.message : '连接测试失败。' });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    const patch = buildPatch();
    if (!patch || !draftProvider) return;
    if (!draftProvider.baseUrl.trim()) {
      setTestMessage({ ok: false, text: '接口地址不能为空。' });
      return;
    }
    if (drawer?.slotId && !draftModel.trim()) {
      setTestMessage({ ok: false, text: '请选择或填写模型名称。' });
      return;
    }
    onSave(patch);
    closeDrawer();
  };

  const activeSlot = drawer?.slotId ? slotById[drawer.slotId] : null;
  const presetModels = drawer?.slotId && draftProvider
    ? MODEL_PRESETS[draftProvider.presetId]?.[drawer.slotId] ?? []
    : [];

  return (
    <div className="admin-model-center">
      <section className="admin-model-intro">
        <div>
          <p className="eyebrow">MODEL CENTER</p>
          <h2>统一模型配置</h2>
          <p>任务规划、法律分析和文书生成共用主语言模型；图片与扫描件交给视觉理解模型。</p>
        </div>
        <div className="admin-model-intro-status">
          <span>{slots.filter((slot) => isProviderReady(providers.find((item) => item.id === slot.providerId)) && slot.modelName).length}/{slots.length}</span>
          <small>模型位已就绪</small>
        </div>
      </section>

      {savedHint ? <div className="admin-save-hint" aria-live="polite"><CheckCircle2 size={16} />{savedHint}</div> : null}

      <section className="admin-model-slot-grid" aria-label="系统模型">
        {slots.map((slot) => {
          const provider = providers.find((item) => item.id === slot.providerId);
          const ready = isProviderReady(provider) && Boolean(slot.modelName.trim());
          const Icon = slot.id === 'language' ? BrainCircuit : Eye;
          return (
            <article key={slot.id} className={`admin-model-slot-card admin-model-slot-${slot.id}`}>
              <div className="admin-model-slot-topline">
                <span className="admin-model-slot-icon"><Icon size={23} /></span>
                <span className={`admin-model-state${ready ? ' ready' : ''}`}>
                  <i />{ready ? '已就绪' : '待配置'}
                </span>
              </div>
              <div className="admin-model-slot-copy">
                <span>{slot.id === 'language' ? 'LANGUAGE' : 'VISION'}</span>
                <h3>{slot.label}</h3>
                <p>{slot.description}</p>
              </div>
              <div className="admin-model-current">
                <div>
                  <small>当前模型</small>
                  <strong>{slot.modelName || '尚未选择'}</strong>
                </div>
                <span>{provider?.label ?? '未指定供应商'}</span>
              </div>
              <div className="admin-model-capabilities">
                {slot.capabilities.map((item) => <span key={item}>{CAPABILITY_LABELS[item] ?? item}</span>)}
              </div>
              <button type="button" className="admin-model-switch" onClick={() => openDrawer(slot.id)}>
                切换模型<ChevronRight size={17} />
              </button>
            </article>
          );
        })}
      </section>

      <section className="admin-provider-section">
        <div className="admin-provider-heading">
          <div>
            <h3>供应商连接</h3>
            <p>集中维护接口地址和密钥，模型切换时可直接复用。</p>
          </div>
          <span>{providers.filter(isProviderReady).length} 个连接可用</span>
        </div>
        <div className="admin-provider-list">
          {providers.map((provider) => {
            const ready = isProviderReady(provider);
            const usedBy = slots.filter((slot) => slot.providerId === provider.id).map((slot) => slot.label);
            return (
              <button key={provider.id} type="button" className="admin-provider-row" onClick={() => openDrawer(null, provider.id)}>
                <span className="admin-provider-mark">{provider.label.slice(0, 1).toUpperCase()}</span>
                <span className="admin-provider-name">
                  <strong>{provider.label}</strong>
                  <small>{provider.local ? '本地服务' : provider.baseUrl || '尚未填写接口地址'}</small>
                </span>
                <span className="admin-provider-usage">{usedBy.length ? usedBy.join(' · ') : '未启用'}</span>
                <span className={`admin-provider-status${ready ? ' ready' : ''}`}>{ready ? '已连接' : '待配置'}</span>
                <ChevronRight size={17} />
              </button>
            );
          })}
        </div>
      </section>

      {drawer && draftProvider ? (
        <div className="admin-model-drawer-backdrop" onMouseDown={(event) => {
          if (event.currentTarget === event.target) closeDrawer();
        }}>
          <aside className="admin-model-drawer" role="dialog" aria-modal="true" aria-labelledby="model-drawer-title">
            <header className="admin-model-drawer-header">
              <div>
                <p>{activeSlot ? activeSlot.label : '供应商连接'}</p>
                <h2 id="model-drawer-title">{activeSlot ? '选择模型服务商' : '配置模型服务商'}</h2>
              </div>
              <button type="button" aria-label="关闭配置" onClick={closeDrawer} autoFocus><X size={20} /></button>
            </header>

            <div className="admin-model-drawer-body">
              <section className="admin-provider-choice" aria-labelledby="provider-choice-title">
                <div className="admin-provider-choice-heading">
                  <h3 id="provider-choice-title">服务商</h3>
                  <p>选择预设服务商，或使用自定义兼容接口。</p>
                </div>
                <div className="admin-provider-picker">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      className={provider.id === draftProvider.id ? 'selected' : ''}
                      aria-pressed={provider.id === draftProvider.id}
                      onClick={() => chooseProvider(provider.id)}
                    >
                      <span>{provider.label.slice(0, 1).toUpperCase()}</span>
                      <strong>{provider.label}</strong>
                      <small>{provider.id === 'custom' ? '填写自有接口' : provider.baseUrl.replace(/^https?:\/\//, '').split('/')[0]}</small>
                      {provider.id === draftProvider.id ? <Check size={16} /> : <ChevronRight size={16} />}
                    </button>
                  ))}
                </div>
              </section>

              <section className="admin-provider-config-panel" aria-label={`${draftProvider.label} 配置`}>
                <header className="admin-provider-config-heading">
                  <span>{draftProvider.label.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <h3>{draftProvider.label}</h3>
                    <p>{draftProvider.id === 'custom' ? '配置 OpenAI Compatible 接口' : '设置模型名称和连接凭据'}</p>
                  </div>
                </header>

                {activeSlot ? (
                  <fieldset className="admin-model-fieldset admin-model-fieldset-plain">
                  <legend>选择模型</legend>
                  {presetModels.length ? (
                    <div className="admin-model-preset-list">
                      {presetModels.map((model) => (
                        <button
                          key={model}
                          type="button"
                          className={draftModel === model ? 'selected' : ''}
                          aria-pressed={draftModel === model}
                          onClick={() => setDraftModel(model)}
                        >
                          <span><Server size={16} />{model}</span>
                          {draftModel === model ? <Check size={16} /> : null}
                        </button>
                      ))}
                    </div>
                  ) : <p className="admin-model-field-note">该供应商没有内置的{activeSlot.label}预设，可直接填写模型名称。</p>}
                  <label className="admin-model-field">
                    <span>模型名称</span>
                    <input value={draftModel} onChange={(event) => setDraftModel(event.target.value)} placeholder="输入接口支持的模型 ID" />
                  </label>
                  </fieldset>
                ) : null}

                <fieldset className="admin-model-fieldset admin-model-fieldset-plain">
                <legend>连接信息</legend>
                <label className="admin-model-field">
                  <span><Link2 size={15} />接口地址</span>
                  <input
                    value={draftProvider.baseUrl}
                    onChange={(event) => setDraftProvider({ ...draftProvider, baseUrl: event.target.value })}
                    placeholder="https://api.example.com/v1"
                  />
                </label>
                <label className="admin-model-field">
                  <span><KeyRound size={15} />API Key</span>
                  <span className="admin-model-secret-input">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={draftProvider.apiKey}
                      onChange={(event) => setDraftProvider({ ...draftProvider, apiKey: event.target.value })}
                      placeholder="输入 API Key"
                    />
                    <button type="button" aria-label={showKey ? '隐藏密钥' : '显示密钥'} onClick={() => setShowKey((value) => !value)}>
                      {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>
                <p className="admin-model-security-note"><KeyRound size={14} />密钥保存后由后端运行配置读取，页面默认隐藏。</p>
                </fieldset>
              </section>

              {testMessage ? (
                <div className={`admin-model-test-result${testMessage.ok ? ' success' : ' error'}`}>
                  {testMessage.ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                  {testMessage.text}
                </div>
              ) : null}
            </div>

            <footer className="admin-model-drawer-footer">
              {activeSlot ? (
                <button type="button" className="btn btn-ghost" onClick={testConnection} disabled={testing}>
                  {testing ? <LoaderCircle className="spin" size={16} /> : <PlugZap size={16} />}
                  {testing ? '正在检测' : '测试连接'}
                </button>
              ) : <span />}
              <button type="button" className="btn btn-primary" onClick={save}>
                保存{activeSlot ? '并启用' : '连接'}
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default AdminModelCenter;
