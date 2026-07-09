# Phase 03 - Token 规格与映射

本文件定义 Figma Variables 与前端 CSS variables 的建议映射。当前是目标规格，不要求立刻修改 `tokens.css`。

## 当前前端 token 概览

现有文件：

```txt
Co-Sight-master/cosight_frontend/src/styles/tokens.css
```

当前已有：

- Typography：`--font-sans`、`--font-display`、`--font-brand`
- Brand colors：`--color-primary`、`--color-accent`
- Semantic colors：success、warning、danger、info
- Surface colors：bg、surface、muted、line
- Radius：sm、md、lg、xl、2xl、full
- Shadows：xs、sm、md、lg、glow
- Motion：duration、ease
- Layout：sidebar、topbar、content max
- Legacy aliases

## 建议 Figma Variable 分组

```txt
Color / Brand
Color / Semantic
Color / Surface
Color / Text
Color / Border
Color / Data
Typography / Family
Typography / Size
Typography / Weight
Typography / LineHeight
Spacing
Radius
Shadow
Motion
Layout
```

## Color Tokens

| Figma variable | CSS variable | 当前值 | 建议 |
| --- | --- | --- | --- |
| `color.brand.primary` | `--color-primary` | `#123e66` | 保留 |
| `color.brand.primaryHover` | `--color-primary-hover` | `#0b2d4d` | 保留 |
| `color.brand.primarySoft` | `--color-primary-soft` | `#eaf1f8` | 保留 |
| `color.brand.accent` | `--color-accent` | `#d6a84f` | 降低使用面积 |
| `color.brand.accentHover` | `--color-accent-hover` | `#b98422` | 保留 |
| `color.semantic.success` | `--color-success` | `#2f6b57` | 保留 |
| `color.semantic.warning` | `--color-warning` | `#a56a1e` | 保留 |
| `color.semantic.danger` | `--color-danger` | `#a6473c` | 保留 |
| `color.semantic.info` | `--color-info` | `#23669c` | 保留 |
| `color.surface.bg` | `--color-bg` | `#f4f0e7` | 后台可考虑更中性 |
| `color.surface.elevated` | `--color-bg-elevated` | `#ece5d8` | 后台可考虑更中性 |
| `color.surface.default` | `--color-surface` | `#ffffff` | 保留 |
| `color.surface.alt` | `--color-surface-alt` | `#fbf8f1` | 谨慎使用 |
| `color.text.default` | `--color-text` | `#263f59` | 保留或略降蓝感 |
| `color.text.strong` | `--color-text-strong` | `#0b2d4d` | 保留 |
| `color.text.muted` | `--color-muted` | `#748395` | 保留 |
| `color.border.default` | `--color-line` | `#d9cfbe` | 后台可考虑更中性 |
| `color.border.soft` | `--color-line-soft` | `#e9dfcf` | 后台可考虑更中性 |

## Typography Tokens

建议新增：

| Figma variable | CSS variable | 值 |
| --- | --- | --- |
| `font.family.sans` | `--font-sans` | existing |
| `font.family.display` | `--font-display` | existing |
| `font.size.xs` | `--font-size-xs` | `12px` |
| `font.size.sm` | `--font-size-sm` | `13px` |
| `font.size.body` | `--font-size-body` | `15px` |
| `font.size.md` | `--font-size-md` | `16px` |
| `font.size.lg` | `--font-size-lg` | `18px` |
| `font.size.xl` | `--font-size-xl` | `20px` |
| `font.size.2xl` | `--font-size-2xl` | `24px` |
| `font.size.3xl` | `--font-size-3xl` | `30px` |
| `font.size.4xl` | `--font-size-4xl` | `36px` |
| `font.weight.regular` | `--font-weight-regular` | `400` |
| `font.weight.medium` | `--font-weight-medium` | `500` |
| `font.weight.semibold` | `--font-weight-semibold` | `600` |
| `font.weight.bold` | `--font-weight-bold` | `700` |

## Spacing Tokens

建议新增：

| Figma variable | CSS variable | 值 |
| --- | --- | --- |
| `space.1` | `--space-1` | `4px` |
| `space.2` | `--space-2` | `8px` |
| `space.3` | `--space-3` | `12px` |
| `space.4` | `--space-4` | `16px` |
| `space.5` | `--space-5` | `20px` |
| `space.6` | `--space-6` | `24px` |
| `space.8` | `--space-8` | `32px` |
| `space.10` | `--space-10` | `40px` |
| `space.12` | `--space-12` | `48px` |
| `space.16` | `--space-16` | `64px` |

## Radius Tokens

| Figma variable | CSS variable | 当前值 | 建议 |
| --- | --- | --- | --- |
| `radius.sm` | `--radius-sm` | `6px` | 用于 button/input |
| `radius.md` | `--radius-md` | `10px` | 新组件建议改为 8px |
| `radius.lg` | `--radius-lg` | `12px` | 用于 dialog / large panel |
| `radius.xl` | `--radius-xl` | `18px` | legacy，减少新用法 |
| `radius.2xl` | `--radius-2xl` | `24px` | legacy，减少新用法 |
| `radius.full` | `--radius-full` | `999px` | pill only |

建议新增：

```txt
--radius-xs: 4px
--radius-panel: 8px
```

## Shadow Tokens

| Figma variable | CSS variable | 用途 |
| --- | --- | --- |
| `shadow.xs` | `--shadow-xs` | 输入框、细微层级 |
| `shadow.sm` | `--shadow-sm` | 普通面板 |
| `shadow.md` | `--shadow-md` | 弹层 |
| `shadow.lg` | `--shadow-lg` | 大浮层，谨慎使用 |
| `shadow.focus` | `--shadow-focus` | 建议新增，可访问 focus |

## Motion Tokens

| Figma variable | CSS variable | 当前值 |
| --- | --- | --- |
| `motion.duration.fast` | `--duration-fast` | `140ms` |
| `motion.duration.normal` | `--duration-normal` | `220ms` |
| `motion.ease.out` | `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |

建议新增：

```txt
--duration-slow: 320ms
```

## Layout Tokens

| Figma variable | CSS variable | 当前值 |
| --- | --- | --- |
| `layout.sidebar.width` | `--sidebar-width` | `248px` |
| `layout.topbar.height` | `--topbar-height` | `64px` |
| `layout.content.max` | `--content-max` | `1240px` |
| `layout.appContent.max` | `--app-content-max` | `1180px` |
| `layout.section.gap` | `--section-gap` | `56px` |

## Token 落地顺序

1. 在 Figma 中建立变量。
2. 保持变量名与目标 CSS variables 一致。
3. Phase 05 再修改 `tokens.css`。
4. 修改时保留 legacy aliases，避免一次性破坏旧页面。
5. 新组件只使用新 token。

