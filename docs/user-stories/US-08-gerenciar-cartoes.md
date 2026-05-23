# US-08: Gerenciar cartões

**Como** usuário, **quero** cadastrar, editar e desativar meus cartões de crédito, **para** organizar as faturas por cartão e configurar splits familiares.

## Telas relacionadas
`/gestao` — seção de cartões

## Fluxo principal

1. Usuário acessa `/gestao` → aba "Cartões"
2. Vê lista de cartões (nome, últimos dígitos, limite, cor, aba associada, ativo/inativo)
3. Adiciona cartão: nome, proprietário, últimos 4 dígitos, cor, limite, aba associada
4. Edita cartão existente
5. Desativa cartão (soft-delete — faturas históricas preservadas)
6. Configura splits por cartão: pessoa + ratio (ex: cônjuge 50%)

## Endpoints
- `GET /api/cartoes`
- `POST /api/cartoes`
- `PUT /api/cartoes/:id`
- `DELETE /api/cartoes/:id` → desativa (ativo=false)

## Notas de produto
- Cartão com `id=1` é sentinela "Sem cartão" — nunca deletável
- `abaId`: aba de despesa onde o total do ciclo aparece como despesa sintética
- `cor`: hex string para identificação visual na UI
- Split por cartão: persistido em `CartaoSplit` — usado pelo `sync_cartao_ciclo` para gerar divisão
- Desativar cartão limpa snapshots de ciclo associados

## Fora do escopo
- Integração com API do banco para saldo real
- Notificação de vencimento de fatura
- Múltiplas bandeiras (Visa/Master) como campo — apenas nome livre
