# QA Visual Refactor v2.0 — Relatório Final
**Data:** 2026-05-24  
**Agente:** qa-visual-agent  
**Escopo:** 12 arquivos aprovados pelo architect-agent em Visual Refactor v2.0  
**Veredicto:** ✅ PASSOU (0 críticos, 0 médios, 2 baixos)  
**Addendum pós-QA:** CSS fixes aplicados e re-validados em 2026-05-24 — ver seção 10.

---

## 1. Regressão apiFetch — PASSOU ✅

Todos os call sites de `apiFetch` verificados contra baseline pré-refactor.  
Nenhuma rota, método ou payload alterado.

| Arquivo | apiFetch calls | Status |
|---------|---------------|--------|
| `DespesasClient.tsx` | GET /api/pessoas, GET /api/abas, GET/POST/PUT /api/despesas, DELETE /api/despesas/:id?serie= | ✅ IGUAL |
| `RendimentosClient.tsx` | GET /api/pessoas, GET/POST/PUT /api/rendimentos, DELETE /api/rendimentos/:id?serie= | ✅ IGUAL |
| `CartaoClient.tsx` | GET /api/cartoes, GET /api/faturas, GET /api/orcamentos, GET /api/faturas/:id/transacoes, POST /api/intelligence/analyze-pdf, DELETE /api/faturas/:id, PUT /api/faturas/:fid/transacoes/:tid | ✅ IGUAL |
| `InvestimentosClient.tsx` | GET /api/pessoas, GET/POST /api/investimentos, DELETE /api/investimentos/:id | ✅ IGUAL |
| `GestaoClient.tsx` | GET/POST/PUT/DELETE /api/cartoes, /api/pessoas, /api/divisao, /api/categorias, /api/abas, /api/config/ia | ✅ IGUAL |
| `RelatorioClient.tsx` | POST /api/intelligence/report com body `{ mesRef }` | ✅ IGUAL |
| `dashboard/page.tsx` | GET /api/dashboard?mesRef= (×13 em loop + 1 direto) | ✅ IGUAL |

---

## 2. Fronteira 'use client' — PASSOU ✅

| Arquivo | Tipo | Status |
|---------|------|--------|
| `DespesasClient.tsx` | `'use client'` presente linha 1 | ✅ |
| `RendimentosClient.tsx` | `'use client'` presente linha 1 | ✅ |
| `CartaoClient.tsx` | `'use client'` presente linha 1 | ✅ |
| `InvestimentosClient.tsx` | `'use client'` presente linha 1 | ✅ |
| `GestaoClient.tsx` | `'use client'` presente linha 1 | ✅ |
| `RelatorioClient.tsx` | `'use client'` presente linha 1 | ✅ |
| `dashboard/page.tsx` | Server Component — sem `'use client'` | ✅ |
| `despesas/page.tsx` | Server Component — sem `'use client'` | ✅ |
| `rendimentos/page.tsx` | Server Component — sem `'use client'` | ✅ |
| `cartao/page.tsx` | Server Component — sem `'use client'` | ✅ |
| `investimentos/page.tsx` | Server Component — sem `'use client'` | ✅ |
| `gestao/page.tsx` | Server Component — sem `'use client'` | ✅ |
| `relatorio/page.tsx` | Server Component — sem `'use client'` | ✅ |

---

## 3. mesRef format — PASSOU ✅

Todos os usos de `mesRef` confirmados como string `YYYY-MM`. Nenhum objeto Date.

- `currentMesRef()` retorna string tipo `"2026-05"` ✅
- `useState(currentMesRef())` em RelatorioClient ✅
- Template literals `?mesRef=${mesRef}` em todas as páginas ✅
- `body: JSON.stringify({ mesRef })` em RelatorioClient ✅
- `mesRef = mesRefParam ?? currentMesRef()` em dashboard/page.tsx ✅

---

## 4. Sistema data-section — PASSOU ✅

| Página | data-section | Accent esperado |
|--------|-------------|-----------------|
| `dashboard/page.tsx` | `"dashboard"` | #12A09E teal ✅ |
| `despesas/page.tsx` | `"despesas"` | #D93232 red ✅ |
| `rendimentos/page.tsx` | `"rendimentos"` | #5B996A green ✅ |
| `cartao/page.tsx` | `"cartao"` | #F2811D orange ✅ |
| `investimentos/page.tsx` | `"investimentos"` | #7B6EF5 purple ✅ |
| `gestao/page.tsx` | `"gestao"` | #E3F272 lime ✅ |
| `relatorio/page.tsx` | `"gestao"` | #E3F272 lime ✅ (borrowing gestao per design) |

CSS overrides em `globals.css:4-9` — todos os 6 seletores presentes ✅

---

## 5. Tokens CSS — PASSOU ✅

**layout.tsx:**
- `Inter` carregado com `variable: '--font-inter'` ✅
- `JetBrains_Mono` carregado com `variable: '--font-mono'` ✅
- `html className={inter.variable + ' ' + jetbrainsMono.variable}` ✅

**tokens.css:**
- `--font-display: var(--font-inter), 'Inter', ...` — chain correto para Next.js optimization ✅
- `--font-body: var(--font-inter), 'Inter', ...` — chain correto ✅
- `--sidebar-width: 60px` ✅
- `--bg: #0D0F0E`, `--surface: #161918`, `--line: #1E2220` ✅
- Todos 6 accents de seção presentes ✅

---

## 6. Design Flat (sem glows/shadows) — PASSOU com observação

