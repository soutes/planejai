# DESIGN SYSTEM v2.0 — planejAÍ Visual Refactor

> Documento de handoff para `frontend-refactor-agent`.
> Fonte de verdade: `Planejai V2_Design/design_handoff_saldo_hero_dashboard/README.md`.
> NÃO introduzir novas features, rotas ou campos de dados — refactor visual puro.

---

## 1. Typography

### Font Families

```css
/* v2 uses Inter exclusively for UI. JetBrains Mono for numeric values only. */
--font-ui:   'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
```

**Breaking change from v1:** `--font-display` (Bricolage Grotesque) and `--font-body` (Plus Jakarta Sans) are **removed**. Inter replaces both for all UI text. `layout.tsx` must be updated to load Inter instead.

Load Inter via Next.js font loader with `opsz` axis:
```
Inter({ subsets: ['latin'], variable: '--font-ui', weight: ['400','500','600','700','800'] })
```

### Type Scale Classes

All classes target `font-family: var(--font-ui)` unless noted.

| Class | Weight | Size | Letter-spacing | Line-height | Notes |
|-------|--------|------|----------------|-------------|-------|
| `.t-page-title` | 600 | 28px | -0.02em | 1.1 | Page H1 |
| `.t-h2` | 600 | 20px | — | — | Section heading |
| `.t-h3` | 500 | 16px | — | — | Sub-section |
| `.t-kpi-hero` | 700 | 64px | -0.035em | 0.95 | Hero saldo number |
| `.t-kpi` | 700 | 22px | -0.02em | 1 | Mini KPI value |
| `.t-eyebrow` | 500 | 11px | +0.10em | — | UPPERCASE label above KPIs/cards |
| `.t-body` | 400 | 14px | — | 1.6 | Body text, descriptions |
| `.t-caption` | 400/500 | 12px | — | — | Secondary meta text |
| `.t-label` | 700 | 10–11px | +1px (0.06em) | — | UPPERCASE small labels |
| `.t-mono` | 500 | 12px | — | — | JetBrains Mono, tabular-nums |

**Rule:** `font-variant-numeric: tabular-nums` on **all** currency values, percentages, and dates. No exceptions.

### CSS Implementation

```css
.t-page-title {
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 28px;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--ink);
}
.t-h2 {
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 20px;
  color: var(--ink);
}
.t-h3 {
  font-family: var(--font-ui);
  font-weight: 500;
  font-size: 16px;
  color: var(--ink);
}
.t-kpi-hero {
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 64px;
  letter-spacing: -0.035em;
  line-height: 0.95;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.t-kpi {
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.02em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.t-eyebrow {
  font-family: var(--font-ui);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.t-body {
  font-family: var(--font-ui);
  font-weight: 400;
  font-size: 14px;
  line-height: 1.6;
}
.t-caption {
  font-family: var(--font-ui);
  font-weight: 400;
  font-size: 12px;
}
.t-label {
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.t-mono {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
```

---

## 2. Color System

### 2a. Global Surface Tokens (New)

These replace the old `--app-canvas / --app-card / --app-border` system.

```css
:root {
  --bg:      #0D0F0E;   /* global canvas — body background */
  --surface: #161918;   /* card / panel surface */
  --line:    #1E2220;   /* border / divider */
  --line-strong: #2A2F2C; /* stronger divider */

  --ink:   #FFFFFF;                    /* primary text */
  --ink-2: rgba(255,255,255,0.70);     /* secondary text (descriptions) */
  --ink-3: rgba(255,255,255,0.40);     /* muted text (labels, meta) */
  --ink-4: rgba(255,255,255,0.25);     /* faint (placeholders) */
  --ink-5: rgba(255,255,255,0.12);     /* very faint (disabled, empty tracks) */
}
```

**Mapping from old tokens:**

