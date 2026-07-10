import { useSearchParams } from 'react-router-dom';
import { Bot, CheckCircle2, KeyRound, Layers3, RefreshCw, ServerCog, SlidersHorizontal } from 'lucide-react';
import AdminStackOverview, { type StackTab } from '../../components/admin/AdminStackOverview';
import { AdminShell } from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui';
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

      <section className="admin-connections-hero" aria-label="系统能力矩阵">
        <div className="admin-connections-hero-copy">
          <p className="eyebrow">SYSTEM CAPABILITY MATRIX</p>
          <h2>法律 AI 办理能力集中编排。</h2>
          <p>
            能力总览用于检查模型、外部服务、处理工具和运行状态是否形成闭环；正式配置仍在模型配置、服务管理和知识库页面维护。
          </p>
          <div className="admin-connections-hero-badges">
            <Badge tone="primary" icon={<ServerCog size={13} />}>LexHub Runtime</Badge>
            <Badge tone={syncState === 'synced' ? 'success' : 'neutral'} icon={<CheckCircle2 size={13} />}>
              {syncState === 'synced' ? '配置已同步' : '本地配置'}
            </Badge>
          </div>
        </div>
        <div className="admin-connections-matrix">
          <article>
            <span>模型能力</span>
            <strong>{readyModelCount}/{settings.models.length}</strong>
            <em>Plan · Vision · Review</em>
          </article>
          <article>
            <span>外部服务</span>
            <strong>{readyApiCount}/{settings.apis.length}</strong>
            <em>OCR · 检索 · 导出</em>
          </article>
          <article>
            <span>处理能力</span>
            <strong>{settings.mcpTools?.length ?? 0}</strong>
            <em>扩展工具位</em>
          </article>
          <article>
            <span>运行状态</span>
            <strong>{syncState === 'synced' ? 'Ready' : 'Local'}</strong>
            <em>{runtimeInfo ?? '等待运行信息'}</em>
          </article>
        </div>
      </section>

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
