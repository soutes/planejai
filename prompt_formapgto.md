# Time de Agentes — Feature "Forma de Pagamento" (Modelo A) + Categorias de Rendimento

## Objetivo

Duas mudanças independentes:

1. **Forma de pagamento como atributo da DESPESA** (Modelo A — etiqueta, sem valor próprio, sem saldo). Responde *"como paguei"*. Chart no dashboard: "Gastos por forma de pagamento". Análise no relatório IA.
2. **Trocar a lista fixa de categorias de rendimento** por uma genérica + "Outros" editável.

> **Decisão de modelo (importante):** forma de pagamento NÃO vai no rendimento. "Pix/Débito/Crédito" descrevem *como uma despesa saiu* — não têm valor próprio. Padrão de Mobills/Organizze/YNAB. Se um dia quiser "para onde o dinheiro está parado", isso é o Modelo B (Contas com saldo) — fora deste escopo.

**Escopo travado:**
- `FormaPagamento` **por pessoa** (`pessoaId NOT NULL`). Lista própria: defaults = sugestões na UI; custom criado via "Outro".
- Forma é referenciada **só pela Despesa** (`formaPagamentoId` nullable). **Rendimento NÃO tem forma de pagamento.**
- Abas de grupo/Familiar **não** usam forma (campo escondido). Forma só em despesa de aba pessoal.
- Despesa: dropdown opcional, default placeholder "Forma de Pagamento" (null).
- Dashboard: `despesasPorFormaPagamento` só quando `pessoaId` é número; exclui null; chart oculto se vazio.
- Relatório IA: `formasPagamento` no contexto só se não-vazio.
- Categoria de rendimento: lista genérica + "Outros" editável (campo `categoria` segue `String`, sem mudança de schema).

---

## Contratos compartilhados (NÃO divergir — todos os agents seguem isto)

**Prisma:**
```prisma
model FormaPagamento {
  id       Int     @id @default(autoincrement())
  pessoaId Int
  nome     String
  ativo    Boolean @default(true)
  ordem    Int     @default(0)
  pessoa   Pessoa  @relation(fields: [pessoaId], references: [id], onDelete: Cascade)
  despesas Despesa[]
  @@unique([pessoaId, nome])
  @@index([pessoaId])
}
// Despesa: formaPagamentoId Int?  + relation (onDelete: SetNull)
// Pessoa:  formasPagamento FormaPagamento[]
// Rendimento: SEM alteração de schema (categoria continua String)
```

**Rotas API** (PT sem acento):
- `GET  /api/formas-pagamento?pessoaId=<n>` → formas ativas da pessoa (sugestões default são da UI; aqui só vêm as já criadas).
- `POST /api/formas-pagamento` body `{ pessoaId:number, nome:string }` → **upsert** por `@@unique([pessoaId,nome])` (retorna existente se duplicado). 201/200.
- `create/update` de **despesa**: aceita `formaPagamentoId?: number | null`.
- `GET /api/dashboard?mesRef&pessoaId`: novo campo de resposta.

**Tipos de resposta:**
- Dashboard: `despesasPorFormaPagamento: Array<{ formaPagamentoId:number; nome:string; total:number }>` (vazio quando `pessoaId` não numérico).
- Report contexto: `formasPagamento?: Array<{ nome:string; valor:number }>` (omitido se vazio).

**Constantes (shared):**
- `FORMAS_PAGAMENTO_SUGESTOES = ['Débito','Crédito','Dinheiro','Pix','Vale alimentação']`
- `CATEGORIAS_RENDIMENTO = ['Salário','Renda Extra','Investimentos','Aluguel','Benefícios','Pensão','Reembolso','Outros']`

---

## Execução em tmux (lifecycle da pane)

Cada agent roda em **sua própria pane tmux**. Regras:

1. Toda a comunicação entre agents passa pelo `status.md` — panes não trocam mensagem direta.
2. **Ordem de encerramento (obrigatória):** terminar trabalho → atualizar `status.md` (`✅ DONE` + Notas de saída) → **fechar a própria pane**. Nunca fechar antes de gravar DONE (downstream depende disso).
3. Fechar a pane (último comando do agent):
   ```bash
   tmux kill-pane -t "$TMUX_PANE"
   ```
   (`$TMUX_PANE` = id da pane corrente; fallback: `exit`.)
4. Se `🔴 BLOCKED`: NÃO fechar a pane — gravar motivo no `status.md` e aguardar o lead.
5. `team-lead` é a **última** pane a fechar — só após `reviewer` DONE e checklist global completo.

