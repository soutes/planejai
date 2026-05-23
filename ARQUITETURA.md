# ARQUITETURA.md — planejAÍ v2.0

> Blueprint da reescrita TypeScript. Referência para todos os agentes de desenvolvimento.
> Foco: clareza sobre sofisticação. DDD + Clean Architecture visível, sem framework mágico.

---

## §1. Estrutura do repositório

```
planejAÍ/
├── ARQUITETURA.md        ← este arquivo
├── CLAUDE.md             ← prompt dos agentes de desenvolvimento
├── docs/
│   ├── erd.md            ← ERD Mermaid (co-commit com schema.prisma)
│   ├── adr/              ← ADRs numerados e imutáveis
│   └── user-stories/     ← US-01 a US-10
├── apps/
│   ├── web/              ← Next.js 15 App Router (roda local)
│   └── api/              ← Fastify 5 + DDD manual (roda local)
└── (Streamlit MVP legado — somente referência, não tocar)
```

**Monorepo sem workspaces** — cada `apps/*` é projeto npm independente.
`cd apps/api && npm install && npm run dev`. Sem turborepo, sem hoisting mágico.

---

## §2. Backend (`apps/api/`)

### §2.1 Estrutura de pastas

```
apps/api/
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── server.ts                    # entrypoint local (app.listen)
    ├── app.ts                       # buildApp(): Fastify + plugins + rotas
    ├── shared/
    │   ├── prisma.ts                # singleton PrismaClient
    │   └── errors.ts                # HttpError
    └── modules/
        ├── finances/                # bounded context principal
        │   ├── domain/
        │   │   ├── entities/
        │   │   ├── value-objects/
        │   │   └── repositories/   # interfaces puras, zero Fastify/Prisma
        │   ├── application/
        │   │   └── use-cases/      # 1 arquivo = 1 use case
        │   ├── infra/
        │   │   └── prisma-*.repository.ts   # toDomain() inline, sem Mapper separado
        │   ├── http/
        │   │   └── finances.routes.ts       # plugin Fastify
        │   └── finances.module.ts           # buildFinancesModule(prisma)
        └── intelligence/            # bounded context IA
            ├── domain/
            │   └── prompts/         # system prompts separados do código
            ├── application/
            │   └── use-cases/
            ├── infra/
            │   └── anthropic.ts     # wrapper Anthropic SDK
            ├── http/
            │   └── intelligence.routes.ts
            └── intelligence.module.ts
```

### §2.2 Quatro camadas

| Camada | Regra |
|--------|-------|
| `domain` | zero imports de Fastify ou Prisma. Entidades puras. |
| `application` | use cases recebem deps via construtor; lançam `HttpError` diretamente |
| `infra` | repos Prisma com `toDomain()` inline no mesmo arquivo; **sem classe Mapper separada** |
| `http` | plugin Fastify com validação Zod + `fastify-type-provider-zod` |

### §2.3 Injeção de dependência manual

```typescript
// finances.module.ts
export function buildFinancesModule(prisma: PrismaClient) {
  const despesaRepo = new PrismaDespesaRepository(prisma)
  const rendimentoRepo = new PrismaRendimentoRepository(prisma)
  const cartaoRepo = new PrismaCartaoRepository(prisma)

  const listDespesas = new ListDespesasUseCase(despesaRepo)
  const createDespesa = new CreateDespesaUseCase(despesaRepo)
  // ...
  return { listDespesas, createDespesa /* ... */ }
}
```

**Sem decorators, sem container DI.** Dependências visíveis em ~30 linhas.

### §2.4 Endpoints REST (todos sob `/api/`)

