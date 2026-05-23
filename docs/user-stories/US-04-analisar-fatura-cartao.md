# US-04: Analisar fatura de cartão via IA

**Como** usuário, **quero** enviar o PDF ou imagem da minha fatura de cartão e ter as transações extraídas e categorizadas automaticamente, **para** não precisar digitar cada compra manualmente.

## Telas relacionadas
`/cartao` — upload de arquivo + resultado da análise + edição de categorias

## Fluxo principal

1. Usuário acessa `/cartao`, seleciona o cartão
2. Faz upload de PDF ou imagem da fatura
3. Frontend envia para `POST /api/intelligence/analyze-pdf` (ou `analyze-image`)
4. Backend chama Anthropic SDK com o arquivo + system prompt de extração
5. IA retorna JSON estruturado (banco, mês, vencimento, total, lista de transações com categoria)
6. Backend valida o JSON, salva `Fatura` + `Transacao[]` no banco
7. Frontend exibe resultado: tabela de transações com categorias editáveis
8. Usuário pode corrigir categorias → `PUT /api/faturas/:id/transacoes`
9. Usuário confirma → snapshot do ciclo é atualizado

## Contrato do JSON da IA

```typescript
{
  fatura: { banco, mesReferencia, vencimento, total, limite },
  transacoes: [{ data, descricao, estabelecimento, valor, categoria, parcela }],
  resumo_categorias: [{ categoria, valor, percentual, qtdTransacoes }],
  comentarioExecutivo: string // Markdown
}
```

## Endpoints
- `POST /api/intelligence/analyze-pdf`  → `{ pdfBase64, cartaoId }`
- `POST /api/intelligence/analyze-image` → `{ imageBase64, cartaoId }`
- `GET /api/faturas?cartaoId=`
- `PUT /api/faturas/:id/transacoes` → `{ transacoes: [{ id, categoria }] }` — edição em lote de categorias
- `DELETE /api/faturas/:id`

## Notas de produto
- Arquivo nunca é armazenado no servidor — apenas o JSON extraído
- Hash do arquivo (`fileHash`) evita processamento duplicado da mesma fatura
- Fatura processada dispara `sync_cartao_ciclo` — total vira despesa sintética em `/despesas` (US-05)
- `CategoryRule` do banco pode ser aplicada automaticamente antes de exibir para o usuário

## Fora do escopo
- OCR de faturas físicas escaneadas (baixa qualidade)
- Processamento de múltiplos PDFs em batch
- Faturas com mais de 50 páginas (context window limit)
- Suporte a outros formatos além de PDF e imagem
