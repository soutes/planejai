# Status — Feature Forma de Pagamento (Modelo A — v2 corrected)

## Contexto
Correção do Modelo A: remove `formaPagamentoId` do `Rendimento` (estava errado). `Despesa` mantém.

A implementação anterior adicionou `formaPagamentoId` em **ambos** `Rendimento` e `Despesa`. O Modelo A correto define `formaPagamentoId` **apenas** em `Despesa`. O lado `Rendimento` deve ser revertido por completo (schema, migration, entity, repo, routes, use-case, module, UI). O `RendimentosClient` mantém apenas as mudanças de categoria (CATEGORIAS_RENDIMENTO + "Outros" editável) e perde o dropdown de forma de pagamento.

Tudo do lado `Despesa` (entity, repo, routes, `DespesasClient`, dashboard chart, IA report) está **correto** e deve permanecer intocado.

## Estado dos agents
| Agent            | Status          | Depende de                                | Atualizado       |
|------------------|-----------------|-------------------------------------------|------------------|
| team-lead        | ✅ DONE         | —                                         | 2026-06-06 15:23 |
| foundation-agent | ✅ DONE          | team-lead                                 | 2026-06-06 16:05 |
| ui-fix-agent     | ✅ DONE         | team-lead (independente)                  | 2026-06-06       |
| qa-infra         | ✅ DONE          | foundation-agent                          | 2026-06-06       |
| reviewer         | ✅ DONE         | foundation-agent, ui-fix-agent, qa-infra  | 2026-06-06       |

## Checklist
- [x] Schema: `Rendimento.formaPagamentoId` removido + `Rendimento.formaPagamento` relation removida + `FormaPagamento.rendimentos[]` removido
- [x] Migration: drop column `Rendimento.formaPagamentoId` (RedefineTable SQLite — recriar `Rendimento` sem a coluna e sem a FK)
- [x] Rendimento entity limpa: remover `formaPagamentoId` + `formaPagamentoNome` de `Rendimento`, `CreateRendimentoInput`, `UpdateRendimentoInput`
- [x] Rendimento repo limpo: remover `include: { formaPagamento: true }`, type `PrismaRendimentoWithForma`, import `PrismaFormaPagamento`, `formaPagamentoId` no `create`, `formaPagamentoId`/`formaPagamentoNome` no `toDomain`
- [x] rendimentos.routes: remover `formaPagamentoId`/`formaPagamentoNome` de `RendimentoSchema`, `CreateBody`, `UpdateBody`
- [x] create-rendimento.use-case: remover dep `formaPagamentoRepo` + bloco de validação de forma + import `IFormaPagamentoRepository`
- [x] finances.module.ts: `CreateRendimentoUseCase(rendimentoRepo)` sem `formaPagamentoRepo`
- [x] RendimentosClient: forma dropdown removido (só categorias) — ver detalhamento na delta table
- [x] types/rendimentos.ts: remover `formaPagamentoId` + `formaPagamentoNome` de `RendimentoMock`
- [x] Despesa: `formaPagamentoId` + `formaPagamentoNome` MANTIDOS (não tocar)
- [x] DespesasClient: forma dropdown MANTIDO (não tocar)
- [x] Dashboard chart MANTIDO (já usa só `despesasReais` — não tocar)
- [x] IA report MANTIDO (`formasPagamento` vem do dashboard, só despesas — não tocar)
- [x] QA infra ✅ (prisma generate + migrate + build api + build web)
- [x] Review final ✅

## Notas de saída

### team-lead

#### Delta table (wrong impl → Modelo A)

