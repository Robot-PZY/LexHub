import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  FileText,
  GitBranch,
  Lock,
  Plus,
  Save,
  Scale,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import WorkflowConfigPanel from '../../components/board/WorkflowConfigPanel';
import { AdminShell } from '../../components/layout/AdminShell';
import DataSourceBadge from '../../components/ui/DataSourceBadge';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { fetchWorkflowConfig } from '../../lib/api';
import { mockWorkflowConfig } from '../../mocks/workflow';
import type { WorkflowConfig } from '../../types/workflow';

const ruleIcons = [Search, FileText, Scale, ShieldCheck, AlertTriangle];

function extractAgentTag(rule: string): string {
  const match = rule.match(/调度(.+?)智能体/);
  return match?.[1] ?? '通用';
}

function AdminRoutingPage() {
  const { settings, saveSettings, savedHint } = useAdminSettings();
  const [draft, setDraft] = useState<string[]>(settings.routingRules);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [workflowSource, setWorkflowSource] = useState<'api' | 'mock'>('mock');
  const [workflowLoading, setWorkflowLoading] = useState(true);

  useEffect(() => {
    setDraft(settings.routingRules);
  }, [settings.routingRules]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkflow() {
      try {
        const data = await fetchWorkflowConfig();
        if (!cancelled) {
          setWorkflowConfig(data ?? mockWorkflowConfig);
          setWorkflowSource(data ? 'api' : 'mock');
        }
      } catch {
        if (!cancelled) {
          setWorkflowConfig(mockWorkflowConfig);
          setWorkflowSource('mock');
        }
      } finally {
        if (!cancelled) setWorkflowLoading(false);
      }
    }

    void loadWorkflow();
    return () => {
      cancelled = true;
    };
  }, []);

  const configRules = workflowConfig?.routingRules ?? [];

  return (
    <AdminShell title="调度策略" subtitle="状态驱动规则与工作流拓扑预览。">
      <PageHeader
        icon={GitBranch}
        title="动态调度策略"
        subtitle="根据材料完整度、法规缺口与风险等级自动选择智能体；DAG 拓扑由工作流配置定义。"
        action={(
          <button type="button" className="btn btn-primary" onClick={() => saveSettings({ routingRules: draft })}>
            <Save size={16} />
            保存策略
          </button>
        )}
      />

      {savedHint && <div className="admin-save-hint">{savedHint}</div>}

      <section className="admin-routing-hero">
        <article>
          <strong>{draft.length}</strong>
          <span>可编辑规则</span>
        </article>
        <article>
          <strong>{configRules.length}</strong>
          <span>工作流内置规则</span>
        </article>
        <article>
          <strong>5</strong>
          <span>可调度智能体</span>
        </article>
      </section>

      <section className="admin-routing-layout admin-routing-layout-v2">
        <div className="admin-routing-main">
          <div className="admin-config-section-head">
            <div>
              <h3>调度规则</h3>
              <p>当任务状态满足条件时，系统自动选择对应智能体介入。</p>
            </div>
            <span className="ds-badge ds-badge-success">可编辑</span>
          </div>

          <div className="admin-rule-card-grid">
            {draft.map((rule, index) => {
              const Icon = ruleIcons[index % ruleIcons.length];
              return (
                <article key={`${index}-${rule.slice(0, 12)}`} className="admin-rule-card">
                  <div className="admin-rule-card-top">
                    <span className="admin-rule-card-icon"><Icon size={16} /></span>
                    <div className="admin-rule-card-meta">
                      <strong>规则 {index + 1}</strong>
                      <em>{extractAgentTag(rule)}</em>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost admin-rule-delete"
                      onClick={() => setDraft(draft.filter((_, i) => i !== index))}
                      aria-label="删除规则"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    className="admin-rule-card-input"
                    value={rule}
                    rows={3}
                    onChange={(event) => {
                      const next = [...draft];
                      next[index] = event.target.value;
                      setDraft(next);
                    }}
                  />
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary admin-inline-btn"
            onClick={() => setDraft([...draft, '新增调度规则：当……时，调度……智能体。'])}
          >
            <Plus size={16} />
            新增规则
          </button>
        </div>

        <aside className="admin-routing-side">
          <article className="ds-card admin-topology-card">
            <div className="admin-topology-head">
              <div>
                <p className="eyebrow">WORKFLOW TOPOLOGY</p>
                <strong>Co-Sight 工作流拓扑</strong>
              </div>
              <div className="admin-topology-badges">
                <span className="ds-badge ds-badge-primary"><Lock size={12} /> 只读</span>
                <DataSourceBadge source={workflowSource} />
              </div>
            </div>
            <p className="admin-panel-desc">
              DAG 结构由
              {' '}
              <code>legal-workflow.json</code>
              {' '}
              定义，展示任务从理解 → 证据 → 研究 → 生成 → 审查的编排路径。
            </p>

            {workflowLoading ? (
              <LoadingState label="加载工作流配置…" />
            ) : workflowConfig && (
              <WorkflowConfigPanel config={workflowConfig} readOnly compact />
            )}
          </article>

          {configRules.length > 0 && (
            <article className="ds-card admin-panel">
              <div className="admin-panel-head-inline">
                <strong>配置文件规则摘要</strong>
                <span className="ds-badge ds-badge-primary">JSON</span>
              </div>
              <ul className="admin-config-rule-list">
                {configRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>
          )}
        </aside>
      </section>
    </AdminShell>
  );
}

export default AdminRoutingPage;
