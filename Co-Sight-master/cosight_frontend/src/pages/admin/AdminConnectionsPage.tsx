import { useSearchParams } from 'react-router-dom';
import { Bot, KeyRound, Layers3, RefreshCw, SlidersHorizontal } from 'lucide-react';
import AdminStackOverview, { type StackTab } from '../../components/admin/AdminStackOverview';
import { AdminShell } from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import { useAdminSettings } from '../../hooks/useAdminSettings';

const TABS: Array<{ id: StackTab; label: string; icon: typeof SlidersHorizontal }> = [
  { id: 'overview', label: '总览', icon: Layers3 },
  { id: 'models', label: '模型', icon: SlidersHorizontal },
  { id: 'apis', label: '外部服务', icon: KeyRound },
  { id: 'tools', label: '处理能力', icon: Bot },
];

function AdminConnectionsPage() {
  const { settings, readyModelCount, readyApiCount, syncState, runtimeInfo } = useAdminSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: StackTab = TABS.some((item) => item.id === tabParam) ? (tabParam as StackTab) : 'overview';

  const refresh = () => {
    window.location.reload();
  };

  return (
    <AdminShell
      title="能力总览"
      subtitle="只读展示 LexHub 办理能力与模型、外部服务、处理能力配置状态。"
      badge={(
        <span className="ds-badge ds-badge-primary">
          模型 {readyModelCount}/{settings.models.length} · 服务 {readyApiCount}/{settings.apis.length}
        </span>
      )}
      actions={(
        <button type="button" className="btn btn-ghost" onClick={refresh}>
          <RefreshCw size={16} />
          刷新状态
        </button>
      )}
    >
      <PageHeader
        icon={Layers3}
        title="系统能力栈"
        subtitle="整合模型能力、外部服务与本地处理能力；本页用于总览，密钥与运行配置请在对应管理页维护。"
      />

      <div className="admin-tab-bar">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`admin-tab-btn${tab === item.id ? ' active' : ''}`}
              onClick={() => setSearchParams({ tab: item.id })}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      <AdminStackOverview
        tab={tab}
        models={settings.models}
        apis={settings.apis}
        mcpTools={settings.mcpTools ?? []}
        syncState={syncState}
        runtimeInfo={runtimeInfo}
      />
    </AdminShell>
  );
}

export default AdminConnectionsPage;
