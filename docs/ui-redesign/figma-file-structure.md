# Figma 文件结构

## 文件名

```txt
LexHub Design System
```

## 页面结构

### 00 Cover / Principles

- 产品定位
- 设计关键词
- 阶段记录
- 参考来源
- 版本说明

### 01 References

- Primer - Tooling
- Figma SDS - Tokens
- Radix / shadcn - Components
- Ant Design - Admin Patterns
- Flowbite / Mantis - Dashboard
- Legal Patterns
- Do Not Copy

### 02 Foundations

- Color
- Typography
- Spacing
- Radius
- Shadow
- Motion
- Icon
- Breakpoint

### 03 Tokens

与前端 CSS variables 对齐：

```txt
color.brand.primary
color.brand.accent
color.semantic.success
color.surface.bg
color.surface.default
color.text.default
color.border.default
font.size.body
space.4
radius.sm
shadow.sm
motion.duration.fast
layout.sidebar.width
```

### 04 Components

基础组件：

- Button
- Icon Button
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Tabs
- Badge
- Status
- Panel
- Table
- Toolbar
- Dialog
- Drawer
- Toast
- Tooltip
- Empty
- Loading
- Stepper
- Timeline
- Upload

### 05 Patterns

业务模式：

- Matter Intake
- Scenario Selector
- Evidence List
- Agent Run
- Citation Block
- Review Result
- Risk Panel
- Document Export
- Knowledge Import
- Audit Trail
- Config Console

### 06 App Shells

- User App Shell
- Admin Console Shell
- Auth Shell
- Landing Shell

### 07 Key Screens

P0：

- Login
- Workspace Intake
- Workspace Run
- Workspace Result
- Review
- Admin Overview
- Admin Knowledge

P1：

- Materials
- Evidence
- Admin Connections
- Admin Policies

P2：

- Landing
- Reports
- Replay
- Membership
- Profiles

### 08 Prototype

主流程：

```txt
登录 -> 新建事项 -> 上传材料 -> 办理中 -> 查看结果 -> 导出文书 -> 回放归档
```

### 99 Archive

- 废弃方案
- 历史版本
- 临时探索
- 参考截图备份

## 命名要求

- Figma 组件名使用英文，便于和 React 组件对应。
- 页面内中文文案使用真实产品文案，不使用占位翻译。
- Token 命名与前端 CSS variable 建立映射。
- 每个组件 variants 必须能对应到未来 React props。

