# API Contract — finances
Data: 2026-05-20

## Endpoints

### GET /api/pessoas
Response 200: `[{ id, nome, cor, ativo }]`

### POST /api/pessoas
Body: `{ nome: string, cor?: string }`
Response 201: `{ id, nome, cor, ativo }`

### PUT /api/pessoas/:id
Body: `{ nome?, cor?, ativo? }`
Response 200: Pessoa

### DELETE /api/pessoas/:id
Response 204

---

### GET /api/abas
Response 200: `[{ id, nome, icon, cor, ordem, splitDestinoCategoria, ativo }]`

### POST /api/abas
Body: `{ nome, icon?, cor?, ordem?, splitDestinoCategoria? }`
Response 201: AbaDespesa

### PUT /api/abas/:id
Body: campos opcionais
Response 200: AbaDespesa

### DELETE /api/abas/:id
Response 204

---

### GET /api/categorias
Response 200: `[{ id, nome, icon, padrao, permanente, ativa }]`

### POST /api/categorias
Body: `{ nome, icon? }`
Response 201: Categoria

### PUT /api/categorias/:id
Body: `{ nome?, icon?, ativa? }`
Response 200: Categoria

### DELETE /api/categorias/:id
Response 204

---

### GET /api/regras-fixas
Response 200: `[{ id, abaId, descricao, categoria, valor, diaVencimento, ativo }]`

### POST /api/regras-fixas
Body: `{ abaId, descricao, categoria, valor, diaVencimento? }`
Response 201: RegraFixa

### PUT /api/regras-fixas/:id
Body: campos opcionais
Response 200: RegraFixa

### DELETE /api/regras-fixas/:id
Response 204

---

### GET /api/despesas?mesRef&abaId&cartaoId&incluirSinteticos
Response 200: `[Despesa]` (sem `cartao_ciclo`/`split_auto` por padrão)

### POST /api/despesas
Body: `{ abaId, mesRef, descricao, categoria, valor, ...opcionals, splits? }`
Response 201: Despesa

### PUT /api/despesas/:id
Body: campos editáveis
Response 200: Despesa

### DELETE /api/despesas/:id?serie=true
`serie=true` apaga toda a série (mesmo origemId)
Response 204

### GET /api/despesas/:id/splits
Response 200: `[{ id, despesaId, pessoaId, ratio, valorCalculado }]`

---

### GET /api/rendimentos?mesRef
Response 200: `[Rendimento]`

### POST /api/rendimentos
Body: `{ mesRef, descricao, categoria?, valor, recorrente?, totalRepeticoes? }`
Se `recorrente=true && totalRepeticoes>1`, cria N meses com origemId compartilhado.
Response 201: Rendimento (primeiro da série)

### PUT /api/rendimentos/:id
Response 200: Rendimento

### DELETE /api/rendimentos/:id?serie=true
Response 204

---

### GET /api/investimentos?mesRef
Response 200: `[{ id, mesRef, categoria, instituicao, valor, aporteMe, notas }]`

### POST /api/investimentos
Body: `{ mesRef, categoria, instituicao?, valor, aporteMe? }`
Response 201: Investimento

### PUT /api/investimentos/:id
Response 200: Investimento

### DELETE /api/investimentos/:id
Response 204

---

### GET /api/cartoes
Response 200: `[Cartao]`

### POST /api/cartoes
Body: `{ nome, proprietario?, finalDigitos?, cor?, limite?, diaFechamento?, abaId? }`
Response 201: Cartao

### PUT /api/cartoes/:id
Response 200: Cartao

### DELETE /api/cartoes/:id
Soft delete (`ativo=false`). Cartão id=1 é sentinela e não pode ser desativado.
Response 204

---

### GET /api/faturas?cartaoId
Response 200: `[Fatura]`

### GET /api/faturas/:id
Response 200: Fatura

### DELETE /api/faturas/:id
Response 204

### GET /api/faturas/:id/transacoes
Response 200: `[Transacao]`

### PUT /api/faturas/:id/transacoes/:transacaoId
Body: `{ categoria? }`
Response 200: Transacao

---

### GET /api/snapshots?cartaoId
Response 200: `[SnapshotCiclo]`

### POST /api/snapshots
Body: `{ cartaoId, cicloInicio, cicloFim, dataUpload, total, qtdTransacoes, jsonDados }`
Response 201: SnapshotCiclo

### DELETE /api/snapshots/:id
Response 204

---

### GET /api/divisao?pessoaId&quitado
Response 200: `[DivisaoEntry]`

### POST /api/divisao
Body: `{ pessoaId, mesRef, descricao, valorTotal, direcao?, parcelado?, totalParcelas?, parcelaAtual?, dataInicio?, origemDespesaId?, notas? }`
Response 201: DivisaoEntry

### PUT /api/divisao/:id
Quita a divisão (`quitado=true`).
Response 200: DivisaoEntry

---

### GET /api/orcamentos?abaId&mesRef
Response 200: `[Orcamento]`

### POST /api/orcamentos
Body: `{ abaId, mesRef?, categoria, valorMeta }`
Response 201: Orcamento

### DELETE /api/orcamentos/:id
Response 204

---

### GET /api/dashboard?mesRef
Response 200:
```json
{
  "mesRef": "string",
  "totalDespesas": 0,
  "totalRendimentos": 0,
  "totalInvestido": 0,
  "saldo": 0,
  "despesasPorAba": [{ "abaId": 0, "abaNome": "str", "abaCor": "str", "total": 0 }],
  "despesasPorCategoria": [{ "categoria": "str", "total": 0, "percentual": 0 }],
  "orcamentos": [{ "abaId": 0, "categoria": "str", "valorMeta": 0, "gasto": 0 }],
  "divisoesPendentes": [{ "id": 0, "pessoaId": 0, "pessoaNome": "str", "valorTotal": 0, "direcao": "str", "descricao": "str" }]
}
```

---

### GET /api/category-rules
Response 200: `[CategoryRule]`

### POST /api/category-rules
Body: `{ pattern, categoria }`
Response 201: CategoryRule

### PUT /api/category-rules/:id
Body: `{ pattern?, categoria? }`
Response 200: CategoryRule

### DELETE /api/category-rules/:id
Response 204
