# ADR-0007: Pipeline Analista → QA → Relator antes de salvar no banco

- **Status:** Accepted
- **Data:** 2026-05-15

## Contexto

O agente Analista (provedor configurável via src/config_ia.py) retorna JSON com dados extraídos de faturas e OCR.
Esse JSON pode conter categorias inválidas, totais inconsistentes com a soma das
transações, duplicidades de OCR ou campos obrigatórios ausentes. Salvar dados
sujos no banco dificulta correções posteriores e corromperia relatórios e o fluxo
de caixa da Visão Geral.

## Decisão

Todo JSON retornado pelo Analista passa por um pipeline de duas etapas antes de
ser salvo:

1. **QA (`src/agent_qa.py` — `validate_and_fix`):** validação determinística e
   auto-correção. Categorias inválidas são corrigidas para `"Outros"`;
   `resumo_categorias` é reconstruído dos dados corrigidos. Falhas críticas
   (campos obrigatórios ausentes, lista de transações vazia) levantam `QAError`
   e abortam o salvamento.

2. **Relator (`src/agent_reporter.py` — `generate_commentary`):** gera
   `comentario_executivo` contextualizado com base nos dados já validados.
   Pode receber histórico de faturas anteriores para incluir variação percentual.

Nenhuma chamada ao Claude é feita no QA ou no Relator — ambos são Python puro,
determinísticos e instantâneos.

## Consequências

- Análise com `QAError` é rejeitada antes de tocar o banco; o usuário vê o erro
  na UI e pode retentar.
- `qa_warnings` (problemas suaves corrigidos automaticamente) ficam visíveis na UI
  após o salvamento para que o usuário saiba o que foi ajustado.
- O banco nunca contém JSON com categorias inválidas ou `resumo_categorias`
  inconsistente.
- O pipeline aumenta o tempo total de processamento em ~0ms (QA e Relator são
  instantâneos); a latência percebida é inteiramente do provedor de IA configurado.
- Qualquer mudança nas regras de validação (ex.: nova categoria válida) exige
  atualização em `agent_qa.py`, não no prompt do Analista.

## Alternativas consideradas

**Salvar raw e corrigir depois:** gravar o JSON do Claude diretamente e fazer
correções on-the-fly nas queries. Descartado porque dado sujo no banco é difícil
de auditar, correções retroativas são propensas a inconsistências e o
`resumo_categorias` ficaria sempre potencialmente errado.
