# User Stories — Invest Refactor v2

**Autor:** product-owner-invest-agent  
**Data:** 2026-05-27  
**Contexto:** Substituição do modelo snapshot (US-03) por Posição + Movimentações

---

## Validação do modelo anterior

O modelo de snapshot mensal (US-03) cobria apenas "registrar saldo por mês". O novo modelo de Posição + Movimentações expande isso sem perda de dados — os snapshots existentes são migrados como movimentações de APORTE/RENDIMENTO.

**Dados preservados na migração:**
- `aporteMe > 0` → `MovimentacaoInvestimento(tipo='APORTE', mesRef, valor=aporteMe)`
- `valor - aporteMe > 0` no mês mais antigo → `MovimentacaoInvestimento(tipo='RENDIMENTO', ...)` como seed
- Posições únicas `(pessoaId, categoria, instituicao)` → `Investimento` permanente

Conclusão: **nenhum dado histórico é perdido**.

---

## User Stories

| ID | Como | Quero | Para | Critérios de Aceite |
|----|------|-------|------|---------------------|
| US-INV-001 | investidor | cadastrar uma posição de investimento (sem data) | registrar onde invisto sem precisar de snapshot mensal | Campos: categoria (select), instituicao (text), pessoaId (opcional), notas. Unique: (pessoaId, categoria, instituicao). Retorna posição criada com id. |
| US-INV-002 | investidor | registrar um aporte em uma posição existente | contabilizar capital investido separadamente do rendimento | Campos: posicaoId (select), mesRef (YYYY-MM), valor (> 0), notas. Tipo fixado como APORTE. Rejeita valor ≤ 0 com 400. |
| US-INV-003 | investidor | registrar rendimento de uma posição | acompanhar quanto cada posição gerou de retorno | Campos: posicaoId, mesRef, valor (> 0), notas. Tipo fixado como RENDIMENTO. Rejeita valor ≤ 0 com 400. |
| US-INV-004 | investidor | registrar resgate de uma posição | controlar saídas de capital | Campos: posicaoId, mesRef, valor (> 0), notas. Tipo fixado como RESGATE. Rejeita valor ≤ 0 com 400. |
| US-INV-005 | investidor | visualizar meu patrimônio total e por categoria | ter visão consolidada dos meus investimentos | GET /api/investimentos/posicoes retorna saldo_atual, total_investido, total_rendimentos, rentabilidade_pct por posição. Hero card mostra soma de saldo_atual. PieChart mostra distribuição por categoria. |
| US-INV-006 | investidor | visualizar rentabilidade por posição | saber quais posições estão rendendo mais | Tabela de posições mostra: categoria, instituição, total_investido, total_rendimentos, rentabilidade_pct, saldo_atual. Ordenável por qualquer coluna. |
| US-INV-007 | investidor | ver evolução patrimonial dos últimos 12 meses com dados reais | acompanhar o crescimento do patrimônio ao longo do tempo | GET /api/investimentos/evolucao?meses=12 retorna array com mesRef, saldo, aportes, rendimentos, resgates. AreaChart usa dados reais (não array vazio). |
| US-INV-008 | investidor | desativar uma posição sem perder histórico | manter histórico de posições encerradas | DELETE /api/investimentos/posicoes/:id → ativo=false (soft delete). Posições inativas não aparecem no GET padrão. Movimentações históricas preservadas. |
| US-INV-009 | investidor | filtrar investimentos por pessoa | separar patrimônio pessoal do familiar | GET /api/investimentos/posicoes?pessoaId=X filtra por pessoa. Tabs por pessoa na UI quando há mais de 1 pessoa. |

---

## Decisões registradas

| ID | Decisão |
|----|---------|
| DEC-INV-001 | Posição sem `mesRef` — a posição existe permanentemente, apenas as movimentações têm data |
| DEC-INV-002 | `saldo_atual` calculado pelo backend a partir das movimentações — nunca armazenado como campo |
| DEC-INV-003 | Soft delete de posição via `ativo=false` — movimentações históricas preservadas com `onDelete: Cascade` desativado |
| DEC-INV-004 | Dashboard `totalInvestido` usa `saldo_atual` das posições ativas (não `valor` do snapshot) |
| DEC-INV-005 | Migração de dados: aporteMe → APORTE, saldo residual → RENDIMENTO seed apenas no mês mais antigo por posição |