---

## Protocolo `status.md`

Arquivo único: **`docs/feature-forma-pagamento/status.md`**. Criado pelo `team-lead`. **Toda** ação de agent segue:

1. **Antes de começar:** ler `status.md`. Só iniciar se TODAS as deps estiverem `✅ DONE`. Senão, aguardar/re-checar.
2. **Ao começar:** marcar própria linha `🔵 IN_PROGRESS` + timestamp.
3. **Ao terminar:** marcar `✅ DONE`, preencher **Notas de saída** com contratos reais (nomes finais de arquivos/rotas/tipos) para downstream não adivinhar.
4. **Ao fechar:** após gravar DONE, fechar a própria pane (`tmux kill-pane -t "$TMUX_PANE"`). Ver seção *Execução em tmux*.
5. **Se travar:** `🔴 BLOCKED` + motivo. Lead resolve. Pane fica aberta.

**Template:**
```markdown
# Status — Feature Forma de Pagamento (Modelo A)

## Estado dos agents
| Agent            | Status        | Depende de              | Atualizado |
|------------------|---------------|-------------------------|------------|
| team-lead        | 🔵 IN_PROGRESS | —                       |            |
| foundation-agent | ⚪ WAITING     | team-lead               |            |
| ui-interactive   | ⚪ WAITING     | foundation-agent        |            |
| dashboard-agent  | ⚪ WAITING     | foundation-agent        |            |
| ia-report-agent  | ⚪ WAITING     | foundation-agent        |            |
| qa-infra         | ⚪ WAITING     | foundation-agent        |            |
| qa-visual        | ⚪ WAITING     | ui-interactive, dashboard-agent |    |
| reviewer         | ⚪ WAITING     | TODOS                   |            |

## Checklist global
- [ ] Schema + migration aplicada (backup ok) — FormaPagamento + Despesa.formaPagamentoId
- [ ] Rotas formas-pagamento (GET ?pessoaId / POST upsert)
- [ ] Despesa aceita formaPagamentoId (create/update)
- [ ] Dashboard agg despesasPorFormaPagamento
- [ ] Form rendimentos: categorias genéricas + "Outros" editável (sem forma!)
- [ ] Form despesas: dropdown forma (escondido em aba grupo)
- [ ] Chart "Gastos por forma de pagamento" (oculto se vazio)
- [ ] Relatório IA: contexto + diretriz de forma de pagamento
- [ ] QA infra ✅ · QA visual ✅
- [ ] Review final ✅

## Notas de saída (preenchido por cada agent ao concluir)
### foundation-agent
- (rotas finais, paths de arquivos, nomes de use-cases/repos, shape do dashboard...)
### ui-interactive
- ...
```

---

### Agente 1 — Team-Lead (read-only)
- **Name:** `team-lead` · **Model:** `claude-opus-4-8` · **Subagent:** `cavecrew-investigator`
- **Ler antes:** `CLAUDE.md`, `apps/api/prisma/schema.prisma`, `apps/api/src/modules/finances/**` (entities, repos, use-cases, http, module factory), `apps/api/src/modules/intelligence/domain/use-cases/GenerateReportUseCase.ts` + `prompts/generate-report.md`, `apps/web/src/app/{rendimentos,despesas,dashboard}/**`.
- **Saída:** cria `docs/feature-forma-pagamento/status.md` (template acima) + mapa de pontos de integração. **Não escreve código.**

```
TASK-FP-00: Mapa de integração + status.md
  — Localizar: dashboard use-case (get-dashboard) + DashboardSchema; factory de
    DI do módulo finances; despesas.routes.ts + create/update-despesa use-cases;
    repo prisma de despesa; seed; migrations existentes; constante CATEGORIAS
    no front + map de cores em RendimentosClient; como aba define dono
    (AbaDespesa.pessoaId) para regra "esconder forma em grupo".
  — Produzir tabela file:line de cada ponto a tocar.
  — Validar Contratos compartilhados contra o código; sinalizar conflito ANTES
    de qualquer build. CONFIRMAR que Rendimento NÃO será tocado no schema.
  — Criar status.md. Liberar foundation-agent.
  — depende de: —
```

---

### Agente 2 — Foundation (infra compartilhada / backend)
- **Name:** `foundation-agent` · **Model:** `claude-sonnet-4-6` · **Subagent:** `general-purpose`
- **Ler antes:** mapa FP-00, `schema.prisma`, entities/repos/use-cases de despesa, factory do módulo, `dashboard.routes.ts` + get-dashboard use-case, rotina de backup pré-migration.

