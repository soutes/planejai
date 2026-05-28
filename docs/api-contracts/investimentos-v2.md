# API Contracts — Investimentos v2

**Autor:** backend-invest-agent  
**Data:** 2026-05-27  
**Status:** CONTRATO PUBLICADO

---

## Posições

### GET /api/investimentos/posicoes

Query params: `pessoaId?: number`, `ativo?: boolean` (default: true)

Response `200`:
```typescript
Array<{
  id: number
  pessoaId: number | null
  categoria: string
  instituicao: string
  ativo: boolean
  notas: string | null
  saldo_atual: number       // Σ(APORTE) − Σ(RESGATE) + Σ(RENDIMENTO)
  total_investido: number   // Σ(APORTE) − Σ(RESGATE)
  total_rendimentos: number // Σ(RENDIMENTO)
  rentabilidade_pct: number // total_rendimentos / total_investido × 100
}>
```

### POST /api/investimentos/posicoes

Body:
```typescript
{
  pessoaId?: number | null
  categoria: string          // valor obrigatório, deve estar em CATEGORIAS_INVESTIMENTO
  instituicao: string        // obrigatório, não-vazio
  notas?: string | null
}
```

Response `201`: PosicaoComMetricas (com métricas zeradas na criação)

Erros:
- `400` se categoria inválida
- `400` se instituicao vazia

### PUT /api/investimentos/posicoes/:id

Body: campos opcionais — `categoria?`, `instituicao?`, `ativo?`, `notas?`

Response `200`: PosicaoComMetricas

Erros:
- `404` se posição não encontrada

### DELETE /api/investimentos/posicoes/:id

Response `204` — soft delete (ativo=false)

Erros:
- `404` se posição não encontrada

---

## Movimentações

### GET /api/investimentos/movimentacoes

Query params: `investimentoId?`, `mesRef?` (YYYY-MM), `tipo?`, `pessoaId?`

Response `200`:
```typescript
Array<{
  id: number
  investimentoId: number
  mesRef: string
  tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'
  valor: number
  notas: string | null
  posicao: {
    categoria: string
    instituicao: string
  }
}>
```

### POST /api/investimentos/movimentacoes

Body:
```typescript
{
  investimentoId: number    // posição deve existir e estar ativa
  mesRef: string            // YYYY-MM
  tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'
  valor: number             // deve ser > 0
  notas?: string | null
}
```

Response `201`: MovimentacaoComPosicao

Erros:
- `400` se valor ≤ 0
- `400` se mesRef inválido
- `400` se tipo inválido
- `404` se posição não encontrada
- `400` se posição está inativa

### DELETE /api/investimentos/movimentacoes/:id

Response `204`

Erros:
- `404` se movimentação não encontrada

---

## Evolução patrimonial

### GET /api/investimentos/evolucao

Query params: `meses?: number` (default: 12, range: 1-60), `pessoaId?`

Response `200`:
```typescript
Array<{
  mesRef: string     // YYYY-MM
  saldo: number      // saldo cumulativo até este mês
  aportes: number    // total de aportes no mês
  rendimentos: number
  resgates: number
}>
```

Comportamento:
- Array vazio quando não há movimentações
- Saldo cumulativo inclui todos os meses anteriores à janela solicitada
- Sempre retorna exatamente N entradas (uma por mês), mesmo sem movimentações

Erros:
- `400` se meses fora do range [1, 60]
