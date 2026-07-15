import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAdminSettingsFromServer, saveAdminSettingsToServer } from '../lib/api';
import { isApiReady, isModelSlotReady } from '../lib/admin-readiness';
import { loadAdminConfig, saveAdminConfig } from '../lib/storage';
import {
  createDefaultAdminSettings,
  type AdminSettings,
  type ModelConnectionConfig,
  type ModelProviderConfig,
} from '../types/admin-config';

const MOJIBAKE_PATTERN = /(?:Ã|Â|â|ä|å|æ|ç|é|è|ð|�|[\u0080-\u009f])/;

function readableOr(value: string | undefined, fallback: string): string {
  const text = value?.trim();
  return text && !MOJIBAKE_PATTERN.test(text) ? text : fallback;
}

function normalizeKnownLabels(settings: AdminSettings, defaults = createDefaultAdminSettings()): AdminSettings {
  return {
    ...settings,
    modelProviders: settings.modelProviders.filter((item) => item.id !== 'ollama').map((item) => {
      const fallback = defaults.modelProviders.find((row) => row.id === item.id);
      return fallback ? { ...item, label: readableOr(item.label, fallback.label) } : item;
    }),
    modelSlots: settings.modelSlots.map((item) => {
      const fallback = defaults.modelSlots.find((row) => row.id === item.id);
      return fallback ? {
        ...item,
        label: readableOr(item.label, fallback.label),
        description: readableOr(item.description, fallback.description),
      } : item;
    }),
    models: settings.models.map((item) => {
      const fallback = defaults.models.find((row) => row.id === item.id);
      return fallback ? {
        ...item,
        label: readableOr(item.label, fallback.label),
        agentName: readableOr(item.agentName, fallback.agentName),
        description: readableOr(item.description, fallback.description),
      } : item;
    }),
    apis: settings.apis.map((item) => {
      const fallback = defaults.apis.find((row) => row.id === item.id);
      return fallback ? {
        ...item,
        name: readableOr(item.name, fallback.name),
        category: readableOr(item.category, fallback.category),
        purpose: readableOr(item.purpose, fallback.purpose),
      } : item;
    }),
  };
}

function inferConnectionId(model: ModelProviderConfig, slot: 'language' | 'vision'): string {
  const hint = `${model.providerId ?? ''} ${model.baseUrl}`.toLowerCase();
  if (hint.includes('deepseek')) return 'deepseek';
  if (hint.includes('dashscope') || hint.includes('qwen')) return 'qwen';
  if (hint.includes('open.bigmodel') || hint.includes('zhipu') || hint.includes('glm')) return 'zhipu';
  if (hint.includes('moonshot') || hint.includes('kimi')) return 'moonshot';
  if (hint.includes('openai.com') || hint.includes('gpt')) return 'openai';
  if (hint.includes('11434') || hint.includes('ollama')) return 'ollama';
  return `legacy-${slot}`;
}

function migrateLegacyModels(
  defaults: AdminSettings,
  stored: ReturnType<typeof loadAdminConfig>,
): Pick<AdminSettings, 'modelProviders' | 'modelSlots'> {
  const providers = defaults.modelProviders.map((item) => ({ ...item }));
  const slots = defaults.modelSlots.map((item) => ({ ...item, capabilities: [...item.capabilities] }));
  const legacy = stored.models ?? [];
  const language = legacy.find((item) => item.id === 'planner' && item.modelName)
    ?? legacy.find((item) => item.capabilityType === 'text_llm' && item.modelName);
  const vision = legacy.find((item) => item.id === 'vision' && item.modelName);

  const applyLegacy = (model: ModelProviderConfig | undefined, slotId: 'language' | 'vision') => {
    if (!model) return;
    const connectionId = inferConnectionId(model, slotId);
    const existing = providers.find((item) => item.id === connectionId);
    const connection: ModelConnectionConfig = {
      id: connectionId,
      label: existing?.label ?? model.label,
      presetId: existing?.presetId ?? 'custom',
      protocol: 'openai_compatible',
      baseUrl: model.baseUrl || existing?.baseUrl || '',
      apiKey: model.apiKey || existing?.apiKey || '',
      enabled: model.enabled,
      local: existing?.local,
    };
    if (existing) Object.assign(existing, connection);
    else providers.push(connection);

    const slot = slots.find((item) => item.id === slotId);
    if (slot) {
      slot.providerId = connectionId;
      slot.modelName = model.modelName;
      slot.enabled = model.enabled;
    }
  };

  applyLegacy(language, 'language');
  applyLegacy(vision, 'vision');
  return { modelProviders: providers, modelSlots: slots };
}

