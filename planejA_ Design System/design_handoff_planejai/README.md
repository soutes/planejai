# Handoff: planejAÍ Design System

## Overview

This is the **planejAÍ design system** — brand, tokens, components, iconography, and a high-fidelity recreation of the shipping app. The deliverable is a complete reference package for any developer (human or Claude Code) building new surfaces in the planejAÍ ecosystem: new pages inside the Streamlit app, a future marketing site, slide decks, README assets, etc.

The product is **planejAÍ** — a Brazilian personal-finance + AI-statement-analysis desktop app (Python + Streamlit + SQLite + Plotly + Claude CLI). Repo: [`soutes/planejai`](https://github.com/soutes/planejai).

## About the Design Files

The files in this bundle are **design references** created in HTML/CSS/SVG/JSX — they are specimens and prototypes showing the brand's intended look and feel, **not production code to copy directly**.

The target codebase is **Streamlit (Python)**, with CSS injected via `st.markdown(unsafe_allow_html=True)` (already the pattern in `src/ui.py`). The task for the implementing developer is to:

1. **Read** `colors_and_type.css` and lift the tokens (CSS custom properties) into the project's existing CSS injection block.
2. **Read** `components.css` — it is a 1:1 mirror of the visual contract in `src/ui.py`. New components you add to `src/ui.py` should match these patterns.
3. **Read** `ui_kits/app/` — a React recreation of the shipping UI. Useful as a **visual reference** for component composition and layout, not for direct port. Treat the JSX as design specs, not as code to run in production.
4. **Use** `assets/` directly — the SVG logos, favicon, app icon, and logo CSS class are production-ready. Copy them into the planejai repo's `assets/` (create one if it doesn't exist) and reference from Python.

## Fidelity

**High-fidelity (hifi).** Every color is a final hex value. Typography is committed (Inter via Google Fonts, ExtraBold 800 for display via opsz axis). Spacing, radii, shadows, glow systems are all final. The companion mark is final (two parallel diagonal bars, turquoise).

The implementing developer should match these specs **exactly** when adding new screens or components.

## What's in this bundle

```
design_handoff_planejai/
├── README.md                  # ← you are here
├── SKILL.md                   # Claude Code skill manifest (install in ~/.claude/skills/)
├── colors_and_type.css        # design tokens — CSS custom properties
├── components.css             # component CSS — mirrors src/ui.py exactly
│
├── assets/                    # production-ready brand assets
│   ├── logo-wordmark-{dark,light,app-green,mono-dark,mono-light}.svg
│   ├── logo-mark.svg + mono variants
│   ├── logo-lockup-dark.svg
│   ├── favicon.svg
│   ├── app-icon.svg
│   └── logo.css               # drop-in `.pa-wm` HTML class for inline wordmark
│
├── preview/                   # visual specimens — open in browser to verify
│   ├── brand-*.html
│   ├── colors-*.html
│   ├── type-*.html
│   ├── spacing-*.html
│   ├── component-*.html
│   └── iconography.html
│
└── ui_kits/app/               # React recreation — visual reference, not for port
    ├── README.md
    ├── index.html             # full prototype (Visão Geral + Cartão)
    ├── Sidebar.jsx
    ├── Icons.jsx              # 20+ Lucide-spec inline SVG icons
    ├── Components.jsx         # KPICard, GlowKPI, BigProgress, etc
    ├── Pages.jsx
    └── kit.css
```

---

## Brand

### The name

`planejAÍ` — **lowercase `planej` + UPPERCASE `AÍ`**. Casing is locked. The acute on `Í` is non-negotiable. Never split the two halves onto separate lines.

Double meaning, both intentional:
- **planej + AÍ** → "planeje aí" (Portuguese imperative, "plan now")
- **planej + AI** → artificial intelligence

### Wordmark

- **Font:** Inter, variable, **ExtraBold 800**, with `font-variation-settings: 'opsz' 32` (Inter Display optical cut).
- **Tracking:** `letter-spacing: -0.025em`.
- **Color split:**
  - `planej` → `#eaecef` on dark canvas / `#181a20` on light canvas.
  - `AÍ` → `#2dbdb6` (brand turquoise) in both cases.
- **App-parity variant** (when used in the shipping Streamlit UI today): `AÍ` is `#10F5A3` neon green instead of turquoise.

