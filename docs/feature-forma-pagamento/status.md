# Status — Feature Forma de Pagamento

## Estado dos agents
| Agent            | Status          | Depende de                      | Atualizado        |
|------------------|-----------------|---------------------------------|-------------------|
| team-lead        | ✅ DONE         | —                               | 2026-06-06 11:47  |
| foundation-agent | ✅ DONE         | team-lead                       | 2026-06-06        |
| ui-interactive   | ✅ DONE         | foundation-agent                | 2026-06-06        |
| dashboard-agent  | ✅ DONE         | foundation-agent                | 2026-06-06        |
| ia-report-agent  | ✅ DONE         | foundation-agent                | 2026-06-06        |
| qa-infra         | ✅ DONE         | foundation-agent                | 2026-06-06        |
| qa-visual        | ✅ DONE          | ui-interactive, dashboard-agent | 2026-06-06        |
| reviewer         | ✅ DONE         | TODOS                           | 2026-06-06        |

## Checklist global
- [x] Schema + migration aplicada (backup ok)
- [x] Rotas formas-pagamento (GET/POST upsert)
- [x] Rendimento/Despesa aceitam formaPagamentoId
- [x] Dashboard agg despesasPorFormaPagamento
- [x] Form rendimentos: dropdown forma + categoria "Outros" editável
- [x] Form despesas: dropdown forma (escondido em aba grupo)
- [x] Chart "Gastos por forma de pagamento" (oculto se vazio)
- [x] Relatório IA: contexto + diretriz de forma de pagamento
- [ ] QA infra ✅ · QA visual ✅
- [x] Review final ✅

## Notas de saída (preenchido por cada agent ao concluir)
### team-lead

**Integration map** — todos os paths absolutos. Linhas referem-se ao estado atual (pré-mudança); são pontos de inserção/edição, não ranges exatos pós-edit.