```
TASK-FP-01: Schema + migration
  — Adicionar model FormaPagamento + FK nullable Despesa.formaPagamentoId +
    relation em Pessoa (conforme Contratos). NÃO tocar em Rendimento.
  — Migration nomeada (ex: add_forma_pagamento). Garantir backup pré-migration.
    NÃO apagar dados.
  — Notas de saída: nome da migration.
  — depende de: TASK-FP-00

TASK-FP-02: Domínio + repo FormaPagamento
  — entities/FormaPagamento.ts (+ Create input).
  — repositories/IFormaPagamentoRepository.ts: findByPessoa(pessoaId, {ativo}),
    upsert({pessoaId,nome}).
  — infra/prisma-forma-pagamento.repository.ts (toDomain inline).
  — depende de: TASK-FP-01

TASK-FP-03: Use-cases + rotas formas-pagamento
  — list-formas-pagamento (por pessoaId) e upsert-forma-pagamento.
  — http/formas-pagamento.routes.ts: GET ?pessoaId, POST upsert. Zod schemas.
  — Registrar no factory/módulo + no app de rotas.
  — depende de: TASK-FP-02

TASK-FP-04: formaPagamentoId na DESPESA
  — Entity Despesa: + formaPagamentoId (interface + Create/Update).
  — Zod em despesas.routes.ts: formaPagamentoId
    z.number().int().positive().nullable().optional() (Create/Update + Schema resp).
  — create/update-despesa use-cases: persistir formaPagamentoId (propagar em
    séries recorrentes/parceladas igual aos outros campos).
  — Repo prisma de despesa: incluir no toDomain + create/update.
  — (Rendimento: NÃO mexer.)
  — depende de: TASK-FP-01

TASK-FP-05: Agg dashboard despesasPorFormaPagamento
  — get-dashboard use-case: quando pessoaId é número, agrupar despesas da
    pessoa (mesma regra de escopo já usada) por formaPagamentoId, somar valor
    efetivo, excluir null. Resolver nome via FormaPagamento. pessoaId não
    numérico → []. Sem N+1.
  — DashboardSchema (dashboard.routes.ts): + despesasPorFormaPagamento.
  — Notas de saída: shape exato + nome do campo.
  — depende de: TASK-FP-02, TASK-FP-04
```

---

### Agente 3 — UI Interactive (formulários e fluxos)
- **Name:** `ui-interactive` · **Model:** `claude-sonnet-4-6` · **Subagent:** `general-purpose`
- **Ler antes:** Notas de saída do foundation-agent, `RendimentosClient.tsx`, `DespesasClient.tsx`, fetch helper do front, `tokens.css`.

```
TASK-FP-06: Categorias genéricas + "Outros" editável (rendimentos)
  — Trocar CATEGORIAS por CATEGORIAS_RENDIMENTO genérico (Contratos).
    Atualizar map de cores (cor fallback p/ categoria custom).
  — Ao selecionar "Outros": exibir input livre; salvar texto digitado como
    categoria. Edição de registro com categoria fora da lista → tratar como custom.
  — NÃO adicionar forma de pagamento ao rendimento (Modelo A).
  — depende de: TASK-FP-00  (não depende de backend)

TASK-FP-07: Dropdown forma de pagamento — DESPESAS
  — Form despesa: dropdown forma, placeholder "Forma de Pagamento" (null default).
  — Opções = FORMAS_PAGAMENTO_SUGESTOES ∪ formas já criadas da pessoa dona da
    aba (GET /formas-pagamento?pessoaId) + "Outro" → input livre.
  — Ao escolher sugestão/Outro inédita: resolver via POST upsert (pessoaId,nome)
    → usar id em formaPagamentoId. Pessoa = dono da aba selecionada.
  — Se aba é grupo/Familiar (aba.pessoaId == null) → ESCONDER o campo.
  — Exibir forma na lista/tabela + edição.
  — depende de: TASK-FP-03, TASK-FP-04
```

---

### Agente 4 — Dashboard (chart)
- **Name:** `dashboard-agent` · **Model:** `claude-sonnet-4-6` · **Subagent:** `general-purpose`
- **Ler antes:** Notas do foundation (shape de `despesasPorFormaPagamento`), página dashboard, charts recharts existentes, `tokens.css`.

