# CLAUDE.md — planejAÍ

> Regras para agentes Claude Code neste repo. Leia inteiro antes de implementar.
> Estrutura, rotas e contratos completos: **`ARQUITETURA.md`**.

---

## Estado atual

App **em produção de uso pessoal**, distribuído como Electron para Windows.

- `apps/api` — Fastify 5 + Prisma 6 + SQLite, dois bounded contexts, 4 camadas. Roda em `:3001`.
- `apps/web` — Next.js 16 App Router, React 18. Roda em `:3000`.
- `installer/` — shell Electron + `electron-builder` (NSIS/MSI).
- v1 Streamlit/Python: **fora do versionamento** desde `87106a5`. Arquivos ainda em
  disco (`app.py`, `src/`, `prompts/`, `tests/`), ignorados pelo Git. **Não mexer.**

Há dados reais no banco. Mudanças aqui têm consequência.

---

## Antes de mexer no banco — leia isto

O DB fica em `<dataDir>/planejAI.db`, onde `dataDir` é `PLANEJAI_DATA_DIR` (o Electron
passa `%APPDATA%\planejAI`) ou `<repo>/data`. **Dev e app instalado costumam apontar
para o mesmo arquivo.**

- Rode contra `PLANEJAI_DATA_DIR` temporário para qualquer teste de servidor
- `npm run db:migrate` faz backup antes; `npm run db:backup` roda o backup sozinho
- Migration de *table-rebuild* já apagou `DespesaSplit` em cascata e quebrou o acertAÍ.
  Trate recriação de tabela como destrutiva e confirme com o usuário.

---

## Contratos obrigatórios

### Datas e valores
- `mesRef` sempre string `YYYY-MM` — nunca `Date`
- Datas de transação em ISO 8601 (`YYYY-MM-DD`)
- Monetário sempre `number` (Float reais) — **nunca centavos, nunca string**

### Soma de despesa — regra única
Qualquer código que **some dinheiro** usa `finances/domain/services/escopo-despesas.ts`.
Já houve quatro cópias divergentes da mesma regra (dashboard, relatório, CSV, listagem);
foram unificadas. Não reimplemente.

| Função | Quando |
|---|---|
| `semSinteticas` | listagem CRUD — usuário precisa ver cada linha real |
| `despesasReais` | somar dinheiro — tira `split_auto` e deduplica `cartao_ciclo` |
| `valorEfetivo` | quanto cabe à pessoa (aplica ratio do split) |
| `filtrarDespesasPorEscopo` / `filtrarPorPessoaId` | recorte por escopo |
| `agregarMes` | mês inteiro num escopo |

Escopo é `EscopoPessoa = number | null | undefined`:
`number` = pessoa · `null` = familiar (só o rateado) · `undefined` = global.

Mudou o helper? Rode `cd apps/api && npm test` — 38 casos cobrem essas funções.

### Split de despesa — quem calcula o quê
O cliente manda **só a proporção**; `valorCalculado` é sempre derivado no servidor.

- `POST/PUT /api/despesas` aceita `splits: [{ pessoaId, ratio }]`. `valorCalculado` no
  corpo é aceito por compatibilidade e **ignorado**.
- A tela edita em percentual e normaliza pela soma antes de enviar
  (`ratio = peso / Σ pesos`) — por isso `33,33 × 3` vira 1/3 exato. Não voltar a
  dividir por 100 direto: era assim que 3 pessoas viravam 34/33/33 enquanto o rateio
  de fatura usava 1/3.
- `setSplits` joga o resíduo de centavos no último split, então
  `Σ valorCalculado === Despesa.valor` sempre.
- Recorrência e parcelamento recalculam o split sobre o valor **daquela** ocorrência.

### Total da fatura — regra única
O valor de uma fatura tem **uma** definição:

```
Fatura.total === somarTransacoes(Transacao da fatura) === analiseJson.fatura.total
```

Todos os caminhos de escrita convergem nisso — importação por IA
(`AnalyzePdfUseCase`), edição e exclusão de transação (`resyncFaturaTotais`). Os
helpers vivem em `finances/domain/services/fatura-transacoes.ts`:

| Função | Para quê |
|---|---|
| `filtrarTransacoesDespesa` | tira pagamento de fatura anterior / saldo transportado |
| `somarTransacoes` | soma em centavos, sem lixo de float |
| `conferirTotal` | compara o total impresso com a soma; alimenta o aviso na tela |
| `montarResumoCategorias` | reconstrói `resumo_categorias` do analiseJson |
| `recalcularSplitsProporcionais` | redistribui novo total **preservando ratios** |