All SVG wordmarks are in `assets/`. For HTML usage, load `assets/logo.css` and use `<span class="pa-wm">planej<span class="pa-wm__a">AÍ</span></span>`.

### Companion mark

Two parallel diagonal bars going up-right, turquoise. Pure fintech abstraction (trajetória / growth / cash flow). Two paths, scales to 16 px favicon. See `assets/logo-mark.svg`.

---

## Two palettes coexist — read this carefully

| Layer | Accent | Where |
|---|---|---|
| **Brand (new)** | `#2dbdb6` turquoise | Logo, splash, future marketing, app-icon, README |
| **App (shipping)** | `#10F5A3` neon green | Every screen the user sees today in the Streamlit app |

**Working rule for the implementer:**
- New surfaces *inside* the Streamlit app → keep the neon green system. Don't introduce turquoise.
- New brand surfaces (landing page, README hero, slide decks) → use turquoise.
- Source of truth for in-app styling: `src/ui.py` in the planejai repo.

---

## Design Tokens

All tokens defined in `colors_and_type.css` as CSS custom properties under `:root`.

### Brand palette (turquoise)
- `--brand-primary: #2dbdb6` — single brand color
- `--brand-primary-hi: #3dd4cd` — hover
- `--brand-primary-lo: #27a8a2` — pressed
- `--brand-canvas: #0b0e11`
- `--brand-canvas-2: #14181f`
- `--brand-body-dark: #eaecef`
- `--brand-ink: #181a20`
- `--brand-canvas-light: #ffffff`

### App palette (neon green)
- Surfaces: `--app-canvas: #0B0E13`, `--app-canvas-2: #070B13` (sidebar), `--app-card: #10141C`, `--app-card-2: #0D1420`, `--app-card-3: #111827`
- Borders: `--app-border: #1F2530`, `--app-border-soft: #1A2030`
- Accents: `--app-accent: #10F5A3`, `--app-accent-soft: #0FCC88`, `--app-purple: #B07AFF`, `--app-blue: #6FA9D6`, `--app-warn: #FFB347`, `--app-danger: #FF6B7A`, `--app-lime: #A3E635`
- Text (5 levels): `--app-text: #E8ECF2`, `--app-text-2: #C8CDD6`, `--app-text-muted: #8B92A0`, `--app-text-dim: #6E7A8C`, `--app-text-faint: #4E5768`

### Category colors (for charts)
- Alimentação `#FF4B6E`, Assinaturas `#B07AFF`, Compras `#FF8A5C`, Educação `#5EEAD4`, Lazer `#F4A261`, Outros `#5A6273`, Transporte `#6FA9D6`

### Bank colors (for card chips)
- Nubank `#8A05BE`, Itaú `#FF6B00`, Santander `#EC0000`, Bradesco `#CC0000`, Caixa `#006CB5`, Inter `#FF7A00`, C6 `#FFD700`, BTG `#003B70`, PicPay `#21C25E`, BB `#FFCC00`. Full map in `src/page_cartao.py`.

### Type
- **One family — Inter** (Google Fonts, variable, opsz axis 14..32).
- Display (`opsz 32`): wordmark, page titles, KPI values — **weight 800** for wordmark, **700** for page/KPI.
- Body (`opsz 14`): everything else.
- Mono — JetBrains Mono. Dev only.
- Numbers: always `font-variant-numeric: tabular-nums`.

### Spacing scale
4-px base: `--space-1` through `--space-8` (4, 8, 12, 16, 20, 24, 32 px).

### Border radii
- `--radius-sm: 6px`
- `--radius-md: 8px` — buttons, chips
- `--radius-lg: 12px` — exec summary
- `--radius-xl: 14px` — default card (`af-card`)
- `--radius-2xl: 16px` — big progress bar
- `--radius-3xl: 18px` — glow card

### Glow / elevation system
**Never use plain drop shadow.** Elevation = colored `box-shadow` with `0` offset. Defined as tokens:
- `--glow-green-soft: 0 0 8px rgba(16,245,163,0.15)`
- `--glow-green-card: 0 0 24px rgba(16,245,163,0.12), 0 0 60px rgba(16,245,163,0.06)`
- `--glow-green-strong: 0 0 30px rgba(16,245,163,0.40)`
- `--glow-purple`, `--glow-blue`, `--glow-danger`

