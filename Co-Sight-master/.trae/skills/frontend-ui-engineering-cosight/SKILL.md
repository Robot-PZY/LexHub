---
name: "frontend-ui-engineering-cosight"
description: "Builds production-quality Co-Sight UI. Invoke when implementing or modifying React pages, components, layout, state, loading, empty states, responsiveness, or accessibility for user-facing interfaces."
---

# Frontend UI Engineering For Co-Sight

Adapted for this workspace from the open-source `frontend-ui-engineering` skill in `TopTechPhoto/agent-skills`, then localized for Co-Sight's light legal SaaS workbench style and project conventions.

This skill is the engineering companion to `legal-saas-frontend`.

- `legal-saas-frontend` decides the product register, visual tone, and anti-AI-aesthetic direction.
- `frontend-ui-engineering-cosight` makes the UI implementation production-grade, accessible, maintainable, and consistent.

## When To Use

Use this skill when:

- building a new React page or component
- modifying an existing user-facing interface
- implementing responsive layouts
- adding interactivity or client-side state
- fixing visual, usability, or structural UI issues
- improving loading, error, empty, and success states
- making generated UI feel production-quality rather than AI-generated

Use this skill together with `legal-saas-frontend` when both style direction and implementation quality matter.

Do not use this skill for backend-only work or non-visual code refactors.

## Required Setup

Before editing:

1. Read `DESIGN.md`.
2. Read the target component, page, and nearby styles first.
3. Identify whether the work belongs to the left navigation, center workspace, or right inspector zone.
4. Reuse the project's current tokens, classes, and patterns before inventing new abstractions.

## Core Goal

Ship UI that feels:

- production-ready
- maintainable
- accessible
- responsive
- coherent with Co-Sight's legal SaaS identity

Never ship UI that merely looks plausible in code review but breaks down in real usage.

## Engineering Principles

### Prefer Composition Over Configuration

Build small focused components that compose well. Avoid giant configurable "do everything" wrappers.

Good direction:

- `StepFlowPanel`
- `ToolTracePanel`
- `ResultPanel`
- `AgentStrip`

Bad direction:

- one mega-panel with many flags and variant props for unrelated jobs

### Keep Components Focused

Each component should do one clear thing:

- rendering a list
- showing a step
- presenting a status pill
- handling one form block

If a component becomes visually or behaviorally hard to explain, split it.

### Separate Data And Presentation

When possible:

- container / hook handles data fetching, transformation, and side effects
- presentational component handles rendering

Examples:

- WebSocket or event parsing logic should stay outside pure presentation blocks
- view components should receive already-shaped data when practical

### Choose The Simplest State Model

Use the smallest valid state scope:

- local state for temporary UI behavior
- lifted state for sibling coordination
- URL state for shareable filters or tabs
- dedicated shared store only if multiple distant parts truly depend on it

Avoid introducing a global store for problems that a small hook or local state can solve.

## Design-System Adherence

### No Generic AI Aesthetic

Avoid the familiar low-quality AI patterns:

- purple or indigo default palettes
- excessive gradients
- oversized rounded corners everywhere
- generic hero compositions
- oversized padding with weak hierarchy
- stock card grids that ignore information priority
- shadow-heavy pseudo-premium styling

For Co-Sight specifically, also avoid:

- dark command-center sidebars for normal workflow pages
- too many colored badges in operational views
- floating glassy inspector panels
- decorative "AI agent" iconography that weakens legal trust

### Use The Existing Token System

Prefer existing CSS variables and tokens over raw values.

Good:

- `var(--primary)`
- `var(--line-soft)`
- `var(--surface-alt)`
- project-defined semantic classes

Bad:

- arbitrary hex values introduced ad hoc
- one-off pixel values that break spacing rhythm

### Respect Spacing Rhythm

Use the project's spacing rhythm:

- `8px`
- `12px`
- `16px`
- `24px`

Avoid values that look improvised unless a specific design constraint demands them.

