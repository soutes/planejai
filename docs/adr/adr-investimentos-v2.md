# ADR — Investimentos v2: Posição + Movimentações

**Data:** 2026-05-27  
**Autor:** architect-invest-agent  
**Status:** APROVADO

---

## Contexto

O modelo atual de `Investimento` usa uma chave composta `(pessoaId, mesRef, categoria, instituicao)` — cada linha é um snapshot mensal. Isso não permite:
- Separar aporte de rendimento histórico por posição
- Calcular rentabilidade real (%)
- Alimentar o gráfico de evolução patrimonial com dados reais (hoje usa array vazio)

## Decisão

Substituir o snapshot mensal por dois modelos complementares:

1. **`Investimento`** — posição permanente (cadastra uma vez, não tem `mesRef`)
2. **`MovimentacaoInvestimento`** — evento mensal por posição (APORTE | RENDIMENTO | RESGATE)

---

## Novo Schema Prisma

```prisma
model Investimento {
  id            Int      @id @default(autoincrement())
  pessoaId      Int?
  categoria     String
  instituicao   String   @default("")
  ativo         Boolean  @default(true)
  notas         String?
  pessoa        Pessoa?  @relation(fields: [pessoaId], references: [id])
  movimentacoes MovimentacaoInvestimento[]

  @@unique([pessoaId, categoria, instituicao])
}

model MovimentacaoInvestimento {
  id             Int          @id @default(autoincrement())
  investimentoId Int
  mesRef         String       // YYYY-MM
  tipo           String       // 'APORTE' | 'RENDIMENTO' | 'RESGATE'
  valor          Float        // sempre positivo
  notas          String?
  investimento   Investimento @relation(fields: [investimentoId], references: [id], onDelete: Cascade)

  @@index([investimentoId, mesRef])
}
```

---

## Script SQL de Migration

Ver: `apps/api/prisma/migrations/20260527000000_investimento_posicao_movimentacao/migration.sql`

Estratégia:
1. Criar tabela `MovimentacaoInvestimento`
2. Inserir dados migrados (aporteMe → APORTE, saldo residual → RENDIMENTO seed)
3. Recriar tabela `Investimento` sem colunas `mesRef`, `valor`, `aporteMe`
4. Adicionar coluna `ativo`
5. Atualizar unique constraint para `(pessoaId, categoria, instituicao)`

---

## Interfaces de Repositório

### `IInvestimentoRepository`

```typescript
interface IInvestimentoRepository {
  findMany(filter: ListPosicoesFilter): Promise<PosicaoComMetricas[]>
  findById(id: number): Promise<Investimento | null>
  create(input: CreateInvestimentoInput): Promise<Investimento>
  update(id: number, input: UpdateInvestimentoInput): Promise<Investimento>
  deactivate(id: number): Promise<void>
}
```

### `IMovimentacaoInvestimentoRepository`

```typescript
interface IMovimentacaoInvestimentoRepository {
  findMany(filter: ListMovimentacoesFilter): Promise<MovimentacaoComPosicao[]>
  findById(id: number): Promise<MovimentacaoInvestimento | null>
  create(input: CreateMovimentacaoInput): Promise<MovimentacaoInvestimento>
  delete(id: number): Promise<void>
  getEvolucao(pessoaId: number | null | undefined, meses: number): Promise<EvolucaoMensal[]>
}
```

---

## Tipos de Domínio

```typescript
// Posição (sem mesRef)
interface Investimento {
  id: number
  pessoaId: number | null
  categoria: string
  instituicao: string
  ativo: boolean
  notas: string | null
}

// Posição enriquecida com métricas derivadas
interface PosicaoComMetricas extends Investimento {
  saldo_atual: number       // Σ(APORTE) − Σ(RESGATE) + Σ(RENDIMENTO)
  total_investido: number   // Σ(APORTE) − Σ(RESGATE)
  total_rendimentos: number // Σ(RENDIMENTO)
  rentabilidade_pct: number // total_rendimentos / total_investido × 100
}

// Movimentação
interface MovimentacaoInvestimento {
  id: number
  investimentoId: number
  mesRef: string            // YYYY-MM
  tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'
  valor: number             // sempre positivo
  notas: string | null
}

// Movimentação com dados da posição
interface MovimentacaoComPosicao extends MovimentacaoInvestimento {
  posicao: { categoria: string; instituicao: string }
}

// Evolução patrimonial mensal
interface EvolucaoMensal {
  mesRef: string
  saldo: number
  aportes: number
  rendimentos: number
  resgates: number
}
```

---

## Derivações calculadas pelo backend

- `saldo_atual` = Σ(APORTE) − Σ(RESGATE) + Σ(RENDIMENTO) — cumulativo até o mês mais recente
- `total_investido` = Σ(APORTE) − Σ(RESGATE) — capital próprio
- `total_rendimentos` = Σ(RENDIMENTO)
- `rentabilidade_pct` = `total_rendimentos / total_investido × 100` (0 quando `total_investido = 0`)

---

## Validações de contratos

- `domain/` nunca importa Fastify, Prisma ou `@anthropic-ai/sdk` ✅
- `mesRef` sempre `YYYY-MM` (string) ✅
- Valores em Float reais (nunca centavos) ✅
- `toDomain()` inline nos repos (sem classe Mapper) ✅
- `HttpError` direto nos use cases (sem Result pattern) ✅

---

## Impacto no Dashboard

`GetDashboardUseCase` calcula `totalInvestido` somando `investimento.valor` do snapshot mensal. Com o novo modelo, `totalInvestido` deve usar `saldo_atual` das posições ativas. O `IInvestimentoRepository.findMany()` agora retorna `PosicaoComMetricas[]` com `saldo_atual` já computado — mudança backward-compatible na interface.
