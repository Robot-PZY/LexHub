export const COSIGHT_TAGLINE = '面向法律事项办理的智能协同系统';

export const COSIGHT_SUBTITLE = '多角色协同 · 办理路径研判 · 多源依据检索 · 全程可归档';

export const COSIGHT_PILLARS = [
  '法律事项受理',
  '多角色协同',
  '办理路径研判',
  '多源依据检索',
  '过程可归档',
  '结果可复核',
] as const;

export const COMPETITION_CAPABILITY_ROWS = [
  {
    requirement: '多角色协同（≥2）',
    implementation: '事项受理、证据质检、法规研究、文书生成、结论复核、合规监测 6 个协作角色按状态触发',
    evidence: '/workspace · /agents',
  },
  {
    requirement: '事项办理引擎',
    implementation: '底层计划引擎拆解；条件分支、并行触发、跳步返工与归档回溯，办理路径可视化',
    evidence: '/workspace · / · legal-workflow.json',
  },
  {
    requirement: '外部服务接入（≥3 类）',
    implementation: '联网搜索、文档解析、法规检索、材料上传、文书导出等能力位',
    evidence: '/workspace · /research · /evidence',
  },
  {
    requirement: '多跳推理（>3 跳）',
    implementation: '事项受理 → 材料处理 → 检索研究 → 分析生成 → 结论复核（≥5 跳）',
    evidence: '办理路径 · 历史回放 · 导出溯源',
  },
  {
    requirement: '性能对比基准',
    implementation: '传统人工 vs 律枢效率/准确率/归档覆盖对比（Board · Analytics）',
    evidence: '/ · /analytics',
  },
  {
    requirement: '可信与可复核',
    implementation: '结论复核角色 + 合规监测审计链 + 历史回放 + 办理记录导出溯源',
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
  { item: '真实办理与历史回放', status: 'ready', path: '/workspace · /replay' },
  { item: '技术方案文档', status: 'ready', path: 'docs/competition/technical-solution.md' },
  { item: '创新总结报告（必交）', status: 'ready', path: 'docs/competition/innovation-summary.md' },
  { item: '3 分钟展示脚本', status: 'ready', path: 'docs/competition/demo-script.md' },
  { item: '外部服务说明', status: 'ready', path: 'docs/competition/tool-api-reference.md' },
  { item: '知识库/规则库样例', status: 'ready', path: 'config/knowledge/legal-knowledge-seed.json' },
  { item: '展示视频', status: 'planned', path: '按 demo-script.md 录制' },
] as const;

export const JUDGE_DEMO_STEPS = [
  { step: '01', title: '产品介绍', route: '/', duration: '30s', desc: '核心能力、定价方案、赛题映射与性能对比' },
  { step: '02', title: '发起事项', route: '/workspace', duration: '60s', desc: '上传材料、办理路径、多角色证据、能力覆盖' },
  { step: '03', title: '路径与能力', route: '/agents', duration: '30s', desc: '状态驱动办理网络，非固定流水线' },
  { step: '04', title: '归档与导出', route: '/replay', duration: '40s', desc: '真实办理记录、DOCX/PDF 溯源导出' },
  { step: '05', title: '管理与商业', route: '/admin', duration: '20s', desc: '模型与服务配置、用户会员标注、商业化规划' },
] as const;

export const TOOLCHAIN_CATEGORIES = [
  { id: 'search', label: '联网搜索', examples: ['tavily_search', 'google_search', 'search'], color: 'primary' },
  { id: 'code', label: '数据处理', examples: ['execute_code', 'code'], color: 'warning' },
  { id: 'document', label: '文档/OCR', examples: ['file', 'upload', 'ocr', 'parse'], color: 'success' },
  { id: 'legal', label: '法规检索', examples: ['legal', 'law', 'case', 'rag'], color: 'primary' },
  { id: 'delilegal', label: '得理法律', examples: ['delilegal', 'law_search', 'case_search'], color: 'primary' },
] as const;
