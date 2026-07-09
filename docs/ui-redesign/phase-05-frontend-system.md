# Phase 05 - 前端设计系统落地

本阶段目标是把 Phase 03/04 的 Figma 设计系统规格转化为前端可执行的 token、基础组件和迁移策略。Phase 05 是进入代码施工前的技术方案，也可以作为后续实现清单。

## 阶段目标

- 建立与 Figma 对齐的 CSS token。
- 补齐 P0 基础 UI 组件。
- 明确旧样式收敛策略。
- 修复进入 UI 重构前必须清理的工程基线问题。
- 选择一个低风险页面做试点，再扩展到核心页面。

## 当前前端基线

前端位置：

```txt
Co-Sight-master/cosight_frontend
```

现有 UI 基础：

- `src/styles/tokens.css`
- `src/styles/base.css`
- `src/styles/components.css`
- `src/styles/layouts.css`
- `src/styles/workbench.css`
- `src/styles/polish.css`
- `src/components/ui`

当前风险：

- `layouts.css` 约 170KB，是最大样式维护风险。
- `src/components/ui` 仅有少量组件：AgentPipeline、DataSourceBadge、EmptyState、LoadingState、PageHeader、StatCard。
- `npm run build` 通过。
- `npm run lint` 当前有 1 个 error 和 8 个 warning。
- 终端显示中文可能乱码，但 UTF-8 读取源码中文正常，不能误判为源码乱码。

## 落地原则

### 1. 不一次性替换 UI 框架

不直接引入 Ant Design、Mantine、Flowbite 或 Tailwind。当前项目已有自定义 CSS 基础，强行替换会扩大风险。

### 2. 保留 legacy aliases

`tokens.css` 中已有 `--bg`、`--surface`、`--text` 等 legacy aliases。Phase 05 修改 token 时要保留，避免旧页面崩掉。

### 3. 新组件只用新 token

旧页面可以继续使用旧 class。新建基础组件时，必须使用 Phase 03 规范中的 token。

### 4. 先试点，后扩散

建议先选一个页面试点：

- Login：相对独立，适合验证 Auth Shell、Button、Input、Badge、Status。
- 或 Admin Overview：能验证 Panel、Status、PageHeader、Table/EventList。

不建议一开始改 Workspace Run，因为组件和状态复杂。

## Phase 05 施工顺序

### Step 0 - 工程基线清理

必须先做：

- 修复 lint error：`AppShell.tsx` 中 `_seg` 未使用。
- 记录但暂不强行修复 hooks warnings。
- 确认 `npm run build` 仍通过。
- 确认终端乱码只是显示问题，不做无意义批量转码。

验收：

- `npm run lint` 至少无 error。
- `npm run build` 通过。

### Step 1 - Token 扩展

基于 `tokens.css` 增加：

- font-size tokens
- font-weight tokens
- spacing tokens
- radius-xs / radius-panel
- shadow-focus
- duration-slow

保留：

- 现有颜色变量
- legacy aliases
- 现有布局尺寸

暂不做：

- 大规模换色
- 全站背景色替换
- 删除旧 token

### Step 2 - 基础组件目录

建议结构：

```txt
src/components/ui/
  Button.tsx
  IconButton.tsx
  TextField.tsx
  Textarea.tsx
  Badge.tsx
  Status.tsx
  Panel.tsx
  PageHeader.tsx
  EmptyState.tsx
  LoadingState.tsx
  index.ts
```

样式建议：

```txt
src/styles/ui.css
```

或继续放入 `components.css`，但建议新建 `ui.css`，避免 `components.css` 继续膨胀。

### Step 3 - P0 基础组件

第一批：

- Button
- IconButton
- TextField
- Textarea
- Badge
- Status
- Panel
- PageHeader
- EmptyState
- LoadingState

实现要求：

- Props 与 Phase 03 variants 对齐。
- 支持 disabled、loading、error、focus 等状态。
- Icon 使用 `lucide-react`。
- IconButton 必须支持 `aria-label`。
- 组件导出统一从 `src/components/ui/index.ts`。

### Step 4 - 试点页面

推荐试点 1：Login

验证：

- Auth layout
- Button
- TextField
- Status/Error
- Brand block

推荐试点 2：Admin Overview

验证：

- PageHeader
- Panel
- Status
- Toolbar
- Event list

试点目标：

- 证明新组件能承载真实页面。
- 观察旧 CSS 和新 CSS 的冲突。
- 建立迁移模式。

### Step 5 - P1 交互组件

第二批：

- Tabs
- Table
- Toolbar
- Dialog
- Drawer
- Toast
- Tooltip
- Stepper
- Timeline
- Upload

Radix 引入策略：

- 只在 Dialog、Tabs、Select、Tooltip、Dropdown 这类交互复杂组件中考虑。
- 引入前先确认是否已有足够需求。
- 不引入 Radix Themes 视觉。

### Step 6 - 业务 Patterns

基于基础组件实现：

- MatterIntake
- AgentPipeline
- ToolCallLog
- CitationBlock
- ReviewScore
- RiskPanel
- KnowledgeBrowser

这些不应先做成抽象组件，而应先服务 P0 页面，稳定后再提炼。

## 旧样式收敛策略

当前样式文件职责建议：

```txt
tokens.css      保留并扩展 token
base.css        全局基础样式
ui.css          新设计系统组件样式
components.css  legacy 组件样式，逐步减少新增
layouts.css     legacy 页面布局样式，禁止继续膨胀
workbench.css   workspace legacy 样式，迁移后逐步清理
polish.css      后期修补样式，后续尽量消解
```

新规则：

- 新基础组件样式进入 `ui.css`。
- 新页面样式按页面模块少量新增，避免继续塞入 `layouts.css`。
- 迁移一个页面时，记录被替代的旧 class。
- 不做全局批量删除，避免误伤。

## 验收标准

- Lint 至少无 error。
- Build 通过。
- `tokens.css` 增加 Phase 03 目标 token，legacy aliases 保留。
- P0 基础组件完成。
- 至少一个试点页面使用新组件。
- 新组件不依赖一次性页面 class。
- 没有新增乱码文案。
- 没有新增大型 UI 框架。