O total impresso pela IA é **sinal de conferência, não fonte do número** — vem em
`conferencia` na resposta de `/api/intelligence/analyze-pdf`. Nunca reescreva
`Fatura.total` sem regravar `analiseJson` junto.

### IA
- Provider é **runtime**, não build: `anthropic | openai | gemini | openrouter | groq | mistral | together`
- Toda chamada passa por `DynamicLLMRepository`; não instancie SDK direto num use case
- `cache_control: { type: 'ephemeral' }` obrigatório no caminho **Anthropic**
  (default `claude-sonnet-4-6`) — os outros providers não têm equivalente
- System prompts em `.md` dentro de `domain/prompts/` — nunca inline no código
- Chave de IA vive cifrada no banco (`AIConfig` + `shared/crypto.ts` + `.secret`),
  **não** em variável de ambiente

### Bounded contexts
- `domain/` nunca importa Fastify, Prisma ou SDK de IA
- `infra/` implementa as interfaces de `domain/repositories/`
- `http/` é plugin Fastify — sem lógica de negócio
- Escrita multi-tabela no fluxo de fatura passa por `IUnitOfWork.run()`; chamada de IA
  fica **fora** da transação
- O client transacional do Prisma **não expõe `$transaction`**. Repo que abre transação
  por dentro precisa aceitar a flag `jaTransacional` (ver `PrismaDespesaRepository`) —
  senão estoura `TypeError: this.prisma.$transaction is not a function` quando chamado
  de dentro do `uow.run()`

### Rede
- API escuta `127.0.0.1`. Não há autenticação (ADR-0004) — o socket precisa ficar local.
  Só mude com `HOST` explícito e motivo declarado.
- Resposta 500 não devolve `stack` (fica no log)

### Rotas
- API em português sem acentos, sob `/api` (`/api/despesas`, `/api/formas-pagamento`)
- Frontend em português (`/despesas`, `/cartao`, `/acertai`, `/gestao`)

---

## Anti-patterns — nunca introduzir

- Result/Either — use `HttpError` direto
- Classe Mapper separada — `toDomain()` inline no repo
- Bounded context novo além de `finances` e `intelligence`
- Domain events / CQRS
- Zustand ou Redux — `useState`/`useReducer` + `MesRefContext`/`PersonaContext` bastam
- Reagregar números no cliente — o servidor é dono do número (`/api/dashboard`)
- Somar despesa sem passar por `escopo-despesas.ts`
- Chamada Anthropic sem `cache_control`
- `mesRef` como `Date`; valor em centavos
- Deploy cloud / Vercel / Postgres — app é local-only
- Autenticação / JWT
- `catch` que devolve dado zerado em silêncio — erro tem que aparecer na tela

---

## Design system

Tokens em `apps/web/src/styles/tokens.css` (canônicos + aliases `--app-*`):
`--verde #10F5A3` (primária) · `--roxo #B07AFF` (pessoas/splits) · `--azul #6FA9D6`
(informacional) · `--vermelho #F23A0A` (alerta) · escala `--cinza-*` · paleta `--bank-*`
para identidade de banco.

Fontes **como estão no código**: Inter (display e body, via `next/font/google`) +
JetBrains Mono (valores/datas). O ADR-0005 ainda pede Bricolage Grotesque + Plus Jakarta
Sans — divergência aberta; não "conserte" para um lado sem decisão do usuário.

Ícones: `lucide-react`. Gráficos: `recharts`. PDF no cliente: `pdfjs-dist` + `pdf-lib`.

Componentes prontos em `components/ui/`: `Button` `Card` `DataTable` `EmptyState`
`FormField` `KpiCard` `MiniMesSelector` `Modal` `MoneyValue`. Prefira `Modal` a
`alert()`/`confirm()` — ainda há nativos espalhados, é dívida, não padrão.

---

## Domínio

### Categorias
Categorias de **despesa** vêm do banco (model `Categoria`), não de constante — o prompt
de fatura injeta a lista via `{{CATEGORIAS}}`.

`CATEGORIAS_RENDIMENTO` e `FORMAS_PAGAMENTO_SUGESTOES` vivem em
`apps/web/src/shared/constants/financas.ts`.

Investimentos: `Investimento` (posição) + `MovimentacaoInvestimento` (aporte/resgate),
com `/api/investimentos/evolucao` para a série.