| Elemento | Glow/Shadow | Status |
|----------|------------|--------|
| `.af-glow` | Sem `box-shadow` — usa `background + border` | ✅ FLAT |
| `.af-btn--primary` | Sem `box-shadow` | ✅ FLAT |
| `.af-glow::before` | Gradient line top via `linear-gradient` — não é shadow | ✅ OK |
| `.af-input:focus` | `box-shadow: 0 0 0 2px color-mix(...)` presente | ⚠️ MÉDIO |

---

## 7. Sidebar v2 (60px icon-only) — PASSOU ✅

- `globals.css:33` — `.app-sidebar { width: 60px }` ✅
- `Sidebar.tsx` — JSX sem texto `{label}` ✅
- `Sidebar.tsx:48` — `title={label}` preservado para acessibilidade ✅
- `.sb-nav` — 40×40 centered, `border-radius: 10px` ✅
- Logo: `background: '#FFFFFF'`, `borderRadius: 10`, glyph `fontSize: 18, fontWeight: 700, color: '#0D0F0E'` ✅

---

## 8. Responsive breakpoints — PASSOU ✅

`globals.css:515-525`:
```css
@media (max-width: 768px) {
  .app-sidebar { display: none; }
  .app-main { margin-left: 0; padding: 16px 20px; }
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
  .form-grid-2 { grid-template-columns: 1fr; }
}
@media (max-width: 360px) {
  .app-main { padding: 12px 14px; }
  .modal-box { padding: 20px 16px; }
}
```

---

## 9. MoneyValue.tsx — PASSOU ✅

Arquivo não modificado pelo refactor. `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })` preservado.

---

## Bugs encontrados

### ~~⚠️ MÉDIO — globals.css:244 — input focus glow ring não removido~~ ✅ CORRIGIDO

**Fix aplicado (2026-05-24, pós-QA):**
```css
.af-input:focus {
  border-color: var(--section-accent);
  /* box-shadow removido — flat design ✅ */
}
```

`box-shadow` removido. Feedback de foco mantido via `border-color`. Design spec §12 satisfeito ✅.

---

### 🔵 BAIXO — tokens.css:152 — --font-mono sem chain para Next.js variable

```css
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
```

`layout.tsx` usa `variable: '--font-mono'` para JetBrains Mono — ambos definem `--font-mono`.  
CSS cascade: `:root` em tokens.css (carregado depois) pode override Next.js font class.  
JetBrains Mono ainda renderiza (string fallback), mas sem otimização Next.js (subsetting, display:swap).  
**Fix:** tokens.css usar `--font-mono: var(--font-mono-opt), 'JetBrains Mono', ...` e layout.tsx usar `variable: '--font-mono-opt'`. Ou aceitar como low-risk.

---

### ~~🔵 BAIXO — globals.css:170 — .af-btn--ghost hardcoded verde~~ ✅ CORRIGIDO

**Fix aplicado (2026-05-24, pós-QA):**
```css
.af-btn--ghost {
  border: 1px solid color-mix(in srgb, var(--section-accent) 40%, transparent);  /* ✅ section-aware */
  color: var(--section-accent);
}
.af-btn--ghost:hover {
  background: rgba(16,245,163,0.05);  /* 🔵 BAIXO: hover bg ainda hardcoded — non-blocking */
}
```

Border e color agora adaptam à seção ✅. Hover background (`rgba(16,245,163,0.05)`) ainda hardcoded — architect anotou como não-bloqueador.

---

### 🔵 BAIXO — globals.css:224 — color-mix() Chrome 111+ requirement

```css
.af-badge {
  background: color-mix(in srgb, var(--section-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--section-accent) 28%, transparent);
}
```

Também em `.af-input:focus`. `color-mix()` requer Chrome 111+ / Firefox 113+ / Safari 16.2+.  
Architect anotou como aceitável. Documentado para referência.

---

## Resumo

| Checklist | Status |
|-----------|--------|
| apiFetch regression | ✅ PASSOU — 0 rotas alteradas |
| 'use client' boundaries | ✅ PASSOU — 6 client + 7 server corretos |
| mesRef string format | ✅ PASSOU — nenhum Date object |
| data-section attributes | ✅ PASSOU — 7/7 páginas corretas |
| Section accent CSS | ✅ PASSOU — 6/6 seletores presentes |
| Font tokens (Inter) | ✅ PASSOU — chain var(--font-inter) correto |
| Sidebar 60px icon-only | ✅ PASSOU — sem labels, title attrs OK |
| Flat design | ✅ PASSOU — input focus shadow removido pós-QA |
| Responsive @media | ✅ PASSOU — 768px + 360px |
| MoneyValue.tsx | ✅ PASSOU — não modificado |

**Veredicto final: ✅ PASSOU**  
0 críticos. 0 médios. 2 baixos (font-mono cascade; ghost hover hardcoded — ambos non-blocking).

---

## 10. Re-validação pós-QA (2026-05-24)

CSS fixes aprovados pelo architect-agent e re-validados:

| Fix | Linha | Antes | Depois | Status |
|-----|-------|-------|--------|--------|
| `.af-btn--ghost` border | globals.css:170 | `rgba(16,245,163,0.40)` hardcoded | `color-mix(in srgb, var(--section-accent) 40%, transparent)` | ✅ PASSOU |
| `.af-btn--ghost` color | globals.css:171 | `var(--app-accent)` | `var(--section-accent)` | ✅ PASSOU |
| `.af-input:focus` | globals.css:242-244 | `box-shadow: 0 0 0 2px color-mix(...)` presente | `box-shadow` removido | ✅ PASSOU |

**Remanescente não-bloqueador:**
- 🔵 `.af-btn--ghost:hover` L174 `rgba(16,245,163,0.05)` ainda hardcoded — architect aceitou.
