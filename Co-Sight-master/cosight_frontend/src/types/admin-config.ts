export type ModelCapabilityType = 'text_llm' | 'vision_ocr' | 'multimodal' | 'embedding';

export type ModelProviderConfig = {
  id: string;
  providerId?: string;
  label: string;
  agentName: string;
  description: string;
  capabilityType: ModelCapabilityType;
  capabilities: string[];
  modelName: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  ocrFormats?: string;
  infraNote?: string;
};

export type ApiIntegrationType = 'rest_api' | 'ocr_service' | 'search_api' | 'export_pipeline' | 'vector_rag';

export type ApiProviderConfig = {
  id: string;
  providerId?: string;
  name: string;
  category: string;
  purpose: string;
  integrationType: ApiIntegrationType;
  dependsOn?: string[];
  apiKey: string;
  endpoint: string;
  enabled: boolean;
};

export type McpToolConfig = {
  skill_name: string;
  skill_type: 'local_mcp';
  display_name_zh: string;
  display_name_en?: string;
  description_zh: string;
  description_en?: string;
  mcp_server_config: {
    command: string;
    args: string[];
  };
};

export type KnowledgeBaseConfig = {
  id: string;
  name: string;
  description: string;
  sourceType: string;
  status: 'ready' | 'empty' | 'planned';
  entryCount?: number;
  vectorCount?: number;
  tags?: string[];
  lastUpdated?: string;
};

export type AdminSettings = {
  models: ModelProviderConfig[];
  apis: ApiProviderConfig[];
  knowledgeBases: KnowledgeBaseConfig[];
  routingRules: string[];
  reviewRules: string[];
  mcpTools?: McpToolConfig[];
};

export const DEFAULT_MODEL_CONFIGS: ModelProviderConfig[] = [
  {
    id: 'planner',
    label: '任务理解模型',
    agentName: '任务理解智能体',
    description: '负责场景识别、任务拆解与调度建议。',
    capabilityType: 'text_llm',
    capabilities: ['场景识别', '任务拆解', '调度建议'],
    modelName: '',
    apiKey: '',
    baseUrl: '',
    enabled: true,
  },
  {
    id: 'vision',
    label: '证据质检模型',
    agentName: '证据质检智能体',
    description: '负责 OCR、材料解析与证据缺口识别。',
    capabilityType: 'vision_ocr',
    capabilities: ['OCR 识图', 'PDF 解析', '证据链整理', '缺口识别'],
    modelName: '',
    apiKey: '',
    baseUrl: '',
    enabled: true,
    ocrFormats: 'PDF、JPG、PNG、扫描件',
    infraNote: '需配置视觉模型或独立 OCR 服务，可与下方 API 工具链联动。',
  },
  {
    id: 'research',
    label: '法规研究模型',
    agentName: '法规研究智能体',
    description: '负责法规检索、案例引用与研究结论生成。',
    capabilityType: 'text_llm',
    capabilities: ['法规检索', '案例引用', '研究摘要'],
    modelName: '',
    apiKey: '',
    baseUrl: '',
    enabled: true,
  },
  {
    id: 'drafting',
    label: '文书生成模型',
    agentName: '文书生成智能体',
    description: '负责报告、律师函、意见书等结构化输出。',
    capabilityType: 'text_llm',
    capabilities: ['结构化写作', '模板填充', '多轮修订'],
    modelName: '',
    apiKey: '',
    baseUrl: '',
    enabled: true,
  },
  {
    id: 'review',
    label: '交叉审查模型',
    agentName: '交叉审查智能体',
    description: '负责事实、证据、法规与文书一致性复核。',
    capabilityType: 'multimodal',
    capabilities: ['事实核验', '法规适配', '风险表达审查'],
    modelName: '',
    apiKey: '',
    baseUrl: '',
    enabled: true,
    infraNote: '可结合文本模型 + 规则引擎，高风险场景强制触发。',
  },
];