### Respect Typography Hierarchy

Use semantic heading order:

- one `h1` per page
- `h2` for major sections
- `h3` for subsections
- body text for content
- smaller text for metadata and helper copy

Do not fake hierarchy by randomly scaling text sizes without semantic structure.

## Accessibility

Every user-facing component should meet a practical WCAG AA bar.

### Interactive Elements

- Use semantic elements first: `button`, `a`, `input`, `label`, `nav`, `section`
- Do not use clickable `div` unless absolutely necessary
- If a custom interactive element exists, ensure focusability and keyboard support

### Labels And Announcements

- Inputs need visible labels or robust accessible labels
- Icon-only buttons need `aria-label`
- Dynamic status changes should be understandable through text, not color alone

### Focus

- Keep visible focus states
- Do not remove focus outlines without replacing them
- Modals, drawers, and overlays must manage focus intentionally

### State Communication

Do not rely only on color for:

- errors
- success
- warnings
- status changes

Use text, iconography, or layout cues as well.

## Loading, Empty, Error, And Success States

Never leave operational gaps in the UI.

Every serious surface should answer:

- What shows while data is loading?
- What shows when nothing exists yet?
- What shows when the request fails?
- What shows after success?

For Co-Sight, these states are especially important in:

- session history
- replay views
- step flow panels
- tool trace panels
- result summaries
- workbench intake forms

Prefer skeletons or structured placeholders over spinners for content-heavy surfaces.

## Responsive Rules

Design mobile-first, then scale up.

Verify at least these widths:

- `320px`
- `768px`
- `1024px`
- `1440px`

For Co-Sight layouts:

- desktop may keep the three-zone logic
- tablet may collapse the right inspector below the center content
- mobile should prioritize the center task flow and progressively reveal secondary context

Do not simply shrink the desktop layout until it breaks.

## Co-Sight Specific Guidance

### Workbench Structure

Keep the page readable as an operational workspace:

- left: navigation and quick actions
- center: primary task surface
- right: step, tool, result, or inspector context

The center column must remain the clearest and most stable reading path.

### Result Credibility

Result sections must feel procedural and trustworthy:

- clear headings
- structured summary blocks
- evidence or reference bindings
- readable confidence or review signals

Do not make result cards look like marketing widgets.

### Legal-Business Copy

Prefer:

- `事项受理`
- `办理路径`
- `执行记录`
- `工具轨迹`
- `法律依据`
- `风险提示`
- `结构化结论`

Avoid:

- `smart magic`
- `AI superpower`
- `instant intelligence`
- empty hype copy

## Red Flags

Stop and reconsider if you see:

- components over ~200 lines with mixed responsibilities
- lots of inline styles
- arbitrary pixel values everywhere
- missing loading or empty states
- missing keyboard navigation support
- too many badges, cards, or decorative gradients
- center workspace losing prominence
- right inspector becoming visually louder than the task itself

## Implementation Workflow

When using this skill:

1. Identify the target surface and its job.
2. Check the existing design tokens and layout patterns.
3. Decide whether to reuse, split, or simplify components.
4. Implement the smallest solid improvement.
5. Verify accessibility, state coverage, and responsiveness.
6. Compare the result against `DESIGN.md` and `legal-saas-frontend`.

## Verification Checklist

Before finishing:

- [ ] UI follows `DESIGN.md`
- [ ] No obvious AI-template styling
- [ ] Interactive elements are keyboard accessible
- [ ] Loading, empty, error, and success states are handled
- [ ] Layout works at `320px`, `768px`, `1024px`, and `1440px`
- [ ] No arbitrary visual drift in spacing, colors, or radii
- [ ] The page still reads as a legal SaaS workbench

## How To Pair With Other Skills

- Use `legal-saas-frontend` first when the task is about visual direction, redesign, or product tone.
- Use this skill when the task is about turning that direction into solid UI engineering.
- If the user later asks for strict UI critique or polish review, add a dedicated audit skill rather than bloating this one.