| Old | New |
|-----|-----|
| `--app-canvas` `#0B0E13` | `--bg` `#0D0F0E` |
| `--app-canvas-2` `#070B13` | `--bg` (same — sidebar uses `--bg` in v2) |
| `--app-card` `#10141C` | `--surface` `#161918` |
| `--app-card-2` `#0D1420` | removed — no gradients in v2 |
| `--app-card-3` `#111827` | removed |
| `--app-border` `#1F2530` | `--line` `#1E2220` |
| `--app-border-soft` `#1A2030` | `--line` |
| `--app-text` `#E8ECF2` | `--ink` `#FFFFFF` |
| `--app-text-2` `#C8CDD6` | `--ink-2` |
| `--app-text-muted` `#8B92A0` | `--ink-3` |
| `--app-text-dim` `#6E7A8C` | `--ink-3` |
| `--app-text-faint` `#4E5768` | `--ink-4` |

### 2b. Section Accent System — CORE of v2

Every primary navigation section owns an accent color. This accent drives:
1. Sidebar active nav pill background + icon color
2. Hero card background gradient
3. Hero card border
4. Hero chart stroke + fill gradient
5. Focus borders on interactive elements

**Implementation:** `[data-section]` attribute on `<body>` or `<div.app-shell>`. Set via Next.js `pathname` hook.

```css
/* Default (fallback) */
:root {
  --section-accent:       #12A09E;
  --section-hero-bg:      #0B2926;
  --section-hero-border:  rgba(18,160,158,0.28);
  --section-pill-bg:      rgba(18,160,158,0.15);
}

[data-section="dashboard"] {
  --section-accent:       #12A09E;
  --section-hero-bg:      #0B2926;
  --section-hero-border:  rgba(18,160,158,0.28);
  --section-pill-bg:      rgba(18,160,158,0.15);
}

[data-section="despesas"] {
  --section-accent:       #D93232;
  --section-hero-bg:      #2D0A0A;
  --section-hero-border:  rgba(217,50,50,0.30);
  --section-pill-bg:      rgba(217,50,50,0.15);
}

[data-section="rendimentos"] {
  --section-accent:       #5B996A;
  --section-hero-bg:      #0E2414;
  --section-hero-border:  rgba(91,153,106,0.32);
  --section-pill-bg:      rgba(91,153,106,0.15);
}

[data-section="cartao"] {
  --section-accent:       #F2811D;
  --section-hero-bg:      #2E1A06;
  --section-hero-border:  rgba(242,129,29,0.32);
  --section-pill-bg:      rgba(242,129,29,0.15);
}

[data-section="investimentos"] {
  --section-accent:       #7B6EF5;
  --section-hero-bg:      #1A1A3A;
  --section-hero-border:  rgba(123,110,245,0.32);
  --section-pill-bg:      rgba(123,110,245,0.15);
}

[data-section="gestao"] {
  /* Gestão accent used for pill/icons only — never as large fill */
  --section-accent:       #E3F272;
  --section-hero-bg:      #0D0F0E; /* = --bg, no hero fill */
  --section-hero-border:  rgba(227,242,114,0.20);
  --section-pill-bg:      rgba(227,242,114,0.15);
}
```

**Section → Route mapping:**

| Route | `data-section` | Accent |
|-------|---------------|--------|
| `/dashboard` | `dashboard` | `#12A09E` teal |
| `/despesas` | `despesas` | `#D93232` red |
| `/rendimentos` | `rendimentos` | `#5B996A` green |
| `/cartao` | `cartao` | `#F2811D` orange |
| `/investimentos` | `investimentos` | `#7B6EF5` purple |
| `/gestao` | `gestao` | `#E3F272` lime |
| `/relatorio` | `gestao` | `#E3F272` lime (borrows gestão) |

### 2c. Semantic Color Tokens (Retained)

These remain from v1, still valid for data visualization:

