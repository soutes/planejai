# CLAUDE.md — planejAÍ v2.0

> Prompt de desenvolvimento para agentes Claude Code.
> Leia este arquivo inteiro antes de qualquer implementação.

---

## Estado atual

**v1.0 (legado Streamlit):** implementado e em uso. Não modificar.
**v2.0 (TypeScript):** a ser implementado conforme este documento.

---

## Target stack (per ARQUITETURA.md)

- **Monorepo sem workspaces**: `apps/web` e `apps/api` como projetos npm independentes. `cd` em um deles, `npm install`, `npm run dev`. Sem turborepo/workspaces — sem hoisting mágico.
- **Frontend** (`apps/web`): Next.js 15 App Router + TypeScript. Server Components por padrão; `'use client'` só em bits interativos (formulários, modais, gráficos). TanStack Query apenas para mutations client-side. **Sem Zustand**.
- **Backend** (`apps/api`): Fastify 5 + TypeScript, dois bounded contexts (`finances`, `intelligence`), quatro camadas explícitas (`domain`, `application`, `infra`, `http`). DI manual via factory `buildFinancesModule(prisma)` — **sem decorators, sem DI container**. Validação com `zod` + `fastify-type-provider-zod`. Erros são `HttpError` lançados — **sem Result pattern**.
- **DB**: Prisma 5 + SQLite local. Um único `schema.prisma` unificando os três bancos do legado. `mesRef` sempre `YYYY-MM`. Valores monetários em `Float` (reais). `toDomain()` inline nos repos — **sem classe Mapper separada**.
- **IA**: Anthropic TypeScript SDK (`@anthropic-ai/sdk`). Modelo `claude-sonnet-4-6`. **Prompt caching obrigatório** (`cache_control: { type: 'ephemeral' }` no system prompt de toda chamada). Sem streaming no MVP.
- **Execução**: apenas local. **Sem Vercel. Sem deploy cloud.** Dev = dois terminais (`apps/api :3001` + `apps/web :3000`). Distribuição futura via Tauri desktop.

---

## O que está implementado (v1.0 legado — referência)

### Backend Python (NÃO modificar)
- `src/database_gestao.py` — SQLite gestao.db: despesas, rendimentos, investimentos, pessoas, abas, categorias, orçamentos, splits
- `src/database.py` — SQLite faturas.db: cartões, faturas, transações, regras de categorização
- `src/database_acompanhamento.py` — SQLite acompanhamento.db: snapshots de ciclo por cartão
- `src/agent.py` — extração de faturas via Claude CLI (subprocess)
- `src/agent_reporter.py` — geração de relatório executivo
- `src/agent_qa.py` — validação e correção do JSON extraído
- `src/config_ia.py` — credenciais IA criptografadas com Fernet

### Domínio de negócio (mapeado para v2.0)
- Despesas: manual, recorrente, parcelado, vínculo com cartão, splits entre pessoas
- Rendimentos: Salário, Freelas, Dividendos, Aluguel, Outros — recorrentes
- Investimentos: snapshot mensal por categoria/instituição (Renda Fixa, Ações, FIIs, Cripto…)
- Cartões: múltiplos, com limite, cor, proprietário, aba associada, splits por pessoa
- Faturas: upload PDF/imagem → IA extrai JSON estruturado → transações categorizadas
- Snapshots de ciclo: acompanhamento do mês corrente por cartão (ciclo ≠ mês calendário)
- Orçamentos/Metas: meta por categoria e mês por aba
- Divisão de gastos: controle de quem deve a quem (quitado/pendente)

---

## O que NÃO está implementado (v2.0 — a fazer)

- Nenhum arquivo em `apps/web/` ou `apps/api/`
- Schema Prisma unificado
- Endpoints REST Fastify
- Componentes React / Next.js
- Wrapper Anthropic SDK TypeScript
- Tauri shell (pós-MVP)

---

## Contratos obrigatórios (não negociáveis)

### Datas
- `mesRef` sempre `YYYY-MM` — nunca `Date` object para referência de mês
- Datas de transação: ISO 8601 (`YYYY-MM-DD`)

### Valores
- Monetários sempre em `number` (Float reais) — **não centavos**
- Nunca `string` para valor monetário

### IA
- Toda chamada `anthropic.messages.create()` deve incluir `cache_control` no system prompt
- System prompts em arquivos `.md` separados em `domain/prompts/` — não inline no código
- Modelo padrão: `claude-sonnet-4-6`

### Bounded contexts
- `domain/` **nunca importa** Fastify, Prisma ou `@anthropic-ai/sdk`
- `infra/` implementa as interfaces de `domain/repositories/`
- `http/` é plugin Fastify — sem lógica de negócio

### Rotas
- Rotas da API: português, sem acentos (`/api/despesas`, `/api/rendimentos`, `/api/cartoes`)
- Rotas do frontend: português (`/despesas`, `/rendimentos`, `/cartao`, `/gestao`)

---

## Anti-patterns — nunca introduzir

- Result/Either pattern — use `HttpError` direto nos use cases
- Classe Mapper separada — `toDomain()` fica inline no repo Prisma
- Múltiplos bounded contexts além de `finances` e `intelligence`
- Domain events / CQRS — overkill para scope atual
- Zustand ou Redux — useState/useReducer suficientes
- Chamada Anthropic sem `cache_control` no system prompt
- `mesRef` como objeto Date
- Valores monetários em centavos (quebra consistência com legado)
- Deploy cloud / Vercel / Neon Postgres — projeto é local-only
- Autenticação / JWT — single-user, sem auth no MVP