| File | Current state (wrong) | Required change (Modelo A) |
|------|-----------------------|----------------------------|
| `apps/api/prisma/schema.prisma` (model `Rendimento`) | tem `formaPagamentoId Int?` (linha 221) + relation `formaPagamento FormaPagamento? @relation(...)` (linha 223) | Remover ambas as linhas. `Rendimento` não tem nenhum campo/relação de forma. |
| `apps/api/prisma/schema.prisma` (model `FormaPagamento`) | tem `rendimentos Rendimento[]` (linha 374) | Remover. Manter apenas `despesas Despesa[]`. |
| `apps/api/prisma/schema.prisma` (model `Despesa`) | tem `formaPagamentoId Int?` + relation + index `@@index([formaPagamentoId])` | **Manter** — correto. |
| `apps/api/prisma/schema.prisma` (model `Pessoa`) | tem `formasPagamento FormaPagamento[]` | **Manter** — correto. |
| `apps/api/prisma/migrations/` | última migration `20260606145157_add_forma_pagamento` criou `Rendimento` **com** `formaPagamentoId` + FK | Nova migration: RedefineTable de `Rendimento` (SQLite) recriando a tabela **sem** `formaPagamentoId` e **sem** a FK `Rendimento_formaPagamentoId_fkey`, preservando dados (INSERT...SELECT das colunas restantes). NÃO mexer em `Despesa` nem `FormaPagamento` table. |
| `apps/api/src/modules/finances/domain/entities/Rendimento.ts` | `Rendimento` tem `formaPagamentoId` + `formaPagamentoNome`; `CreateRendimentoInput` tem `formaPagamentoId`; `UpdateRendimentoInput` tem `formaPagamentoId` | Remover esses 4 campos das 3 interfaces. |
| `apps/api/src/modules/finances/infra/prisma-rendimento.repository.ts` | import `PrismaFormaPagamento`; type `PrismaRendimentoWithForma`; `include: { formaPagamento: true }` em findMany/findById/create/update; `formaPagamentoId` no create data; `formaPagamentoId`+`formaPagamentoNome` no `toDomain` | Remover import e type extra; remover todos os `include: { formaPagamento: true }`; remover `formaPagamentoId` do create; `toDomain` recebe `PrismaRendimento` puro e não emite forma. |
| `apps/api/src/modules/finances/http/rendimentos.routes.ts` | `RendimentoSchema` tem `formaPagamentoId`+`formaPagamentoNome`; `CreateBody` tem `formaPagamentoId`; `UpdateBody` tem `formaPagamentoId` | Remover esses campos dos 3 schemas zod. |
| `apps/api/src/modules/finances/application/use-cases/create-rendimento.use-case.ts` | construtor recebe `formaPagamentoRepo: IFormaPagamentoRepository`; valida forma vs pessoa (linhas 22-28); importa `IFormaPagamentoRepository` | Remover a dep do construtor, o bloco de validação e o import. Construtor fica só `rendimentoRepo`. |
| `apps/api/src/modules/finances/finances.module.ts` | `createRendimento: new CreateRendimentoUseCase(rendimentoRepo, formaPagamentoRepo)` (linha 152) | `new CreateRendimentoUseCase(rendimentoRepo)`. `formaPagamentoRepo` continua existindo (linha 138) e sendo usado por Despesa/Dashboard — não remover a instância. |
| `apps/web/src/app/rendimentos/RendimentosClient.tsx` | tem dropdown de forma: estado `formasPagamento`, `formaInput`/`formaIsCustom` no form, `useEffect` que busca `/api/formas-pagamento`, `formaOptions`, upsert de forma no `handleSave`, `formaPagamentoId` no body, coluna "Forma" na tabela, bloco `showFormaDropdown`, import `FORMAS_PAGAMENTO_SUGESTOES`, interface `FormaPagamento` | Remover **todo** o aparato de forma. Manter as mudanças de categoria (CATEGORIAS_RENDIMENTO + "Outros" editável via `categoriaCustom`). Remover: estado `formasPagamento`, campos `formaInput`/`formaIsCustom` do form/EMPTY_FORM, useEffect de fetch de formas, `formaOptions`, lógica de forma em `openEdit`/`handleSave`, `formaPagamentoId` no body, coluna `<th>Forma</th>` + `<td>` correspondente, bloco JSX `showFormaDropdown`, `showFormaDropdown`, import `FORMAS_PAGAMENTO_SUGESTOES`, interface `FormaPagamento`. |
| `apps/web/src/types/rendimentos.ts` | `RendimentoMock` tem `formaPagamentoId?` + `formaPagamentoNome?` | Remover ambos os campos. |
| `apps/api/src/modules/finances/application/use-cases/get-dashboard.use-case.ts` | `despesasPorFormaPagamento` construído só de `despesasReais` | **Manter** — correto, nunca olhou rendimentos. |
| `apps/api/src/modules/intelligence/domain/prompts/generate-report.md` | seção `formasPagamento` vem do dashboard (só despesas) | **Manter** — correto. |
| `apps/web/src/app/despesas/DespesasClient.tsx` | dropdown de forma completo e funcional | **Manter** — correto. |

