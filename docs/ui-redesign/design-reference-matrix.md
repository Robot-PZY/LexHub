# 设计参考矩阵

| 参考体系 | 官方链接 | 借鉴点 | 用于 LexHub | 不采用 / 注意事项 |
| --- | --- | --- | --- | --- |
| GitHub Primer | https://primer.style/ / https://github.com/primer/react / https://github.com/primer/figma | 专业工具感、导航、状态、表格、可访问性、Figma 与代码协作 | App Shell、Admin Shell、Status、Table、Toolbar、Empty、Audit Trail | 不照搬 GitHub 品牌色、Octicon 语境和代码托管产品心智 |
| Figma SDS | https://github.com/figma/sds / https://www.figma.com/code-connect-docs/ | Variables、Components、Code Connect、设计 token、variants | Figma token、React props、CSS variables、组件规范 | 不照搬默认视觉，只学习设计工程流程 |
| Radix UI | https://www.radix-ui.com/primitives / https://github.com/radix-ui/themes | 可访问交互 primitives、Dialog、Tabs、Select、Tooltip、Dropdown | Dialog、Tabs、Select、Tooltip、Dropdown、Popover | 不整套套 Radix Themes 视觉；简单组件不强行引入 |
| shadcn/ui | https://ui.shadcn.com/ / https://github.com/shadcn-ui/ui | 组件源码可控、variants、组合式组件、文档方式 | LexButton、LexDialog、LexTabs、LexTable 的封装思路 | 当前项目不是 Tailwind 栈，不建议整套搬 |
| Ant Design | https://ant.design/ / https://github.com/ant-design/ant-design | 企业后台、表格、配置表单、筛选、权限、状态反馈 | Admin Knowledge、Admin Models、Admin Users、Admin Policies | 避免默认 antd 视觉吞掉 LexHub 品牌 |
| Flowbite Admin | https://github.com/themesberg/flowbite-admin-dashboard / https://flowbite.com/ | Dashboard 页面结构、统计卡、表格、筛选、响应式 | Admin Overview、CRUD 布局参考 | 不使用 Tailwind 模板样式，不保留模板感 |
| Mantis React Admin | https://github.com/codedthemes/mantis-free-react-admin-template / https://mantisdashboard.io/ | React 后台模板、侧边栏、顶部栏、配置页 | Admin Shell、Admin Overview、配置页结构 | 避免商业模板观感和图表堆叠 |
| Mantine | https://mantine.dev/ / https://github.com/mantinedev/mantine | React 组件 API、表单、弹层、通知、文档完备度 | 组件 API 命名、复杂表单模式、组件文档 | 不直接替换现有 CSS 体系 |
| Untitled UI | https://www.untitledui.com/ | Figma Application UI、组件组织、Settings / Table / Modal 模板 | Figma 文件结构、Key Screens 布局参考 | 降低营销 SaaS 感，避免过圆和过轻 |

## 页面映射

| LexHub 页面 | 首要参考 | 次要参考 | 目标风格 |
| --- | --- | --- | --- |
| Login | Primer | Untitled UI | 可信、简洁、表单状态完整 |
| Landing | Primer Product | Untitled UI | 产品真实界面优先，弱化空泛营销 |
| Workspace Intake | Primer | Ant Design Form | 法律事项受理台，结构化输入 |
| Workspace Run | GitHub Actions / Primer | Radix patterns | 智能体执行链透明，日志和状态清楚 |
| Workspace Result | Primer | 法律文书模式 | 结论可信、依据清楚、导出明确 |
| Review | Primer | Ant Design Table | 审查工作台，列表、报告、证据并列 |
| Materials / Evidence | Primer | Ant Design Table | 材料管理、筛选、详情预览 |
| Admin Overview | Ant Design | Mantis / Flowbite | 系统健康状态一眼可读 |
| Admin Knowledge | Ant Design | Primer | 知识资产管理，搜索、导入、预览 |
| Admin Models / Connections | Ant Design | Mantine | 配置清楚，测试和保存反馈明确 |

## 最终融合方向

LexHub 的 UI 改版不直接套模板，而是融合：

- Primer 的专业工具感
- Ant Design 的后台信息架构
- Radix/shadcn 的组件可控思想
- Figma SDS 的设计工程流程
- LexHub 自己的法律文书、证据链和智能体执行链模式

## 设计禁区

- 不做泛 AI Chat 套壳。
- 不做营销页式后台。
- 不使用大面积蓝紫渐变和发光卡片。
- 不直接引入大型 UI 框架覆盖现有体系。
- 不让参考项目的品牌视觉替代 LexHub 自身气质。

