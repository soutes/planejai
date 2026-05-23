# ADR-0010: Next.js 15 App Router no frontend

- **Status:** Accepted
- **Data:** 2026-05-19
- **Decisores:** dev

## Contexto

O frontend v1.0 era Streamlit — framework Python de script que não permite componentes React customizados, layouts complexos, ou controle fino de UX. As limitações de UX do Streamlit foram o principal motivador da reescrita.

O frontend v2.0 precisa de: páginas de listagem com filtros, formulários de CRUD, gráficos interativos, upload de arquivos (PDF/imagem para análise de fatura), e uma área de relatório estilo chat com IA.

O projeto roda localmente — sem requisitos de SEO ou SSR para crawlers.

## Decisão

Next.js 15 App Router + TypeScript. Server Components por padrão para páginas de listagem e visualização (fetch direto no servidor, sem JS desnecessário no cliente). `'use client'` apenas em componentes interativos: formulários, modais, gráficos (Recharts), upload de arquivo. TanStack Query apenas para mutations e leituras que dependem de estado client-side. Sem Zustand — app single-user sem estado global complexo.

## Consequências

**Positivas:**
- Server Components eliminam JS de cliente em páginas read-only (dashboard, listagens)
- App Router com layouts/loading states nativos
- `next/image` para otimização automática de imagens
- Rotas em português (`/despesas`, `/cartao`, `/gestao`) — legíveis e consistentes
- TypeScript end-to-end com inferência dos tipos da API

**Negativas:**
- App Router tem curva de aprendizado maior que Pages Router
- Distinção Server/Client Component exige atenção em cada arquivo
- `NEXT_PUBLIC_API_BASE_URL` precisa estar correto por ambiente

**Neutras:**
- TanStack Query mínimo — só mutations e leituras client-side; listagens são Server Components

## Alternativas consideradas

- **Next.js 15 Pages Router** — não aproveita Server Components, padrão mais antigo
- **Remix** — filosofia similar mas sem integração nativa com Tauri desktop futuro
- **Vite + React SPA** — sem Server Components, perda de performance em listagens; mais simples mas menos alinhado com padrões 2026
- **Electron + React** — bundle Chromium enorme (~200MB extra); Tauri é alternativa mais leve para desktop futuro