**Finances:**
| Método | Path | US |
|--------|------|----|
| `GET` | `/api/despesas?mesRef=&abaId=` | US-01 |
| `POST` | `/api/despesas` | US-01 |
| `PUT` | `/api/despesas/:id` | US-01 |
| `DELETE` | `/api/despesas/:id?serie=true` | US-01 |
| `GET` | `/api/rendimentos?mesRef=` | US-02 |
| `POST` | `/api/rendimentos` | US-02 |
| `PUT` | `/api/rendimentos/:id` | US-02 |
| `DELETE` | `/api/rendimentos/:id?serie=true` | US-02 |
| `GET` | `/api/investimentos?mesRef=` | US-03 |
| `POST` | `/api/investimentos` | US-03 |
| `DELETE` | `/api/investimentos/:id` | US-03 |
| `GET` | `/api/cartoes` | US-04, US-08 |
| `POST` | `/api/cartoes` | US-08 |
| `PUT` | `/api/cartoes/:id` | US-08 |
| `DELETE` | `/api/cartoes/:id` | US-08 |
| `GET` | `/api/faturas?cartaoId=` | US-04 |
| `DELETE` | `/api/faturas/:id` | US-04 |
| `GET` | `/api/snapshots?cartaoId=&ref=` | US-05 |
| `GET` | `/api/pessoas` | US-09 |
| `POST` | `/api/pessoas` | US-09 |
| `PUT` | `/api/pessoas/:id` | US-09 |
| `GET` | `/api/categorias` | US-10 |
| `POST` | `/api/categorias` | US-10 |
| `GET` | `/api/orcamentos?abaId=&mesRef=` | US-10 |
| `PUT` | `/api/orcamentos` | US-10 |
| `GET` | `/api/dashboard?mesRef=` | US-06 |
| `GET` | `/health` | — |

**Intelligence:**
| Método | Path | US |
|--------|------|----|
| `POST` | `/api/intelligence/analyze-pdf` | US-04 |
| `POST` | `/api/intelligence/analyze-image` | US-04 |
| `POST` | `/api/intelligence/report` | US-07 |

---

## §3. Frontend (`apps/web/`)

### §3.1 Estrutura de pastas

```
apps/web/
├── package.json
├── tsconfig.json
├── next.config.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── providers.tsx
    │   ├── page.tsx                 # redirect → /dashboard
    │   ├── dashboard/page.tsx       # US-06
    │   ├── despesas/page.tsx        # US-01
    │   ├── rendimentos/page.tsx     # US-02
    │   ├── investimentos/page.tsx   # US-03
    │   ├── cartao/page.tsx          # US-04 + US-05
    │   ├── gestao/page.tsx          # US-09 + US-10
    │   └── relatorio/page.tsx       # US-07
    ├── modules/
    │   ├── despesas/
    │   ├── rendimentos/
    │   ├── investimentos/
    │   ├── cartao/
    │   ├── dashboard/
    │   └── gestao/
    ├── shared/
    │   ├── components/
    │   ├── lib/api.ts               # fetch wrapper com NEXT_PUBLIC_API_BASE_URL
    │   └── types.ts
    └── styles/
        ├── tokens.css
        └── app.css
```

### §3.2 Regras de componentes

- **Server Components por padrão** — páginas de listagem/visualização são async Server Components
- `'use client'` apenas em bits interativos: formulários, modais, filtros client-side, gráficos
- **TanStack Query** apenas para mutations e leituras que dependem de estado client-side
- **sem Zustand** — sem estado global complexo neste MVP (single-user, sem carrinho)

### §3.3 Rotas

| Rota | Página | US |
|------|--------|----|
| `/dashboard` | Visão geral + KPIs | US-06 |
| `/despesas` | CRUD de despesas por mês/aba | US-01 |
| `/rendimentos` | CRUD de rendimentos | US-02 |
| `/investimentos` | CRUD de investimentos | US-03 |
| `/cartao` | Upload fatura + acompanhamento do ciclo | US-04, US-05 |
| `/relatorio` | Relatório IA sobre o mês | US-07 |
| `/gestao` | Cartões, pessoas, categorias, metas | US-08, US-09, US-10 |

---

## §4. Banco de dados

### §4.1 Schema Prisma (SQLite local)

**Um único `prisma/schema.prisma`** unificando os três bancos SQLite do legado
(`gestao.db`, `faturas.db`, `acompanhamento.db`).

