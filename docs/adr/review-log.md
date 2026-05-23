# Review Log — planejAÍ v2.0
Arquivo de violações detectadas pelo architect-agent durante revisão contínua de entregas.
Cada entrada inclui: data, módulo, arquivo:linha, violação e correção esperada.

---

## [2026-05-20] backend — setup + finances core (módulos entregues parcialmente)

### ✅ Aprovações (sem violação)

- `domain/` isolado: zero imports de `fastify`, `@prisma`, `@anthropic-ai/sdk` em qualquer arquivo de `domain/`
- Use cases usam `throw new HttpError(...)` corretamente — sem Result/Either pattern
- `toDomain()` inline nos repositórios — sem classe Mapper separada
- `mesRef` tratado como string `YYYY-MM` em todos os use cases — sem `new Date` para mesRef
- Valores monetários em Float direto — sem divisão/multiplicação por 100
- DI manual via `buildFinancesModule(prisma)` — sem decorators, sem container
- Zod + `fastify-type-provider-zod` para validação de rotas
- Validação de `mesRef` e `data` com regex nos use cases (double-check além do zod)

---

### ❌ VIOLAÇÃO 1 — Prefixo `/api` ausente em todas as rotas

```
apps/api/src/modules/finances/finances.module.ts:74   ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
apps/api/src/modules/finances/finances.module.ts:82   ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
apps/api/src/modules/finances/finances.module.ts:89   ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
apps/api/src/modules/finances/finances.module.ts:95   ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
apps/api/src/modules/finances/finances.module.ts:102  ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
apps/api/src/modules/finances/finances.module.ts:109  ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
apps/api/src/modules/finances/finances.module.ts:116  ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
apps/api/src/modules/finances/finances.module.ts:123  ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
apps/api/src/modules/finances/finances.module.ts:129  ❌ VIOLAÇÃO: rotas registradas sem prefixo /api.
```

**Problema:** Todos os `app.register(xRoutes, deps)` em `finances.module.ts` não passam `prefix: '/api'`. As rotas ficam em `/despesas`, `/rendimentos` etc. em vez de `/api/despesas`, `/api/rendimentos`.

**Contrato CLAUDE.md:** `Rotas da API: português, sem acentos (/api/despesas, /api/rendimentos, /api/cartoes)`

**Correção esperada:** Adicionar `prefix: '/api'` em cada `app.register(...)` dentro de `buildFinancesModule`, **ou** envolver todos os registers em um plugin com `prefix: '/api'` em `buildApp()`.

Exemplo mínimo em `finances.module.ts`:
```typescript
await app.register(despesasRoutes, { prefix: '/api', listDespesas: ..., ... })
```
Ou em `app.ts`:
```typescript
await app.register(async (api) => {
  await buildFinancesModule(api, prisma)
}, { prefix: '/api' })
```

---

### ❌ VIOLAÇÃO 2 — Query param de exclusão em série nomeado `deleteAll` em vez de `serie`

```
apps/api/src/modules/finances/http/despesas.routes.ts:113   ❌ VIOLAÇÃO: query param deleteAll. Esperado: serie (conforme contrato CLAUDE.md DELETE /api/despesas/:id?serie=true).
apps/api/src/modules/finances/http/rendimentos.routes.ts:69  ❌ VIOLAÇÃO: query param deleteAll. Esperado: serie.
```

**Problema:** Os endpoints DELETE usam `querystring: z.object({ deleteAll: z.coerce.boolean().optional() })` e repassam `req.query.deleteAll` ao use case. O CLAUDE.md especifica `?serie=true` como nome canônico do parâmetro.

**Contrato CLAUDE.md:** `DELETE /api/despesas/:id?serie=true — serie=true: apaga a despesa e todas com mesmo origemId`

**Correção esperada:**
```typescript
// despesas.routes.ts e rendimentos.routes.ts
querystring: z.object({ serie: z.coerce.boolean().optional() }),
// ...
await deps.deleteDespesa.execute(req.params.id, req.query.serie)
```
O parâmetro `deleteAll` no use case também deve ser renomeado para `serie` por consistência, mas o contrato externo (query param HTTP) é o ponto crítico.

---

## Módulos pendentes (não é violação — ainda em desenvolvimento)

Os seguintes módulos ainda não foram entregues e estão ausentes do filesystem:
- `finances/faturas` — nenhum entity/repo/use-case/route para `Fatura` e `Transacao`
- `finances/snapshots` — nenhum arquivo para `SnapshotCiclo`
- `finances/splits` — nenhum arquivo para `DivisaoEntry`
- `intelligence/*` — bounded context inteiro pendente (analyze-pdf, report)

Isso está em linha com o status `PENDENTE` no `docs/status.md` para esses módulos.

---

## Veredicto (revisão parcial — setup + core)

`❌ REPROVADO: 2 bloqueadores (prefixo /api ausente + query param serie vs deleteAll)`

Após correção dos 2 bloqueadores, re-submeter para revisão.
Os módulos que ainda não foram entregues não impactam este veredicto — serão revisados quando marcados como IMPLEMENTADO.

---

## [2026-05-20] backend — revisão completa 9 módulos (solicitado por lead-agent)

### Escopo revisado
Módulos: Setup inicial, pessoas, abas, categorias, despesas, rendimentos, investimentos, cartoes, dashboard.
Arquivos lidos: todas as entities, repos, use cases e routes dos 9 módulos (70 arquivos).

### ✅ Checks arquiteturais — TODOS PASSAM