export const DEFAULT_API_CONFIGS: ApiProviderConfig[] = [
  { id: 'ocr', name: 'OCR / 文档解析', category: '材料处理', purpose: '识别合同、扫描件与 PDF 材料。', integrationType: 'ocr_service', dependsOn: ['vision'], apiKey: '', endpoint: '', enabled: true },
  { id: 'legal_search', name: '得理法律检索', category: '法律研究', purpose: '检索法规、司法解释与裁判案例。', integrationType: 'search_api', dependsOn: ['research'], apiKey: '', endpoint: 'https://openapi.delilegal.com', enabled: true },
  { id: 'contract_documents', name: '合同文书引擎', category: '合同文书', purpose: 'LLM + 法规/模板检索：审查报告、商业合同起草、条款修改备忘，支持 DOCX/PDF 导出。', integrationType: 'rest_api', dependsOn: ['drafting', 'research'], apiKey: '', endpoint: '', enabled: true },
  { id: 'contract_review_external', name: '第三方合同审查（可选）', category: '合同文书', purpose: '百度 TextReview 等外部 SaaS；需公网文件与额外密钥，演示可不启用。', integrationType: 'rest_api', dependsOn: ['review'], apiKey: '', endpoint: 'https://aip.baidubce.com', enabled: false },
  { id: 'clause_library', name: '标准条款库', category: '合同审查', purpose: '对照 NDA、采购、劳动等标准条款模板，标记偏离与建议改写。', integrationType: 'search_api', dependsOn: ['review'], apiKey: '', endpoint: '', enabled: false },
  { id: 'contract_compare', name: '合同版本比对', category: '合同审查', purpose: '多版本合同 diff、修订痕迹与红线批注，适合续签与谈判场景。', integrationType: 'rest_api', dependsOn: ['review'], apiKey: '', endpoint: '', enabled: false },
  { id: 'compliance_screen', name: '合规红线筛查', category: '合同审查', purpose: '反商业贿赂、数据出境、劳动用工、关联交易等合规风险扫描。', integrationType: 'rest_api', dependsOn: ['compliance', 'review'], apiKey: '', endpoint: '', enabled: false },
  { id: 'web_search', name: '联网搜索', category: '公开资料', purpose: '补充公开资料与行业背景。', integrationType: 'search_api', apiKey: '', endpoint: '', enabled: false },
  { id: 'export', name: '文书导出', category: '结果交付', purpose: '导出 PDF / DOCX / 材料包。', integrationType: 'export_pipeline', dependsOn: ['drafting'], apiKey: '', endpoint: '', enabled: false },
  { id: 'vector_rag', name: '本地知识库 / RAG', category: '知识增强', purpose: '接入法规库、模板库与案例库。', integrationType: 'vector_rag', dependsOn: ['research', 'drafting'], apiKey: '', endpoint: './chroma_lexhub', enabled: true },
];

export type ApiConfigGuidance = {
  keyPlaceholder: string;
  endpointPlaceholder: string;
  hint: string;
};