#### Observações importantes
- **DELETE em cascata já correto**: `Despesa.formaPagamento` usa `onDelete: SetNull`; ao remover a relação de `Rendimento` não há impacto nessa regra.
- **`update-rendimento.use-case.ts`** não tem dep de forma — só repassa `input` ao repo. Após limpar `UpdateRendimentoInput`, nenhuma mudança de código é necessária aqui (mas o `input` deixará de carregar forma).
- **`IRendimentoRepository`** não menciona forma diretamente (usa os tipos de entity); fica correto automaticamente ao limpar as interfaces de entity.
- **Migration SQLite**: como SQLite não suporta `DROP COLUMN` com FK de forma limpa via Prisma, a migration gerada será um RedefineTable (criar `new_Rendimento`, copiar dados, drop, rename, recriar índices `Rendimento_mesRef_idx` e `Rendimento_pessoaId_mesRef_idx`). Preferir gerar via `prisma migrate dev` após editar o schema, e revisar o SQL para garantir que NÃO toca em `Despesa`/`FormaPagamento`.
- **`FORMAS_PAGAMENTO_SUGESTOES`** em `@/shared/constants/financas` continua sendo usado por `DespesasClient` — não remover a constante, só o import em `RendimentosClient`.

### foundation-agent
✅ DONE

**Migration:** `20260606160000_remove_forma_pagamento_from_rendimento` — RedefineTable SQLite: recriated `Rendimento` without `formaPagamentoId` column and without the FK to `FormaPagamento`. Existing rows preserved via `INSERT...SELECT` of the remaining columns. `Despesa` and `FormaPagamento` tables untouched.

**Files changed:**
- `apps/api/prisma/schema.prisma` — removed `formaPagamentoId Int?`, `formaPagamento FormaPagamento? @relation(...)` from model `Rendimento`; removed `rendimentos Rendimento[]` from model `FormaPagamento`
- `apps/api/prisma/migrations/20260606160000_remove_forma_pagamento_from_rendimento/migration.sql` — new migration file (manually authored, applied via `prisma migrate deploy`)
- `apps/api/src/modules/finances/domain/entities/Rendimento.ts` — removed `formaPagamentoId` and `formaPagamentoNome` from `Rendimento`, `formaPagamentoId` from `CreateRendimentoInput` and `UpdateRendimentoInput`
- `apps/api/src/modules/finances/infra/prisma-rendimento.repository.ts` — removed `PrismaFormaPagamento` import, `PrismaRendimentoWithForma` type, all `include: { formaPagamento: true }`, `formaPagamentoId` in `create()`, `formaPagamentoId`/`formaPagamentoNome` from `toDomain()`
- `apps/api/src/modules/finances/http/rendimentos.routes.ts` — removed `formaPagamentoId` and `formaPagamentoNome` from `RendimentoSchema`, `formaPagamentoId` from `CreateBody` and `UpdateBody`
- `apps/api/src/modules/finances/application/use-cases/create-rendimento.use-case.ts` — removed `IFormaPagamentoRepository` import, `formaPagamentoRepo` constructor param, and the forma validation block
- `apps/api/src/modules/finances/finances.module.ts` — `new CreateRendimentoUseCase(rendimentoRepo)` (no second arg); `formaPagamentoRepo` instance kept for Despesa/Dashboard

**tsc result:** `npx tsc --noEmit` — 0 errors (clean compile)

### ui-fix-agent
✅ DONE

**Files changed:**
- `apps/web/src/app/rendimentos/RendimentosClient.tsx`
- `apps/web/src/types/rendimentos.ts`

**What was removed from RendimentosClient.tsx:**
- `FORMAS_PAGAMENTO_SUGESTOES` import
- `FormaPagamento` interface
- `formasPagamento` state (`useState<FormaPagamento[]>`)
- `formaInput` and `formaIsCustom` fields from `RendimentoForm` interface and `EMPTY_FORM`
- `useEffect` that fetched `GET /api/formas-pagamento?pessoaId=...`
- `formaOptions` useMemo (merged suggestions + existing formas)
- `formaInput`/`formaIsCustom` derivation logic in `openEdit`
- `formaPagamentoId` upsert call (`POST /api/formas-pagamento`) in `handleSave`
- `formaPagamentoId` from the API body payload
- `formaPagamentoId` from the optimistic update spread
- `showFormaDropdown` computed variable
- Entire forma dropdown JSX block in modal
- `<th>Forma</th>` column header in table
- `<td>` forma cell (displaying `r.formaPagamentoNome`) in table rows

**What was removed from types/rendimentos.ts:**
- `formaPagamentoId?: number | null` from `RendimentoMock`
- `formaPagamentoNome?: string | null` from `RendimentoMock`

**TypeScript check:** `npx tsc --noEmit` — 0 errors

### qa-infra
✅ DONE — 2026-06-06

**Test results:**

