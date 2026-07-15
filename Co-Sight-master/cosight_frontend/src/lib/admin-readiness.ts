import type {
  ApiProviderConfig,
  ModelConnectionConfig,
  SystemModelSlotConfig,
} from '../types/admin-config';

const BUILTIN_API_IDS = new Set(['contract_documents', 'contract_compare', 'vector_rag', 'export']);

export function isApiReady(api: ApiProviderConfig): boolean {
  if (!api.enabled) return false;
  if (api.id === 'contract_documents' || api.id === 'export') return true;
  if (BUILTIN_API_IDS.has(api.id)) return Boolean(api.endpoint.trim());
  return Boolean(api.endpoint.trim() && api.apiKey.trim());
}

export function isModelSlotReady(
  slot: SystemModelSlotConfig,
  providers: ModelConnectionConfig[],
): boolean {
  if (!slot.enabled || !slot.modelName.trim()) return false;
  const provider = providers.find((item) => item.id === slot.providerId);
  return Boolean(provider?.enabled && provider.baseUrl.trim() && (provider.local || provider.apiKey.trim()));
}