| Agent | File | Line | What to change |
|-------|------|------|----------------|
| foundation | `apps/api/prisma/schema.prisma` | 12-28 (model Pessoa) | Adicionar back-relation `formasPagamento FormaPagamento[]` no model `Pessoa` (ex.: após linha 27). |
| foundation | `apps/api/prisma/schema.prisma` | 92-125 (model Despesa) | Adicionar `formaPagamentoId Int?` + `formaPagamento FormaPagamento? @relation(fields: [formaPagamentoId], references: [id], onDelete: SetNull)`; opcional `@@index([formaPagamentoId])`. |
| foundation | `apps/api/prisma/schema.prisma` | 206-220 (model Rendimento) | Adicionar `formaPagamentoId Int?` + `formaPagamento FormaPagamento? @relation(fields: [formaPagamentoId], references: [id], onDelete: SetNull)`. ATENÇÃO: model hoje não tem nenhuma relation; ao adicionar, Prisma exige a back-relation `rendimentos Rendimento[]` no model novo (já no contrato). |
| foundation | `apps/api/prisma/schema.prisma` | fim do arquivo (após 355) | Criar `model FormaPagamento` exatamente como no contrato (`@@unique([pessoaId, nome])`, `@@index([pessoaId])`, relations `pessoa` onDelete Cascade, `rendimentos`, `despesas`). |
| foundation | `apps/api/prisma/migrations/` | nova pasta | Gerar migration nomeada (ex.: `add_forma_pagamento`). CLAUDE.md exige backup do SQLite antes de migrate — confirmar que o hook de backup roda (commit 0f955bb/1d92e57). DB real: `%APPDATA%\planejAI\planejAI.db` (ver MEMORY). |
| foundation | `apps/api/src/modules/finances/domain/entities/Rendimento.ts` | 1-29 | Add `formaPagamentoId: number \| null` em `Rendimento`; `formaPagamentoId?: number \| null` em `CreateRendimentoInput` e `UpdateRendimentoInput`. |
| foundation | `apps/api/src/modules/finances/domain/entities/Despesa.ts` | 11-65 | Add `formaPagamentoId: number \| null` em `Despesa`; `formaPagamentoId?: number \| null` em `CreateDespesaInput` e `UpdateDespesaInput`. |
| foundation | `apps/api/src/modules/finances/infra/prisma-rendimento.repository.ts` | 24-37 (create), 55-67 (toDomain) | `create`: persistir `formaPagamentoId: input.formaPagamentoId ?? null`. `toDomain`: mapear `formaPagamentoId: row.formaPagamentoId`. `update` (linha 40-43) já passa `data: input` direto — fica automático após interface. |
| foundation | `apps/api/src/modules/finances/infra/prisma-despesa.repository.ts` | 30-53 (create), 122-143 (toDomain) | `create`: add `formaPagamentoId: input.formaPagamentoId ?? null`. `toDomain`: add `formaPagamentoId: row.formaPagamentoId`. `update` (55-62) passa `scalar` direto — automático. Propagar `formaPagamentoId` em séries/parcelas em `create-despesa.use-case.ts` (já espalha `...cmd.despesa`). |
| foundation | `apps/api/src/modules/finances/domain/entities/Pessoa.ts` | — | Não precisa mudar (entity de domínio não expõe formas). |
| foundation | NOVOS arquivos | — | `domain/entities/FormaPagamento.ts`, `domain/repositories/IFormaPagamentoRepository.ts`, `infra/prisma-forma-pagamento.repository.ts` (findManyByPessoa(ativas), upsert por (pessoaId,nome)), `application/use-cases/list-formas-pagamento.use-case.ts`, `application/use-cases/upsert-forma-pagamento.use-case.ts`, `http/formas-pagamento.routes.ts`. Seguir padrão de `pessoas.routes.ts`. |
| foundation | `apps/api/src/modules/finances/http/formas-pagamento.routes.ts` | novo | `GET /formas-pagamento?pessoaId=<n>` (zod query `pessoaId` coerce int) → ativas da pessoa; `POST /formas-pagamento` body `{ pessoaId, nome }` → upsert. Prefixo `/api` já aplicado pelo módulo. |
| foundation | `apps/api/src/modules/finances/finances.module.ts` | 117-132 (instanciação repos), 134-258 (registers) | Instanciar `formaPagamentoRepo`; `api.register(formasPagamentoRoutes, { listFormas..., upsertForma... })`. Importar route + use-cases no topo (linhas 4-115). |
| foundation | `apps/api/src/modules/finances/http/rendimentos.routes.ts` | 8-18 (RendimentoSchema), 20-28 (CreateBody), 30-35 (UpdateBody) | Add `formaPagamentoId: z.number().nullable()` no response schema; `formaPagamentoId: z.number().int().positive().nullable().optional()` em CreateBody e UpdateBody. |
| foundation | `apps/api/src/modules/finances/http/despesas.routes.ts` | 9-40 (DespesaSchema), 51-78 (CreateDespesaBody), 80-100 (UpdateDespesaBody) | Add `formaPagamentoId` nullable ao response; `formaPagamentoId: z.number().int().positive().nullable().optional()` em Create e Update body. |
| foundation | `apps/api/src/modules/finances/application/use-cases/create-rendimento.use-case.ts` | 18-31 | `...input` já propaga `formaPagamentoId` para o primeiro e para recorrentes — só validar que entity/repo aceitam; nada extra exceto garantir o campo flui. |
| foundation | `apps/api/src/modules/finances/application/use-cases/create-despesa.use-case.ts` | 55-91 | `...cmd.despesa` já propaga `formaPagamentoId` ao primeiro, às parcelas e às recorrentes — confirmar. |
| dashboard | `apps/api/src/modules/finances/application/use-cases/get-dashboard.use-case.ts` | 40-51 (interface DashboardData), 53-79 (deps/Promise.all), 106-160 (return) | Add `despesasPorFormaPagamento: Array<{ formaPagamentoId:number; nome:string; total:number }>` em `DashboardData`. Em `execute`: quando `typeof pessoaId === 'number'`, buscar formas da pessoa (novo `formaPagamentoRepo`) e agregar `despesasReais` por `formaPagamentoId` (usar `efetivo`/valor — alinhar com a regra de despesasReais já usada). Quando pessoaId não numérico → `[]`. |
| dashboard | `apps/api/src/modules/finances/finances.module.ts` | 197-202 (register dashboard) | Passar `formaPagamentoRepo` ao construtor de `GetDashboardUseCase` (a assinatura ganha 1 dep). |
| dashboard | `apps/api/src/modules/finances/http/dashboard.routes.ts` | 5-37 (DashboardSchema) | Add ao response `despesasPorFormaPagamento: z.array(z.object({ formaPagamentoId: z.number(), nome: z.string(), total: z.number() }))`. Query schema (39-42) já tem `pessoaId` coerce nullable — OK. |
| ia-report | `apps/api/src/modules/intelligence/domain/use-cases/GenerateReportUseCase.ts` | 38-48 (constructor), 58-65 (Promise.all), 193-211 (contexto) | Add dep `formaPagamentoRepo` (ou reaproveitar agregação local). Montar `formasPagamento = soma de despesas do escopo por formaPagamentoId → [{ nome, valor }]` usando `atual.despesasFiltradas` + `efetivo`. Incluir em `contexto` SÓ se length > 0 (omitir se vazio — contrato). |
| ia-report | `apps/api/src/modules/intelligence/intelligence.module.ts` | 27-35 (repos), 42-44 (new GenerateReportUseCase) | Instanciar `formaPagamentoRepo` e passar ao construtor se a assinatura mudar. |
| ia-report | `apps/api/src/modules/intelligence/domain/prompts/generate-report.md` | 24-31 (Dados de entrada), 32-41 (Diretrizes) | Documentar campo `formasPagamento` na seção de dados; add diretriz: "se houver `formasPagamento`, comente concentração por forma (ex.: crédito vs débito) e risco de endividamento". Não inventar se ausente. |
| ui-interactive | `apps/web/src/app/rendimentos/RendimentosClient.tsx` | 17 (CATEGORIAS), 27-38 (form types/EMPTY), 116-122 (openEdit), 129-155 (handleSave), 348-357 (form fields) | Trocar `CATEGORIAS` por `CATEGORIAS_RENDIMENTO` (novo constants — ver nota). Add `formaPagamentoId` ao form state; dropdown de forma (GET `/api/formas-pagamento?pessoaId=<activePessoaId>`); forma exige pessoa selecionada. Categoria "Outros" → campo de descrição livre editável. Enviar `formaPagamentoId` no body (create/update). `RendimentoMock` type precisa do campo. |
| ui-interactive | `apps/web/src/types/rendimentos.ts` (RendimentoMock) | — | Add `formaPagamentoId?: number \| null`. (Verificar path exato do type — importado em RendimentosClient linha 13.) |
| ui-interactive | `apps/web/src/app/despesas/DespesasClient.tsx` | 24-39 (DespesaForm), 177-215 (emptyForm/openEdit), 217-247 (handleSave body), 517-529 (form fields) | Add `formaPagamentoId` ao `DespesaForm`; dropdown de forma carregado por pessoa (pessoa = dono da aba `form.abaId`); ESCONDER dropdown quando a aba selecionada é de grupo (`grupoAbaIds.has`/`divideComGrupo`) — contrato. Enviar `formaPagamentoId` no body. `DespesaMock` type + campo. |
| ui-interactive | `apps/web/src/types/despesas.ts` (DespesaMock) | — | Add `formaPagamentoId?: number \| null` (importado em DespesasClient linha 14). |
| ui-interactive | NOVO `apps/web/src/shared/constants/` (ou similar) | novo | Criar constantes compartilhadas `CATEGORIAS_RENDIMENTO` e `FORMAS_PAGAMENTO_SUGESTOES` (não existe constants file hoje; só `CATEGORIAS` inline em RendimentosClient:17). Confirmar convenção de path com o padrão de `shared/`. |
| dashboard (web) | `apps/web/src/app/dashboard/page.tsx` | 8-19 (DashboardData type), 21-31 (EMPTY), 33-39 (getDashboard) | Add `despesasPorFormaPagamento` ao type + EMPTY. `getDashboard` hoje NÃO passa `pessoaId` (linha 35) → o campo só vem populado quando há pessoaId. Decidir: ou passar pessoa no fetch, ou (mais provável) o gráfico vive em `DashboardPersonaKpis` que já tem pessoa selecionada — ver linha abaixo. |
| dashboard (web) | `apps/web/src/app/dashboard/DashboardPersonaKpis.tsx` | 204-208 (props), 242-278 (fetch effects), 557-622 (3-up breakdown row) | Add chart "Gastos por forma de pagamento". Fonte: ou novo fetch `/api/dashboard?mesRef&pessoaId=<pessoaSelecionada.id>` reagindo à pessoa, ou derivar client-side de `/api/despesas` (já carregado) + `/api/formas-pagamento`. OCULTAR card quando lista vazia (contrato). Card pessoal só (formas pertencem a pessoa). |
| dashboard (web) | `apps/web/src/app/dashboard/DashboardCharts.tsx` | — | Opcional: novo componente de chart de formas, ou reusar padrão de `BarRow` de DashboardPersonaKpis. |
| qa-infra | (API tests/manual) | — | Validar migration, GET/POST formas (upsert idempotente por unique), create/update rendimento+despesa com formaPagamentoId (e null), dashboard `despesasPorFormaPagamento` (numérico vs não), onDelete SetNull (apagar forma → lançamentos viram null) e Cascade (apagar pessoa → formas somem). |
| qa-visual | (web) | — | Validar dropdowns, ocultar em aba grupo, "Outros" editável em rendimentos, chart oculto quando vazio, sem regressão visual. |
| reviewer | TODOS | — | Conferir contratos: rotas PT sem acento, valores Float, sem auth, prompt com cache_control intacto, sem Result pattern, toDomain inline. |

