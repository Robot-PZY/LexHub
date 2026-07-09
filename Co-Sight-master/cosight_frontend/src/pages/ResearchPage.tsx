import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, FileSearch, Link2, Loader2, Network, Search, ShieldCheck } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import DataSourceBadge from '../components/ui/DataSourceBadge';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { fetchKnowledgeVectorStats, fetchToolchainStatus, legalSearch } from '../lib/api';
import { TOOLCHAIN_CATEGORIES } from '../lib/cosight-narrative';
import { clearAuthed, loadWorkspaceDraft, loadWorkspaceSession } from '../lib/storage';
import type { ApiIntegration } from '../types/legal';
import type { LegalSearchHit, LegalSearchResult } from '../types/legal-search';

const defaultQuestions = [
  '付款逾期是否构成根本违约？',
  '争议解决条款是否明确约定管辖与适用法律？',
  '解除合同前是否需要履行催告或补正程序？',
];

const sourceLabels: Record<string, string> = {
  delilegal: '得理法律',
  npc_flk: 'NPC 法规库',
  chroma_local: '本地 Chroma',
};

function formatHitSummary(hit: LegalSearchHit): string {
  if (hit.content) return hit.content.slice(0, 160);
  const parts = [hit.publisher, hit.timeliness, hit.publish_date].filter(Boolean);
  return parts.join(' · ') || '暂无摘要';
}

function integrationStatusLabel(status: ApiIntegration['status']): string {
  if (status === 'ready') return '已就绪';
  if (status === 'missing_key') return '缺密钥';
  return '规划中';
}

