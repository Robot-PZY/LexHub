# Phase 07 - 管理后台迁移

本阶段目标是将管理端迁移为稳定、可扫描、适合配置和运维的控制台。Phase 07 应在 Phase 05 的前端设计系统基础组件可用后推进。

## 阶段目标

- 统一 Admin Shell 和管理端页面结构。
- 将管理端主入口收敛为控制台式信息架构。
- 管理模型/API、知识库、策略、用户时有清晰状态、反馈和风险提示。
- 减少营销式大横幅和展示型卡片。
- 用 Panel、Status、Table、Toolbar、Tabs、Dialog 等新组件替代旧 `ds-card`、`admin-*`、`feature-*` 中可收敛的部分。

## 当前管理端路由事实

当前主路由：

- `/admin` -> AdminOverviewPage
- `/admin/connections` -> AdminConnectionsPage
- `/admin/knowledge` -> AdminKnowledgePage
- `/admin/policies` -> AdminPoliciesPage
- `/admin/users` -> AdminUsersPage

当前重定向：

- `/admin/models` -> `/admin/connections?tab=models`
- `/admin/apis` -> `/admin/connections?tab=apis`
- `/admin/routing` -> `/admin/policies?tab=routing`
- `/admin/review-rules` -> `/admin/policies?tab=review`
- `/admin/analytics` -> `/admin`
- `/admin/agents` -> `/admin`

结论：

- 不建议再扩散一级导航。
- Admin Models / APIs 应作为 Connections 内 tabs。
- Admin Routing / Review Rules 应作为 Policies 内 tabs。
- Analytics / Agents 可作为 Overview 或 Connections 的区块，而非主入口。

## 管理端设计原则

### 1. 状态优先

管理端第一任务是判断系统能不能用。

必须清楚显示：

- ready
- partial
- missing key
- sync stale
- error
- disabled

### 2. 配置可回溯

每次保存、测试、同步、重置都要有反馈。

要求：

- 保存成功提示。
- 保存失败提示。
- 测试连接结果。
- 危险操作确认。
- 最近同步/更新时间。

### 3. 少展示，多控制

管理端不需要过多宣传式模块。

应优先：

- 状态卡
- 表格
- 分组表单
- Tabs
- 事件列表
- 配置说明

避免：

- 大面积 hero banner
- 装饰性图表
- 纯展示型 feature cards

## 迁移批次

### Batch 0 - Admin Shell

目标：

- 统一管理端导航、topbar、breadcrumb、用户区、移动端 drawer。
- 使用新 Button、IconButton、Status、Badge。
- 保持现有路由不变。

风险：

- AdminShell 与 AppShell 样式可能重叠。
- 移动端 sidebar 交互需要检查。

### Batch 1 - Admin Overview

目标：

- 一眼判断系统健康。
- 展示 Runtime、Models、APIs、Knowledge、Agents 状态。
- Recent Errors / Audit Events 清晰。
- 快捷入口指向 Connections、Knowledge、Policies、Users。

不做：

- 不堆复杂图表。
- 不把 Overview 做成营销页。

### Batch 2 - Admin Connections

目标：

- 聚合模型、API、工具链和智能体能力。
- 使用 tabs：Overview / Models / APIs / Tools / Agents。
- 每个 provider 有状态、用途、依赖、测试入口。

说明：

- 当前 `AdminStackOverview` 已经承担了较多模型/API/工具展示能力。
- 第一轮先统一外层和状态系统，不急着拆它内部所有卡片。

### Batch 3 - Admin Knowledge

目标：

- 变成法律知识资产控制台。
- Browse / Import / Config 三个区域清楚。
- 法规、案例、模板、合同包可区分。
- 搜索、列表、预览、同步、导入、校验可完成。

风险：

- `AdminKnowledgePage.tsx` 文件较大，逻辑复杂。
- 知识库导入、爬取、上传、配置都在一个页面中，适合先做结构分区，不适合一口气拆完。

### Batch 4 - Admin Policies

目标：