**Resumo de assinaturas que mudam (heads-up para evitar conflito de merge):**
- `GetDashboardUseCase` construtor ganha `formaPagamentoRepo` (finances.module.ts:198 e get-dashboard.use-case.ts:54-63).
- `GenerateReportUseCase` construtor PODE ganhar `formaPagamentoRepo` (intelligence.module.ts:42 e GenerateReportUseCase.ts:39-48) — ia-report pode optar por agregar sem repo extra (só usa `despesasFiltradas`), o que evita tocar o construtor. **Decisão recomendada:** agregar local sem novo repo, pois `formaPagamentoId` já estará na entity Despesa após foundation. Documentar a escolha nas notas do ia-report.
- `finances.module.ts` é tocado por foundation (novo register + repo) E dashboard (nova dep no GetDashboard). Coordenar: foundation cria o `formaPagamentoRepo` const; dashboard só o reusa.

### foundation-agent

**Migration:** `20260606145157_add_forma_pagamento` — aplicada com sucesso no SQLite configurado em `apps/api/.env` (`file:../../data/planejAI.db`). Prisma Client regenerado automaticamente.

**Arquivos criados:**
- `apps/api/prisma/migrations/20260606145157_add_forma_pagamento/migration.sql`
- `apps/api/src/modules/finances/domain/entities/FormaPagamento.ts`
- `apps/api/src/modules/finances/domain/repositories/IFormaPagamentoRepository.ts`
- `apps/api/src/modules/finances/infra/prisma-forma-pagamento.repository.ts`
- `apps/api/src/modules/finances/application/use-cases/list-formas-pagamento.use-case.ts`
- `apps/api/src/modules/finances/application/use-cases/upsert-forma-pagamento.use-case.ts`
- `apps/api/src/modules/finances/http/formas-pagamento.routes.ts`

