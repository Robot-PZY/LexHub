# Phase 06 - 页面迁移矩阵

本矩阵用于执行核心业务页迁移时跟踪范围、组件替换和风险。

| 页面 | 批次 | 当前主要依赖 | 目标组件 / Pattern | 风险 | 验收重点 |
| --- | --- | --- | --- | --- | --- |
| Workspace Intake | Batch 1 | `workspace-intake-*`、`ds-card`、`btn`、ComposerPanel、ScenarioIntakePanel | MatterIntake、ScenarioSelector、Panel、Button、Textarea、Upload、Status | draft、documentIntake、taskId、upload meta | 场景选择、填写、上传、提交、草稿恢复 |
| Workspace Run | Batch 1 | `workbench-*`、DagGraphPanel、DagExecutionPanel、ToolTracePanel、ToolCallToast | AgentPipeline、Timeline、Panel、Status、ToolCallLog | 执行状态、pending request、DAG 复杂 | running/completed/failed 状态和查看结果入口 |
| Workspace Result | Batch 1 | `workspace-result-*`、TaskReportPanel、DocumentDeliverablePanel、ExecutionExportActions | ReviewScore、CitationBlock、RiskPanel、EvidenceList、DocumentExportPanel、AuditTrail | snapshot、report parser、export | 结论、依据、风险、导出、空状态 |
| Review | Batch 1 | `feature-*`、`ds-card`、PageHeader | Review workspace、Table/List、ReviewScore、RiskPanel、EvidenceList、AuditTrail | 真实待审数据不足 | 待审列表、审查报告、人工操作 |
| Materials | Batch 2 | `materials-*`、`ds-card`、`btn`、export logic | Table/List、Toolbar、Status、Button、EmptyState、RowActions | 下载/导出/清空逻辑 | 筛选、导出、空状态、危险操作 |
| Evidence | Batch 2 | `feature-*`、`ds-table`、`ds-card` | EvidenceList、Toolbar、RiskPanel、Status、Button | 与 Materials 边界、mock 指标 | 证据质量、风险、带入事项 |
| Reports | Batch 3 | `feature-*`、document export | DocumentExportPanel、Table/List、EmptyState | 输出物类型和导出状态 | 历史报告、导出、查看 |
| Replay | Batch 3 | replay-specific layout | AuditTrail、Timeline、EvidenceList、Panel | 回放数据结构复杂 | 办理链路可追溯 |
| Documents | Batch 3 | thin page / export components | DocumentExportPanel、EmptyState | 页面目前较轻 | 与 Reports 边界明确 |
| Cases | Batch 4 | `feature-*`、stepper | CaseList、MatterSummary、Status | 与 Workspace 重叠 | 事项列表与继续办理 |
| Research | Batch 4 | `feature-*` | Knowledge search、CitationBlock、Panel | 与 Admin Knowledge 边界 | 法规研究体验 |
| Agents | Batch 4 | Agent demo components | AgentRegistry、AgentPipeline | 用户端/管理端概念混淆 | 只展示用户可理解能力 |
| Analytics | Batch 4 | chart panels | Data panels、Status、Table | 普通用户是否需要 | 指标清晰不过度 |
| Membership | Batch 4 | pricing / landing styles | PricingPanel、PlanBadge | 营销感过强 | 账户页而非广告页 |
| Profiles | Batch 4 | profile layout | ProfilePanel、Table/List | 低优先级 | 信息清楚 |
| Landing | Batch 4 | landing-heavy CSS | Product hero、real UI preview | 依赖最终产品界面 | 第一屏产品定位准确 |

## 迁移记录模板

每个页面迁移完成后补充：

```txt
页面：
迁移日期：
替换组件：
仍依赖 legacy class：
可删除候选 class：
保留原因：
测试：
截图：
后续问题：
```

## 组件替换建议

| 旧模式 | 新模式 |
| --- | --- |
| `btn btn-primary` | `Button variant="primary"` |
| `btn btn-secondary` | `Button variant="secondary"` |
| `btn btn-ghost` | `Button variant="ghost"` |
| `ds-badge ds-badge-*` | `Badge tone="..."` 或 `Status status="..."` |
| `ds-card` | `Panel` |
| `feature-stat-grid` | `Panel` + `Stat` pattern |
| `feature-layout` | 页面级 layout + `Panel` |
| `feature-side-stack` | Context Panel |
| `workspace-success-banner` | `StatusBanner` 或 `Panel tone="success"` |
| inline loading text | `LoadingState` |
| ad hoc empty block | `EmptyState` |

## 不应立即替换

这些组件内部复杂，第一轮只统一外层：

- `DagGraphPanel`
- `DagExecutionPanel`
- `DocumentDeliverablePanel`
- `TaskReportPanel`
- `ToolCallToast`
- `FileUploadZone`
- `ScenarioIntakePanel`

