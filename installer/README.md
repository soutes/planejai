# planejAÍ — Installer Windows

Empacota `apps/api` (Fastify) + `apps/web` (Next.js) num app Electron e gera `.msi` para distribuir no GitHub Releases.

---

## Stack

- **Electron 32** — shell desktop, spawna 2 processos Node child (api + web)
- **electron-builder** — gera `.msi` (e `.nsis` opcional)
- **Next standalone** — servidor Next self-contained (`output: 'standalone'`)
- **Prisma SQLite** — DB criado por cópia de `template.db` (pré-seedado no build)

---

## Layout pós-instalação

```
Program Files\planejAI\
├── planejAI.exe              ← electron shell
└── resources\
    ├── app.asar              ← main.js, package.json (electron)
    └── app\                  ← extraResources (api + web)
        ├── api\
        │   ├── dist\         ← Fastify compilado (tsc)
        │   ├── prisma\
        │   │   ├── schema.prisma
        │   │   ├── migrations\
        │   │   └── template.db   ← DB vazio pré-seedado
        │   └── node_modules\ ← deps prod + Prisma engine Windows
        └── web\
            ├── server.js     ← Next standalone entrypoint
            ├── .next\
            └── public\

%APPDATA%\planejAI\           ← dados do usuário (criado no 1º run)
├── planejAI.db               ← cópia de template.db; expande com uso
├── .secret                   ← AES-256 key (gera no 1º encrypt)
└── logs\
    ├── api.log
    └── web.log
```

---

## Build local

Pré-requisitos: Node 20+, npm 10+, Windows 10/11.

```powershell
# Da raiz do repo
cd installer
npm install
npm run dist            # gera dist\planejAI-Setup-2.0.0.msi
npm run dist:nsis       # opcional: .exe NSIS
```

O script `prebuild` (`scripts/build-all.mjs`) faz:
1. `npm install` em `apps/web` e `apps/api` se necessário
2. `next build` (standalone) → copia para `resources/app/web/`
3. `tsc` em `apps/api` → copia `dist/` + `prisma/` + `package.json`
4. `prisma migrate deploy` + `prisma db seed` num `template.db` temporário
5. `npm install --omit=dev` dentro de `resources/app/api/` (Prisma engine + deps prod)
6. Saneamento: remove `.env`, `.secret`, `data/` residuais

---

## O que NÃO entra no instalador

Garantido pelo filtro em `electron-builder.yml` + saneamento do build script:

- `**/.env*` — incluindo `apps/api/.env` com sua `ANTHROPIC_API_KEY`
- `**/data/**` — DBs do legado v1.0 (`gestao.db`, `faturas.db`, `acompanhamento.db`) e v2.0 (`planejAI.db`)
- `**/.secret` — chave AES local
- `**/*.bkp_*` — backups
- `**/dev.db*` — Prisma dev DBs
- `__tests__/`, `*.test.*`, `*.spec.*`
- `node_modules/.cache/`

O usuário final começa com **DB vazio** (só categorias/abas/cartão sentinela do seed) e **sem API key** — configura via tela `/gestao` na 1ª execução.

---

## Distribuição no GitHub Releases

```powershell
cd installer
npm run dist
gh release create v2.0.0 dist\planejAI-Setup-2.0.0.msi `
  --title "planejAÍ v2.0" `
  --notes-file ../docs/release/0_2_0_visual.md
```

**Aviso SmartScreen:** o `.msi` não está assinado. Na 1ª execução o Windows mostra:
> *Microsoft Defender SmartScreen impediu a inicialização...*

Solução para o user: clicar **Mais informações → Executar mesmo assim**. Esse warning some após a reputação acumular (ou imediatamente se você assinar com EV cert ~$300/ano).

---

## Adicionar ícone do app

1. Crie `build/icon.ico` (256×256, multi-resolução)
2. Descomente `icon: build/icon.ico` em `electron-builder.yml`
3. Re-rode `npm run dist`

---

## Debug

```powershell
# Roda Electron contra resources/ já buildado (sem empacotar MSI)
npm run prebuild
npm run start:dev
```

Logs runtime do user: `%APPDATA%\planejAI\logs\{api,web}.log`
