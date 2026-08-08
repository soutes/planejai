# planejAÍ v2.0 — Slide Deck para Divulgação

---

## Slide 1 / 4 — Abertura

**planejAÍ v2.0 — Sua vida financeira, de verdade.**

> Uma interface moderna, segura e rápida para quem quer controle real do dinheiro — sem depender da nuvem, sem complicação.

- Totalmente reconstruído em TypeScript + Electron
- Roda 100% local no seu PC — seus dados nunca saem da sua máquina
- Interface redesignada com design system próprio (tokens, tipografia, ícones)

**Visual sugerido:** Screenshot em destaque do dashboard v2.0 comKPIs e gráficos de evolução patrimonial. Tela escura (dark mode) com acentos em verde `#10F5A3` e roxo `#B07AFF`.

---

## Slide 2 / 4 — O que mudou

**Do Python ao Electron — uma base que cresce com você.**

| Antes (v1) | Agora (v2) |
|---|---|
| Streamlit (web local) | Electron desktop nativo |
| 3 bancos SQLite separados | 1 banco unificado via Prisma |
| IA仅限 Anthropic CLI | Multi-provider: Anthropic, OpenAI, Gemini, Groq, Mistral, Together |
| Backup manual | Backup automático com validação + sidecars |
| Sem validação de migration | Startup seguro: checksum, rollback, bloqueio de legado |
| Alert nativo | Componentes UI próprios (Modal, DataTable, KPIs) |

**Visual sugerido:** Split screen — lado esquerdo com screenshot antigo do Streamlit, lado direito com a tela equivalente no v2. Comparação visual direta.

---

## Slide 3 / 4 — Funcionalidades que fazem diferença

**Controle que você sente no dia a dia.**

- **Dashboard inteligente** — visão por pessoa, familiar ou global. KPIs, orçamentos vs realizado, evolução de 12 meses
- **Forma de pagamento por pessoa** — cada membro organiza suas despesas do jeito dele
- **AcertAÍ automático** — saldo entre pessoas calculado em tempo real, com proteção contra saldo negativo
- **Ciclo de cartão** — snapshot por ciclo (não por mês calendário), com dedup e absorção de centavos
- **Exportação de faturas** — CSV, relatório executivo via IA, com IDs preservados no resync
- **Relatórios com IA** — geração de relatório executivo a partir dos dados, com provider configurável

**Visual sugerido:** Grid 2x3 com ícones grandes + 1 linha descritiva por feature. Fundo neutro com cards elevados.

---

## Slide 4 / 4 — Fechamento

**Segurança que você não precisa pensar — mas pode confiar.**

- Backup validado com `.secret` e sidecars antes de qualquer migration
- Lock contra execução concorrente de backup/migration
- Erros genéricos expostos ao cliente (stack fica no log)
- Remoção de `dangerouslySetInnerHTML` em todo o frontend
- Versão alinhada: 2.0.0

**Como baixar:**
```
https://github.com/soutes/planejai/releases
```

> Seus dados ficam onde sempre estiveram: no seu PC. A diferença é que agora o app cresce junto com você.

**Visual sugerido:** Ícone do app + QR code para o link de download + selo "v2.0.0". Fundo escuro com gradiente verde-para-roxo.

---

*Gerado para planejAÍ v2.0 — Agosto 2026*