---

## Components

Spec mirrored from `src/ui.py` and `components.css`. See `preview/component-*.html` for live specimens.

### Sidebar
- **Width:** 220 px fixed.
- **Canvas:** `#070B13` (darker than the page canvas).
- **Brand block:** Inter ExtraBold 800, 30 px (`AÍ` in `#10F5A3`), small uppercase tag below.
- **Month stepper:** chevron buttons + uppercase accent-green month label.
- **Nav rows:** transparent default; hover `#131B28` fill + brighter text; active state = 8% accent fill + 3 px accent left bar + bold weight + accent-tinted icon.
- **Icons:** Lucide-spec inline SVG, 24×24 viewBox, stroke 2, round caps, color `#E8ECF2` (or accent green when active).

### KPI cards
- **Card surface:** 135° linear gradient `#0D1420 → #111827`, 1 px border `#1A2030`, 14 px radius.
- **Border-top:** 3 px solid in the KPI's accent color (signal: green / blue / orange / purple / danger).
- **Label:** 10.5 px, weight 700, uppercase, `letter-spacing: 1px`, color `#4E5768`.
- **Value:** Inter Display 800, 23 px, tabular, color `#E8ECF2`, `letter-spacing: -0.5px`.
- **Sub:** 11 px, weight 500, `#4E5768`, math-fragment style ("receitas − despesas").

### Glow KPI box (`af-glow`)
- 18 px radius, complex multi-layer background (radial gradient + linear gradient + flat fill).
- 1 px ring `rgba(16,245,163,0.25)`.
- Box-shadow: 1 px green inner + 24 px green soft + 60 px green ultra-soft + inset 1 px top white.
- `::before` adds a 1 px linear-gradient top-light line that fades to transparent at both ends.
- Title: 11 px, uppercase, accent color, preceded by a 6 px accent-colored dot with 8 + 16 px green glow.
- Body: grid of cells separated by 1 px white-5% vertical rules.

### Big progress bar (`af-bigbar-card`)
- 16 px radius, 22 × 26 px padding.
- Head: left/right pair — "Gasto no ciclo" (with `R$ X de R$ Y`) and saldo / "Estourou em" (color-coded).
- Track: 14 px tall, 8 px radius, white-4% fill, 1 px white-5% border.
- Fill: gradient from `${color}00` → `${color}66` → `${color}` with 12 + 24 px colored glow.
- Foot: `{pct}% do limite` in accent + right-aligned `Atualizado HH:MM · DD/MM/YYYY`.

### Category progress rows
- Card surface `#10141C` + 14 px radius + 1 px border + 16/22 padding.
- Each row: name + tinted % on top; track 6 px tall; gradient fill (translucent → solid); right side has value + transactions count.
- Rows separated by 1 px white-4% top border.

### Alerts
- Card surface `#10141C` + 1 px border + 8 px radius + 11/14 padding.
- 3 px left-border color: amber `#D4A017` (warn / default), lime `#A3E635` (parcela), danger `#FF6B7A` (duplicidade).
- Inline SVG icon (18 px) in matching color + text + right-aligned tabular value.

### Exec summary
- 12 px radius, 2 px left-accent border, faint radial-gradient background.
- 14 px body text, line-height 1.6, color `#D4D8E0`. Bold spans `<b>` go accent-colored.

### Buttons
Five variants (CSS in `components.css`):
1. **Primary** — 180° accent gradient, dark text, 20 px green glow.
2. **Ajustar** — 5% accent fill + 45% accent border + accent text.
3. **Ghost** — transparent + 40% accent border + accent text.
4. **Danger** — 5% danger fill + 45% danger border + danger text.
5. **Secondary** — transparent + border + muted text.

### Section heads
- 4 × 16 px colored bar (linear gradient + glow) + uppercase title (15 px, weight 700, letter-spacing 0.6).
- Bar color matches the section's data context.

### Charts (Plotly dark theme)
Source: `src/charts.py`. Specifics in `preview/component-charts.html`.
- **Donut:** hole=0.62, `#0B0E13` 2 px stroke between slices, in-slice white % labels, legend on right, total in center.
- **Glow line:** spline, 3-layer halo (widths 14/7/3.5 with opacities 0.08/0.20/0.45), 2 px crisp line, `tozeroy` fill with 22% → 0% accent gradient, markers w/ `#08120D` 2-px ring.
- **Stacked bars:** per-category, fixed legend order from `CATEGORY_COLORS`.

