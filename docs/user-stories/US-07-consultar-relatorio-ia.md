# US-07: Consultar relatório com IA

**Como** usuário, **quero** gerar um relatório executivo sobre meu mês financeiro com análise da IA, **para** ter insights sobre meus gastos sem precisar analisar planilha.

## Telas relacionadas
`/relatorio` — geração e exibição do relatório

## Fluxo principal

1. Usuário acessa `/relatorio`, seleciona mês
2. Clica em "Gerar relatório"
3. Frontend envia `POST /api/intelligence/report` com contexto do mês
4. Backend agrega dados financeiros do mês (despesas por categoria, rendimentos, saldo, patrimônio, ciclo de cartão)
5. Chama Anthropic com contexto + system prompt de análise
6. IA retorna relatório em Markdown com: resumo executivo, padrões identificados, alertas, sugestões
7. Frontend renderiza Markdown

## Endpoint
- `POST /api/intelligence/report` → `{ mesRef: string }`

O backend é responsável por coletar todos os dados financeiros do mês — o frontend envia apenas `mesRef`.

## Estrutura do relatório (Markdown)

```
## Resumo do mês
[saldo, comparação com mês anterior]

## Onde foi o dinheiro
[análise de categorias, gastos expressivos]

## Alertas
[categorias acima do esperado, gastos atípicos]

## Patrimônio
[evolução, aporte do mês, observações]

## Sugestões
[ações concretas baseadas nos dados]
```

## Notas de produto
- Sem streaming no MVP — usuário aguarda response completo (~5-15s)
- Relatório **não é salvo** no banco — gerado on-demand a cada clique
- Prompt caching no system prompt reduz latência em chamadas repetidas do mesmo mês
- Dados enviados para IA são apenas agregações (totais por categoria) — nunca detalhes de transações individuais

## Fora do escopo
- Histórico de relatórios gerados
- Chat interativo com IA sobre finanças
- Streaming / resposta incremental
- Exportação do relatório em PDF
