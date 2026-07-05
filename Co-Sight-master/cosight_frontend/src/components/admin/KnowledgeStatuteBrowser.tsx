import { ArrowLeft, BookOpen, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import LoadingState from '../ui/LoadingState';
import {
  fetchStatuteArticles,
  fetchStatuteDocuments,
  type KnowledgeVectorItem,
  type StatuteDocument,
} from '../../lib/api';

function KnowledgeStatuteBrowser({ refreshKey = 0 }: { refreshKey?: number }) {
  const [documents, setDocuments] = useState<StatuteDocument[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<StatuteDocument | null>(null);
  const [articles, setArticles] = useState<KnowledgeVectorItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeVectorItem | null>(null);
  const [lawQuery, setLawQuery] = useState('');
  const [articleQuery, setArticleQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [articleTotal, setArticleTotal] = useState(0);
  const [articleOffset, setArticleOffset] = useState(0);
  const limit = 15;

  const loadDocuments = async (q = lawQuery) => {
    setLoading(true);
    try {
      const data = await fetchStatuteDocuments({ q, limit: 30 });
      setDocuments(data?.documents ?? []);
      if (!selectedLaw && data?.documents?.[0]) {
        setSelectedLaw(data.documents[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async (law: StatuteDocument, q = articleQuery, offset = 0) => {
    setLoading(true);
    try {
      const data = await fetchStatuteArticles(law.bbbs, { q, limit, offset });
      setArticles(data?.items ?? []);
      setArticleTotal(data?.total ?? 0);
      setArticleOffset(offset);
      setSelectedArticle(data?.items?.[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedLaw(null);
    setSelectedArticle(null);
    void loadDocuments('');
  }, [refreshKey]);

  useEffect(() => {
    if (selectedLaw) {
      void loadArticles(selectedLaw, articleQuery, 0);
    }
  }, [selectedLaw?.bbbs, refreshKey]);

  return (
    <div className="kb-browser kb-statute-browser">
      {!selectedLaw ? (
        <>
          <div className="kb-browser-toolbar">
            <input
              className="ds-input"
              value={lawQuery}
              onChange={(event) => setLawQuery(event.target.value)}
              placeholder="搜索法规名称，例如：民法典"
              onKeyDown={(event) => event.key === 'Enter' && void loadDocuments(lawQuery)}
            />
            <button type="button" className="btn btn-secondary" onClick={() => void loadDocuments(lawQuery)}>
              <Search size={15} />
              搜索
            </button>
          </div>
          {loading ? <LoadingState label="加载法规目录…" compact /> : (
            <div className="kb-document-grid">
              {documents.map((doc) => (
                <button
                  key={doc.bbbs}
                  type="button"
                  className="kb-document-card"
                  onClick={() => setSelectedLaw(doc)}
                >
                  <BookOpen size={18} />
                  <div>
                    <strong>{doc.lawName}</strong>
                    <span>{doc.articleCount} 条 · {doc.source === 'npc_flk' ? 'NPC 官方法规库' : doc.source}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
              {documents.length === 0 && (
                <div className="kb-empty-inline">暂无法规。请在「数据导入」中同步 NPC 法规或上传法规文本。</div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="kb-breadcrumb">
            <button type="button" className="text-button" onClick={() => { setSelectedLaw(null); setArticles([]); }}>
              <ArrowLeft size={14} />
              法规目录
            </button>
            <ChevronRight size={14} />
            <strong>{selectedLaw.lawName}</strong>
            <span>{articleTotal} 条</span>
          </div>

          <div className="kb-browser-toolbar">
            <input
              className="ds-input"
              value={articleQuery}
              onChange={(event) => setArticleQuery(event.target.value)}
              placeholder="在本法内检索，例如：第五百七十七条、违约责任"
              onKeyDown={(event) => {
                if (event.key === 'Enter') void loadArticles(selectedLaw, articleQuery, 0);
              }}
            />
            <button type="button" className="btn btn-secondary" onClick={() => void loadArticles(selectedLaw, articleQuery, 0)}>
              检索条文
            </button>
          </div>

          {loading ? <LoadingState label="加载法条…" compact /> : (
            <div className="kb-content-layout">
              <div className="kb-item-list">
                {articles.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`kb-item-row${selectedArticle?.id === item.id ? ' active' : ''}`}
                    onClick={() => setSelectedArticle(item)}
                  >
                    <strong>{item.chunkTitle || item.title}</strong>
                    <p>{item.snippet}</p>
                  </button>
                ))}
                {articleTotal > limit && (
                  <div className="kb-pagination">
                    <button
                      type="button"
                      className="btn btn-ghost btn-compact"
                      disabled={articleOffset <= 0}
                      onClick={() => void loadArticles(selectedLaw, articleQuery, Math.max(0, articleOffset - limit))}
                    >
                      上一页
                    </button>
                    <span>{Math.floor(articleOffset / limit) + 1} / {Math.ceil(articleTotal / limit)}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-compact"
                      disabled={articleOffset + limit >= articleTotal}
                      onClick={() => void loadArticles(selectedLaw, articleQuery, articleOffset + limit)}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
              <aside className="kb-preview">
                {selectedArticle ? (
                  <>
                    <strong>{selectedArticle.chunkTitle || selectedArticle.title}</strong>
                    <pre>{selectedArticle.content || selectedArticle.snippet}</pre>
                  </>
                ) : (
                  <p className="kb-preview-placeholder">选择左侧法条查看全文。</p>
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default KnowledgeStatuteBrowser;