| Check | Resultado | Detalhes |
|-------|-----------|----------|
| `domain/` sem import Fastify | ✅ | Zero ocorrências em `domain/` |
| `domain/` sem import Prisma | ✅ | Zero ocorrências em `domain/` |
| `domain/` sem import Anthropic | ✅ | Zero ocorrências em `domain/` |
| Sem Result/Either | ✅ | Use cases lançam `throw new HttpError(...)` |
| `toDomain()` inline | ✅ | Todos os 8 repos têm `private toDomain()` inline |
| Sem classe Mapper | ✅ | Nenhum arquivo `*Mapper*` encontrado |
| `mesRef` como string YYYY-MM | ✅ | Regex `/^\d{4}-\d{2}$/` em use cases + Zod |
| Float reais (sem centavos) | ✅ | Nenhum /100 ou *100 encontrado |
| DI manual via factory | ✅ | `buildFinancesModule(app, prisma)` — sem decorators |
| Zod + type-provider | ✅ | Todas as rotas com schema tipado |

### ❌ Violações ativas (mesmas 2 da revisão anterior — não corrigidas)

```
apps/api/src/app.ts:36                                       ❌ VIOLAÇÃO: buildFinancesModule sem prefixo /api. Todas as rotas ficam sem o prefixo.
apps/api/src/modules/finances/http/despesas.routes.ts:113    ❌ VIOLAÇÃO: query param `deleteAll`. Esperado: `serie`.
apps/api/src/modules/finances/http/rendimentos.routes.ts:69  ❌ VIOLAÇÃO: query param `deleteAll`. Esperado: `serie`.
```

### Veredicto por módulo

| Módulo | Arquitetura | Bloqueadores | Veredicto |
|--------|-------------|--------------|-----------|
| Setup inicial | ✅ | prefixo /api | ❌ REPROVADO |
| finances/pessoas | ✅ | prefixo /api | ❌ REPROVADO |
| finances/abas | ✅ | prefixo /api | ❌ REPROVADO |
| finances/categorias | ✅ | prefixo /api | ❌ REPROVADO |
| finances/despesas | ✅ | prefixo /api + `serie` | ❌ REPROVADO |
| finances/rendimentos | ✅ | prefixo /api + `serie` | ❌ REPROVADO |
| finances/investimentos | ✅ | prefixo /api | ❌ REPROVADO |
| finances/cartoes | ✅ | prefixo /api | ❌ REPROVADO |
| finances/dashboard | ✅ | prefixo /api | ❌ REPROVADO |

**9 REPROVADOS / 0 APROVADOS**

Os bloqueadores são **sistêmicos e de correção simples** — 1 linha no `app.ts` resolve o prefixo para todos os 9 módulos. A arquitetura em si está excelente.

### Ação necessária
Backend-agent deve:
1. Em `apps/api/src/app.ts`: envolver `buildFinancesModule` em plugin com `{ prefix: '/api' }`
2. Em `despesas.routes.ts:113` e `rendimentos.routes.ts:69`: renomear `deleteAll` → `serie`

Após correção, re-marcar todos como `IMPLEMENTADO` e notificar architect-agent para revisão final.

---

## [2026-05-20] backend — revisão expandida com findings QA incorporados

### Veredictos individuais atualizados

**APROVADO (arquitetura OK, sem gaps funcionais no escopo revisado):**

| Módulo | Status | Justificativa |
|--------|--------|--------------|
| finances/pessoas | ✅ APROVADO | Domain isolado, HttpError, toDomain inline, sem gaps |
| finances/abas | ✅ APROVADO | Domain isolado, HttpError, toDomain inline, sem gaps |
| finances/categorias | ✅ APROVADO | Domain isolado, HttpError, toDomain inline. ⚠️ ver abaixo |
| finances/investimentos | ✅ APROVADO | Domain isolado, HttpError, toDomain inline, upsert correto |

> **Nota crítica:** Todos os 4 módulos APROVADOS dependem do fix de prefixo em `app.ts` para estarem acessíveis em `/api/*`. O APROVADO é de arquitetura — QA deve aguardar o fix do setup antes de testar.

---

**FALHOU — bloqueadores funcionais incorporados de QA:**

```
apps/api/src/modules/finances/http/despesas.routes.ts:113
❌ VIOLAÇÃO: query param `deleteAll`. Esperado: `serie`.

apps/api/src/modules/finances/application/use-cases/list-despesas.use-case.ts:7
❌ BUG CRÍTICO: listagem retorna despesas tipo cartao_ciclo e split_auto.
Esperado: filtrar WHERE tipo NOT IN ('cartao_ciclo', 'split_auto') na listagem manual.
(US-01: tipos sintéticos não aparecem na listagem manual)

apps/api/src/modules/finances/http/rendimentos.routes.ts:69
❌ VIOLAÇÃO: query param `deleteAll`. Esperado: `serie`.

apps/api/src/modules/finances/application/use-cases/create-rendimento.use-case.ts:8
❌ BUG CRÍTICO: recorrente=true não propaga para N meses. Use case cria apenas 1 registro.
Esperado: criar totalRepeticoes registros com mesRef incrementado mês a mês,
origemId = id do primeiro criado.
(US-02: recorrência é requisito explícito)

apps/api/src/modules/finances/infra/prisma-cartao.repository.ts:38
❌ BUG CRÍTICO: DELETE realiza hard delete (prisma.cartao.delete).
Esperado: soft delete — prisma.cartao.update({ data: { ativo: false } }).
Motivo: Fatura.cartaoId tem onDelete RESTRICT — hard delete lança FK error se cartão tiver faturas.
(US-08: "DELETE /api/cartoes/:id → desativa (ativo=false)")

apps/api/src/modules/finances/application/use-cases/delete-cartao.use-case.ts:7
❌ BUG CRÍTICO: cartão sentinela id=1 pode ser deletado.
Esperado: if (id === 1) throw new HttpError(400, 'Cartão sentinela não pode ser excluído')
(ERD: "Cartão sentinela id=1 — nunca deletar")

apps/api/src/modules/finances/application/use-cases/get-dashboard.use-case.ts:50
❌ BUG CRÍTICO: totalDespesas inclui cartao_ciclo e split_auto → dupla contagem.
Esperado: filtrar WHERE tipo NOT IN ('cartao_ciclo', 'split_auto') antes de somar.
(US-06: saldo = rendimentos - despesas reais, excluindo sintéticas)

apps/api/src/modules/finances/application/use-cases/get-dashboard.use-case.ts:28
❌ BUG CRÍTICO: response não inclui orcamentos nem divisoesPendentes.
Esperado: adicionar ao DashboardData:
  orcamentos: { categoria, meta, gasto }[]
  divisoesPendentes: { pessoaId, nome, valor, direcao }[]
(CLAUDE.md: GET /api/dashboard retorna tudo em uma única chamada)
```

