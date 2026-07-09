# Phase 03 - Figma 设计系统

本阶段目标是建立 LexHub 的 Figma Design System 规格，让设计稿、CSS token 和 React 组件能对齐。当前仍是方案阶段，不改前端实现。

## 阶段目标

- 定义 Figma 文件结构。
- 定义 foundations：颜色、字体、字号、间距、圆角、阴影、动效、断点。
- 建立 Figma Variables 与 `tokens.css` 的映射方式。
- 定义基础组件 variants。
- 定义法律业务 patterns。
- 为 Phase 04 Key Screens 提供可复用组件。

## 设计系统原则

### 1. Token 先行

所有颜色、字号、间距、圆角、阴影都应先进入 Figma Variables，再映射到 CSS variables。

### 2. 组件可施工

Figma 组件 variants 必须能映射到 React props。不要设计无法落地的视觉状态。

### 3. 业务模式高于装饰

LexHub 的差异化不是渐变和大卡片，而是：

- 事项受理
- 材料证据
- 法条引用
- 智能体执行链
- 审查风险
- 文书导出
- 审计回放

### 4. 保留现有基础，逐步收敛

当前前端已有 `tokens.css` 和 `btn`、`ds-badge`、`ds-card`、`ds-table` 等基础样式。Phase 03 不要求推翻，而是给出标准，后续 Phase 05 逐步迁移。

## Figma 文件

文件名：

```txt
LexHub Design System
```

页面结构：

```txt
00 Cover / Principles
01 References
02 Foundations
03 Tokens
04 Components
05 Patterns
06 App Shells
07 Key Screens
08 Prototype
99 Archive
```

## Foundations

### Color

LexHub 使用“法律蓝 + 克制金 + 中性业务底色”的体系。

颜色分组：

- Brand
- Semantic
- Surface
- Text
- Border
- Data
- Overlay

建议方向：

- Primary 使用深法律蓝。
- Accent 使用金色，但只用于关键强调，不铺大面积背景。
- App 背景建议比当前暖纸色更中性，避免后台显得厚重。
- 成功、警告、危险、信息色要为审查状态服务。

### Typography

字体分组：

- Display：Landing 或品牌标题。
- Heading：页面标题、面板标题。
- Body：正文、报告内容。
- Label：表单、标签、表头。
- Mono：编号、哈希、工具调用、审计日志。

建议字号：

```txt
12 / 13 / 14 / 15 / 16 / 18 / 20 / 24 / 30 / 36 / 44
```

使用原则：

- 工作台和后台正文以 14-15px 为主。
- 页面标题以 24-30px 为主。
- 只有 Landing hero 可以使用 36px 以上。
- 不使用 viewport width 动态缩放字号。

### Spacing

使用 4px 基础栅格：

```txt
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
```

使用原则：

- 控件内部：8 / 12 / 16。
- 面板内部：16 / 20 / 24。
- 页面区块：24 / 32 / 40。
- Landing 大区块：48 / 64。

### Radius

法律工作台不宜过圆。

建议：

```txt
4  - tiny controls
6  - button / input
8  - card / panel
12 - dialog / large panel
999 - pill only
```

当前 `tokens.css` 中 `18px`、`24px` 可保留为 legacy，但新组件应优先使用 6/8/12。

### Shadow

阴影应克制，避免漂浮卡片感。

建议：

- xs：输入框、轻微浮层
- sm：卡片
- md：dialog / drawer
- focus：可访问 focus ring

### Motion

动效用于反馈，不用于炫技。

建议：

- fast：140ms
- normal：220ms
- slow：320ms
- easing：ease-out

### Breakpoint

建议断点：

```txt
390  mobile
768  tablet
1024 small desktop
1280 desktop
1440 wide desktop
```

## Components

第一批 P0 基础组件：

- Button
- IconButton
- Input
- Textarea
- Badge
- Status
- Panel
- PageHeader
- EmptyState
- LoadingState

第二批 P1 基础组件：

- Select
- Checkbox
- Switch
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

业务组件：

- MatterIntake
- ScenarioSelector
- EvidenceList
- AgentPipeline
- ToolCallLog
- CitationBlock
- ReviewScore
- RiskPanel
- AuditTrail
- DocumentExportPanel
- KnowledgeBrowser
- RuntimeStatusPanel

## 组件命名规则

```txt
Figma Component: Button
React Component: LexButton
CSS Class: lex-button
Token Prefix: button.*
```

React props 与 Figma variants 对齐，例如：

```txt
variant: primary | secondary | ghost | danger
size: sm | md | lg
state: default | hover | active | disabled | loading
icon: none | leading | trailing | icon-only
```

## Patterns

Figma 中必须建立法律业务 patterns，而不只是通用组件。

P0 Patterns：

- Matter Intake：事项受理流程。
- Agent Run：智能体执行链。
- Review Result：审查结论。
- Evidence List：材料和证据列表。
- Citation Block：法条引用。
- Risk Panel：风险提示。

P1 Patterns：

- Document Export：文书导出。
- Knowledge Import：知识库导入。
- Audit Trail：审计回放。
- Config Console：后台配置控制台。

## Figma 到前端工作流

1. 在 Figma `03 Tokens` 定义变量。
2. 在 `04 Components` 定义基础组件 variants。
3. 在 `05 Patterns` 组合业务模式。
4. 在 `07 Key Screens` 用组件搭建页面。
5. Phase 05 前端落地时，将 token 映射到 `tokens.css`。
6. React 组件 props 与 Figma variants 对齐。
7. 页面迁移时优先替换 P0 组件。

## 阶段产物

- Figma 文件结构
- Token 映射表
- 组件 variants 规格
- 业务 patterns 规格
- App Shell 规格
- Phase 04 Key Screens 搭建基础

## 验收标准

- Figma token 能映射到 `tokens.css`。
- P0 基础组件 variants 清楚。
- P0 业务 patterns 清楚。
- Key Screens 可以基于组件搭建，不依赖一次性画图。
- 后续前端可以按 Phase 05 落地，不需要重新解释设计意图。