| Test | Result | Notes |
|------|--------|-------|
| 1. `prisma validate` | PASS | "The schema at prisma/schema.prisma is valid" |
| 2. `tsc --noEmit` | PASS | Zero errors |
| 3a. DB: `Rendimento.formaPagamentoId` | PASS — removed | Column absent from SQLite table |
| 3b. DB: `Despesa.formaPagamentoId` | PASS — present | Column correctly retained |
| 3c. DB: `FormaPagamento` columns | PASS | `id, pessoaId, nome, ativo, ordem` — no `rendimentos` FK artifacts |
| 4. `GET /api/rendimentos` response shape | PASS | Keys: `id, pessoaId, mesRef, descricao, categoria, valor, recorrente, totalRepeticoes, origemId` — no `formaPagamentoId` |
| 5. `GET /api/formas-pagamento?pessoaId=8` | PASS | Returns valid array |
| 6. `POST /api/formas-pagamento` | PASS | Upsert returns `{id, pessoaId, nome, ativo, ordem}` |
| 7. `GET /api/dashboard?mesRef=2026-06&pessoaId=8` | PASS | `despesasPorFormaPagamento` field present |
| 8. `GET /api/dashboard?mesRef=2026-06` (no pessoaId) | PASS | `despesasPorFormaPagamento: []` |

**No failures.** All 8 checks PASS.

### reviewer
✅ DONE — 2026-06-06

**Modelo A correction — verified clean.** Rendimento stack fully decontaminated, Despesa stack intact, schema/migration correct.

**Findings:**

🔴 bug: Forma de pagamento can never be created — no UI anywhere calls `POST /api/formas-pagamento`. `DespesasClient.tsx:98` only does `GET /api/formas-pagamento`; `handleSave` sends `formaPagamentoId` from an existing-only dropdown. No seed for `FormaPagamento`. Dropdown is permanently empty → entire feature is non-functional. Fix: upsert the forma on submit (re-add `POST /api/formas-pagamento`) or seed/manage formas via Gestão. (Spec item 5 required DespesasClient to POST on submit.)

🟡 risk: `prisma-despesa.repository.ts:25-27` `findById` does not `include: { formaPagamento: true }` → `toDomain(row)` always returns `formaPagamentoNome: null`. `UpdateDespesaUseCase` returns `fresh` from `findById`, so PUT /api/despesas response always carries `formaPagamentoNome: null` regardless of the chosen forma. Table survives only because the client re-derives from local state. Fix: add the include to `findById`.

🟡 risk: `create-despesa.use-case.ts:39-47` validates `formaPagamentoId` (forma exists + belongs to aba pessoa), but `UpdateDespesaUseCase` has no such guard. Editing a despesa to an arbitrary/foreign `formaPagamentoId` is unvalidated (DB FK still protects against non-existent ids → 500 instead of 400, and cross-pessoa leakage is allowed). Fix: mirror the Create validation in Update.

🔵 nit: `shared/constants/financas.ts:12` `FORMAS_PAGAMENTO_SUGESTOES` is dead — imported nowhere after RendimentosClient cleanup. Status doc team-lead note claimed DespesasClient uses it; it does not. Remove or wire into the create flow.

**Non-blocking observations (verified correct):**
- Schema: `Rendimento` has no forma field/relation; `FormaPagamento.rendimentos` absent; `FormaPagamento.despesas` present; `Pessoa.formasPagamento` present; `Despesa.formaPagamentoId` + relation + index intact.
- Migration `20260606160000`: RedefineTable recreates only `Rendimento` without `formaPagamentoId`/FK, preserves rows via INSERT...SELECT, recreates both indexes; does not touch `Despesa` or `FormaPagamento`.
- Rendimento entity/repo/routes/use-case + `types/rendimentos.ts`: zero forma references.
- RendimentosClient: CATEGORIAS_RENDIMENTO used, "Outros" editable via `categoriaCustom`, no forma dropdown, no POST.
- Dashboard `GastosPorFormaPagamento`: present, empty guard (`formasPagamento.length > 0`) works; aggregation only over `despesasReais`, only for numeric pessoaId.
- CLAUDE.md: no domain→Prisma/Fastify import, no Mapper class, no Result pattern (`HttpError` used), routes PT sem acento, `mesRef` string YYYY-MM. No IA call changed.
- `create-rendimento.use-case.ts`: single-param constructor wrapped in multi-line parens (cosmetic, harmless).

## Conflitos / Alertas
- Nenhum conflito de arquivo entre foundation-agent (apps/api + schema/migration) e ui-fix-agent (apps/web RendimentosClient + types). Podem rodar em paralelo.
- Atenção: `finances.module.ts` (foundation-agent) e `RendimentosClient.tsx` (ui-fix-agent) estão em apps diferentes — sem sobreposição.
- A migration deve ser revisada manualmente para confirmar que apenas `Rendimento` é recriada (o RedefineTable do Prisma pode incluir outras tabelas se houver drift; garantir schema limpo antes de gerar).
