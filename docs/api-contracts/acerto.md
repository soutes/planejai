# API Contract — Acerto de Contas

> Status: CONTRATO PUBLICADO — 2026-05-28
> Gerado pelo lead-acerto-agent com base em US-12, US-13 e docs/erd.md.

---

## Interfaces TypeScript

```typescript
interface SaldoPessoa {
  pessoaId: number
  nome: string
  cor: string
  saldoMesAtual: number        // Σ (valorCalculado - valorQuitado) dos splits do mesRef
  pendenciasAnteriores: number // idem de meses anteriores ao mesRef
  saldoTotal: number           // saldoMesAtual + pendenciasAnteriores
  direcao: 'a_receber' | 'a_pagar' // 'a_receber' = pessoa deve ao usuário principal
  despesas: SaldoDespesa[]
}

interface SaldoDespesa {
  despesaId: number
  descricao: string
  categoria: string
  valorTotal: number           // Despesa.valor
  valorProporcional: number    // DespesaSplit.valorCalculado
  valorQuitado: number         // DespesaSplit.valorQuitado
  saldoPendente: number        // valorProporcional - valorQuitado
  data: string | null          // Despesa.data (YYYY-MM-DD)
  mesRef: string               // Despesa.mesRef (YYYY-MM)
  splitId: number              // DespesaSplit.id
}

interface AcertoEntryResponse {
  id: number
  pessoaId: number
  pessoa: { id: number; nome: string; cor: string }
  mesRef: string               // YYYY-MM
  valor: number
  data: string                 // YYYY-MM-DD
  formaPagamento: 'pix' | 'ted' | 'dinheiro' | 'outro'
  observacao: string | null
  criadoEm: string             // ISO 8601
  splits: AcertoDespesaSplitResponse[]
}

interface AcertoDespesaSplitResponse {
  id: number
  splitId: number
  valorCoberto: number
  despesa: {
    id: number
    descricao: string
    data: string | null
    mesRef: string
  }
}

interface CreateAcertoInput {
  pessoaId: number
  mesRef: string               // YYYY-MM
  valor: number                // Float reais, positivo
  data: string                 // YYYY-MM-DD
  formaPagamento: 'pix' | 'ted' | 'dinheiro' | 'outro'
  observacao?: string
}
```

---

## Endpoints

### `GET /api/acerto`

**Query params:**
- `mesRef` (string YYYY-MM, obrigatório)
- `incluirAnteriores` (boolean string `'true'`/`'false'`, default `false`)

**Response 200:** `SaldoPessoa[]`

**Regras:**
- Exclui pessoa com `padrao=true` (usuário principal)
- Exclui despesas com `somenteMeu=true`
- Se `incluirAnteriores=false`: apenas splits de despesas com `mesRef` igual ao parâmetro
- Se `incluirAnteriores=true`: inclui splits de `mesRef` anteriores com `saldoPendente > 0`
- Apenas pessoas com `familiar=true AND padrao=false AND ativo=true`
- Ordena despesas por `data ASC` dentro de cada pessoa

**Exemplo de response:**
```json
[
  {
    "pessoaId": 2,
    "nome": "Cônjuge",
    "cor": "#B07AFF",
    "saldoMesAtual": 850.00,
    "pendenciasAnteriores": 200.00,
    "saldoTotal": 1050.00,
    "direcao": "a_receber",
    "despesas": [
      {
        "despesaId": 42,
        "descricao": "Aluguel maio",
        "categoria": "Casa",
        "valorTotal": 2000.00,
        "valorProporcional": 1000.00,
        "valorQuitado": 0,
        "saldoPendente": 1000.00,
        "data": "2026-05-05",
        "mesRef": "2026-05",
        "splitId": 15
      }
    ]
  }
]
```

---

### `POST /api/acerto`

**Body:** `CreateAcertoInput`

**Response 201:** `AcertoEntryResponse`

**Regras:**
- Cria `AcertoEntry` + `AcertoDespesaSplit[]` + atualiza `DespesaSplit.valorQuitado` em transação Prisma
- **FIFO parcial:** distribui o valor pelos splits pendentes ordenados por `Despesa.data ASC, Despesa.id ASC`
  - Para cada split: `cobrir = min(saldoPendente, valorRestante)` → `valorQuitado += cobrir`
  - Cria `AcertoDespesaSplit` apenas para splits com `cobrir > 0`
- Erro 400 se `valor <= 0`
- Erro 400 se `mesRef` não match `/^\d{4}-\d{2}$/`
- Erro 400 se `data` não match `/^\d{4}-\d{2}-\d{2}$/`
- Erro 404 se `pessoaId` não existe

---

### `DELETE /api/acerto/:id`

**Params:** `id` (number)

**Response 204:** no content

**Regras:**
- Busca `AcertoEntry` com `splits`
- Erro 404 se não encontrado
- Para cada `AcertoDespesaSplit`: `DespesaSplit.valorQuitado -= valorCoberto` (em transação)
- Deleta `AcertoEntry` (CASCADE apaga `AcertoDespesaSplit`)

---

### `GET /api/acerto/historico`

**Query params (todos opcionais):**
- `pessoaId` (number)
- `mesRefInicio` (string YYYY-MM)
- `mesRefFim` (string YYYY-MM)

**Response 200:** `AcertoEntryResponse[]` ordenado por `criadoEm DESC`

---

## Schemas Zod (para acerto.routes.ts)

```typescript
const CreateAcertoSchema = z.object({
  pessoaId: z.number().int().positive(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
  valor: z.number().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  formaPagamento: z.enum(['pix', 'ted', 'dinheiro', 'outro']),
  observacao: z.string().optional(),
})
```

---

## Modificações em arquivos existentes

### `DespesaSplit` (response de despesas.routes.ts)
Adicionar `valorQuitado: number` no schema de response do split.

### `GetDashboardUseCase` (dashboard)
Adicionar campo `saldoAcertoPendente: number` — soma de `saldoTotal` de todas as pessoas para o `mesRef`.

### `DeleteDespesaUseCase`
Antes de deletar: verificar se algum `DespesaSplit` da despesa está referenciado em `AcertoDespesaSplit`. Se sim: `HttpError(409, 'Despesa possui splits com acertos registrados. Exclua os acertos primeiro.')`.
