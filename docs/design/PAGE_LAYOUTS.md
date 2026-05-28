# PAGE LAYOUTS v2.0 — planejAÍ Visual Refactor

> Wireframes e paleta por rota para `frontend-refactor-agent`.
> Baseado na estrutura de componentes existente em `apps/web/src/app/`.
> NÃO introduce novas features, rotas ou campos — refactor visual puro.

---

## Shell (todas as páginas)

```
┌──────────────────────────────────────────────────────────────────┐
│ 60px sidebar │  main  padding: 28px 40px 64px                    │
│              │                                                    │
│  [logo p]    │  [PageHeader]                                      │
│              │  [PersonaTabs? — só dashboard]                     │
│  [nav icon]  │  [page content]                                    │
│  [nav icon]  │                                                    │
│  [nav icon]  │                                                    │
│  [nav icon]  │                                                    │
│  [nav icon]  │                                                    │
│  [nav icon]  │                                                    │
│    spacer    │                                                    │
│  [rel icon]  │                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**App shell CSS:** `display: grid; grid-template-columns: 60px 1fr`  
**Active section accent** driven by `data-section` attribute on `.app-shell` (or `<body>`).  
Set `data-section` from pathname in the `Sidebar` component or `layout.tsx`.

---

## `/dashboard`

**Section accent:** `#12A09E` (teal)  
**data-section:** `"dashboard"`

### Components Used (from codebase)
- `PageHeader` — title "Dashboard", subtitle "Resumo financeiro · [mesRef]"
- `MesRefSelector` — month navigator (`‹ Jun 2026 ›`) — renders inline right of PageHeader
- `PersonaTabs` (inside `PersonaProvider`) — pill row (Luiz / Lili / Familiar)
- `DashboardPersonaKpis` — contains: HeroCard + MiniKPI stack + breakdown panels
- `CartaoWidget` — card usage row
- `DashboardCharts` — full-width Receita vs Despesa 12-month chart

### Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 60px │ [PageHeader "Dashboard" | MesRefSelector "‹ Jun 2026 ›"]  │
│ side │ ──────────────────────────────────────────────────────────│
│  bar │ [PersonaTabs: (Luiz)  Lili  Familiar ]                    │
│      │ ──────────────────────────────────────────────────────────│
│  da  │ grid: 1.6fr | 1fr                                         │
│  sh  │ ┌───────────────────────────┬────────────────────────┐    │
│  bo  │ │  HeroCard                 │  MiniKPI Rendimentos  ↗│    │
│  ar  │ │  SALDO DO MÊS · JUN 2026  │  R$ 5.900,00           │    │
│  d   │ │  [delta pill ↑ +85%]      │  3 fontes              │    │
│  ic  │ │                           ├────────────────────────┤    │
│  on  │ │  R$ 5.014,31              │  MiniKPI Despesas     ↘│    │
│      │ │  (64px, teal hero bg)     │  −R$ 885,69            │    │
│      │ │                           │  2 categorias          │    │
│      │ │  description text…        ├────────────────────────┤    │
│      │ │  [12-month area chart]    │  MiniKPI Patrimônio   ↗│    │
│      │ │                           │  R$ 47.820,45          │    │
│      │ └───────────────────────────┴────────────────────────┘    │
│      │ ──────────────────────────────────────────────────────────│
│      │ grid: 1fr | 1fr | 1fr                                     │
│      │ ┌──────────────┬──────────────┬─────────────────────┐     │
│      │ │BreakdownAba  │BreakdownCat  │ CartaoWidget         │     │
│      │ │[h-bars]      │[h-bars]      │[card list + tracks]  │     │
│      │ └──────────────┴──────────────┴─────────────────────┘     │
│      │ ──────────────────────────────────────────────────────────│
│      │ ┌──────────────────────────────────────────────────────┐  │
│      │ │ DashboardCharts — Receita vs Despesa · 12 meses      │  │
│      │ │ [dual area chart, full width, 220px tall]             │  │
│      │ └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Layout Notes
- `PageHeader` and `MesRefSelector` render side-by-side in a `flex; justify-content: space-between` row
- `PersonaTabs` replaces the current `.tab-bar / .tab-item` pattern — pill style (§13 of DESIGN_SYSTEM.md)
- Hero card + mini-KPI stack: `grid-template-columns: 1.6fr 1fr; gap: 16px`
- Mini-KPI stack: `display: grid; grid-template-rows: repeat(3, 1fr); gap: 16px`
- 3-up breakdown: `grid-template-columns: 1fr 1fr 1fr; gap: 16px`
- HeroCard background = `var(--section-hero-bg)` — teal dark (`#0B2926`) on dashboard
- Empty welcome banner (when `isEmpty`): retains behavior but visual updated — flat `--surface` bg, `2px solid var(--section-accent)` left border, no gradient background

