# Phase 00 - 项目审计与基线

## 阶段目标

建立现状基线，明确哪些问题属于视觉、信息架构、组件复用、文案编码、响应式或业务流程问题。

## 当前初步观察

- 前端位于 `Co-Sight-master/cosight_frontend`，技术栈为 React + Vite + TypeScript。
- 已有 `tokens.css`、`components.css`、`layouts.css`、`workbench.css`、`polish.css`，说明项目已有自定义样式体系。
- 页面数量较多，包含用户工作台、材料、报告、审查、回放、会员、管理后台等多个模块。
- 源码中出现中文乱码，例如部分标题和 aria 文案显示为 mojibake，这是 UI 专业度的硬伤，优先级很高。
- 当前样式可能存在页面级 CSS 堆叠较多、组件边界不够清晰、卡片和面板模式不统一的问题。

## 审计范围

### 用户端

- Landing
- Login
- Workspace Intake
- Workspace Run
- Workspace Result
- Cases
- Evidence
- Materials
- Reports
- Research
- Review
- Replay
- Membership

### 管理端

- Admin Overview
- Admin APIs
- Admin Models
- Admin Knowledge
- Admin Agents
- Admin Routing
- Admin Users
- Admin Policies
- Admin Connections
- Admin Analytics

## 审计维度

- 页面目标是否清晰
- 主操作是否突出
- 信息层级是否可扫描
- 文案是否准确、可信、无乱码
- 表单、按钮、标签、表格是否一致
- 空状态、加载态、错误态是否完整
- 移动端是否可用
- 是否存在卡片套卡片、过度装饰、低价值视觉元素
- AI 执行过程是否透明
- 法律依据、证据、审计链是否足够可见

## 产物

- 页面截图清单
- UI 问题清单
- 页面优先级排序
- 组件复用现状表
- 编码和文案修复清单

## 验收标准

- 所有核心页面都有截图或文字审计记录。
- 明确第一批必须修复的问题。
- 明确哪些页面先进入 Figma 高保真。

