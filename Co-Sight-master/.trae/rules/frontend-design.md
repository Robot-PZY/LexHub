---
description: Co-Sight frontend design rules. Apply when generating or editing UI, styles, React pages, components, or layout files.
globs: ["**/*.tsx", "**/*.ts", "**/*.css", "**/*.scss", "**/*.md"]
---

# Co-Sight Frontend Design Rules

Before generating or editing any UI, read `DESIGN.md` at the project root.

## Product Register

Co-Sight is a light-theme legal SaaS workbench. The output must feel:

- professional
- restrained
- trustworthy
- productized
- evidence-oriented

It must not feel like:

- a generic AI chat demo
- a neon tech dashboard
- a glassmorphism landing page
- a high-saturation startup template

## Visual Non-Negotiables

- Default to light surfaces and warm neutrals.
- Reuse the existing warm paper + ink blue + amber system.
- Prefer borders, spacing, and typography over heavy shadows.
- Keep cards purposeful; do not wrap every block in a card.
- Use low-saturation status backgrounds instead of bright fills.
- Keep motion subtle and businesslike.

## Forbidden Patterns

Do not introduce these unless the user explicitly asks:

- saturated blue-purple gradients
- glowing buttons or glowing outlines
- glass blur panels
- oversized floating rounded cards
- noisy hero collages
- excessive badge clusters
- decorative charts or widgets unrelated to the task

## Layout Rules

- Keep the three-zone workbench logic clear: left navigation, center workspace, right inspector.
- The center column is the calmest and most readable area.
- The right column should support process visibility, not compete with the main task area.
- Use strong section titles and concise support copy.
- Each section should have one clear job.

## Component Rules

- Prefer existing components, classes, and patterns before creating new ones.
- Use existing CSS variables and token names when available.
- Keep radius within the established `10px-12px` range for most surfaces.
- Use primary brand color only for primary actions, active states, and key procedural emphasis.
- Use accent amber sparingly for highlights, evidence emphasis, and select trust cues.
- Inputs should remain bright, quiet, and easy to scan.

## Copy Rules

Prefer legal-business language:

- `事项受理`
- `办理路径`
- `执行记录`
- `工具轨迹`
- `法律依据`
- `风险提示`
- `结构化结论`

Avoid generic AI copy such as:

- `smart assistant`
- `magic results`
- `instant intelligence`
- `AI superpower`

## Workflow

When the user asks for UI creation or refactoring:

1. Read `DESIGN.md`.
2. Inspect the existing page/component styles first.
3. Summarize the intended visual direction in 2-4 bullets before major edits.
4. Reuse existing tokens and patterns.
5. After implementation, self-check:
   - too much card usage?
   - too many colors?
   - too much AI flavor?
   - still consistent with legal SaaS tone?
   - readable on desktop and mobile?

## Output Preference

- Favor clean, implementation-ready UI over exploratory visual experiments.
- If uncertain between "showier" and "calmer", choose the calmer option.
- If a visual flourish harms clarity, remove it.
