# Phase 03 - 组件 Variants 规格

本文件定义 Figma 组件 variants 与未来 React props 的对应关系。

## 命名约定

```txt
Figma Component: Button
React Component: LexButton
CSS Class: lex-button
```

业务组件不一定都要以 `Lex` 开头，但基础组件建议统一。

## P0 基础组件

### Button

Variants：

```txt
variant: primary | secondary | ghost | danger
size: sm | md | lg
state: default | hover | active | disabled | loading
icon: none | leading | trailing
width: auto | full
```

要求：

- 主操作使用 `primary`。
- 次操作使用 `secondary`。
- 低权重操作使用 `ghost`。
- 删除、重置、不可逆操作使用 `danger`。
- Loading 状态保留按钮宽度，不允许布局跳动。

### IconButton

Variants：

```txt
variant: plain | soft | bordered | danger
size: sm | md | lg
state: default | hover | active | disabled
```

要求：

- 必须有 tooltip 或 aria-label。
- 用 lucide 图标。

### Input / Textarea

Variants：

```txt
size: sm | md | lg
state: default | focus | error | disabled
leading: none | icon
trailing: none | action | status
```

要求：

- 错误态显示帮助文本。
- Focus ring 必须明显。
- Textarea 需要最小高度和字符溢出策略。

### Badge

Variants：

```txt
tone: neutral | primary | success | warning | danger | info | accent
size: sm | md
shape: rounded | pill
icon: none | leading
```

要求：

- 会员、状态、类型、标签使用不同 tone。
- 不把 Badge 当按钮使用。

### Status

Variants：

```txt
status: waiting | running | success | warning | danger | failed | archived
shape: dot | pill | inline
```

要求：

- 用于办理进度、审查、工具调用、知识库同步等状态。
- 状态色必须和语义一致。

### Panel

Variants：

```txt
surface: default | muted | strong
border: default | subtle | accent
density: compact | normal | spacious
header: none | simple | actions
```

要求：

- 替代泛用 `Card` 堆叠。
- 禁止卡片套卡片，除非是列表项或重复项。

### PageHeader

Variants：

```txt
layout: default | compact | split
badge: none | one | multiple
actions: none | single | group
```

要求：

- 每个应用页都应有页面标题、简短说明、状态和主操作。

### EmptyState

Variants：

```txt
tone: neutral | action | warning
size: sm | md | page
action: none | primary | secondary
```

要求：

- 文案说明当前为空的原因和下一步动作。

### LoadingState

Variants：

```txt
type: inline | panel | page | button
label: hidden | visible
```

要求：

- 不允许页面因加载文案变化跳动。

## P1 基础组件

### Tabs

Variants：

```txt
style: underline | segmented | pills
size: sm | md
orientation: horizontal | vertical
```

用途：

- Admin Connections 内 models/apis。
- Admin Policies 内 routing/review。
- Knowledge browse/import/config。

### Table

Variants：

```txt
density: compact | normal
selection: none | checkbox
rowAction: none | menu | inline
state: default | loading | empty
```

要求：

- 表头、筛选、分页、空状态统一。

### Dialog / Drawer

Variants：

```txt
size: sm | md | lg | full
tone: default | danger
footer: none | actions
```

用途：

- 确认操作、详情预览、配置编辑。

### Stepper / Timeline

Variants：

```txt
orientation: horizontal | vertical
status: waiting | running | done | warning | failed
density: compact | normal
```

用途：

- 事项受理步骤。
- 智能体办理过程。

## P0 业务 Patterns

### MatterIntake

组成：

- ScenarioSelector
- IntakeStepper
- FactTextarea
- DocumentRequirementForm
- UploadPanel
- SubmitSummary

状态：

- empty
- partially-filled
- validation-error
- ready

### AgentPipeline

组成：

- Agent node
- Status
- Current step
- Tool calls
- Evidence references

状态：

- waiting
- running
- completed
- warning
- failed

### CitationBlock

组成：

- Source title
- Law / article
- Excerpt
- Confidence / source status
- Jump to evidence

状态：

- verified
- partial
- missing

### ReviewScore

组成：

- Level
- Score
- Risk explanation
- Manual review flag

状态：

- pass
- needs-review
- high-risk

### KnowledgeBrowser

组成：

- Library nav
- Search / filter
- Result list
- Preview panel
- Import / sync actions

状态：

- empty
- loading
- ready
- sync-warning