### Forma de pagamento
`FormaPagamento` é **por pessoa** (`pessoaId` + `nome` + `ativo` + `ordem`).
`POST /api/formas-pagamento` faz upsert por nome. `Despesa.formaPagamentoId` é opcional.
Rendimento **não** tem forma de pagamento (removido na migration
`20260606160000_remove_forma_pagamento_from_rendimento`).

### acertAÍ — divisão de gastos
`GET /api/acerto` calcula saldo por pessoa (`a_receber` | `a_pagar`), com
`incluirAnteriores` para pendências de meses passados e filtro por `membros`.
`POST /api/acerto` registra pagamento e abate splits em FIFO (`AcertoEntry` +
`AcertoDespesaSplit`). Tela em `/acertai`.

### Ciclo do cartão
- Ciclo ≠ mês calendário — `diaFechamento` configurável por cartão
- Se hoje > `diaFechamento` → ciclo vai de `diaFechamento+1` do mês atual até
  `diaFechamento` do próximo
- 1 snapshot por cartão por ciclo; o anterior fica para o delta
- `mesRef` do snapshot derivado de `ciclo_fim[:7]`
- A despesa `cartao_ciclo` é sintética-agregadora (ADR-0006): aparece na listagem,
  mas só a de maior valor por (cartão, mês) entra na soma

---

## Contrato do JSON de fatura (saída da IA)

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

## Endpoints com comportamento não-óbvio

### `GET /api/dashboard`
`?mesRef=YYYY-MM&escopo=global|familiar|pessoa&pessoaId=&meses=12`
`escopo=pessoa` sem `pessoaId` → 400. Devolve `totalDespesas`, `totalRendimentos`,
`totalInvestido`, `saldo`, `qtdRendimentos`, `despesasPorAba`, `despesasPorCategoria`,
`despesasPorFormaPagamento` (só em escopo de pessoa), `serie` (janela de `meses`) e
`patrimonio` — tudo numa chamada. O cliente **não** reagrega nada.
Não devolve `orcamentos`, `divisoesPendentes` nem `saldoAcertoPendente`: essas telas
consultam `/api/orcamentos`, `/api/divisao` e `/api/acerto` direto.

### `POST /api/intelligence/analyze-pdf`
Recebe base64 + `cartaoId`. Guard de `fileHash` antes (poupa a chamada de IA) e dentro
da transação (fecha corrida). Persistência inteira em `IUnitOfWork.run()`.

### `DELETE /api/despesas/:id?serie=true`
`serie=true` apaga a despesa e todas com o mesmo `origemId`; default apaga só a instância.

### `PUT /api/orcamentos`
`mesRef` nulo é a meta padrão. SQLite trata `NULL != NULL`, então esse caso usa
`findFirst` + update/create (não `upsert`) e limpa duplicatas na gravação.

---

## Decisões travadas

| ID | Questão | Decisão |
|----|---------|---------|
| DEC-001 | SQLite ou Postgres? | SQLite — local offline-first |
| DEC-002 | Agentes Python ou SDK TS? | TypeScript, multi-provider em runtime |
| DEC-003 | Shell desktop? | **Electron** (`installer/`) — Tauri foi descartado |
| DEC-004 | Autenticação? | Não — single-user, socket em loopback |
| DEC-005 | Valores em centavos? | Não — Float reais |
| DEC-006 | Quem é dono do número do mês? | O servidor, via `escopo-despesas.ts` |

---

## Comandos

```bash
dev.bat                              # API + Web + browser

cd apps/api
npm run dev                          # Fastify :3001
npm test                             # testes puros do domínio (node:test + tsx)
npm run build                        # tsc --noEmit
npm run db:migrate                   # backup + migrate (dev)
npm run db:backup
npm run db:seed

cd apps/web
npm run dev                          # Next :3000
npx tsc --noEmit

cd installer && npm run dist         # instalador NSIS (.exe)
```

Antes de dizer que terminou: `npm run build` na API **e** `npx tsc --noEmit` na web.
Se tocou em `escopo-despesas.ts` ou nos use cases de agregação, rode `npm test` também.

---

## Dívidas conhecidas (não são bugs novos)

- `intelligence.module.ts` importa 9 repos de `finances`; use cases de IA moram em
  `domain/` em vez de `application/`
- Cobertura de teste só nas funções puras de `escopo-despesas`
- `patrimonio.serie` ancorada em *hoje*, não no `mesRef` selecionado
- Fontes divergindo do ADR-0005
- ~780 estilos inline no frontend, acessibilidade rasa, `alert()`/`confirm()` nativos
- `docs/status.md`, `docs/erd.md` e alguns ADRs ainda descrevem o estado antigo