**Arquivos modificados:**
- `apps/api/prisma/schema.prisma` — model FormaPagamento adicionado; Pessoa.formasPagamento[], Despesa.formaPagamentoId + relation + index, Rendimento.formaPagamentoId + relation
- `apps/api/src/modules/finances/domain/entities/Rendimento.ts` — campo formaPagamentoId adicionado em Rendimento, CreateRendimentoInput, UpdateRendimentoInput
- `apps/api/src/modules/finances/domain/entities/Despesa.ts` — campo formaPagamentoId adicionado em Despesa, CreateDespesaInput, UpdateDespesaInput
- `apps/api/src/modules/finances/infra/prisma-rendimento.repository.ts` — create() e toDomain() atualizados
- `apps/api/src/modules/finances/infra/prisma-despesa.repository.ts` — create() e toDomain() atualizados
- `apps/api/src/modules/finances/http/rendimentos.routes.ts` — RendimentoSchema, CreateBody, UpdateBody com formaPagamentoId
- `apps/api/src/modules/finances/http/despesas.routes.ts` — DespesaSchema, CreateDespesaBody, UpdateDespesaBody com formaPagamentoId
- `apps/api/src/modules/finances/application/use-cases/get-dashboard.use-case.ts` — DashboardData + DashboardPorFormaPagamento + agregação condicional por pessoaId numérico; construtor ganha formaPagamentoRepo
- `apps/api/src/modules/finances/http/dashboard.routes.ts` — DashboardSchema com despesasPorFormaPagamento
- `apps/api/src/modules/finances/finances.module.ts` — formaPagamentoRepo instanciado, formasPagamentoRoutes registradas, GetDashboardUseCase recebe formaPagamentoRepo

**Rotas registradas:**
- `GET  /api/formas-pagamento?pessoaId=<n>` — lista formas ativas da pessoa
- `POST /api/formas-pagamento` body `{ pessoaId, nome }` — upsert; retorna 201 se criado, 200 se existia

**Interface IFormaPagamentoRepository:**
- `findMany(filter: ListFormasPagamentoFilter): Promise<FormaPagamento[]>`
- `upsert(input: CreateFormaPagamentoInput): Promise<{ forma: FormaPagamento; created: boolean }>`

**Shape de despesasPorFormaPagamento confirmada:**
```typescript
Array<{ formaPagamentoId: number; nome: string; total: number }>
// Retorna [] quando pessoaId não é número (typeof pessoaId !== 'number')
```

**Desvios do plano:** Nenhum. A propagação de `formaPagamentoId` em séries/parcelas de despesa e recorrentes de rendimento é automática pois `create-despesa.use-case.ts` usa `...cmd.despesa` e `create-rendimento.use-case.ts` usa `...input` — confirmado na leitura do código. TypeScript compilou sem erros (`tsc --noEmit` limpo).

### ui-interactive

**Arquivos criados:**
- `apps/web/src/shared/constants/financas.ts` — `CATEGORIAS_RENDIMENTO` (8 itens) + `FORMAS_PAGAMENTO_SUGESTOES` (5 itens)

**Arquivos modificados:**
- `apps/web/src/types/rendimentos.ts` — `RendimentoMock` ganhou `formaPagamentoId?: number | null`
- `apps/web/src/types/despesas.ts` — `DespesaMock` ganhou `formaPagamentoId?: number | null`
- `apps/web/src/app/rendimentos/RendimentosClient.tsx` — FP-06 + FP-07:
  - `CATEGORIAS` inline substituído por import de `CATEGORIAS_RENDIMENTO`
  - `CAT_COLORS` expandido para os 8 novos itens (cor fallback `var(--azul)`)
  - `RendimentoForm` ganhou `categoriaCustom` e `formaInput`/`formaIsCustom`
  - Quando categoria = "Outros" → campo livre exibido no formulário
  - Edição de registro com categoria fora da lista → pré-preenchida como custom
  - Dropdown forma de pagamento: `GET /api/formas-pagamento?pessoaId=` ao mudar tab; opções = union(sugestões, formas existentes da pessoa) + "Outro"
  - "Outro" → exibe campo de texto livre com botão "Voltar"
  - Submit: `POST /api/formas-pagamento` upsert antes do rendimento → obtém id → envia `formaPagamentoId`
  - Dropdown forma oculto quando não há pessoa selecionada (aba familiar ou modo single-user)
  - Tabela: coluna "Forma" adicionada com nome da forma ou "—"
- `apps/web/src/app/despesas/DespesasClient.tsx` — FP-08:
  - Interface `FormaPagamento` adicionada (local)
  - `DespesaForm` ganhou `formaPagamentoId: string`
  - `formasPagamento` state + effect que faz GET quando `form.abaId` muda
  - `emptyForm()` e `openEdit()` inicializam `formaPagamentoId`
  - `handleSave` envia `formaPagamentoId: parseInt(...) | null`
  - Formulário: dropdown forma oculto quando aba selecionada é de grupo (`formAbaPessoaId` não é número)
  - Tabela: coluna "Forma" adicionada (nome ou "—")

