import { useSearchParams } from 'react-router-dom';
import { Bot, KeyRound, RefreshCw, SlidersHorizontal } from 'lucide-react';
import AdminModelCenter from '../../components/admin/AdminModelCenter';
import AdminIntegrationCenter from '../../components/admin/AdminIntegrationCenter';
import { AdminShell } from '../../components/layout/AdminShell';
import { useAdminSettings } from '../../hooks/useAdminSettings';

type ConnectionsTab = 'models' | 'apis' | 'tools';

const TABS: Array<{ id: ConnectionsTab; label: string; icon: typeof SlidersHorizontal }> = [
  { id: 'models', label: '模型', icon: SlidersHorizontal },
  { id: 'apis', label: '外部服务', icon: KeyRound },
  { id: 'tools', label: '工具与授权', icon: Bot },
];

function AdminConnectionsPage() {
  const {
    settings,
    readyModelCount,
    readyApiCount,
    enabledModelCount,
    enabledApiCount,
    savedHint,
    syncState,
    lastSyncedAt,
    reloadSettings,
    saveSettings,
  } = useAdminSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: ConnectionsTab = TABS.some((item) => item.id === tabParam) ? (tabParam as ConnectionsTab) : 'models';

  const isSyncing = syncState === 'loading' || syncState === 'saving';
  const statusLabel = syncState === 'synced'
    ? `已同步${lastSyncedAt ? ` · ${lastSyncedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : ''}`
    : syncState === 'local'
      ? '仅本地缓存'
      : syncState === 'saving'
        ? '正在保存'
        : '正在同步';

  return (
    <AdminShell
      title={tab === 'models' ? '模型配置' : tab === 'apis' ? '外部服务' : '工具与授权'}
      subtitle={tab === 'models'
        ? '统一维护系统模型与供应商连接。'
        : tab === 'apis'
          ? '配置任务办理需要的外部服务。'
          : '注册扩展工具并维护智能体调用权限。'}
      badge={(
        <span className="ds-badge ds-badge-primary">
          {tab === 'models'
            ? `模型 ${readyModelCount}/${enabledModelCount} 可用`
            : tab === 'apis'
              ? `服务 ${readyApiCount}/${enabledApiCount} 可用`
              : `工具 ${(settings.mcpTools ?? []).filter((item) => item.enabled !== false).length} 个已启用`}
        </span>
      )}
      actions={(
        <button
          type="button"
          className="btn btn-ghost"
          aria-label="重新同步管理端配置"
          title="重新从后端读取配置"
          disabled={isSyncing}
          onClick={() => void reloadSettings()}
        >
          <RefreshCw size={16} className={isSyncing ? 'spin' : ''} />
          {statusLabel}
        </button>
      )}
    >
      <div className="admin-tab-bar admin-connections-tabs">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`admin-tab-btn${tab === item.id ? ' active' : ''}`}
              aria-pressed={tab === item.id}
              onClick={() => setSearchParams({ tab: item.id })}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'models' ? (
        <AdminModelCenter
          providers={settings.modelProviders}
          slots={settings.modelSlots}
          savedHint={savedHint}
          onSave={saveSettings}
        />
      ) : (
        <AdminIntegrationCenter
          mode={tab}
          apis={settings.apis}
          mcpTools={settings.mcpTools ?? []}
          savedHint={savedHint}
          onSave={saveSettings}
        />
      )}
    </AdminShell>
  );
}

export default AdminConnectionsPage;
