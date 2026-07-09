# Phase 05 - 前端实施清单

## Step 0 - 工程基线

- [ ] 修复 `AppShell.tsx` 中 `_seg` 未使用 lint error。
- [ ] 运行 `npm run lint`，确认无 error。
- [ ] 记录现有 lint warnings。
- [ ] 运行 `npm run build`，确认通过。
- [ ] 确认中文源码为 UTF-8，不做误伤式转码。

## Step 1 - Token

- [ ] 在 `tokens.css` 增加 font-size tokens。
- [ ] 在 `tokens.css` 增加 font-weight tokens。
- [ ] 在 `tokens.css` 增加 spacing tokens。
- [ ] 增加 `--radius-xs`。
- [ ] 增加 `--radius-panel`。
- [ ] 增加 `--shadow-focus`。
- [ ] 增加 `--duration-slow`。
- [ ] 保留 legacy aliases。
- [ ] 不删除现有 color token。

## Step 2 - UI 样式入口

- [ ] 新建或规划 `src/styles/ui.css`。
- [ ] 在 `src/index.css` 中按合理顺序引入。
- [ ] 确认 `ui.css` 不覆盖旧页面大范围布局。

建议顺序：

```css
@import './styles/tokens.css';
@import './styles/base.css';
@import './styles/ui.css';
@import './styles/components.css';
@import './styles/layouts.css';
@import './styles/workbench.css';
@import './styles/polish.css';
```

## Step 3 - P0 基础组件

- [ ] `Button.tsx`
- [ ] `IconButton.tsx`
- [ ] `TextField.tsx`
- [ ] `Textarea.tsx`
- [ ] `Badge.tsx`
- [ ] `Status.tsx`
- [ ] `Panel.tsx`
- [ ] `PageHeader.tsx`
- [ ] `EmptyState.tsx`
- [ ] `LoadingState.tsx`
- [ ] `index.ts`

组件要求：

- [ ] Props 与 Phase 03 variants 对齐。
- [ ] 支持 disabled。
- [ ] 支持 focus-visible。
- [ ] 支持 loading 或对应状态。
- [ ] IconButton 有 `aria-label`。
- [ ] 不使用硬编码颜色，除非是临时迁移说明。

## Step 4 - 试点页面

推荐试点：

- [ ] Login
- [ ] 或 Admin Overview

试点验收：

- [ ] 页面主视觉与旧页面不冲突。
- [ ] 新组件覆盖主要控件。
- [ ] 空状态、错误态、加载态至少覆盖一个。
- [ ] 移动端不溢出。
- [ ] Build 通过。

## Step 5 - P1 组件准备

- [ ] Tabs
- [ ] Table
- [ ] Toolbar
- [ ] Dialog
- [ ] Drawer
- [ ] Toast
- [ ] Tooltip
- [ ] Stepper
- [ ] Timeline
- [ ] Upload

Radix 判断：

- [ ] Dialog 是否需要 Radix。
- [ ] Tabs 是否需要 Radix。
- [ ] Select / Dropdown 是否需要 Radix。
- [ ] Tooltip 是否需要 Radix。

## Step 6 - 业务 Patterns

- [ ] MatterIntake
- [ ] ScenarioSelector
- [ ] AgentPipeline
- [ ] ToolCallLog
- [ ] CitationBlock
- [ ] ReviewScore
- [ ] RiskPanel
- [ ] KnowledgeBrowser

## 每次提交前检查

- [ ] `npm run build`
- [ ] `npm run lint` 或记录既有 warnings
- [ ] 桌面端主页面手工检查
- [ ] 移动端主断点检查
- [ ] 无新增乱码
- [ ] 无无关重构

