# 律枢 LexHub 与原生 Co-Sight 对比及改进说明

> 用途：答辩、技术方案附录、项目创新点说明。本文聚焦“我们在 Co-Sight 原生框架上做了什么行业化改造”，避免把 Co-Sight 原生能力误写成团队新增能力。

## 1. 总体定位差异

| 对比维度 | 原生 Co-Sight | 律枢 LexHub |
|---|---|---|
| 产品定位 | 通用超级智能体框架，提供多智能体协同、DAG 任务编排、工具调用、回放等底座能力 | 面向法律行业的超级智能体工作台，覆盖材料接入、证据质检、法规研究、文书生成、交叉审查、审计归档 |
| 场景表达 | 更偏通用研究/任务执行范式 | 聚焦合同审查、劳动争议、公司治理、数据合规、法规研究、文书起草等法律任务 |
| 用户入口 | 原生 Web 执行与回放页面 | 新增 React 用户端、管理端、智能工作台、材料库、任务结果、会员/用户运营、赛题能力展示板 |
| 交付目标 | 展示 Co-Sight 框架执行能力 | 面向国赛提交与演示，形成可运行代码、工作流配置、知识库、导出文书、演示路线和比赛文档 |

一句话概括：原生 Co-Sight 是“超级智能体发动机”，LexHub 是基于该发动机封装的“法律行业智能工作台”。

## 2. 核心能力继承关系

LexHub 不是替换 Co-Sight，而是在以下原生能力上做行业化增强：

| Co-Sight 原生能力 | LexHub 继承方式 | LexHub 扩展方式 |
|---|---|---|
| 多智能体协同 | 保留 Planner / Actor / Tool 等执行基础 | 定义法律角色智能体：任务理解、证据质检、法规研究、文书生成、交叉审查、合规监测 |
| DAG 任务编排 | 保留 Co-Sight Plan 与任务执行链路 | 新增 `config/legal-workflow.json`，用法律业务条件驱动 DAG 分支 |
| 工具调用 | 保留搜索、文件、代码执行、文档处理等工具能力 | 新增法律检索工具、法规 RAG、文书导出、审计链、材料库等业务工具 |
| WebSocket 执行过程 | 保留实时执行事件 | 前端适配为 DAG 执行视图、阶段结果、工具轨迹、智能体状态条 |
| Replay 回放 | 保留 replay.json 过程记录 | 将 replay 用于归档回放、审计日志、执行快照、文书导出溯源 |

## 3. 主要改进清单

### 3.1 法律行业工作流配置

新增 `config/legal-workflow.json`，将法律任务抽象为一条可编排链路：

1. 任务理解：识别场景、目标产出、材料状态。
2. 证据质检：当材料完整度不足时触发，输出缺口清单和事实支撑度。
3. 法规研究：当引用覆盖不足或争议复杂时触发，调用法规检索与搜索工具。
4. 文书生成：当用户需要报告、律师函、意见书等产出时触发。
5. 交叉审查：高风险或导出前强制触发，检查事实一致性与引用匹配。
6. 合规监测：导出前形成审计链和合规提示。

改进价值：把原生通用 DAG 变成可解释的法律业务 DAG，符合国赛“多智能体协同”和“DAG 编排”的核心要求。

### 3.2 智能体注册表与能力映射

新增 `config/agent-registry.json`，为每个法律智能体声明：

- 角色类型：orchestrator、worker、reviewer。
- 触发条件：任务提交、材料完整度不足、法规引用缺失、高风险、导出前等。
- 注册工具：文档读取、材料上传、法规 RAG、联网搜索、代码执行、导出、可信分析、审计日志。
- 模型环境变量：支持为规划、执行、工具、视觉、审查、合规分别配置模型。

改进价值：从“一个通用智能体系统”升级为“可管理、可解释、可扩展的法律智能体组织”。

### 3.3 法规知识库与法律检索工具

新增法律知识库相关模块：

- `app/cosight/tool/legal_search_toolkit.py`
- `cosight_server/deep_research/services/legal_kb/`
- `config/knowledge/legal-knowledge-seed.json`
- `config/knowledge_platform_seed.json`
- `config/knowledge_crawl_seeds.json`
- `work_space/knowledge_store/` 中的民法典、劳动法、公司法、个人信息保护法等知识文件

检索链路支持：

- 本地 Chroma 向量库。
- NPC 公开法规同步。
- 得理法律检索 API 集成位。
- 模板、类案、法规片段混合返回。

改进价值：解决法律场景中“结论必须有依据、引用必须可追溯”的痛点。

### 3.4 材料上传、任务登记与材料库

在后端 `common.py` 中新增或增强：

- `/upload/files`：支持 PDF、DOCX、图片、表格等材料上传。
- `/demo/material-library`：聚合上传材料、任务工作区产物、生成报告。
- `/demo/material-library/register-task`：把上传材料与任务、用户、工作区关联。
- 文件大小、数量、扩展名校验。

前端新增：

- `MaterialsPage.tsx`
- `FileUploadZone.tsx`
- `ScenarioIntakePanel.tsx`
- `AgentEvidencePanel.tsx`

改进价值：原生任务执行被扩展为“材料接入 -> 工作区归档 -> 结果交付”的完整法律办案链路。