function mergeAdminSettings(stored: ReturnType<typeof loadAdminConfig>): AdminSettings {
  const defaults = createDefaultAdminSettings();
  const migrated = migrateLegacyModels(defaults, stored);
  const modelProviders = stored.modelProviders?.length
    ? [
      ...defaults.modelProviders.map((def) => {
        const found = stored.modelProviders?.find((item) => item.id === def.id);
        return found ? { ...def, ...found } : def;
      }),
      ...stored.modelProviders.filter((item) => !defaults.modelProviders.some((def) => def.id === item.id)),
    ]
    : migrated.modelProviders;
  const modelSlots = stored.modelSlots?.length
    ? defaults.modelSlots.map((def) => {
      const found = stored.modelSlots?.find((item) => item.id === def.id);
      return found ? { ...def, ...found, capabilities: found.capabilities ?? def.capabilities } : def;
    })
    : migrated.modelSlots;
  const mergeModels = (defaults.models).map((def) => {
    const found = stored.models?.find((item) => item.id === def.id);
    return found ? { ...def, ...found, capabilities: found.capabilities ?? def.capabilities } : def;
  });
  const mergeApis = defaults.apis.map((def) => {
    const found = stored.apis?.find((item) => item.id === def.id);
    return found ? { ...def, ...found, integrationType: found.integrationType ?? def.integrationType } : def;
  });
  return normalizeKnownLabels({
    modelProviders,
    modelSlots,
    models: mergeModels,
    apis: mergeApis,
    routingRules: stored.routingRules?.length ? stored.routingRules : defaults.routingRules,
    reviewRules: stored.reviewRules?.length ? stored.reviewRules : defaults.reviewRules,
    mcpTools: stored.mcpTools?.length ? stored.mcpTools : defaults.mcpTools,
  }, defaults);
}

function mergeServerSettings(base: AdminSettings, remote: AdminSettings): AdminSettings {
  const next = { ...base };
  if (remote.modelProviders?.length) {
    next.modelProviders = remote.modelProviders;
  }
  if (remote.modelSlots?.length) {
    next.modelSlots = remote.modelSlots;
  }
  if (remote.models?.length) {
    next.models = base.models.map((item) => {
      const found = remote.models.find((row) => row.id === item.id);
      return found ? { ...item, ...found, capabilities: found.capabilities ?? item.capabilities } : item;
    });
  }
  if (remote.apis?.length) {
    const mergedCore = base.apis.map((item) => {
      const found = remote.apis.find((row) => row.id === item.id);
      return found ? { ...item, ...found, integrationType: found.integrationType ?? item.integrationType } : item;
    });
    next.apis = [
      ...mergedCore,
      ...remote.apis.filter((item) => !mergedCore.some((row) => row.id === item.id)),
    ];
  }
  if (Array.isArray(remote.mcpTools)) {
    next.mcpTools = remote.mcpTools;
  }
  if (remote.routingRules?.length) {
    next.routingRules = remote.routingRules;
  }
  if (remote.reviewRules?.length) {
    next.reviewRules = remote.reviewRules;
  }
  return normalizeKnownLabels(next);
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() => mergeAdminSettings(loadAdminConfig()));
  const settingsRef = useRef(settings);
  const [savedHint, setSavedHint] = useState('');
  const [syncState, setSyncState] = useState<'loading' | 'saving' | 'synced' | 'local'>('loading');
  const [runtimeInfo, setRuntimeInfo] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const commitSettings = useCallback((next: AdminSettings) => {
    settingsRef.current = next;
    setSettings(next);
    saveAdminConfig(next);
  }, []);

  const reloadSettings = useCallback(async () => {
    setSyncState('loading');
    try {
      const remote = await fetchAdminSettingsFromServer();
      if (!remote) throw new Error('后端未返回配置');
      const merged = mergeServerSettings(mergeAdminSettings(loadAdminConfig()), remote);
      commitSettings(merged);
      setSyncState('synced');
      setLastSyncedAt(new Date());
      setRuntimeInfo(`运行时配置：模型 ${remote.runtime?.modelsApplied ?? 0} · API ${remote.runtime?.apisApplied ?? 0}`);
      return true;
    } catch {
      setSyncState('local');
      setRuntimeInfo('当前使用本地缓存；启动后端后可重新同步。');
      return false;
    }
  }, [commitSettings]);

  useEffect(() => {
    void reloadSettings();
  }, [reloadSettings]);

  const persist = useCallback(async (next: AdminSettings) => {
    commitSettings(next);
    setSyncState('saving');
    try {
      const saved = await saveAdminSettingsToServer(next);
      if (!saved) throw new Error('后端未确认保存结果');
      commitSettings(mergeServerSettings(next, saved));
      const appliedModels = saved?.runtime?.modelsApplied ?? 0;
      const appliedApis = saved?.runtime?.apisApplied ?? 0;
      setSavedHint(`已同步，后续任务使用新配置（模型 ${appliedModels} · API ${appliedApis}）。`);
      setSyncState('synced');
      setLastSyncedAt(new Date());
      setRuntimeInfo(`运行时配置：模型 ${appliedModels} · API ${appliedApis}`);
    } catch {
      setSavedHint('已保存到本地缓存；后端未连接，本次运行仍使用现有环境配置。');
      setSyncState('local');
    }
    window.setTimeout(() => setSavedHint(''), 3500);
  }, [commitSettings]);

  const saveSettings = useCallback((patch: Partial<AdminSettings>) => {
    void persist({ ...settingsRef.current, ...patch });
  }, [persist]);

  const readyModelCount = useMemo(
    () => settings.modelSlots.filter((slot) => isModelSlotReady(slot, settings.modelProviders)).length,
    [settings.modelProviders, settings.modelSlots],
  );

  const readyApiCount = useMemo(
    () => settings.apis.filter(isApiReady).length,
    [settings.apis],
  );

  const enabledApiCount = useMemo(() => settings.apis.filter((item) => item.enabled).length, [settings.apis]);
  const enabledModelCount = useMemo(() => settings.modelSlots.filter((item) => item.enabled).length, [settings.modelSlots]);

  return {
    settings,
    savedHint,
    syncState,
    runtimeInfo,
    lastSyncedAt,
    reloadSettings,
    saveSettings,
    readyModelCount,
    readyApiCount,
    enabledModelCount,
    enabledApiCount,
  };
}
