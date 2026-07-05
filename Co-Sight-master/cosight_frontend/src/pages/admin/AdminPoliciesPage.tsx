import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GitBranch, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import { useAdminSettings } from '../../hooks/useAdminSettings';

type TabId = 'routing' | 'review';

function AdminPoliciesPage() {
  const { settings, saveSettings, savedHint } = useAdminSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') === 'review' ? 'review' : 'routing') as TabId;
  const [routingDraft, setRoutingDraft] = useState(settings.routingRules);
  const [reviewDraft, setReviewDraft] = useState(settings.reviewRules);

  useEffect(() => {
    setRoutingDraft(settings.routingRules);
    setReviewDraft(settings.reviewRules);
  }, [settings.routingRules, settings.reviewRules]);

  const activeDraft = tab === 'routing' ? routingDraft : reviewDraft;
  const setActiveDraft = tab === 'routing' ? setRoutingDraft : setReviewDraft;

  const handleSave = () => {
    if (tab === 'routing') saveSettings({ routingRules: routingDraft });
    else saveSettings({ reviewRules: reviewDraft });
  };

  return (
    <AdminShell
      title="策略规则"
      subtitle="调度策略与审查规则集中维护。"
      actions={(
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <Save size={16} />
          保存规则
        </button>
      )}
    >
      <PageHeader
        icon={GitBranch}
        title="策略规则"
        subtitle="合并原「调度策略」与「审查规则」，保留核心可编辑能力。"
      />

      {savedHint && <div className="admin-save-hint">{savedHint}</div>}

      <div className="admin-tab-bar">
        <button
          type="button"
          className={`admin-tab-btn${tab === 'routing' ? ' active' : ''}`}
          onClick={() => setSearchParams({ tab: 'routing' })}
        >
          <GitBranch size={14} />
          调度策略 ({routingDraft.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn${tab === 'review' ? ' active' : ''}`}
          onClick={() => setSearchParams({ tab: 'review' })}
        >
          <ShieldCheck size={14} />
          审查规则 ({reviewDraft.length})
        </button>
      </div>

      <section className="ds-card admin-panel admin-panel-wide admin-rules-compact">
        <p className="admin-panel-desc">
          {tab === 'routing'
            ? '当任务状态满足条件时，系统自动选择对应智能体介入。'
            : '交叉审查智能体依据这些规则标记事实冲突、证据缺口与引用不足。'}
        </p>

        <div className="admin-rule-editor admin-rule-editor-compact">
          {activeDraft.map((rule, index) => (
            <div key={`${tab}-${index}-${rule.slice(0, 10)}`} className="admin-rule-row-edit">
              <span>{index + 1}</span>
              <input
                value={rule}
                onChange={(event) => {
                  const next = [...activeDraft];
                  next[index] = event.target.value;
                  setActiveDraft(next);
                }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setActiveDraft(activeDraft.filter((_, i) => i !== index))}
                aria-label="删除规则"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secondary admin-inline-btn"
          onClick={() => setActiveDraft([
            ...activeDraft,
            tab === 'routing' ? '新增调度规则：当……时，调度……智能体。' : '新增审查规则：……',
          ])}
        >
          <Plus size={16} />
          新增规则
        </button>
      </section>
    </AdminShell>
  );
}

export default AdminPoliciesPage;