---

## Design system

### Tokens CSS (`src/styles/tokens.css`)
Copiar tokens de cor do legado Streamlit e adaptar:
- `--verde`: `#10F5A3` — cor primária, CTAs positivos
- `--roxo`: `#B07AFF` — cor secundária, pessoas/splits
- `--azul`: `#6FA9D6` — cor terciária, informacional
- `--vermelho`: `#F23A0A` — alertas, exclusão
- `--cinza-*`: escala neutra
- `--ink-800` e derivados: texto principal

### Fontes
- Display: **Bricolage Grotesque** (headings, KPIs)
- Body: **Plus Jakarta Sans** (corpo, inputs)
- Mono: **JetBrains Mono** (valores monetários, datas)

### Ícones
- `lucide-react` exclusivamente

### Gráficos
- `recharts` — BarChart, LineChart, AreaChart, PieChart

---

## Categorias do domínio (constantes)

### Despesas
```typescript
const CATEGORIAS_DESPESA = [
  'Alimentação', 'Transporte', 'Saúde', 'Educação',
  'Lazer', 'Casa', 'Vestuário', 'Assinaturas',
  'Pets', 'Viagem', 'Presente', 'Cartão', 'Outros'
]
```

### Rendimentos
```typescript
const CATEGORIAS_RENDIMENTO = ['Salário', 'Aluguel', 'Freelas', 'Dividendos', 'Outros']
```

### Investimentos
```typescript
const CATEGORIAS_INVESTIMENTO = [
  'Reserva de Emergência', 'Renda Fixa', 'Tesouro Direto',
  'Ações', 'FIIs', 'Previdência Privada', 'Fundos', 'Cripto', 'Internacional'
]
```

---

## Regras de ciclo do cartão

- O ciclo do cartão **não é o mês calendário** — tem `diaFechamento` configurável
- `ciclo_atual(diaFechamento)`: se hoje > diaFechamento → ciclo `diaFechamento+1` do mês atual até `diaFechamento` do próximo
- Snapshot do ciclo: 1 por cartão por ciclo (o anterior fica para comparação delta)
- `mesRef` do snapshot derivado de `ciclo_fim[:7]`

---

## Estrutura do JSON de fatura (contrato IA)

```typescript
interface FaturaAnalisada {
  fatura: {
    banco: string
    mes_referencia: string   // 'YYYY-MM'
    vencimento: string       // 'YYYY-MM-DD'
    total: number
    limite: number | null
  }
  transacoes: Array<{
    data: string             // 'YYYY-MM-DD'
    descricao: string
    estabelecimento: string
    valor: number            // positivo = débito
    categoria: string
    parcela: string | null   // '1/3', '2/3' etc
  }>
  resumo_categorias: Array<{
    categoria: string
    valor: number
    percentual: number
    qtd_transacoes: number
  }>
  comentario_executivo: string  // Markdown
}
```

---

## Endpoints críticos — comportamento esperado

### `POST /api/intelligence/analyze-pdf`
- Recebe: `{ pdfBase64: string, cartaoId: number }`
- Chama Anthropic com vision + system prompt de extração
- Salva fatura + transações no banco via `CreateFaturaUseCase`
- Retorna: `FaturaAnalisada`

### `GET /api/dashboard?mesRef=YYYY-MM`
- Agrega: total despesas (por aba), total rendimentos, total investido, saldo, despesas por categoria
- Retorna tudo em uma única chamada — sem N+1

### `DELETE /api/despesas/:id?serie=true`
- `serie=true`: apaga a despesa e todas com mesmo `origemId`
- `serie=false` (default): apaga só a instância

---

## Dúvidas de negócio — decisões já tomadas

| ID | Questão | Decisão |
|----|---------|---------|
| DEC-001 | SQLite ou Postgres? | SQLite — app local offline-first |
| DEC-002 | Python AI agents ou Anthropic TS SDK? | Anthropic TS SDK — reescrita completa em TypeScript |
| DEC-003 | Tauri no MVP? | Não — apenas execução local com dois terminais. Tauri pós-MVP. |
| DEC-004 | Autenticação? | Não — single-user, sem auth |
| DEC-005 | Valores em centavos? | Não — Float reais (consistência com legado) |

---

## Setup inicial

```bash
# Criar estrutura
mkdir -p apps/api apps/web

# API
cd apps/api
npm init -y
npm install fastify @fastify/cors fastify-type-provider-zod zod
npm install @prisma/client @anthropic-ai/sdk
npm install -D typescript tsx @types/node prisma

# Web
cd ../web
npx create-next-app@latest . --typescript --app --no-tailwind --no-eslint --src-dir
npm install @tanstack/react-query recharts lucide-react
```

---

## Ordem de implementação sugerida

1. **Schema Prisma** — `apps/api/prisma/schema.prisma` + migração + seed
2. **Shared** — `errors.ts`, `prisma.ts`, `app.ts`, `server.ts`
3. **Bounded context `finances`** — domain entities → repos → use cases → routes
4. **Bounded context `intelligence`** — Anthropic wrapper → analyze-pdf → report
5. **Frontend shell** — layout, tokens, providers
6. **Páginas** — dashboard → despesas → rendimentos → cartão → investimentos → gestão → relatório
