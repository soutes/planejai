# US-06: Ver dashboard financeiro

**Como** usuário, **quero** ver um resumo financeiro do mês com KPIs, gráficos e saldo, **para** ter uma visão instantânea da minha saúde financeira.

## Telas relacionadas
`/dashboard` — visão consolidada do mês selecionado

## Fluxo principal

1. Usuário acessa `/dashboard` (página inicial)
2. Seleciona mês (default: mês atual)
3. Vê KPIs: total rendimentos, total despesas, saldo do mês, patrimônio total
4. Vê gráfico de despesas por categoria (pizza ou barras)
5. Vê gráfico de evolução mensal (últimos 12 meses: receita vs despesa)
6. Vê gráfico de evolução do patrimônio
7. Vê breakdown de despesas por aba (Pessoal, Familiar)

## Endpoint
- `GET /api/dashboard?mesRef=YYYY-MM`

O endpoint retorna tudo em uma única chamada:
```typescript
{
  rendimentos: { total, porCategoria },
  despesas: { total, porCategoria, porAba },
  saldo: number,
  patrimonio: { total, evolucao12meses },
  cartoes: { totalCiclo }
}
```

## Notas de produto
- Dashboard é Server Component — sem TanStack Query, sem client JS no fetch inicial
- Saldo = rendimentos - despesas do mês (excluindo despesas `tipo=cartao_ciclo` e `split_auto` para evitar dupla contagem)
- Gráficos com `recharts` — `BarChart`, `PieChart`, `AreaChart`
- Seletor de mês client-side → navega para `?mesRef=YYYY-MM` (URL param, não estado)

## Fora do escopo
- Comparação com orçamento/meta no dashboard (disponível em US-10)
- Exportação do dashboard como PDF/imagem
- Widget de notificações
