# 阶段 1：统一 Capability 层

## 目标

将第三方 API、Co-Sight 工具与本地功能统一为可注册、可授权、可调用、可追踪和可展示的 Capability。旧工具事件继续保留，新增字段供运行页和 Replay 渐进迁移。

## 首批能力

| Capability | Provider | Allowed Agent | Result Type | 实现 |
| --- | --- | --- | --- | --- |
| `document_parse` | LexHub + 百度 | `evidence` | `structured_document` | 文档读取、百度文档解析、OCR 降级 |
| `legal_search` | 得理 + NPC + Chroma | `research` | `legal_citations` | 混合法规检索 |
| `contract_compare` | LexHub Local | `clause_risk` | `diff` | 本地条款增删改 |

## 后端结构

```text
services/capabilities/
  models.py
  registry.py
  executor.py
routers/capability.py
```

HTTP 接口：

- `GET /demo/capabilities`
- `POST /demo/capabilities/invoke`

独立调用会验证 `agentId` 权限；越权调用返回 `AGENT_NOT_ALLOWED`。本地文件路径必须位于 LexHub 项目目录内。

## 旧工具兼容

`BaseAgent._push_tool_event` 对已注册旧工具增加：

```json
{
  "capability_id": "legal_search",
  "result_type": "legal_citations",
  "capability_result": {}
}
```

旧的 `tool_name`、`processed_result`、`event_type` 保持不变。相同智能体步骤中的同一错误只发布一次，避免并行返回重复预算错误。

## 前端兼容

- 新增 `types/capability.ts`。
- `ToolCallTrace` 支持 Capability ID、结果类型、数据、来源、产物和指标。
- 运行页能力卡显示 Capability ID、结果类型与来源数。
- 工具轨迹调整为按真实发生时间升序，最近八次调用保持时间顺序。

## 验证

- `tools/validate_phase1_capabilities.py`
- 三项能力注册与结果类型通过。
- 文档解析固定材料通过。
- 合同 diff 通过。
- 法规检索使用离线替身验证封装，不消耗外部额度。
- 智能体越权拒绝通过。
- 旧事件 CapabilityResult 适配通过。
- 重复工具错误抑制通过。
- HTTP Registry 与 Invoke 路由通过。
- 后端编译与前端生产构建通过。

## 下一阶段入口

阶段 2 创建专业 AgentTemplate 时，只允许从 Registry 选择 `allowedAgents` 包含自身 ID 的能力。现有其他工具将在后续阶段按使用场景逐步注册，不一次性机械迁移。