---

**AVISO — não é violação arquitetural (documentado para backend-agent):**

```
apps/api/src/modules/finances/application/use-cases/delete-categoria.use-case.ts:8-10
⚠️ AVISO: findById chamado duas vezes para o mesmo id (linhas 8 e 10).
Linha 10 é idêntica à linha 8 — o resultado já está em `existing`.
Correção trivial: remover linha 10, usar `existing.permanente` diretamente.
```

---

**HttpError static methods — NÃO é violação arquitetural:**

QA flagou ausência de `HttpError.notFound()`, `HttpError.badRequest()` etc.
CLAUDE.md especifica apenas "Erros são HttpError lançados — sem Result pattern".
Não há mandato de factory methods estáticos. Uso direto `new HttpError(404, msg)` é válido.
Esta observação não bloqueia aprovação.

---

## [2026-05-20] frontend — setup inicial + componentes base

### Escopo revisado
Módulos: Setup inicial (tokens.css, layout.tsx, QueryProvider, Sidebar, apiFetch), Componentes base (Button, Card, Modal, FormField, DataTable, KpiCard, MoneyValue, PageHeader).
Arquivos lidos: 12 arquivos de `apps/web/src/`.

### ✅ Checks — PASSAM

| Check | Resultado | Arquivo |
|-------|-----------|---------|
| Fontes corretas (Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono) | ✅ | `app/layout.tsx` via `next/font/google` |
| `layout.tsx` sem `'use client'` | ✅ | Server Component correto |
| QueryProvider com `'use client'` + `useState` | ✅ | `shared/providers/QueryProvider.tsx` |
| Sidebar com `'use client'` (justificado: `usePathname`) | ✅ | `components/layout/Sidebar.tsx` |
| Sidebar usa apenas `lucide-react` | ✅ | Ícones: LayoutDashboard, TrendingDown, etc. |
| `apiFetch` via `NEXT_PUBLIC_API_URL` | ✅ | `shared/lib/api.ts` |
| Sem Zustand / Redux | ✅ | Nenhuma ocorrência no filesystem |
| Pages sem `'use client'` indevido | ✅ | `app/dashboard/page.tsx` é Server Component correto |
| `Button.tsx` `'use client'` justificado (onClick) | ✅ | |
| `MoneyValue.tsx` Server Component + `toLocaleString('pt-BR')` | ✅ | |
| `Modal.tsx` `'use client'` justificado (useEffect, onClose) | ✅ | |
| `Card.tsx` Server Component | ✅ | |
| `PageHeader.tsx` Server Component | ✅ | |

---

### ❌ VIOLAÇÃO 1 — tokens.css: nomes de tokens divergem do contrato CLAUDE.md

```
apps/web/src/styles/tokens.css:16-25  ❌ VIOLAÇÃO: tokens de cor com nomes errados.
```

**Contrato CLAUDE.md** (seção "Design system / Tokens CSS"):
```
--verde:    #10F5A3   (cor primária)
--roxo:     #B07AFF   (cor secundária)
--azul:     #6FA9D6   (cor terciária)
--vermelho: #F23A0A   (alertas, exclusão)
--cinza-*   (escala neutra)
--ink-800   (texto principal)
```

**Implementado em tokens.css:**
```
--app-accent:  #10F5A3   (nome errado — deveria ser --verde)
--app-purple:  #B07AFF   (nome errado — deveria ser --roxo)
--app-blue:    #6FA9D6   (nome errado — deveria ser --azul)
--app-danger:  #FF6B7A   (nome errado E cor errada — deveria ser --vermelho: #F23A0A)
```

Ausentes: `--cinza-*` (escala neutra), `--ink-800` e derivados (texto principal).

