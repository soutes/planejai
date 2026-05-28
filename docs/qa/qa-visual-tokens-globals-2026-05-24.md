# QA Visual — tokens.css + globals.css + layout.tsx + Sidebar.tsx — 2026-05-24

## Resultado: FALHOU

> QA preventivo executado em estado "em andamento" do refactor.
> tokens.css e globals.css já têm alterações aplicadas.
> layout.tsx e Sidebar.tsx ainda não foram atualizados — gerando 3 criticals.
> Referência de spec: `docs/design/DESIGN_SYSTEM.md`

---

### ❌ CRÍTICOS (bloqueiam release)

- `apps/web/src/app/layout.tsx:2` ❌ CRÍTICO: `Bricolage_Grotesque` e `Plus_Jakarta_Sans` ainda importados via Next.js font loader. Next.js injeta `--font-display` e `--font-body` como CSS variables no HTML element via `className` — isso SOBRESCREVE os valores `'Inter'` definidos em tokens.css. Resultado: fontes renderizadas são Bricolage+Jakarta, NÃO Inter. DESIGN_SYSTEM.md §1 diz explicitamente: "Breaking change from v1: --font-display (Bricolage Grotesque) and --font-body (Plus Jakarta Sans) are removed." Fix: Trocar para `Inter({ subsets: ['latin'], variable: '--font-ui', ... })` e atualizar globals.css para usar `var(--font-ui)`.

- `apps/web/src/components/layout/Sidebar.tsx:66` ❌ CRÍTICO: JSX ainda renderiza `{label}` texto ao lado dos ícones. CSS `.sb-nav` foi atualizado para 40×40px icon-only (`justify-content: center`), mas o texto permanece no DOM e transborda os 60px do sidebar. Header "planejAÍ" + "v2.0" também extrapola (padding 18px×2=36px → área útil 24px, menor que o ícone 28px + texto). DESIGN_SYSTEM.md §6: "No text labels. The v1 text labels are removed." Fix: Remover `{label}` do JSX; redesenhar header para logo icon-only 40×40px; adicionar `title` attribute em cada `<Link>` para acessibilidade.

- `apps/web/src/app/layout.tsx` / `apps/web/src/components/layout/Sidebar.tsx` ❌ CRÍTICO: Nenhum elemento define `data-section="*"` em qualquer lugar do shell ou das páginas. Verificado em TODOS os 7 arquivos `page.tsx` — nenhum define `data-section`. Os seletores CSS `[data-section="dashboard"]` etc. em globals.css nunca são ativados. Todas as páginas ficam com `--section-accent: #12A09E` (dashboard teal) permanentemente. DESIGN_SYSTEM.md §2b: "Set via Next.js pathname hook" on `<body>` or `<div.app-shell>`. Fix: Criar/atualizar um componente client que leia `usePathname()` e injete `data-section="[nome]"` no `<div className="app-shell">` do layout.

---

### ⚠️ MÉDIOS (devem ser corrigidos antes da release)

- `apps/web/src/app/globals.css:244` ⚠️ MÉDIO: `.af-input:focus` ainda tem `box-shadow: 0 0 0 2px color-mix(in srgb, var(--section-accent) 12%, transparent)`. DESIGN_SYSTEM.md §12 diz explicitamente: "Focus: border-color: var(--section-accent) / NO glow ring (was: box-shadow 0 0 0 2px rgba(accent,0.12) — REMOVE)". Fix: Remover a linha `box-shadow` de `.af-input:focus`.

- `apps/web/src/app/globals.css` ⚠️ MÉDIO: Ausência total de `@media` queries. Sem breakpoints para 768px (tablet) e 360px (mobile). App não é responsivo. Reprodução: redimensionar browser para < 768px.

---

### 🔵 BAIXOS (sugestão de melhoria)

- `apps/web/src/styles/tokens.css:150-151` 🔵 BAIXO: Design spec usa `--font-ui` como token name (DESIGN_SYSTEM.md §1), mas tokens.css mantém `--font-display` e `--font-body`. Ambos apontam para 'Inter' então funciona, mas deveria ser harmonizado com o spec quando layout.tsx for atualizado.

- `apps/web/src/app/globals.css:27-30` 🔵 BAIXO: `.app-shell` usa `display: flex` mas DESIGN_SYSTEM.md §15 especifica `display: grid; grid-template-columns: 60px 1fr`. Ambos funcionam visualmente mas a implementação grid é o spec oficial.