- 路由规则和审查规则以 tabs 管理。
- 规则编辑、保存、重置、删除风险清晰。
- 规则解释要面向管理员，而不是开发者。

说明：

- 当前 `/admin/routing` 和 `/admin/review-rules` 已重定向到 Policies tabs，方向正确。

### Batch 5 - Admin Users

目标：

- 用户、角色、会员等级、活跃状态清楚。
- 重置用户等危险操作有确认。
- 表格/列表模式统一。

## 页面迁移方案

### Admin Overview

当前文件：

```txt
src/pages/admin/AdminOverviewPage.tsx
```

目标结构：

```txt
Admin Shell
└─ Overview
   ├─ Health Summary
   ├─ Status Grid
   │  ├─ Runtime
   │  ├─ Models
   │  ├─ APIs
   │  ├─ Knowledge
   │  └─ Agents
   ├─ Recent Errors / Audit Events
   └─ Quick Links
```

组件：

- PageHeader
- Panel
- Status
- Button
- EventList
- RuntimeStatusPanel

验收：

- 第一屏可判断系统是否 ready。
- 配置缺失有明确下一步入口。
- 测试连接和刷新有反馈。

### Admin Connections

当前文件：

```txt
src/pages/admin/AdminConnectionsPage.tsx
src/components/admin/AdminStackOverview.tsx
```

目标结构：

```txt
Admin Shell
└─ Connections
   ├─ PageHeader
   ├─ Tabs
   │  ├─ Overview
   │  ├─ Models
   │  ├─ APIs
   │  ├─ Tools
   │  └─ Agents
   └─ Config / Status panels
```

组件：

- Tabs
- Panel
- Status
- Toolbar
- Table/List
- Button

验收：

- `?tab=models` 和 `?tab=apis` 可正常定位。
- 模型和 API ready/missing/partial 状态可读。
- 测试连接入口明确。

### Admin Knowledge

当前文件：

```txt
src/pages/admin/AdminKnowledgePage.tsx
src/components/admin/KnowledgeSimpleBrowser.tsx
src/components/admin/KnowledgeStatuteBrowser.tsx
```

目标结构：

```txt
Admin Shell
└─ Knowledge
   ├─ Knowledge Status Header
   ├─ Tabs: Browse / Import / Config
   └─ Knowledge Browser
      ├─ Library nav
      ├─ Search / filters
      ├─ Result list
      └─ Preview panel
```

组件：

- KnowledgeBrowser
- Tabs
- Toolbar
- Panel
- Status
- Upload
- EmptyState

验收：

- 能浏览法规、案例、模板、合同包。
- 搜索、列表、预览同屏完成。
- 导入和同步状态清楚。
- 空库时有明确下一步。

### Admin Policies

当前文件：

```txt
src/pages/admin/AdminPoliciesPage.tsx
```

目标结构：

```txt
Admin Shell
└─ Policies
   ├─ PageHeader
   ├─ Tabs: Routing / Review
   ├─ Rule editor
   └─ Rule preview / explanation
```

组件：

- Tabs
- Panel
- Textarea / TextField
- Button
- Status
- Dialog

验收：

- 路由规则和审查规则分区明确。
- 添加、删除、保存有反馈。
- 删除规则有确认或足够明显的危险提示。

### Admin Users

当前文件：

```txt
src/pages/admin/AdminUsersPage.tsx
```

目标结构：

```txt
Admin Shell
└─ Users
   ├─ PageHeader
   ├─ User stats
   ├─ Toolbar
   └─ User table
```

组件：

- Table
- Toolbar
- Status
- Badge
- Button
- Dialog

验收：

- 用户角色、会员等级、最近活动清楚。
- 刷新和重置有反馈。
- 重置用户有危险操作提示。

## 阶段验收

Phase 07 完成标准：

- Admin Shell 统一。
- Overview、Connections、Knowledge、Policies、Users 五个主入口完成迁移。
- 管理端不新增一级入口。
- 配置状态和异常状态可读。
- 保存、测试、同步、重置都有反馈。
- 危险操作有确认或明确提示。
- build 通过，lint 无新增 error。