---

## Iconography

Three layers, in order of preference:

1. **Inline SVG glyphs.** Lucide spec — 24×24 viewBox, stroke 2 px, round caps & joins, color `currentColor` (defaults to `#E8ECF2`). The shipping app declares 7 in `src/ui.py` as constants (`ICON_CARD`, `ICON_UPLOAD`, etc.). When you need a new glyph, **pull from [Lucide](https://lucide.dev)** and follow the same spec.

2. **Functional emoji.** Navigation, page heads, category labels: 🏠 💰 📅 💳 📈 ⚙️ ✏️ 💾 🗑 ➕ ✕ ⚠️. **One emoji per label**, always at the start, never decorative.

3. **Unicode for state.** `▲ ▼ ◀ ▶ ▸ — ✕ +`.

No icon fonts. No PNG sprites. No custom illustrations.

---

## Content fundamentals

- **Brazilian Portuguese**, casual but precise. "Você", never "o usuário".
- **UPPERCASE labels** for tiny meta lines (10–11 px, weight 700, letter-spacing 0.7–1.2).
- **Sentence case** for everything user-facing. Title Case not used.
- **Currency:** always `R$ 1.234,56` pt-BR formatted, tabular, weight 500–800.
- **Dates:** `DD/MM/YYYY`. Months in PT (`Janeiro`, `Fevereiro`) on page titles, abbreviated (`Jan`, `Fev`) on chart axes.
- Action button labels: verb + glyph + double-space + label. e.g. `💾  Salvar`, `🗑  Remover`, `➕  Adicionar Cartão`.

---

## Assets

All under `assets/`. Production-ready SVG.

- `logo-wordmark-dark.svg` — primary (canvas dark, `AÍ` in turquoise)
- `logo-wordmark-light.svg` — reversed (canvas light)
- `logo-wordmark-app-green.svg` — neon-green variant (matches shipping app)
- `logo-wordmark-mono-dark.svg`, `logo-wordmark-mono-light.svg` — single ink
- `logo-mark.svg` — companion mark, turquoise
- `logo-mark-mono-dark.svg`, `logo-mark-mono-light.svg` — single ink
- `logo-lockup-dark.svg` — mark + wordmark, horizontal
- `favicon.svg` — companion mark on transparent
- `app-icon.svg` — companion mark on rounded dark square (512×512 base)
- `logo.css` — drop-in HTML wordmark class (`.pa-wm`, `.pa-wm__a`, variants for light / app-green / mono)

## Files in the planejai repo this design system tracks

| File in `soutes/planejai` | What this handoff documents |
|---|---|
| `app.py` | Sidebar, month stepper, Visão Geral KPI row, Configurações |
| `src/ui.py` | CSS injection + component helpers — source of truth for theme |
| `src/charts.py` | Plotly dark theme + category colors + glow line/bar charts |
| `src/page_cartao.py` | Cartão de Crédito (analyzer + acompanhamento + tendências) |
| `src/page_despesas.py` | Despesas (split, parcelamento, recorrência, orçamentos) |
| `src/page_rendimentos.py` | Rendimentos (lançamentos + recorrência + histórico) |
| `src/page_investimentos.py` | Investimentos (snapshot mensal por categoria) |
| `design-brief.md` | Original brand brief (turquoise spec) |

---

## How to install as a Claude Code skill

This bundle is also a self-contained Claude Code Agent Skill — `SKILL.md` is at the root with the proper frontmatter. To install:

**User-scoped (any project):**
```bash
mkdir -p ~/.claude/skills/planejai-design
# unzip this bundle here
```

**Project-scoped (inside the planejai repo):**
```bash
cd path/to/planejai
mkdir -p .claude/skills/planejai-design
# unzip this bundle here
git add .claude/skills && git commit -m "Add planejai-design skill"
```

Then in Claude Code:
```
Use o skill planejai-design para adicionar uma nova página de Metas em src/page_metas.py
```

The skill auto-loads `SKILL.md` → `README.md` → component CSS / tokens / UI kit as needed.
