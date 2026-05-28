# Handoff: planejAí — Dashboard "Saldo Hero"

## Overview

This is the visual redesign of the **Dashboard** screen for planejAí (personal finance app for Brazilian families). It uses a **"Saldo Hero"** layout — the Saldo do Mês card dominates the top of the page; the other three KPIs (Rendimentos, Despesas, Patrimônio) sit beside it as a vertical stack of smaller cards.

The color treatment follows the **section-accent system** (v3 redesign): every primary nav section owns an accent color; on the Dashboard screen that color is teal `#12A09E`. The active sidebar pill, the hero card background, the hero border, and the hero chart curve all share that accent. Switching to another section (Despesas, Rendimentos, etc.) shifts those four surfaces to that section's color without changing anything else.

**Scope:** desktop-first, dark mode only. No new features — visual redesign only.

## About the Design Files

The file in this bundle (`saldo-hero-dashboard.html`) is a **design reference created in HTML** — a prototype showing the intended look and behavior, not production code to copy directly. The task is to **recreate this HTML design in the target codebase's existing environment** (React, Vue, Next.js, etc.) using its established patterns, design tokens, charting library, and icon set. If no environment exists yet, pick the most appropriate framework and implement there.

The HTML is a static reference — the React/JSX in the original explorations (`dash-v3-v4.jsx`, `charts.jsx`, etc.) is illustrative and uses bespoke chart components. The handoff reference inlines the same chart math directly into SVG so the developer can swap in their preferred charting library (Recharts, Visx, Chart.js, etc.) without re-engineering the layout.

## Fidelity

**High-fidelity (hifi).** Pixel-perfect mockup with final colors, typography, spacing, and interactions. Recreate this layout using the codebase's existing UI primitives where they map; for anything missing (e.g. the hero card treatment), implement to the exact values below.

## Layout — at a glance

```
┌────┬──────────────────────────────────────────────────────────────────┐
│ s  │ Dashboard                                          ‹ Jun 2026 ›  │
│ i  │ Resumo financeiro · Jun 2026                                     │
│ d  │ ─────────────────────────────────────────────────────────────────│
│ e  │ [Luiz] (Lili) (Familiar)                                         │
│ b  │ ─────────────────────────────────────────────────────────────────│
│ a  │ ┌───────────────────────────────────┬───────────────────────┐    │
│ r  │ │  HERO — Saldo do Mês              │  Rendimentos    ↗     │    │
│    │ │  R$ 5.014,31 (64px)               │  R$ 5.900,00          │    │
│ 60 │ │  +85% acima da meta…              │  3 fontes             │    │
│ px │ │  [embedded 12-month area chart]   ├───────────────────────┤    │
│    │ │                                   │  Despesas       ↘     │    │
│    │ │                                   │  −R$ 885,69           │    │
│    │ │                                   │  2 categorias         │    │
│    │ │                                   ├───────────────────────┤    │
│    │ │                                   │  Patrimônio     ↗     │    │
│    │ │                                   │  R$ 47.820,45         │    │
│    │ │                                   │  5 classes            │    │
│    │ └───────────────────────────────────┴───────────────────────┘    │
│    │ ┌───────────────┬───────────────┬───────────────┐                │
│    │ │  Por aba      │  Por categoria│  Cartão em uso│                │
│    │ │  [hbars]      │  [hbars]      │  [card list]  │                │
│    │ └───────────────┴───────────────┴───────────────┘                │
│    │ ┌─────────────────────────────────────────────────────────────┐  │
│    │ │  Receita vs Despesa · 12 meses                              │  │
│    │ │  [dual area chart, full width]                              │  │
│    │ └─────────────────────────────────────────────────────────────┘  │
└────┴──────────────────────────────────────────────────────────────────┘
```

- **App shell:** CSS grid `60px 1fr` — sidebar + main content.
- **Main padding:** `28px 40px 64px`.
- **Section gap (between major rows):** `16px`.

## Screens / Views

### 1. Sidebar (fixed left, 60px collapsed)

| Property | Value |
|---|---|
| Width | `60px` |
| Background | `#0D0F0E` (global dark) |
| Border-right | `1px solid #1E2220` |
| Padding | `18px 10px` |
| Position | `sticky; top: 0; height: 100vh` |
| Item gap | `4px` |