function ResearchPage() {
  const navigate = useNavigate();
  const session = loadWorkspaceSession();
  const draft = loadWorkspaceDraft();
  const initialQuery = session?.query?.trim() || draft.trim() || '合同违约责任 民法典';

  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [result, setResult] = useState<LegalSearchResult | null>(null);
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [vectorStats, setVectorStats] = useState<{ statutes?: number; templates?: number; knowledge?: number } | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      try {
        const [toolchain, stats] = await Promise.all([
          fetchToolchainStatus().catch(() => null),
          fetchKnowledgeVectorStats().catch(() => null),
        ]);
        if (!cancelled) {
          setIntegrations(toolchain?.integrations ?? []);
          setVectorStats(stats as { statutes?: number; templates?: number; knowledge?: number } | null);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }

    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  const researchIntegrations = useMemo(
    () => integrations.filter((item) =>
      ['法规检索', '知识库', '联网搜索', '材料处理'].some((tag) => item.category.includes(tag)),
    ),
    [integrations],
  );

  const citationCards = useMemo(() => {
    if (!result) return [];
    const cards: Array<{ title: string; desc: string; status: string }> = [];
    result.laws.slice(0, 3).forEach((hit) => {
      cards.push({ title: hit.title, desc: formatHitSummary(hit), status: hit.source ?? '法规' });
    });
    result.cases.slice(0, 2).forEach((hit) => {
      cards.push({ title: hit.title, desc: formatHitSummary(hit), status: '案例' });
    });
    result.local.slice(0, 2).forEach((hit) => {
      cards.push({ title: hit.title, desc: formatHitSummary(hit), status: hit.collection ? `本地 · ${hit.collection}` : '本地知识库' });
    });
    (result.templates ?? []).slice(0, 2).forEach((hit) => {
      cards.push({ title: hit.title, desc: formatHitSummary(hit), status: '文书模板' });
    });
    return cards;
  }, [result]);

  const questions = result?.query
    ? [result.query, ...defaultQuestions.filter((item) => item !== result.query).slice(0, 2)]
    : defaultQuestions;

  async function handleSearch(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setSearchError(null);
    try {
      const data = await legalSearch(trimmed, 5);
      if (!data) {
        setSearchError('检索失败，请确认后端已启动且知识库配置正确。');
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setSearchError('检索请求异常，请稍后重试。');
      setResult(null);
    } finally {
      setSearching(false);
    }
  }

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="法规研究"
      subtitle="围绕法律问题检索法规、案例与本地知识库，形成可追溯依据。"
      badge={result ? <DataSourceBadge source="api" /> : <span className="ds-badge ds-badge-primary">多源检索</span>}
      actions={<button type="button" className="btn btn-secondary" onClick={() => navigate('/workspace')}>生成文书</button>}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={BookOpenCheck}
        title="法规研究台"
        subtitle="检索得理法规案例库、NPC 公开法规库与本地知识库，结果保留引用来源。"
      />

      <section className="feature-stat-grid">
        <StatCard label="研究问题" value={result ? '1' : '3'} description={result ? '来自当前检索' : '示例问题待检索'} />
        <StatCard
          label="引用来源"
          value={result ? `${result.sources.length} 类` : '—'}
          description={result?.sources.map((item) => sourceLabels[item] ?? item).join(' / ') || '法规、案例、知识库'}
        />
        <StatCard
          label="本地向量库"
          value={vectorStats?.statutes ? `${vectorStats.statutes}` : '—'}
          description={vectorStats ? `法条 ${vectorStats.statutes} · 模板 ${vectorStats.templates} · 规则 ${vectorStats.knowledge}` : '加载中'}
        />
        <StatCard label="检索状态" value={searching ? '检索中' : result ? '已返回' : '待检索'} description="正式使用前需人工确认" />
      </section>

      <section className="ds-card feature-panel feature-panel-wide research-search-panel">
        <form className="research-search-form" onSubmit={(event) => void handleSearch(event)}>
          <Search size={18} />
          <input
            className="ds-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入法律问题或关键词，例如：合同违约责任"
          />
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? <><Loader2 size={16} className="spin" /> 检索中</> : '开始检索'}
          </button>
        </form>
        {searchError && <div className="admin-save-hint">{searchError}</div>}
      </section>

      <section className="feature-layout">
        <article className="ds-card feature-panel feature-panel-large">
          <div className="feature-panel-head">
            <div>
              <p className="eyebrow">QUESTION MAP</p>
              <h2>法律问题拆解</h2>
            </div>
            <span className="ds-badge ds-badge-success">{result ? '已检索' : '结构化'}</span>
          </div>

          <div className="feature-question-list">
            {questions.map((question, index) => (
              <div key={question}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{question}</strong>
                <em>{index === 0 && result ? '当前检索问题' : '可由事项受理与法规研究角色协作生成'}</em>
              </div>
            ))}
          </div>

          <div className="feature-research-result">
            <div className="feature-card-title">
              <ShieldCheck size={18} />
              <strong>研究结论摘要</strong>
            </div>
            <p>
              {result
                ? `共命中法规 ${result.laws.length} 条、案例 ${result.cases.length} 条、本地知识 ${result.local.length} 条。来源：${result.sources.map((item) => sourceLabels[item] ?? item).join('、') || '无'}。请结合案件材料人工复核后再用于文书生成。`
                : '输入问题并点击「开始检索」，系统会进行得理 / NPC / 本地知识库混合检索并展示可追溯引用。'}
            </p>
          </div>
        </article>

        <aside className="feature-side-stack">
          <article className="ds-card feature-panel">
            <div className="feature-card-title">
              <FileSearch size={18} />
              <strong>检索能力</strong>
            </div>
            {metaLoading ? <LoadingState label="加载检索能力状态…" compact /> : (
              <div className="feature-mini-list">
                {(researchIntegrations.length ? researchIntegrations : integrations.slice(0, 3)).map((item) => (
                  <div key={item.id}>
                    <span>{item.name}</span>
                    <em>{integrationStatusLabel(item.status)}</em>
                  </div>
                ))}
                {!researchIntegrations.length && !integrations.length && (
                  <div><span>混合法规检索服务</span><em>待连接</em></div>
                )}
              </div>
            )}
          </article>

          <article className="ds-card feature-panel">
            <div className="feature-card-title">
              <Network size={18} />
              <strong>结论分层</strong>
            </div>
            <div className="feature-mini-list">
              <div><span>事实依据</span><em>{session?.scenario ? '工作台场景' : '材料引用'}</em></div>
              <div><span>法律依据</span><em>{result?.laws.length ? `${result.laws.length} 条` : '法规引用'}</em></div>
              <div><span>风险等级</span><em>人工复核</em></div>
            </div>
          </article>
        </aside>
      </section>

      <section className="ds-card feature-panel feature-panel-wide">
        <div className="feature-panel-head">
          <div>
            <p className="eyebrow">RESEARCH SOURCES</p>
            <h2>法规研究相关来源</h2>
          </div>
          <span className="ds-badge ds-badge-success">多源互证</span>
        </div>
        <div className="toolchain-board-grid compact">
          {TOOLCHAIN_CATEGORIES.map((item) => (
            <article key={item.id} className="toolchain-board-card inline">
              <strong>{item.label}</strong>
              <p>{item.examples.join(' / ')}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ds-card feature-panel feature-panel-wide">
        <div className="feature-panel-head">
          <div>
            <p className="eyebrow">CITATIONS</p>
            <h2>引用来源与可信度</h2>
          </div>
          <span className={`ds-badge ${result ? 'ds-badge-success' : 'ds-badge-warning'}`}>
            {result ? '后端实时检索' : '检索后展示'}
          </span>
        </div>
        {searching && <LoadingState label="正在检索法规与案例…" compact />}
        {!searching && citationCards.length === 0 && (
          <p className="research-empty-hint">暂无引用。输入问题后点击「开始检索」查看法规、案例与本地知识库命中结果。</p>
        )}
        {citationCards.length > 0 && (
          <div className="feature-source-grid">
            {citationCards.map((source) => (
              <article key={`${source.title}-${source.status}`} className="feature-source-card">
                <Link2 size={18} />
                <strong>{source.title}</strong>
                <p>{source.desc}</p>
                <em>{source.status}</em>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

export default ResearchPage;