```css
/* Positive/negative delta */
--color-positive: #5B996A;   /* = rendimentos accent */
--color-negative: #D93232;   /* = despesas accent */
--color-negative-text: #E66666; /* slightly lighter for negative pill text */

/* Bank colors — unchanged */
--bank-nubank:    #8A05BE;
--bank-itau:      #FF6B00;
--bank-santander: #EC0000;
--bank-bradesco:  #CC0000;
--bank-caixa:     #006CB5;
--bank-inter:     #FF7A00;
--bank-c6:        #FFD700;
--bank-btg:       #003B70;
--bank-picpay:    #21C25E;
--bank-bb:        #FFCC00;

/* Category colors — unchanged for charts */
--cat-alimentacao: #FF4B6E;
--cat-assinaturas: #B07AFF;
--cat-compras:     #FF8A5C;
--cat-educacao:    #5EEAD4;
--cat-lazer:       #F4A261;
--cat-outros:      #5A6273;
--cat-transporte:  #6FA9D6;
--cat-saude:       #34D399;
--cat-casa:        #60A5FA;
--cat-vestuario:   #F472B6;
--cat-pets:        #FBBF24;
--cat-viagem:      #A78BFA;
--cat-presente:    #FB7185;
--cat-cartao:      #94A3B8;
```

---

## 3. Elevation & Shadow — FLAT DESIGN

**Zero shadows. Zero glows.**

The entire `--glow-*` token family and `box-shadow` on card components is **removed** in v2. Containment is communicated exclusively via `1px solid var(--line)` borders.

**Remove from `tokens.css`:**
```
--glow-green-soft
--glow-green-card
--glow-green-strong
--glow-purple
--glow-blue
--glow-danger
--shadow-flat
```

**Remove from component classes:**
- `.af-glow` — remove entirely (KpiCard `glow` prop becomes no-op or removed)
- `.af-btn--primary` `box-shadow` — remove
- `.gf-kpi` gradient background — flatten to `background: var(--surface)`
- `.af-exec` radial gradient — flatten

---

## 4. Spacing

4px base grid. Use these values — not arbitrary numbers:

`4, 6, 8, 10, 12, 14, 16, 18, 22, 24, 28, 40, 64` px

Key layout values:
- **Main content padding:** `28px 40px 64px` (top / sides / bottom)
- **Card padding:** `18px` (mini KPI), `22px` (panel/table), `24px` (hero)
- **Section gap (between major rows):** `16px`
- **Sidebar padding:** `18px 10px`
- **Logo margin-bottom:** `12px`
- **Nav item gap:** `4px`

---

## 5. Border Radii

```css
--radius-pill:   999px;  /* pill, chip, delta pill, progress track */
--radius-nav:     10px;  /* nav item, logo mark */
--radius-card:    16px;  /* card, panel, chart card, modal */
--radius-input:    8px;  /* input, button, badge */
```

**Remove old radius tokens** `--radius-sm` `--radius-lg` `--radius-xl` `--radius-2xl` `--radius-3xl` — replace with the 4 above.

---

## 6. Sidebar v2

**Breaking change: 60px wide (was 220px)**

```
Width:         60px
Background:    var(--bg)      /* #0D0F0E */
Border-right:  1px solid var(--line)
Padding:       18px 10px
Position:      sticky; top: 0; height: 100vh
```

### Logo Mark
```
Size:           40 × 40px
Border-radius:  10px  (--radius-nav)
Background:     #FFFFFF
Glyph:         "p"
Font:           Inter 700, 18px, letter-spacing -0.04em
Color:          #0D0F0E
Margin:         0 auto 12px
```

### Nav Items
```
Size:            40 × 40px
Border-radius:   10px  (--radius-nav)
Layout:          margin: 0 auto  (centered in 60px column)
Gap between:     4px
```

**States:**
| State | Icon color | Background |
|-------|-----------|------------|
| Default | `rgba(255,255,255,0.35)` | transparent |
| Hover | `rgba(255,255,255,0.70)` | `rgba(255,255,255,0.04)` |
| Active | `var(--section-accent)` | `var(--section-pill-bg)` |

