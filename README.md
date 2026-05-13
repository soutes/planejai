# planejAÍ

> **planej + AÍ** → "planeje aí" (coloquial brasileiro: *planeje agora*)
> **planej + AI** → inteligência artificial (o app usa IA para analisar faturas de cartão)

App de planejamento financeiro pessoal **desktop-first**, construído em Python + Streamlit. Roda como app nativo no Windows (sem barra de URL, sem abas de browser) via launcher VBS que abre Edge/Chrome em modo `--app`.

---

## Funcionalidades

### 🏠 Visão Geral
- Saldo do mês (receitas − despesas) com indicador positivo/negativo
- KPIs consolidados: total de rendimentos, total de despesas, patrimônio investido
- Resumo de divisão de despesas por pessoa (abas familiares)
- Próximos vencimentos de despesas fixas
- Gráfico de despesas por categoria

### 💰 Rendimentos
- Lançamento de receitas por categoria (Salário, Aluguel, Freelas, Dividendos, Outros)
- Edição e exclusão inline por lançamento
- Recorrência automática: propaga o rendimento para N meses futuros
- Gráficos: donut por categoria + histórico mensal 12 meses
- KPIs: total do mês, maior fonte, variação vs. mês anterior

### 📅 Despesas
- Abas de despesa configuráveis (ex.: Pessoal, Familiar) com membros por aba
- **Split automático**: lançar despesa na aba Familiar divide o valor entre os membros, cria entradas de divisão por pessoa e lança a cota do usuário automaticamente na aba Pessoal
- Parcelamento: distribui o valor em N meses consecutivos
- Recorrência: propaga a despesa para meses futuros
- Orçamentos por categoria com barras de progresso e glow de alerta
- Visão anual: tabela e gráfico empilhado 12 meses × categorias
- Badges de tipo: `parcelado`, `recorrente`, `split_auto`

### 💳 Cartão de Crédito
- Análise de faturas PDF por IA (Claude) — categorização automática de todas as transações
- Detecção de alertas: gastos atípicos, duplicidades, recorrências novas, parcelamentos longos
- Acompanhamento do mês em aberto: pace atual vs. limite, forecast de fechamento, allowance diário
- Upload de prints do app do banco (OCR) para atualização de snapshot parcial
- Suporte a múltiplos cartões com chips de seleção, cor por banco, limite individual
- Histórico completo de faturas com comparativo entre meses
- Gráficos de tendência: evolução mensal, composição por categoria, stacked bar

### 📈 Investimentos
- Snapshot mensal de patrimônio por categoria (Renda Fixa, Tesouro Direto, Ações BR, BDR/ETF Internacional, FIIs, Criptomoedas, Previdência, CDB/LCI/LCA, Outros)
- Registro de aporte do mês por categoria
- Histórico imutável: edição liberada apenas para o mês atual
- KPIs: patrimônio total, variação vs. mês anterior, maior posição
- Gráficos: donut de distribuição + linha/barra de evolução histórica

---

## Arquitetura

```
planejai/
├── app.py                          # Entry point: sidebar, navegação, Visão Geral, Configurações
├── planejai.vbs                    # Launcher Windows — abre como app nativo (sem URL bar)
├── requirements.txt
├── .mcp_empty.json                 # Config MCP (Claude CLI)
├── prompts/
│   └── system_prompt.md            # System prompt do agente de análise de faturas
├── src/
│   ├── page_cartao.py              # Página Cartão de Crédito (Analista de Faturas integrado)
│   ├── page_rendimentos.py         # Página Rendimentos
│   ├── page_despesas.py            # Página Despesas (split, orçamentos, visão anual)
│   ├── page_investimentos.py       # Página Investimentos (snapshots mensais)
│   ├── database_gestao.py          # gestao.db — dados principais (despesas, rendimentos, investimentos)
│   ├── database.py                 # faturas.db — cartões, faturas, transações
│   ├── database_acompanhamento.py  # acompanhamento.db — snapshots do mês corrente
│   ├── agent.py                    # Integração Claude CLI (subprocess)
│   ├── charts.py                   # Gráficos Plotly reutilizáveis
│   ├── image_extractor.py          # OCR de prints via pytesseract
│   ├── metrics_acompanhamento.py   # Pace, forecast, allowance diário
│   ├── pdf_extractor.py            # Extração de texto de PDF via pdfplumber
│   └── ui.py                       # Componentes CSS e helpers visuais
└── data/                           # Criado automaticamente; ignorado pelo git
    ├── gestao.db
    ├── faturas.db
    ├── acompanhamento.db
    ├── agent.log
    └── pdfs/
```

### Bancos de dados

| Arquivo | Conteúdo |
|---|---|
| `gestao.db` | Pessoas, abas de despesa, categorias, despesas, splits, rendimentos, investimentos, orçamentos |
| `faturas.db` | Cartões, faturas analisadas, transações categorizadas, regras de categorização |
| `acompanhamento.db` | Snapshots do mês em aberto (OCR + manual) |

---

## Instalação

**Pré-requisitos:** Python 3.10+, Git

1. Clone o repositório:

   ```bash
   git clone https://github.com/soutes/planejai.git
   cd planejai
   ```

2. Crie e ative o ambiente virtual:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```

4. *(Opcional)* Para análise de faturas por IA, instale o **Claude CLI**:

   ```bash
   npm install -g @anthropic-ai/claude-code
   claude login
   ```

5. *(Opcional)* Para OCR de prints de extrato, instale o **Tesseract**:

   - Windows: [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki) — adicione ao PATH
   - O app funciona normalmente sem OCR (basta não usar upload de prints)

---

## Uso

### Opção A — launcher nativo (recomendado no Windows)

Duplo clique em `planejai.vbs`.

Isso sobe o Streamlit em background e abre o app em Edge/Chrome no modo `--app` (sem barra de URL, sem abas). Ao fechar a janela, o processo Streamlit é encerrado automaticamente.

### Opção B — linha de comando

```bash
streamlit run app.py
```

Acesse em `http://localhost:8501`.

---

## Configurações

Acesse o menu **Configurações** na sidebar para:

- **Pessoas**: cadastrar os membros da família/casa
- **Abas de Despesa**: criar abas (ex.: Pessoal, Familiar) e associar membros a cada aba
- **Categorias**: personalizar categorias de despesa por aba
- **Cartões**: adicionar/editar/remover cartões de crédito (nome, banco, final, limite, cor, proprietário)
- **Ciclo**: ajustar limite global e dia de fechamento para o acompanhamento do mês em aberto

---

## Privacidade

Todos os dados ficam em `data/` na sua máquina — SQLite local, nenhum dado enviado a servidores externos. O único tráfego externo é a chamada ao Claude CLI para análise de faturas (opcional).

`data/` está no `.gitignore` — bancos, PDFs e logs não entram no repositório.

---

## Stack

| Camada | Tecnologia |
|---|---|
| UI | [Streamlit](https://streamlit.io) 1.32+ |
| Gráficos | [Plotly](https://plotly.com/python/) 5.20+ |
| Dados | SQLite 3 (via `sqlite3` stdlib) + [pandas](https://pandas.pydata.org/) |
| PDF | [pdfplumber](https://github.com/jsvine/pdfplumber) |
| OCR | [pytesseract](https://github.com/madmaze/pytesseract) + Tesseract |
| IA | [Claude CLI](https://github.com/anthropics/claude-code) (subprocess) |
| Launcher | VBScript (Windows nativo) |
