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

### 当前验证

- `npm run lint`：0 error，8 warning。
- `npm run build`：通过。

### 仍需处理

- 8 个既有 lint warning。
- Admin Shell 和 App Shell 仍有旧 class。
- `layouts.css` 仍是最大样式债务。
- Login 和 Admin Overview 只是试点，尚未进行完整视觉截图验收。
