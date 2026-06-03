# planejAÍ

App de planejamento financeiro pessoal e familiar **local-first**. Sem cloud, sem assinatura, sem anúncios — todos os dados ficam 100% na sua máquina.

![planejAÍ](assets/analista_mockup_git.jpg)

---

## Funcionalidades

### Dashboard
- KPIs por pessoa: rendimentos, despesas, patrimônio líquido (net worth real) e saldo do mês
- Hero card com gráfico de área 12 meses e tooltip de valor por mês
- **Tendência de gastos** (3/6/12 meses) com % vs. período anterior — aba Familiar mostra distribuição por pessoa
- Breakdown por categoria com barra de proporção
- Cartão em uso do ciclo atual, filtrado por pessoa
- Abas por persona (Luiz / Lili / Familiar) — cada indicador é calculado no escopo da aba selecionada

### Despesas
- Tipos: `única`, `recorrente`, `parcelada`
- Parcelamento distribui em N meses automaticamente
- Recorrência propaga para meses futuros
- **Split familiar**: divide o valor entre membros com percentual configurável
- Edição e exclusão inline (instância ou série completa)

### Rendimentos
- Categorias: Salário, Freelas, Dividendos, Aluguel, Outros
- Recorrência automática
- Filtro por pessoa + aba Familiar
- KPIs: total, principal fonte, recorrentes

### Investimentos
- Posições por categoria (Renda Fixa, Ações, FIIs, Cripto, etc.) e por pessoa
- Movimentações: `APORTE`, `RENDIMENTO`, `RESGATE`
- Evolução patrimonial 12 meses (área)
- Distribuição por categoria (gráfico de pizza)
- Rentabilidade acumulada por posição

### Cartão de Crédito
- **Análise de faturas por IA**: upload PDF/imagem → IA extrai e categoriza automaticamente
- Compatível com Claude, GPT-4o, Gemini e OpenRouter
- Suporte a PDFs com senha
- Propagação de categoria entre faturas (regra persistente por estabelecimento)
- Acompanhamento do ciclo atual: ritmo diário, projeção, dias restantes até fechamento
- Histórico completo com comparativo mensal
- Alertas de parcelamentos

### acertAÍ
- Controle de divisão de gastos entre pessoas ("quem deve a quem")
- Direções: `a_receber` (alguém me deve) e `a_pagar` (eu devo)
- Registro de acertos com liquidação **FIFO parcial**: um pagamento pode quitar várias pendências
- Histórico de acertos por mês com reversão
- Badges de quitação (✓ total / ½ parcial) na listagem de despesas
- Widget de pendências no Dashboard

### Relatório IA
- Relatório **por pessoa** com abas (Luiz / Lili / Familiar)
- Dados enviados à IA: totais do mês, **série dos últimos 3 meses** (despesa, rendimento, saldo, taxa de poupança), análise da fatura de cartão (utilização do limite, top categorias)
- Análise CFP-level: compara MoM em R$ e %, projeta tendência, avalia taxa de poupança vs. meta 20%, alerta utilização do cartão > 30% do limite
- Recomendações com valores numéricos e priorizadas por impacto
- Privacidade: apenas agregações por categoria são enviadas à IA — nenhuma transação individual

### Gestão
- Cadastro de cartões (banco, limite, cor, dia de fechamento, dia de vencimento)
- Pessoas e abas de despesa com splits configuráveis
- Categorias personalizadas
- Regras de categorização automática por estabelecimento
- Orçamentos mensais por categoria
- Configuração de chave de IA (Anthropic / OpenAI / Gemini / OpenRouter)
- Export de lançamentos e faturas

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 App Router + TypeScript |
| Backend | Fastify 5 + `fastify-type-provider-zod` |
| ORM | Prisma 5 + SQLite |
| IA | Multi-provider: Anthropic (`claude-sonnet-4-6`), OpenAI, Gemini, OpenRouter |
| Gráficos | Recharts |
| Ícones | Lucide React |

---

## Arquitetura

```mermaid
graph TD
  subgraph web["Frontend — Next.js 15 (porta 3000)"]
    direction TB
    P1[/dashboard] & P2[/despesas] & P3[/rendimentos]
    P4[/cartao] & P5[/investimentos] & P6[/acertai]
    P7[/relatorio] & P8[/gestao]
  end

  subgraph api["Backend — Fastify 5 (porta 3001)"]
    direction TB
    subgraph fin["bounded context: finances"]
      F1[despesas] & F2[rendimentos] & F3[investimentos]
      F4[cartoes / faturas] & F5[acerto] & F6[dashboard]
      F7[pessoas / abas / categorias]
    end
    subgraph intel["bounded context: intelligence"]
      I1[analyze-pdf] & I2[generate-report]
    end
    subgraph shared["shared"]
      S1[prisma.ts] & S2[errors.ts] & S3[backup.ts]
    end
  end

  subgraph data["Dados locais"]
    DB[(planejAI.db\nSQLite)]
    BAK[backups automáticos\n.bak-timestamp]
    AI[API de IA\nopcional]
  end

  web -->|apiFetch /api/*| api
  fin --> S1 --> DB
  intel --> S1
  intel -->|cache_control| AI
  DB -.->|antes de migrate| BAK
```

---

## Setup

**Pré-requisitos:** Node.js 20+, npm

### API

```bash
cd apps/api
npm install
npm run db:migrate   # backup automático + prisma migrate dev
npm run dev          # :3001
```

### Web

```bash
cd apps/web
npm install
npm run dev          # :3000
```

### Variáveis de ambiente

Crie `apps/api/.env`:

```env
DATABASE_URL="file:../../data/planejAI.db"
ANTHROPIC_API_KEY="sk-ant-..."   # opcional — configure também em Gestão → IA
```

> **Dica Windows**: use `dev.bat` na raiz para abrir os dois terminais de uma vez.

---

## Estrutura

```
planejai/
├── apps/
│   ├── api/                    # Fastify 5
│   │   ├── prisma/schema.prisma
│   │   └── src/modules/
│   │       ├── finances/       # despesas, rendimentos, cartões, investimentos, acerto
│   │       └── intelligence/   # análise de faturas e relatório por IA
│   └── web/                    # Next.js 15
│       └── src/app/
│           ├── dashboard/
│           ├── despesas/
│           ├── rendimentos/
│           ├── cartao/
│           ├── investimentos/
│           ├── acertai/
│           ├── relatorio/
│           └── gestao/
├── installer/                  # Build Windows (Electron)
└── dev.bat                     # abre api + web em dois terminais
```

---

## Privacidade

Todos os dados ficam em `data/planejAI.db` (SQLite local; caminho configurável via `PLANEJAI_DATA_DIR`). Backups automáticos `planejAI.db.bak-{timestamp}` são gerados antes de cada migration. Nenhum dado enviado a servidores externos, exceto agregações de categorias enviadas à API de IA para análise — funcionalidade opcional, sob sua própria chave.

---

## Versão

**v2.0** — Windows (Electron desktop)
