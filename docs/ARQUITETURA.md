# Arquitetura — planejAÍ v2.0

> Documento vivo — atualizar a cada alteração de stack, schema ou padrão arquitetural.
> Última atualização: 2026-05-28

---

## Visão geral

**planejAÍ** é um app de gestão financeira pessoal e familiar, **desktop-first**, **local-only**. Sem servidor remoto, sem conta, sem dados em nuvem. IA é opcional e acionada explicitamente.

### Versões

| Versão | Stack | Status |
|--------|-------|--------|
| **v1.0** | Python + Streamlit + 3 SQLites | Legado — em produção. **Não modificar.** |
| **v2.0** | TypeScript + Next.js 15 + Fastify 5 + Prisma 5 + SQLite | Ativo — este documento descreve esta versão |

---

## 1. Stack técnica

### 1.1 Monorepo

```
Gestor_Financeiro/
├── apps/
│   ├── api/          # Fastify 5 — porta 3001
│   └── web/          # Next.js 15 — porta 3000
├── docs/             # ADRs, user stories, ERD, contratos de API
├── installer/        # Build scripts Windows (futuro Tauri)
└── CLAUDE.md         # Regras para agentes de desenvolvimento
```

Sem turborepo, sem workspaces. Cada app é projeto npm independente (`cd apps/api && npm install`).

### 1.2 Backend (`apps/api`)

| Camada | Tecnologia | Regra |
|--------|-----------|-------|
| HTTP | Fastify 5 + `fastify-type-provider-zod` | Plugins por bounded context |
| Validação | Zod | Schemas no `http/` — nunca no `domain/` |
| ORM | Prisma 5 | SQLite local via `DATABASE_URL` no `.env` |
| IA | `@anthropic-ai/sdk` + `claude-sonnet-4-6` | Prompt caching obrigatório |
| DI | Manual via factory `buildFinancesModule(prisma)` | Sem decorators, sem container |
| Erros | `HttpError` lançado nos use cases | Sem Result/Either pattern |

### 1.3 Frontend (`apps/web`)

| Camada | Tecnologia | Regra |
|--------|-----------|-------|
| Framework | Next.js 15 App Router | `page.tsx` = Server Component por padrão |
| Interatividade | `'use client'` nos formulários, modais, gráficos | Mínimo de Client Components |
| Gráficos | `recharts` | BarChart, LineChart, AreaChart, PieChart |
| Ícones | `lucide-react` | Exclusivo — sem heroicons, feather etc |
| Fetch | `apiFetch()` de `shared/lib/api.ts` | Nunca hardcodar URL da API |
| Estado | `useState` / `useReducer` | Sem Zustand, sem Redux |
| Mutations | TanStack Query | Apenas para mutations client-side |
| Estilos | CSS Modules + tokens CSS globais | Sem Tailwind |

---

## 2. Bounded Contexts

### 2.1 `finances` — domínio financeiro

Responsável por toda a lógica de negócio central: despesas, rendimentos, investimentos, cartões, splits, acertos.

```
apps/api/src/modules/finances/
├── domain/
│   ├── entities/        — interfaces TypeScript puras (sem imports de infra)
│   ├── repositories/    — interfaces de repo (IDespesaRepository, etc.)
│   └── prompts/         — prompts IA em .md (acesso pelo domain, não inline)
├── application/
│   └── use-cases/       — um arquivo por use case
├── infra/
│   └── prisma-*.repository.ts  — implementações Prisma (toDomain() inline)
├── http/
│   └── *.routes.ts      — plugins Fastify (sem lógica de negócio)
└── finances.module.ts   — factory buildFinancesModule(prisma)
```

**Regra de isolamento:**
- `domain/` **nunca importa** Fastify, Prisma ou `@anthropic-ai/sdk`
- `infra/` implementa as interfaces de `domain/repositories/`
- `http/` é plugin Fastify — sem lógica de negócio

### 2.2 `intelligence` — IA

Responsável pela análise de faturas PDF e geração de relatórios executivos via Anthropic SDK.

```
apps/api/src/modules/intelligence/
├── domain/
│   ├── entities/        — AIConfig
│   ├── repositories/    — IAnthropicRepository
│   └── prompts/         — system prompts .md (cache_control obrigatório)
├── infra/
│   ├── anthropic/       — AnthropicRepository (SDK wrapper)
│   └── dynamic-llm.repository.ts  — multi-provider (Anthropic/OpenAI/Gemini)
├── http/routes/         — plugins Fastify
└── intelligence.module.ts
```

