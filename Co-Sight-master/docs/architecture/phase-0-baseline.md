# 阶段 0：基线与协议冻结

## 范围

本阶段不改变 Co-Sight 调度逻辑，只固定后续实施所依赖的验收案例、运行时领域模型、统一事件名称和基线测量方式。`Co-Sight-master-raw` 不参与修改。

## 当前实现事实

- 运行时具有独立 Planner，但工作步骤主要由同一种通用 `TaskActorAgent` / `ActorTemplate` 执行。
- `config/legal-workflow.json` 与 `config/agent-registry.json` 声明了法律角色，但尚未完整绑定为独立运行时模板。
- 当前工具事件使用 `tool_start`、`tool_complete`、`tool_error`，由前端适配为调用轨迹。
- 当前计划进度通过 `lui-message-manus-step` 推送，完成通过 `control-status-message` 表示。
- 当前 Replay、实时运行和执行快照的数据结构仍存在多套解释逻辑。
- 已增加步骤迭代、工具次数、同工具重试、外部搜索和步骤时间预算。
- 运行页已改为显示实际 DAG 步骤，不再固定展示四阶段。

## 冻结协议

- 运行时 Schema：`config/contracts/lexhub-runtime-contracts.schema.json`
- 验收案例：`config/acceptance-cases.json`
- 固定材料：`fixtures/contracts`、`fixtures/disputes`
- Schema 验证：`scripts/validate_phase0_contracts.py`

阶段 1 开始后，Agent、Capability、Artifact、ExecutionPlan 和 Event 的新增字段必须符合冻结 Schema；若确需修改，必须同步前端类型、Replay 适配与验收脚本。

## 三个固定验收案例

1. 服务合同审查：验证材料解析、争点、法规与条款风险并行、文书生成和自动质检。
2. 欠款纠纷：验证材料时间线、法规与金额计算并行、文书生成和自动质检。
3. 简单法律咨询：验证动态短链，不应启动材料、条款、计算和独立文书智能体。

## 基线检查项

| 检查项 | 记录方式 |
| --- | --- |
| 后端可编译 | `python -m compileall -q app cosight_server` |
| 前端可构建 | `npm.cmd run build` |
| Schema 有效 | `python scripts/validate_phase0_contracts.py` |
| 上传成功 | `scripts/full_chain_audit.py` |
| DAG 生成 | WebSocket `lui-message-manus-step` |
| 工具调用 | WebSocket `lui-message-tool-event` |
| 完成信号 | WebSocket `control-status-message` |
| Replay 可读取 | `/replay/workspaces` 与 `/demo/execution-snapshot` |

## 已知基线问题

1. 专业智能体目前更多是声明层角色，运行时仍主要复用通用 Actor。
2. 工具/API/本地功能缺少统一 Capability 请求与结果封装。
3. 阶段结果主要存放在自然语言 `step_notes`，缺少统一 Artifact。
4. 前端工具渲染依赖旧事件结构和工具名映射。
5. 最终结果与阶段事实、法规、工具来源之间缺少稳定的可点击来源链。
6. 历史真实审计曾出现步骤未在时限内全部完成，需要用阶段 0 新基线重新验证当前预算收口效果。

## 2026-07-12 真实主链基线

执行命令：`python scripts/full_chain_audit.py --timeout 180`。后端使用冷启动，整次启动与审计约 232 秒。

| 指标 | 基线结果 |
| --- | --- |
| 审计通过 | 18 / 19 |
| 材料上传 | 通过 |
| DAG 阶段 | 7 |
| Plan 更新 | 11 次 |
| 观测到的工具类型 | 7 类 |
| 工具调用记录 | 44 次 |
| 法规检索 | 已调用 `legal_search` |
| 工具预算错误 | 3 条，均为 `legal_search` 超过单工具 3 次预算 |
| 任务完成信号 | 失败，180 秒内无 `control-status-message` |
| 执行快照最终结果 | 空 |
| Replay 列表 | 通过，3 个工作区 |
| WebSocket Replay | 通过，4 个事件 |

本次实际 DAG 前五阶段为任务理解、证据质检、法规研究、文书生成、交叉审查，计划共 7 阶段。该结果证明现有主链已经能够规划、执行工具和保存回放，但“执行收口 → 最终结果 → 完成事件”仍是当前最高优先级缺口。

阶段 1～5 的回归不得通过缩短审计内容规避这个缺口，必须满足：

1. 同一 180 秒窗口内发出唯一 `task_completed`（兼容期同时映射为 `control-status-message`）。
2. `final_result` Artifact 非空。
3. 工具调用结果经统一 CapabilityResult 封装，不再依赖工具名特例。
4. 同一预算错误只记录一次，不在并行工具返回中重复展示。

## 阶段 0 完成标准

- Schema 文件可被 Draft 2020-12 校验器加载。
- 三个验收案例和两份固定材料存在且可解析。
- Python 后端编译通过。
- 前端生产构建通过。
- 全链路审计结果被记录到本文件或同目录基线报告。
- 不包含真实 API Key、Secret 或 Access Token。
