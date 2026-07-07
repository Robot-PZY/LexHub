# 国赛提交材料对照清单

## 一、封闭约束（必须满足）

| 要求 | 状态 | 证据 |
|------|------|------|
| 基于中兴 Co-Sight 开源框架 | ✅ | 工作台 WebSocket 执行、replay.json、Plan 拆解 |
| 多智能体协同（≥2） | ✅ | 5 个法律智能体，`/agents` |
| DAG 任务编排 | ✅ | `legal-workflow.json`、DAG 执行视图、`/board` |
| 可运行代码 | ✅ | `start-lexhub.bat` |
| 完整技术文档 | ✅ | `docs/competition/` |

## 二、核心技术要素

| 要素 | 状态 | 说明 |
|------|------|------|
| 多智能体 | ✅ | 理解/证据/研究/文书/审查 |
| DAG（分支/并行/回溯） | ✅ | 条件边 + replay 回溯；并行工具调用 |
| 工具 ≥3 类 | ✅ | 搜索、代码、文档、法规、导出 |
| 可信机制（可选） | ✅ | 审查、回放、导出溯源、人工复核点 |
| 多跳 >3 | ✅ | 通常 5+ 跳 |
| 性能对比 | ✅ | `/board` · `/analytics` |

## 三、提交材料

| 材料 | 状态 | 路径 |
|------|------|------|
| 技术方案 | ✅ | technical-solution.md |
| 工作流 JSON | ✅ | config/legal-workflow.json |
| 工具封装说明 | ✅ | tool-api-reference.md |
| 知识库样例 | ✅ | config/knowledge/legal-knowledge-seed.json |
| 部署脚本 | ✅ | start-lexhub.bat |
| 创新总结（必交） | ✅ | innovation-summary.md |
| 演示视频 | ⏳ | 按 demo-script.md 录制 |

## 四、答辩话术（防追问）

- **Co-Sight 关系**：二次开发前端与管理端，底层执行走 Co-Sight WebSocket 与 replay 机制。
- **DAG 并发/循环**：条件分支与多工具并行已在 replay 中体现；返工/回溯通过 replay 与跳步展示。
- **商业化**：个人三档为规划 + Demo 标注，非已上线计费。
- **定制团队**：机构客户走定制，不在个人三档展开。
