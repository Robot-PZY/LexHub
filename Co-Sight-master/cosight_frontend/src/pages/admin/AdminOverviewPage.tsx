import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GitBranch, LayoutDashboard, PlugZap, RefreshCw, RotateCcw, ShieldCheck, Users, Zap } from 'lucide-react';
import AdminOpsCharts from '../../components/admin/AdminOpsCharts';
import { AdminShell } from '../../components/layout/AdminShell';
import { Badge, Button, PageHeader, Panel, StatCard } from '../../components/ui';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { fetchDemoRuntimeStatus, fetchToolchainStatus, resetDemoMaterials, testAdminSettingsConnection, type AdminSettingsTestResult } from '../../lib/api';
import { fetchWithFallback } from '../../lib/demo-fetch';
import { ensureDemoSeedVersion, resetDemoRuntimeData } from '../../lib/storage';
import { mockToolchainStatus } from '../../mocks/analytics';
import type { DemoRuntimeStatus } from '../../types/demo';
import type { ToolchainStatus } from '../../types/analytics';

const quickLinks = [
  { to: '/admin/connections', label: '能力总览', icon: PlugZap },
  { to: '/admin/knowledge', label: '知识库', icon: BookOpen },
  { to: '/admin/policies?tab=routing', label: '策略规则', icon: GitBranch },
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/workspace', label: '用户工作台', icon: LayoutDashboard },
];

function AdminOverviewPage() {
  const { settings, readyModelCount, readyApiCount, savedHint, syncState, runtimeInfo } = useAdminSettings();
  const [runtime, setRuntime] = useState<DemoRuntimeStatus | null>(null);
  const [toolchain, setToolchain] = useState<ToolchainStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AdminSettingsTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [resetHint, setResetHint] = useState('');

  const readiness = useMemo(() => {
    const modelTotal = Math.max(settings.models.length, 1);
    const apiTotal = Math.max(settings.apis.length, 1);
    const toolTotal = Math.max(toolchain?.summary.total ?? 0, 1);
    return {
      model: Math.round((readyModelCount / modelTotal) * 100),
      api: Math.round((readyApiCount / apiTotal) * 100),
      tool: Math.round(((toolchain?.summary.ready ?? 0) / toolTotal) * 100),
    };
  }, [readyModelCount, readyApiCount, settings.models.length, settings.apis.length, toolchain]);

  const load = async () => {
    const [runtimeData, toolchainResult] = await Promise.all([
      fetchDemoRuntimeStatus().catch(() => null),
      fetchWithFallback(fetchToolchainStatus, mockToolchainStatus),
    ]);
    setRuntime(runtimeData);
    setToolchain(toolchainResult.data);
  };

  useEffect(() => {
    if (ensureDemoSeedVersion()) {
      setResetHint('已同步最新用户数据。');
      window.setTimeout(() => setResetHint(''), 3500);
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

  const handleResetDemo = () => {
    resetDemoRuntimeData({ clearProfile: true });
    void resetDemoMaterials().catch(() => undefined);
    setResetHint('本地数据已重置：用户库、材料库与工作区草稿已清理。');
    window.setTimeout(() => setResetHint(''), 4000);
    void load();
  };

  return (
    <AdminShell
      title="系统概览"
      subtitle="管理端精简版：配置、知识库、策略与用户。"
      badge={<Badge tone="primary">{syncState === 'synced' ? '已同步' : runtime?.status === 'ready' ? 'Ready' : 'Config'}</Badge>}
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
            onClick={() => void load()}
          >
            刷新
          </Button>
        </>
      )}
    >
      <PageHeader
        icon={LayoutDashboard}
        title="律枢管理控制台"
        subtitle="配置、运营与用户一屏掌握；下方图表基于本地数据，完成事项后可沉淀为归档统计。"
      />

      <section className="admin-dashboard-hero" aria-label="管理控制台总览">
        <div className="admin-dashboard-hero-main">
          <p className="eyebrow">LEGAL AI SUITE</p>
          <h2>能力、数据与事项运行状态集中监控。</h2>
          <p>
            管理端用于维护模型、服务、知识库、策略与用户权限；当前配置会影响事项受理、办理进度和审查结论交付。
          </p>
          <div className="admin-dashboard-status-row">
            <Badge tone="primary" icon={<ShieldCheck size={13} />}>
              {syncState === 'synced' ? '配置已同步' : '配置待检查'}
            </Badge>
            <span>{runtime?.summary ?? '等待运行状态同步'}</span>
          </div>
        </div>
        <div className="admin-dashboard-readiness">
          <article>
            <span>模型能力</span>
            <strong>{readiness.model}%</strong>
            <em>{readyModelCount}/{settings.models.length} 就绪</em>
          </article>
          <article>
            <span>外部服务</span>
            <strong>{readiness.api}%</strong>
            <em>{readyApiCount}/{settings.apis.length} 就绪</em>
          </article>
          <article>
            <span>处理链路</span>
            <strong>{readiness.tool}%</strong>
            <em>{toolchain?.summary.ready ?? 0}/{toolchain?.summary.total ?? 0} 就绪</em>
          </article>
        </div>
      </section>

      {savedHint && <div className="admin-save-hint">{savedHint}</div>}
      {resetHint && <div className="admin-save-hint">{resetHint}</div>}
      {runtimeInfo && <div className="admin-save-hint">{runtimeInfo}</div>}

      <section className="feature-stat-grid admin-overview-stats">
        <StatCard label="模型就绪" value={`${readyModelCount}/${settings.models.length}`} description="管理配置" />
        <StatCard label="服务就绪" value={`${readyApiCount}/${settings.apis.length}`} description="外部服务位" />
        <StatCard label="知识库" value={`${settings.knowledgeBases.length}`} description="法规/案例/模板" />
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

      <AdminOpsCharts />

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

      <div className="admin-overview-foot">
        <Button type="button" variant="ghost" leadingIcon={<RotateCcw size={16} />} onClick={handleResetDemo}>
          重置本地数据
        </Button>
      </div>
    </AdminShell>
  );
}

export default AdminOverviewPage;
