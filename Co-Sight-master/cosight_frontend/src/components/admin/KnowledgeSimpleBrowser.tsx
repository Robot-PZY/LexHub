import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import LoadingState from '../ui/LoadingState';
import {
  fetchKnowledgeVectorItems,
  type KnowledgeIngestCollection,
  type KnowledgeVectorItem,
} from '../../lib/api';

type KnowledgeSimpleBrowserProps = {
  libraryName: string;
  collection: KnowledgeIngestCollection;
  kind?: 'rule' | 'case';
  tag?: string;
  tagOptions?: string[];
  emptyHint: string;
  refreshKey?: number;
};

function KnowledgeSimpleBrowser({
  libraryName,
  collection,
  kind,
  tag = '',
  tagOptions = [],
  emptyHint,
  refreshKey = 0,
}: KnowledgeSimpleBrowserProps) {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTag, setActiveTag] = useState(tag);
  const [items, setItems] = useState<KnowledgeVectorItem[]>([]);
  const [selected, setSelected] = useState<KnowledgeVectorItem | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (q = query, nextTag = activeTag) => {
    setLoading(true);
    try {
      const data = await fetchKnowledgeVectorItems({
        collection,
        kind,
        tag: nextTag || undefined,
        limit: 30,
        q,
      });
      setItems(data?.items ?? []);
      setSelected(data?.items?.[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery('');
    setSearchInput('');
    setActiveTag(tag);
    void load('', tag);
  }, [collection, kind, tag, refreshKey]);

  return (
    <div className="kb-browser">
      <div className="kb-browser-toolbar">
        <input
          className="ds-input"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={`在${libraryName}中检索…`}
          onKeyDown={(event) => event.key === 'Enter' && (setQuery(searchInput.trim()), void load(searchInput.trim()))}
        />
        <button type="button" className="btn btn-secondary" onClick={() => { setQuery(searchInput.trim()); void load(searchInput.trim()); }}>
          <Search size={15} />
          检索
        </button>
      </div>

      {tagOptions.length > 0 && (
        <div className="kb-tag-pills">
          <button type="button" className={!activeTag ? 'active' : ''} onClick={() => { setActiveTag(''); void load(query, ''); }}>
            全部
          </button>
          {tagOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={activeTag === item ? 'active' : ''}
              onClick={() => { setActiveTag(item); void load(query, item); }}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {loading && <LoadingState label={`加载${libraryName}…`} compact />}

      {!loading && items.length === 0 && (
        <div className="kb-empty-inline">{emptyHint}</div>
      )}

      {!loading && items.length > 0 && (
        <div className="kb-content-layout">
          <div className="kb-item-list">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`kb-item-row${selected?.id === item.id ? ' active' : ''}`}
                onClick={() => setSelected(item)}
              >
                <strong>{item.title}</strong>
                {item.tags && item.tags.length > 0 && (
                  <div className="kb-item-tags">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
                <p>{item.snippet}</p>
              </button>
            ))}
          </div>
          <aside className="kb-preview">
            {selected ? (
              <>
                <strong>{selected.title}</strong>
                {selected.tags && selected.tags.length > 0 && (
                  <div className="kb-item-tags preview">
                    {selected.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                )}
                <pre>{selected.content || selected.snippet}</pre>
              </>
            ) : (
              <p className="kb-preview-placeholder">选择左侧条目查看全文。</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default KnowledgeSimpleBrowser;
