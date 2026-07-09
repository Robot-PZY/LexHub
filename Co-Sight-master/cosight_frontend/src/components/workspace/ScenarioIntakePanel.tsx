import { FileText } from 'lucide-react';
import { findScenario } from '../../lib/scenarios';
import type { DocumentIntake } from '../../types/document-intake';
import { isContractTemplate } from '../../types/document-intake';
import type { DocumentTemplateId } from '../../types/export';

type ScenarioIntakePanelProps = {
  scenarioId: string;
  intake: DocumentIntake;
  onChange: (patch: Partial<DocumentIntake>) => void;
};

function ScenarioIntakePanel({ scenarioId, intake, onChange }: ScenarioIntakePanelProps) {
  const scenario = findScenario(scenarioId);
  const deliverables = scenario?.deliverables ?? [];
  const showContractFields = isContractTemplate(intake.templateId)
    || scenarioId === 'contract_review'
    || scenarioId === 'document_draft';

  if (!scenario?.outputProfile.showDeliverable || deliverables.length === 0) {
    return null;
  }

  return (
    <section className="workspace-intake-form">
      <div className="workspace-intake-form-head">
        <FileText size={18} />
        <div>
          <strong>文书信息（提交前填写）</strong>
          <p>选定文书类型与关键要素，事项完成后将按场景自动匹配并生成文书。</p>
        </div>
      </div>

      <div className="document-deliverable-templates workspace-intake-templates">
        {deliverables.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`document-deliverable-card${intake.templateId === item.id ? ' active' : ''}`}
            onClick={() => onChange({ templateId: item.id as DocumentTemplateId, templateLabel: item.label })}
          >
            {index === 0 && <span className="document-deliverable-recommend">推荐</span>}
            <FileText size={18} />
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </button>
        ))}
      </div>

      {showContractFields && (
        <div className="documents-contract-form-grid">
          <label className="admin-field">
            <span>生成目标</span>
            <input
              className="ds-input"
              value={intake.userGoal}
              onChange={(event) => onChange({ userGoal: event.target.value })}
              placeholder="如：出具审查意见 / 起草完整合同"
            />
          </label>
          <label className="admin-field">
            <span>合同类型</span>
            <input
              className="ds-input"
              value={intake.contractType}
              onChange={(event) => onChange({ contractType: event.target.value })}
              placeholder="技术服务合同、采购合同等"
            />
          </label>
          <label className="admin-field">
            <span>甲方</span>
            <input
              className="ds-input"
              value={intake.partyA}
              onChange={(event) => onChange({ partyA: event.target.value })}
              placeholder="甲方名称"
            />
          </label>
          <label className="admin-field">
            <span>乙方</span>
            <input
              className="ds-input"
              value={intake.partyB}
              onChange={(event) => onChange({ partyB: event.target.value })}
              placeholder="乙方名称"
            />
          </label>
          <label className="admin-field">
            <span>标的 / 合作内容</span>
            <input
              className="ds-input"
              value={intake.subjectMatter}
              onChange={(event) => onChange({ subjectMatter: event.target.value })}
              placeholder="服务范围、货物名称等"
            />
          </label>
        </div>
      )}

      {showContractFields && (
        <>
          <label className="admin-field">
            <span>关注条款 / 拟约定要点</span>
            <textarea
              className="ds-input"
              rows={2}
              value={intake.keyClauses}
              onChange={(event) => onChange({ keyClauses: event.target.value })}
              placeholder="付款、违约、知识产权、争议解决…"
            />
          </label>
          {(intake.templateId === 'contract_review_report' || intake.templateId === 'clause_revision_memo') && (
            <label className="admin-field">
              <span>合同原文摘录</span>
              <textarea
                className="ds-input"
                rows={4}
                value={intake.contractExcerpt}
                onChange={(event) => onChange({ contractExcerpt: event.target.value })}
                placeholder="粘贴需审查或修订的合同条款…"
              />
            </label>
          )}
        </>
      )}

      {!showContractFields && (
        <>
          <label className="admin-field">
            <span>材料与事实摘要</span>
            <textarea
              className="ds-input"
              rows={3}
              value={intake.materialNotes}
              onChange={(event) => onChange({ materialNotes: event.target.value })}
              placeholder="已知事实、证据缺口、希望文书覆盖的要点…"
            />
          </label>
          <label className="admin-field">
            <span>生成目标</span>
            <input
              className="ds-input"
              value={intake.userGoal}
              onChange={(event) => onChange({ userGoal: event.target.value })}
              placeholder="如：出具证据清单 / 法律意见摘要"
            />
          </label>
        </>
      )}

      <label className="admin-field">
        <span>补充说明（可选）</span>
        <textarea
          className="ds-input"
          rows={2}
          value={intake.extraInstructions}
          onChange={(event) => onChange({ extraInstructions: event.target.value })}
          placeholder="语气、重点条款、需规避的表述等"
        />
      </label>
    </section>
  );
}

export default ScenarioIntakePanel;