**Logo (top):**
- 40×40, border-radius `10px`
- Background `#FFFFFF`, glyph `p` in `#0D0F0E`
- Weight 700, font-size 18px, letter-spacing `-0.04em`
- `margin: 0 auto 12px`

**Nav items:**
- 40×40, border-radius `10px`, centered with `margin: 0 auto`
- Default icon color: `rgba(255,255,255,0.35)`
- Hover icon color: `rgba(255,255,255,0.70)`
- **Active state:** background `rgba(18,160,158,0.15)` (= section accent at 15% opacity), icon `#12A09E` (section accent at 100%)
- Icons: 20×20, outline, `stroke-width: 1.6`, `stroke-linecap: round`, `stroke-linejoin: round`
- No labels (collapsed). Use a tooltip on hover if your design system has one.

**Order:** Dashboard → Despesas → Rendimentos → Cartão → Investimentos → Gestão → (spacer) → Profile/Settings at bottom.

### 2. Header

- **Flex row,** `align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 28px`

**Left:**
- Title `Dashboard` — Inter 600, 28px, letter-spacing `-0.02em`, line-height `1.1`, color `#FFFFFF`
- Subtitle `Resumo financeiro · Jun 2026` — Inter 400, 13px, color `rgba(255,255,255,0.40)`, `margin-top: 6px`

**Right — month navigation:**
- Inline `‹  Jun 2026  ›`
- Chevron buttons: `padding: 6px`, `border: 0`, `background: transparent`, icon color `rgba(255,255,255,0.40)`, hover `#FFFFFF`. Icon: 16×16, `stroke-width: 1.6`.
- Label: Inter 500, 13px, `min-width: 86px`, centered.
- No surrounding border — minimal chevrons + text.

### 3. Tabs (Luiz / Lili / Familiar)

- Pill row below the header, `gap: 8px; margin-bottom: 20px`
- Each pill: Inter 500, 13px, `padding: 7px 16px`, `border-radius: 999px`
- **Inactive:** color `rgba(255,255,255,0.40)`, no background, transparent border
- **Active:** color `#FFFFFF`, background `rgba(255,255,255,0.06)`, border `1px solid rgba(255,255,255,0.12)`
- On load, **Luiz** is active.

### 4. Top grid — Hero + mini-stack

CSS grid `grid-template-columns: 1.6fr 1fr; gap: 16px`.

#### 4a. Hero card — Saldo do Mês

| Property | Value |
|---|---|
| Background | `#0B2926` |
| Border | `1px solid rgba(18,160,158,0.28)` |
| Border-radius | `16px` |
| Padding | `24px` |
| Overflow | `hidden` (chart bleeds inside) |

**Top row** (`hero-row`): flex, space-between, align-items center.

- **Label** — `Saldo do mês · Jun 2026`
  - Inter 500, 11px, letter-spacing `0.1em`, uppercase
  - Color `rgba(255,255,255,0.55)`
- **Delta pill** — `↑ +85% vs meta`
  - `padding: 3px 9px`, `border-radius: 999px`
  - Background `rgba(18,160,158,0.18)`, border `1px solid rgba(18,160,158,0.35)`
  - Color `#12A09E`, Inter 600, 11px, font-variant-numeric `tabular-nums`
  - Arrow span: 10px, opacity 0.85

**Big number** (`margin-top: 18px`):
- Container: flex, `align-items: baseline`, `gap: 8px`
- `R$` prefix: Inter 500, 22px, color `rgba(255,255,255,0.55)`
- Integer `5.014`: Inter 700, 64px, color `#FFFFFF`, line-height `0.95`, letter-spacing `-0.035em`
- `,31` cents: Inter 500, 24px, color `rgba(255,255,255,0.55)`, letter-spacing `-0.01em`
- All numbers use `font-variant-numeric: tabular-nums`

**Description** (`margin-top: 14px`, `max-width: 600px`):
- Inter 400, 14px, color `rgba(255,255,255,0.70)`
- `+85% acima da meta` (Inter 600, color `#FFFFFF`) `de R$ 2.700,00. Melhor mês dos últimos 6.`

