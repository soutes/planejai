# US-03: Registrar investimento

**Como** usuário, **quero** registrar o saldo dos meus investimentos por categoria e instituição a cada mês, **para** acompanhar a evolução do meu patrimônio.

## Telas relacionadas
`/investimentos` — listagem de snapshots mensais + gráfico de evolução + formulário

## Fluxo principal

1. Usuário acessa `/investimentos`, seleciona mês
2. Vê listagem de posições (categoria + instituição + valor + aporte do mês)
3. Vê gráfico de evolução patrimonial dos últimos 12 meses
4. Adiciona/atualiza posição → `POST /api/investimentos` (upsert por `mesRef + categoria + instituicao`)

## Categorias
`Reserva de Emergência`, `Renda Fixa`, `Tesouro Direto`, `Ações`, `FIIs`, `Previdência Privada`, `Fundos`, `Cripto`, `Internacional`

## Endpoints
- `GET /api/investimentos?mesRef=`
- `POST /api/investimentos`
- `DELETE /api/investimentos/:id`

## Notas de produto
- É snapshot mensal — não série de transações. Usuário informa saldo total no fim do mês.
- `aporteMe` = quanto aportou este mês (separado do saldo total)
- Upsert por `(mesRef, categoria, instituicao)` — atualizar posição existente não cria duplicata
- Gráfico de evolução: `GET /api/dashboard?mesRef=` retorna histórico de 12 meses agregado

## Fora do escopo
- Integração com API de corretora (cotações automáticas)
- Cálculo de rentabilidade / CAGR
- Tracking de ativos individuais (ações, FIIs específicos)
