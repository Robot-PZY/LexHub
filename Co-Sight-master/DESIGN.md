---
name: Co-Sight Design System
product: Co-Sight
style: light legal saas workbench
updated: 2026-06-26
---

# Co-Sight Design System

Co-Sight is a light-theme legal SaaS workbench for multi-agent collaboration, legal intake, evidence-bound reasoning, and structured conclusions. The visual goal is professional, restrained, trustworthy, and productized. It should feel closer to a mature enterprise legal system than to a flashy AI demo.

## Brand Position

- Product category: legal SaaS / enterprise legal operations workbench
- Core impression: trustworthy, disciplined, explainable, operational
- Interaction tone: calm, efficient, structured, evidence-oriented
- Visual benchmark: LaborAid-style light professional surfaces, but adapted for Co-Sight's multi-agent and workbench narrative

## Design Principles

- Use light surfaces by default. The interface should feel bright, warm, and readable rather than sterile white or dark-tech.
- Prefer hierarchy over decoration. Use typography, spacing, borders, and sectional grouping before using shadows or gradients.
- Show process clearly. The product should communicate intake, routing, execution, evidence binding, and conclusion with minimal ambiguity.
- Keep the UI product-like. Avoid "AI toy" patterns such as glowing buttons, neon accents, or floating glassmorphism cards.
- Make legal meaning obvious. Labels, statuses, and result blocks should feel procedural and businesslike.
- Reduce chrome. Cards should exist only when they help grouping, interaction, or state communication.

## Anti-Goals

Avoid these patterns unless the existing page already requires them:

- saturated blue-purple gradients
- glassmorphism, frosted blur, or glowing halos
- oversized rounded corners with floating card stacks
- decorative dashboards inside heroes
- too many colorful badges or icon backgrounds
- over-animated motion and bouncy transitions
- generic "AI assistant" visuals that weaken legal trust

## Color Tokens

Use this palette as the source of truth. Do not invent ad-hoc colors in components.

### Core Neutrals

- `page-bg`: `#F6F4EF`
- `page-bg-soft`: `#FBFAF7`
- `panel-bg`: `#FFFFFF`
- `panel-subtle`: `#F1EEE8`
- `panel-emphasis`: `#ECE7DD`
- `border`: `#DED8CD`
- `border-strong`: `#CFC6B6`

### Ink

- `ink-strong`: `#20324D`
- `ink`: `#2E425C`
- `ink-soft`: `#526173`
- `ink-muted`: `#7F8A97`

### Brand

- `brand`: `#2E4A6B`
- `brand-hover`: `#243C58`
- `brand-soft`: `#EEF3F8`
- `brand-soft-border`: `#CAD6E3`

### Accent

- `accent`: `#B98A2C`
- `accent-hover`: `#9D7423`
- `accent-soft`: `#F3E7C6`
- `accent-soft-text`: `#7A5710`

### Semantic

- `success`: `#2F6B57`
- `success-soft`: `#EAF4EF`
- `warning`: `#A56A1E`
- `warning-soft`: `#FBF1E2`
- `danger`: `#A6473C`
- `danger-soft`: `#F9E9E7`
- `info-soft`: `#EEF3F8`

## Color Usage

- `brand` is reserved for primary actions, active states, navigation emphasis, and key procedural highlights.
- `accent` is reserved for important emphasis, credibility or evidence markers, and a small number of focal details.
- Neutral surfaces should dominate the page. Most screens should read as 80% neutral, 15% brand emphasis, 5% accent.
- Use semantic soft backgrounds for warnings, risk cues, and validation states instead of loud fills.

## Typography

### Font Stack

- Primary body: `Inter`, `PingFang SC`, `Microsoft YaHei`, `Noto Sans SC`, sans-serif
- Optional display accent for selective headers only: `Noto Serif SC`, `Songti SC`, serif

### Guidance

- Use sans-serif as the default UI font.
- Use serif sparingly for premium legal branding moments, not for dense workbench content.
- Keep copy concise and operational. Most blocks should be scanable within seconds.

### Type Scale

- Page title: `24px-28px`, `600`, tracking slightly tight
- Section title: `16px-18px`, `600`
- Card title: `14px-16px`, `600`
- Body: `13px-14px`, `400`
- Caption / metadata: `12px`, `500`
- Status pill: `11px-12px`, `600`

## Spacing

- Base spacing unit: `4px`
- Tight gap: `8px`
- Default gap: `12px`
- Section gap: `16px`
- Large block gap: `24px`
- Page gutter desktop: `24px`
- Page gutter mobile: `16px`

