# Phase 06 - 核心业务页迁移

本阶段目标是迁移用户端核心闭环页面，让 LexHub 的主流程先达到新的设计系统标准。Phase 06 应在 Phase 05 的 token、P0 基础组件和试点页面完成后开始。

## 阶段目标

- 迁移用户端核心业务页。
- 用新组件替代旧 `btn`、`ds-card`、`feature-*`、`workspace-*` 中可收敛的部分。
- 保持业务逻辑稳定，不做无关功能重写。
- 建立每个页面的状态、响应式和验收标准。

## 迁移原则

### 1. 不重写业务逻辑

优先替换 UI 结构和组件，不改动 API、storage、routing、业务计算和导出逻辑。

### 2. 一页一迁移

每次只迁移一个页面或一个局部 pattern。完成 build、lint、截图检查后再进入下一页。

### 3. 先核心闭环

优先：

```txt
Workspace Intake -> Workspace Run -> Workspace Result -> Review
```

然后再迁移材料、证据、报告、回放等周边页面。

### 4. 保留可用旧组件

`DagGraphPanel`、`DocumentDeliverablePanel`、`TaskReportPanel` 等复杂组件不应一开始重写。先用新 Panel / Status / Toolbar 包裹和统一外层。

### 5. 每页记录 legacy class

迁移后记录：

- 仍依赖哪些旧 class。
- 哪些旧 class 可删除候选。
- 哪些样式需要后续抽成组件。

## 迁移批次

### Batch 0 - 前置条件

来自 Phase 05：

- Lint 无 error。
- Build 通过。
- Token 扩展完成。
- P0 基础组件完成。
- 至少一个试点页面完成。

### Batch 1 - 工作台闭环

1. Workspace Intake
2. Workspace Run
3. Workspace Result
4. Review

目标：

- 用户可以从新事项受理到查看结论和审查。
- 页面主操作、状态、证据、依据、风险更清晰。

### Batch 2 - 材料与证据

1. Materials
2. Evidence

目标：

- 材料库和证据整理统一成业务资产管理体验。
- 表格、筛选、上传、详情预览模式统一。

### Batch 3 - 输出与归档

1. Reports
2. Replay
3. Documents

目标：

- 报告、文书、归档回放统一为“输出物与审计记录”体验。

### Batch 4 - 次级业务页

1. Cases
2. Research
3. Agents
4. Analytics
5. Membership
6. Profiles
7. Landing

目标：

- 在核心体验稳定后统一视觉。
- Landing 最后做，确保能展示真实产品界面。

## 页面迁移方案

### Workspace Intake

现有页面：

```txt
src/pages/WorkspacePage.tsx
```

现有特点：

- 已经有受理步骤 rail。
- 已经有场景选择、文书要素、Composer、上传 meta。
- 依赖大量 `workspace-intake-*` class 和 `ds-card`。

目标：

- 迁移为 MatterIntake pattern。
- 使用新 PageHeader、Panel、Status、Button、Textarea。
- 将场景选择独立为 ScenarioSelector。
- 右侧补足 SubmitSummary / Validation status。

风险：

- 场景选择与 `documentIntake` 逻辑紧密。
- Draft 保存和 pending task 逻辑不能破坏。
- 上传 meta 与 taskId 关联不能丢。

验收：

- 选择场景、填写事实、上传材料、提交办理均可用。
- validation error 正确显示。
- 草稿保存仍有效。
- 移动端表单不溢出。

### Workspace Run

现有页面：

```txt
src/pages/WorkspaceRunPage.tsx
```

关键组件：

- DagExecutionPanel
- DagGraphPanel
- AgentStrip
- ToolTracePanel
- StepFlowPanel
- DocumentDeliverablePanel
- ToolCallToast

目标：

- 用新 PageHeader / Panel / Status 统一外层。
- 保留 DAG 和复杂执行组件。
- Tool calls、Evidence、Phase output 进入清晰 context panel。
- completed 状态主操作“查看审查结论”突出。

风险：

- 运行态依赖 hook 和本地 pending request。
- Tool toast 和执行状态可能有时序逻辑。
- DAG 视觉复杂，不宜一开始重画。

验收：

- pending task 能继续运行。
- running / completed / failed 状态清楚。
- 完成后可进入 Result。
- 运行中页面不出现大面积空白。

### Workspace Result

现有页面：

```txt
src/pages/WorkspaceResultPage.tsx
```

关键组件：

- TaskReportPanel
- DocumentDeliverablePanel
- AgentEvidencePanel
- ToolTracePanel
- ExecutionExportActions

目标：

- 输出结构更像法律审查报告。
- 结论摘要、ReviewScore、RiskPanel、CitationBlock、EvidenceList 同屏组织。
- 导出入口稳定可见。
- 附录和工具链详情默认折叠。

风险：

- 结果数据可能来自 latest execution snapshot。
- 报告解析和导出逻辑不能破坏。
- 空结果状态要能引导回 Workspace。

验收：

- 无结果时有可行动空状态。
- 有结果时结论、依据、风险、导出可见。
- 导出功能可用。
- 回放和材料库入口保留。

### Review

现有页面：

```txt
src/pages/ReviewPage.tsx
```

现有特点：

- 当前偏展示型 feature 页面。
- 使用 `feature-*` class 和 `ds-card`。

目标：

- 迁移为审查工作台。
- 左侧待审列表，中间审查报告，右侧证据/法条/风险/审计。
- 增加空队列、待审、高风险、已通过等状态。

风险：

- 当前可能没有真实待审队列数据。
- 需要用 demo/mock 数据填充结构，但不要伪造业务逻辑。

验收：

- 用户知道哪些事项需复核。
- 审查等级、风险说明、证据依据可见。
- 主操作“生成报告/通过/标记复核”清楚。

### Materials

现有页面：

```txt
src/pages/MaterialsPage.tsx
```

目标：

- 迁移为材料资产管理页。
- 使用 Table/List、Toolbar、Status、EmptyState、Button。
- 导出操作和下载操作统一为 row actions。

风险：

- 导出逻辑和文件链接不能破坏。
- 清空材料库是危险操作，需要确认或明显提示。

验收：

- 筛选可用。
- 下载/导出可用。
- 空材料库能引导发起事项。
- 删除/清空操作风险明确。

### Evidence

现有页面：

```txt
src/pages/EvidencePage.tsx
```

目标：

- 从展示页升级为证据整理工作区。
- 材料表格、质量检查、风险提示和带入事项动作统一。

风险：

- 与 Materials 的边界要明确。
- 证据质量指标可能是 mock，需要视觉上标注为辅助判断。

验收：

- 用户能看懂哪些材料可作为证据。
- 带入事项受理入口清楚。
- 风险和缺失材料提示可见。

## 每页迁移验收

每页完成后必须检查：

- `npm run build`
- `npm run lint` 无新增 error
- 主流程手工走通
- 桌面端 1440px 检查
- 移动端 390px 检查
- 无新增乱码
- 无文本溢出
- 主操作清楚
- 空/加载/错误状态至少覆盖必要场景

## 阶段验收

Phase 06 完成标准：

- Workspace Intake、Run、Result、Review 完成迁移。
- Materials、Evidence 至少完成基础统一。
- 核心用户闭环可完成。
- 新组件在核心页面中稳定使用。
- 旧样式依赖有记录。
- `layouts.css` 没有继续大幅增长。

