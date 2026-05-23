# ADR-0003: Seleção de provedor de IA pelo usuário

- **Status:** Accepted
- **Data:** 2026-05-15

## Contexto

O app usa IA para analisar faturas de cartão e extrair dados estruturados de OCR.
A decisão inicial fixava o Claude CLI como único provedor. Com múltiplos modelos
de qualidade equivalente disponíveis no mercado — e preferências pessoais que mudam
com tempo ou custo —, fixar um único provedor no código cria atrito desnecessário
e impede o usuário de aproveitar o modelo que já tem conta ativa ou considera
melhor no momento.

## Decisão

O usuário escolhe o provedor de IA diretamente na interface do app. Provedores
suportados:

| Provedor | Integração | Auth |
|----------|-----------|------|
| **Claude — Anthropic** | Anthropic API (`anthropic` SDK) | API key |
| **Claude — OpenClaude CLI** | Claude CLI (`openclaude`) via subprocess | Token local (sessão CLI) |
| **OpenAI** | OpenAI API (`openai` SDK) | API key |
| **Gemini — Google** | Google AI API (`google-generativeai` SDK) | API key |

As credenciais são armazenadas criptografadas (Fernet) na tabela `config_ia` de `gestao.db`, com chave em `data/.key` (fora do repositório). O módulo `src/config_ia.py` expõe `save_config_ia()` e `load_config_ia()` para persistência.

O app mantém a configuração de provedor ativo em `st.session_state` e persiste
a escolha nas settings do app. Todos os provedores recebem o mesmo system prompt
(`prompts/system_prompt.md`) e devolvem JSON no mesmo schema — o pipeline
QA → Relator (ADR-0007) é agnóstico ao provedor.

## Consequências

- Cada provedor tem seu próprio mecanismo de autenticação: o app precisa de uma tela
  de configuração para armazenar API keys (de forma segura, fora do repositório).
- O comportamento do JSON retornado pode variar por provedor; o agente QA absorve
  inconsistências suaves, mas prompts podem precisar de ajuste fino por modelo.
- Claude via CLI mantém latência de startup de ~1–3s; provedores via API HTTP têm
  latência de rede mas sem overhead de subprocesso.
- OpenRouter funciona como meta-provedor: permite testar modelos alternativos
  (Mistral, LLaMA, etc.) com uma única API key, sem integração adicional.
- A abstração de provedor deve ser um módulo isolado (`src/agent.py`) com interface
  uniforme — `call_ai(user_msg, model) -> str` — para que o pipeline nunca conheça
  o provedor em uso.

## Alternativas consideradas

**Fixar Claude CLI como único provedor (decisão original):** zero complexidade de
abstração, autenticação automática via sessão existente. Descartado porque impede
o usuário de usar provedores alternativos quando o Claude CLI não está disponível
ou quando outro modelo oferece melhor custo-benefício.

**Suportar apenas provedores com API compatível com OpenAI:** simplificaria a
integração (um único SDK para OpenAI, Copilot e OpenRouter). Descartado porque
excluiria Claude e Gemini, que têm SDKs próprios e são opções relevantes para o
usuário.