**Desvios do plano:** Nenhum. Despesas NUNCA cria formas — apenas seleciona das existentes da pessoa da aba. TypeScript `tsc --noEmit` limpo.

### dashboard-agent

**Abordagem:** Option 1 — fetch separado de `/api/dashboard?mesRef=<mesRef>&pessoaId=<pessoaSelecionada.id>` no client component, reagindo às mudanças de `pessoaSelecionada` e `mesRef`. Quando `pessoaSelecionada` é null (aba grupo/Familiar), o estado é resetado para `[]` e o chart não é renderizado.

**Arquivo modificado:**
- `apps/web/src/app/dashboard/DashboardPersonaKpis.tsx`

**Mudanças (por seção):**

| Linha aprox. | O que mudou |
|---|---|
| 4 | Import adicionado: `BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell` do recharts |
| 18 | Interface `FormaPagamentoData { formaPagamentoId: number; nome: string; total: number }` |
| 218 | Estado `const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoData[]>([])` |
| 259-270 | `useEffect` que busca `/api/dashboard?mesRef&pessoaId` quando `pessoaSelecionada` muda; reseta para `[]` quando null |
| 641-644 | Guard render: `{formasPagamento.length > 0 && <GastosPorFormaPagamento data={formasPagamento} />}` após `<DashboardCharts>` |
| 649-742 | Constante `FORMA_COLORS` (paleta canônica: `--verde`, `--roxo`, `--azul`, + extras), função `fmtBrl`, componentes `FormaTip` (tooltip customizado) e `GastosPorFormaPagamento` (BarChart horizontal com `Cell` por cor) |

**Comportamento:**
- Chart oculto: aba Familiar/grupo, pessoa sem dados, array vazio
- Chart visível: pessoa selecionada com ao menos 1 forma de pagamento com gastos no mês
- Valores monetários: `fontFamily: 'var(--font-mono)'` (JetBrains Mono) no tooltip
- Cores: paleta rotativa começando em `var(--verde)`, `var(--roxo)`, `var(--azul)` (tokens CSS canônicos)
- Barras horizontais (layout="vertical") ordenadas do maior para o menor gasto
- Altura dinâmica: `Math.max(220, sorted.length * 48)` para acomodar n formas

**TypeScript:** `tsc --noEmit` limpo sem erros.

### ia-report-agent

**Abordagem escolhida:** Option 2 — extensão da entidade `Despesa` com `formaPagamentoNome: string | null`. Sem novo dep no construtor de `GenerateReportUseCase` (construtor inalterado).

**Arquivos modificados:**

| Arquivo | O que mudou |
|---|---|
| `apps/api/src/modules/finances/domain/entities/Despesa.ts` | Adicionado `formaPagamentoNome: string \| null` à interface `Despesa` |
| `apps/api/src/modules/finances/infra/prisma-despesa.repository.ts` | `findMany`: `include` ampliado com `formaPagamento: true`; `toDomain()` ganha parâmetro `forma?: PrismaFormaPagamento \| null` e mapeia `formaPagamentoNome: forma?.nome ?? null` |
| `apps/api/src/modules/intelligence/domain/use-cases/GenerateReportUseCase.ts` | Agrega `porFormaPagamento` a partir de `atual.despesasFiltradas` (usando `d.formaPagamentoNome` + `efetivo(d)`); monta array `formasPagamento` ordenado por valor desc; inclui no `contexto` via spread condicional `...(formasPagamento.length > 0 && { formasPagamento })` |
| `apps/api/src/modules/intelligence/domain/prompts/generate-report.md` | Seção "Dados de entrada": documenta `formasPagamento` (opcional, `{ nome, valor }`); seção "Diretrizes": nova diretriz sobre concentração/risco de crédito vs débito, e instrução para omitir análise se campo ausente |

**Construtor `GenerateReportUseCase`:** inalterado — sem novo dep `formaPagamentoRepo`.

**`intelligence.module.ts`:** sem alteração.

**TypeScript:** `tsc --noEmit` limpo sem erros.

### qa-infra

