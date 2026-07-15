import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GitBranch, LayoutDashboard, PlugZap, RefreshCw, Users, Zap } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Badge, Button, PageHeader, Panel, StatCard } from '../../components/ui';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { fetchToolchainStatus, testAdminSettingsConnection, type AdminSettingsTestResult } from '../../lib/api';
import { fetchWithFallback } from '../../lib/demo-fetch';
import { ensureDemoSeedVersion } from '../../lib/storage';
import { defaultAgentRegistry } from '../../lib/agent-registry';
import { mockToolchainStatus } from '../../mocks/analytics';
import type { ToolchainStatus } from '../../types/analytics';

const quickLinks = [
  { to: '/admin/connections?tab=models', label: '模型与服务', icon: PlugZap },
  { to: '/admin/knowledge', label: '知识库', icon: BookOpen },
  { to: '/admin/policies?tab=routing', label: '策略规则', icon: GitBranch },
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/workspace', label: '用户工作台', icon: LayoutDashboard },
];

function AdminOverviewPage() {
  const {
    settings,
    readyModelCount,
    readyApiCount,
    enabledModelCount,
    enabledApiCount,
    savedHint,
    syncState,
    runtimeInfo,
    reloadSettings,
  } = useAdminSettings();
  const [toolchain, setToolchain] = useState<ToolchainStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AdminSettingsTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);

  const load = async () => {
    const toolchainResult = await fetchWithFallback(fetchToolchainStatus, mockToolchainStatus);
    setToolchain(toolchainResult.data);
  };

  useEffect(() => {
    if (ensureDemoSeedVersion()) {
      void reloadSettings();
    }
    void load();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestError(null);
    setTestOpen(true);
    try {
      const result = await testAdminSettingsConnection(settings);
      setTestResult(result);
    } catch (error) {
      setTestResult(null);
      setTestError(error instanceof Error ? error.message : '连接测试失败');
    } finally {
      setTesting(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([load(), reloadSettings()]);
  };

  return (
    <AdminShell
      title="系统概览"
      subtitle="模型、服务、知识和策略统一维护。"
      badge={<Badge tone={syncState === 'local' ? 'warning' : 'primary'}>{syncState === 'synced' ? '配置已同步' : syncState === 'local' ? '本地模式' : '同步中'}</Badge>}
      actions={(
        <>
          <Button
            type="button"
            disabled={testing}
            loading={testing}
            leadingIcon={<Zap size={16} />}
            onClick={() => void handleTestConnection()}
          >
            {testing ? '测试中…' : '测试连接'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            leadingIcon={<RefreshCw size={16} />}
            disabled={syncState === 'loading' || syncState === 'saving'}
            onClick={() => void handleRefresh()}
          >
            刷新
          </Button>
        </>
      )}
    >
      <PageHeader
        icon={LayoutDashboard}
        title="律枢管理控制台"
        subtitle="查看当前运行状态，并进入对应模块维护配置。"
      />

      {savedHint && <div className="admin-save-hint" aria-live="polite">{savedHint}</div>}
      {runtimeInfo && <div className="admin-save-hint" aria-live="polite">{runtimeInfo}</div>}

      <section className="feature-stat-grid admin-overview-stats">
        <StatCard label="注册智能体" value={`${defaultAgentRegistry.agents.length}`} description="按事项动态参与" />
        <StatCard label="模型就绪" value={`${readyModelCount}/${enabledModelCount}`} description="已启用模型" />
        <StatCard label="服务就绪" value={`${readyApiCount}/${enabledApiCount}`} description="已启用服务" />
        <StatCard label="处理能力" value={`${toolchain?.summary.ready ?? 0}/${toolchain?.summary.total ?? 0}`} description="后端就绪项" />
      </section>

      <section className="admin-quick-nav">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} className="admin-quick-nav-item" to={item.to}>
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </section>

      {testOpen && (testError || testResult) && (
        <Panel className="admin-test-panel" title="连接测试" actions={(
          <Button type="button" variant="ghost" size="sm" onClick={() => setTestOpen(false)}>收起</Button>
        )}>
          {testError && <div className="admin-save-hint admin-save-hint-error">{testError}</div>}
          {testResult && (
            <div className="admin-test-summary">
              <span className={testResult.allOk ? 'ok' : 'warn'}>
                模型 {testResult.summary.modelPass}/{testResult.summary.modelTotal}
                {' · '}
                API {testResult.summary.apiPass}/{testResult.summary.apiTotal}
                {' · '}
                {testResult.allOk ? '全部通过' : '存在失败项'}
              </span>
            </div>
          )}
        </Panel>
      )}

    </AdminShell>
  );
}

export default AdminOverviewPage;