---

## `/despesas`

**Section accent:** `#D93232` (red)  
**data-section:** `"despesas"`

### Components Used
- `PageHeader` — title "Despesas", subtitle "Controle seus gastos mensais", `Icon={TrendingDown}`
- `DespesasClient` (client component) — contains all CRUD logic

### Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 60px │ [PageHeader "Despesas" | Icon TrendingDown]               │
│ side │ ──────────────────────────────────────────────────────────│
│  bar │ ┌────────────────────────────────────────────────────┐    │
│      │ │ Summary KPIs (3-up: Total / Categorias / Mês)      │    │
│  de  │ │ MesRefSelector + filters row                       │    │
│  sp  │ │ [af-btn--primary "+ Adicionar Despesa"]            │    │
│  es  │ └────────────────────────────────────────────────────┘    │
│  as  │ ──────────────────────────────────────────────────────────│
│  ic  │ ┌────────────────────────────────────────────────────┐    │
│  on  │ │ DataTable — lista de despesas                      │    │
│      │ │ cols: data | descrição | categoria | valor | ações │    │
│      │ │ [EmptyState se vazio]                              │    │
│      │ └────────────────────────────────────────────────────┘    │
│      │ ──────────────────────────────────────────────────────────│
│      │ [Modal "Nova Despesa" / "Editar Despesa"]                  │
└──────────────────────────────────────────────────────────────────┘
```

### Layout Notes
- `PageHeader` icon box: bg `var(--section-pill-bg)`, border `var(--section-hero-border)`, icon color `var(--section-accent)` — replaces hardcoded green
- Button `variant="primary"`: bg = `var(--section-accent)` (#D93232), text = #FFFFFF (light text on red)
- DataTable rows: hover `rgba(255,255,255,0.02)` — flat, no glow
- Modal: `--surface` bg, `--line` border — no gradient
- Section accent drives: icon color, active filter chips, primary button color

---

## `/rendimentos`

**Section accent:** `#5B996A` (green)  
**data-section:** `"rendimentos"`

### Components Used
- `PageHeader` — title "Rendimentos", subtitle "Registre suas receitas mensais", `Icon={TrendingUp}`
- `RendimentosClient` (client component) — CRUD + pie chart

### Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 60px │ [PageHeader "Rendimentos" | Icon TrendingUp]              │
│ side │ ──────────────────────────────────────────────────────────│
│      │ ┌─────────────────────────────┬──────────────────────┐    │
│  re  │ │ KPI Total Rendimentos        │ Chart por categoria  │    │
│  nd  │ │ (MiniKPI style)              │ (Recharts PieChart)  │    │
│  im  │ │ MesRefSelector + "+ Add"     │                      │    │
│  en  │ └─────────────────────────────┴──────────────────────┘    │
│  to  │ ──────────────────────────────────────────────────────────│
│  s   │ ┌────────────────────────────────────────────────────┐    │
│  ic  │ │ DataTable — lista de rendimentos                   │    │
│  on  │ │ cols: data | categoria | descrição | valor | ações  │    │
│      │ │ [EmptyState se vazio]                              │    │
│      │ └────────────────────────────────────────────────────┘    │
│      │ [Modal "Novo Rendimento" / "Editar Rendimento"]            │
└──────────────────────────────────────────────────────────────────┘
```

### Layout Notes
- PieChart accent color: `#5B996A` for primary slice (or per `--cat-*` palette)
- KPI card: flat `--surface` bg, `--line` border — no `.af-glow`
- Icon box on PageHeader: uses `--section-pill-bg` and `--section-accent`

---

## `/cartao`

**Section accent:** `#F2811D` (orange)  
**data-section:** `"cartao"`

### Components Used
- `PageHeader` — title "Cartão de Crédito", subtitle "Análise de fatura e acompanhamento do ciclo", `Icon={CreditCard}`
- `CartaoClient` (client component, wrapped in `<Suspense>`) — contains:
  - Card selector (which card)
  - PDF upload + AI analysis tab
  - Cycle tracking (ciclo atual, delta vs anterior)
  - Transaction table with category editing

### Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 60px │ [PageHeader "Cartão de Crédito" | Icon CreditCard]        │
│ side │ ──────────────────────────────────────────────────────────│
│      │ [CartaoSelector — pill row or dropdown]                    │
│  ca  │ ──────────────────────────────────────────────────────────│
│  rt  │ ┌─────────────────────────────┬──────────────────────┐    │
│  ao  │ │ CicloHeroCard                │ BreakdownCategoria   │    │
│  ic  │ │ GASTO DO CICLO               │ [h-bars, categorias] │    │
│  on  │ │ R$ 385,69 / R$ 2.000,00      │                      │    │
│      │ │ [progress track, orange]     │                      │    │
│      │ │ delta vs anterior            │                      │    │
│      │ └─────────────────────────────┴──────────────────────┘    │
│      │ ──────────────────────────────────────────────────────────│
│      │ ┌────────────────────────────────────────────────────┐    │
│      │ │ PDF Upload — "Analisar fatura com IA"              │    │
│      │ │ [upload area] + [af-btn--primary "Analisar"]       │    │
│      │ └────────────────────────────────────────────────────┘    │
│      │ ──────────────────────────────────────────────────────────│
│      │ ┌────────────────────────────────────────────────────┐    │
│      │ │ DataTable — transações da fatura                   │    │
│      │ │ cols: data | descrição | categoria (edit) | valor  │    │
│      │ └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Layout Notes
- Progress track color: `var(--section-accent)` (#F2811D orange)
- Card dots/identifiers use bank colors (`--bank-*`)
- PDF upload area: `--surface` bg, dashed `--line` border, hover `rgba(242,129,29,0.06)` bg
- `<Suspense>` fallback: simple text, no spinner glow

---

## `/investimentos`

**Section accent:** `#7B6EF5` (purple)  
**data-section:** `"investimentos"`

### Components Used
- `PageHeader` — title "Investimentos", subtitle "Snapshot mensal do seu patrimônio", `Icon={PieChart}`
- `InvestimentosClient` (client component) — contains:
  - MesRefSelector
  - Patrimônio total KPI
  - Donut chart by category
  - Evolução patrimonial area chart
  - DataTable for snapshot entries

### Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 60px │ [PageHeader "Investimentos" | Icon PieChart]              │
│ side │ ──────────────────────────────────────────────────────────│
│      │ ┌─────────────────────────────┬──────────────────────┐    │
│  in  │ │ HeroKPI Patrimônio Total     │ PieChart / Donut     │    │
│  ve  │ │ (--surface / --line / 16px) │ por categoria         │    │
│  st  │ │ R$ 47.820,45                │ (Recharts PieChart)  │    │
│  im  │ │ MesRefSelector              │                      │    │
│  en  │ └─────────────────────────────┴──────────────────────┘    │
│  to  │ ──────────────────────────────────────────────────────────│
│  s   │ ┌────────────────────────────────────────────────────┐    │
│  ic  │ │ Chart: Evolução Patrimonial (12 meses)             │    │
│  on  │ │ [Recharts AreaChart, stroke #7B6EF5]               │    │
│      │ └────────────────────────────────────────────────────┘    │
│      │ ──────────────────────────────────────────────────────────│
│      │ ┌────────────────────────────────────────────────────┐    │
│      │ │ DataTable — snapshot por categoria/instituição     │    │
│      │ │ cols: categoria | instituição | valor | ações      │    │
│      │ │ [Button "+ Registrar Snapshot"]                    │    │
│      │ └────────────────────────────────────────────────────┘    │
│      │ [Modal "Novo Snapshot"]                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Layout Notes
- Donut chart: use `--cat-*` colors per category
- AreaChart stroke: `var(--section-accent)` (#7B6EF5)
- AreaChart fill: gradient `#7B6EF5` at 32% → 0%
- Hero KPI card: flat `--surface` bg (NOT glow variant)

---

## `/gestao`

**Section accent:** `#E3F272` (lime)  
**data-section:** `"gestao"`

### Components Used
- `PageHeader` — title "Gestão", subtitle "Cartões, pessoas, categorias e metas", `Icon={Settings}`
- `GestaoClient` (client component) — tab-based, contains:
  - Tab: Cartões — CRUD de cartões, sentinela id=1
  - Tab: Pessoas / Splits — pessoas, divisão de gastos, quitação
  - Tab: Configurações — categorias, abas, orçamentos/metas

### Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 60px │ [PageHeader "Gestão" | Icon Settings]                     │
│ side │ ──────────────────────────────────────────────────────────│
│      │ [TabBar: Cartões | Pessoas | Configurações]               │
│  ge  │ ──────────────────────────────────────────────────────────│
│  st  │ TAB: CARTÕES                                              │
│  ao  │ ┌────────────────────────────────────────────────────┐   │
│  ic  │ │ DataTable — cartões cadastrados                    │   │
│  on  │ │ cols: nome | banco | limite | cor | proprietário   │   │
│      │ │ [Button "+ Adicionar Cartão"]                      │   │
│      │ └────────────────────────────────────────────────────┘   │
│      │ ──────────────────────────────────────────────────────────│
│      │ TAB: PESSOAS                                              │
│      │ ┌────────────────────────────────────────────────────┐   │
│      │ │ Pessoas cadastradas                                │   │
│      │ │ Divisões pendentes (quem deve a quem, quitação)    │   │
│      │ └────────────────────────────────────────────────────┘   │
│      │ ──────────────────────────────────────────────────────────│
│      │ TAB: CONFIGURAÇÕES                                        │
│      │ ┌────────────────────────────────────────────────────┐   │
│      │ │ Categorias CRUD                                    │   │
│      │ │ Abas / personas CRUD                               │   │
│      │ │ Orçamentos/metas por categoria e mês               │   │
│      │ └────────────────────────────────────────────────────┘   │
│      │ [Modals conforme ação]                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Layout Notes
- **Gestão uses lime accent `#E3F272`** — caution: lime is light; primary button text must be `#0D0F0E` (dark) for contrast
- TabBar v2: pill-style tabs (not underline) — active tab: `rgba(255,255,255,0.06)` bg + `rgba(255,255,255,0.12)` border + white text
- Or keep underline tab if simpler — but remove green glow from active underline → section accent color only

---

## `/relatorio`

**Section accent:** `#E3F272` (lime — borrows gestão)  
**data-section:** `"gestao"`

### Components Used
- `PageHeader` — title "Relatório IA", subtitle "Análise executiva do seu mês financeiro", `Icon={FileText}`
- `RelatorioClient` (client component) — AI report generator, contains:
  - MesRefSelector
  - Generate button → calls `/api/intelligence/report`
  - `.af-exec` rendered Markdown report

### Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 60px │ [PageHeader "Relatório IA" | Icon FileText]               │
│ side │ ──────────────────────────────────────────────────────────│
│      │ [MesRefSelector + af-btn--primary "Gerar Relatório"]      │
│  re  │ ──────────────────────────────────────────────────────────│
│  la  │ ┌────────────────────────────────────────────────────┐    │
│  to  │ │ .af-exec — relatório gerado pela IA               │    │
│  ri  │ │ Markdown renderizado                               │    │
│  o   │ │ [EmptyState se não gerado ainda]                   │    │
│  ic  │ └────────────────────────────────────────────────────┘    │
│  on  │                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Layout Notes
- `.af-exec` v2: `--surface` bg, `2px solid var(--section-accent)` left border, flat — remove radial gradient bg
- Loading state: `.spinner` with `border-top-color: var(--section-accent)`
- Generate button: `variant="primary"` → bg lime `#E3F272`, text `#0D0F0E`

---

## Summary Table

| Route | Section | Accent | Hero type | Key layout change |
|-------|---------|--------|-----------|-------------------|
| `/dashboard` | dashboard | `#12A09E` | HeroCard 1.6fr + MiniKPI stack 1fr | New hero layout vs current flat KPI grid |
| `/despesas` | despesas | `#D93232` | No hero | Red accent replaces green |
| `/rendimentos` | rendimentos | `#5B996A` | No hero | Green-earthy accent |
| `/cartao` | cartao | `#F2811D` | Ciclo card | Orange accent replaces green |
| `/investimentos` | investimentos | `#7B6EF5` | No hero | Purple accent |
| `/gestao` | gestao | `#E3F272` | No hero | Lime accent, careful contrast |
| `/relatorio` | gestao | `#E3F272` | No hero | Borrows gestão section |

---

## PageHeader v2 Behavior

The PageHeader icon container changes from hardcoded green to section-aware:

```tsx
// BEFORE (v1):
background: 'rgba(16,245,163,0.08)',
border: '1px solid rgba(16,245,163,0.2)',
<Icon color="var(--app-accent)" />

// AFTER (v2):
background: 'var(--section-pill-bg)',
border: '1px solid var(--section-hero-border)',
<Icon color="var(--section-accent)" />
```

This is the only change needed in `PageHeader.tsx` — all behavioral props stay identical.