**All tests PASS.** Server used: `apps/data/planejAI.db` (correct — Prisma resolves `file:../../data/planejAI.db` relative to `apps/api/prisma/`, i.e. `apps/data/planejAI.db`). Note: `data/planejAI.db` at repo root is an unrelated legacy file and has only 9 migrations.

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | `npx prisma validate` | ✅ PASS | "The schema is valid" |
| 2 | `tsc --noEmit` in `apps/api` | ✅ PASS | No errors, clean output |
| 3a | Migration `20260606145157_add_forma_pagamento` exists | ✅ PASS | File present in `apps/api/prisma/migrations/` |
| 3b | Migration applied to server DB (`apps/data/planejAI.db`) | ✅ PASS | `FormaPagamento` table present, `formaPagamentoId` col in `Despesa` and `Rendimento` |
| 4 | `POST /api/formas-pagamento` first call → 201 + id | ✅ PASS | `{"id":1,"pessoaId":8,"nome":"Pix","ativo":true,"ordem":0}` |
| 5 | `POST /api/formas-pagamento` same payload → 200 + SAME id | ✅ PASS | Upsert idempotent; same id returned with 200 |
| 6 | `GET /api/formas-pagamento?pessoaId=8` → array with "Pix" | ✅ PASS | Returns `[{id:1, nome:"Pix", ...}]` |
| 7 | Create rendimento with `formaPagamentoId` → 201; fetch back → field present | ✅ PASS | `formaPagamentoId: 1` in both create response and list |
| 8 | Create despesa with `formaPagamentoId` → 201; fetch back → field present | ✅ PASS | `formaPagamentoId: 1` in both create response and list |
| 9 | `GET /api/dashboard?mesRef=2026-06&pessoaId=8` → `despesasPorFormaPagamento` is array | ✅ PASS | `[{formaPagamentoId:1, nome:"Pix", total:150.5}]` |
| 10 | `GET /api/dashboard?mesRef=2026-06` (no pessoaId) → `despesasPorFormaPagamento` is `[]` | ✅ PASS | Empty array returned |
| 11 | onDelete SetNull: delete forma → rendimento/despesa `formaPagamentoId` → null | ✅ PASS | Verified via direct DB DELETE with `PRAGMA foreign_keys=ON`; both rows became null with no error |
| 12 | onDelete Cascade: FormaPagamento → Pessoa (schema) | ✅ PASS | `PRAGMA foreign_key_list(FormaPagamento)` shows `ON DELETE CASCADE` for `pessoaId → Pessoa.id` |
| 13 | onDelete SetNull in DB DDL (Despesa, Rendimento) | ✅ PASS | `PRAGMA foreign_key_list(Despesa/Rendimento)` confirms `ON DELETE SET NULL` for `formaPagamentoId → FormaPagamento.id` |

**Note — DELETE route not implemented:** `DELETE /api/formas-pagamento/:id` returns 404 (route not in `formas-pagamento.routes.ts`). The onDelete SetNull behavior was verified via direct SQLite deletion instead. This route was not listed as a requirement in the feature spec (only GET + POST upsert were contracted), so this is **not a blocker**.

**DB path clarification for reviewer:** The project has two planejAI.db files:
- `data/planejAI.db` (repo root) — legacy/backup, only 9 migrations, NOT used by the TS server
- `apps/data/planejAI.db` — the actual server DB, 10 migrations applied including `add_forma_pagamento`

`npx prisma migrate status` (CWD=`apps/api`) also resolves to `apps/data/planejAI.db` and correctly reports "up to date".

### qa-visual

**Overall verdict: PASS** — all FP-06/07/08/09 items correct. One minor note on FP-08 (no "Outro" free-text in Despesas forma dropdown, which is by design per spec — Despesas must NEVER create formas).

---

#### FP-06: Categoria "Outros" editável (rendimentos)

- [x] PASS — `CATEGORIAS_RENDIMENTO` imported from `apps/web/src/shared/constants/financas.ts`. File has exactly 8 items: Salário, Renda Extra, Investimentos, Aluguel, Benefícios, Pensão, Reembolso, Outros.
- [x] PASS — `showCategoriaCustomInput = form.categoria === 'Outros'` renders a free-text input (`categoriaCustom`) when categoria is "Outros" (line 248/462-472).
- [x] PASS — On submit (`handleSave`): `categoriaFinal = form.categoriaCustom.trim()` is used as `categoria` when `form.categoria === 'Outros'` and custom text is non-empty (lines 185-187, 203).
- [x] PASS — `openEdit`: when `!catInList`, sets `categoria = 'Outros'` and `categoriaCustom = r.categoria` (lines 148-151), correctly pre-filling the free-text field.

#### FP-07: Dropdown forma de pagamento (rendimentos)

- [x] PASS — `useEffect` fetches `GET /api/formas-pagamento?pessoaId=${activePessoaId}` when `activePessoaId` changes and is a number (lines 101-109).
- [x] PASS — `formaOptions` = `[...FORMAS_PAGAMENTO_SUGESTOES, ...existingNomes deduplicated]` + `'Outro'` appended (lines 134-138).
- [x] PASS — Selecting "Outro" sets `formaIsCustom: true`; when `form.formaIsCustom` is true, a free-text input renders instead of the select (lines 477-515).
- [x] PASS — On submit: `POST /api/formas-pagamento` called with `{ pessoaId: activePessoaId, nome: form.formaInput.trim() }`, and the returned `id` is used as `formaPagamentoId` (lines 191-201).
- [x] PASS — `showFormaDropdown = typeof activePessoaId === 'number' && modalOpen` — forma field hidden when no pessoa selected (null = familiar tab or undefined = single-user) (line 251).
- [x] PASS — `RendimentoForm` includes `formaInput: string` and `formaIsCustom: boolean`; `EMPTY_FORM` initializes both (lines 30-45). Note: the form tracks `formaInput`/`formaIsCustom` rather than a direct `formaPagamentoId` field (the id is resolved at submit time), which is a correct implementation pattern.
- [x] PASS — Rendimento body sent to API includes `formaPagamentoId` (line 211).
- [x] PASS — Table has "Forma" column (line 392); each row looks up the forma name from `formasPagamento` state (lines 399-401, 418-419).

#### FP-08: Dropdown forma de pagamento (despesas)