```
TASK-FP-08: Chart "Gastos por forma de pagamento"
  — BarChart recharts no dashboard consumindo despesasPorFormaPagamento.
  — Título exato: "Gastos por forma de pagamento".
  — NÃO renderizar o card/chart se o array vier vazio (grupo/Familiar/Todos
    ou pessoa sem dados). Cores do design system. Valores em fonte mono.
  — depende de: TASK-FP-05
```

---

### Agente 5 — IA Relatório
- **Name:** `ia-report-agent` · **Model:** `claude-sonnet-4-6` · **Subagent:** `general-purpose`
- **Ler antes:** `GenerateReportUseCase.ts`, `prompts/generate-report.md`, Notas do foundation (formaPagamentoId em despesa).

```
TASK-FP-09: Contexto + diretriz de forma de pagamento no relatório
  — GenerateReportUseCase: montar formasPagamento = soma de despesas do escopo
    (apenas pessoaId numérico) por forma, excluindo null. Só adicionar ao
    contexto se array não-vazio (espelhar padrão de `cartoes`).
  — generate-report.md: nova diretriz — "se houver `formasPagamento`, comente
    concentração/distribuição dos gastos por forma; se não houver, não comente."
    Manter cache_control no system prompt (já é via PROMPTS).
  — depende de: TASK-FP-04
```

---

### Agente 6 — QA Infra
- **Name:** `qa-infra` · **Model:** `claude-sonnet-4-6` · **Subagent:** `general-purpose`
- **Ler antes:** Notas do foundation, rotas novas, schema.

```
TASK-FP-10: Verificação backend
  — npx prisma validate + migration aplicada sem erro; checar backup gerado.
  — Subir api :3001. Exercitar: POST forma (upsert idempotente — 2x mesmo nome
    = 1 linha); GET ?pessoaId; criar despesa c/ formaPagamentoId; GET
    /dashboard?pessoaId → conferir despesasPorFormaPagamento; GET /dashboard
    sem pessoaId → array vazio. Confirmar que rendimento NÃO ganhou forma.
  — Conferir onDelete SetNull (apagar forma não quebra despesa).
  — Reportar PASS/FAIL por item no status.md. NÃO corrige — devolve findings
    ao lead se FAIL.
  — depende de: TASK-FP-03, TASK-FP-05, TASK-FP-09
```

---

### Agente 7 — QA Visual
- **Name:** `qa-visual` · **Model:** `claude-sonnet-4-6` · **Subagent:** `general-purpose` (usa preview_* tools)
- **Ler antes:** páginas rendimentos/despesas/dashboard, Notas de ui-interactive + dashboard-agent.

```
TASK-FP-11: Verificação visual (preview)
  — preview_start, exercitar: rendimento com categoria "Outros" editável (e
    SEM campo de forma); despesa com forma + "Outro"; aba grupo → campo forma
    ausente; dashboard → chart aparece c/ dados e SOME quando sem dados.
  — preview_console_logs sem erro; preview_screenshot do chart + forms.
  — Checar responsivo (preview_resize) e tokens de cor/fonte.
  — Reportar PASS/FAIL + screenshots no status.md. NÃO corrige.
  — depende de: TASK-FP-07, TASK-FP-08
```

---

### Agente 8 — Reviewer
- **Name:** `reviewer` · **Model:** `claude-opus-4-8` · **Subagent:** `cavecrew-reviewer`
- **Ler antes:** diff completo do branch.

```
TASK-FP-12: Review final
  — Revisar diff: aderência a CLAUDE.md (sem Result pattern, toDomain inline,
    domain não importa Prisma/Fastify, rotas PT sem acento, valores Float,
    mesRef YYYY-MM, cache_control no prompt).
  — Caçar: rendimento alterado por engano (não deve!), N+1 no dashboard agg,
    vazamento de forma entre pessoas, chart sem guarda de vazio, migration sem
    backup, forma aparecendo em aba grupo.
  — Saída: 1 linha por achado, severity-tagged. Sem elogio. Devolve ao lead.
  — depende de: TODOS DONE + QA PASS
```

---

## Grafo de execução

```
team-lead
   └─> foundation-agent
          ├─> ui-interactive ─┐
          ├─> dashboard-agent ┼─> qa-visual ─┐
          ├─> ia-report-agent │              ├─> reviewer
          └─> qa-infra ───────┘──────────────┘
```
- `ui-interactive` TASK-FP-06 (categorias) pode rodar logo após o lead (não depende do backend) — paraleliza cedo.
- `qa-infra` e `qa-visual` são gates antes do `reviewer`.