**Embedded chart** (`margin-top: 22px`):
- 12-month area chart of saldo balance, full card width, 140px tall
- Stroke: `#12A09E`, stroke-width `1.8`
- Fill: vertical linear gradient `#12A09E` at 45% opacity → 0% opacity (top → bottom)
- No axes, no grid lines
- Month labels below: 12-column grid, each label Inter 500, 10px, uppercase, letter-spacing `0.06em`, color `rgba(255,255,255,0.30)`, centered
- Data: `[1100, 1300, 1700, 1900, 2350, 2900, 2400, 2900, 3200, 3800, 4100, 5014]`

#### 4b. Mini KPI stack (right)

`grid-template-rows: repeat(3, 1fr); gap: 16px`. Each tile:

| Property | Value |
|---|---|
| Background | `#161918` (surface) |
| Border | `1px solid #1E2220` |
| Border-radius | `16px` |
| Padding | `18px` |
| Inner grid | `1fr 130px` (text + sparkline) |
| Inner gap | `14px` |

**Header row** (`display: flex; align-items: center; gap: 10px; margin-bottom: 8px`):
- Label: Inter 500, 11px, uppercase, letter-spacing `0.1em`, color `rgba(255,255,255,0.40)`
- Delta pill (same chassis as hero pill; colors below)

**Value:** Inter 700, 22px, letter-spacing `-0.02em`, `font-variant-numeric: tabular-nums`, line-height `1`. Color varies (below).

**Sub:** Inter 400, 11.5px, color `rgba(255,255,255,0.40)`, `margin-top: 8px`.

**Sparkline:** 130×46 SVG, `stroke-width: 1.6`, no fill, stroke color matches the KPI accent.

| KPI | Value | Color | Delta pill style | Sub |
|---|---|---|---|---|
| Rendimentos | `R$ 5.900,00` | `#5B996A` | positive teal (default) | `3 fontes` |
| Despesas | `−R$ 885,69` | `#D93232` | `.neg` variant — bg `rgba(217,50,50,0.16)`, border `rgba(217,50,50,0.32)`, color `#E66666` | `2 categorias` |
| Patrimônio | `R$ 47.820,45` | `rgba(255,255,255,0.92)` | positive teal (default) | `5 classes` |

Sparkline strokes use the same colors (`#5B996A`, `#D93232`, `#12A09E` for patrimônio).

### 5. 3-up breakdown row

CSS grid `1fr 1fr 1fr; gap: 16px; margin-bottom: 16px`.

#### Panel chassis (all three)

| Property | Value |
|---|---|
| Background | `#161918` |
| Border | `1px solid #1E2220` |
| Border-radius | `16px` |
| Padding | `22px` |

**Panel head:** flex, space-between, `margin-bottom: 18px`.
- Title row (left): icon (16×16, stroke `rgba(255,255,255,0.40)`) + label text (Inter 500, 11px, uppercase, letter-spacing `0.1em`, color `rgba(255,255,255,0.40)`)
- Total/meta (right): Inter 400, 12px, color `rgba(255,255,255,0.40)`. Use `<b>` for the actual number to bump it to `#FFFFFF`, 600.

#### 5a. Por aba — horizontal bars

Stack of bar rows, gap 14px. Each row:
- Top line: name (`rgba(255,255,255,0.70)`, 13px) left + value (Inter 500, 13px, `#FFFFFF`) right with grey percentage (`rgba(255,255,255,0.40)`, 11px) tagged after.
- Track: 4px tall, `rgba(255,255,255,0.06)`, `border-radius: 999px`
- Fill: same height, full radius, colored.
- Bars are normalized so the largest row = 100% of the track width.
- Empty rows (e.g. Lili at R$ 0,00) get `opacity: 0.35`.

Data + colors:
| Name | Value | Fill |
|---|---|---|
| Familiar | R$ 500,00 (56%) | `#E3F272` (Gestão accent) |
| Luiz | R$ 385,69 (44%) | `#12A09E` (Dashboard accent) |
| Lili | R$ 0,00 (0%) | dimmed |

#### 5b. Por categoria — horizontal bars

Same chassis. Data:
| Name | Value | Fill |
|---|---|---|
| Casa | R$ 500,00 (56%) | `#7B6EF5` (Investimentos accent) |
| Cartão | R$ 385,69 (44%) | `#F2811D` (Cartão accent) |

#### 5c. Cartão em uso — card list