### 3.5 真实执行过程可视化

新增 React 前端 `cosight_frontend/`，包含：

- 智能工作台：`WorkspacePage.tsx`
- 任务执行页：`WorkspaceRunPage.tsx`
- 任务结果页：`WorkspaceResultPage.tsx`
- DAG 图：`DagGraphPanel.tsx`
- DAG 执行面板：`DagExecutionPanel.tsx`
- 工具轨迹：`ToolTracePanel.tsx`
- 阶段结果：`PhaseResultCard.tsx`
- 智能体流水线：`AgentPipeline.tsx`

改进价值：把原生执行日志转化为评委可理解的流程界面，答辩时可以直接说明“哪个智能体在何时因什么条件被调度”。

### 3.6 文书生成与导出

新增文书服务：

- `document_generator.py`
- `document_export.py`
- `contract_documents.py`
- `document_research.py`
- `execution_snapshot.py`

新增前端导出组件：

- `DocumentExportButton.tsx`
- `ExecutionExportActions.tsx`
- `DocumentDeliverablePanel.tsx`

导出内容优先使用真实执行快照，包括：

- 工作区路径。
- 阶段结论。
- 工具调用。
- 引用与证据。
- replay 统计信息。

改进价值：从“AI 输出一段文本”升级为“可交付、可复核、可归档的法律文书”。

### 3.7 可信安全与审计链

新增可信相关能力：

- `audit_log.py`：从 replay 事件构造审计日志。
- `/demo/audit-log`：获取最新或指定任务审计链。
- 交叉审查智能体：检查事实一致性、引用匹配、幻觉风险。
- 合规监测智能体：导出前门禁与合规提示。

改进价值：对应国赛“可信计算机制、数据安全与合规保障措施”的可选加分项，同时强化法律行业对可追溯性的要求。

### 3.8 管理端与运行时配置

新增管理端能力：

- 模型/API 配置：`AdminConnectionsPage.tsx`、`admin_runtime_config.py`
- 知识库管理：`AdminKnowledgePage.tsx`
- 策略规则：`AdminPoliciesPage.tsx`
- 用户管理：`AdminUsersPage.tsx`
- 智能体管理：`AdminAgentsPage.tsx`

运行时配置写入：

- `config/runtime/admin_settings.json`
- `config/runtime/custom_mcp_tools.json`
- `config/runtime/knowledge_crawl_state.json`

改进价值：使系统从“代码级配置”走向“产品级配置”，便于现场演示模型/API/知识库可管理性。

### 3.9 国赛演示与提交材料工程化

新增比赛材料目录：

- `docs/competition/technical-solution.md`
- `docs/competition/innovation-summary.md`
- `docs/competition/demo-script.md`
- `docs/competition/submission-checklist.md`
- `docs/competition/tool-api-reference.md`
- `docs/competition/membership-plan.md`

新增启动与测试辅助：

- `start-lexhub.bat`
- `scripts/setup-env.bat`
- `scripts/run-backend.bat`
- `cosight_frontend/run-dev.bat`
- `test/` 三套法律演示材料

改进价值：降低评委/队友复现成本，将“能跑”变成“能交付、能讲清楚、能演示”。

## 4. 和国赛要求的对应关系

| 国赛要求 | LexHub 对应实现 |
|---|---|
| 必须基于 Co-Sight 开源版本 | 保留原生 Co-Sight 后端、Agent、Tool、WebSocket、Replay 能力，在其上二次开发 |
| 至少 2 个以上智能体协作 | 法律场景下定义 6 类智能体：任务理解、证据质检、法规研究、文书生成、交叉审查、合规监测 |
| DAG 任务引擎编排 | `legal-workflow.json` 声明节点、边、条件分支和强制审查节点；前端 DAG 执行视图展示流程 |
| 至少调用 3 类以上工具/API | 联网搜索、法规 RAG、文档上传/解析、代码执行、文书导出、审计日志 |
| 多跳推理深度大于 3 | 任务理解 -> 证据质检 -> 法规研究 -> 文书生成 -> 交叉审查 -> 合规监测 |
| 性能对比基准 | `/board`、`/analytics`、`metrics_aggregator.py` 提供效率、引用追溯、过程复核等对比维度 |
| 可信安全设计 | replay、审计日志、导出快照、交叉审查、合规门禁、权限分离 |
| 可复制可扩展 | 工作流包、工具包、知识库包、管理端配置、行业种子数据可迁移 |

## 5. 可作为答辩表述的改进总结

1. 我们没有重做 Co-Sight 底座，而是复用了其多智能体、DAG、工具调用和 replay 能力。
2. 我们的主要工作是把通用超级智能体框架行业化为法律场景，形成 LexHub 法律智能体工作台。
3. 我们新增了法律智能体角色、动态路由规则、法律知识库、法规检索工具、材料库、文书导出、审计链和管理端。
4. 我们将国赛要求显式映射到系统页面、配置文件和演示脚本，确保评委能看到“赛题要求如何在系统中落地”。
5. LexHub 的价值不只是一个 Demo 页面，而是一套可复制到合同审查、争议解决、公司治理、数据合规等场景的行业智能体建设范式。

