import { AlertTriangle, Archive, Bot, CheckCircle2, Clock3, FileClock, FileText, GitBranch, PlayCircle, RefreshCw, RotateCcw, Search, Wrench } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { fetchReplayWorkspaces } from '../lib/api';
import { findScenario } from '../lib/scenarios';
import { clearAuthed, createMatter, listMatters, loadBoundReplayEvent, saveBoundReplayEvent, setActiveMatter } from '../lib/storage';
import type { ReplayWorkspace } from '../types/replay';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '最近';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildLocalReplayItems(): ReplayWorkspace[] {
  return listMatters()
    .filter((matter) => Boolean(matter.workspacePath))
    .map((matter) => ({
      workspace_path: matter.workspacePath as string,
      workspace_name: '本地事项归档',
      title: matter.title,
      created_time: new Date(matter.completedAt ?? matter.updatedAt).toISOString(),
      message_count: 0,
      scenario: matter.scenario,
      has_result: matter.status === 'completed' || matter.status === 'archived',
      status: matter.status === 'completed' || matter.status === 'archived' ? 'completed' : 'incomplete',
    }));
}

function mergeReplayItems(remote: ReplayWorkspace[], local: ReplayWorkspace[]): ReplayWorkspace[] {
  const merged = new Map<string, ReplayWorkspace>();
  local.forEach((item) => merged.set(item.workspace_path, item));
  remote.forEach((item) => merged.set(item.workspace_path, { ...merged.get(item.workspace_path), ...item }));
  return [...merged.values()].sort((left, right) => (
    new Date(right.created_time).getTime() - new Date(left.created_time).getTime()
  ));
}

function ReplayPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ReplayWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [fallbackNotice, setFallbackNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>(() => searchParams.get('workspace') ?? loadBoundReplayEvent()?.workspace_path ?? '');

  const loadReplayList = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setFallbackNotice('');
    const localItems = buildLocalReplayItems();
    try {
      const data = await fetchReplayWorkspaces();
      const merged = mergeReplayItems(data, localItems);
      setItems(merged);
      setSelectedPath((current) => (
        merged.some((item) => item.workspace_path === current) ? current : merged[0]?.workspace_path || ''
      ));
    } catch (error) {
      if (localItems.length > 0) {
        setItems(localItems);
        setSelectedPath((current) => (
          localItems.some((item) => item.workspace_path === current) ? current : localItems[0]?.workspace_path || ''
        ));
        setFallbackNotice('回放服务暂时不可用，当前展示本地事项归档。');
      } else {
        setItems([]);
        setLoadError(error instanceof Error ? error.message : '历史记录读取失败');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReplayList();
  }, [loadReplayList]);

  useEffect(() => {
    if (!selectedPath || searchParams.get('workspace') === selectedPath) return;
    setSearchParams({ workspace: selectedPath }, { replace: true });
  }, [selectedPath, searchParams, setSearchParams]);

  const selectedEvent = useMemo(
    () => items.find((item) => item.workspace_path === selectedPath) ?? null,
    [items, selectedPath],
  );

  const filteredItems = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase('zh-CN');
    if (!keyword) return items;
    return items.filter((item) => [item.title, item.workspace_name, item.scenario]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('zh-CN').includes(keyword)));
  }, [items, searchQuery]);

  const archiveStats = useMemo(() => ({
    total: items.length,
    completed: items.filter((item) => item.status === 'completed').length,
    agents: items.reduce((total, item) => total + (item.agent_count ?? 0), 0),
    tools: items.reduce((total, item) => total + (item.tool_count ?? 0), 0),
  }), [items]);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  const ensureReplayMatter = (event: ReplayWorkspace) => {
    const existing = listMatters().find((matter) => matter.workspacePath === event.workspace_path);
    if (existing) {
      setActiveMatter(existing.id);
      return existing;
    }
    return createMatter({
      id: crypto.randomUUID(),
      title: event.title || '历史事项回放',
      query: event.title || '历史事项回放',
      scenario: event.scenario,
      uploadIds: [],
      workspacePath: event.workspace_path,
      status: 'archived',
    });
  };

  const handleStartReplay = () => {
    if (!selectedEvent) return;
    saveBoundReplayEvent(selectedEvent);
    const matter = ensureReplayMatter(selectedEvent);
    navigate(`/workspace/run?replay=true&workspace=${encodeURIComponent(selectedEvent.workspace_path)}&matter=${encodeURIComponent(matter.id)}`);
  };

  const handleOpenReport = () => {
    if (!selectedEvent) return;
    saveBoundReplayEvent(selectedEvent);
    const matter = ensureReplayMatter(selectedEvent);
    navigate(`/workspace/result?matter=${encodeURIComponent(matter.id)}`);
  };

  const completionPercent = selectedEvent
    ? selectedEvent.step_count
      ? Math.round(((selectedEvent.completed_steps ?? (selectedEvent.status === 'completed' ? selectedEvent.step_count : 0)) / selectedEvent.step_count) * 100)
      : selectedEvent.status === 'completed' ? 100 : 0
    : 0;

  return (
    <AppShell
      title="历史归档"
      subtitle="检索已归档事项，回放智能体办理路径或直接查看最终交付。"
      badge={selectedEvent ? (
        <span className="ds-badge ds-badge-success">
          <CheckCircle2 size={12} />
          已绑定对话
        </span>
      ) : (
        <span className="ds-badge ds-badge-primary">
          <RotateCcw size={12} />
          等待选择对话
        </span>
      )}
      actions={<Link className="btn btn-primary" to="/workspace/new">发起新事项</Link>}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={Archive}
        title="事项归档与运行回放"
        subtitle="每条归档保留智能体阶段、工具调用和最终交付之间的关联。"
      />

      <div className="replay-archive-v2">
        <section className="replay-archive-stats" aria-label="归档统计">
          <article><Archive size={17} /><span>归档事项</span><strong>{archiveStats.total}</strong></article>
          <article><CheckCircle2 size={17} /><span>完整交付</span><strong>{archiveStats.completed}</strong></article>
          <article><Bot size={17} /><span>智能体参与</span><strong>{archiveStats.agents || '—'}</strong></article>
          <article><Wrench size={17} /><span>工具调用</span><strong>{archiveStats.tools || '—'}</strong></article>
        </section>

        {fallbackNotice ? (
          <div className="replay-fallback-notice" role="status">
            <AlertTriangle size={15} />
            <span>{fallbackNotice}</span>
            <button type="button" onClick={() => void loadReplayList()}><RefreshCw size={14} />重新连接</button>
          </div>
        ) : null}

        <section className="replay-archive-layout">
          <div className="ds-card replay-event-picker replay-archive-list-panel">
            <div className="replay-section-head">
              <div>
                <p className="eyebrow">MATTER ARCHIVE</p>
                <h2>历史事项</h2>
              </div>
              <label className="replay-archive-search">
                <Search size={15} />
                <span className="sr-only">搜索历史事项</span>
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="搜索事项或场景" />
              </label>
            </div>

            {loading && <LoadingState label="读取历史归档中..." compact />}

            {!loading && loadError && (
              <div className="replay-load-error" role="alert">
                <AlertTriangle size={18} />
                <div><strong>历史记录暂时无法读取</strong><span>{loadError}</span></div>
                <button type="button" className="btn btn-secondary" onClick={() => void loadReplayList()}>
                  <RefreshCw size={15} />重新读取
                </button>
              </div>
            )}

            {!loading && !loadError && items.length === 0 && (
              <EmptyState
                icon={<FileClock size={22} />}
                title="暂无历史记录"
                description="当前没有已归档事项。完成一次事项办理后，记录会自动出现在这里。"
                action={<Link className="btn btn-primary" to="/workspace/new">发起第一项事项</Link>}
              />
            )}

            {!loading && !loadError && items.length > 0 && filteredItems.length === 0 ? (
              <div className="replay-search-empty"><Search size={18} /><span>没有匹配“{searchQuery}”的历史事项</span></div>
            ) : null}

            {!loading && !loadError && filteredItems.length > 0 && (
              <div className="replay-event-list">
                {filteredItems.map((item) => {
                  const selected = item.workspace_path === selectedPath;
                  return (
                    <button key={item.workspace_path} type="button" className={`replay-event-card${selected ? ' selected' : ''}`} onClick={() => setSelectedPath(item.workspace_path)} aria-pressed={selected}>
                      <span className="replay-event-icon">{selected ? <CheckCircle2 size={18} /> : <FileClock size={18} />}</span>
                      <span className="replay-event-copy">
                        <strong>{item.title}</strong>
                        <em>{findScenario(item.scenario ?? '')?.title ?? item.workspace_name} · {item.step_count ?? 0} 个阶段 · {item.message_count} 条事件</em>
                        <span className="replay-event-metrics">
                          <i><Bot size={12} />{item.agent_count ?? 0} 个智能体</i>
                          <i><Wrench size={12} />{item.tool_count ?? 0} 次工具事件</i>
                          <i className={item.status === 'completed' ? 'success' : item.status === 'completed_with_warnings' ? 'warning' : 'muted'}>
                            {item.status === 'completed' ? '结果完整' : item.status === 'completed_with_warnings' ? '带降级结果' : '过程记录'}
                          </i>
                        </span>
                      </span>
                      <span className="replay-event-time"><Clock3 size={14} />{formatTime(item.created_time)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="ds-card replay-archive-detail" aria-label="所选归档详情">
            {selectedEvent ? (
              <>
                <div className="replay-archive-detail-head">
                  <span><GitBranch size={18} /></span>
                  <div><p className="eyebrow">REPLAY READY</p><h2>{selectedEvent.title}</h2><em>{formatTime(selectedEvent.created_time)}</em></div>
                </div>
                <div className="replay-archive-detail-status">
                  <strong>{selectedEvent.status === 'completed' ? '完整交付' : selectedEvent.status === 'completed_with_warnings' ? '降级完成' : '过程归档'}</strong>
                  <span>{findScenario(selectedEvent.scenario ?? '')?.title ?? selectedEvent.workspace_name}</span>
                </div>
                <div className="replay-archive-progress">
                  <div><span>阶段完成度</span><strong>{completionPercent}%</strong></div>
                  <i><span style={{ width: `${completionPercent}%` }} /></i>
                  <p>{selectedEvent.completed_steps ?? 0} / {selectedEvent.step_count ?? '—'} 阶段 · {selectedEvent.tool_count ?? 0} 次工具调用</p>
                </div>
                <div className="replay-archive-detail-metrics">
                  <article><Bot size={15} /><span>智能体</span><strong>{selectedEvent.agent_count ?? '—'}</strong></article>
                  <article><Wrench size={15} /><span>工具调用</span><strong>{selectedEvent.tool_count ?? '—'}</strong></article>
                  <article><FileText size={15} /><span>结果交付</span><strong>{selectedEvent.has_result ? '已生成' : '可查看'}</strong></article>
                </div>
                <div className="replay-archive-actions">
                  <button type="button" className="lex-button lex-button-primary lex-button-md" onClick={handleStartReplay}><PlayCircle size={16} />回放 DAG 与工具轨迹</button>
                  <button type="button" className="lex-button lex-button-secondary lex-button-md" onClick={handleOpenReport}><FileText size={16} />查看最终报告</button>
                </div>
                <p className="replay-archive-detail-note">回放模式只读取已归档事件，不会重新调用外部工具或修改原始办理结果。</p>
              </>
            ) : (
              <EmptyState icon={<Archive size={22} />} title="请选择一项归档" description="选择左侧历史事项后，可查看完整度并进入办理回放。" />
            )}
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

export default ReplayPage;