**Icon spec:** Lucide icons, `size={20}`, `strokeWidth={1.6}`, `stroke="currentColor"`. No labels — use `title` attribute on each `<Link>` for accessibility.

**No text labels.** The v1 text labels are removed. The sidebar is icon-only.

### Nav Order
1. Dashboard — `LayoutDashboard`
2. Despesas — `TrendingDown`
3. Rendimentos — `TrendingUp`
4. Cartão — `CreditCard`
5. Investimentos — `PieChart`
6. Gestão — `Settings`
7. Relatório — `FileText` (bottom, after spacer)

### `--sidebar-width` token
Change from `220px` → `60px` in `tokens.css`.

---

## 7. Hero Card Spec (Dashboard)

The dominant component on `/dashboard`. Full spec:

```
Background:     var(--section-hero-bg)
Border:         1px solid var(--section-hero-border)
Border-radius:  16px  (--radius-card)
Padding:        24px
Overflow:       hidden  (chart bleeds to edges)
Grid:           1.6fr 1fr  (hero + mini-KPI stack)
```

### Top Row (hero-row)
```
Display:          flex; justify-content: space-between; align-items: center
Label text:       "SALDO DO MÊS · [mesRef]"
Label style:      Inter 500, 11px, letter-spacing +0.1em, uppercase
                  color: rgba(255,255,255,0.55)
Delta pill:       see §10 Delta Pill
```

### Big Number
```
margin-top: 18px
Container:   flex; align-items: baseline; gap: 8px

Prefix "R$":  Inter 500, 22px, color rgba(255,255,255,0.55)
Integer:      Inter 700, 64px, color #FFFFFF, line-height 0.95, letter-spacing -0.035em
Cents ",XX":  Inter 500, 24px, color rgba(255,255,255,0.55), letter-spacing -0.01em
All numbers:  font-variant-numeric: tabular-nums
```

### Description
```
margin-top: 14px
max-width:  600px
Style:      Inter 400, 14px, color rgba(255,255,255,0.70)
Bold spans <b>: color #FFFFFF, weight 600
```

### Embedded 12-month Area Chart
```
margin-top:   22px
Height:       140px
Width:        100% (full card width)
Stroke:       var(--section-accent), stroke-width 1.8
Fill:         vertical linear-gradient:
              from [section-accent] at 45% opacity (top)
              to   transparent (bottom)
No axes, no grid lines, no labels inside chart.
Month labels: 12-column grid below chart
              Inter 500, 10px, uppercase, +0.06em letter-spacing
              color rgba(255,255,255,0.30), centered
```

---

## 8. Mini KPI Card Spec

Used in the right column of the dashboard hero row (3 stacked).

```
Background:    var(--surface)     /* #161918 */
Border:        1px solid var(--line)
Border-radius: 16px
Padding:       18px
Inner grid:    1fr 130px  (text + sparkline)
Inner gap:     14px
```

### Header Row
```
Display:  flex; align-items: center; gap: 10px; margin-bottom: 8px
Label:    Inter 500, 11px, uppercase, +0.1em, color rgba(255,255,255,0.40)
Pill:     see §10 Delta Pill
```

### Value
```
Style:   Inter 700, 22px, letter-spacing -0.02em, tabular-nums, line-height 1
Color:   varies per KPI (rendimentos: #5B996A, despesas: #D93232, patrimônio: #FFFFFF)
```

### Sub text
```
Style:   Inter 400, 11.5px, color rgba(255,255,255,0.40), margin-top 8px
```

### Sparkline
```
SVG:         130 × 46px
Stroke-width: 1.6
Fill:        none
Stroke color: matches KPI color
```

---

## 9. 3-up Breakdown Panel Spec

Used below the hero row: Por Aba | Por Categoria | Cartões.