Use consistent spacing rhythms. Do not mix arbitrary values that make adjacent modules feel unrelated.

## Shape And Borders

- Standard radius: `10px`
- Elevated panel radius: `12px`
- Pill radius: `999px`
- Default border: `1px solid var(--border)`
- Strong border: use only for state emphasis or structural separation

Do not use extra-large radii for professional workbench surfaces.

## Elevation

- Prefer border + subtle background difference over heavy shadows
- Small shadow only for key floating surfaces or prominent action groups
- Avoid stacked shadows and dramatic lift

Suggested shadows:

- card shadow: `0 6px 18px rgba(32, 50, 77, 0.05)`
- overlay shadow: `0 16px 36px rgba(32, 50, 77, 0.08)`

## Motion

- Keep transitions short and calm: `120ms-180ms`
- Hover should feel precise, not playful
- Allowed motion: slight border emphasis, 1px translate, subtle fade
- Avoid springy, bouncing, or attention-seeking animations

## Layout Model

Co-Sight uses a three-zone workbench pattern:

- Left: navigation, mode switch, quick actions
- Center: intake, drafting, execution context, core workspace
- Right: step flow, tool trace, structured result or inspector

### Layout Rules

- Left sidebar should feel light and integrated, not like a dark command center
- Center column is the calmest and cleanest visual zone
- Right column acts as an operational inspector, not a second main canvas
- Desktop density should feel businesslike, but each module must remain breathable

## Component Patterns

### Sidebar

- Warm light background
- Fine border on the right
- Selected item uses soft brand background with a narrow left accent indicator
- Avoid full-width saturated fills for normal items

### Panels And Cards

- White or warm-white surface
- Fine border
- Radius `10px-12px`
- Shadow optional and extremely light
- If a section works with only spacing and a divider, do not force a card

### Buttons

- Primary: solid brand background, white text
- Secondary: white or subtle panel background with border
- Tertiary: text button or ghost button with restrained hover
- No glow, no bright gradients, no oversized CTA pills

### Inputs And Textareas

- White background
- Fine neutral border
- Focus uses soft brand ring
- Avoid thick neon outlines or dark fields in light layouts

### Tabs And Segmented Controls

- Selected state uses soft brand background or subtle surface lift
- Labels remain crisp and readable
- Do not overuse color for inactive states

### Badges

- Use soft filled pills with low saturation
- One badge should communicate one meaning: status, confidence, evidence class, or source type
- Do not turn every piece of metadata into a badge

### Tables And Lists

- Prioritize row rhythm and scanability
- Use dividers and restrained zebra or hover treatment
- Avoid nested cards for list items unless interaction demands it

## Page Guidance

### Landing Page

- Light, premium, professional
- One main promise above the fold
- Avoid demo-dashboard collage in the hero
- Show legal process credibility, explainability, and structured workflow

### Login Page

- Prefer bright and calm layout over dark-tech split screens
- Trust, professionalism, and system identity matter more than visual drama

### Workspace

- This is the product's core identity
- The page should read as a legal operations workbench, not as a generic chat page
- Process visibility is critical: task intake, step routing, tool usage, evidence references, and structured conclusion

### Replay / History

- Emphasize timeline clarity, recoverability, and result traceability
- The result area should feel like a case summary or conclusion memo

## Writing Style

- Prefer legal-business language over generic AI assistant phrasing
- Use terms like `事项受理`, `办理路径`, `材料归档`, `执行记录`, `法律依据`, `风险提示`, `结构化结论`
- Avoid vague UX copy such as `magic`, `smart`, `wow`, `instant genius`

## Accessibility

- Maintain WCAG AA contrast in all core interactions
- Use semantic states, not color alone, for warnings and failures
- Focus styles must remain visible on keyboard navigation
- Dense workbench sections must still preserve readable line height and hit area

## Implementation Rules

- Reuse existing project tokens and CSS variables whenever possible
- Extend the current palette toward this system instead of introducing a second visual language
- New components must look compatible with existing warm neutral and ink-blue tokens
- Before introducing a new visual pattern, check whether spacing, border, and typography solve the problem first

## Quick Checklist

Before shipping a UI change, verify:

- Does it feel like a light legal SaaS rather than an AI demo?
- Is the hierarchy driven by typography, spacing, and grouping instead of decoration?
- Are there too many cards, badges, or colored blocks?
- Does the page keep strong readability on both desktop and mobile?
- Does the result area feel trustworthy and procedural?
- Are colors and radii still within the system?
