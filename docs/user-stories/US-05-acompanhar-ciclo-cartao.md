# US-05: Acompanhar ciclo atual do cartão

**Como** usuário, **quero** ver quanto já gastei no ciclo corrente de cada cartão comparado ao ciclo anterior, **para** saber se estou dentro do orçamento antes da fatura fechar.

## Telas relacionadas
`/cartao` — seção de acompanhamento do ciclo ativo

## Fluxo principal

1. Usuário acessa `/cartao`, seleciona cartão
2. Vê: total atual do ciclo, delta vs ciclo anterior, % do limite usado
3. Vê breakdown de gastos por categoria do ciclo atual
4. Vê data de início/fim do ciclo e dias restantes

## Conceito de ciclo

O ciclo **não é o mês calendário** — é determinado pelo `diaFechamento` do cartão:
- Se hoje > `diaFechamento`: ciclo vai de `diaFechamento+1` deste mês até `diaFechamento` do próximo
- Se hoje ≤ `diaFechamento`: ciclo vai de `diaFechamento+1` do mês anterior até `diaFechamento` deste mês

O sistema mantém no máximo 2 snapshots por cartão (atual + anterior). O snapshot anterior permite calcular o delta.

## Endpoints
- `GET /api/snapshots?cartaoId=&ref=` — retorna snapshot atual + anterior

## Notas de produto
- Snapshot é criado/atualizado ao processar uma fatura (US-04)
- `mesRef` do ciclo = `cicloFim[:7]` (ex: ciclo até 05/06 → mesRef `2026-06`)
- Total do ciclo vira despesa sintética `tipo=cartao_ciclo` em `/despesas` automaticamente
- Se usuário tem múltiplos cartões, pode ver visão consolidada

## Fora do escopo
- Alertas push quando ciclo atinge X% do limite
- Projeção de gasto até o fechamento
- Histórico de ciclos além do anterior
