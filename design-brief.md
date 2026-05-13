# planejAÍ — Design Brief

## O Produto

**planejAÍ** é um app de planejamento financeiro pessoal desktop-first (Windows), construído em Python + Streamlit. Roda como app nativo (sem barra de URL, sem abas de browser) via launcher VBS que abre Edge/Chrome em modo `--app`.

O nome tem dupla leitura intencional:
- **planej + AÍ** → "planeje aí" (português coloquial: "planeje agora")
- **planej + AI** → inteligência artificial (o app usa IA para analisar faturas)

Esse duplo sentido é o coração da marca. O design deve torná-lo óbvio sem explicar.

---

## Sistema Visual Atual (UI do app)

O app já tem tema dark neon implementado. O logo precisa ser compatível com essa linguagem.

### Paleta
| Role | Hex | Uso |
|---|---|---|
| Canvas | `#0B0E13` | Fundo principal |
| Card | `#10141C` | Cards, painéis |
| Border | `#1F2530` | Bordas, divisores |
| Accent verde | `#10F5A3` | CTA primário, destaques, saldo positivo |
| Accent roxo | `#B07AFF` | Categorias, gráficos secundários |
| Accent azul | `#6FA9D6` | Abas familiares, info |
| Danger | `#FF6B7A` | Saldo negativo, alertas |
| Text primary | `#E8ECF2` | Títulos, valores |
| Text muted | `#8B92A0` | Labels, subtítulos |
| Text dim | `#4E5768` | Captions, metadados |

### Tipo (UI)
- Interface usa fonte system-stack (Streamlit default)
- Números financeiros: tabular, peso 700-800
- Labels: 10-11px uppercase com letter-spacing

### Componentes visuais de referência
- Cards com `border-radius: 14px`, borda `1px solid #1F2530`
- Glow cards: `box-shadow: 0 0 24px rgba(16,245,163,0.12)` + borda `rgba(16,245,163,0.25)`
- Barras de progresso com glow colorido (`box-shadow: 0 0 6px {cor}55`)
- KPI cards com `border-top: 3px solid {cor-accent}`

---

## Referência de Sistema de Design — Binance (adaptado)

O sistema segue a lógica da Binance, **trocando Binance Yellow (`#FCD535`) por Accent Turquoise (`#2dbdb6`)**.

### Princípios herdados da Binance
- **Uma cor de marca**. O `#2dbdb6` faz todo o trabalho de branding — CTA primário, wordmark accent, badges. Nenhuma segunda cor de marca.
- **Canvas near-black** (`#0b0e11`) como chão. Nunca preto puro.
- **Tipo pesado em display** — peso 700 mínimo em headlines. Trading platforms precisam que números sejam lidos em fração de segundo.
- **Flat surfaces, sem gradientes atmosféricos** (sem aurora, mesh, glow no logo — a UI já tem glow; o logo deve ser mais limpo).
- **Elevação por contraste de cor**, não por sombra.

### Tokens adaptados para o logo
| Token | Hex | Papel |
|---|---|---|
| `accent-primary` | `#2dbdb6` | Cor de marca. Único accent do logo. |
| `accent-active` | `#27a8a2` | Hover/pressed state |
| `canvas-dark` | `#0b0e11` | Background da versão dark |
| `canvas-light` | `#ffffff` | Background da versão light |
| `body-dark` | `#eaecef` | Texto em canvas dark |
| `ink` | `#181a20` | Texto em canvas light |

---

## Logo — Especificação

### Nome e casing — não negociável
```
planejAÍ
```
- `planej` → lowercase
- `AÍ` → uppercase, visualmente distinto (cor + opcionalmente peso)
- Acento no Í é obrigatório — faz parte da pronúncia e da identidade brasileira do produto

### Tratamento do wordmark
- **`planej`** → `#eaecef` (body-dark) em canvas dark / `#181a20` em canvas light
- **`AÍ`** → `#2dbdb6` (accent-primary), mesmo weight ou +100 de peso
- Nenhuma mudança de font-family entre as duas partes
- Tracking: tight (-0.02em a 0em). Não expandir.

### Tipografia
Peso mínimo: **700**. Candidatos recomendados (livre):
1. **Plus Jakarta Sans Bold/ExtraBold** — geométrico humanista, leitura excelente em dark
2. **Space Grotesk Bold** — ligeiramente técnico, bom para fintech
3. **DM Sans Bold** — mais neutro, leitura limpa
4. **Sora Bold** — arredondado mas assertivo

Evitar: slab serif, condensed grotesque, qualquer coisa que lembre banco tradicional, fontes thin/light.

### Marca/Símbolo (opcional mas desejável)
Companion mark para uso em favicon 32×32 e ícone de app.

**O que funciona:**
- Abstração geométrica que sugere **trajetória** (linha/seta apontando para cima-direita), **grid/plano** (planejamento), ou **diálogo** (bubble = IA conversacional)
- Máximo 2 paths
- Deve funcionar como favicon monocromático 16px

**O que não funciona:**
- Gráfico de pizza / linha de mercado / moeda / cofre → overdone em fintech
- Rosto de robô / ícone de IA genérico
- Qualquer coisa com mais de 3 elementos visuais

### Variações necessárias
| Variação | Background | Uso |
|---|---|---|
| Primary | `#0b0e11` (dark) | App, splash, materiais principais |
| Reversed | `#ffffff` (light) | Documentos, apresentações |
| Monochrome dark | `#0b0e11` + branco | Impressão, embossing |
| Monochrome light | `#ffffff` + preto | Impressão negativa |
| Icon only | Transparente | Favicon, app icon |

### Formatos de entrega
- SVG (principal — web-friendly, escalável)
- PNG 512×512 (icon variant)
- PNG 1200×400 (wordmark horizontal, dark bg)
- PNG 1200×400 (wordmark horizontal, light bg)

---

## Do

- Logo em canvas dark como entrega principal
- `AÍ` em `#2dbdb6` — o accent deve saltar, não sussurrar
- Wordmark legível a partir de 120px de largura
- Companion mark legível a 32×32px
- Um lockup horizontal (não precisa de versão empilhada no MVP)
- SVG com texto convertido em path (sem dependência de font embed)

## Don't

- Sem gradiente nas letras (flat color only)
- Sem drop shadow ou glow no logo — a UI já tem; o logo é o elemento mais limpo
- Não separar `planej` e `AÍ` em linhas diferentes no lockup principal
- Não usar mais de 2 cores no logo (branco/dark + `#2dbdb6`)
- Não usar ícone de gráfico financeiro — clichê
- Não usar peso display < 700 em nenhuma parte do wordmark
- Não alterar o acento do Í — é parte da identidade

---

## Mood / Referências visuais

**Nubank wordmark** — confiança sem soar como banco tradicional, tipo assertivo, cor única que carrega toda a identidade.

**Binance wordmark** — mesma lógica: peso 700+, um só accent, canvas dark, zero ornamentação.

**Linear logo** — geométrico limpo, companion mark simples que escala bem.

O planejAÍ está nessa interseção: **fintech brasileiro, IA-nativo, planejamento de vida** — não trading, não banco, não startup genérica.

---

## Contexto de uso principal

O logo aparece em:
1. Sidebar do app (20px height, sobre canvas `#070B13`)
2. Splash/loading inicial
3. Tab do browser (favicon — só o icon mark)
4. Futuramente: landing page, README do GitHub

A sidebar tem espaço de `~180px de largura × 24px de altura` para o wordmark. O companion mark sozinho fica no favicon (16-32px).