```
Background:    var(--surface)
Border:        1px solid var(--line)
Border-radius: 16px
Padding:       22px
```

### Panel Head
```
Display:      flex; justify-content: space-between; margin-bottom: 18px
Left:         Lucide icon (16×16, color rgba(255,255,255,0.40))
              + label (Inter 500, 11px, uppercase, +0.1em, rgba(255,255,255,0.40))
Right:        Inter 400, 12px, rgba(255,255,255,0.40)
              <b> for the number: color rgba(255,255,255,1), weight 600
```

### Horizontal Bar Row (Por Aba / Por Categoria)
```
Row top line:  flex; justify-content: space-between
  Name:        rgba(255,255,255,0.70), 13px
  Value:       Inter 500, 13px, #FFFFFF
  Percentage:  rgba(255,255,255,0.40), 11px (appended to value)
Track:         4px tall, rgba(255,255,255,0.06), border-radius 999px
Fill:          same height, full radius, colored per section
Row gap:       14px between rows
Empty rows:    opacity: 0.35
```

### Card List (Cartões)
```
Each card item:
  Row 1 (flex, space-between, baseline, margin-bottom: 6px):
    Left: 7×7 dot (card color) + name (#FFFFFF, 13px) + "···· XXXX" (rgba(.40), 12px, tabular-nums)
    Right: amount (Inter 500, 13px, #FFFFFF, tabular-nums)
  Track: 4px, rgba(255,255,255,0.06), radius 999px
  Fill: card color, width = used/limit
  Meta: Inter 400, 10.5px, uppercase, +0.08em, rgba(255,255,255,0.40)
        e.g. "19% · FECHA EM 13D"
```

---

## 10. Delta Pill Spec

```
Padding:       3px 9px
Border-radius: 999px
Font:          Inter 600, 11px, tabular-nums
Arrow span:    10px width, opacity 0.85
```

**Positive (default, uses section accent):**
```
Background:   rgba(ACCENT, 0.18)
Border:       1px solid rgba(ACCENT, 0.35)
Color:        var(--section-accent)
```

**Negative:**
```
Background:   rgba(217,50,50,0.16)
Border:       1px solid rgba(217,50,50,0.32)
Color:        #E66666
```

---

## 11. Button Spec v2

All buttons: `Inter 700, 13.5px`, `padding: 10px 22px`, `border-radius: 8px`, `transition: all 0.15s ease`.

**No glows. No box-shadows.**

