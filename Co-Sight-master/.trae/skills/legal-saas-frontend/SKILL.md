---
name: "legal-saas-frontend"
description: "Designs and refines Co-Sight style legal SaaS UI. Invoke when the user asks to build, redesign, polish, review, or restyle frontend pages, layouts, or components."
---

# Legal SaaS Frontend

This skill is for frontend work that must match Co-Sight's intended product register: light-theme, professional, restrained, trustworthy, and procedural. It is especially useful for workbench pages, landing pages, login pages, replay pages, process panels, and result presentation.

## When To Use

Use this skill when:

- the user asks to redesign or beautify a page
- the user says the frontend looks ugly, generic, or too AI-like
- a new page or component needs to match Co-Sight's legal SaaS style
- an existing view needs stronger hierarchy, consistency, or product feel
- the agent is editing React, CSS, or layout files that affect UI

Do not use this skill for backend-only tasks or non-visual refactors.

## Required Setup

Before editing:

1. Read `DESIGN.md` at the project root.
2. Read the target page or component and inspect the existing tokens, CSS variables, and patterns.
3. Preserve compatible parts of the current design language instead of rebuilding from zero.

## Design Thesis

Co-Sight is not a flashy AI demo. It is a legal operations workbench.

The UI must communicate:

- trustworthy legal workflow
- structured process visibility
- evidence-bound reasoning
- disciplined execution
- business-ready product maturity

The UI must avoid:

- saturated startup visuals
- neon or futuristic styling
- over-carded layouts
- random gradients
- generic chatbot aesthetics

## Default Visual Direction

- light background with warm neutrals
- ink-blue primary hierarchy
- restrained amber accents
- strong typography and spacing
- fine borders instead of heavy elevation
- dense but readable workbench layout

## Page Model

### Landing

- show identity, promise, and credibility
- avoid fake dashboard collages in the hero
- keep the first screen clean and intentional

### Login

- calm, bright, and trustworthy
- avoid dark-tech drama unless user explicitly asks

### Workspace

- maintain the three-zone structure: navigation, workspace, inspector
- center column remains the primary work surface
- right column explains steps, tools, evidence, and results

### Replay / History

- emphasize traceability, timeline clarity, and result recoverability

## UI Rules

- Use existing tokens whenever possible.
- Do not invent new colors if existing tokens solve the need.
- Keep most radii within `10px-12px`.
- Primary CTA uses the brand color.
- Accent amber is limited to emphasis and confidence-related details.
- Status blocks use low-saturation semantic fills.
- If removing a card improves clarity, remove the card.
- If a decorative flourish does not improve meaning, delete it.

## Copy Rules

Prefer legal-business terminology:

- `事项受理`
- `办理路径`
- `执行记录`
- `工具轨迹`
- `材料归档`
- `法律依据`
- `风险提示`
- `结构化结论`

Avoid vague assistant-first phrasing:

- `smart AI`
- `magic`
- `instant answer`
- `supercharged workflow`

## Working Process

For each frontend task, follow this order:

1. Write a short visual thesis in one sentence.
2. Identify the page zones and their jobs.
3. Decide which existing components and styles can be reused.
4. Make the smallest set of edits that meaningfully improve hierarchy and consistency.
5. Verify desktop and mobile readability.
6. Run a self-critique before finishing.

## Self-Critique Checklist

Before handing off, check:

- Does the page still feel like a legal SaaS product?
- Is there too much AI flavor?
- Are there too many cards, shadows, or badges?
- Is the color usage restrained and consistent?
- Does the center workspace remain clear?
- Does the right panel support traceability instead of becoming clutter?
- Is the result section credible and structured?

## Output Style

When describing changes to the user:

- explain the visual direction briefly
- point out hierarchy improvements
- call out any remaining tradeoffs or next polish opportunities

When implementing:

- choose calm over flashy
- choose structure over decoration
- choose readability over novelty