---

## 3. Schema de dados (Prisma 5 + SQLite)

Um único `schema.prisma` unificado em `apps/api/prisma/`. Arquivo canônico de referência: `docs/erd.md`.

### Entidades principais

| Entidade | Responsabilidade |
|----------|-----------------|
| `Pessoa` | Membros do grupo familiar (`familiar=true`, `padrao=true` = usuário principal) |
| `AbaDespesa` | Agrupamento de despesas (ex: "Casa", "Pessoal", "Familiar") |
| `AbaPessoa` | N:N Aba ↔ Pessoa com `ratioDefault` de split |
| `Despesa` | Lançamentos mensais (manual, fixa, parcela, cartao, cartao_ciclo, split_auto) |
| `DespesaSplit` | Divisão de uma despesa entre pessoas (`ratio` + `valorCalculado` + `valorQuitado`) |
| `DivisaoEntry` | Registro manual de quem deve a quem (legado — mantido para compatibilidade) |
| `AcertoEntry` | Acerto de contas registrado (novo — US-12/US-13) |
| `AcertoDespesaSplit` | Splits cobertos por um acerto (novo — US-13, suporte a FIFO parcial) |
| `Rendimento` | Entradas mensais por pessoa/categoria |
| `Investimento` | Posição de investimento permanente (após refactor v2) |
| `MovimentacaoInvestimento` | Evento mensal de uma posição (APORTE/RENDIMENTO/RESGATE) |
| `Cartao` | Cartão de crédito com `diaFechamento` e splits por pessoa |
| `CartaoSplit` | Proporção de divisão de um cartão entre pessoas |
| `Fatura` | Fatura analisada por IA (PDF hash + JSON completo) |
| `Transacao` | Item de fatura com categoria editável |
| `SnapshotCiclo` | Ciclo em aberto de um cartão (máx 2 por cartão) |
| `AIConfig` | Configuração do provedor de IA (singleton id=1) |

### Contratos de data/valor

| Campo | Formato | Regra |
|-------|---------|-------|
| `mesRef` | `YYYY-MM` (string) | Nunca objeto `Date` |
| Datas de transação | `YYYY-MM-DD` (string) | Nunca objeto `Date` |
| Valores monetários | `Float` (reais) | Nunca centavos, nunca string |

---

## 4. Rotas

### Backend (`apps/api` — prefixo `/api`)

| Módulo | Rotas | Status |
|--------|-------|--------|
| Pessoas | `GET/POST /api/pessoas`, `PUT/DELETE /api/pessoas/:id` | APROVADO |
| Abas | `GET/POST /api/abas`, `PUT/DELETE /api/abas/:id` | APROVADO |
| Categorias | `GET/POST /api/categorias`, `PUT/DELETE /api/categorias/:id` | APROVADO |
| Despesas | `GET/POST /api/despesas`, `PUT/DELETE /api/despesas/:id`, `GET /api/despesas/:id/splits` | APROVADO |
| Rendimentos | `GET/POST /api/rendimentos`, `PUT/DELETE /api/rendimentos/:id` | APROVADO |
| Investimentos | `GET/POST/PUT/DELETE /api/investimentos/posicoes`, `GET/POST/DELETE /api/investimentos/movimentacoes`, `GET /api/investimentos/evolucao` | APROVADO |
| Cartões | `GET/POST /api/cartoes`, `PUT/DELETE /api/cartoes/:id` | APROVADO |
| Faturas | `GET/POST /api/faturas`, `GET /api/faturas/:id`, `DELETE /api/faturas/:id`, `PUT /api/faturas/:id/transacoes/:tid` | APROVADO |
| Snapshots | `GET/POST /api/snapshots`, `DELETE /api/snapshots/:id` | APROVADO |
| Dashboard | `GET /api/dashboard?mesRef=YYYY-MM` | APROVADO |
| Splits/Divisão | `GET/POST /api/divisao`, `PUT /api/divisao/:id` | APROVADO |
| Orçamentos | `GET/POST/PUT/DELETE /api/orcamentos` | APROVADO |
| Regras Fixas | `GET/POST/PUT/DELETE /api/regras-fixas` | APROVADO |
| Category Rules | `GET/POST/PUT/DELETE /api/category-rules` | APROVADO |
| Acerto | `GET /api/acerto?mesRef=YYYY-MM`, `POST /api/acerto`, `DELETE /api/acerto/:id`, `GET /api/acerto/historico` | **PENDENTE** |
| Intelligence | `POST /api/intelligence/analyze-pdf`, `GET /api/intelligence/report` | APROVADO |
| AI Config | `GET/PUT /api/intelligence/config` | APROVADO |

