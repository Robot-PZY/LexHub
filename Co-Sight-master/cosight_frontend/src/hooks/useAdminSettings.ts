import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminSettingsFromServer, saveAdminSettingsToServer } from '../lib/api';
import { loadAdminConfig, saveAdminConfig } from '../lib/storage';
import {
  createDefaultAdminSettings,
  type AdminSettings,
  type ApiProviderConfig,
  type KnowledgeBaseConfig,
  type ModelProviderConfig,
  type McpToolConfig,
} from '../types/admin-config';

function mergeAdminSettings(stored: ReturnType<typeof loadAdminConfig>): AdminSettings {
  const defaults = createDefaultAdminSettings();
  const mergeModels = (defaults.models).map((def) => {
    const found = stored.models?.find((item) => item.id === def.id);
    return found ? { ...def, ...found, capabilities: found.capabilities ?? def.capabilities } : def;
  });
  const mergeApis = defaults.apis.map((def) => {
    const found = stored.apis?.find((item) => item.id === def.id);
    return found ? { ...def, ...found, integrationType: found.integrationType ?? def.integrationType } : def;
  });
  const mergeKb = defaults.knowledgeBases.map((def) => {
    const found = stored.knowledgeBases?.find((item) => item.id === def.id);
    return found ? { ...def, ...found, tags: found.tags ?? def.tags } : def;
  });

  return {
    models: mergeModels,
    apis: mergeApis,
    knowledgeBases: mergeKb,
    routingRules: stored.routingRules?.length ? stored.routingRules : defaults.routingRules,
    reviewRules: stored.reviewRules?.length ? stored.reviewRules : defaults.reviewRules,
    mcpTools: stored.mcpTools?.length ? stored.mcpTools : defaults.mcpTools,
  };
}

function mergeServerSettings(base: AdminSettings, remote: AdminSettings): AdminSettings {
  const next = { ...base };
  if (remote.models?.length) {
    next.models = base.models.map((item) => {
      const found = remote.models.find((row) => row.id === item.id);
      return found ? { ...item, ...found, capabilities: found.capabilities ?? item.capabilities } : item;
    });
  }
  if (remote.apis?.length) {
    next.apis = base.apis.map((item) => {
      const found = remote.apis.find((row) => row.id === item.id);
      return found ? { ...item, ...found, integrationType: found.integrationType ?? item.integrationType } : item;
    });
  }
  if (remote.mcpTools?.length) {
    next.mcpTools = remote.mcpTools;
  }
  if (remote.routingRules?.length) {
    next.routingRules = remote.routingRules;
  }
  if (remote.reviewRules?.length) {
    next.reviewRules = remote.reviewRules;
  }
  return next;
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() => mergeAdminSettings(loadAdminConfig()));
  const [savedHint, setSavedHint] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'loading' | 'synced' | 'local'>('loading');
  const [runtimeInfo, setRuntimeInfo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRemote() {
      try {
        const remote = await fetchAdminSettingsFromServer();
        if (cancelled || !remote) {
          if (!cancelled) setSyncState('local');
          return;
        }
        const merged = mergeServerSettings(mergeAdminSettings(loadAdminConfig()), remote);
        setSettings(merged);
        saveAdminConfig(merged);
        setSyncState('synced');
        if (remote.runtime?.effective) {
          setRuntimeInfo(`后端已生效：模型 ${remote.runtime.modelsApplied ?? 0} · API ${remote.runtime.apisApplied ?? 0}`);
        }
      } catch {
        if (!cancelled) setSyncState('local');
      }
    }

    void loadRemote();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AdminSettings) => {
    setSettings(next);
    saveAdminConfig(next);
    try {
      const saved = await saveAdminSettingsToServer(next);
      const appliedModels = saved?.runtime?.modelsApplied ?? 0;
      const appliedApis = saved?.runtime?.apisApplied ?? 0;
      setSavedHint(`已同步到后端，下一任务生效（模型 ${appliedModels} · API ${appliedApis}）。`);
      setSyncState('synced');
      setRuntimeInfo(`后端已生效：模型 ${appliedModels} · API ${appliedApis}`);
    } catch {
      setSavedHint('已保存到本地；后端未连接，任务仍使用 .env 配置。');
      setSyncState('local');
    }
    window.setTimeout(() => setSavedHint(''), 3500);
  }, []);

  const saveSettings = useCallback((patch: Partial<AdminSettings>) => {
    void persist({ ...settings, ...patch });
  }, [persist, settings]);

  const updateModel = useCallback((id: string, patch: Partial<ModelProviderConfig>) => {
    void persist({
      ...settings,
      models: settings.models.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }, [persist, settings]);

  const updateApi = useCallback((id: string, patch: Partial<ApiProviderConfig>) => {
    void persist({
      ...settings,
      apis: settings.apis.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }, [persist, settings]);

  const updateKnowledge = useCallback((id: string, patch: Partial<KnowledgeBaseConfig>) => {
    void persist({
      ...settings,
      knowledgeBases: settings.knowledgeBases.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }, [persist, settings]);

  const updateMcpTools = useCallback((mcpTools: McpToolConfig[]) => {
    void persist({ ...settings, mcpTools });
  }, [persist, settings]);

  const updateRoutingRules = useCallback((routingRules: string[]) => {
    void persist({ ...settings, routingRules });
  }, [persist, settings]);

  const updateReviewRules = useCallback((reviewRules: string[]) => {
    void persist({ ...settings, reviewRules });
  }, [persist, settings]);

  const resetSettings = useCallback(() => {
    void persist(createDefaultAdminSettings());
  }, [persist]);

  const readyModelCount = useMemo(
    () => settings.models.filter((item) => item.enabled && item.modelName && item.baseUrl).length,
    [settings.models],
  );

  const readyApiCount = useMemo(
    () => settings.apis.filter((item) => {
      if (!item.enabled) return false;
      if (item.integrationType === 'vector_rag') return !!item.endpoint.trim();
      if (item.integrationType === 'export_pipeline') return true;
      return !!item.apiKey.trim();
    }).length,
    [settings.apis],
  );

  return {
    settings,
    savedHint,
    syncState,
    runtimeInfo,
    saveSettings,
    updateModel,
    updateApi,
    updateKnowledge,
    updateMcpTools,
    updateRoutingRules,
    updateReviewRules,
    resetSettings,
    readyModelCount,
    readyApiCount,
  };
}
