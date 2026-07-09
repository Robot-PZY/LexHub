# Phase 08 - 验收、打磨与回归

本阶段目标是确认 UI 改版达到可交付状态。Phase 08 不只是“看起来不错”，而是从功能、视觉、响应式、可访问性、构建、回归截图和已知问题分级上完成验收。

## 阶段目标

- 确认核心业务闭环可用。
- 确认管理端配置流程可用。
- 确认设计系统组件稳定。
- 确认桌面端和移动端关键断点无明显问题。
- 确认没有新增构建、lint、文案、可访问性风险。
- 输出验收报告、截图集、问题清单和后续 backlog。

## 验收入口条件

进入 Phase 08 前应满足：

- Phase 05 P0 组件已落地。
- Phase 06 用户端核心页面已迁移。
- Phase 07 管理端主入口已迁移。
- `npm run build` 通过。
- `npm run lint` 无新增 error，既有 warning 已记录。

## QA 流程

### Step 1 - 工程检查

命令：

```bash
npm run build
npm run lint
```

验收：

- Build 必须通过。
- Lint 不允许新增 error。
- Warning 可以记录为 backlog，但必须判断是否影响 UI 或行为。

### Step 2 - 主流程冒烟

用户端：

```txt
Login
-> Workspace Intake
-> Workspace Run
-> Workspace Result
-> Review
-> Export / Replay entry
```

管理端：

```txt
Admin Login
-> Admin Overview
-> Admin Connections
-> Admin Knowledge
-> Admin Policies
-> Admin Users
```

验收：

- 主操作可点击。
- 页面跳转正确。
- 状态反馈可见。
- 空状态可行动。

### Step 3 - 页面状态检查

每个核心页面至少检查：

- default
- loading
- empty
- error 或 warning
- disabled
- hover
- focus

不是每个页面都天然有所有状态，但缺失时需要说明原因。

### Step 4 - 响应式检查

断点：

```txt
1440 x 1024
1280 x 900
1024 x 768
768 x 1024
390 x 844
```

检查：

- 无水平滚动。
- Sidebar / drawer 可用。
- Context panel 在移动端合理下沉或转为 tabs。
- 表格在移动端转为可读列表或可滚动容器。
- 主操作不遮挡内容。
- 文本不溢出按钮或卡片。

### Step 5 - 视觉一致性检查

检查：

- Button、Input、Badge、Status、Panel、Table 一致。
- 页面标题和主操作位置一致。
- 色彩语义一致。
- 圆角和阴影不过度。
- 不出现卡片套卡片。
- 不出现营销式后台。
- 不出现大面积蓝紫渐变或发光装饰。

### Step 6 - 可访问性检查

检查：

- 表单有 label。
- IconButton 有 aria-label。
- 焦点样式可见。
- 键盘可以访问主要操作。
- 对比度合理。
- loading / toast / error 不只依赖颜色表达。

### Step 7 - 截图留档

截图存放建议：

```txt
docs/ui-redesign/screenshots/
  phase-08/
    desktop-1440/
    desktop-1280/
    tablet-768/
    mobile-390/
```

截图应覆盖：

- Login
- Workspace Intake
- Workspace Run
- Workspace Result
- Review
- Materials
- Evidence
- Admin Overview
- Admin Connections
- Admin Knowledge
- Admin Policies
- Admin Users

## 问题分级

### P0 - 阻塞交付

- Build 失败。
- 核心流程无法完成。
- 页面空白或主内容不可见。
- 登录/提交/导出/保存等主操作不可用。
- 移动端核心页面无法使用。

### P1 - 必须修复

- 明显文本溢出。
- 主操作不清楚。
- 状态色错误或误导。
- 表格/表单严重错位。
- 危险操作无提示。
- 证据、依据、风险等关键信息缺失。

### P2 - 可进入 backlog

- 局部间距不完美。
- 非核心页面轻微视觉不一致。
- 少量 hover/focus 细节可优化。
- 图表或装饰区域待精修。

## 最终交付物

- UI 验收报告
- 截图集
- 已知问题清单
- 后续优化 backlog
- 构建/lint 结果
- 页面迁移记录

## Phase 08 完成标准

- 用户端主闭环可用。
- 管理端主配置流程可用。
- P0/P1 问题已清零。
- P2 问题已记录。
- 关键断点截图留档。
- Build 通过。
- Lint 无新增 error。
- 设计系统组件在核心页面稳定使用。