### Frontend (`apps/web`)

| Rota | Componente | Status |
|------|-----------|--------|
| `/dashboard` | `DashboardPage` (Server) + `DashboardPersonaKpis` (Client) | APROVADO |
| `/despesas` | `DespesasPage` (Server) + `DespesasClient` (Client) | APROVADO |
| `/rendimentos` | `RendimentosPage` (Server) + `RendimentosClient` (Client) | APROVADO |
| `/investimentos` | `InvestimentosPage` (Server) + `InvestimentosClient` (Client) | APROVADO |
| `/cartao` | `CartaoPage` (Server) + `CartaoClient` (Client) | APROVADO |
| `/relatorio` | `RelatorioPage` (Server) + `RelatorioClient` (Client) | APROVADO |
| `/gestao` | `GestaoPage` (Server) + `GestaoClient` (Client) | APROVADO |
| `/acerto` | `AcertoPage` (Server) + `AcertoClient` (Client) | **PENDENTE** |

---

## 5. Pipeline de IA

```
PDF (base64) → POST /api/intelligence/analyze-pdf
                    │
                    ▼
            AnthropicRepository
            (vision + system prompt com cache_control)
                    │
                    ▼
            QA interno (validação JSON)
                    │
            aprovado│
                    ▼
            CreateFaturaUseCase → Fatura + Transacoes no DB
                    │
                    ▼
            Response: FaturaAnalisada
```

### Contrato `FaturaAnalisada`

```typescript
interface FaturaAnalisada {
  fatura: { banco, mes_referencia, vencimento, total, limite }
  transacoes: Array<{ data, descricao, estabelecimento, valor, categoria, parcela }>
  resumo_categorias: Array<{ categoria, valor, percentual, qtd_transacoes }>
  comentario_executivo: string  // Markdown
}
```

### Regra de prompt caching

**Toda** chamada `anthropic.messages.create()` deve incluir `cache_control: { type: 'ephemeral' }` no system prompt. System prompts ficam em `domain/prompts/` — nunca inline no código.

---

## 6. Fluxo de Acerto de Contas (US-12 / US-13 — a implementar)

### Problema de negócio

O usuário (pagador principal) lança despesas familiares com splits. No final do mês, precisa saber quanto cada membro do grupo deve reembolsá-lo via Pix.

### Regra de cálculo

```
saldo_pessoa = Σ(DespesaSplit.valorQuitado_restante onde pessoaId=pessoa AND despesa.somenteMeu=false)
             - Σ(DivisaoEntry.valorTotal onde pessoaId=pessoa AND direcao='a_pagar' AND quitado=false)
```

`mesRef` da despesa determina o mês do acerto — não a data de vencimento.

### Acerto parcial (FIFO)

Ao registrar acerto com valor menor que o saldo total, o sistema distribui o valor pelos splits mais antigos primeiro (ordenado por `Despesa.data` ASC), atualizando `DespesaSplit.valorQuitado`.

### Novas entidades

```prisma
model DespesaSplit {
  // + campo novo:
  valorQuitado Float @default(0)  // controle de acerto parcial
}

model AcertoEntry {
  id             Int    @id @default(autoincrement())
  pessoaId       Int    FK → Pessoa
  mesRef         String // YYYY-MM do mês sendo acertado
  valor          Float
  data           String // YYYY-MM-DD
  formaPagamento String // 'pix' | 'ted' | 'dinheiro' | 'outro'
  observacao     String?
  criadoEm       DateTime @default(now())
  splits         AcertoDespesaSplit[]
}

model AcertoDespesaSplit {
  id           Int   @id @default(autoincrement())
  acertoId     Int   FK → AcertoEntry (CASCADE)
  splitId      Int   FK → DespesaSplit (RESTRICT)
  valorCoberto Float
}
```

---

## 7. Design System

