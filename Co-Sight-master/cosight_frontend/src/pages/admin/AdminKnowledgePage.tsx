import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock3,
  Database,
  Download,
  FileText,
  Globe,
  Library,
  RefreshCw,
  Scale,
  Settings2,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import KnowledgeSimpleBrowser from '../../components/admin/KnowledgeSimpleBrowser';
import KnowledgeStatuteBrowser from '../../components/admin/KnowledgeStatuteBrowser';
import PageHeader from '../../components/ui/PageHeader';
import {
  bootstrapKnowledge,
  fetchKnowledgeConfig,
  fetchKnowledgeCrawlSeeds,
  fetchKnowledgeCrawlStatus,
  fetchKnowledgeLibrarySummary,
  importContractSeedPack,
  ingestKnowledgeFiles,
  runKnowledgeCrawl,
  triggerScheduledKnowledgeCrawl,
  updateKnowledgeCrawlSchedule,
  type KnowledgeConfig,
  type KnowledgeCrawlScheduleStatus,
  type KnowledgeIngestCollection,
  type KnowledgeLibrarySummary,
} from '../../lib/api';

type LibraryId = 'law' | 'templates' | 'cases';
type PageTab = 'browse' | 'import' | 'config';

type CrawlSeed = {
  id: string;
  name: string;
  keywords?: string[];
  tags?: string[];
  category?: string;
};

const LIBRARIES: Array<{
  id: LibraryId;
  name: string;
  desc: string;
  icon: typeof Scale;
  collection?: KnowledgeIngestCollection;
  kind?: 'rule' | 'case';
}> = [
  { id: 'law', name: '法规库', desc: '官方法规 · 合同审查引用', icon: Scale },
  { id: 'templates', name: '文书模板', desc: '合同起草/审查模板骨架', icon: Library, collection: 'templates' },
  { id: 'cases', name: '类案参考', desc: '合同纠纷类案摘要', icon: FileText, collection: 'knowledge', kind: 'case' },
];

const TEMPLATE_TAG_OPTIONS = ['合同', '合同审查', '合同起草', 'NDA', '律师函'];

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function countForLibrary(id: LibraryId, summary: KnowledgeLibrarySummary | null): number {
  if (!summary) return 0;
  if (id === 'law') return summary.lawArticles;
  if (id === 'templates') return summary.templates;
  return summary.cases;
}

