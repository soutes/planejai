# ADR-0014: Execução apenas local — sem deploy cloud

- **Status:** Accepted
- **Data:** 2026-05-19

## Contexto

O planejAÍ é ferramenta pessoal (single-user) com dados financeiros sensíveis. A pergunta de como distribuir o app tem implicações em: privacidade dos dados, infraestrutura necessária, custo operacional, e complexidade de setup.

O v1.0 rodava localmente via Streamlit (`streamlit run app.py`). O v2.0 tem dois serviços (`apps/api` e `apps/web`) — a forma de executar e distribuir precisa ser decidida.

## Decisão

Desenvolvimento: dois terminais locais (`apps/api` em `:3001`, `apps/web` em `:3000`). Sem servidor remoto, sem Vercel, sem banco de dados cloud. SQLite fica na máquina do usuário.

Distribuição futura (pós-MVP): Tauri shell que empacota `apps/web` como frontend e `apps/api` como sidecar Node.js. Gera instaladores nativos `.msi` (Windows), `.deb` (Linux), `.dmg` (macOS). Dados permanecem 100% locais.

## Consequências

**Positivas:**
- Dados financeiros nunca saem da máquina do usuário — privacidade máxima
- Sem custo de infraestrutura (Vercel, Neon, etc.)
- Sem necessidade de auth — não há multi-tenancy
- SQLite adequado para single-user sem overhead de servidor de banco

**Negativas:**
- Desenvolvimento requer dois terminais (até Tauri ser implementado)
- Sem acesso remoto / mobile ao app
- Backup dos dados é responsabilidade do usuário (arquivo SQLite)

**Neutras:**
- Tauri é pós-MVP — não bloqueia desenvolvimento da aplicação

## Alternativas consideradas

- **Vercel (frontend) + Railway (API)** — dados sensíveis em servidor remoto, custo mensal, necessidade de auth, SQLite incompatível com Vercel filesystem efêmero
- **Self-hosted VPS** — overhead de manutenção de servidor, custo, ainda exige auth
- **Electron** — bundle Chromium embutido (~200MB extra); Tauri é alternativa mais leve com webview nativo do SO
- **Executável PyInstaller (legado)** — bundle 500MB+, frágil, sem auto-update; TypeScript + Tauri é superior
