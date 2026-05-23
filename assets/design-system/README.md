# planejAÍ — Design System

> Gestor financeiro pessoal brasileiro, IA-nativo, desktop-first (Python + Streamlit).

This folder is the design system for **planejAÍ**. It contains the brand,
visual foundations, type, color, components, and a high-fidelity recreation
of the shipping app — enough for an agent or human to design new surfaces
that look like they came from the same product.

---

## The name

**planejAÍ** carries a deliberate double meaning. It must be preserved
character-for-character; never strip the accent, never split the case:

- **planej + AÍ** → "planeje aí" — Portuguese imperative, "plan now"
- **planej + AI** → artificial intelligence — the app uses AI to parse
  credit-card statements

The wordmark expresses the duality through case + color: **planej** is
lowercase neutral, **AÍ** is uppercase and brand-colored. That contrast is
the entire identity. Do not soften it.

---

## The product

planejAÍ is a personal-finance dashboard you don't open every day. The
intended flow is:

1. Register your fixed monthly expenses **once**.
2. Drop a closed credit-card statement (PDF) into the app each month.
3. The AI agent parses it, categorizes the transactions, surfaces atypical
   spend, and gives you a forecast for the open cycle.
4. You see where your money went, plan the next months, and close the app.

It runs locally on Windows as a Streamlit app, launched via a VBS shim
that opens Edge/Chrome in `--app` mode (no URL bar, no tabs — looks
native). All data is in local SQLite. The only network call is to the
configured Claude / OpenClaude CLI.

**Surfaces shipping today:**
- The desktop app (`src/ui.py`, `app.py`, pages under `src/page_*.py`).
- No marketing site, no mobile app — yet.

---

## Sources

This design system was built from these inputs. The reader does not
necessarily have access; included for traceability.

