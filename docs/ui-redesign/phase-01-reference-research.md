# Phase 01 - 参考体系与竞品研究

本阶段目标是把 GitHub、Figma 和成熟开源 UI 体系中的可借鉴部分转化为 LexHub 的设计决策。这里不是做素材收藏，而是为后续 Figma 高保真和前端组件落地提供依据。

## 研究结论

LexHub 不适合直接套用单一 UI 框架。更稳妥的方向是：

> GitHub Primer 的专业工具感 + Figma SDS 的设计工程流程 + Radix/shadcn 的可控组件思想 + Ant Design 的后台信息架构 + LexHub 自己的法律业务模式。

原因：

- LexHub 是法律业务智能工作台，核心是高密度业务处理、证据链、审查结论和后台配置，不是普通营销型 SaaS。
- 当前前端已有自定义 CSS token 和大量页面样式，直接引入大型 UI 框架会造成视觉割裂和迁移成本。
- 后续应先用 Figma 与 CSS token 建立一致标准，再逐步提炼组件，而不是一次性重写所有页面。

## 官方参考源

### GitHub Primer

链接：

- https://primer.style/
- https://primer.style/product/
- https://github.com/primer/figma
- https://github.com/primer/react

适合借鉴：

- 专业工具型产品气质
- 高密度导航、列表、表格、状态和工具栏
- App Shell / Admin Shell 的布局克制感
- 可访问性和组件状态设计
- Figma library 与代码组件协作方式

用于 LexHub：

- 用户端 App Shell
- 管理端 Admin Shell
- 状态标签
- 表格和列表
- 工具栏
- 空状态
- 审计链和执行日志

不建议照搬：

- GitHub 品牌色和 Octicon 视觉
- 代码托管产品的过强开发者语境

### Figma Simple Design System / Code Connect

链接：

- https://github.com/figma/sds
- https://www.figma.com/community/file/1380235722331273046/simple-design-system
- https://www.figma.com/code-connect-docs/

适合借鉴：

- Figma Variables
- 组件 variants
- 设计 token 命名
- Figma 组件与 React 组件的映射方式
- Code Connect 的设计-代码同步思路

用于 LexHub：

- `tokens.css` 与 Figma Variables 对齐
- Figma variants 与 React props 对齐
- 为 `Button`、`Badge`、`Tabs`、`Dialog`、`Table` 等建立组件规范
- 记录设计变更，避免 Figma 与代码脱节

不建议照搬：

- SDS 默认视觉风格
- 与 LexHub 业务无关的组件命名

### Radix UI / Radix Themes

链接：

- https://www.radix-ui.com/primitives
- https://www.radix-ui.com/themes
- https://github.com/radix-ui/themes

适合借鉴：

- 可访问交互 primitives
- Dialog、Tabs、Select、Dropdown、Tooltip、Popover 等复杂交互
- 组件逻辑和视觉样式分离
- 键盘交互和 ARIA 语义

用于 LexHub：

- 管理后台配置弹窗
- 详情 Drawer / Dialog
- Tabs
- Tooltip
- Dropdown menu
- Select

不建议照搬：

- 整套 Radix Themes 视觉
- 为简单展示组件引入额外复杂度

### shadcn/ui

链接：

- https://ui.shadcn.com/
- https://github.com/shadcn-ui/ui

适合借鉴：

- 组件源码归项目所有
- 基于 primitives 组合业务组件
- 组件 API 简洁
- 文档与示例清晰

用于 LexHub：

- 组件封装方式
- variants 设计
- 文档组织方式
- `LexButton`、`LexDialog`、`LexTabs` 等自有组件思路

不建议照搬：

- Tailwind 依赖模式。当前项目不是 Tailwind 栈，强行迁移会扩大范围。
- shadcn 默认视觉。LexHub 应保持自己的法律工作台气质。

### Ant Design

链接：

- https://ant.design/
- https://github.com/ant-design/ant-design

适合借鉴：

- 企业级后台信息架构
- 表格、筛选、表单、配置页、权限管理
- 空状态、加载态、错误态规范
- Dashboard 与管理控制台组织方式

用于 LexHub：

- Admin Overview
- Admin Knowledge
- Admin Models / Connections
- Admin Users
- Admin Policies / Routing

不建议照搬：

- 默认 antd 视觉和组件样式
- 大而全的组件框架依赖
- 过度表单化的页面

### Flowbite Admin

链接：

- https://github.com/themesberg/flowbite-admin-dashboard
- https://flowbite.com/

