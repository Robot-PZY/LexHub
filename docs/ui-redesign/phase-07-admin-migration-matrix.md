# Phase 07 - 管理端迁移矩阵

| 页面 / 模块 | 批次 | 当前主要依赖 | 目标组件 / Pattern | 风险 | 验收重点 |
| --- | --- | --- | --- | --- | --- |
| Admin Shell | Batch 0 | `admin-shell`、`admin-sidebar-*`、`admin-topbar` | AdminShell、Button、IconButton、Status、Badge | 与 AppShell 样式重叠、移动端 sidebar | 导航、breadcrumb、logout、移动端 drawer |
| Admin Overview | Batch 1 | `feature-stat-grid`、`admin-panel`、`ds-card`、StatCard | RuntimeStatusPanel、Panel、Status、EventList、QuickLinks | 测试连接和 reset demo 逻辑 | 第一屏健康状态、异常入口、反馈 |
| Admin Connections | Batch 2 | AdminStackOverview、`admin-stack-*`、`ds-card` | Tabs、Panel、Status、Toolbar、Table/List | 模型/API/工具数据结构复杂 | tab 定位、ready/missing 状态、测试入口 |
| Admin Knowledge | Batch 3 | `kb-*`、KnowledgeSimpleBrowser、KnowledgeStatuteBrowser、`ds-card` | KnowledgeBrowser、Tabs、Toolbar、Panel、Status、Upload | 页面大、导入/同步/上传/爬取逻辑多 | Browse/Import/Config 清楚，搜索预览可用 |
| Admin Policies | Batch 4 | `admin-tab-bar`、`admin-rule-*`、`ds-card` | Tabs、Panel、TextField/Textarea、Button、Dialog | 删除/保存规则风险 | Routing/Review tabs、保存反馈、危险操作 |
| Admin Users | Batch 5 | `admin-users-table-*`、`feature-stat-grid`、`ds-card` | Table、Toolbar、Badge、Status、Dialog | 重置用户是危险操作 | 用户表、刷新、重置确认、会员等级 |
| Admin Models old page | Legacy | AdminModelsPage 独立页 | Connections tabs | 与重定向策略重复 | 保持兼容，不作为主入口 |
| Admin APIs old page | Legacy | AdminApisPage 独立页 | Connections tabs | 与重定向策略重复 | 保持兼容，不作为主入口 |
| Admin Routing old page | Legacy | AdminRoutingPage 独立页 | Policies tabs | 与重定向策略重复 | 保持兼容，不作为主入口 |
| Admin ReviewRules old page | Legacy | AdminReviewRulesPage 独立页 | Policies tabs | 与重定向策略重复 | 保持兼容，不作为主入口 |
| Admin Analytics / Agents | Legacy | 重定向到 overview | Overview / Connections 区块 | 入口定位不清 | 不新增一级入口 |

## 管理端组件替换建议

| 旧模式 | 新模式 |
| --- | --- |
| `ds-card admin-panel` | `Panel` |
| `feature-stat-grid` | `StatusGrid` 或 `Panel` + stat item |
| `admin-tab-bar` / `admin-tab-btn` | `Tabs` |
| `admin-save-hint` | `StatusBanner` 或 `Toast` |
| `ds-badge ds-badge-*` | `Badge` / `Status` |
| `btn btn-primary` | `Button variant="primary"` |
| `btn btn-secondary` | `Button variant="secondary"` |
| `btn btn-ghost` | `Button variant="ghost"` |
| `admin-users-table-*` | `Table` |
| ad hoc upload block | `Upload` |

## Admin 状态模型

建议统一：

```txt
ready       可用
partial     部分可用
missing     缺少配置
syncing     同步中
stale       需要更新
error       错误
disabled    已停用
```

映射到组件：

```txt
Status status="success"   -> ready
Status status="warning"   -> partial / stale
Status status="danger"    -> missing / error
Status status="running"   -> syncing
Status status="archived"  -> disabled
```

## 每页迁移记录模板

```txt
页面：
迁移日期：
替换组件：
仍依赖 legacy class：
可删除候选 class：
危险操作：
测试：
截图：
后续问题：
```