### Tokens CSS (`apps/web/src/styles/tokens.css`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--verde` / `--app-lime` | `#10F5A3` | CTAs positivos, aba principal |
| `--roxo` / `--app-purple` | `#B07AFF` | Pessoas, splits |
| `--azul` / `--app-blue` | `#6FA9D6` | Informacional |
| `--vermelho` / `--app-danger` | `#F23A0A` | Alertas, exclusão |

### Cores por seção

| Seção | Accent | Background escuro |
|-------|--------|------------------|
| Dashboard | `#12A09E` | `--section-hero-bg` |
| Despesas | `#D93232` | `var(--section-accent)` |
| Rendimentos | `#5B996A` | — |
| Cartão | `#F2811D` | — |
| Investimentos | `#7B6EF5` | — |
| Gestão | `#E3F272` | — |
| Acerto | `#10F5A3` (verde — positivo) | — |

### Tipografia

| Uso | Fonte |
|-----|-------|
| Display / Headings / KPIs | Bricolage Grotesque |
| Body / Inputs | Plus Jakarta Sans |
| Valores monetários / Datas | JetBrains Mono |

---

## 8. ADRs — Decisões de Arquitetura

`docs/adr/` — um arquivo por decisão. Ver `docs/adr/README.md`.

| ADR | Título | Status |
|-----|--------|--------|
| 0001 | Streamlit como framework v1 | Accepted (supersedido por v2) |
| 0002 | 3 bancos SQLite separados (v1) | Accepted (supersedido por schema único v2) |
| 0003 | Claude CLI subprocess (v1) | Superseded by ADR-0013 |
| 0004 | Sem autenticação no MVP | Accepted |
| 0005 | Design System imutável como referência | Accepted |
| 0006 | cartao_ciclo como despesa sintética | Accepted |
| 0007 | Agente QA antes do Relator | Accepted |
| 0008 | Monorepo sem workspaces | Accepted |
| 0009 | Fastify DDD manual no backend | Accepted |
| 0010 | Next.js 15 App Router no frontend | Accepted |
| 0011 | Prisma 5 + SQLite local | Accepted |
| 0012 | DDD enxuto — dois bounded contexts | Accepted |
| 0013 | Anthropic TypeScript SDK | Accepted |
| 0014 | Sem deploy cloud | Accepted |
| 0015 | Valores Float em reais (não centavos) | Accepted |

---

## 9. Anti-patterns — nunca introduzir

- Result/Either pattern — use `HttpError` direto nos use cases
- Classe Mapper separada — `toDomain()` fica inline no repo Prisma
- Bounded contexts além de `finances` e `intelligence`
- Domain events / CQRS — overkill para scope atual
- Zustand ou Redux — useState/useReducer suficientes
- Chamada Anthropic sem `cache_control` no system prompt
- `mesRef` como objeto Date
- Valores monetários em centavos
- Deploy cloud / Vercel / Neon Postgres
- Autenticação / JWT no MVP

---

## 10. Setup local

```bash
# API (terminal 1)
cd apps/api
npm install
npx prisma migrate dev
npm run dev   # :3001

# Web (terminal 2)
cd apps/web
npm install
npm run dev   # :3000
```

`.env` necessário em `apps/api/`:
```
DATABASE_URL="file:../data/planejai.db"
ANTHROPIC_API_KEY="sk-ant-..."   # opcional — necessário para analyze-pdf e relatório
```

---

## 11. Histórico de releases

| Versão | Data | Escopo |
|--------|------|--------|
| v0.1.0 | 2026-05-21 | Backend 16/16 + Frontend 12/12 + QA 10/10 US PASSOU |
| v0.2.0-visual | 2026-05-24 | Visual Refactor — design system, section accents, flat cards, sidebar 60px |
| v0.3.0-invest | 2026-05-27 | Invest Refactor — modelo Posição + Movimentações, gráficos com dados reais |
| v0.4.0-acerto | 2026-05-29 | Feature Acerto de Contas (US-12 + US-13) |

---

## 12. Fora de escopo (MVP)

- Autenticação / login
- Sincronização em nuvem
- App mobile
- Importação de extrato bancário (OFX/CSV)
- Notificações por push/e-mail
- Integração com API de Pix
- Relatórios em PDF exportáveis
- i18n / moeda não-BRL
- Testes automatizados (unitários, E2E)
