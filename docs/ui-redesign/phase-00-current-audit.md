# Phase 00 Current Audit - 2026-07-08

本文件记录 LexHub UI 改版第一轮现状审计结果。当前阶段只记录事实和风险，不做界面改造。

## 审计范围

前端项目：

```txt
Co-Sight-master/cosight_frontend
```

技术栈：

- React 19
- Vite 7
- TypeScript
- React Router
- lucide-react
- 自定义 CSS token 与样式文件

## 工作区状态

`git status --short` 显示前端已有大量已修改文件，覆盖：

- `src/components/admin`
- `src/components/workspace`
- `src/components/layout`
- `src/config`
- `src/lib`
- `src/pages`
- `src/pages/admin`
- `src/styles`

本轮新增文档位于：

```txt
docs/ui-redesign/
```

注意：后续进入实现阶段前，需要先确认这些前端修改是否都是当前有效版本。UI 重构期间不得随意回滚这些已有改动。

## 构建与 Lint 基线

### Build

命令：

```bash
npm run build
```

结果：通过。

输出摘要：

- CSS bundle：约 187.32 kB
- JS bundle：约 515.85 kB
- Vite 提示 JS chunk 超过 500 kB，建议后续考虑代码分割。

### Lint

命令：

```bash
npm run lint
```

结果：未通过。

问题：

- 1 个 error
- 8 个 warning

当前 error：

```txt
src/components/layout/AppShell.tsx
25:72  '_seg' is defined but never used
```

当前 warnings 类型：

- React Hook dependencies 缺失
- react-refresh/only-export-components

这些不是 UI 设计问题，但会影响后续施工质量。建议在 Phase 05 前端设计系统落地前清理。

## 中文编码判断

PowerShell `Get-Content` 输出中出现中文乱码，但使用 Node 以 UTF-8 读取后，中文内容正常。

示例验证：

```txt
我的工作|事项受理|办理进度|审查结论|案件归档|材料库|受理|事项受理智能体|证据|证据质检智能体|研究|法规研究智能体
```

结论：

- 当前观察到的乱码主要是终端显示编码问题。
- 暂未确认源码真实乱码。
- 后续仍需通过浏览器截图和 UTF-8 读取继续验证页面文案。

## 页面规模

用户端页面：

```txt
src/pages
18 files
约 3362 lines
```

主要页面：

- LandingPage
- LoginPage
- WorkspacePage
- WorkspaceRunPage
- WorkspaceResultPage
- MaterialsPage
- MembershipPage
- ReplayPage
- CasesPage
- EvidencePage
- ResearchPage
- ReviewPage
- ReportsPage
- ProfilesPage
- AgentsPage
- AnalyticsPage
- BoardPage
- DocumentsPage

管理端页面：

```txt
src/pages/admin
11 files
约 1667 lines
```

主要页面：

- AdminOverviewPage
- AdminConnectionsPage
- AdminKnowledgePage
- AdminPoliciesPage
- AdminUsersPage
- AdminApisPage
- AdminModelsPage
- AdminRoutingPage
- AdminReviewRulesPage
- AdminAnalyticsPage
- AdminAgentsPage

## 组件规模

```txt
src/components/workspace    23 files, 约 2398 lines
src/components/admin         6 files, 约 1413 lines
src/components/ui            6 files, 约 163 lines
```

观察：

- `workspace` 组件很多，说明核心业务已经组件化了一部分。
- `ui` 基础组件很少，说明通用设计系统组件还不够完整。
- 页面和业务组件承担了较多样式与交互职责，后续应逐步沉淀基础组件层。

## 样式规模

```txt
tokens.css       2,976 chars, 1 selector
base.css         1,191 chars, 20 selectors
components.css  12,991 chars, 80 selectors
workbench.css   17,879 chars, 137 selectors
polish.css      24,811 chars, 174 selectors
layouts.css    170,691 chars, 1,429 selectors
```

关键观察：

- `layouts.css` 体量过大，是当前 UI 可维护性的最大风险之一。
- `components.css` 已有 `btn`、`ds-badge`、`ds-card`、`ds-table` 等设计系统雏形。
- `polish.css` 像是后期视觉修补层，包含 App Shell、Workspace Intake、Landing 等覆盖样式。
- 后续应避免继续向 `layouts.css` 添加大段页面级样式。

## 当前路由结构

用户端主路由包括：

- `/`
- `/board`
- `/login`
- `/workspace`
- `/workspace/run`
- `/workspace/result`
- `/materials`
- `/membership`
- `/cases`
- `/agents`
- `/evidence`
- `/research`
- `/review`
- `/documents`
- `/reports`
- `/profiles`
- `/analytics`
- `/replay`

管理端主路由包括：

- `/admin`
- `/admin/connections`
- `/admin/knowledge`
- `/admin/policies`
- `/admin/users`

管理端兼容/重定向路由：

- `/admin/models`
- `/admin/apis`
- `/admin/routing`
- `/admin/review-rules`
- `/admin/analytics`
- `/admin/agents`

观察：

- 实际存在部分 admin 页面文件，但路由中会重定向到合并页，如 models/apis 到 connections，routing/review-rules 到 policies。
- 后续 Figma 和信息架构应以实际路由为准，同时决定是否保留这些独立页面文件。

## 第一批 UI 风险

### P0 - 样式体系过重

`layouts.css` 已达到 170KB，包含大量 landing、app、workspace、admin、knowledge、dag 等样式。继续叠加会让维护成本快速上升。

建议：

- Phase 05 建立新的组件样式层。
- 页面迁移时逐步削减 `layouts.css` 中重复或过期样式。

### P0 - Lint 未通过

当前 lint 有 1 个 error。进入正式 UI 施工前应修复，否则后续难以判断新增问题。

### P1 - 基础 UI 组件层薄

`src/components/ui` 只有少量组件。Button、Input、Tabs、Dialog、Table 等仍主要依赖 class 和页面结构。

建议：

- 先补齐基础 UI 组件。
- 再迁移 Workspace / Admin 页面。

### P1 - 页面数量多，需分批迁移

用户端和管理端页面数量较多，不适合一次性重做。

建议迁移顺序：

1. Login
2. Workspace Intake
3. Workspace Run
4. Workspace Result
5. Review
6. Admin Overview
7. Admin Knowledge

### P1 - 视觉修补层可能与基础样式冲突

`polish.css` 与 `layouts.css` 中均出现 App Shell、Landing、Workspace 相关选择器。后续需要检查重复定义和覆盖顺序。

### P2 - Bundle 体积提示

JS bundle 超过 500KB。短期不阻塞 UI 改版，但后续可考虑：

- 路由级 lazy loading
- admin 页面异步加载
- 图表/复杂面板拆分

## 下一步建议

Phase 00 继续补充两件事：

1. 启动本地前端，逐页截图，形成视觉问题清单。
2. 选定 Phase 04 首批 Figma 高保真页面，建议为：
   - Login
   - Workspace Intake
   - Workspace Run
   - Workspace Result
   - Review
   - Admin Overview
   - Admin Knowledge

