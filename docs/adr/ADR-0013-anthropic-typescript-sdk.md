# ADR-0013: Anthropic TypeScript SDK (reescrita dos agentes Python)

- **Status:** Accepted
- **Data:** 2026-05-19
- **Supersede:** ADR-0003 (provedor de IA via subprocess), ADR-0007 (pipeline Python QA/Relator)

## Contexto

O v1.0 usava Claude CLI (subprocess `openclaude`) para processar faturas. Essa abordagem tinha problemas: dependência de CLI instalada globalmente, comunicação via stdout/stderr frágil, impossibilidade de controle fino de retry, caching e timeouts, e dificuldade de integrar com o novo backend TypeScript.

A reescrita para TypeScript permite usar o Anthropic TypeScript SDK diretamente — chamadas HTTP controladas, tipos gerados, prompt caching nativo, e sem dependência de binário externo.

O SDK TypeScript suporta `claude-sonnet-4-6` com visão (PDFs e imagens), que é o mesmo modelo usado no legado.

## Decisão

`@anthropic-ai/sdk` instalado em `apps/api`. Wrapper em `modules/intelligence/infra/anthropic.ts` expõe método tipado para chamadas com e sem visão. **Prompt caching obrigatório** em todas as chamadas — `cache_control: { type: 'ephemeral' }` no system prompt. System prompts armazenados em arquivos `.md` separados em `domain/prompts/` — editáveis sem recompilação. Modelo padrão: `claude-sonnet-4-6`.

A lógica de QA (validação do JSON extraído) é reimplementada como `ValidateFaturaUseCase` no domínio — sem chamar IA novamente, apenas validação estrutural e correção de tipos.

## Consequências

**Positivas:**
- Sem dependência de CLI instalada no sistema do usuário
- Chamadas HTTP diretas com retry, timeout e error handling nativos
- Prompt caching reduz custo e latência em chamadas repetidas com mesmo system prompt
- System prompts em `.md` separados — editáveis pelo dev sem recompilar
- Tipos TypeScript gerados pelo SDK — sem parsing manual de stdout

**Negativas:**
- Requer `ANTHROPIC_API_KEY` sempre configurada (v1.0 suportava outros provedores via CLI)
- Suporte a outros provedores (OpenAI, Gemini) removido — era feature do v1.0
- PDFs grandes podem exceder o context window — necessário chunking em v3

**Neutras:**
- Sem streaming no MVP — response completo antes de salvar no banco

## Alternativas consideradas

- **Manter subprocess Python** — exigiria manter runtime Python separado, dois runtimes no projeto v2.0
- **OpenAI SDK** — GPT-4o suporta visão mas o projeto já usa Claude; trocar de provedor sem razão técnica seria regressão
- **LangChain TypeScript** — abstração desnecessária para dois use cases simples (analyze + report)
- **AI SDK (Vercel)** — agnóstico de provedor mas adiciona camada extra; projeto não tem requisito de troca de provedor no MVP v2.0
