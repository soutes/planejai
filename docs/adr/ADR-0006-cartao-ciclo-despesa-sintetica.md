# ADR-0006: Total do cartão como despesa sintética em gestao.db

- **Status:** Accepted
- **Data:** 2026-05-15

## Contexto

Faturas de cartão de crédito têm transações individuais armazenadas em `faturas.db`.
Para que o cartão apareça corretamente no fluxo de caixa mensal da Visão Geral
(gerenciado por `gestao.db`), o valor total da fatura precisa ser representado como
uma despesa. Duplicar todas as transações em `gestao.db` causaria redundância e
dificultaria manutenção.

## Decisão

Quando uma fatura de cartão é fechada/salva, seu total é materializado como uma
única despesa sintética em `gestao.db` com `tipo = 'cartao_ciclo'` e referência ao
ID da fatura. Essa despesa representa o ciclo completo do cartão no mês e aparece
no fluxo de caixa como qualquer outra despesa.

## Consequências

- A sincronização entre `faturas.db` e `gestao.db` deve ser idempotente: salvar a
  mesma fatura duas vezes não pode criar duas despesas sintéticas.
- A despesa `cartao_ciclo` é read-only na tela de despesas — ela não pode ser
  editada diretamente; a fonte de verdade é a fatura em `faturas.db`.
- Ao deletar uma fatura, a despesa sintética correspondente deve ser removida de
  `gestao.db` (cleanup obrigatório).
- Transações individuais do cartão não aparecem no fluxo de caixa da Visão Geral —
  apenas o total. Detalhamento fica na página de Cartões.

## Alternativas consideradas

**Somar transações diretamente na query da Visão Geral:** join cross-database via
Python em tempo de query. Descartado porque é frágil (mudanças em `faturas.db`
quebram silenciosamente a Visão Geral), não gera histórico auditável em `gestao.db`
e dificulta relatórios mensais futuros.