Each item:
- Row 1 (flex, space-between, baseline, `margin-bottom: 6px`):
  - Left: 7×7 dot in card color + name (`#FFFFFF`, 13px) + tail digits `···· 7878` (`rgba(255,255,255,0.40)`, 12px, tabular-nums)
  - Right: amount (Inter 500, 13px, `#FFFFFF`, tabular-nums)
- Track: 4px, `rgba(255,255,255,0.06)`, radius 999px
- Fill: colored to match card, width = `used / limit`
- Meta below (`margin-top: 6px`): `19% · Fecha em 13d` — Inter 400, 10.5px, uppercase, letter-spacing `0.08em`, color `rgba(255,255,255,0.40)`

Data:
| Card | Used | Limit | Color | Closes |
|---|---|---|---|---|
| Santander ···· 7878 | R$ 385,69 | R$ 2.000 | `#F2811D` | 13d |
| C6 ···· 9999 | R$ 1.380,00 | R$ 5.000 | `#E3F272` | 18d |

### 6. Receita vs Despesa — 12 meses (full-width)

Card chassis identical to the 3-up panels (`#161918` / `#1E2220` / 16px radius / 22px padding).

**Chart head** (`margin-bottom: 18px`, flex, space-between):
- Title row: icon + `Receita vs Despesa · 12 meses` (Inter 500, 11px, uppercase, letter-spacing `0.1em`, color `rgba(255,255,255,0.40)`)
- Legend (right): two items, gap 16px. Each item: 14×3 swatch + label (Inter 400, 12px, `rgba(255,255,255,0.70)`).
  - Rendimentos: swatch `#5B996A`
  - Despesas: swatch `#D93232`

**Chart:** 220px tall, full width. Two smooth area curves over the same x-axis:
- Rendimentos — stroke `#5B996A` at `stroke-width: 1.8`, fill linear gradient `#5B996A` at 32% opacity → 0%
- Despesas — stroke `#D93232` at `stroke-width: 1.8`, fill linear gradient `#D93232` at 32% opacity → 0%
- Baseline: single horizontal line at the bottom, `rgba(255,255,255,0.08)`, `stroke-width: 1`. No grid lines.
- No axis labels inside the chart.

**X-axis below** (`margin-top: 8px`):
- 12-column grid, month abbreviations, Inter 500, 10.5px, uppercase, letter-spacing `0.08em`, color `rgba(255,255,255,0.30)`, centered.

Data:
- Months: `[Jul, Ago, Set, Out, Nov, Dez, Jan, Fev, Mar, Abr, Mai, Jun]`
- Incomes: `[4800, 4900, 5100, 5200, 5400, 5500, 5400, 5600, 5550, 5700, 5700, 5900]`
- Expenses: `[3200, 3100, 2900, 3400, 3800, 4200, 3800, 2900, 2745, 2745, 2745, 885]`

## Interactions & Behavior

- **Sidebar nav click:** switches `activeSection`. The active pill background, hero card background, hero border, hero chart stroke + gradient stops all swap to the new section's accent in one transition (~160ms ease). Everything else stays put. This is the core of the redesign — section identity is communicated through one color shift, not five.
- **Tabs (Luiz/Lili/Familiar):** switching filters the underlying data (out of scope here — visual states only).
- **Month nav `‹` / `›`:** changes the active month — all KPIs, charts, and lists re-fetch for that month.
- No hover state required on KPI cards. Hover on nav items lifts icon color from 35% to 70% white.
- No focus rings shown — implement keyboard focus per the codebase's a11y conventions.
- All number formatting: Brazilian locale (`R$ 1.234,56`, comma decimal, dot thousand).

## State Management

| State | Type | Notes |
|---|---|---|
| `activeSection` | `'dashboard' \| 'despesas' \| 'rendimentos' \| 'cartao' \| 'investimentos' \| 'gestao'` | Drives accent across sidebar + hero. Default `dashboard`. |
| `activeTab` | `'luiz' \| 'lili' \| 'familiar'` | Default `luiz`. |
| `activeMonth` | `Date` or `{year, month}` | Default `2026-06`. |
| KPI data | object keyed by month + tab | `{ balance, income, expense, heritage, cards: [...], categories: [...], tabs: [...], months12, incomes12, expenses12 }` |

## Design Tokens

### Colors