- **Repo:** [`soutes/planejai`](https://github.com/soutes/planejai) — full app codebase
  - `src/ui.py` — CSS + component helpers (the source of truth for the dark theme)
  - `src/charts.py` — Plotly dark theme, category colors, glow line/bar charts
  - `app.py` — sidebar nav, KPI grid, settings tabs
  - `src/page_cartao.py` — credit-card analyzer screens
  - `design-brief.md` — brand brief (logo spec, "Binance-adapted turquoise")
- **Reference moods cited in brief:** Nubank wordmark, Binance, Linear.

---

## Two palettes coexist — read this carefully

The shipping app today and the new brand direction use **different accent
colors**. Both are documented here. **Do not unify them silently.**

| Layer | Accent | Where it lives |
|---|---|---|
| **Brand (new)** | `#2dbdb6` turquoise | Logo, splash, future marketing, app-icon, README |
| **App (current)** | `#10F5A3` neon green | The shipping Streamlit app — every screen the user sees today |

The brand brief explicitly maps the system onto Binance's logic, swapping
Binance Yellow for turquoise. The app, meanwhile, has a fully-built dark
neon UI on `#10F5A3` with companion purple / blue / danger accents and
heavy use of glow.

**Working rule:** new brand surfaces (logo, marketing, splash, favicons,
docs) use turquoise. App UI work keeps the neon green system intact. When
designing inside the app, follow `src/ui.py` — that is the source of truth.

---

## Content fundamentals

Voice is **Brazilian Portuguese**, casual but precise. The product talks
to one person, the user, who is in charge of their own money.

### Tone & person
- **Você-form**, never "o usuário", never English unless it is a real
  loanword the user types ("upload", "OCR", "snapshot").
- Direct, slightly playful, never preachy. No "vamos juntos nessa
  jornada". The app is a tool, not a coach.
- The AI is treated as an analyst — it reports, it does not advise. Output
  surfaces (Resumo Executivo, Alertas) use third-person observational
  language: "Gasto atípico em Restaurante X", not "Cuidado, você
  exagerou!".

### Casing
- **UPPERCASE labels** for tiny meta lines: `SALDO DO MÊS`, `LIMITE`,
  `PLANEJAMENTO FINANCEIRO`. Always with `letter-spacing: 0.7–1.2px`.
- **Sentence case** for everything user-facing: section titles, button
  labels, dialog copy, table headers.
- **Title Case** is not used.
- The wordmark **planejAÍ** is the one casing exception that's locked.

### Specific copy patterns observed
- KPI sublabels are factual fragments: *"receitas − despesas"*, *"total
  recebido em Mai"*, *"1 cartão(ões) ativo(s)"*. They include the math.
- Section heads are short noun phrases: *"Despesas por Categoria"*,
  *"Próximos Vencimentos"*, *"Top Estabelecimentos"*.
- Empty states explain WHERE to act, not just THAT something is empty:
  *"Vá em ⚙️ Configurações → 💳 Cartões para adicionar seu cartão."*
- Action buttons start with the verb and include a glyph, separated by a
  double-space: `"🏠  Visão Geral"`, `"💾 Salvar"`, `"➕ Adicionar Cartão"`,
  `"✕  Fechar App"`. The space-glyph-text pattern is consistent.
- Currency is always **R$ formatted pt-BR** (`R$ 1.234,56`), tabular,
  weight 700–800. Never lowercase "r$" or USD prefixes.
- Dates: `DD/MM/YYYY`. Months in PT (`Janeiro`, `Fevereiro`, …) for page
  titles, abbreviated (`Jan`, `Fev`, …) on chart axes.

### Emoji
- **Yes**, on navigation and category icons: 🏠 💰 📅 💳 📈 ⚙️ ✏️ 💾 🗑️ ➕ ✕ ⚠️.
- Used as **functional glyphs**, never decoration. One emoji per label, at
  the start.
- Where higher-density iconography is needed (alerts, dashboard chrome),
  the app drops emoji and uses **stroked SVG icons** instead (see
  Iconography).
- Page-header emoji set: 🏠 (Visão Geral) · 💰 (Rendimentos) · 📅 (Despesas)
  · 💳 (Cartão) · 📈 (Investimentos) · ⚙️ (Configurações).

### Examples (verbatim from app)

> *"Análise local de faturas via OpenClaude"* — sidebar tagline
> *"Suba prints ou PDF parcial e clique em Analisar."* — empty state
> *"Lili te deve R$ 234,50"* / *"Você deve Lili R$ 234,50"* — debt line
> *"⚠️ Todas as faturas e transações serão apagadas."* — destructive confirm
> *"Configure as abas em ⚙️ Configurações."* — empty state

---

## Visual foundations

### Mood
**Trading-platform discipline, brazilian warmth.** Binance's
information density and pace, dialed back from cold-yellow to a calmer
neon-green spending app. Neither bank, nor coach, nor casino. Money is
shown, not narrated.

### Type
- **One family — Inter.** Variable font from Google Fonts. The optical
  size axis (`opsz`) gives us two effective cuts from a single import:
  - **opsz 32 ("Inter Display")** — wordmark, page titles, KPI values,
    any headline ≥ 22px. Apply with
    `font-variation-settings: 'opsz' 32; letter-spacing: -0.025em`.
  - **opsz 14 ("Inter Text")** — body, section heads, labels, table rows.
    Default optical sizing handles this when text is small.
- **Mono — JetBrains Mono.** Dev contexts only — not in shipping UI.
- **Numbers** are always tabular (`font-variant-numeric: tabular-nums`).
  KPI values use Inter Display 500.
- **Tiny labels** are Inter 700, uppercase, `letter-spacing: 0.7–1.2px`,
  size 10–11 px.
- **Shipping app today** uses Streamlit's system stack — moving to Inter
  is a single CSS swap.

### Color
Two palettes coexist (see top of this README). The shipping rule:

- **App accent = `#10F5A3` neon green.** Used for CTA, saldo positivo,
  active nav, the glow ring on `af-glow` cards, and the green dot before
  glow titles.
- **Categorías** get their own colors — purple `#B07AFF`, blue `#6FA9D6`,
  warn `#FFB347`, danger `#FF6B7A`, lime `#A3E635`. These are signal
  colors, not brand colors.
- Banks have **identity colors** mapped from their public branding (Nubank
  purple, Itaú orange, Santander red…). Used on chip dots, card-strip
  glows, and KPI sublabels for the cartão page.

### Background & surfaces
- **Canvas is near-black**, never `#000`: `#0B0E13` for pages, `#070B13`
  for sidebar.
- **No atmospheric backgrounds.** No aurora, no mesh, no full-bleed
  imagery. The app is flat-on-dark; depth comes from a colored ring or a
  subtle radial-gradient inside a card, never from a layered hero image.
- **Cards stack on canvas** with explicit borders. Default card is
  `#10141C` + `1px solid #1F2530` + `14px` radius. KPI cards use a 135°
  gradient between `#0D1420` → `#111827` for slight dimensionality.

### Animation
The shipping Streamlit app **has no JS animation** beyond what Streamlit
itself gives (page reload, soft fade on toast). The aesthetic is **static
and instant** — taps re-render synchronously, no spinners except the
multi-second AI processing dialog (which counts elapsed seconds in big
accent text).

When motion is added to new surfaces, follow these rules:
- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` — quick out, gentle in.
- **Durations:** 120 ms (hover), 180 ms (state change), 320 ms (modal).
- Never bounce. Never spring.
- Reveal cards by **opacity + 4 px translate-up**, never by scale.

### Hover & press
- **Buttons:** hover brightens the gradient + intensifies the same-color
  glow (e.g. primary goes from `0 0 20px` to `0 0 30px` on `#10F5A3`).
  Pressed = the active hue (`#0FCC88` on primary).
- **Ghost / Ajustar / Danger buttons:** hover fades fill from `0.05α` →
  `0.12α` of their accent + a faint glow appears.
- **Nav rows:** hover swaps to a darker fill `#131B28`, text steps from
  dim → secondary. Active state shows the 3 px accent left-bar.
- **Card chips:** selected = colored fill `0.13α` + colored border
  `0.6α` + glow `0.27α`.

### Borders & rings
- One border style everywhere: `1px solid #1F2530` (`#1A2030` on KPI
  cards). Never double-stroke. Never coloured borders except for
  state — left-accent on alerts (`3px solid`), and the glow-card
  `rgba(accent,0.25)` 1 px ring.
- **No outer drop shadows.** Elevation is always *colored glow* with `0`
  offset (see `--glow-*` tokens).

### Layout
- **Content width caps at 1500 px** (`block-container.max-width`); sidebar
  is fixed 220 px.
- **Grid + flex, never floats.** KPI rows use `repeat(auto-fit,
  minmax(180px, 1fr))` so they re-pack at smaller widths.
- **Page header** is `font-size: 22px / 800 / -0.5px` with a tiny dim
  month label beside it.
- **Section heading** = 4×16 colored bar (matching the chart below) +
  uppercase title.

### Transparency & blur
The app uses **transparency**, not blur — for translucent fills (alpha
`.04` → `.13` on accent colors), gradient fades on progress bars, and the
faint top-border light on `af-glow`. There is no backdrop-filter use
anywhere in the codebase. Don't introduce any.

### Imagery
- **None.** The product never shows people, illustrations, stock photos,
  3D renders, or generative gradients. Avoid the urge to add hero images.
  The "art" of the app is its data — the donut, the bars, the categories.
- If a new surface (landing page, README) needs a hero, prefer a **screen
  of the actual product** over generated imagery.

### Layout patterns
- **KPI row** at the top of every page (3–5 cells in a `repeat(5, 1fr)`
  grid with `gap: medium`).
- **Hero card** below KPIs — either a glow KPI box, big progress bar, or
  a Plotly chart card.
- **Detail rows** under hero — section heading + a list/card cluster.
- **Right-side overflow** for inline editors (color picker, ratio
  inputs).

### Cards — the canonical 3 species
| Card | Used for | Look |
|---|---|---|
| `af-card` | Default container (alerts, recs, info empty) | Flat, `#10141C`, `1px border`, `14px` radius |
| `gf-kpi` | Top-of-page KPIs | 135° gradient `#0D1420 → #111827`, 3 px colored border-top, KPI value/label/sub stack |
| `af-glow` | Hero indicator block | `18px` radius, accent ring `0.25α`, multi-layer green glow, ::before top-light line |

---

## Iconography

planejAÍ uses **three layers** of icons, in this order of preference:

### 1. Inline SVG glyphs (preferred)
The shipping app declares 7 strokes in `src/ui.py` as inline SVG
constants: `ICON_CARD`, `ICON_UPLOAD`, `ICON_BOOK`, `ICON_CHART`,
`ICON_CLOCK`, `ICON_TRASH`, `ICON_FOLDER`. They are:
- **stroke-only**, `stroke-width: 2` (1.4 for the large 48 px book/chart
  decoratives, 2.5 for the 14 px upload),
- `stroke-linecap: round`, `stroke-linejoin: round`,
- one color (default `#E8ECF2` or `currentColor` on inline-aligned ones),
- 24×24 viewBox.

This is **identical to [Lucide](https://lucide.dev)** stroke spec — when
you need a glyph that isn't already inlined, **pull it from Lucide** and
follow the same stroke style. No fill icons. No two-tone. No
material-rounded.

### 2. Functional emoji
Navigation labels, category labels, page heads, and short status lines
use **single Unicode emoji** as the glyph:

| Page | Glyph | Context |
|---|---|---|
| Visão Geral | 🏠 | sidebar nav |
| Rendimentos | 💰 | sidebar nav |
| Despesas | 📅 | sidebar nav |
| Cartão de Crédito | 💳 | sidebar + page head |
| Investimentos | 📈 | sidebar nav |
| Configurações | ⚙️ | sidebar nav |
| Edit | ✏️ | inline action |
| Save | 💾 | inline action |
| Delete | 🗑 / 🗑️ | inline action |
| Add | ➕ / ＋ | new-item action |
| Close | ✕ | dismiss |
| Warning | ⚠️ | destructive confirm |

Emoji are **functional glyphs only** — never decoration, never as a
bullet, never as a brand mark. Always at the start of the label, separated
by 1–2 spaces from the text.

### 3. Unicode glyphs for state
Up/down/right arrows and check marks come from plain Unicode:
`▲ ▼ ◀ ▶ ▸ — ✕ +`. Used on chart deltas, month stepper, recommendation
lists. No icon font.

### What we DO NOT use
- Icon fonts (Font Awesome, Material Icons) — none.
- PNG sprites — none.
- Custom illustration sets — none.
- Emoji as full visual "art" (large floating emoji headers, hand-drawn
  feel) — explicitly avoided.

### Adding new icons
Use Lucide. If the icon isn't there, draw one in **the same spec**:
24×24, stroke-only, 2 px round caps, `currentColor`. Add it as an inline
SVG constant to `src/ui.py` (not as an `<img>` reference) so the dark
theme honors `currentColor`.

---

## File index — what's in this folder

```
.
├── README.md                  # ← you are here
├── SKILL.md                   # how an agent should use this design system
├── colors_and_type.css        # design tokens (colors, type, spacing, glow)
├── components.css             # component CSS — mirrors src/ui.py exactly
│
├── assets/                    # logos, marks, favicons, brand CSS
│   ├── logo-wordmark-dark.svg, -light, -app-green, -mono-*  # 5 wordmark variants
│   ├── logo-mark.svg, -mono-dark, -mono-light                # companion mark
│   ├── logo-lockup-dark.svg                                   # mark + wordmark
│   ├── favicon.svg, app-icon.svg                              # tab + app icon
│   └── logo.css                                               # drop-in HTML wordmark
│
├── preview/                   # one HTML card per design-system concept
│   ├── brand-*.html           # wordmark, variants, companion mark
│   ├── colors-*.html          # brand palette, app accents, surfaces, categories
│   ├── type-*.html            # Inter Display + Inter, scale, numbers
│   ├── spacing-*.html         # radii, spacing scale, glow elevation
│   ├── component-*.html       # KPI cards, glow card, big bar, alerts, buttons,
│   │                          # sidebar, badges/chips, sections, charts
│   └── iconography.html       # SVG glyphs + functional emoji
│
└── ui_kits/
    └── app/                   # Streamlit-app recreation (React)
        ├── README.md
        ├── index.html         # full interactive prototype
        ├── Sidebar.jsx        # 220-px sidebar w/ month stepper
        ├── Components.jsx     # KPICard, GlowKPI, BigProgress, ProgressCategorias,
        │                      # AlertLine, ExecSummary, BankChip, Tabs, SectionH
        ├── Pages.jsx          # VisaoGeral + CartaoPage (3 tabs) + placeholders
        └── kit.css            # kit-specific layout, sits on top of components.css
```

### Quick starts
- **New brand asset (slide, splash, doc):** use `assets/logo-wordmark-dark.svg`
  or the inline `.pa-wm` HTML class from `assets/logo.css`.
- **New screen in the Streamlit app:** copy components from
  `ui_kits/app/Components.jsx` and follow `src/ui.py` for the live source
  of truth. Stay inside the tokens in `colors_and_type.css`.
- **New marketing page:** brand turquoise system. Use `--brand-*`
  tokens. Logo in turquoise. No glow.

### Open caveats (please confirm)
- **Aeonik Pro → Inter swap:** the brief originally specified Plus Jakarta
  Sans 700+; per your feedback the system now uses **Inter** (variable,
  opsz axis) for both display and body. README, tokens, wordmark, all
  cards, and the UI kit are aligned to Inter.
- **The brand & app accents are different colors on purpose.** The logo
  uses turquoise `#2dbdb6`; the shipping app uses neon green `#10F5A3`.
  If you want them unified, say which side wins.
- **The companion mark** is an abstraction of the acute accent on Í — a
  tilted bar over a wide pin. It scales cleanly to 16 px. Replace it with
  a different concept anytime; the wordmark stands alone fine.