- `apps/web/src/components/layout/Sidebar.tsx:65` 🔵 BAIXO: Ícones usam `size={16} strokeWidth={2}` mas DESIGN_SYSTEM.md §6 especifica `size={20} strokeWidth={1.6}`. Fix junto com remoção dos labels.

- `apps/web/src/app/globals.css:419-432` 🔵 BAIXO: `.af-exec` usa gradient `rgba(16,245,163,0.04)` hardcoded em vez de `var(--section-accent)`. Bloco exec aparece em /cartao e /relatorio.

---

### ✅ PASSOU (validações que não precisam de fix)

| Check | Resultado |
|-------|-----------|
| tokens.css: `--sidebar-width: 60px` | ✅ PASSOU |
| globals.css: `.app-sidebar { width: 60px }` (hardcoded) | ✅ PASSOU |
| globals.css: `[data-section="dashboard"]` CSS rule presente | ✅ PASSOU |
| globals.css: `[data-section="despesas"]` CSS rule presente | ✅ PASSOU |
| globals.css: `[data-section="rendimentos"]` CSS rule presente | ✅ PASSOU |
| globals.css: `[data-section="cartao"]` CSS rule presente | ✅ PASSOU |
| globals.css: `[data-section="investimentos"]` CSS rule presente | ✅ PASSOU |
| globals.css: `[data-section="gestao"]` CSS rule presente | ✅ PASSOU |
| globals.css: `.af-glow` — zero glow box-shadow (flat design) | ✅ PASSOU |
| globals.css: `.af-btn--primary` — zero glow box-shadow (flat design) | ✅ PASSOU |
| globals.css: `.gf-kpi` — fundo flat (sem gradient) | ✅ PASSOU |
| tokens.css: `--accent-dashboard: #12A09E` | ✅ PASSOU |
| tokens.css: `--accent-despesas: #D93232` | ✅ PASSOU |
| tokens.css: `--accent-rendimentos: #5B996A` | ✅ PASSOU |
| tokens.css: `--accent-cartao: #F2811D` | ✅ PASSOU |
| tokens.css: `--accent-investimentos: #7B6EF5` | ✅ PASSOU |
| tokens.css: `--accent-gestao: #E3F272` | ✅ PASSOU |
| tokens.css: `--bg: #0D0F0E` | ✅ PASSOU |
| tokens.css: `--surface: #161918` | ✅ PASSOU |
| tokens.css: `--line: #1E2220` | ✅ PASSOU |
| tokens.css: `--font-mono: 'JetBrains Mono'` | ✅ PASSOU |
| tokens.css: sem "Bricolage" em nenhuma linha | ✅ PASSOU |
| tokens.css: sem "Jakarta" em nenhuma linha | ✅ PASSOU |
| MoneyValue.tsx: `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })` | ✅ PASSOU |
| Todos os Client files: `'use client'` preservado | ✅ PASSOU |
| dashboard/page.tsx: Server Component (sem 'use client') | ✅ PASSOU |
| Todos os mesRef: formato string YYYY-MM (não Date object) | ✅ PASSOU |
| Todos os apiFetch: URLs portuguesas inalteradas | ✅ PASSOU |
| Todos os apiFetch: métodos HTTP inalterados | ✅ PASSOU |
| Todos os apiFetch: query params inalterados | ✅ PASSOU |

---

## Resumo

- Críticos: **3** | Médios: **2** | Baixos: **4**
- Status: **FALHOU**

### Fixes necessários (para frontend-refactor-agent):

1. **layout.tsx** — Trocar `Bricolage_Grotesque` + `Plus_Jakarta_Sans` por `Inter({ variable: '--font-ui' })`; atualizar globals.css para usar `var(--font-ui)` em vez de `var(--font-body)` e `var(--font-display)`
2. **Sidebar.tsx + layout.tsx** — Remover `{label}` do JSX; enxugar header para logo 40×40px; adicionar `title` em cada `<Link>`; ícones `size={20} strokeWidth={1.6}`; implementar `data-section` no app-shell via `usePathname()` hook
3. **globals.css** — Remover `box-shadow` de `.af-input:focus`; adicionar `@media` breakpoints 768px e 360px
