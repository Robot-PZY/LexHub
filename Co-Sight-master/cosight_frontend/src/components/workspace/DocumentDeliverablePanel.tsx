import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, FileText, Sparkles } from 'lucide-react';
import ExecutionExportActions from '../documents/ExecutionExportActions';
import { Button } from '../ui';
import { generateContractDocumentViaApi, generateDocumentViaApi } from '../../lib/api';
import { buildCaseFactsFromSnapshot, buildExportPayloadFromSnapshot } from '../../lib/execution-export';
import { renderMarkdownHtml } from '../../lib/report-parser';
import { findScenario, getScenarioOutputProfile } from '../../lib/scenarios';
import { mergeIntakeWithSnapshotFacts, isContractTemplate, buildIntakeContextBlock } from '../../types/document-intake';
import type { DocumentIntake } from '../../types/document-intake';
import type { DocumentSection, DocumentTemplateId } from '../../types/export';
import type { ExecutionSnapshot } from '../../types/execution';
import type { ResultInsight } from '../../types/chat';

type DocumentDeliverablePanelProps = {
  scenarioId?: string;
  snapshot: ExecutionSnapshot | null;
  resultInsight?: ResultInsight;
  documentIntake?: DocumentIntake | null;
  autoGenerate?: boolean;
  collapsed?: boolean;
  prominent?: boolean;
  forceExpanded?: boolean;
};

