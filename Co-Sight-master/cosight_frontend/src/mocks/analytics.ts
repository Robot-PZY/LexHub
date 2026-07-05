import type { AnalyticsOverview, ToolchainStatus } from '../types/analytics';
import { CURATED_ANALYTICS_OVERVIEW } from './demo-seed';

export const mockAnalyticsOverview: AnalyticsOverview = CURATED_ANALYTICS_OVERVIEW;

export const mockToolchainStatus: ToolchainStatus = {
  integrations: [
    { id: 'ocr', name: 'OCR / 文档解析', category: '材料处理', status: 'missing_key', envKeys: ['BAIDU_OCR_API_KEY'], purpose: '扫描件识别' },
    { id: 'legal_search', name: '得理法律检索', category: '法律研究', status: 'ready', envKeys: ['DELILEGAL_APPID'], purpose: '法规案例检索' },
    { id: 'contract_documents', name: '合同文书引擎', category: '合同文书', status: 'ready', envKeys: ['API_KEY'], purpose: 'LLM + 模板 RAG 生成文书' },
    { id: 'contract_review_external', name: '第三方合同审查（可选）', category: '合同文书', status: 'missing_key', envKeys: ['BAIDU_TEXTREVIEW_API_KEY'], purpose: '外部 SaaS' },
    { id: 'clause_library', name: '标准条款库', category: '合同文书', status: 'planned', envKeys: ['CLAUSE_LIBRARY_API_KEY'], purpose: '条款偏离检测' },
    { id: 'web_search', name: '联网搜索', category: '公开资料', status: 'ready', envKeys: ['TAVILY_API_KEY'], purpose: '补充公开资料' },
    { id: 'vector_rag', name: '本地知识库', category: '知识增强', status: 'ready', envKeys: ['CHROMA_PERSIST_DIR'], purpose: 'RAG 检索' },
    { id: 'export', name: '文书导出', category: '结果交付', status: 'planned', envKeys: [], purpose: 'PDF/DOCX 导出' },
  ],
  summary: { total: 9, ready: 3, missingKey: 2, planned: 4 },
};
