# API Contract — intelligence
Data: 2026-05-20

## Endpoints

### POST /api/intelligence/analyze-pdf
Analisa fatura de cartão de crédito via IA (Claude claude-sonnet-4-6).

Request body:
```json
{
  "pdfBase64": "string — PDF em base64",
  "cartaoId": 1,
  "arquivoOriginal": "fatura.pdf"
}
```

Response 200 (FaturaAnalisada):
```json
{
  "fatura": {
    "banco": "string",
    "mes_referencia": "YYYY-MM",
    "vencimento": "YYYY-MM-DD",
    "total": 0.00,
    "limite": null
  },
  "transacoes": [
    {
      "data": "YYYY-MM-DD",
      "descricao": "string",
      "estabelecimento": "string",
      "valor": 0.00,
      "categoria": "string",
      "parcela": null
    }
  ],
  "resumo_categorias": [
    {
      "categoria": "string",
      "valor": 0.00,
      "percentual": 0.00,
      "qtd_transacoes": 0
    }
  ],
  "comentario_executivo": "string"
}
```

Response 409: fatura já importada (mesmo hash SHA-256)
Response 422: resposta da IA não é JSON válido

---

### POST /api/intelligence/report
Gera relatório executivo financeiro do mês.

Request body:
```json
{
  "mesRef": "YYYY-MM"
}
```

Response 200 (RelatorioIA):
```json
{
  "titulo": "string",
  "resumo": "string",
  "destaques": [{ "tipo": "positivo|negativo|neutro", "titulo": "str", "descricao": "str" }],
  "alertas": ["string"],
  "recomendacoes": ["string"],
  "comentario_final": "string"
}
```

## Notas

- Modelo: `claude-sonnet-4-6`
- `cache_control: { type: 'ephemeral' }` obrigatório em todo system prompt
- Sem streaming no MVP
- Prompt de análise de fatura: `src/modules/intelligence/domain/prompts/analyze-fatura.md`
- Prompt de relatório: `src/modules/intelligence/domain/prompts/generate-report.md`
