# planejAÍ v0.2.0 — Visual Refactor

**Data:** 2026-05-24
**Tipo:** Visual refactor — zero mudança em backend, schema, ADRs ou contratos de API
**Time:** `planejai-visual-refactor-team` (5 agentes paralelos)

---

## Páginas refatoradas

Todas as 7 rotas receberam o novo visual:

| Rota | Section Accent | Hero bg |
|------|---------------|---------|
| `/dashboard` | `#12A09E` (teal) | `#0B2926` |
| `/despesas` | `#D93232` (vermelho) | `#2D0A0A` |
| `/rendimentos` | `#5B996A` (verde) | `#0E2414` |
| `/cartao` | `#F2811D` (laranja) | `#2E1A06` |
| `/investimentos` | `#7B6EF5` (roxo) | `#1A1A3A` |
| `/gestao` | `#E3F272` (lima) | — |
| `/relatorio` | `#E3F272` (lima/gestao) | — |

---

## Tokens e componentes novos

### Sistema de Seção (core da v2)
- `--accent-{section}`, `--hero-bg-{section}`, `--hero-border-{section}`, `--pill-bg-{section}` — 6 seções
- `[data-section="*"]` CSS blocks em `globals.css` — cada página declara sua seção no elemento raiz
- `--section-accent` / `--section-hero-bg` / `--section-hero-border` / `--section-pill-bg` como vars dinâmicas

### Novos tokens globais de superfície
```css
--bg:      #0D0F0E   /* canvas global */
--surface: #161918   /* card/panel */
--line:    #1E2220   /* border */
--ink / --ink-2 / --ink-3 / --ink-4 / --ink-5
```

### Tipografia
- **Fonte:** Bricolage Grotesque + Plus Jakarta Sans → **Inter** (400/500/600/700/800)
- Next.js font loader atualizado: `Inter` com `--font-inter` variable
- Mono: JetBrains Mono mantido

### Sidebar v2
- 220px expandido → **60px icon-only** (`--sidebar-width: 60px`)
- Logo: 40×40 branco com glyph "p" escuro (sem wordmark)
- Nav: ícones 20px centered, `title` attr para a11y
- Active state: `background: var(--section-pill-bg)`, `color: var(--section-accent)`

### Flat Design
- Removidos: todos os `--glow-*` tokens e `box-shadow` em cards/buttons
- `.af-glow` → usa `--section-hero-bg` + `--section-hero-border` (sem radial-gradient)
- `.af-btn--primary` → `background: var(--section-accent)`, sem glow
- `.af-input:focus` → só `border-color: var(--section-accent)`, sem glow ring
- `.af-btn--ghost` → borda `color-mix(in srgb, var(--section-accent) 40%, transparent)`

### Dashboard Hero Card (Saldo do Mês)
- Background `var(--section-hero-bg)`, border `var(--section-hero-border)`
- Tipografia: `R$` 22px + inteiro **64px** + decimal 24px
- Area chart embarcado com stroke `var(--section-accent)`

### Responsividade
- `@media (max-width: 768px)`: sidebar hidden, margin-left 0, grids → 1 coluna
- `@media (max-width: 360px)`: padding reduzido, hero number 48px

---

## Arquivos modificados (12)

```
apps/web/src/styles/tokens.css           — section accents, surface tokens, sidebar 60px, sem glows
apps/web/src/app/globals.css             — data-section CSS blocks, sb-nav icon-only, flat cards, responsive
apps/web/src/app/layout.tsx              — Inter font loader
apps/web/src/components/layout/Sidebar.tsx — 60px icon-only, logo mark, section-aware active
apps/web/src/app/dashboard/page.tsx      — data-section="dashboard"
apps/web/src/app/dashboard/DashboardPersonaKpis.tsx — hero KpiCard flat
apps/web/src/app/despesas/DespesasClient.tsx         — data-section="despesas"
apps/web/src/app/rendimentos/RendimentosClient.tsx   — data-section="rendimentos"
apps/web/src/app/cartao/CartaoClient.tsx             — data-section="cartao"
apps/web/src/app/investimentos/InvestimentosClient.tsx — data-section="investimentos"
apps/web/src/app/gestao/GestaoClient.tsx             — data-section="gestao"
apps/web/src/app/relatorio/RelatorioClient.tsx       — data-section="gestao"
```

---

## Bugs corrigidos no ciclo

| Severidade | Descrição | Fix |
|------------|-----------|-----|
| ❌ CRÍTICO | `layout.tsx` ainda carregava Bricolage+Jakarta, sobrescrevendo tokens.css | Trocado para `Inter` |
| ❌ CRÍTICO | `Sidebar.tsx` JSX renderizava `{label}` com sidebar 60px | Removido label, icon-only |
| ❌ CRÍTICO | `data-section` ausente em todas as 7 páginas | Adicionado em cada página |
| ⚠️ MÉDIO | `@media` queries ausentes | Adicionados 768px + 360px |
| ⚠️ MÉDIO | `.af-input:focus` com glow ring (violava flat spec) | box-shadow removido |
| 🔵 BAIXO | `.af-btn--ghost` com borda hardcoded verde | Trocado para `color-mix(section-accent)` |

---

## Bugs pendentes (non-blocking)

| Severidade | Descrição |
|------------|-----------|
| 🔵 BAIXO | `.af-btn--ghost:hover` rgba hardcoded `#10F5A3` — não adapta por seção |
| 🔵 BAIXO | `--font-mono` conflict de nome com Next.js variable — fallback renderiza corretamente |
| 🔵 BAIXO | `color-mix()` requer Chrome 111+ — aceito pelo architect como target moderno |

---

## Confirmação de zero mudança em backend/schema/contratos

- `apps/api/**` — **não tocado**
- `prisma/schema.prisma` — **não tocado**
- `docs/erd.md` / `docs/adr/**` / `docs/api-contracts/**` — **não tocado**
- Todas as chamadas `apiFetch()` — **inalteradas** (URLs, métodos, payloads, query params)
- `'use client'` directives — **inalteradas** (6 client, 7 server)
- `mesRef` formato `YYYY-MM` — **preservado**
- `toLocaleString('pt-BR', currency: 'BRL')` — **preservado**
- `package.json` dependencies — **inalteradas**

---

## Próximos passos visuais (fora do escopo desta release)

- Hero cards em `/despesas`, `/rendimentos`, `/investimentos` (análogo ao Saldo Hero do dashboard)
- Sidebar expandido on hover (tooltip → expanded label)
- Microinterações: transição de accent ao navegar entre seções (~160ms ease)
- Dark-mode toggle (atualmente dark-only)
- Gráficos Recharts: paleta de seção nos `fill`/`stroke` dos charts por página
- `.af-btn--ghost:hover` hardcoded rgba → seção-aware
- Loading skeletons estilizados por seção

---

## Time

| Agente | Papel | Status |
|--------|-------|--------|
| product-owner-agent | Escopo + dúvidas de comportamento | ✅ APROVADO |
| architect-agent | Revisão arquitetural (12 arquivos) | ✅ APROVADO |
| ui-ux-designer-agent | Design system docs (3 documentos) | ✅ PUBLICADO |
| frontend-refactor-agent | Implementação (12 arquivos, build OK) | ✅ IMPLEMENTADO |
| qa-visual-agent | QA visual + re-validação pós-fix | ✅ PASSOU |

`2026-05-24` — **planejAÍ v0.2.0 Visual Refactor LANÇADO.**