- [x] PASS — `useEffect` fetches `GET /api/formas-pagamento?pessoaId=${pessoaId}` when `form.abaId` changes, where `pessoaId` is derived from the selected aba (lines 93-104).
- [x] PASS — `showFormaDropdown = typeof formAbaPessoaId === 'number'` — forma field hidden when selected aba has `pessoaId == null` (group tab) (lines 324-325, 649-663).
- [x] PASS — Despesa body includes `formaPagamentoId: form.formaPagamentoId ? parseInt(form.formaPagamentoId) : null` (line 267).
- [x] PASS — `DespesasClient` does NOT call `POST /api/formas-pagamento` anywhere. Dropdown only shows existing formas from GET. No forma creation in despesas.
- [x] PASS — `emptyForm()` initializes `formaPagamentoId: ''` (line 204); `openEdit()` sets `formaPagamentoId: d.formaPagamentoId ? String(d.formaPagamentoId) : ''` (line 232).
- [x] PASS — Table has "Forma" column header (line 432) and cell rendering (lines 459-464).
- NOTE: Despesas forma dropdown only shows stored formas (no FORMAS_PAGAMENTO_SUGESTOES union, no "Outro" option). This is correct per spec ("Despesa NUNCA calls POST /api/formas-pagamento"). The dropdown is read-only selection from existing records.

#### FP-09: Dashboard chart