```
/* Global */
--bg:               #0D0F0E
--surface:          #161918
--line:             #1E2220
--line-strong:      #2A2F2C
--ink:              #FFFFFF
--ink-2:            rgba(255,255,255,0.70)
--ink-3:            rgba(255,255,255,0.40)
--ink-4:            rgba(255,255,255,0.25)
--ink-5:            rgba(255,255,255,0.12)

/* Section accents (drive sidebar pill + hero card bg + hero border) */
Dashboard      accent #12A09E   hero bg #0B2926   hero border rgba(18,160,158,0.28)   pill bg rgba(18,160,158,0.15)
Despesas       accent #D93232   hero bg #2D0A0A   hero border rgba(217,50,50,0.30)    pill bg rgba(217,50,50,0.15)
Rendimentos    accent #5B996A   hero bg #0E2414   hero border rgba(91,153,106,0.32)   pill bg rgba(91,153,106,0.15)
Cartão         accent #F2811D   hero bg #2E1A06   hero border rgba(242,129,29,0.32)   pill bg rgba(242,129,29,0.15)
Investimentos  accent #7B6EF5   hero bg #1A1A3A   hero border rgba(123,110,245,0.32)  pill bg rgba(123,110,245,0.15)
Gestão         accent #E3F272   (pill/accent only — never as a large fill)
```

### Typography

- **Font:** Inter, weights 400 / 500 / 600 / 700. No second face.
- Scale used on this screen:
  - Page title: 600 / 28px / -0.02em
  - Hero KPI integer: 700 / 64px / -0.035em / line-height 0.95
  - Hero currency + cents: 500 / 22-24px / -0.01em
  - Mini KPI value: 700 / 22px / -0.02em
  - Section eyebrow: 500 / 11px / +0.10em / uppercase
  - Body / description: 400 / 14px
  - Tabs / pills / nav labels: 500 / 12-13px
  - X-axis labels: 500 / 10-10.5px / +0.06–0.08em / uppercase
  - Always `font-variant-numeric: tabular-nums` for currency/percent.

### Spacing scale

- `4`, `6`, `8`, `10`, `12`, `14`, `16`, `18`, `22`, `24`, `28`, `40`, `64` (px). Card padding 18–24, panel gap 16, main padding `28/40/64`.

### Radii

- Pill / chip / delta-pill: `999px`
- Nav item / logo: `10px`
- Card / panel / chart card: `16px`
- Track / fill bar: `999px`

### Shadows

None used. Containment is communicated by 1px borders only — per spec, "no shadow, no glow".

### Chart specs

- Smoothing: Catmull-Rom-to-cubic-Bezier (tension ~6). Reference impl in `saldo-hero-dashboard.html → smooth()` function.
- Area fills: vertical linear gradient from color at 32–45% opacity to 0% opacity at the baseline.
- Stroke width: 1.8 for area lines, 1.6 for sparklines.
- Baseline: single hairline at the chart bottom, `rgba(255,255,255,0.08)`.

## Assets

No external images, logos, or icons. Everything (logo glyph, nav icons, chart icons) is inline SVG or a single character (`p`) — easy to swap for the codebase's icon system (Lucide, Phosphor, Heroicons, etc.). The icon shapes are roughly:

- Dashboard — 2×2 rounded-rect grid
- Despesas — line going up
- Rendimentos — line going down then up
- Cartão — credit card outline with magstripe + chip
- Investimentos — bar chart
- Gestão — gear

If your codebase has an icon set, just pick the closest equivalents and apply `stroke: currentColor; stroke-width: 1.6` semantics.

## Files

- `saldo-hero-dashboard.html` — the high-fidelity reference. Open it standalone in any browser to inspect interactions and copy exact computed styles. Inline SVG charts; all CSS in `<style>`; all data + chart math in a single `<script>` block. No build step.

## Implementation checklist (suggested order)

1. Stand up the `60px + 1fr` shell with sticky sidebar
2. Build the section-accent token system (CSS custom properties driven by `activeSection`)
3. Header + month nav + tabs
4. Hero card with the `R$ 5.014,31` number (this carries the most visual weight — get the typography right first)
5. Mini KPI stack (these are basically the hero with a smaller number + sparkline column)
6. 3-up breakdown panels (shared chassis — extract a `<Panel title icon meta>` component)
7. Full-width 12-month chart (same chassis as panels)
8. Wire up nav click → accent shift
9. Hook into real data sources
