export const COSIGHT_TAGLINE = '基于 Co-Sight 二次开发的法律行业超级智能体示范系统';

export const COSIGHT_SUBTITLE = '多智能体协同 · DAG 任务编排 · 多 API 工具链 · 过程可回放';

export const COSIGHT_PILLARS = [
  'Co-Sight 框架底座',
  '多智能体协同',
  'DAG 动态编排',
  '多 API 工具调用',
  '过程可回放',
  '结果可复核',
] as const;

export const COMPETITION_CAPABILITY_ROWS = [
  {
    requirement: '多智能体协同（≥2）',
    implementation: '任务理解、证据质检、法规研究、文书生成、交叉审查、合规监测 6 个智能体按状态触发',
    evidence: '/workspace · /agents',
  },
  {
    requirement: 'DAG 任务引擎编排',
    implementation: 'Co-Sight Plan 拆解；条件分支、并行触发、跳步返工与回放回溯，DAG 执行视图可视化',
    evidence: '/workspace · / · legal-workflow.json',
  },
  {
    requirement: '工具/API 调用（≥3 类）',
    implementation: '联网搜索、代码执行、文档解析、法规检索、材料上传等工具链',
    evidence: '/workspace · /research · /evidence',
  },
  {
    requirement: '多跳推理（>3 跳）',
    implementation: '任务拆解 → 材料处理 → 检索研究 → 分析生成 → 交叉审查（≥5 跳）',
    evidence: 'StepFlow · Replay · 导出溯源',
  },
  {
    requirement: '性能对比基准',
    implementation: '传统人工 vs Co-Sight 效率/准确率/回放覆盖对比（Board · Analytics）',
    evidence: '/ · /analytics',
  },
  {
    requirement: '可信与可复核',
    implementation: '交叉审查智能体 + 合规监测审计链 + replay 归档 + 真实执行导出溯源',
    evidence: '/workspace/result · /replay',
  },
  {
    requirement: '商业推广与可复制性',
    implementation: '个人会员分层（体验/Pro/Ultra）+ 工作流 JSON 场景包 + 定制交付规划',
    evidence: '/admin/users · docs/competition',
  },
] as const;

export const SUBMISSION_READINESS_ROWS = [
  { item: '可运行代码与工作流配置', status: 'ready', path: 'config/legal-workflow.json · start-lexhub.bat' },
  { item: 'Co-Sight 真实执行与回放', status: 'ready', path: '/workspace · /replay' },
  { item: '技术方案文档', status: 'ready', path: 'docs/competition/technical-solution.md' },
  { item: '创新总结报告（必交）', status: 'ready', path: 'docs/competition/innovation-summary.md' },
  { item: '3 分钟演示脚本', status: 'ready', path: 'docs/competition/demo-script.md' },
  { item: '工具 API 说明', status: 'ready', path: 'docs/competition/tool-api-reference.md' },
  { item: '知识库/规则库样例', status: 'ready', path: 'config/knowledge/legal-knowledge-seed.json' },
  { item: '演示视频', status: 'planned', path: '按 demo-script.md 录制' },
] as const;

export const JUDGE_DEMO_STEPS = [
  { step: '01', title: '产品介绍', route: '/', duration: '30s', desc: '核心能力、定价方案、赛题映射与性能对比' },
  { step: '02', title: '发起任务', route: '/workspace', duration: '60s', desc: '上传材料、DAG 执行、多智能体证据、工具链覆盖' },
  { step: '03', title: '调度与工具', route: '/agents', duration: '30s', desc: '状态驱动调度网络，非固定流水线' },
  { step: '04', title: '回放与导出', route: '/replay', duration: '40s', desc: 'replay 真实记录、DOCX/PDF 执行溯源导出' },
  { step: '05', title: '管理与商业', route: '/admin', duration: '20s', desc: '模型/API 配置、用户会员标注、商业化规划' },
] as const;

export const TOOLCHAIN_CATEGORIES = [
  { id: 'search', label: '联网搜索', examples: ['tavily_search', 'google_search', 'search'], color: 'primary' },
  { id: 'code', label: '代码执行', examples: ['execute_code', 'code'], color: 'warning' },
  { id: 'document', label: '文档/OCR', examples: ['file', 'upload', 'ocr', 'parse'], color: 'success' },
  { id: 'legal', label: '法规检索', examples: ['legal', 'law', 'case', 'rag'], color: 'primary' },
  { id: 'delilegal', label: '得理法律', examples: ['delilegal', 'law_search', 'case_search'], color: 'primary' },
] as const;
