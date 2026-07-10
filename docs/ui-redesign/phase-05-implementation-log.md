# Phase 05 - 实施记录

## 2026-07-08

### 工程基线

- 修复 `AppShell.tsx` 中未使用 `_seg` 参数导致的 lint error。
- `npm run lint`：0 error，保留 8 个既有 warning。
- `npm run build`：通过。

### Token 与基础组件

- 扩展 `tokens.css`：
  - font-size
  - font-weight
  - spacing
  - radius-xs
  - radius-panel
  - shadow-focus
  - duration-slow
- 新增 `src/styles/ui.css`。
- 新增 P0 UI 组件：
  - Button
  - IconButton
  - TextField
  - Textarea
  - Badge
  - Status
  - Panel
  - ui/index.ts

### 试点页面

#### Login

- 将账号、密码、确认密码、昵称输入迁移到 `TextField`。
- 将主操作按钮迁移到 `Button`。
- 将登录页文案收敛到“法律事项 / 办理闭环”定位。

#### Admin Overview

- 将顶部状态迁移到 `Badge`。
- 将测试连接、刷新、收起、重置本地数据操作迁移到 `Button`。
- 将连接测试结果区外层迁移到 `Panel`。
- 保留测试连接、刷新、重置 demo 的原有逻辑。

#### Workspace Intake

- 将 AppShell 顶部事项状态迁移到 `Badge`。
- 将外层受理卡片迁移到 `Panel`，保留既有 `workspace-*` layout class。
- 将“查看材料库”入口切到 `lex-button` 样式。
- 将场景取消按钮迁移到 `Button`。
- 将通用分析状态迁移到 `Badge`。
- 将 Composer 提交按钮迁移到 `Button`。
- 保留草稿保存、场景切换、文书要素校验、上传 meta、`storePendingWorkspaceTask` 和跳转逻辑。

#### Workspace Run

- 将 AppShell 顶部办理状态迁移到 `Badge`。
- 将运行页顶部返回、新建事项、查看结论入口切换到 `lex-button` 样式。
- 将 PageHeader 连接状态迁移到 `Badge`。
- 将完成横幅中的查看审查结论入口切换到 `lex-button` 样式。
- 保留 `send`、`sendReplay`、`consumePendingWorkspaceTask`、`storePendingWorkspaceTask`、`derivePlanGraph`、`DagGraphPanel` 和 `ToolCallToast` 执行链路。

#### Workspace Result

- 将顶部操作入口迁移到 `lex-button`，并加入办理进度、案件归档、材料库图标。
- 将 PageHeader 状态迁移到 `Badge`。
- 重做完成横幅为结果页专属状态条，增加图标块、渐变背景和更清晰的文案层级。
- 将 `TaskReportPanel` 升级为结果页新版报告卡：
  - 头部增加更强的正式报告视觉层级。
  - 统计区改为四个独立指标卡。
  - 正文摘要、报告正文、侧栏风险/建议/依据卡片增强层次。
- 将文书交付区按钮迁移到 `Button`，保留文书展开、生成、重新生成和导出逻辑。
- 增强文书模板卡 hover、active、推荐状态的视觉反馈。
- 保留 `useWorkspaceSession`、`DocumentDeliverablePanel` 生成 API、报告解析、导出 payload、附录展开与相关入口跳转逻辑。

#### Page Transition

- 在 `App.tsx` 的路由外层加入 keyed `page-transition-stage`，路由切换时触发全站进入动画。
- 在 `ui.css` 中加入轻量 PPT 式页面切换：位移、轻微缩放、透明度和模糊过渡。
- 支持 `prefers-reduced-motion: reduce`，系统减少动画时关闭页面切换动画。
- 保留原有路由表、权限保护、重定向与页面业务逻辑。

#### Landing Hero

- 将首页主标题拆为三行显式结构：
  - “让法律事项”固定同一横排。
  - “进入”单独一排。
  - “智能办理链路”保留强调样式。
- 去除右侧产品预览大框的上下浮动动画，改为固定展示框。
- 将右侧产品预览改为横向自动轮播：
  - 事项总览。
  - 审查结论。
  - 文书交付。
- 支持鼠标悬停暂停自动切换，支持圆点手动切换。
- 保留首页 CTA、标签、导航、数据接口加载逻辑。
- Figma 插件认证可用；当前缺少具体 Figma 文件 URL，暂未读取外部设计稿。

#### Copy Alignment

- 首页导航文案统一为“产品 / 产品能力 / 办理流程 / 解决方案 / 会员方案”。
- 首页主 CTA 从“免费体验”调整为“发起事项”。
- 首页 Hero 文案统一为“让法律事项 / 沿路径办理。”。
- 登录页标题调整为“进入律枢，继续办理。”。
- 登录页用户端、管理控制台说明改为更短的入口说明。
- 登录页三步说明统一为“提交事项 / 生成路径 / 交付归档”。
- 工作台侧栏分组名从“我的工作”调整为“事项办理”。
- 工作台侧栏顺序调整为“事项受理 / 办理进度 / 审查结论 / 材料库 / 案件归档”。
- MarketingHeader 文案统一为“产品能力 / 办理流程 / 解决方案 / 会员方案 / 发起事项”。

