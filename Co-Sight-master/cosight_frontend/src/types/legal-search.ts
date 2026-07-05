export type LegalSearchHit = {
  source?: string;
  id?: string;
  title: string;
  content?: string;
  publisher?: string;
  timeliness?: string;
  publish_date?: string;
  source_url?: string;
  score?: number;
  collection?: string;
};

export type LegalSearchResult = {
  query: string;
  laws: LegalSearchHit[];
  cases: LegalSearchHit[];
  local: LegalSearchHit[];
  templates?: LegalSearchHit[];
  sources: string[];
};
