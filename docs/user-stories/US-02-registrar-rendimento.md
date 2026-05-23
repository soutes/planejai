# US-02: Registrar rendimento

**Como** usuário, **quero** registrar meus rendimentos mensais por categoria, **para** calcular meu saldo real e taxa de poupança.

## Telas relacionadas
`/rendimentos` — listagem por mês + formulário

## Fluxo principal

1. Usuário acessa `/rendimentos`, seleciona mês
2. Vê listagem de rendimentos com total e breakdown por categoria
3. Clica em "Novo rendimento" → form: descrição, categoria, valor, recorrente
4. Salva → `POST /api/rendimentos`

## Categorias
`Salário`, `Aluguel`, `Freelas`, `Dividendos`, `Outros`

## Edição / exclusão
- `PUT /api/rendimentos/:id`
- `DELETE /api/rendimentos/:id?serie=true` — exclui só este mês ou toda a série recorrente

## Endpoints
- `GET /api/rendimentos?mesRef=`
- `POST /api/rendimentos`
- `PUT /api/rendimentos/:id`
- `DELETE /api/rendimentos/:id?serie=true`

## Notas de produto
- Recorrente: ao criar com `recorrente=true`, o sistema propaga para os próximos N meses automaticamente
- `origemId` identifica registros de uma mesma série recorrente

## Fora do escopo
- Rendimentos variáveis automáticos (API de corretora, etc.)
- Múltiplos usuários / rateio de renda