#### Landing Hero C

- 将首页右侧预览从后台列表式展示改为 LexHub 品牌 mockup。
- 保留固定外框和横向自动轮播，不恢复上下浮动。
- 新增三组品牌化 slide：
  - 事项总览。
  - 审查结论。
  - 文书交付。
- 每个 slide 包含同步状态卡、中央事项卡、指标卡、办理路径节点和提示浮层。
- 使用 `landing-brand-*` 样式命名，降低对旧 `landing-preview-*` 的继续污染。
- 增加窄屏规则，移动端将浮层改为自然文档流，避免重叠。
- 保留首页导航、CTA 路径、登录判断、demo 数据加载逻辑。

#### Landing Hero Polish

- 将首页背景调整为更接近 Figma/SaaS presentation frame 的轻网格蓝灰底。
- 强化首屏白色画布：更大圆角、更强层次阴影、更明确左右栏比例。
- 取消首屏背景浮动装饰，避免与右侧固定 mockup 的动效方向冲突。
- 提升主标题字号，并限制标题宽度，让“让法律事项 / 沿路径办理。”更像首屏主视觉。
- 增加 1080px 和 720px 响应式覆盖，避免桌面列宽规则撑破平板和移动端布局。

#### Login Brand Polish

- 登录页左侧加入 LexHub Matter Path 品牌预览块，与首页右侧 mockup 语言一致。
- 登录页左侧背景改为轻网格蓝灰 + 暖金渐变，延续首页 presentation frame 方向。
- 表单面板改为更轻的白色高层级卡片，不改登录、注册、管理员校验逻辑。
- 角色卡圆角、hover、active 状态调整为更克制的蓝白层次。
- 移动端继续沿用隐藏左侧说明面板的策略，避免小屏信息过载。

#### App Shell Navigation Polish

- 工作台背景加入轻网格和顶部白色过渡，和首页、登录页的品牌底纹保持一致。
- 侧栏改为更轻的白色品牌控制台质感，保留原有路由和折叠逻辑。
- 侧栏分组标题增强为深蓝小标题，当前项保留金色左侧状态线。
- 主操作“发起新事项”保留深蓝 CTA 样式，并强化金色边界。
- 顶部栏改为半透明白色高层级栏，增加轻阴影以稳定导航层级。

#### Workspace Intake Polish

- 受理页主卡片改为品牌化白色操作台：蓝灰轻网格、暖金边界、左侧渐变状态线。
- 左侧步骤轨增强为办理路径视觉：当前步骤使用白色高层级块和蓝金状态线。
- 右侧 Hero 区改为固定信息面板，标题层级更明确，与首页“法律事项路径”方向保持一致。
- 场景选择区、文书要素区、事项输入区统一为轻卡片层级，减少原先表单拼接感。
- 场景选中状态改为蓝金渐变反馈，和 LexHub logo 色彩更贴合。
- 输入 textarea 增加轻微聚焦反馈，保留原有草稿、上传、提交、跳转和场景校验逻辑。

#### Workspace Run Path Polish

- 办理进度页新增只读 `RunPathOverview`，展示事项路径概览，不改变 `useCosightChat`、任务消费、轮询和结果跳转逻辑。
- 路径概览包含四个固定阶段：事实整理、依据检索、风险复核、结论交付。
- 阶段状态从已有 `steps` 和 `isCompleted` 派生，展示 pending、running、completed 三种视觉状态。
- 增加路径进度圆形指标、横向进度条和实时处理动作摘要。
- 视觉上延续受理页的白色操作台、轻网格、蓝金状态线和卡片层级。
- 增加 1080px、720px 响应式规则，阶段卡在窄屏下变为两列/单列，避免挤压和文本截断。

#### Workspace Result Polish

- 审查结论页新增只读 `ResultOverview`，展示主交付、可信度、引用依据和办理记录。
- 总览数据全部来自 `useWorkspaceSession`、`resultInsight`、`snapshot` 和 `outputProfile`，不改变报告解析、文书生成、导出与跳转逻辑。
- 审查结论页总览、报告卡、文书交付区、附录和相关入口统一为白色操作台、轻网格、蓝金状态线风格。
- 报告头部、统计卡、当前结论卡、侧栏风险/建议/依据卡片调整为 LexHub 蓝金品牌边界。
- 文书模板卡 active 状态改为蓝金渐变反馈，与受理页文书模板选择保持一致。
- 增加 1080px、720px 响应式规则，总览卡在窄屏下变为两列/单列。

#### Admin Dashboard Polish

