import { Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import ComposerPanel from '../components/workspace/ComposerPanel';
import ScenarioIntakePanel from '../components/workspace/ScenarioIntakePanel';
import { fetchLegalToolkit } from '../lib/api';
import { findScenario, SCENARIO_DEFINITIONS, scenariosToLegalProfile } from '../lib/scenarios';
import {
  clearAuthed,
  clearWorkspaceDraft,
  getLastManusStepRaw,
  getPendingRequestsRaw,
  loadWorkspaceDraft,
  saveWorkspaceDraft,
  storePendingWorkspaceTask,
  loadDemoUser,
} from '../lib/storage';
import {
  buildIntakeContextBlock,
  EMPTY_DOCUMENT_INTAKE,
  validateDocumentIntake,
} from '../types/document-intake';
import type { DocumentIntake } from '../types/document-intake';
import type { LegalScenario, LegalToolkitProfile } from '../types/legal';

const fallbackScenarios: LegalScenario[] = scenariosToLegalProfile();
const GENERAL_SCENARIO_ID = 'general_analysis';
const optionalScenarios = SCENARIO_DEFINITIONS.filter((item) => item.id !== GENERAL_SCENARIO_ID);

const intakeSteps = [
  { id: 'scene', label: '选场景', desc: '可选专项，不选即通用' },
  { id: 'intake', label: '填表单', desc: '文书类型与关键信息' },
  { id: 'task', label: '写任务', desc: '描述事实与目标' },
  { id: 'run', label: '开始处理', desc: '进入 DAG 执行页' },
];

function createIntakeForScenario(scenarioId: string): DocumentIntake {
  const scenario = findScenario(scenarioId);
  const primary = scenario?.deliverables[0];
  if (!primary) return { ...EMPTY_DOCUMENT_INTAKE };
  return {
    ...EMPTY_DOCUMENT_INTAKE,
    templateId: primary.id,
    templateLabel: primary.label,
  };
}

function WorkspacePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => loadWorkspaceDraft());
  const [toolkit, setToolkit] = useState<LegalToolkitProfile | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [documentIntake, setDocumentIntake] = useState<DocumentIntake>({ ...EMPTY_DOCUMENT_INTAKE });
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const taskIdRef = useRef(crypto.randomUUID());
  const taskId = taskIdRef.current;
  const demoUser = loadDemoUser();

  const scenarios = toolkit?.scenarios.length ? toolkit.scenarios : fallbackScenarios;
  const effectiveScenarioId = selectedScenario ?? GENERAL_SCENARIO_ID;
  const activeScenario = scenarios.find((item) => item.id === effectiveScenarioId) ?? scenarios[0];
  const activeDefinition = findScenario(effectiveScenarioId);
  const needsIntake = Boolean(activeDefinition?.outputProfile.showDeliverable);

  const intakeValid = useMemo(() => {
    if (!needsIntake) return true;
    return validateDocumentIntake(documentIntake, draft) === null;
  }, [needsIntake, documentIntake, draft]);

  const activeStep = useMemo(() => {
    if (draft.trim() && (!needsIntake || intakeValid)) return 'run';
    if (needsIntake && selectedScenario && !intakeValid) return 'intake';
    if (selectedScenario || draft.trim()) return 'task';
    return 'scene';
  }, [draft, selectedScenario, needsIntake, intakeValid]);

  const statusSummary = useMemo(() => {
    const lastStep = getLastManusStepRaw();
    const pending = getPendingRequestsRaw();
    let pendingCount = 0;
    if (pending) {
      try {
        pendingCount = Object.keys(JSON.parse(pending) as Record<string, unknown>).length;
      } catch {
        pendingCount = 0;
      }
    }
    if (lastStep) return '可继续上次任务';
    if (pendingCount > 0) return `${pendingCount} 项待处理`;
    return '等待开始';
  }, []);

  useEffect(() => {
    saveWorkspaceDraft(draft);
  }, [draft]);

  useEffect(() => {
    let cancelled = false;
    fetchLegalToolkit()
      .then((profile) => {
        if (!cancelled && profile) setToolkit(profile);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleIntakeChange = (patch: Partial<DocumentIntake>) => {
    setDocumentIntake((current) => ({ ...current, ...patch }));
    setIntakeError(null);
  };

  const handleSubmit = (uploadIds: string[] = [], content?: string) => {
    const baseMessage = (content ?? draft).trim();
    if (needsIntake) {
      const validationError = validateDocumentIntake(documentIntake, baseMessage);
      if (validationError) {
        setIntakeError(validationError);
        return;
      }
    }
    if (!baseMessage && uploadIds.length === 0) return;

    const intakeBlock = needsIntake ? buildIntakeContextBlock(documentIntake) : '';
    const message = [baseMessage, intakeBlock].filter(Boolean).join('\n\n');

    storePendingWorkspaceTask({
      content: message,
      uploadIds,
      scenario: effectiveScenarioId,
      taskId,
      taskTitle: baseMessage.slice(0, 48) || documentIntake.templateLabel || '未命名任务',
      documentIntake: needsIntake ? documentIntake : undefined,
    });
    clearWorkspaceDraft();
    setDraft('');
    setIntakeError(null);
    navigate('/workspace/run');
  };

  const handleLogout = () => {
    clearAuthed();
    clearWorkspaceDraft();
    navigate('/login');
  };

  const handleScenarioToggle = (scenarioId: string) => {
    const definition = findScenario(scenarioId);
    const nextSelected = selectedScenario === scenarioId ? null : scenarioId;
    setSelectedScenario(nextSelected);
    setIntakeError(null);
    if (nextSelected && definition) {
      setDocumentIntake(createIntakeForScenario(nextSelected));
      if (!draft.trim()) {
        setDraft(definition.examples[0] || `${definition.title}：请根据现有材料完成分析，并给出可复核建议。`);
      }
    } else {
      setDocumentIntake({ ...EMPTY_DOCUMENT_INTAKE });
    }
  };

  const hasHistory = Boolean(getLastManusStepRaw()) || statusSummary !== '等待开始';

  return (
    <AppShell
      title="智能工作台"
      subtitle="选场景、填表单、描述任务 — 统一进入 Co-Sight 调度"
      badge={(
        <span className="ds-badge ds-badge-primary">
          <Sparkles size={12} />
          {statusSummary}
        </span>
      )}
      actions={<Link className="btn btn-secondary" to="/materials">材料库</Link>}
      onLogout={handleLogout}
    >
      <div className="workspace-intake-shell">
        <section className="ds-card workspace-command-card workspace-intake-card">
          <div className="workspace-intake-layout">
            <aside className="workspace-intake-rail" aria-label="任务步骤">
              <p className="workspace-intake-rail-label">WORKFLOW</p>
              {intakeSteps
                .filter((step) => step.id !== 'intake' || needsIntake)
                .map((step, index) => (
                  <div
                    key={step.id}
                    className={`workspace-intake-step${activeStep === step.id ? ' active' : ''}`}
                  >
                    <strong>{`0${index + 1} ${step.label}`}</strong>
                    <span>{step.desc}</span>
                  </div>
                ))}
            </aside>

            <div className="workspace-intake-main">
              <div className="workspace-intake-hero">
                <p className="eyebrow">LEGAL TASK INTAKE</p>
                <h2>描述任务，开始处理</h2>
                <p>
                  选择专项场景后将出现文书表单；填写后与任务描述一并提交，执行完成后在「任务结果」自动生成文书。
                </p>
              </div>

              <div className="workspace-desk-panel">
                <div className="workspace-scenario-board" aria-label="场景类型">
                  <div className="workspace-scenario-board-head">
                    <div>
                      <span className="workspace-scenario-board-title">专项场景</span>
                      <em>可选 · 不选则按通用分析处理</em>
                    </div>
                    {selectedScenario ? (
                      <button
                        type="button"
                        className="workspace-scenario-clear"
                        onClick={() => handleScenarioToggle(selectedScenario)}
                      >
                        <X size={14} />
                        取消选择
                      </button>
                    ) : (
                      <span className="workspace-scenario-default-badge">当前：通用分析</span>
                    )}
                  </div>

                  <div className="workspace-scenario-group-chips">
                    {optionalScenarios.map((item) => {
                      const available = scenarios.some((scenario) => scenario.id === item.id);
                      if (!available && toolkit?.scenarios.length) return null;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`workspace-scenario-chip${selectedScenario === item.id ? ' active' : ''}`}
                          title={item.description}
                          onClick={() => handleScenarioToggle(item.id)}
                        >
                          {item.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {needsIntake && selectedScenario && (
                  <ScenarioIntakePanel
                    scenarioId={effectiveScenarioId}
                    intake={documentIntake}
                    onChange={handleIntakeChange}
                  />
                )}

                {intakeError && <div className="admin-save-hint admin-save-hint-error">{intakeError}</div>}

                <ComposerPanel
                  draft={draft}
                  onDraftChange={setDraft}
                  onSubmit={handleSubmit}
                  submitDisabled={needsIntake && !intakeValid}
                  placeholder={activeDefinition?.placeholder ?? '请描述任务目标与已知事实…'}
                  scenarioHint={selectedScenario && activeScenario
                    ? `${activeScenario.title}：${activeScenario.description}`
                    : '通用分析：系统将自动规划检索、分析与输出路径。'}
                  uploadMeta={{
                    userAccount: demoUser?.account ?? 'user',
                    taskId,
                    taskTitle: draft.trim().slice(0, 48) || documentIntake.templateLabel || '未命名任务',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {hasHistory && (
          <div className="workspace-intake-foot">
            <span>有未完成的任务？</span>
            <Link className="text-button" to="/workspace/run">继续执行</Link>
            <span className="workspace-intake-foot-sep">·</span>
            <Link className="text-button" to="/workspace/result">查看结果</Link>
            <span className="workspace-intake-foot-sep">·</span>
            <Link className="text-button" to="/replay">归档回放</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default WorkspacePage;
