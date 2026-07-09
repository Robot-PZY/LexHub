# 组件清单

## 基础组件

| 组件 | 优先级 | 说明 |
| --- | --- | --- |
| Button | P0 | 主按钮、次按钮、幽灵按钮、危险按钮、加载态 |
| IconButton | P0 | 工具按钮、关闭、刷新、下载、展开 |
| Input | P0 | 普通输入、错误态、禁用态 |
| Textarea | P0 | 事项描述、备注、长文本 |
| Badge | P0 | 会员、状态、类型、标签 |
| Status | P0 | 成功、处理中、警告、失败 |
| Card / Panel | P0 | 内容容器，但避免卡片套卡片 |
| PageHeader | P0 | 标题、说明、状态、操作 |
| EmptyState | P0 | 无数据、无材料、无历史 |
| LoadingState | P0 | 页面、区域、按钮加载 |
| Tabs | P1 | 页面分区 |
| Table | P1 | 后台和材料列表 |
| Toolbar | P1 | 筛选、搜索、批量操作 |
| Dialog | P1 | 确认、编辑、危险操作 |
| Drawer | P1 | 详情预览 |
| Toast | P1 | 操作反馈 |
| Tooltip | P1 | 图标解释 |
| Stepper | P1 | 事项阶段 |
| Timeline | P1 | 办理过程 |
| Upload | P1 | 材料上传 |

## 业务组件

| 组件 | 优先级 | 说明 |
| --- | --- | --- |
| MatterIntake | P0 | 事项受理主组件 |
| ScenarioSelector | P0 | 业务场景选择 |
| EvidenceList | P0 | 材料和证据列表 |
| AgentPipeline | P0 | 智能体执行链 |
| ToolCallLog | P0 | 工具调用记录 |
| CitationBlock | P0 | 法条和来源引用 |
| ReviewScore | P0 | 审查等级和可信度 |
| RiskPanel | P0 | 风险提示 |
| AuditTrail | P1 | 审计链 |
| DocumentExportPanel | P1 | 报告和文书导出 |
| KnowledgeBrowser | P1 | 知识库浏览 |
| RuntimeStatusPanel | P1 | 管理端运行状态 |
| ModelConfigCard | P1 | 模型配置 |

## 组件落地原则

- 组件 props 与 Figma variants 对齐。
- 组件先服务核心页面，不做过度抽象。
- 页面级样式逐步迁移到组件级样式。
- 交互复杂的组件可引入 Radix primitives。