| Variant | Background | Border | Color |
|---------|-----------|--------|-------|
| `primary` | `var(--section-accent)` | none | dark contrast (#08120D or #FFFFFF depending on section) |
| `ghost` | transparent | `1px solid rgba(ACCENT, 0.40)` | `var(--section-accent)` |
| `danger` | transparent | `1px solid rgba(217,50,50,0.45)` | `#D93232` |
| `secondary` | transparent | `1px solid var(--line)` | `var(--ink-3)` |

**Hover states** (subtle, no glow):
- primary: slightly lighter bg tint
- ghost: `background: rgba(ACCENT, 0.06)`
- danger: `background: rgba(217,50,50,0.06)`
- secondary: `background: rgba(255,255,255,0.04)`

**Disabled:** `opacity: 0.35`, `cursor: not-allowed`

---

## 12. Form / Input Spec v2

```
Background:    rgba(255,255,255,0.04)
Border:        1px solid var(--line)
Border-radius: 8px
Color:         var(--ink)
Font:          Inter 400, 14px
Padding:       9px 12px

Focus:
  border-color: var(--section-accent)
  NO glow ring (was: box-shadow 0 0 0 2px rgba(accent,0.12) — REMOVE)

Placeholder:   color var(--ink-4)
```

---

## 13. PersonaTabs (Luiz / Lili / Familiar)

Pill row below PageHeader:

```
Display:       flex; gap: 8px; margin-bottom: 20px
Each pill:     Inter 500, 13px, padding: 7px 16px, border-radius: 999px

Inactive:  color rgba(255,255,255,0.40), no bg, no border
Active:    color #FFFFFF, bg rgba(255,255,255,0.06), border 1px solid rgba(255,255,255,0.12)
```

---

## 14. Chart Card (Full-width)

Same chassis as 3-up panels (`--surface / --line / 16px / 22px`).

### Chart Head
```
Display:      flex; justify-content: space-between; margin-bottom: 18px
Left:         icon (16×16) + title (Inter 500, 11px, uppercase, +0.1em, rgba(.40))
Right:        legend items — gap 16px
              Each: 14×3 swatch + label (Inter 400, 12px, rgba(.70))
```

### Area Chart
```
Height:       220px
Two smooth area curves (Recharts AreaChart):
  Rendimentos: stroke #5B996A, stroke-width 1.8
               fill: gradient #5B996A at 32% → 0%
  Despesas:    stroke #D93232, stroke-width 1.8
               fill: gradient #D93232 at 32% → 0%
Baseline:     single hairline rgba(255,255,255,0.08), stroke-width 1
No grid lines, no axis labels inside chart
```

---

## 15. Layout Shell v2

```css
/* tokens.css */
--sidebar-width: 60px;  /* was 220px */

/* globals.css */
.app-shell {
  display: grid;
  grid-template-columns: 60px 1fr;
  min-height: 100vh;
}

.app-sidebar {
  width: 60px;
  background: var(--bg);
  border-right: 1px solid var(--line);
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 0;
  z-index: 10;
}

.app-main {
  margin-left: 60px;  /* was var(--sidebar-width) = 220px */
  padding: 28px 40px 64px;  /* was 32px 40px */
}
```

---

## 16. Component States

| State | Treatment |
|-------|-----------|
| hover | `background: rgba(255,255,255,0.04)` — no color change to text |
| focus | `border-color: var(--section-accent)` — NO glow ring |
| disabled | `opacity: 0.35` |
| loading | `.spinner` with `border-top-color: var(--section-accent)` |

---

## 17. Spinner

```css
.spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.12);
  border-top-color: var(--section-accent);  /* was: --app-accent */
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
```

---

## 18. Number Formatting

- Currency: `R$ 1.234,56` — Brazilian locale `pt-BR`, always with currency symbol
- Render pattern for hero: `R$` + integer + `,` + cents as separate spans with different styles
- All: `font-variant-numeric: tabular-nums`

---

## 19. What NOT to Change

- All behavioral props/logic of components (sorting, filtering, CRUD, API calls)
- API routes and data shapes
- Recharts chart types (BarChart, LineChart, AreaChart, PieChart) — only update colors
- Category colors `--cat-*` (used by charts)
- Bank colors `--bank-*`
- `formatMoney()` utility in MoneyValue.tsx
- `MoneyValue` component props
- Modal behavior (Escape key, backdrop click)
- Form validation logic
- `DataTable` columns/rows props
- PersonaContext and persona filtering logic

---

## 20. Summary of Breaking Changes

| Area | v1 | v2 |
|------|----|----|
| Font stack | Bricolage Grotesque + Plus Jakarta Sans | Inter only |
| Sidebar width | 220px with labels | 60px icon-only |
| Elevation | Glow box-shadows | None — borders only |
| Canvas bg | `#0B0E13` | `#0D0F0E` |
| Surface bg | `#10141C` (gradient) | `#161918` (flat) |
| Primary accent | `#10F5A3` (neon green) | `var(--section-accent)` (per-page) |
| Active nav style | left-border + green text | pill bg + icon color |
| Focus rings | Green glow ring | Section accent border only |
| KPI values | `--app-text` white | Per-KPI color (green/red/white) |
| Card bg | Gradient `#0D1420→#111827` | Flat `#161918` |