**Nota:** Cores de `--verde`, `--roxo`, `--azul` estão corretas nos valores hex — apenas o nome do token diverge. `--vermelho` tem valor diferente (#FF6B7A vs #F23A0A mandatado). O sistema de tokens é internamente consistente mas não segue o contrato de nomenclatura do CLAUDE.md.

**Correção esperada:** Renomear tokens para os nomes canônicos do CLAUDE.md (ou adicionar aliases), e corrigir `--vermelho` para `#F23A0A`.

---

### ❌ VIOLAÇÃO 2 — tokens.css: `@import` de Google Fonts redundante

```
apps/web/src/styles/tokens.css:3   ❌ VIOLAÇÃO: @import url('https://fonts.googleapis.com/...')
```

**Problema:** `layout.tsx` já carrega as três famílias de fonte via `next/font/google` (método correto para Next.js — inclui otimizações de CLS, preload e self-hosting automático). O `@import` em tokens.css cria segunda requisição externa ao Google Fonts para as mesmas fontes, cancelando os benefícios do `next/font`.

**Correção esperada:** Remover a linha `@import url('https://fonts.googleapis.com/...')` de `tokens.css`.

---

### ❌ VIOLAÇÃO 3 — DataTable.tsx: `'use client'` ausente com event handler

```
apps/web/src/components/ui/DataTable.tsx:49   ❌ VIOLAÇÃO CRÍTICA: onClick em <tr> sem 'use client'.
```

**Problema:** `DataTable.tsx` não tem diretiva `'use client'`, portanto é Server Component. Na linha 49, renderiza `<tr onClick={() => onRowClick?.(row)}>` — função não-serializável em JSX de Server Component. Next.js App Router rejeita props de função em elementos HTML dentro de Server Components; causará erro de build ou runtime.

**Contrato CLAUDE.md:** `'use client'` apenas em bits interativos (formulários, modais, gráficos). DataTable com `onRowClick` prop é interativo — qualifica para `'use client'`.

**Correção esperada:** Adicionar `'use client'` como primeira linha de `DataTable.tsx`.

---

### ⚠️ AVISO — FormField.tsx: `'use client'` desnecessário

```
apps/web/src/components/ui/FormField.tsx:1   ⚠️ AVISO: 'use client' sem hooks ou handlers.
```

Componente só renderiza `<label>` + `<input>` estáticos — não usa hooks nem event handlers. O `'use client'` impede otimizações de Server Component sem ganho funcional. Não bloqueia, mas é ruído.

**Correção sugerida:** Remover `'use client'` se FormField não precisar de interatividade. Se formulários pai passarem `onChange`/`onBlur`, manter.

---

### Veredicto por módulo

| Módulo | Checks arquiteturais | Bloqueadores | Veredicto |
|--------|---------------------|--------------|-----------|
| Setup inicial (tokens, layout, providers) | Parcial | tokens.css: nomes errados + @import redundante | ❌ FALHOU |
| Componentes base (Button, Card, Modal, DataTable…) | Parcial | DataTable.tsx: 'use client' ausente + onClick | ❌ FALHOU |

**2 FALHOU / 0 APROVADO**

Bloqueadores simples de corrigir: 3 arquivos afetados, nenhuma refatoração de arquitetura necessária.

---

## [2026-05-20] re-review completo — backend 16 módulos + frontend setup/componentes

### Escopo
Backend: re-revisão de todos os 9 módulos FALHOU + revisão inicial dos 7 novos módulos.
Frontend: verificação das correções aplicadas (tokens.css + DataTable.tsx).

---

### BACKEND — Verificação de correções dos bloqueadores anteriores

| Fix | Arquivo:Linha | Verificado | Resultado |
|-----|---------------|------------|-----------|
| FIX1: prefixo /api | `finances.module.ts:112-210` — `app.register(async api => {...}, { prefix: '/api' })` | ✅ | Correto |
| FIX1: prefixo /api intelligence | `intelligence.module.ts:22-31` — mesmo padrão | ✅ | Correto |
| FIX2: `serie` em despesas | `despesas.routes.ts:118` — `{ serie: z.coerce.boolean().optional() }` | ✅ | Correto |
| FIX3: `serie` em rendimentos | `rendimentos.routes.ts:69` — `{ serie: z.coerce.boolean().optional() }` | ✅ | Correto |
| FIX3b: recorrência rendimento | `create-rendimento.use-case.ts:23-30` — loop `for i < totalRepeticoes` com `origemId = first.id` | ✅ | Correto |
| FIX4: soft delete cartão | `prisma-cartao.repository.ts:39` — `update({ data: { ativo: false } })` | ✅ | Correto |
| FIX4b: sentinel id=1 | `delete-cartao.use-case.ts:8` — `if (id === 1) throw HttpError.badRequest(...)` | ✅ | Correto |
| FIX5: dashboard dupla contagem | `get-dashboard.use-case.ts:79` — `despesasReais = despesas.filter(d => d.tipo !== 'split_auto' && d.tipo !== 'cartao_ciclo')` | ✅ | Correto |
| FIX5b: dashboard orcamentos | `get-dashboard.use-case.ts:110-117` — orcamentos com gasto calculado por aba+categoria | ✅ | Correto |
| FIX5c: dashboard divisoesPendentes | `get-dashboard.use-case.ts:120-127` — divisões com pessoaNome via pessoaMap | ✅ | Correto |
| FIX6: list-despesas filtro | `list-despesas.use-case.ts:12` — `rows.filter(d => !TIPOS_SINTETICOS.has(d.tipo))` | ✅ | Correto |

---

### BACKEND — Veredictos re-revisão (módulos previamente FALHOU)

| Módulo | Resultado |
|--------|-----------|
| Setup inicial | ✅ APROVADO |
| finances/pessoas | ✅ APROVADO |
| finances/abas | ✅ APROVADO |
| finances/categorias | ✅ APROVADO |
| finances/despesas | ✅ APROVADO |
| finances/rendimentos | ✅ APROVADO |
| finances/investimentos | ✅ APROVADO |
| finances/cartoes | ✅ APROVADO |
| finances/dashboard | ✅ APROVADO |

**9/9 correções verificadas e aprovadas.**

---

### BACKEND — Novos módulos (primeira revisão)

**finances/faturas — ✅ APROVADO**
- `Fatura.ts` / `Transacao.ts` — entities limpas, sem imports externos
- `PrismaFaturaRepository` — `toDomain()` inline, `toTransacaoDomain()` inline, sem Mapper separado
- `createTransacoes()` — usa `prisma.$transaction([...])` corretamente
- `faturas.routes.ts` — `PUT /api/faturas/:id/transacoes/:transacaoId` implementado (DEC-PO-003 ✅)
- `GetFaturaUseCase`, `DeleteFaturaUseCase`, `UpdateTransacaoUseCase` — padrão HttpError, sem domain leakage

**finances/snapshots — ✅ APROVADO**
- `SnapshotCiclo.ts` entity limpa
- `PrismaSnapshotCicloRepository` — `toDomain()` inline, hard delete aceitável (snapshots não têm FK RESTRICT)
- Routes GET/POST/DELETE com Zod

**finances/splits — ✅ APROVADO**
- `PrismaDivisaoEntryRepository` — `toDomain()` inline, método `quitar()` correto
- `splitsRoutes` — GET /splits + PUT /splits/:id
- `QuitarDivisaoUseCase` — `divisaoRepo.quitar(id)` com HttpError.notFound se inexistente

**finances/regras-fixas — ✅ APROVADO**
- Grep domain/ confirma: zero imports de Fastify, Prisma ou @anthropic-ai/sdk
- CRUD completo, padrão consistente com demais módulos

**finances/category-rules — ✅ APROVADO**
- Grep domain/ confirma: zero imports de Fastify, Prisma ou @anthropic-ai/sdk
- CRUD completo, padrão consistente com demais módulos

---

### BACKEND — intelligence: VIOLAÇÕES ENCONTRADAS

#### ❌ VIOLAÇÃO 1 — Domain importa de Infra (PROMPTS)

```
apps/api/src/modules/intelligence/domain/use-cases/AnalyzePdfUseCase.ts:4
❌ VIOLAÇÃO: import { PROMPTS } from '../../infra/anthropic/AnthropicRepository.js'

apps/api/src/modules/intelligence/domain/use-cases/GenerateReportUseCase.ts:6
❌ VIOLAÇÃO: import { PROMPTS } from '../../infra/anthropic/AnthropicRepository.js'
```

**Problema:** `domain/use-cases/` importa diretamente de `infra/anthropic/AnthropicRepository.ts`. Viola a regra de isolamento de camadas — `domain/` nunca deve depender de `infra/`. A função `loadPrompt()` e o objeto `PROMPTS` vivem em `infra/` mas são consumidos por `domain/`.

**Contratos CLAUDE.md:** `domain/ nunca importa Fastify, Prisma ou @anthropic-ai/sdk`. Por extensão, `domain/` nunca importa de `infra/` — senão a inversão de dependência colapsa.

**Correção esperada:** Mover `PROMPTS` / `loadPrompt` para `domain/prompts/index.ts` (ou similar). As use cases já têm os `.md` files no diretório correto (`intelligence/domain/prompts/`). Basta criar um loader em `domain/`:
```typescript
// domain/prompts/index.ts
import { readFileSync } from 'fs'
import { join } from 'path'
const DIR = join(__dirname, '.')
export const PROMPTS = {
  analyzeFatura: () => readFileSync(join(DIR, 'analyze-fatura.md'), 'utf-8'),
  generateReport: () => readFileSync(join(DIR, 'generate-report.md'), 'utf-8'),
}
```
E remover `PROMPTS` de `AnthropicRepository.ts`.

---

#### ❌ VIOLAÇÃO 2 — GenerateReportUseCase: dupla contagem de despesas sintéticas

```
apps/api/src/modules/intelligence/domain/use-cases/GenerateReportUseCase.ts:40
❌ BUG CRÍTICO: totalDespesas soma todas despesas incluindo cartao_ciclo e split_auto.
Esperado: filtrar WHERE tipo NOT IN ('cartao_ciclo', 'split_auto') antes de somar.
(US-07: relatório deve refletir despesas reais — mesma lógica do dashboard)
```

**Problema:** `const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0)` processa despesas brutas. O `get-dashboard.use-case.ts` já tem o filtro correto; o relatório deve seguir o mesmo padrão.

**Correção esperada:**
```typescript
const despesasReais = despesas.filter(d => d.tipo !== 'cartao_ciclo' && d.tipo !== 'split_auto')
const totalDespesas = despesasReais.reduce((s, d) => s + d.valor, 0)
const porCategoria = despesasReais.reduce<Record<string, number>>((acc, d) => { ... }, {})
```

---

#### ✅ intelligence — checks que PASSAM

| Check | Arquivo:Linha | Resultado |
|-------|---------------|-----------|
| Modelo `claude-sonnet-4-6` | `AnthropicRepository.ts:24` | ✅ |
| `cache_control: { type: 'ephemeral' }` | `AnthropicRepository.ts:31` | ✅ |
| System prompts em `.md` separados | `domain/prompts/analyze-fatura.md` + `generate-report.md` | ✅ |
| SHA-256 dedup | `AnalyzePdfUseCase.ts:47` — `createHash('sha256')` | ✅ |
| JSON.parse com HttpError.unprocessable | `AnalyzePdfUseCase.ts:81` | ✅ |
| Sem streaming | Sem `stream: true` | ✅ |
| Routes Zod tipadas | `intelligence.routes.ts` — schemas completos | ✅ |

---

### BACKEND — Veredictos novos módulos + intelligence

| Módulo | Veredicto |
|--------|-----------|
| finances/faturas | ✅ APROVADO |
| finances/snapshots | ✅ APROVADO |
| finances/splits | ✅ APROVADO |
| finances/regras-fixas | ✅ APROVADO |
| finances/category-rules | ✅ APROVADO |
| intelligence/analyze-pdf | ❌ FALHOU — domain→infra import |
| intelligence/report | ❌ FALHOU — domain→infra import + dupla contagem |

**12/14 módulos novos APROVADOS. 2 FALHOU: ambos intelligence.**

---

### AVISO — delete-cartao.use-case.ts: bypass de interface

```
apps/api/src/modules/finances/application/use-cases/delete-cartao.use-case.ts:12
⚠️ AVISO: this.cartaoRepo.update(id, { ativo: false }) em vez de this.cartaoRepo.delete(id).
```

`ICartaoRepository.delete()` já encapsula o soft delete. O use case bypassa essa abstração e chama `update()` diretamente. Funcionalmente correto, mas vaza o detalhe de implementação para a camada de application. Não bloqueia — correção trivial.

---

### FRONTEND — Verificação de correções

| Correção | Arquivo | Verificado | Resultado |
|----------|---------|------------|-----------|
| Tokens canônicos adicionados | `tokens.css:11-14` — `--verde`, `--roxo`, `--azul`, `--vermelho: #F23A0A` | ✅ | Correto |
| `--cinza-*` presentes | `tokens.css:17-26` | ✅ | Correto |
| `--ink-800` presente | `tokens.css:30` | ✅ | Correto |
| `@import` Google Fonts removido | `tokens.css:1-3` — sem @import | ✅ | Correto |
| `'use client'` em DataTable | `DataTable.tsx:1` | ✅ | Correto |

**Frontend setup + componentes base: ✅ APROVADO**

---

### Resumo final desta rodada

| Categoria | APROVADO | FALHOU |
|-----------|----------|--------|
| Backend (16 módulos) | 14 | 2 (intelligence) |
| Frontend setup + componentes | 2 | 0 |

**Próximos passos:**
- backend-agent: corrigir 2 violações em intelligence (PROMPTS em domain/ + filtro sintéticos no report)
- qa-agent: pode iniciar US-01 a US-09 (backend aprovado para essas US)
- Architect monitora re-submissão de intelligence e review das páginas frontend

---

## [2026-05-20] re-review intelligence + splits + review 12 páginas frontend

### RE-REVIEW: intelligence/analyze-pdf + intelligence/report

**Fixes verificados:**

| Fix | Arquivo:Linha | Verificado | Resultado |
|-----|---------------|------------|-----------|
| domain→infra import removido de AnalyzePdfUseCase | `AnalyzePdfUseCase.ts:4` — `import { PROMPTS } from '../prompts/index.js'` (domain) | ✅ | Correto |
| domain→infra import removido de GenerateReportUseCase | `GenerateReportUseCase.ts:6` — mesmo import (domain) | ✅ | Correto |
| domain/prompts/index.ts criado | arquivo existe, `readFileSync(__dirname, ...)` inline | ✅ | Correto |
| filtro sintéticos no report | `GenerateReportUseCase.ts:40` — `despesasReais.filter(d => d.tipo !== 'cartao_ciclo' && d.tipo !== 'split_auto')` | ✅ | Correto |
| `totalDespesas`, `porCategoria`, `qtdDespesas` usam despesasReais | linhas 41, 45, 59 | ✅ | Correto |

**intelligence/analyze-pdf — ✅ APROVADO**
**intelligence/report — ✅ APROVADO**

---

### RE-REVIEW: finances/splits

**Fixes verificados:**

| Fix | Arquivo:Linha | Verificado | Resultado |
|-----|---------------|------------|-----------|
| Rota renomeada `/splits` → `/divisao` | `splits.routes.ts:50` | ✅ | Correto |
| `POST /api/divisao` adicionado | `splits.routes.ts:55-62`, `CreateDivisaoUseCase` | ✅ | Correto |
| `PUT /api/divisao/:id` | `splits.routes.ts:64-68` | ✅ | Correto |

**finances/splits — ✅ APROVADO** (DEC-PO-004 ✅)

---

### REVIEW: 12 páginas frontend

#### Checks globais

| Check | Resultado |
|-------|-----------|
| Sem Zustand / Redux no source | ✅ — grep retornou apenas `package-lock.json` (transitive dep, não importado) |
| Todas as page.tsx sem `'use client'` | ✅ — verificado em todas as 7 rotas |
| `formatMoney` de `MoneyValue.tsx` (usa `toLocaleString('pt-BR')`) | ✅ — importado em todos os client components |
| `lucide-react` exclusivo para ícones | ✅ — nenhuma ocorrência de heroicons/react-icons/etc. |
| `recharts` para gráficos | ✅ — PieChart, AreaChart, BarChart de recharts em todos os gráficos |
| `apiFetch` de `shared/lib/api.ts` | ✅ — nenhum `fetch()` hardcoded encontrado |

---

#### /dashboard — ✅ APROVADO

| Arquivo | Status | Observação |
|---------|--------|------------|
| `dashboard/page.tsx` | ✅ | async Server Component, sem 'use client', usa apiFetch com fallback MOCK |
| `DashboardCharts.tsx` | ✅ | 'use client' ✅ — recharts justifica |
| `MesRefSelector.tsx` | ✅ | 'use client' ✅ — useRouter + useSearchParams justificam |

---

#### /despesas — ✅ APROVADO

| Arquivo | Status | Observação |
|---------|--------|------------|
| `despesas/page.tsx` | ✅ | Server Component |
| `DespesasClient.tsx` | ✅ | 'use client' ✅, apiFetch ✅, formatMoney ✅, lucide-react ✅, serie param no DELETE ✅ |

---

#### /rendimentos — ✅ APROVADO

| Arquivo | Status | Observação |
|---------|--------|------------|
| `rendimentos/page.tsx` | ✅ | Server Component |
| `RendimentosClient.tsx` | ✅ | 'use client' ✅, apiFetch ✅, PieChart recharts ✅, formatMoney ✅, serie param ✅ |

---

#### /investimentos — ✅ APROVADO

| Arquivo | Status | Observação |
|---------|--------|------------|
| `investimentos/page.tsx` | ✅ | Server Component |
| `InvestimentosClient.tsx` | ✅ | 'use client' ✅, apiFetch ✅, PieChart + AreaChart recharts ✅, formatMoney ✅ |

---

#### /cartao (US-04 + US-05) — ❌ FALHOU

| Arquivo | Status | Observação |
|---------|--------|------------|
| `cartao/page.tsx` | ✅ | Server Component |
| `CartaoClient.tsx` | ❌ | 2 violações no endpoint de edição de categoria |

**❌ VIOLAÇÃO — CartaoClient.tsx:98-103 — endpoint e body errados**

```
apps/web/src/app/cartao/CartaoClient.tsx:98
❌ VIOLAÇÃO: URL e body incorretos ao salvar categoria de transação.

Atual (ERRADO):
await apiFetch(`/api/faturas/${fatura.id}/transacoes`, {
  method: 'PUT',
  body: JSON.stringify({ transacoes: [{ id: editCategoria.id, categoria: novaCategoria }] }),
})

Contrato backend (PUT /api/faturas/:id/transacoes/:transacaoId):
  params: { id: number, transacaoId: number }
  body:   { categoria: string | null }
```

**Correção esperada:**
```typescript
await apiFetch(`/api/faturas/${fatura.id}/transacoes/${editCategoria.id}`, {
  method: 'PUT',
  body: JSON.stringify({ categoria: novaCategoria }),
})
```

O que está correto em CartaoClient: 'use client' ✅, upload PDF com base64 ✅, apiFetch para analyze-pdf ✅, recharts PieChart ✅, formatMoney ✅, `calcCiclo(diaFechamento)` correto ✅.

---

#### /relatorio — ❌ FALHOU

| Arquivo | Status | Observação |
|---------|--------|------------|
| `relatorio/page.tsx` | ✅ | Server Component |
| `RelatorioClient.tsx` | ❌ | Tipo de resposta da API incompatível com backend |

**❌ VIOLAÇÃO — RelatorioClient.tsx:55-59 — contrato de resposta diverge do backend**

```
apps/web/src/app/relatorio/RelatorioClient.tsx:55
❌ VIOLAÇÃO: frontend espera { relatorio: string } mas backend retorna RelatorioIA.

Atual (ERRADO):
const result = await apiFetch<{ relatorio: string }>('/api/intelligence/report', {...})
setRelatorio(result.relatorio)   // → undefined quando API responde com sucesso

Backend retorna (GenerateReportUseCase):
{
  titulo: string
  resumo: string
  destaques: Array<{ tipo: string; titulo: string; descricao: string }>
  alertas: string[]
  recomendacoes: string[]
  comentario_final: string
}
```

`result.relatorio` é sempre `undefined` quando a API responde com sucesso — o textarea de relatório fica em branco. O fallback `MOCK_RELATORIO` (string markdown) só aparece quando a API falha.

**Correção esperada (opção A — mais simples):** Frontend formata `RelatorioIA` em markdown:
```typescript
const result = await apiFetch<RelatorioIA>('/api/intelligence/report', {...})
const md = [
  `## ${result.titulo}`,
  result.resumo,
  ...result.destaques.map(d => `### ${d.titulo}\n${d.descricao}`),
  result.alertas.length ? `## Alertas\n${result.alertas.map(a => `- ${a}`).join('\n')}` : '',
  result.recomendacoes.length ? `## Recomendações\n${result.recomendacoes.map(r => `- ${r}`).join('\n')}` : '',
  result.comentario_final,
].filter(Boolean).join('\n\n')
setRelatorio(md)
```

**Correção esperada (opção B — backend):** Backend retorna string markdown diretamente em vez de JSON estruturado.

O que está correto em RelatorioClient: 'use client' ✅, apiFetch ✅, lucide-react ✅, `renderMarkdown()` correto ✅, mesRef validação ✅.

---

#### /gestao (US-08 + US-09 + US-10) — ✅ APROVADO

| Arquivo | Status | Observação |
|---------|--------|------------|
| `gestao/page.tsx` | ✅ | Server Component |
| `GestaoClient.tsx` — CartoesSection | ✅ | apiFetch `/api/cartoes` ✅, sentinel UI `c.id !== 1` ✅ |
| `GestaoClient.tsx` — PessoasSection | ✅ | apiFetch `/api/pessoas` ✅, apiFetch `/api/divisao` ✅, PUT `/api/divisao/:id` ✅ |
| `GestaoClient.tsx` — CategoriasSection | ✅ | apiFetch `/api/categorias` ✅ |
| `GestaoClient.tsx` — AbasSection | ✅ | apiFetch `/api/abas` ✅ |
| formatMoney em todos os valores | ✅ | `formatMoney(c.limite)`, `formatMoney(p.saldo)`, `formatMoney(d.valor)` |

---

### Resumo final — revisão completa

| Módulo | Veredicto |
|--------|-----------|
| intelligence/analyze-pdf | ✅ APROVADO |
| intelligence/report | ✅ APROVADO |
| finances/splits (rota /divisao) | ✅ APROVADO |
| /dashboard | ✅ APROVADO |
| /despesas | ✅ APROVADO |
| /rendimentos | ✅ APROVADO |
| /investimentos | ✅ APROVADO |
| /cartao | ❌ FALHOU (endpoint errado CartaoClient.tsx:98) |
| /relatorio | ❌ FALHOU (tipo resposta incorreto RelatorioClient.tsx:55) |
| /gestao | ✅ APROVADO |

**Backend: 16/16 APROVADOS.**
**Frontend: 8/10 páginas APROVADAS. 2 FALHOU (/cartao + /relatorio).**

---

## [2026-05-20] re-review /cartao + /relatorio — após fixes do frontend-agent

### Escopo
Re-verificação das 2 violações reportadas anteriormente. Arquivos lidos diretamente.

### CartaoClient.tsx:98 — ✅ CORRIGIDO

```
apps/web/src/app/cartao/CartaoClient.tsx:98-101
✅ CORRIGIDO: URL inclui /:transacaoId, body é { categoria: string }.
```

Verificado:
```typescript
await apiFetch(`/api/faturas/${fatura.id}/transacoes/${editCategoria.id}`, {
  method: 'PUT',
  body: JSON.stringify({ categoria: novaCategoria }),
})
```

Bate exatamente em `PUT /api/faturas/:id/transacoes/:transacaoId` com body `{ categoria: string }`. ✅

### RelatorioClient.tsx:64 — ✅ CORRIGIDO

```
apps/web/src/app/relatorio/RelatorioClient.tsx:64-78
✅ CORRIGIDO: tipado como RelatorioIA, campos mapeados para markdown antes de setRelatorio.
```

Verificado:
```typescript
const result = await apiFetch<RelatorioIA>('/api/intelligence/report', { ... })
const md = [
  `## ${result.titulo}`, '',
  result.resumo, '',
  result.destaques.length > 0 ? '## Destaques\n' + ... : '',
  result.alertas.length > 0 ? '## Alertas\n' + ... : '',
  result.recomendacoes.length > 0 ? '## Recomendações\n' + ... : '',
  result.comentario_final ? `## Conclusão\n\n${result.comentario_final}` : '',
].filter(Boolean).join('\n\n')
setRelatorio(md)
```

`RelatorioIA` definida inline com todos os campos corretos: `titulo`, `resumo`, `destaques[]`, `alertas[]`, `recomendacoes[]`, `comentario_final`. ✅

### Veredicto

| Módulo | Veredicto |
|--------|-----------|
| /cartao (CartaoClient.tsx) | ✅ APROVADO |
| /relatorio (RelatorioClient.tsx) | ✅ APROVADO |

**Frontend: 10/10 páginas APROVADAS. Todas as US desbloqueadas para QA.**

---

## [2026-05-20] re-review bugs QA — finances/despesas + finances/investimentos + finances/splits

### Escopo
3 bugs funcionais encontrados pelo qa-agent durante testes. backend-agent reportou correções. Verificação pontual nos arquivos afetados.

### Bug 1 — origemId ausente no create (US-01) — ✅ CORRIGIDO

```
apps/api/src/modules/finances/domain/entities/Despesa.ts:45
apps/api/src/modules/finances/infra/prisma-despesa.repository.ts:44
✅ CORRIGIDO
```

- `CreateDespesaInput.origemId?: number | null` presente em `Despesa.ts:45` ✅
- `prisma-despesa.repository.ts:44`: `origemId: input.origemId ?? null` no bloco `data` do `prisma.despesa.create()` ✅

Sem violações arquiteturais introduzidas.

### Bug 2 — POST /api/investimentos retornava 404 (US-03) — ✅ CORRIGIDO

```
apps/api/src/modules/finances/http/investimentos.routes.ts:42
✅ CORRIGIDO: app.post('/investimentos', ...) — era app.put
```

- `investimentos.routes.ts:42` — `app.post('/investimentos', ...)` ✅
- `POST /api/investimentos` agora roteia corretamente para `upsertInvestimento.execute(req.body)` ✅

### Bug 3 — createDivisao undefined em runtime (US-09) — ✅ CORRIGIDO

```
apps/api/src/modules/finances/finances.module.ts:191-198
✅ CORRIGIDO: use cases extraídos para variáveis antes do api.register
```

- `listDivisoesUC`, `createDivisaoUC`, `quitarDivisaoUC` instanciados como variáveis ✅
- `api.register(splitsRoutes, { listDivisoes: listDivisoesUC, createDivisao: createDivisaoUC, quitarDivisao: quitarDivisaoUC })` ✅
- `SplitsRoutesDeps.createDivisao: CreateDivisaoUseCase` presente na interface ✅

Causa raiz correta: Fastify clona `opts` antes de passar ao plugin, então passar `new UseCase()` inline dentro do objeto de opts pode resultar em instância clonada incompleta dependendo da versão. Extrair para variável garante referência estável.

### Veredicto

| Módulo | Fix | Veredicto |
|--------|-----|-----------|
| finances/despesas (origemId) | `Despesa.ts:45` + `repo:44` | ✅ APROVADO |
| finances/investimentos (POST vs PUT) | `routes.ts:42` | ✅ APROVADO |
| finances/splits (deps undefined) | `finances.module.ts:191-198` | ✅ APROVADO |

**Sem violações arquiteturais em nenhum dos 3 fixes. QA pode re-testar US-01, US-03, US-09.**

---

## [2026-05-20] re-review bug QA — finances/orcamentos (US-10)

### Bug 4 — DELETE /api/orcamentos/:id retornava 500 (US-10) — ✅ CORRIGIDO

```
apps/api/src/modules/finances/application/use-cases/delete-orcamento.use-case.ts:7-15
✅ CORRIGIDO
```

```typescript
async execute(id: number): Promise<void> {
  try {
    await this.orcamentoRepo.delete(id)
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e?.code === 'P2025') throw HttpError.notFound('Orçamento não encontrado')
    throw err
  }
}
```

`P2025` capturado e convertido em `HttpError.notFound` ✅. Prisma não mais borbulha como 500.

⚠️ **AVISO (não-bloqueante):** `P2025` é código de erro Prisma — detalhe de infra vazando para `application/`. Padrão correto seria o repo capturar e relançar como erro de domínio neutro. Aceito dado o padrão pragmático do projeto (CLAUDE.md: "HttpError direto nos use cases").

### Veredicto

| Módulo | Fix | Veredicto |
|--------|-----|-----------|
| finances/orcamentos (P2025 → notFound) | `delete-orcamento.use-case.ts:12` | ✅ APROVADO (⚠️ aviso P2025 infra-leak) |

**QA pode re-testar US-10 (DELETE /api/orcamentos/:id).**
