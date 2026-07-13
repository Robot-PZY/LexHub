# 阶段 2：专业智能体模板与运行时调度

## 实现结果

LexHub 现有 1 个 Planner 和 7 个专业 Worker，共 8 个注册智能体：

1. 任务编排智能体（现有 Planner）
2. 材料证据智能体
3. 法律争点智能体
4. 法规研究智能体
5. 条款风险智能体
6. 时效计算智能体
7. 文书生成智能体
8. 质量校验智能体

每个 Worker 使用独立 `AgentTemplate`、角色边界提示和工具白名单。`BaseAgent` 工具事件携带真实 `agent_id`，前端优先使用该字段识别节点执行者。

## 兼容调度

阶段 3 前，`resolve_step_agent_id` 按以下优先级路由：

1. 读取 Plan 的 `step_agent_ids` 显式绑定（为阶段 3 预留）。
2. 按步骤标题语义映射专业智能体。
3. 无法识别时回退到法律争点智能体。

阶段 3 将由 Planner 原生输出 `agentId`，标题推断只保留为旧 Replay 兼容方案。

## 工具最小权限

- Evidence：材料读取、OCR/解析、图片理解、阶段保存。
- Issue Spotter：材料读取、事实查找、阶段保存。
- Research：法规检索、Google/Tavily/Wiki、网页读取。
- Clause Risk：材料读取、本地合同版本比对。
- Calculation：材料读取、代码计算。
- Drafting：材料读取、文书写入、HTML 报告。
- Verification：结果读取、内容查找、确定性计算。

验证明确确认 Evidence 无 `legal_search`、Research 无 `execute_code`、Drafting 无 `extract_document_content`。

## 前端同步

- 默认 Agent Registry 更新为 8 个智能体。
- Capability 到智能体的兼容映射增加争点、条款、计算和质量校验。
- `ToolCallTrace.runtimeAgentId` 保存后端真实实例角色。
- DAG 节点优先显示真实运行时智能体，不再仅通过标题猜测。

## 真实主链审计（2026-07-12）

| 指标 | 阶段 0 | 阶段 2 |
| --- | ---: | ---: |
| 审计通过 | 18 / 19 | 19 / 20 |
| DAG 阶段 | 7 | 8 |
| Plan 更新 | 11 | 13 |
| 运行时专业智能体 | 未统计 | 3（issue_spotter、evidence、research） |
| 工具记录 | 44 | 57 |
| 相同预算错误重复 | 3 条相同 legal_search | 0 |
| 完成信号 | 失败 | 失败 |
| 最终结果 | 空 | 空 |

审计在 180 秒内真实观测到三个不同专业 AgentInstance，证明本阶段不是配置层改名。任务完成信号仍属于阶段 5 的已知基线缺口，阶段 2 不通过延长窗口掩盖。

## 验证入口

- `tools/validate_phase2_specialists.py`
- `scripts/full_chain_audit.py --timeout 180`
- Python compileall
- 前端 TypeScript + Vite production build
