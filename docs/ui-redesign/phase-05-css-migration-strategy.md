# Phase 05 - CSS 收敛策略

当前样式体系已经能运行，但页面级 CSS 过重。Phase 05 的目标不是立刻删除旧样式，而是建立新样式入口和迁移纪律。

## 当前样式文件

| 文件 | 当前角色 | 风险 |
| --- | --- | --- |
| `tokens.css` | 全局 token | token 维度不完整 |
| `base.css` | 基础 reset / body / animation | 风险较低 |
| `components.css` | 按钮、badge、card、table 等通用样式 | 可继续承接 legacy，但不宜无限增长 |
| `layouts.css` | 大量页面布局和模块样式 | 最大风险，约 170KB |
| `workbench.css` | 工作台相关样式 | 与 workspace 迁移相关 |
| `polish.css` | 后期视觉修补和覆盖 | 容易与 layouts 冲突 |

## 目标职责

建议逐步形成：

| 文件 | 目标角色 |
| --- | --- |
| `tokens.css` | 设计 token 和 legacy aliases |
| `base.css` | 全局基础样式 |
| `ui.css` | 新基础组件样式 |
| `components.css` | legacy 通用组件样式，逐步减少新增 |
| `layouts.css` | legacy 页面样式，禁止继续扩张 |
| `workbench.css` | legacy workspace 样式，随页面迁移减少 |
| `polish.css` | 临时兼容层，最终尽量消解 |

## 新样式规则

- 新基础组件样式写入 `ui.css`。
- 新业务组件样式可以按模块小文件拆分，或先进入 `ui.css` 的 pattern 区块。
- 不再向 `layouts.css` 添加新的大段页面样式。
- 不使用过宽选择器覆盖全站。
- 不使用 `!important` 解决设计系统冲突，除非有明确迁移注释。
- 不把页面布局写进基础组件样式。

## 迁移记录格式

每迁移一个页面，记录：

```txt
页面：
替换的新组件：
仍依赖的 legacy class：
可删除候选 class：
视觉差异：
风险：
```

## 删除旧样式原则

- 只有确认没有页面引用时才删除。
- 先用 `rg "class-name"` 检查引用。
- 删除后运行 build。
- 对 P0 页面做手工视觉检查。
- 不做大规模机械删除。

## 优先收敛区域

P0：

- Button / Badge / Card / Panel
- PageHeader
- Empty / Loading
- Login page styles

P1：

- App Shell
- Admin Shell
- Workspace Intake
- Table / Toolbar

P2：

- Landing
- Membership
- Analytics
- Decorative polish styles

## 成功标准

- 新页面主要使用 `ui.css` 和新组件。
- `layouts.css` 不再增长。
- `polish.css` 的覆盖职责逐步减少。
- 旧 class 删除有记录，不靠猜。

