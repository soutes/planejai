---
name: planejai-design
description: Use this skill to generate well-branded interfaces and assets for planejAÍ (a Brazilian personal-finance + AI-statement-analysis app), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill first — it covers product
context, the two coexisting palettes (brand turquoise vs app neon green),
content fundamentals, visual foundations, and iconography. Then explore
the other available files:

- `colors_and_type.css` — every color, font, radius, spacing, and glow
  token, ready to import.
- `components.css` — copy-paste-ready CSS for the app's cards, KPI box,
  big progress bar, alerts, buttons, sidebar nav. Faithful to
  `src/ui.py` in the live repo.
- `assets/` — logo wordmark + companion mark in 8+ variants, plus the
  `logo.css` drop-in class.
- `preview/` — one HTML card per concept. Open in a browser to see live
  specimens.
- `ui_kits/app/` — high-fidelity React recreation of the Streamlit app
  (Visão Geral + Cartão de Crédito with 3 tabs + placeholders).

When creating visual artifacts (slides, mocks, throwaway prototypes,
landing pages, READMEs, etc), **copy the relevant assets out** of this
folder into your output folder and create static HTML files. Use the
turquoise brand system for new marketing / branded surfaces; use the
neon-green app system for anything that has to live alongside the
shipping Streamlit app.

When working on **production code** (Streamlit Python or otherwise), copy
the tokens from `colors_and_type.css` into your stylesheet and read the
component patterns in `components.css` + `src/ui.py` to become an expert
in the brand. Match copy in Portuguese, casing (`planejAÍ` is locked),
and currency formatting (`R$ 1.234,56`, tabular, weight 500–800).

If the user invokes this skill without any other guidance, ask them what
they want to build or design (a new page in the app? a marketing page? a
slide deck? an icon?), ask 2–3 questions about scope and content, and
act as an expert designer who outputs HTML artifacts _or_ production
code, depending on the need.