function DocumentDeliverablePanel({
  scenarioId,
  snapshot,
  resultInsight,
  documentIntake,
  autoGenerate,
  collapsed = false,
  prominent = false,
  forceExpanded = false,
}: DocumentDeliverablePanelProps) {
  const scenario = findScenario(scenarioId ?? '');
  const profile = getScenarioOutputProfile(scenarioId);
  const deliverables = scenario?.deliverables ?? [
    { id: 'task_summary_report' as DocumentTemplateId, label: '事项总结报告', description: '基于办理结果生成' },
  ];
  const defaultTemplate = documentIntake?.templateId ?? deliverables[0].id;
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplateId>(defaultTemplate);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{
    title: string;
    sections: DocumentSection[];
    researchUsed: number;
    templateHintsUsed?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsed || forceExpanded);
  const autoTriggeredRef = useRef(false);

  const shouldAutoGenerate = autoGenerate ?? profile.autoGenerate;

  useEffect(() => {
    if (documentIntake?.templateId) {
      setActiveTemplate(documentIntake.templateId);
    }
  }, [documentIntake?.templateId]);

  const exportPayload = useMemo(() => {
    if (preview) {
      return {
        templateId: activeTemplate,
        format: 'docx' as const,
        title: preview.title,
        sections: preview.sections,
        generationMode: 'llm' as const,
      };
    }
    if (!snapshot) return null;
    return buildExportPayloadFromSnapshot(snapshot, activeTemplate, 'docx', resultInsight, {
      generationMode: 'llm',
      extraInstructions: documentIntake?.extraInstructions,
    });
  }, [preview, snapshot, activeTemplate, resultInsight, documentIntake?.extraInstructions]);

  const primaryTemplate = documentIntake?.templateId ?? deliverables[0]?.id;

  const handleGenerate = async (templateId: DocumentTemplateId = activeTemplate) => {
    if (!snapshot) return;
    setGenerating(true);
    setError(null);
    setExpanded(true);
    try {
      if (documentIntake && isContractTemplate(templateId)) {
        const merged = mergeIntakeWithSnapshotFacts(
          { ...documentIntake, templateId, templateLabel: deliverables.find((d) => d.id === templateId)?.label ?? documentIntake.templateLabel },
          buildCaseFactsFromSnapshot(snapshot, resultInsight),
        );
        const result = await generateContractDocumentViaApi({
          templateId,
          contractType: merged.contractType,
          partyA: merged.partyA,
          partyB: merged.partyB,
          subjectMatter: merged.subjectMatter,
          keyClauses: merged.keyClauses,
          contractExcerpt: merged.contractExcerpt,
          materialNotes: merged.materialNotes,
          userGoal: merged.userGoal,
          extraInstructions: merged.extraInstructions,
          useResearch: true,
        });
        if (!result) {
          setError('文书生成失败，请检查文书生成服务配置。');
          setPreview(null);
          return;
        }
        setPreview({
          title: String(result.title || merged.templateLabel || '文书草稿'),
          sections: (result.sections as DocumentSection[] | undefined) ?? [],
          researchUsed: Number(result.researchUsed ?? 0),
          templateHintsUsed: Number(result.templateHintsUsed ?? 0),
        });
        return;
      }

      const caseFacts = documentIntake
        ? [
            buildIntakeContextBlock(documentIntake),
            buildCaseFactsFromSnapshot(snapshot, resultInsight),
          ].filter(Boolean).join('\n\n')
        : buildCaseFactsFromSnapshot(snapshot, resultInsight);

      const result = await generateDocumentViaApi({
        templateId,
        caseFacts,
        useResearch: true,
        extraInstructions: documentIntake?.extraInstructions,
      });
      if (!result) {
        setError('文书生成失败，请检查文书生成服务配置。');
        setPreview(null);
        return;
      }
      setPreview({
        title: String(result.title || deliverables.find((item) => item.id === templateId)?.label || '文书草稿'),
        sections: (result.sections as DocumentSection[] | undefined) ?? [],
        researchUsed: Number(result.researchUsed ?? 0),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
      setPreview(null);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!shouldAutoGenerate || !snapshot || autoTriggeredRef.current || !primaryTemplate) return;
    const completed = snapshot.stats.completedSteps >= snapshot.stats.stepCount && snapshot.stats.stepCount > 0;
    if (!completed && !snapshot.result) return;
    autoTriggeredRef.current = true;
    void handleGenerate(primaryTemplate);
  }, [shouldAutoGenerate, snapshot, primaryTemplate, documentIntake]);

  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  if (!snapshot) return null;

  const panelClass = [
    'ds-card',
    'document-deliverable-panel',
    prominent ? 'document-deliverable-prominent' : '',
    collapsed && !expanded ? 'document-deliverable-collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <section className={panelClass}>
      <div className="document-deliverable-head">
        <div>
          <p className="eyebrow">{prominent ? 'PRIMARY DELIVERABLE' : 'OPTIONAL DELIVERABLE'}</p>
          <h3>{prominent ? profile.primaryLabel : '附加文书'}</h3>
          <p>
            {documentIntake
              ? `已载入事项受理时填写的「${documentIntake.templateLabel}」参数，结合办理结论生成。`
              : prominent
                ? profile.primaryHint
                : '本场景以报告/审查为主，如需律师函等正式文书可在此按需生成。'}
          </p>
        </div>
        <div className="document-deliverable-head-actions">
          {collapsed && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setExpanded((value) => !value)}
              trailingIcon={<ChevronDown size={16} className={expanded ? 'open' : ''} />}
            >
              {expanded ? '收起' : '展开文书区'}
            </Button>
          )}
          {(expanded || !collapsed) && (
            <Button
              type="button"
              variant="primary"
              loading={generating}
              leadingIcon={<Sparkles size={16} />}
              onClick={() => void handleGenerate()}
            >
              {preview ? '重新生成' : '生成文书预览'}
            </Button>
          )}
        </div>
      </div>

      {(expanded || !collapsed) && (
        <>
          <div className="document-deliverable-templates">
            {deliverables.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`document-deliverable-card${activeTemplate === item.id ? ' active' : ''}`}
                onClick={() => {
                  setActiveTemplate(item.id);
                  setPreview(null);
                  autoTriggeredRef.current = false;
                }}
              >
                {index === 0 && prominent && <span className="document-deliverable-recommend">推荐</span>}
                <FileText size={18} />
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>

          {error && <div className="admin-save-hint admin-save-hint-error">{error}</div>}

          {generating && !preview && (
            <div className="document-deliverable-skeleton">
              <div className="document-deliverable-skeleton-line wide" />
              <div className="document-deliverable-skeleton-line" />
              <div className="document-deliverable-skeleton-line" />
              <div className="document-deliverable-skeleton-block" />
              <p>正在结合事项信息、办理结论与法规检索生成文书…</p>
            </div>
          )}

          {preview && (
            <div className="documents-preview-panel document-deliverable-preview">
              <div className="documents-preview-meta">
                <strong>{preview.title}</strong>
                <span>
                  引用依据 {preview.researchUsed} 条
                  {preview.templateHintsUsed ? ` · 模板参考 ${preview.templateHintsUsed} 条` : ''}
                  {' · LLM 结构化生成'}
                </span>
              </div>
              {preview.sections.map((section) => (
                <article key={section.title} className="documents-preview-section">
                  <h4>{section.title}</h4>
                  <div
                    className="document-deliverable-section-body"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(section.body) }}
                  />
                </article>
              ))}
            </div>
          )}

          <div className="document-deliverable-export">
            <span>满意后导出正式文书：</span>
            <ExecutionExportActions payload={exportPayload} onSuccess={() => undefined} />
          </div>
        </>
      )}
    </section>
  );
}

export default DocumentDeliverablePanel;
