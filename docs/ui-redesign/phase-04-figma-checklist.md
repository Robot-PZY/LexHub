# Phase 04 - Figma 高保真验收清单

## 全局

- [ ] Figma 文件使用 `LexHub Design System`。
- [ ] P0 页面放在 `07 Key Screens`。
- [ ] 原型链路放在 `08 Prototype`。
- [ ] 所有页面使用 Phase 03 组件，不临时画一次性按钮。
- [ ] 页面文本使用真实业务文案，不使用 lorem ipsum。
- [ ] 所有主要状态都有 frame 或明确说明。
- [ ] 每个页面有桌面 frame。
- [ ] Login 和 Workspace Intake 有移动端 frame。

## Login

- [ ] 有普通用户和管理员角色选择。
- [ ] 有默认、加载、错误状态。
- [ ] Demo 入口不显得玩具化。
- [ ] 移动端表单不溢出。

## Workspace Intake

- [ ] 场景选择清晰。
- [ ] 事项事实输入区明确。
- [ ] 文书要素区可根据场景变化。
- [ ] 材料上传区清楚。
- [ ] 右侧摘要和校验状态可见。
- [ ] 提交按钮 disabled / ready 状态明确。

## Workspace Run

- [ ] 有智能体执行链或 DAG。
- [ ] 当前步骤明显。
- [ ] 工具调用记录可见。
- [ ] 证据引用可见。
- [ ] completed 状态有查看结果入口。
- [ ] failed / warning 状态有原因或恢复入口。

## Workspace Result

- [ ] 结论摘要第一屏可见。
- [ ] 审查等级和可信度可见。
- [ ] 报告结构化，不像聊天消息。
- [ ] 法条引用和证据链可见。
- [ ] 风险提示可见。
- [ ] 导出文书入口清楚。

## Review

- [ ] 有待审列表。
- [ ] 有审查报告主体。
- [ ] 有证据、法条、风险、审计侧栏。
- [ ] 有通过 / 标记复核等人工操作。
- [ ] 空队列状态可行动。

## Admin Overview

- [ ] 第一屏能判断系统健康。
- [ ] Runtime、Models、APIs、Knowledge、Agents 状态齐全。
- [ ] 异常状态有下一步入口。
- [ ] 最近错误或审计事件可见。

## Admin Knowledge

- [ ] Browse / Import / Config 三个区域清楚。
- [ ] 法规、案例、模板、合同包可区分。
- [ ] 搜索、列表、预览同屏完成。
- [ ] 导入、同步、校验、错误状态齐全。

## 原型链路

- [ ] Login -> Workspace Intake
- [ ] Workspace Intake -> Workspace Run
- [ ] Workspace Run -> Workspace Result
- [ ] Workspace Result -> Review
- [ ] Workspace Result -> Export success
- [ ] Admin Login -> Admin Overview
- [ ] Admin Overview -> Admin Knowledge
- [ ] Admin Knowledge -> Import state