- 参考用户提供的 Legal AI Suite Desktop Dashboard 方向，将管理首页从普通概览页推进为桌面 Dashboard 质感。
- Figma 插件已验证可用，但该链接为 `/make/` 文件，当前插件不支持读取 Make 文件；本阶段按可见方向和项目现有结构落地。
- 管理首页新增 `admin-dashboard-hero`，集中展示 Legal AI Suite 状态、运行说明和三组 readiness 指标。
- readiness 指标从现有 `settings`、`readyModelCount`、`readyApiCount`、`toolchain` 派生，不新增业务状态源。
- 快捷入口、运营图表、Admin Shell 背景和侧栏统一为白色操作台、轻网格、蓝金状态线风格。
- 增加 1080px、720px 响应式规则，Dashboard 在窄屏下从左右布局降为单列。

#### Admin Connections Matrix Polish

- 能力总览页新增 `admin-connections-hero`，作为系统能力矩阵入口。
- 能力矩阵展示模型能力、外部服务、处理能力扩展位和运行状态，数据来自现有 `useAdminSettings`。
- 保留 `AdminStackOverview` 的总览、模型、外部服务、处理能力四个 tab，不改数据加载和只读展示逻辑。
- `admin-stack-*` 卡片统一为桌面 Dashboard 质感：轻网格背景、白色操作台、蓝金边界和状态线。
- 模型卡、API 卡、协作角色卡、能力目录表格、运行时能力栈使用一致的边界、阴影和卡片层级。
- 增加 1080px、720px 响应式规则，能力矩阵在窄屏下从左右布局降为单列。

#### Admin Models Orchestration Polish

- 模型配置页新增 `admin-config-hero`，强调 LexHub 自有的多模型编排逻辑，而不是照搬外部 Dashboard 外观。
- 总览指标展示启用能力、语言推理、视觉 OCR 和复核能力，数据从现有 `draft` 模型配置派生。
- 保留模型启停、模型名、密钥、Base URL、OCR 格式等配置和保存逻辑。
- 模型卡、运行时指标、配置分组统一为白色操作台、轻网格、蓝金边界风格。
- 输入框增加统一聚焦反馈，提升配置页可读性和操作感。
- 增加 1080px、720px 响应式规则，模型编排台在窄屏下降为单列。

#### Admin APIs Service Routing Polish

- 服务管理页新增 `admin-config-hero` 服务接入台，说明 OCR、法律检索、知识增强和导出服务如何接入法律事项办理链路。
- 总览指标展示就绪服务、启用能力、服务位和 MCP 扩展能力，数据来自现有 `draft` 与 `mcpDraft`。
- 保留外部服务启停、密钥、Endpoint、MCP 新增/删除和保存配置逻辑。
- API 服务卡增加 LexHub 蓝金状态线、hover 层级、依赖角色标签强化和统一输入框聚焦反馈。
- 与模型配置页共用 `admin-config-hero` 视觉体系，形成“模型配置 / 服务管理”一组能力配置台。

#### Admin Runtime Presets

- 模型配置页新增“模型供应商 / 预设”下拉，覆盖 DeepSeek Chat、DeepSeek Reasoner、通义千问、Qwen VL、Kimi、智谱 GLM、OpenAI Compatible 和本地 Ollama。
- 预设只回填 `modelName` 与 `baseUrl`，不写入任何真实 API Key；当前项目仍可继续使用 DeepSeek 作为默认演示路线。
- 服务管理页新增“服务商 / 预设”下拉，覆盖 OCR、法律检索、联网搜索、导出、向量 RAG、合同外部审查、合同文书、条款库、合同比对和合规筛查等能力位。
- API 预设只回填 Endpoint 或本地路径，密钥仍由管理员在本地运行时配置中填写。
- 后端运行时配置增加 `providerId` 持久化，便于保存评委演示时选择的供应商状态；原有 `/demo/admin/settings` 保存、应用、测试和密钥遮罩逻辑保持不变。

#### Admin Config Guidance

- 模型配置页在供应商预设下方增加说明块，解释 DeepSeek、Qwen、Kimi、智谱、OpenAI Compatible 与 Ollama 分别适合的演示场景。
- 服务管理页接入已有 `API_CONFIG_GUIDANCE`，按服务位展示 Key、Endpoint 与启用建议，减少评审演示时口头解释成本。
- 服务管理页的 Key 与 Endpoint placeholder 改为按 OCR、法律检索、联网搜索、RAG、导出、合同能力等服务类型动态显示。
- 新增 `admin-config-guidance` 视觉样式，延续管理后台白色操作台、轻网格、蓝金提示层级。
- 本阶段仍不写入真实第三方密钥，不改变后端实际调用链。

### 当前验证

- `npm run lint`：0 error，8 warning。
- `npm run build`：通过。

### 仍需处理

- 8 个既有 lint warning。
- Admin Shell 和 App Shell 仍有旧 class。
- `layouts.css` 仍是最大样式债务。
- Login 和 Admin Overview 只是试点，尚未进行完整视觉截图验收。
