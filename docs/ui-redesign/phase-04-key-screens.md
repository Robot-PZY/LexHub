# Phase 04 - 核心页面高保真

本阶段目标是在 Figma 中完成 P0 核心页面高保真稿和可点击原型。Phase 04 仍不改前端代码，它的产物是可以指导 Phase 05/06/07 施工的页面设计规格。

## 阶段目标

- 明确 P0/P1/P2 页面高保真优先级。
- 为每个 P0 页面定义布局、组件、状态和主操作。
- 建立核心流程原型链路。
- 确认桌面端与移动端关键断点策略。
- 为前端迁移提供页面级验收标准。

## 页面优先级

### P0 - 必须先做

这些页面构成 LexHub 的核心闭环和管理基线：

1. Login
2. Workspace Intake
3. Workspace Run
4. Workspace Result
5. Review
6. Admin Overview
7. Admin Knowledge

### P1 - 第二批

这些页面承接核心流程周边能力：

1. Materials
2. Evidence
3. Admin Connections
4. Admin Policies

### P2 - 第三批

这些页面在核心视觉确定后再统一迁移：

1. Landing
2. Reports
3. Replay
4. Membership
5. Profiles
6. Analytics
7. Agents
8. Documents
9. Cases

## P0 页面方向

### 1. Login

目标：

- 建立可信、安全、专业的入口。
- 区分普通用户和管理员。
- 支持 demo 体验，但不能显得像玩具。

推荐布局：

- 左侧：品牌定位、能力摘要、可信说明。
- 右侧：登录表单、角色选择、错误提示、登录按钮。

核心组件：

- Auth Shell
- Brand Lockup
- Role Selector
- Input
- Button
- Status / Error Message

关键状态：

- default
- loading
- invalid account
- role mismatch
- admin hint

### 2. Workspace Intake

目标：

- 从 prompt 输入升级为法律事项受理台。
- 让用户按场景、事实、材料、文书要素完成提交。

推荐布局：

- 左侧：受理步骤 Stepper。
- 中间：场景选择、事实描述、文书要素、材料上传。
- 右侧：事项摘要、材料清单、校验状态、历史草稿。

核心组件：

- App Shell
- PageHeader
- MatterIntake
- ScenarioSelector
- Textarea
- Upload
- SubmitSummary
- EmptyState

关键状态：

- empty
- scenario selected
- validation error
- upload pending
- ready to submit
- existing draft

### 3. Workspace Run

目标：

- 展示智能体办理过程，让用户知道系统正在做什么。

推荐布局：

- 顶部：事项标题、状态、耗时、操作。
- 中间：Agent Pipeline / Timeline / DAG。
- 右侧：工具调用、证据引用、阶段产物。
- 底部或次级区域：实时日志和最近事件。

核心组件：

- AgentPipeline
- Timeline
- Status
- ToolCallLog
- EvidenceList
- Toast
- LoadingState

关键状态：

- queued
- running
- waiting for tool
- warning
- failed
- completed

### 4. Workspace Result

目标：

- 让用户快速理解结论，并能追溯依据和导出文书。

推荐布局：

- 顶部：结论摘要、审查等级、可信度、导出操作。
- 主区域：结构化法律报告。
- 右侧：法条引用、证据链、风险提示、文书导出。
- 底部：办理过程回放入口。

核心组件：

- ReviewScore
- CitationBlock
- RiskPanel
- EvidenceList
- DocumentExportPanel
- AuditTrail

关键状态：

- no result
- ready
- needs review
- high risk
- export loading
- export success

### 5. Review

目标：

- 从“展示结果”升级为“审查工作台”。

推荐布局：

- 左侧：待审事项列表和筛选。
- 中间：审查报告和人工复核操作。
- 右侧：证据、法条、风险、审计日志。

核心组件：

- Table / List
- ReviewScore
- CitationBlock
- RiskPanel
- EvidenceList
- AuditTrail
- Toolbar

关键状态：

- empty queue
- item selected
- needs review
- approved
- rejected / flagged

### 6. Admin Overview

目标：

- 一眼判断系统是否可用。

推荐布局：

- 顶部：系统健康总览、同步状态、主操作。
- 第一层：Runtime、Models、Knowledge、API、Agents 状态。
- 第二层：最近错误、审计事件、使用概览。
- 右侧或底部：配置快捷入口。

核心组件：

- Admin Shell
- RuntimeStatusPanel
- Status
- Table / Event List
- Toolbar
- EmptyState

关键状态：

- all ready
- partial warning
- missing key
- sync stale
- error

### 7. Admin Knowledge

目标：

- 管理 LexHub 的法律知识资产。

推荐布局：

- 顶部：知识库总状态、最近同步、导入操作。
- 左侧：法规、案例、模板、合同包 library nav。
- 中间：搜索、筛选、列表。
- 右侧：详情预览、来源、同步状态。
- 导入 tab：上传、同步、校验、回滚。

核心组件：

- KnowledgeBrowser
- Tabs
- Toolbar
- Table / List
- Drawer / Preview Panel
- Status
- Upload
- EmptyState

关键状态：

- empty library
- loading
- ready
- syncing
- sync warning
- import error

## 原型链路

P0 原型必须覆盖：

```txt
Login
-> Workspace Intake
-> Workspace Run
-> Workspace Result
-> Review
-> Replay entry
```

管理端原型必须覆盖：

```txt
Login as admin
-> Admin Overview
-> Admin Knowledge
-> Knowledge import
-> Admin Connections entry
```

## 桌面端与移动端策略

桌面端主画布：

```txt
1440 x 1024
```

次级检查：

```txt
1280 x 900
1024 x 768
390 x 844
```

移动端规则：

- Sidebar 收起为 drawer。
- 右侧 Context Panel 下沉到主内容下方或变为 tabs。
- 表格优先转为列表。
- 主操作固定在页面头部或表单底部，不漂浮遮挡内容。

## Figma Frame 命名

建议：

```txt
P0 / Login / Desktop
P0 / Login / Mobile
P0 / Workspace Intake / Desktop
P0 / Workspace Intake / Mobile
P0 / Workspace Run / Desktop
P0 / Workspace Result / Desktop
P0 / Review / Desktop
P0 / Admin Overview / Desktop
P0 / Admin Knowledge / Desktop
```

状态帧：

```txt
State / Empty
State / Loading
State / Error
State / Success
State / Warning
```

## 验收标准

- P0 页面均完成桌面高保真。
- Login、Workspace Intake 至少完成移动端高保真。
- 核心用户流程可点击。
- 管理端流程可点击。
- 页面组件来自 Phase 03 组件库。
- 每个页面有空状态、加载态、错误态或说明为何不需要。
- 每个页面主操作清晰。
- 设计稿能直接指导 Phase 05/06/07 前端施工。

