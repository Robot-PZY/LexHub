import { useEffect, useState } from 'react';
import { Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import { useAdminSettings } from '../../hooks/useAdminSettings';

function AdminReviewRulesPage() {
  const { settings, saveSettings, savedHint } = useAdminSettings();
  const [draft, setDraft] = useState<string[]>(settings.reviewRules);

  useEffect(() => {
    setDraft(settings.reviewRules);
  }, [settings.reviewRules]);

  return (
    <AdminShell title="审查规则" subtitle="配置交叉审查智能体的判断维度。">
      <PageHeader
        icon={ShieldCheck}
        title="审查规则库"
        subtitle="审查智能体依据这些规则标记事实冲突、证据缺口、引用不足和文书风险。"
        action={<button type="button" className="btn btn-primary" onClick={() => saveSettings({ reviewRules: draft })}><Save size={16} />保存规则</button>}
      />

      {savedHint && <div className="admin-save-hint">{savedHint}</div>}

      <section className="ds-card admin-panel admin-panel-wide">
        <div className="admin-rule-editor">
          {draft.map((rule, index) => (
            <div key={`${index}-${rule.slice(0, 12)}`} className="admin-rule-row-edit">
              <span>{index + 1}</span>
              <input
                value={rule}
                onChange={(event) => {
                  const next = [...draft];
                  next[index] = event.target.value;
                  setDraft(next);
                }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(draft.filter((_, i) => i !== index))} aria-label="删除规则">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary admin-inline-btn"
          onClick={() => setDraft([...draft, '新增审查规则：……'])}
        >
          <Plus size={16} />
          新增规则
        </button>
      </section>
    </AdminShell>
  );
}

export default AdminReviewRulesPage;