function AdminKnowledgePage() {
  const [pageTab, setPageTab] = useState<PageTab>('browse');
  const [activeLibrary, setActiveLibrary] = useState<LibraryId>('law');
  const [summary, setSummary] = useState<KnowledgeLibrarySummary | null>(null);
  const [kbConfig, setKbConfig] = useState<KnowledgeConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [importing, setImporting] = useState(false);
  const [hint, setHint] = useState('');
  const [crawlSeeds, setCrawlSeeds] = useState<CrawlSeed[]>([]);
  const [selectedSeedIds, setSelectedSeedIds] = useState<Set<string>>(new Set());
  const [crawlKeyword, setCrawlKeyword] = useState('');
  const [crawlSchedule, setCrawlSchedule] = useState<KnowledgeCrawlScheduleStatus | null>(null);
  const [backendReady, setBackendReady] = useState(true);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const activeMeta = LIBRARIES.find((item) => item.id === activeLibrary)!;
  const totalEntries = summary
    ? summary.lawArticles + summary.templates + summary.cases
    : 0;

  const refreshAll = async () => {
    const [libSummary, config] = await Promise.all([
      fetchKnowledgeLibrarySummary(),
      fetchKnowledgeConfig().catch(() => null),
      loadCrawlMeta(),
    ]);
    setBackendReady(libSummary !== null);
    setSummary(libSummary);
    setKbConfig(config);
    setRefreshKey((value) => value + 1);
  };

  const loadCrawlMeta = async () => {
    const [seedsPayload, status] = await Promise.all([
      fetchKnowledgeCrawlSeeds().catch(() => null),
      fetchKnowledgeCrawlStatus().catch(() => null),
    ]);
    const seeds = (seedsPayload?.seeds as CrawlSeed[] | undefined) ?? [];
    setCrawlSeeds(seeds);
    setSelectedSeedIds(new Set(seeds.map((item) => item.id)));
    setCrawlSchedule(status);
  };

  useEffect(() => {
    void (async () => {
      const boot = await bootstrapKnowledge().catch(() => null);
      if (!boot) setBackendReady(false);
      await refreshAll();
    })();
  }, []);

  const showHint = (message: string) => {
    setHint(message);
    window.setTimeout(() => setHint(''), 4000);
  };

  const handleContractPack = async () => {
    setImporting(true);
    try {
      const result = await importContractSeedPack();
      if (!result) {
        window.alert('合同种子包导入失败');
        return;
      }
      const count = result.import?.total_items ?? 0;
      showHint(`合同文书种子包已更新：${count} 条（模板 + 类案）`);
      await refreshAll();
    } finally {
      setImporting(false);
    }
  };

  const handleBootstrap = async () => {
    setImporting(true);
    try {
      const result = await bootstrapKnowledge();
      if (!result) {
        window.alert('初始化失败，请确认后端已启动。');
        return;
      }
      showHint(result.imported ? '已导入文书模板与类案样例数据。' : '样例数据已就绪，无需重复导入。');
      await refreshAll();
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((file) => /\.(txt|md|docx)$/i.test(file.name));
    if (!files.length) {
      window.alert('请选择 txt / md / docx 文件');
      return;
    }
    const collection: KnowledgeIngestCollection = activeMeta.collection ?? 'knowledge';
    setImporting(true);
    try {
      const result = await ingestKnowledgeFiles(files, collection);
      if (!result) {
        window.alert('入库失败');
        return;
      }
      showHint(`文件入库：成功 ${result.ingested ?? 0}，失败 ${result.failed ?? 0}`);
      await refreshAll();
    } finally {
      setImporting(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const handleCrawl = async (mode: 'selected' | 'all' | 'keyword') => {
    setImporting(true);
    try {
      let payload: { seedIds?: string[]; keywords?: string[] } = {};
      if (mode === 'keyword') {
        const kw = crawlKeyword.trim();
        if (!kw) return window.alert('请输入法规关键词');
        payload = { keywords: [kw] };
      } else if (mode === 'all') {
        payload = { seedIds: crawlSeeds.map((item) => item.id) };
      } else {
        if (!selectedSeedIds.size) return window.alert('请至少选择一部法规');
        payload = { seedIds: Array.from(selectedSeedIds) };
      }
      const result = await runKnowledgeCrawl(payload);
      if (!result) return window.alert('同步失败');
      const rows = (result.results as Array<{ status?: string }> | undefined) ?? [];
      showHint(`法规同步：新增 ${rows.filter((row) => row.status === 'ingested').length} 部`);
      await refreshAll();
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminShell title="知识库" subtitle="法规 · 合同模板 · 类案 — 为检索与合同文书引擎提供依据。">
      <PageHeader
        icon={BookOpen}
        title="法律知识库"
        subtitle="三库分工：法规检索、合同模板 RAG、类案参考；审查规则在「策略规则」页维护。"
        action={(
          <div className="kb-page-actions">
            <button type="button" className="btn btn-ghost" onClick={() => void refreshAll()}>
              <RefreshCw size={16} />
              刷新
            </button>
            <button type="button" className="btn btn-secondary" disabled={importing} onClick={() => void handleBootstrap()}>
              <Sparkles size={16} />
              初始化样例数据
            </button>
          </div>
        )}
      />

      {hint && <div className="admin-save-hint">{hint}</div>}

      {(!backendReady || totalEntries === 0) && (
        <div className="kb-empty-banner">
          <strong>{!backendReady ? '后端未连接，知识库无法加载' : '知识库暂无内容'}</strong>
          <p>
            {!backendReady
              ? '请先启动 cosight_server，再导入「合同文书种子包」。'
              : '推荐顺序：① 合同文书种子包 → ② NPC 同步民法典/劳动合同法 → ③ 智能工作台选场景验证生成。'}
          </p>
          <p className="kb-empty-banner-note">
            审查规则不在此维护，请到 <Link to="/admin/policies?tab=review">策略规则 → 审查规则</Link> 编辑。
          </p>
        </div>
      )}

      {kbConfig && (
        <section className={`kb-config-strip${kbConfig.contractReadiness.ready ? ' ready' : ''}`}>
          <div>
            <strong>合同文书就绪度</strong>
            <span>
              模板 {kbConfig.contractReadiness.templates} · 类案 {kbConfig.contractReadiness.cases} · 法规条 {kbConfig.contractReadiness.lawArticles}
            </span>
          </div>
          <div className="kb-config-strip-meta">
            <code>{kbConfig.chromaPersistDir}</code>
            <span className={kbConfig.contractReadiness.ready ? 'ds-badge ds-badge-success' : 'ds-badge'}>
              {kbConfig.contractReadiness.ready ? '可支撑合同文书' : '待完善'}
            </span>
          </div>
        </section>
      )}

      <section className="kb-summary-grid kb-summary-grid-3">
        {LIBRARIES.map((lib) => {
          const Icon = lib.icon;
          const count = countForLibrary(lib.id, summary);
          return (
            <button
              key={lib.id}
              type="button"
              className={`kb-summary-card${activeLibrary === lib.id && pageTab === 'browse' ? ' active' : ''}`}
              onClick={() => { setActiveLibrary(lib.id); setPageTab('browse'); }}
            >
              <Icon size={18} />
              <div>
                <strong>{lib.name}</strong>
                <span>{lib.desc}</span>
              </div>
              <em>{count}</em>
            </button>
          );
        })}
      </section>

      <div className="kb-page-tabs">
        <button type="button" className={pageTab === 'browse' ? 'active' : ''} onClick={() => setPageTab('browse')}>
          <Database size={15} />
          内容浏览
        </button>
        <button type="button" className={pageTab === 'import' ? 'active' : ''} onClick={() => setPageTab('import')}>
          <UploadCloud size={15} />
          数据导入
        </button>
        <button type="button" className={pageTab === 'config' ? 'active' : ''} onClick={() => setPageTab('config')}>
          <Settings2 size={15} />
          配置与就绪
        </button>
      </div>

      {pageTab === 'browse' && (
        <section className="ds-card kb-main-card">
          <div className="kb-main-card-head">
            <strong>{activeMeta.name}</strong>
            <span>共 {countForLibrary(activeLibrary, summary)} 条可检索内容</span>
          </div>

          {activeLibrary === 'law' && <KnowledgeStatuteBrowser refreshKey={refreshKey} />}

          {activeLibrary === 'templates' && (
            <KnowledgeSimpleBrowser
              libraryName="文书模板"
              collection="templates"
              tagOptions={TEMPLATE_TAG_OPTIONS}
              refreshKey={refreshKey}
              emptyHint="暂无模板。请在「数据导入」点击「合同文书种子包」，或上传 docx/md 模板文件。"
            />
          )}

          {activeLibrary === 'cases' && (
            <KnowledgeSimpleBrowser
              libraryName="类案参考"
              collection="knowledge"
              kind="case"
              refreshKey={refreshKey}
              emptyHint="暂无类案。样例数据包含 2 条类案摘要，请先「初始化样例数据」。"
            />
          )}
        </section>
      )}

      {pageTab === 'import' && (
        <div className="kb-import-stack">
          <article className="ds-card kb-import-card kb-import-card-highlight">
            <div className="kb-import-card-head">
              <Sparkles size={18} />
              <div>
                <strong>合同文书种子包（推荐）</strong>
                <p>一键写入合同模板骨架与合同类案，可重复执行以更新，直接支撑文书生成与知识增强。</p>
              </div>
              <button type="button" className="btn btn-primary" disabled={importing} onClick={() => void handleContractPack()}>
                导入合同种子包
              </button>
            </div>
          </article>

          <article className="ds-card kb-import-card">
            <div className="kb-import-card-head">
              <Download size={18} />
              <div>
                <strong>全量样例数据包</strong>
                <p>导入全部模板、类案与审查规则（含非合同类）。审查规则正文请在策略规则页维护展示。</p>
              </div>
              <button type="button" className="btn btn-secondary" disabled={importing} onClick={() => void handleBootstrap()}>
                初始化样例数据
              </button>
            </div>
          </article>

          <article className="ds-card kb-import-card">
            <div className="kb-import-card-head">
              <UploadCloud size={18} />
              <div>
                <strong>文件上传</strong>
                <p>上传 txt / md / docx，写入当前选中库：{activeMeta.name}</p>
              </div>
            </div>
            <div className="kb-library-pills">
              {LIBRARIES.map((lib) => (
                <button
                  key={lib.id}
                  type="button"
                  className={activeLibrary === lib.id ? 'active' : ''}
                  onClick={() => setActiveLibrary(lib.id)}
                >
                  {lib.name}
                </button>
              ))}
            </div>
            <div
              className="admin-kb-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); void handleFileUpload(event.dataTransfer.files); }}
            >
              <p>拖拽文件到此处，或点击选择</p>
              <input ref={uploadInputRef} type="file" accept=".txt,.md,.docx" multiple hidden onChange={(event) => void handleFileUpload(event.target.files)} />
              <button type="button" className="btn btn-secondary" disabled={importing} onClick={() => uploadInputRef.current?.click()}>
                选择文件
              </button>
            </div>
          </article>

          {activeLibrary === 'law' && (
            <article className="ds-card kb-import-card">
              <div className="kb-import-card-head">
                <Globe size={18} />
                <div>
                  <strong>官方法规同步（NPC）</strong>
                  <p>从 flk.npc.gov.cn 爬取法规并按条入库，适合补充法规库。</p>
                </div>
              </div>

              {crawlSchedule && (
                <div className="admin-kb-crawl-schedule">
                  <div className="admin-kb-crawl-schedule-head">
                    <Clock3 size={18} />
                    <div>
                      <strong>定时同步</strong>
                      <span>每{WEEKDAYS[crawlSchedule.weekday]} {String(crawlSchedule.hour).padStart(2, '0')}:{String(crawlSchedule.minute).padStart(2, '0')}</span>
                    </div>
                    <label className="admin-toggle">
                      <input type="checkbox" checked={crawlSchedule.enabled} onChange={() => void updateKnowledgeCrawlSchedule(!crawlSchedule.enabled).then((next) => next && setCrawlSchedule(next))} />
                      <span>{crawlSchedule.enabled ? '已开启' : '已关闭'}</span>
                    </label>
                  </div>
                  <button type="button" className="btn btn-secondary btn-compact" disabled={importing} onClick={() => void triggerScheduledKnowledgeCrawl().then(() => refreshAll())}>
                    立即全量同步
                  </button>
                </div>
              )}

              <div className="admin-kb-crawl-keyword">
                <input className="ds-input" value={crawlKeyword} onChange={(event) => setCrawlKeyword(event.target.value)} placeholder="按关键词同步，例如：劳动合同法" />
                <button type="button" className="btn btn-secondary" disabled={importing} onClick={() => void handleCrawl('keyword')}>同步</button>
              </div>

              <div className="admin-kb-crawl-toolbar">
                <button type="button" className="btn btn-primary" disabled={importing} onClick={() => void handleCrawl('selected')}>同步选中 ({selectedSeedIds.size})</button>
                <button type="button" className="btn btn-secondary" disabled={importing} onClick={() => void handleCrawl('all')}>同步全部种子</button>
              </div>

              <div className="admin-kb-seed-grid">
                {crawlSeeds.map((seed) => (
                  <label key={seed.id} className="admin-kb-seed-card admin-kb-seed-card-selectable admin-kb-seed-check">
                    <input type="checkbox" checked={selectedSeedIds.has(seed.id)} onChange={() => setSelectedSeedIds((current) => {
                      const next = new Set(current);
                      if (next.has(seed.id)) next.delete(seed.id); else next.add(seed.id);
                      return next;
                    })} />
                    <strong>{seed.name}</strong>
                  </label>
                ))}
              </div>
            </article>
          )}
        </div>
      )}

      {pageTab === 'config' && (
        <section className="ds-card kb-config-card">
          <div className="kb-config-card-head">
            <Settings2 size={18} />
            <div>
              <strong>知识库配置与就绪检查</strong>
              <p>本地知识库三集合，与能力总览中的本地知识库及合同文书引擎联动。</p>
            </div>
          </div>

          {!kbConfig && <p className="kb-empty-inline">加载配置中…</p>}

          {kbConfig && (
            <>
              <dl className="kb-config-spec">
                <div><dt>持久化目录</dt><dd><code>{kbConfig.chromaPersistDir}</code></dd></div>
                <div><dt>向量库状态</dt><dd>{kbConfig.available ? '可用' : '不可用'}</dd></div>
                <div><dt>集合划分</dt><dd>statutes · templates · knowledge</dd></div>
                <div><dt>合同文书</dt><dd>{kbConfig.contractReadiness.ready ? '已就绪' : '建议导入种子包并同步法规'}</dd></div>
              </dl>

              <div className="kb-config-steps">
                <strong>推荐配置步骤</strong>
                <ul>
                  {kbConfig.recommendedSteps.map((step) => (
                    <li key={step.id} className={step.status === 'done' ? 'done' : ''}>
                      <span>{step.status === 'done' ? '✓' : '○'}</span>
                      {step.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="kb-config-collections">
                {kbConfig.collections.map((item) => (
                  <article key={item.id}>
                    <strong>{item.label}</strong>
                    <span>{item.id}</span>
                    <em>{item.role}</em>
                  </article>
                ))}
              </div>

              <div className="kb-config-actions">
                <button type="button" className="btn btn-primary" disabled={importing} onClick={() => void handleContractPack()}>
                  导入合同文书种子包
                </button>
                <button type="button" className="btn btn-secondary" disabled={importing} onClick={() => { setPageTab('import'); setActiveLibrary('law'); }}>
                  去同步法规
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </AdminShell>
  );
}

export default AdminKnowledgePage;
