# Phase 01 - Figma Reference Board 施工清单

本文件用于指导在 Figma 中建立参考板。每个参考不是单纯截图，而是要标注“借鉴点、适用页面、不采用部分”。

## Figma 页面名称

建议在 `LexHub Design System` 中新建：

```txt
References
```

## Reference Board 分区

### 1. Primer - Tooling

收集：

- App Shell
- Sidebar
- Topbar
- Table
- Status
- Empty State
- Form
- Timeline / Activity

标注：

- 借鉴高密度工具界面。
- 用于 Workspace、Review、Admin Shell。
- 不照搬 GitHub 品牌色和代码托管语境。

### 2. Figma SDS - Tokens

收集：

- Variables
- Component variants
- Token 命名
- Code Connect 示例

标注：

- 借鉴设计和代码对齐方式。
- 用于 `tokens.css`、React props、Figma variants。
- 不照搬 SDS 默认视觉。

### 3. Radix / shadcn - Components

收集：

- Dialog
- Tabs
- Select
- Dropdown
- Tooltip
- Command / Menu
- Button variants

标注：

- 借鉴交互结构和组件 API。
- 用于 LexHub 自有组件。
- 当前不采用 Tailwind 迁移。

### 4. Ant Design - Admin Patterns

收集：

- Dashboard
- Data Table
- Filter Bar
- Settings Form
- User Management
- Knowledge Base / Resource Management

标注：

- 借鉴后台信息架构和配置页模式。
- 用于 Admin Overview、Knowledge、Models、Users。
- 不照搬默认 antd 视觉。

### 5. Flowbite / Mantis - Dashboard Layouts

收集：

- Stats cards
- Admin sidebar
- Chart panels
- CRUD layout
- Responsive admin pages

标注：

- 借鉴后台版式密度。
- 用于 Admin Overview 和配置页。
- 避免模板化观感。

### 6. Legal Patterns

收集或自绘：

- 法律报告结构
- 法条引用块
- 证据目录
- 审查意见
- 风险等级
- 审计链
- 文书导出

标注：

- 这是 LexHub 自己的差异化核心。
- 用于 Workspace Result、Review、Reports、Evidence。
- 不让法律内容退化成普通 Markdown。

### 7. Do Not Copy

放入反例：

- 大面积蓝紫渐变
- 发光玻璃卡片
- ChatGPT 套壳式界面
- 营销 SaaS 后台
- 卡片套卡片
- 低密度装饰性 Dashboard

标注：

- 这些方向会削弱法律产品可信度。
- 后续评审时用来统一判断标准。

## 每张参考图的标注模板

```txt
来源：
借鉴点：
适用页面：
适用组件：
不采用：
优先级：P0 / P1 / P2
```

## 推荐优先截图

P0：

- Primer sidebar / page layout
- Primer table / status / empty state
- Figma SDS tokens / variants
- Ant Design settings form / table
- Radix dialog / tabs / select

P1：

- Flowbite dashboard
- Mantis admin shell
- Untitled UI settings / modal / table
- Mantine form components

P2：

- 视觉 moodboard
- 法律文书参考
- 竞品产品页

## 验收标准

- Figma `References` 页面至少包含 7 个分区。
- 每个分区至少 3 张参考图或组件截图。
- 每张参考都有标注，不允许无说明堆图。
- 每个 LexHub 核心页面都能找到对应参考依据。

