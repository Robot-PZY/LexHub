# Phase 02 - 导航与页面地图

本文件把当前路由事实和推荐导航结构分开记录。后续施工时，先承认当前系统长什么样，再决定怎么优化。

## 当前路由事实

### 公共路由

| 路由 | 页面 | 备注 |
| --- | --- | --- |
| `/` | LandingPage | 产品入口 |
| `/login` | LoginPage | 登录 |
| `/board` | BoardPage | 当前功能较轻，需要判断是否保留 |

### 用户端路由

| 路由 | 页面 | 推荐归类 |
| --- | --- | --- |
| `/workspace` | WorkspacePage | 工作台 / 事项受理 |
| `/workspace/run` | WorkspaceRunPage | 工作台 / 办理进度 |
| `/workspace/result` | WorkspaceResultPage | 工作台 / 审查结论 |
| `/materials` | MaterialsPage | 业务资产 / 材料库 |
| `/membership` | MembershipPage | 账户 / 会员 |
| `/cases` | CasesPage | 业务资产 / 事项 |
| `/agents` | AgentsPage | 业务能力 / 智能体 |
| `/evidence` | EvidencePage | 业务能力 / 证据整理 |
| `/research` | ResearchPage | 业务能力 / 法规研究 |
| `/review` | ReviewPage | 工作台 / 审查 |
| `/documents` | DocumentsPage | 业务资产 / 文书 |
| `/reports` | ReportsPage | 业务资产 / 报告 |
| `/profiles` | ProfilesPage | 账户 / 档案 |
| `/analytics` | AnalyticsPage | 业务能力 / 分析 |
| `/replay` | ReplayPage | 业务资产 / 归档回放 |

### 管理端路由

| 路由 | 页面 | 推荐归类 |
| --- | --- | --- |
| `/admin` | AdminOverviewPage | 总览 |
| `/admin/connections` | AdminConnectionsPage | 能力配置 |
| `/admin/knowledge` | AdminKnowledgePage | 知识资产 |
| `/admin/policies` | AdminPoliciesPage | 策略 |
| `/admin/users` | AdminUsersPage | 运营 |

### 管理端重定向路由

| 路由 | 当前行为 | 建议 |
| --- | --- | --- |
| `/admin/models` | 重定向到 `/admin/connections?tab=models` | 保持为 Connections 内 tab |
| `/admin/apis` | 重定向到 `/admin/connections?tab=apis` | 保持为 Connections 内 tab |
| `/admin/routing` | 重定向到 `/admin/policies?tab=routing` | 保持为 Policies 内 tab |
| `/admin/review-rules` | 重定向到 `/admin/policies?tab=review` | 保持为 Policies 内 tab |
| `/admin/analytics` | 重定向到 `/admin` | 后续可作为 Overview 内区块 |
| `/admin/agents` | 重定向到 `/admin` | 后续可作为 Overview 或 Connections 内区块 |

## 推荐用户端主导航

第一版主导航只保留最重要闭环：

```txt
我的工作
- 事项受理
- 办理进度
- 审查结论
- 材料库
- 案件归档
```

原因：

- 这条路径覆盖用户从发起到归档的闭环。
- 降低导航复杂度。
- 其他页面可通过页面内入口、二级菜单或更多菜单进入。

## 推荐用户端二级入口

```txt
业务能力
- 证据整理
- 法规研究
- 智能体协作
- 数据分析

业务资产
- 事项
- 报告
- 文书

账户
- 会员中心
- 用户档案
```

## 推荐管理端主导航

```txt
总览
- 系统概览

配置中心
- 能力总览
- 知识库
- 策略规则

运营
- 用户管理
```

当前管理端导航已经基本符合这个方向。后续重点不是增加入口，而是让每个入口内部信息更清楚。

## 导航设计要求

- Sidebar 文案必须是业务名词，不使用技术内部名词。
- 当前页面状态要明显。
- 主操作不要藏在侧边栏里。
- 面包屑只做定位辅助，不承担主导航。
- 移动端侧边栏需要遮罩、关闭按钮和清晰命中区域。
- 管理端和用户端不要混用导航结构。

## 待确认问题

- `/board` 是否仍有产品意义，还是应隐藏或合并。
- `/cases` 与 `/workspace` 的关系：事项列表还是案例展示。
- `/documents` 与 `/reports` 是否合并为“输出物”。
- `/analytics` 面向普通用户还是管理者。
- `/agents` 是用户可理解的业务能力，还是管理端配置概念。

