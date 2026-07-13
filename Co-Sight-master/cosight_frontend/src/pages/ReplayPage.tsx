import { AlertTriangle, Bot, CheckCircle2, Clock3, FileClock, PlayCircle, RefreshCw, RotateCcw, Wrench } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { fetchReplayWorkspaces } from '../lib/api';
import { clearAuthed, createMatter, loadBoundReplayEvent, saveBoundReplayEvent } from '../lib/storage';
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

function ReplayPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReplayWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>(() => loadBoundReplayEvent()?.workspace_path ?? '');

  const loadReplayList = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchReplayWorkspaces();
      setItems(data);
      setSelectedPath((current) => current || data[0]?.workspace_path || '');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '历史记录读取失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReplayList();
  }, [loadReplayList]);

  const selectedEvent = useMemo(
    () => items.find((item) => item.workspace_path === selectedPath) ?? null,
    [items, selectedPath],
  );

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  const handleStartReplay = () => {
    if (!selectedEvent) return;
    saveBoundReplayEvent(selectedEvent);
    const matter = createMatter({
      id: crypto.randomUUID(),
      title: selectedEvent.title || '历史事项回放',
      query: selectedEvent.title || '历史事项回放',
      uploadIds: [],
      workspacePath: selectedEvent.workspace_path,
      status: 'archived',
    });
    navigate(`/workspace/run?replay=true&workspace=${encodeURIComponent(selectedEvent.workspace_path)}&matter=${encodeURIComponent(matter.id)}`);
  };

  return (
    <AppShell
      title="历史回放"
      subtitle="先选择一段历史对话，再进入对应办理过程回放。"
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
      actions={<Link className="btn btn-primary" to="/workspace">发起新事项</Link>}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={FileClock}
        title="选择历史对话"
        subtitle="本次查看会绑定到所选对话；点击开始回放后，再载入该对话对应的路径、轨迹与处理记录。"
      />

      <section className="ds-card replay-event-picker">
        <div className="replay-section-head">
          <div>
            <p className="eyebrow">CONVERSATION BINDING</p>
            <h2>绑定一段对话后开始回放</h2>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedEvent}
            onClick={handleStartReplay}
          >
            <PlayCircle size={16} />
            开始回放
          </button>
        </div>

        {loading && <LoadingState label="读取历史对话中..." compact />}

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
            description="当前没有可回放记录。完成一次事项办理后，历史对话会出现在这里。"
            action={(
              <Link className="btn btn-primary" to="/workspace" style={{ marginTop: 8 }}>
                发起第一项事项
              </Link>
            )}
          />
        )}

        {!loading && !loadError && items.length > 0 && (
          <div className="replay-event-list">
            {items.map((item) => {
              const selected = item.workspace_path === selectedPath;
              return (
                <button
                  key={item.workspace_path}
                  type="button"
                  className={`replay-event-card${selected ? ' selected' : ''}`}
                  onClick={() => setSelectedPath(item.workspace_path)}
                >
                  <span className="replay-event-icon">
                    {selected ? <CheckCircle2 size={18} /> : <FileClock size={18} />}
                  </span>
                  <span className="replay-event-copy">
                    <strong>{item.title}</strong>
                    <em>{item.workspace_name} · {item.step_count ?? 0} 个阶段 · {item.message_count} 条事件</em>
                    <span className="replay-event-metrics">
                      <i><Bot size={12} />{item.agent_count ?? 0} 个智能体</i>
                      <i><Wrench size={12} />{item.tool_count ?? 0} 次工具事件</i>
                      <i className={item.status === 'completed' ? 'success' : item.status === 'completed_with_warnings' ? 'warning' : 'muted'}>
                        {item.status === 'completed' ? '结果完整' : item.status === 'completed_with_warnings' ? '带降级结果' : '过程记录'}
                      </i>
                    </span>
                  </span>
                  <span className="replay-event-time">
                    <Clock3 size={14} />
                    {formatTime(item.created_time)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

export default ReplayPage;
