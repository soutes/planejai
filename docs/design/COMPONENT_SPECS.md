# COMPONENT SPECS v2.0 — planejAÍ Visual Refactor

> Specs por componente para `frontend-refactor-agent`.
> Cada componente: estado atual → estado alvo → o que NÃO mudar.

---

## 1. Sidebar (`apps/web/src/components/layout/Sidebar.tsx`)

### Current State
- Width: 220px (via `--sidebar-width: 220px` in tokens.css)
- Background: `var(--app-canvas-2)` (#070B13)
- Logo: 28×28 green gradient box + wordmark "planejAÍ" in display font
- Nav items: full-width rows with icon + text label, `.sb-nav` / `.sb-nav--active`
- Active state: `background: rgba(16,245,163,0.08)`, `border-left: 3px solid var(--app-accent)`, `padding-left: 15px`
- Footer: "App local · offline-first" text

### Target State (v2)
- Width: **60px** (update `--sidebar-width: 60px` in tokens.css)
- Background: `var(--bg)` (#0D0F0E)
- Border-right: `1px solid var(--line)`
- Padding: `18px 10px`
- Logo: 40×40 white box, border-radius 10px, glyph "p" in #0D0F0E, Inter 700 18px, letter-spacing -0.04em, `margin: 0 auto 12px`
- Nav items: 40×40, border-radius 10px, centered (`margin: 0 auto`), **no text labels**
- Default icon: `rgba(255,255,255,0.35)`, `size={20}`, `strokeWidth={1.6}`
- Hover: icon `rgba(255,255,255,0.70)`, bg `rgba(255,255,255,0.04)`
- Active: bg `var(--section-pill-bg)`, icon `var(--section-accent)`
- `title` attribute on each `<Link>` for accessibility (replaces visible labels)
- Remove footer ("App local · offline-first") OR move to an icon button
- Nav items gap: `4px`
- The `data-section` attribute must be set by Sidebar (or layout) based on `pathname`

### CSS Changes
Remove `.sb-nav` and `.sb-nav--active` from globals.css. Replace with:
```css
.sb-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  margin: 0 auto;
  color: rgba(255,255,255,0.35);
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
}
.sb-nav-item:hover {
  color: rgba(255,255,255,0.70);
  background: rgba(255,255,255,0.04);
}
.sb-nav-item--active {
  background: var(--section-pill-bg);
  color: var(--section-accent);
}
```

### Do
- Update `NAV_ITEMS` order: Dashboard, Despesas, Rendimentos, Cartão, Investimentos, Gestão, (spacer), Relatório
- Set `data-section` attribute on `.app-shell` or `<body>` based on pathname
- Keep `usePathname()` for active state detection

### Don't
- Don't change the `href` values
- Don't change the Lucide icon choices (just update `size` from 16 → 20, `strokeWidth` from 2 → 1.6)

---

## 2. PageHeader (`apps/web/src/components/layout/PageHeader.tsx`)

### Current State
```tsx
// Icon container hardcoded green:
background: 'rgba(16,245,163,0.08)',
border: '1px solid rgba(16,245,163,0.2)',
<Icon color="var(--app-accent)" />

// Title:
<h1 className="t-page-title">  // Bricolage Grotesque 800 22px
```

### Target State (v2)
```tsx
// Icon container — section-aware:
background: 'var(--section-pill-bg)',
border: '1px solid var(--section-hero-border)',
<Icon color="var(--section-accent)" />

// Title:
<h1 className="t-page-title">  // Inter 600 28px -0.02em
```

### CSS for `.t-page-title` v2
```css
.t-page-title {
  font-family: var(--font-ui);   /* Inter — was var(--font-display) */
  font-weight: 600;              /* was 800 */
  font-size: 28px;               /* was 22px */
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--ink);
}
```

### Subtitle
Change `color: 'var(--app-text-muted)'` → `color: 'var(--ink-3)'` (rgba(255,255,255,0.40))

### Props — no changes
```tsx
interface PageHeaderProps {
  title: string      // keep
  subtitle?: string  // keep
  Icon?: LucideIcon  // keep
  action?: React.ReactNode  // keep
}
```

### Do
- Only change colors (icon container) and typography (.t-page-title)

### Don't
- Don't change the component's prop interface
- Don't change layout structure (flex row, space-between)

---

## 3. Button (`apps/web/src/components/ui/Button.tsx`)

### Current State
- Uses `.af-btn af-btn--${variant}` CSS classes
- Primary: green gradient bg + glow box-shadow
- Ghost: green border + green text
- Danger: red border + red text
- Secondary: `--app-border` border + muted text
- Font: `var(--font-body)` (Plus Jakarta Sans)

### Target State (v2)
```css
.af-btn {
  font-family: var(--font-ui);    /* Inter — was var(--font-body) */
  font-weight: 700;
  font-size: 13.5px;
  padding: 10px 22px;
  border-radius: 8px;
  transition: all 0.15s ease;
  /* NO box-shadow */
}

.af-btn--primary {
  background: var(--section-accent);
  color: #08120D;                 /* dark contrast — override to #FFFFFF for red/purple sections */
  border: none;
  /* REMOVE: box-shadow, gradient */
}
.af-btn--primary:hover {
  filter: brightness(1.08);      /* subtle brighten — no glow */
}

.af-btn--ghost {
  background: transparent;
  border: 1px solid rgba(var(--section-accent-rgb), 0.40);  /* or use section-hero-border */
  color: var(--section-accent);
}
.af-btn--ghost:hover {
  background: rgba(255,255,255,0.04);
}

.af-btn--danger {
  background: transparent;
  border: 1px solid rgba(217,50,50,0.45);
  color: #D93232;
}
.af-btn--danger:hover {
  background: rgba(217,50,50,0.06);
}

.af-btn--secondary {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--ink-3);
}
.af-btn--secondary:hover {
  background: rgba(255,255,255,0.04);
}
```

**Note on primary button text contrast:**
- Teal `#12A09E`: dark text `#08120D` ✓
- Red `#D93232`: light text `#FFFFFF` 
- Green `#5B996A`: dark text `#0D0F0E` ✓
- Orange `#F2811D`: dark text `#0D0F0E` ✓
- Purple `#7B6EF5`: dark text `#0D0F0E` ✓
- Lime `#E3F272`: dark text `#0D0F0E` ✓

Simplest approach: add a `--section-btn-text` token per section.

### Props — no changes
```tsx
type Variant = 'primary' | 'ghost' | 'danger' | 'secondary'  // keep
interface ButtonProps {
  children, variant, onClick, type, disabled, Icon, size, style  // all keep
}
```

### Disabled state
`opacity: 0.35` — was `opacity: 0.5`. Update.

### Do
- Update only CSS classes in globals.css
- Component TSX needs no changes

### Don't
- Don't change variant names
- Don't change Icon rendering logic
- Don't change `size` prop behavior (sm/md padding)

---

## 4. Card (`apps/web/src/components/ui/Card.tsx`)

### Current State
```tsx
<div className="af-card">  // bg #10141C, border #1F2530, radius 14px, padding 18/20
  {title && <div style={{ fontSize: 13, fontWeight: 700... }}>}
```

### Target State (v2)
```css
.af-card {
  background: var(--surface);     /* #161918 — was #10141C */
  border: 1px solid var(--line);  /* #1E2220 — was #1F2530 */
  border-radius: 16px;            /* --radius-card — was 14px */
  padding: 18px 22px;             /* was 18px 20px */
  /* NO gradient, NO glow */
}
```

Title style update:
```tsx
// Change:
color: 'var(--app-text-2)'  →  color: 'var(--ink-3)'
fontSize: 13                →  fontSize: 11 (eyebrow style)
fontWeight: 700             →  fontWeight: 500
letterSpacing: 0.2          →  letterSpacing: '0.10em'
textTransform added:         →  textTransform: 'uppercase'
```

### Props — no changes
```tsx
interface CardProps {
  children, title, className, style  // all keep
}
```

### Do
- Update `.af-card` background, border color, radius, padding
- Update title rendering to match `.t-eyebrow` style

### Don't
- Don't change prop interface
- Don't remove optional `className` or `style` passthrough

---

## 5. KpiCard (`apps/web/src/components/ui/KpiCard.tsx`)

### Current State
- Two modes: `glow=false` → `.gf-kpi` (gradient bg), `glow=true` → `.af-glow` (green glow)
- `.gf-kpi`: gradient `#0D1420→#111827`, 14px radius
- `.af-glow`: complex multi-layer bg + green box-shadows
- Value font: `.t-kpi` = Bricolage Grotesque 800 23px
- Colored: `value >= 0 ? var(--app-accent) : var(--app-danger)`

### Target State (v2)
Both modes collapse to one flat card:
```css
/* Remove .gf-kpi and .af-glow. Use: */
.mini-kpi-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px;
  display: grid;
  grid-template-columns: 1fr 130px;
  gap: 14px;
  align-items: center;
}
```

Value colors:
```tsx
// v2: explicit color per KPI type (no more binary green/red)
const colorMap = {
  rendimentos: '#5B996A',
  despesas:    '#D93232',
  patrimonio:  'var(--ink)',   // #FFFFFF
  default:     'var(--ink)',
}
```

`.t-kpi` v2:
```css
.t-kpi {
  font-family: var(--font-ui);   /* Inter — was Bricolage */
  font-weight: 700;              /* was 800 */
  font-size: 22px;               /* was 23px */
  letter-spacing: -0.02em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
```

### Props Consideration
The current `glow` prop becomes a no-op (both modes render same flat card). Keep prop for backwards compat but ignore it visually.

Consider adding `color` prop for explicit KPI color, or leave as-is and let pages set it via `style`.

### Do
- Remove `.af-glow` class and its CSS entirely
- Remove `.gf-kpi` class and its gradient CSS
- Update `.t-kpi` font/size

### Don't
- Don't change `label`, `value`, `sub`, `colored` prop behavior
- Don't change `formatMoney` import/usage

---

## 6. Modal (`apps/web/src/components/ui/Modal.tsx`)

### Current State
- Overlay: `rgba(0,0,0,0.6) + backdrop-filter: blur(4px)`
- Box: `.modal-box` — bg `var(--app-card)` (#10141C), border `var(--app-border)`, radius 16px, padding 28/32
- Title: `var(--font-display)` (Bricolage) weight 700 18px
- Close button: `var(--app-text-muted)`

### Target State (v2)
```css
.modal-box {
  background: var(--surface);     /* #161918 — was #10141C */
  border: 1px solid var(--line);  /* was var(--app-border) */
  border-radius: 16px;            /* same */
  padding: 28px 32px;             /* same */
}
```

Title:
```tsx
// Change:
fontFamily: 'var(--font-display)'  →  fontFamily: 'var(--font-ui)'
fontWeight: 700                    →  fontWeight: 600
fontSize: 18                       →  fontSize: 18  (same)
color: (inherit)                   →  color: 'var(--ink)'
```

Close button:
```tsx
color: 'var(--app-text-muted)'  →  color: 'var(--ink-3)'
```

### Props — no changes
```tsx
interface ModalProps {
  open, onClose, title, children, maxWidth  // all keep
}
```

### Do
- Update bg/border/title font only

### Don't
- Don't change Escape key handler
- Don't change backdrop click-to-close behavior
- Don't change `maxWidth` prop
- Don't remove `onClick={e => e.stopPropagation()}` on modal-box

---

## 7. DataTable (`apps/web/src/components/ui/DataTable.tsx`)

### Current State
- Wrapper: `.af-card` with `padding: 0, overflow: hidden`
- Table: `.af-table`
- `th`: 10px uppercase, `--app-text-faint`, weight 700
- `td`: 13px, `--app-text-2`, border-bottom rgba(255,255,255,0.03)
- Row hover: `rgba(255,255,255,0.02)`

### Target State (v2)
```css
/* Wrapper */
.af-card { /* updated per Card spec */ }

/* Table */
.af-table th {
  font-size: 10px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--ink-3);         /* was var(--app-text-faint) */
  font-weight: 700;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);  /* was var(--app-border) */
}
.af-table td {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--ink-2);         /* was var(--app-text-2) */
  border-bottom: 1px solid rgba(255,255,255,0.03);  /* same */
}
.af-table tr:hover td {
  background: rgba(255,255,255,0.02);  /* same — flat, no glow */
}
```

Empty state cell:
```tsx
// Change:
color: 'var(--app-text-faint)'  →  color: 'var(--ink-4)'
```

### Props — no changes
```tsx
interface DataTableProps<T> {
  columns, rows, keyField, onRowClick, emptyMessage  // all keep
}
```

### Do
- Only update color references in CSS

### Don't
- Don't remove `'use client'` directive
- Don't change generic type signature
- Don't change column render callback

---

## 8. FormField (`apps/web/src/components/ui/FormField.tsx`)

### Current State
- Label: `.af-label` — 10.5px, weight 700, uppercase, `var(--app-text-faint)`
- Error: `var(--app-danger)` (#F23A0A)

### Target State (v2)
```css
.af-label {
  font-family: var(--font-ui);   /* Inter */
  font-size: 10px;               /* was 10.5px */
  font-weight: 700;
  letter-spacing: 0.06em;        /* was 1px */
  text-transform: uppercase;
  color: var(--ink-3);           /* was var(--app-text-faint) */
  display: block;
  margin-bottom: 6px;
}
```

Input v2 (`.af-input`):
```css
.af-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--line);       /* was var(--app-border) */
  border-radius: 8px;
  color: var(--ink);                   /* was var(--app-text) */
  font-family: var(--font-ui);         /* Inter */
  font-size: 14px;
  padding: 9px 12px;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}
.af-input:focus {
  border-color: var(--section-accent);
  /* REMOVE: box-shadow glow ring */
}
.af-input::placeholder {
  color: var(--ink-4);                 /* was var(--app-text-faint) */
}
```

### Props — no changes
```tsx
interface FormFieldProps {
  label, required, children, error  // all keep
}
```

### Do
- Update label color and input focus style (remove glow)

### Don't
- Don't change form-group layout
- Don't change error rendering

---

## 9. EmptyState (`apps/web/src/components/ui/EmptyState.tsx`)

### Current State
- Icon: `var(--app-text-faint)`, size 48
- Title: weight 600, 16px, `var(--app-text)`
- Subtitle: 13px, `var(--app-text-faint)`
- CTA: `.af-btn--primary` (green)

### Target State (v2)
```tsx
// Icon color:
color: 'var(--ink-4)'          // was var(--app-text-faint)

// Title:
color: 'var(--ink)'            // was var(--app-text)

// Subtitle:
color: 'var(--ink-3)'          // was var(--app-text-faint)

// CTA button: inherits section accent via .af-btn--primary
```

### Props — no changes

### Do
- Only update color references
- CTA colors auto-update when `.af-btn--primary` uses section accent

### Don't
- Don't change centering/padding layout
- Don't change conditional CTA rendering (href vs onClick)

---

## 10. MoneyValue (`apps/web/src/components/ui/MoneyValue.tsx`)

### Current State
- Uses `.mono` class (JetBrains Mono) — KEEP
- Colored: `value >= 0 ? var(--app-accent) : var(--app-danger)`

### Target State (v2)
```tsx
// Colored logic:
const color = colored
  ? (v >= 0 ? '#5B996A' : '#D93232')  // explicit section-neutral colors
  : 'inherit'
// Was: var(--app-accent) / var(--app-danger) — those still work but
// in v2 the "positive" green is #5B996A, not #10F5A3
```

Size map: unchanged (`sm:12, md:14, lg:16, kpi:23`).

For hero display, use `t-kpi-hero` class directly in HeroCard — MoneyValue `size="kpi"` covers mini-KPI usage.

### Props — no changes
```tsx
interface MoneyValueProps {
  value, className, colored, size  // all keep
}
```

`formatMoney()` — **do not change**. Brazilian locale is correct.

### Do
- Update hardcoded color values for `colored` prop

### Don't
- Don't change `formatMoney()` locale logic
- Don't change `.mono` class usage
- Don't change size map

---

## 11. Globals CSS — Classes to Remove / Replace

| Class | Action |
|-------|--------|
| `.af-glow` | Remove entirely |
| `.gf-kpi` | Remove (replace with flat `.af-card`) |
| `.sb-nav` | Remove (replace with `.sb-nav-item`) |
| `.sb-nav--active` | Remove (replace with `.sb-nav-item--active`) |
| `.t-page-title` | Update: Inter 600 28px (was Bricolage 800 22px) |
| `.t-kpi` | Update: Inter 700 22px -0.02em (was Bricolage 800 23px) |
| `.t-glow-title` | Remove (glow eliminated) |
| `--glow-*` tokens | Remove all from tokens.css |
| `--shadow-flat` | Remove from tokens.css |
| `.af-btn--primary` gradient | Remove gradient, add flat accent bg |
| `.af-btn--primary` box-shadow | Remove |
| `.af-input:focus` box-shadow | Remove glow ring |
| `.tab-item--active` border-bottom accent-color | Update: `var(--section-accent)` instead of `var(--app-accent)` |

---

## 12. Tokens CSS — Summary of Changes

```css
/* REMOVE: */
--glow-green-soft, --glow-green-card, --glow-green-strong
--glow-purple, --glow-blue, --glow-danger
--shadow-flat
--font-display (Bricolage Grotesque)
--font-body (Plus Jakarta Sans)

/* ADD: */
--bg: #0D0F0E
--surface: #161918
--line: #1E2220
--line-strong: #2A2F2C
--ink: #FFFFFF
--ink-2: rgba(255,255,255,0.70)
--ink-3: rgba(255,255,255,0.40)
--ink-4: rgba(255,255,255,0.25)
--ink-5: rgba(255,255,255,0.12)
--font-ui: 'Inter', system-ui, ...
--radius-pill: 999px
--radius-nav: 10px
--radius-card: 16px
--radius-input: 8px
--sidebar-width: 60px  /* was 220px */

/* ADD section accent blocks per data-section: */
[data-section="dashboard"]   { --section-accent: #12A09E; ... }
[data-section="despesas"]    { --section-accent: #D93232; ... }
[data-section="rendimentos"] { --section-accent: #5B996A; ... }
[data-section="cartao"]      { --section-accent: #F2811D; ... }
[data-section="investimentos"] { --section-accent: #7B6EF5; ... }
[data-section="gestao"]      { --section-accent: #E3F272; ... }

/* KEEP: */
--bank-* (unchanged)
--cat-* (unchanged)
--app-warn, --app-lime, --app-amber (keep for backward compat)
```

---

## 13. layout.tsx — Font Changes

```tsx
// REMOVE:
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const bricolage = Bricolage_Grotesque({ ... variable: '--font-display' })
const jakarta = Plus_Jakarta_Sans({ ... variable: '--font-body' })
const jetbrains = JetBrains_Mono({ ... variable: '--font-mono' })

// REPLACE WITH:
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  weight: ['400', '500', '600', '700', '800'],
})
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
})

// className update:
<html className={`${inter.variable} ${jetbrains.variable}`}>
```

---

## 14. Section-Awareness Implementation

The `data-section` attribute must be set dynamically. Recommended approach:

```tsx
// In Sidebar.tsx or a wrapper in layout.tsx:
'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const SECTION_MAP: Record<string, string> = {
  '/dashboard':     'dashboard',
  '/despesas':      'despesas',
  '/rendimentos':   'rendimentos',
  '/cartao':        'cartao',
  '/investimentos': 'investimentos',
  '/gestao':        'gestao',
  '/relatorio':     'gestao',  // borrows gestão
}

function getSection(pathname: string): string {
  return SECTION_MAP[pathname] ?? Object.entries(SECTION_MAP)
    .find(([k]) => pathname.startsWith(k))?.[1] ?? 'dashboard'
}

// Apply to <html> or .app-shell:
useEffect(() => {
  const section = getSection(pathname)
  document.documentElement.setAttribute('data-section', section)
}, [pathname])
```

Or apply via `data-section` attribute directly on `.app-shell` div in layout:
```tsx
// In a client wrapper component:
<div className="app-shell" data-section={section}>
```

This is the minimum code change required to activate the entire section accent system.