适合借鉴：

- Dashboard 模板结构
- 统计卡、图表、表格、筛选区组合
- 后台页面响应式布局

用于 LexHub：

- Admin Overview 布局参考
- 管理端状态卡片密度参考
- CRUD 页面结构参考

不建议照搬：

- 视觉样式和 Tailwind 体系
- 过强模板感

### Mantis React Admin

链接：

- https://github.com/codedthemes/mantis-free-react-admin-template
- https://mantisdashboard.io/

适合借鉴：

- React 后台模板组织
- 侧边栏、顶部栏、配置页、统计页
- 管理端页面分组方式

用于 LexHub：

- Admin Shell 信息架构
- 管理端页面模板

不建议照搬：

- 商业模板观感
- 通用 dashboard 图表堆叠方式

### Mantine

链接：

- https://mantine.dev/
- https://github.com/mantinedev/mantine

适合借鉴：

- React 组件 API 设计
- 表单、组合输入、弹层、通知等组件完备度
- 文档清晰度

用于 LexHub：

- 研究组件 API 命名
- 表单复杂度处理
- 设计组件文档

不建议照搬：

- 直接替换当前自定义 CSS 体系
- 让 Mantine 默认视觉主导 LexHub

### Untitled UI

链接：

- https://www.untitledui.com/

适合借鉴：

- Figma Application UI 组件组织
- 表单、Modal、Table、Empty、Settings 页面模板
- 产品级设计系统文件结构

用于 LexHub：

- Figma 组件页面组织
- 高保真关键页面的布局参考

不建议照搬：

- 营销 SaaS 感
- 大圆角、轻量品牌感过强的默认样式

## LexHub 采用策略

### 采用

- Primer 的克制、高密度、专业工具感。
- Figma SDS 的 token、variables、variants、Code Connect 思路。
- Radix 的可访问交互 primitives。
- shadcn 的源码可控和组件 variants 组织方法。
- Ant Design 的后台信息架构和表格/配置页模式。
- Flowbite/Mantis 的后台模板结构参考。
- Untitled UI 的 Figma 文件组织方式。

### 不采用

- 不直接套 Ant Design、Mantine 或 Flowbite。
- 不引入 Tailwind 作为 UI 改版前置条件。
- 不把 LexHub 做成普通 AI Chat。
- 不使用大面积蓝紫渐变、发光卡片、营销首页式后台。
- 不让模板默认视觉覆盖 LexHub 的法律业务气质。

## 参考到页面的映射

| LexHub 页面 | 主要参考 | 设计方向 |
| --- | --- | --- |
| Login | Primer + Untitled UI | 简洁可信，表单状态完整 |
| Landing | Primer Product + Untitled UI | 产品真实界面优先，减少营销空话 |
| Workspace Intake | Primer + Ant Design Form | 事项受理台，流程、材料、事实结构化 |
| Workspace Run | GitHub Actions + Primer | 执行链、日志、状态、工具调用透明 |
| Workspace Result | Primer + 法律文书模式 | 结论摘要、依据、证据、风险、导出 |
| Review | Primer + Ant Design Table | 待审列表、审查报告、证据侧栏 |
| Materials / Evidence | Primer + Ant Design Table | 材料库、证据详情、筛选和预览 |
| Admin Overview | Ant Design + Mantis | 系统健康、模型、知识库、API 状态 |
| Admin Knowledge | Ant Design + Primer | 搜索、列表、详情、导入、校验 |
| Admin Models / Connections | Ant Design + Mantine API 思路 | 配置表单、测试连接、保存反馈 |

## Figma Reference Board 建议

Figma 中建立 `References` 页面，分为：

- `Primer - Tooling`
- `Figma SDS - Tokens`
- `Radix / shadcn - Components`
- `Ant Design - Admin Patterns`
- `Flowbite / Mantis - Dashboard`
- `Legal Patterns`
- `Do Not Copy`

每个参考截图旁边必须标注：

- 借鉴点
- 用于哪个 LexHub 页面
- 不采用的部分

## 阶段产物

- 参考体系清单
- 参考链接
- 设计参考矩阵
- 页面映射表
- Figma Reference Board 结构
- 不采用清单

## 验收标准

- 至少完成 8 个设计体系或开源项目的拆解。
- 每个参考都明确“借什么”和“不借什么”。
- 每个核心页面都能对应到参考体系。
- 研究结论能指导 Phase 03 Figma Design System 和 Phase 04 Key Screens。