export const API_CONFIG_GUIDANCE: Record<string, ApiConfigGuidance> = {
  ocr: {
    keyPlaceholder: '视觉模型 Key 或百度/阿里云 OCR Key',
    endpointPlaceholder: 'OCR 服务地址（可留空，走模型页「证据质检」）',
    hint: '演示可先在「模型」页配置证据质检模型的 API Key；生产环境可在 .env 填写 BAIDU_OCR_API_KEY 或 VISION_API_KEY。',
  },
  legal_search: {
    keyPlaceholder: '得理 App Secret 或 LEGAL_SEARCH_API_KEY',
    endpointPlaceholder: 'https://openapi.delilegal.com',
    hint: '在得理开放平台申请 AppID + Secret，写入 .env 的 DELILEGAL_APPID / DELILEGAL_SECRET，或在此填写 Key 后保存。',
  },
  web_search: {
    keyPlaceholder: 'TAVILY_API_KEY 或 SERPAPI_API_KEY',
    endpointPlaceholder: '搜索 API 地址（Tavily 可留空）',
    hint: '默认关闭。需要补充公开资料时启用，并配置 Tavily / SerpAPI 等 Key（见 .env_template）。',
  },
  export: {
    keyPlaceholder: '一般无需 Key',
    endpointPlaceholder: '导出服务地址（本地导出可留空）',
    hint: '本地 DOCX/PDF 导出无需 Key；.env 中 DOCX_EXPORT_ENABLED=true 即可。暂未接第三方导出流水线时可保持停用。',
  },
  vector_rag: {
    keyPlaceholder: '本地 Chroma 无需 Key',
    endpointPlaceholder: './chroma_lexhub',
    hint: '与 .env 的 CHROMA_PERSIST_DIR 一致。在「知识库」页导入合同种子包后，智能工作台任务结果即可引用模板。',
  },
  contract_documents: {
    keyPlaceholder: '复用「任务理解模型」API_KEY，一般无需单独填写',
    endpointPlaceholder: '留空即可',
    hint: '在 .env 配置 LLM（API_KEY）与知识库（CHROMA_PERSIST_DIR）后，智能工作台选场景填表单，于任务结果生成文书。',
  },
  contract_review_external: {
    keyPlaceholder: 'BAIDU_TEXTREVIEW_API_KEY|BAIDU_TEXTREVIEW_SECRET_KEY',
    endpointPlaceholder: 'https://aip.baidubce.com',
    hint: '可选外部审查；需公网文件 URL。演示推荐用内置「合同文书引擎」。',
  },
  clause_library: {
    keyPlaceholder: '条款库 API Key',
    endpointPlaceholder: '条款库服务地址',
    hint: '可对接律所内部条款库或第三方标准合同库，用于偏离度检测。',
  },
  contract_compare: {
    keyPlaceholder: '比对服务 API Key',
    endpointPlaceholder: '文档比对 API 地址',
    hint: '适合续签、谈判轮次多版本合同 diff；可与 OCR 流水线串联。',
  },
  compliance_screen: {
    keyPlaceholder: '合规筛查 API Key',
    endpointPlaceholder: '合规引擎地址',
    hint: '覆盖反贿赂、数据合规、劳动用工等红线；建议与交叉审查智能体联动。',
  },
};

export const DEFAULT_KNOWLEDGE_BASES: KnowledgeBaseConfig[] = [
  {
    id: 'law',
    name: '法规库',
    description: 'NPC 官方法规按「部 → 条」入库，供法规检索与合同审查引用。',
    sourceType: 'NPC 同步',
    status: 'empty',
    entryCount: 0,
    vectorCount: 0,
    tags: ['民法典', '劳动合同法', '公司法'],
  },
  {
    id: 'templates',
    name: '文书模板库',
    description: '合同起草/审查/律师函等模板骨架，供合同文书引擎 RAG 参考。',
    sourceType: '种子包 + 上传',
    status: 'empty',
    entryCount: 7,
    vectorCount: 0,
    tags: ['合同审查', '合同起草', 'NDA', '律师函'],
  },
  {
    id: 'cases',
    name: '类案参考库',
    description: '合同纠纷、劳动争议等类案摘要，增强场景化检索。',
    sourceType: '种子包 + 上传',
    status: 'empty',
    entryCount: 3,
    vectorCount: 0,
    tags: ['合同纠纷', '违约', '知识产权'],
  },
];

export const DEFAULT_ROUTING_RULES = [
  '材料完整度低于 70%，优先调度证据质检智能体。',
  '法规引用缺失或争议焦点不明确，调度法规研究智能体。',
  '用户目标为报告、律师函或意见书，调度文书生成智能体。',
  '高风险、低置信度或导出前，强制调度交叉审查智能体。',
];

export const DEFAULT_REVIEW_RULES = [
  '事实一致性：主体、金额、时间线是否互相冲突。',
  '证据支撑性：结论是否有材料或 OCR 结果支撑。',
  '法规适配性：引用是否匹配当前争议焦点。',
  '文书安全性：是否存在绝对化、越权或幻觉风险表达。',
];

export function createDefaultAdminSettings(): AdminSettings {
  return {
    models: DEFAULT_MODEL_CONFIGS.map((item) => ({ ...item })),
    apis: DEFAULT_API_CONFIGS.map((item) => ({ ...item })),
    knowledgeBases: DEFAULT_KNOWLEDGE_BASES.map((item) => ({ ...item })),
    routingRules: [...DEFAULT_ROUTING_RULES],
    reviewRules: [...DEFAULT_REVIEW_RULES],
    mcpTools: [],
  };
}