Entidades principais:
- `Pessoa` — pessoas para divisão de gastos
- `AbaDespesa` — grupos de despesa (Pessoal, Familiar)
- `Categoria` — categorias de despesa
- `Despesa` — lançamentos (manual, recorrente, parcelado, cartão)
- `DespesaSplit` — divisão de despesa entre pessoas
- `DivisaoEntry` — controle de quem deve a quem
- `Orcamento` — metas por categoria/mês
- `Rendimento` — lançamentos de receita (Salário, Freelas, Dividendos…)
- `Investimento` — snapshots mensais de patrimônio por categoria/instituição
- `Cartao` — cartões de crédito
- `Fatura` — faturas processadas pela IA (transações em JSON)
- `Transacao` — transações individuais de fatura
- `SnapshotCiclo` — acompanhamento do ciclo corrente por cartão
- `CategoryRule` — regras de categorização automática

**SQLite**: adequado para single-user offline-first. Sem servidor de banco.

### §4.2 Convenções

- `mesRef` sempre `YYYY-MM` (string)
- Valores monetários em `Float` (reais — legado já usa Float, manter consistência)
- `toDomain()` inline no repo Prisma — sem classe Mapper separada
- Soft-delete via campo `ativo`/`ativa` (inteiro 0/1 no SQLite)

---

## §5. IA (`modules/intelligence/`)

### §5.1 Stack

- **Anthropic TypeScript SDK** (`@anthropic-ai/sdk`)
- Modelo padrão: `claude-sonnet-4-6` (configurável via `ANTHROPIC_API_KEY` em `.env`)
- **Prompt caching** habilitado — `cache_control: { type: 'ephemeral' }` no system prompt
- Sem streaming no MVP (response completo)

### §5.2 Use cases de IA

| Use case | Entrada | Saída |
|----------|---------|-------|
| `AnalyzePdfUseCase` | PDF base64 | JSON estruturado (fatura + transações) |
| `AnalyzeImageUseCase` | Imagem base64 | JSON estruturado (fatura + transações) |
| `GenerateReportUseCase` | Contexto financeiro do mês | Markdown com análise executiva |

### §5.3 System prompts

Armazenados em `apps/api/src/modules/intelligence/domain/prompts/`.
Arquivos `.md` separados do código — editáveis sem recompilação.

---

## §6. Execução local

```bash
# Terminal 1 — API
cd apps/api
npm install
npm run db:migrate
npm run db:seed   # opcional — dados de exemplo
npm run dev       # Fastify em :3001

# Terminal 2 — Web
cd apps/web
npm install
npm run dev       # Next.js em :3000
```

### §6.1 Distribuição desktop (pós-MVP)

Tauri shell wrapping `apps/web` com `apps/api` como sidecar Node.js.
Gera instaladores `.msi` / `.deb` / `.dmg` com SQLite local na máquina do usuário.

**Sem Vercel. Sem cloud. Sem servidor remoto.**

---

## §7. Variáveis de ambiente

```env
# apps/api/.env
DATABASE_URL="file:./data/planejAI.db"
PORT=3001
ANTHROPIC_API_KEY="sk-ant-..."
NODE_ENV=development

# apps/web/.env.local
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
```

---

## §8. Regras de desenvolvimento (enforcement para agentes)

1. `domain/` **nunca importa** Fastify, Prisma ou Anthropic SDK
2. **Sem classe Mapper** — `toDomain()` inline no repo é suficiente
3. **HttpError direto** nos use cases — sem Result/Either pattern
4. **Server Components primeiro** — `'use client'` só quando há interatividade real
5. **Sem Zustand** — useState/useReducer suficientes (app single-user, sem estado global)
6. **Prompt caching** em toda chamada Anthropic — nunca omitir `cache_control`
7. **mesRef sempre `YYYY-MM`** — nunca Date object para referência de mês
8. **Valores em Float (reais)** — não usar centavos (consistência com legado)

---

## §9. Fora do escopo v2.0

- Autenticação/login — app single-user pessoal
- Deploy cloud / Vercel
- Multi-tenancy
- Mobile responsivo (v3)
- Testes E2E automatizados
- Dark mode
- i18n
- Notificações push
- Exportação CSV/PDF

## §10. Extensões naturais pós-MVP

- Tauri shell — instaladores nativos `.msi` / `.deb` / `.dmg`
- Gráficos avançados — Recharts (linha, área, treemap, sankey)
- Importação OFX
- OCR multi-página de faturas
- Regras de categorização automática via IA
- Metas de economia com progresso mensal
- Testes de use cases com repos fake (DI facilita)
