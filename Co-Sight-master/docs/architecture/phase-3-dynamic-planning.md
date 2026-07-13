# 阶段 3：动态规划与条件 DAG

## 目标

Planner 根据用户目标、材料类型和期望输出动态选择专业智能体，不依赖固定四阶段模板。计划是运行时事实源，前后端共同消费同一组字段。

## 规划契约

`create_plan` 与 `update_plan` 支持并校验以下信息：

- `agent_ids`：每个步骤的显式执行智能体；
- `dependencies`：步骤依赖，可形成非线性 DAG；
- `parallel_groups`：可同时启动的步骤组；
- `conditions`：进入步骤或返工的条件说明；
- `expected_artifacts`：每步预期产物；
- `selected_agents` / `skipped_agents`：选角结果及跳过原因；
- `scenario`、`target_output`、`risk_level`：任务语境与交付约束。

Planner 可选工作智能体为 `evidence`、`issue_spotter`、`research`、`clause_risk`、`calculation`、`drafting`、`verification`。简单咨询可以走短链路；合同审查等复杂任务可并行启动材料核验与法规研究，再汇聚到风险分析和结果校验。

## 运行时与展示

- 调度器优先读取 `step_agent_ids`，仅为旧回放保留标题推断兼容逻辑。
- 执行事件记录真实 `agent_id`、`capability_id` 和结构化能力结果。
- 执行快照向前端传递选角、并行组、条件和预期产物。
- DAG 节点展示实际智能体、能力、工具调用及阶段状态，不再把演示工作流当作真实执行路径。
- 导出报告使用“自动质量校验”，不要求用户人工复核。

## 验证

- `python tools/validate_phase3_dynamic_plan.py`
- `python scripts/full_chain_audit.py --timeout 180`
- `npm run build`（在 `cosight_frontend` 目录）

2026-07-12 的真实审计生成 4 步动态计划：材料核验与法规研究并行，随后执行条款风险分析和自动质量校验；计划显式选择 `evidence`、`research`、`clause_risk`、`verification`。审计剩余的最终完成信号和结果为空问题属于阶段 5 的执行收口范围。