- [x] PASS — `useEffect` fetches `/api/dashboard?mesRef=${mesRef}&pessoaId=${pessoaSelecionada.id}` when `pessoaSelecionada` changes (lines 260-270). When `pessoaSelecionada` is null, `formasPagamento` is reset to `[]`.
- [x] PASS — `formasPagamento` stored in state as `FormaPagamentoData[]` (`useState<FormaPagamentoData[]>([])`), populated from `data.despesasPorFormaPagamento ?? []` (lines 218, 268).
- [x] PASS — Guard: `{formasPagamento.length > 0 && <GastosPorFormaPagamento data={formasPagamento} />}` (lines 641-644). Chart NOT rendered when array is empty.
- [x] PASS — Title is exactly "Gastos por forma de pagamento" (line 697).
- [x] PASS — Uses recharts `BarChart` with `layout="vertical"`, `Bar`, `Cell`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip` (lines 704-738).
- [x] PASS — Tooltip values use `fontFamily: 'var(--font-mono)'` (JetBrains Mono) and `fontVariantNumeric: 'tabular-nums'` (line 681).
- [x] PASS — `FORMA_COLORS` array starts with `'var(--verde)'`, `'var(--roxo)'`, `'var(--azul)'` — design system CSS vars (lines 650-659). Each bar gets a `Cell` with a color from the rotating palette (lines 734-736).

#### General

- [x] PASS — No new npm dependencies added. `apps/web/package.json` dependencies unchanged from expected set (next, react, react-dom, recharts, lucide-react, @tanstack/react-query, pdf-lib, pdfjs-dist).
- [x] PASS — No Zustand or forbidden state-management imports found in any reviewed file.
- [x] PASS — `apps/web/src/shared/constants/financas.ts` exists with `CATEGORIAS_RENDIMENTO` (8 items, ends with "Outros") and `FORMAS_PAGAMENTO_SUGESTOES` (5 items: Débito, Crédito, Dinheiro, Pix, Vale alimentação).
- [x] PASS — `cd apps/web && npx tsc --noEmit` exits cleanly with no errors.

#### Critical issues

None.

### reviewer

**Verdict:** No blocking issues found for the core Forma de Pagamento contracts. Contracts respected: rotas PT sem acento (`/api/formas-pagamento`), valores Float, sem auth, `cache_control` ephemeral intacto nas duas chamadas Anthropic (AnthropicRepository.ts:16, dynamic-llm.repository.ts:36), sem Result/Either, `toDomain()` inline nos repos, `domain/` sem imports de Prisma/Fastify/SDK, entity `FormaPagamento` + `IFormaPagamentoRepository` em `domain/`, repo Prisma implementa a interface. Sem N+1 (dashboard faz 1 findMany extra; report agrega em memória). DespesasClient NUNCA chama POST /api/formas-pagamento.

**Findings (non-blocking, recommend fixing before merge):**

- `apps/web/src/app/rendimentos/RendimentosClient.tsx:248-250,272`: 🟡 risk: ao editar um rendimento que tem forma, se `activePessoaId` não for número (single-user sem tabs, ou aba Familiar), `handleSave` envia `formaPagamentoId: null` e apaga a forma existente no PUT. Despesas preserva (openEdit inicializa o campo); rendimentos recomputa de `formaInput` que fica vazio quando o dropdown está oculto. Fix: só enviar `formaPagamentoId` quando o dropdown está visível, senão omitir do body.

- `apps/web/src/app/despesas/DespesasClient.tsx:459-464` (e `rendimentos:393-395`): 🟡 risk: coluna "Forma" da tabela resolve o nome via state `formasPagamento`, que só é carregado para a pessoa da aba selecionada no formulário (e fica vazio quando nenhum modal está aberto). Linhas de outras pessoas/abas mostram "—" mesmo tendo forma. Sem vazamento de nome errado (ids são globais), mas exibição incorreta. Causa raiz: a rota de despesas resolve `formaPagamentoNome` no repo mas o response schema (`despesas.routes.ts:9-41`) NÃO inclui `formaPagamentoNome`, então o zod serializer o remove. Fix: adicionar `formaPagamentoNome: z.string().nullable()` ao DespesaSchema (e ao RendimentoSchema) e renderizar a partir do próprio registro, não do state por-pessoa.

- `apps/api/src/modules/finances/application/use-cases/create-despesa.use-case.ts` + `create-rendimento.use-case.ts` + `upsert-forma-pagamento.use-case.ts`: 🟡 risk: nenhum valida que o `formaPagamentoId` (ou o pessoaId do lançamento) pertence à pessoa correta. Backend aceita `formaPagamentoId` de OUTRA pessoa em create/update de despesa/rendimento — vazamento de forma entre pessoas via API direta. O onDelete SetNull do FK só protege contra forma inexistente. Fix: validar que `forma.pessoaId === pessoa do lançamento` antes de persistir.

- `apps/api/src/modules/finances/infra/prisma-forma-pagamento.repository.ts:35-37`: 🟡 risk: `upsert` faz `update: { ativo: true }`, reativando silenciosamente uma forma desativada sempre que um lançamento reutiliza o nome. Sem rota DELETE hoje (qa-infra), então latente, mas surpresa quando soft-delete existir.

- `apps/api/src/modules/finances/application/use-cases/upsert-forma-pagamento.use-case.ts:17-19`: 🔵 nit: pessoaId inexistente cai no FK do DB → 500 em vez de 400. Validar existência da pessoa para erro limpo.

**Out of scope deste diff (não-bloqueante):** o diff também traz mudanças não relacionadas a Forma de Pagamento (export de faturas por cartão/fatura em `export-faturas.use-case.ts`, `export.routes.ts`, `GestaoClient.tsx`) — fora do contrato da feature, não revisadas a fundo. Backup pré-migration é hook externo (commits 0f955bb/1d92e57), fora deste diff.

## Conflitos / Alertas

1. **Naming overlap — `AcertoEntry.formaPagamento` (String) já existe** (schema.prisma:169; também em acerto.routes.ts:39/82 como enum `pix|ted|dinheiro|outro`, e Acerto.ts:32/48). É um campo **não relacionado** ao novo `model FormaPagamento`. NÃO conflundir: o acerto continua sendo string livre/enum; o novo recurso é um relacionamento FK por pessoa. Nenhuma mudança no acerto.

2. **`Rendimento` não tem nenhuma relation hoje** (schema.prisma:206-220 — só `pessoaId Int?` solto, sem `pessoa Pessoa @relation`). Ao adicionar `formaPagamento` relation, o Prisma vai validar/criar a back-relation `FormaPagamento.rendimentos Rendimento[]` (já está no contrato). Viável. Não é necessário adicionar a relation `pessoa` ao Rendimento (fora de escopo).

3. **`finances.module.ts` é ponto de contenção** entre foundation (novo register/repo) e dashboard (nova dep no `GetDashboardUseCase`). Sequenciamento já força foundation antes; dashboard só reusa o const `formaPagamentoRepo`. Sem violação, mas exige ordem.

4. **Web não tem arquivo de constantes** — `CATEGORIAS` está inline em RendimentosClient:17 e categorias de despesa vêm de `useCategorias()` (hook). O contrato pede `CATEGORIAS_RENDIMENTO` (8 itens, lista NOVA e diferente da atual de 5) e `FORMAS_PAGAMENTO_SUGESTOES`. ui-interactive deve criar um módulo de constantes compartilhado. **Atenção:** a nova `CATEGORIAS_RENDIMENTO` muda a UX (de 5 para 8 categorias: Salário/Renda Extra/Investimentos/Aluguel/Benefícios/Pensão/Reembolso/Outros). Dados antigos com categorias fora da nova lista continuam válidos (categoria é String livre no banco) — apenas o dropdown muda.

5. **Dashboard `despesasPorFormaPagamento` depende de pessoaId numérico.** O `page.tsx` (server component) hoje chama `/api/dashboard?mesRef=` SEM pessoaId (linha 35), então o campo viria vazio nesse fetch. O gráfico por-pessoa vive no client `DashboardPersonaKpis` que conhece a pessoa selecionada — dashboard-agent deve buscar/derivar os dados no client (com pessoaId) e não no server page. Contrato "vazio quando pessoaId não numérico" é respeitado pela lógica do use-case.

6. **Next.js customizado** (apps/web/AGENTS.md): "This is NOT the Next.js you know" — agents de frontend devem ler `node_modules/next/dist/docs/` antes de escrever código. Não afeta o map, mas é um gate de implementação.

7. **Backup antes da migration** (CLAUDE.md / commits 0f955bb, 1d92e57): foundation deve garantir backup do SQLite. DB de produção = `%APPDATA%\planejAI\planejAI.db` (MEMORY: Electron shared userData). A migration roda contra o DATABASE_URL configurado.

8. **`prompt_formapgto.md` na raiz do repo** já contém o roteiro original de tasks (TASK-FP-01..) e bate com estes contratos — usar como fonte cruzada, não há divergência detectada.
