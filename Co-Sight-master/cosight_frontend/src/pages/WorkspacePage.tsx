import { Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { Badge, Button, Panel } from '../components/ui';
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
  createMatter,
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
  { id: 'scene', label: '定场景', desc: '选择业务类型' },
  { id: 'intake', label: '补要素', desc: '确认文书与关键事实' },
  { id: 'task', label: '述事实', desc: '说明诉求与材料' },
  { id: 'run', label: '提交办理', desc: '生成办理路径' },
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
  const [searchParams] = useSearchParams();
  const requestedScenario = searchParams.get('scenario');
  const initialScenario = requestedScenario && findScenario(requestedScenario) ? requestedScenario : null;
  const [draft, setDraft] = useState(() => loadWorkspaceDraft());
  const [toolkit, setToolkit] = useState<LegalToolkitProfile | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(initialScenario);
  const [documentIntake, setDocumentIntake] = useState<DocumentIntake>(() => (
    initialScenario ? createIntakeForScenario(initialScenario) : { ...EMPTY_DOCUMENT_INTAKE }
  ));
  const [taskTitle, setTaskTitle] = useState('');
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const taskIdRef = useRef(crypto.randomUUID());
  const taskId = taskIdRef.current;
  const demoUser = loadDemoUser();

  const scenarios = toolkit?.scenarios.length ? toolkit.scenarios : fallbackScenarios;
  const effectiveScenarioId = selectedScenario ?? GENERAL_SCENARIO_ID;
  const activeScenario = scenarios.find((item) => item.id === effectiveScenarioId) ?? scenarios[0];
  const activeDefinition = findScenario(effectiveScenarioId);
  const needsIntake = Boolean(selectedScenario && activeDefinition?.outputProfile.autoGenerate);

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
    if (lastStep) return '可继续上次事项';
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
    const resolvedTitle = taskTitle.trim() || baseMessage.slice(0, 48) || documentIntake.templateLabel || '未命名事项';

    createMatter({
      id: taskId,
      title: resolvedTitle,
      query: message,
      scenario: effectiveScenarioId,
      documentIntake: needsIntake ? documentIntake : undefined,
      uploadIds,
      status: 'draft',
    });

    storePendingWorkspaceTask({
      matterId: taskId,
      content: message,
      uploadIds,
      scenario: effectiveScenarioId,
      taskId,
      taskTitle: resolvedTitle,
      documentIntake: needsIntake ? documentIntake : undefined,
    });
    clearWorkspaceDraft();
    setDraft('');
    setTaskTitle('');
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
    } else {
      setDocumentIntake({ ...EMPTY_DOCUMENT_INTAKE });
    }
  };

  const hasHistory = Boolean(getLastManusStepRaw()) || statusSummary !== '等待开始';

  return (
    <AppShell
      title="发起事项"
      subtitle="说明诉求、选择场景并补充材料，系统将为本次事项生成办理路径"
      badge={(
        <Badge tone="primary" icon={<Sparkles size={12} />}>
          {statusSummary}
        </Badge>
      )}
      actions={<Link className="lex-button lex-button-secondary lex-button-md" to="/materials">查看材料库</Link>}
      onLogout={handleLogout}
    >
      <div className="workspace-intake-shell lex-intake-v2">
        <Panel as="section" className="workspace-command-card workspace-intake-card">
          <div className="workspace-intake-layout">
            <nav className="workspace-intake-progress" aria-label="事项受理步骤">
              <p className="workspace-intake-rail-label">INTAKE</p>
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
            </nav>

            <div className="workspace-intake-main">
              <div className="workspace-intake-hero">
                <p className="eyebrow">LEGAL MATTER INTAKE</p>
                <h2>说明事项，启动办理</h2>
                <p>
                  选择专项场景后补充关键事实与文书要素；提交后系统会整理材料、检索依据并在「审查结论」中沉淀报告与文书。
                </p>
              </div>

              <div className="workspace-desk-panel">
                <div className="workspace-scenario-board" aria-label="场景类型">
                  <div className="workspace-scenario-board-head">
                    <div>
                      <span className="workspace-scenario-board-title">选择办理类型</span>
                      <em>用于确定规划路径与最终交付；不选则按通用分析处理</em>
                    </div>
                    {selectedScenario ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="workspace-scenario-clear"
                        onClick={() => handleScenarioToggle(selectedScenario)}
                      >
                        <X size={14} />
                        取消选择
                      </Button>
                    ) : (
                      <Badge tone="neutral" className="workspace-scenario-default-badge">当前：通用分析</Badge>
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

                  {selectedScenario && activeDefinition ? (
                    <div className="workspace-scenario-output" aria-live="polite">
                      <div>
                        <span>本次将交付</span>
                        <strong>{activeDefinition.outputProfile.primaryLabel}</strong>
                        <p>{activeDefinition.outputProfile.primaryHint}</p>
                      </div>
                      <em>{needsIntake ? '需补充交付信息' : '直接描述事项即可'}</em>
                    </div>
                  ) : null}
                </div>

                {needsIntake && selectedScenario && (
                  <ScenarioIntakePanel
                    scenarioId={effectiveScenarioId}
                    intake={documentIntake}
                    onChange={handleIntakeChange}
                  />
                )}

                {intakeError && <div className="admin-save-hint admin-save-hint-error">{intakeError}</div>}

                <label className="workspace-task-title-field">
                  <span>事项名称 <em>可选</em></span>
                  <input
                    className="ds-input"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="例如：服务合同付款条款审查"
                  />
                </label>

                <ComposerPanel
                  draft={draft}
                  onDraftChange={setDraft}
                  onSubmit={handleSubmit}
                  submitDisabled={needsIntake && !intakeValid}
                  placeholder={activeDefinition?.placeholder ?? '请描述事项目标、已知事实与希望获得的结论…'}
                  scenarioHint={selectedScenario && activeScenario
                    ? `${activeScenario.title}：${activeScenario.description}`
                    : '通用分析：系统将自动整理事实、检索依据并形成输出建议。'}
                  uploadMeta={{
                    userAccount: demoUser?.account ?? 'user',
                    taskId,
                    taskTitle: taskTitle.trim() || draft.trim().slice(0, 48) || documentIntake.templateLabel || '未命名事项',
                  }}
                />
              </div>
            </div>
          </div>
        </Panel>

        {hasHistory && (
          <div className="workspace-intake-foot">
            <span>有未完成的事项？</span>
            <Link className="text-button" to="/workspace/run">继续办理</Link>
            <span className="workspace-intake-foot-sep">·</span>
            <Link className="text-button" to="/workspace/result">查看结论</Link>
            <span className="workspace-intake-foot-sep">·</span>
            <Link className="text-button" to="/replay">历史回放</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default WorkspacePage;
