# US-01: Registrar despesa

**Como** usuário, **quero** lançar despesas por mês e aba (Pessoal/Familiar), **para** controlar para onde vai meu dinheiro.

## Telas relacionadas
`/despesas` — listagem filtrada por mês e aba + formulário de adição/edição

## Fluxo principal

1. Usuário acessa `/despesas`, seleciona mês (`mesRef`) e aba
2. Vê listagem de despesas do período com total
3. Clica em "Nova despesa" → modal/form com campos: descrição, categoria, valor, data, notas
4. Opções adicionais: recorrente (N meses), parcelado (N parcelas), vínculo com cartão
5. Salva → `POST /api/despesas` → lista atualiza

## Edição / exclusão

- Clicar em despesa → form pré-preenchido → `PUT /api/despesas/:id`
- Excluir despesa recorrente: opção "excluir só esta" ou "excluir toda a série" (`DELETE /api/despesas/:id?serie=true`)

## Endpoints
- `GET /api/despesas?mesRef=&abaId=`
- `POST /api/despesas`
- `PUT /api/despesas/:id`
- `DELETE /api/despesas/:id?serie=true`

## Notas de produto
- Categorias são as padrão + categorias customizadas (US-10)
- Despesa com `emFaturaCartao=true` foi gerada por análise de fatura (US-04) — não editável manualmente
- Despesa com `tipo=cartao_ciclo` é sintética do ciclo (US-05) — não aparece na listagem manual
- Split entre pessoas gerado automaticamente se aba tem `splitDestinoCategoria` configurado

## Fora do escopo
- Importação de OFX/CSV (pós-MVP)
- Reconciliação bancária automática
- Recorrência com valor variável
