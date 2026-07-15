import { FileDown, FileText, FolderOpen, Loader2, ScrollText, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { fetchMaterialLibrary, resetDemoMaterials } from '../lib/api';
import { exportMarkdownUrlAsDocument } from '../lib/document-export';
import { clearAuthed, loadDemoUser } from '../lib/storage';
import type { MaterialItem, MaterialKind } from '../types/material';
import type { DocumentExportFormat } from '../types/export';

const kindLabels: Record<MaterialKind, string> = {
  upload: '上传材料',
  generated: '生成文书',
  report: '正式报告',
  process: '过程文档',
};

const kindIcons = {
  upload: Upload,
  generated: ScrollText,
  report: FileText,
  process: FileText,
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '最近';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function taskGroupLabel(item: MaterialItem): string {
  if (item.taskTitle?.trim()) return item.taskTitle.trim();
  if (item.workspacePath) return item.workspacePath.replace(/^work_space_/, '事项 ');
  if (item.taskId) return `事项 ${item.taskId.slice(0, 8)}`;
  return '未归档上传';
}

type TaskGroup = {
  key: string;
  label: string;
  items: MaterialItem[];
};

function MaterialsPage() {
  const navigate = useNavigate();
  const userAccount = loadDemoUser()?.account ?? 'user';
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [stats, setStats] = useState({ total: 0, uploads: 0, generated: 0, reports: 0, process: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MaterialKind | 'all'>('all');
  const [resetHint, setResetHint] = useState('');
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMaterialLibrary({ user: userAccount });
      if (data) {
        setItems(data.items);
        setStats({
          total: data.stats.total,
          uploads: data.stats.uploads,
          generated: data.stats.generated,
          reports: data.stats.reports,
          process: data.stats.process ?? 0,
        });
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [userAccount]);

  const visibleItems = useMemo(() => {
    const base = items.filter((item) => item.kind !== 'process');
    if (filter === 'all') return base;
    return base.filter((item) => item.kind === filter);
  }, [items, filter]);

  const taskGroups = useMemo(() => {
    const map = new Map<string, TaskGroup>();
    visibleItems.forEach((item) => {
      const key = item.taskId || item.workspacePath || item.uploadId || item.id;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
        return;
      }
      map.set(key, {
        key,
        label: taskGroupLabel(item),
        items: [item],
      });
    });
    return [...map.values()].sort((a, b) => {
      const aTime = a.items[0]?.createdAt ?? '';
      const bTime = b.items[0]?.createdAt ?? '';
      return bTime.localeCompare(aTime);
    });
  }, [visibleItems]);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  const handleReset = async () => {
    await resetDemoMaterials().catch(() => undefined);
    setResetHint('材料库已清空，仅保留后续事项产生的上传与正式交付物。');
    window.setTimeout(() => setResetHint(''), 3500);
    await load();
  };

  const canExportAsOffice = (item: MaterialItem) => (
    item.source === 'workspace'
    && Boolean(item.downloadUrl)
    && (item.kind === 'generated' || item.kind === 'report')
    && /\.(md|txt)$/i.test(item.name)
  );

  const handleExportMaterial = async (item: MaterialItem, format: DocumentExportFormat) => {
    if (!item.downloadUrl) return;
    const key = `${item.id}-${format}`;
    setExportingKey(key);
    try {
      const fileName = await exportMarkdownUrlAsDocument({
        url: item.downloadUrl,
        name: item.name,
        kind: item.kind === 'report' ? 'report' : 'generated',
        format,
      });
      setResetHint(`已下载：${fileName}`);
      window.setTimeout(() => setResetHint(''), 3500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败';
      setResetHint(message);
      window.setTimeout(() => setResetHint(''), 3500);
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <AppShell
      title="材料库"
      subtitle={`当前用户：${userAccount}`}
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={() => void handleReset()}>清空材料库</button>
          <Link className="btn btn-primary" to="/workspace/new">发起事项</Link>
        </>
      )}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={FolderOpen}
        title="材料库"
        subtitle="按用户与事项归档：保留上传材料、正式报告与生成文书；办理过程中的中间稿默认不展示。"
      />

      {resetHint && <div className="admin-save-hint">{resetHint}</div>}

      <section className="feature-stat-grid materials-stat-grid">
        <StatCard label="归档材料" value={`${stats.total}`} description="当前用户可见交付物" />
        <StatCard label="上传材料" value={`${stats.uploads}`} description="事项提交时上传" />
        <StatCard label="生成文书" value={`${stats.generated}`} description="每事项最多保留 2 份" />
        <StatCard label="正式报告" value={`${stats.reports}`} description="每事项最多保留 2 份" />
      </section>

      <section className="ds-card materials-panel">
        <div className="materials-filter-bar">
          {(['all', 'upload', 'generated', 'report'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`materials-filter-btn${filter === key ? ' active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? '全部' : kindLabels[key]}
            </button>
          ))}
          {stats.process > 0 && (
            <span className="materials-process-note">已隐藏 {stats.process} 份过程文档</span>
          )}
        </div>

        {loading && <LoadingState label="读取材料库…" compact />}

        {!loading && taskGroups.length === 0 && (
          <EmptyState
            icon={<FolderOpen size={22} />}
            title="暂无材料"
            description="完成一次事项后，上传文件与正式交付物会按事项归档显示在这里。"
          action={<Link className="btn btn-primary" to="/workspace/new" style={{ marginTop: 8 }}>去发起事项</Link>}
          />
        )}

        {!loading && taskGroups.length > 0 && (
          <div className="materials-task-groups">
            {taskGroups.map((group) => (
              <section key={group.key} className="materials-task-group">
                <div className="materials-task-group-head">
                  <strong>{group.label}</strong>
                  <span>{group.items.length} 份材料</span>
                </div>
                <div className="materials-list materials-list-compact">
                  {group.items.map((item) => {
                    const Icon = kindIcons[item.kind];
                    return (
                      <article key={item.id} className="materials-item materials-item-compact">
                        <div className="materials-item-icon">
                          <Icon size={16} />
                        </div>
                        <div className="materials-item-copy">
                          <strong>{item.name}</strong>
                          <span>
                            {kindLabels[item.kind]}
                            {item.sizeMb !== undefined ? ` · ${item.sizeMb} MB` : ''}
                          </span>
                        </div>
                        <div className="materials-item-side">
                          <em>{formatTime(item.createdAt)}</em>
                          <div className="materials-item-actions">
                            {item.downloadUrl ? (
                              <a className="btn btn-secondary btn-compact" href={item.downloadUrl} target="_blank" rel="noreferrer">
                                原文
                              </a>
                            ) : null}
                            {canExportAsOffice(item) && (['docx', 'pdf'] as const).map((format) => {
                              const key = `${item.id}-${format}`;
                              return (
                                <button
                                  key={format}
                                  type="button"
                                  className="btn btn-primary btn-compact"
                                  disabled={exportingKey === key}
                                  onClick={() => void handleExportMaterial(item, format)}
                                >
                                  {exportingKey === key ? <Loader2 size={14} className="spin" /> : <FileDown size={14} />}
                                  {format.toUpperCase()}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

export default MaterialsPage;
