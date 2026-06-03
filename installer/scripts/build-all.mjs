#!/usr/bin/env node
// Builda apps/web (Next standalone) + apps/api (tsc) e monta installer/resources/app/.
// Também gera template.db pré-seedado (categorias, abas, cartão sentinela).

import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync, writeFileSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..', '..')
const installerDir = resolve(__dirname, '..')
const webDir = join(repoRoot, 'apps', 'web')
const apiDir = join(repoRoot, 'apps', 'api')
const resDir = join(installerDir, 'resources', 'app')
const resWeb = join(resDir, 'web')
const resApi = join(resDir, 'api')

function sh(cmd, cwd) {
  console.log(`\n$ (${cwd}) ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit', shell: true })
}

function step(name, fn) {
  console.log(`\n━━━ ${name} ━━━`)
  fn()
}

step('Limpa resources/', () => {
  if (existsSync(resDir)) rmSync(resDir, { recursive: true, force: true })
  mkdirSync(resWeb, { recursive: true })
  mkdirSync(resApi, { recursive: true })
})

step('Build apps/web (Next standalone)', () => {
  if (!existsSync(join(webDir, 'node_modules'))) {
    sh('npm install --no-audit --no-fund', webDir)
  }
  sh('npm run build', webDir)
})

step('Copia .next/standalone → resources/app/web', () => {
  const standalone = join(webDir, '.next', 'standalone')
  if (!existsSync(standalone)) {
    throw new Error('Next standalone build não encontrado. Verifique output: standalone em next.config.ts')
  }

  // Next monorepo às vezes gera standalone/apps/web/server.js. Detecta layout.
  const flatServer = join(standalone, 'server.js')
  const nestedServer = join(standalone, 'apps', 'web', 'server.js')
  let source = standalone
  if (!existsSync(flatServer) && existsSync(nestedServer)) {
    source = join(standalone, 'apps', 'web')
    console.log(`  ↳ layout nested detectado, copiando de ${source}`)
    cpSync(source, resWeb, { recursive: true })
    // node_modules ficou em standalone/node_modules na raiz, copia também
    const nestedNm = join(standalone, 'node_modules')
    if (existsSync(nestedNm)) {
      cpSync(nestedNm, join(resWeb, 'node_modules'), { recursive: true })
    }
  } else {
    cpSync(standalone, resWeb, { recursive: true })
  }

  cpSync(join(webDir, '.next', 'static'), join(resWeb, '.next', 'static'), { recursive: true })
  if (existsSync(join(webDir, 'public'))) {
    cpSync(join(webDir, 'public'), join(resWeb, 'public'), { recursive: true })
  }

  if (!existsSync(join(resWeb, 'server.js'))) {
    throw new Error(`server.js não foi copiado pra ${resWeb}. Verifique estrutura de .next/standalone`)
  }
})

step('Build apps/api (tsc emit)', () => {
  if (!existsSync(join(apiDir, 'node_modules'))) {
    sh('npm install --no-audit --no-fund', apiDir)
  }
  sh('npx prisma generate', apiDir)
  if (existsSync(join(apiDir, 'dist'))) rmSync(join(apiDir, 'dist'), { recursive: true, force: true })
  sh('npx tsc -p tsconfig.json', apiDir)

  // tsc só compila .ts → copia assets .md (prompts IA) mantendo estrutura src/→dist/
  // statSync detecta dir vs file (cpSync com filter precisa distinguir)
  cpSync(join(apiDir, 'src'), join(apiDir, 'dist'), {
    recursive: true,
    filter: (src) => {
      try {
        const stat = statSync(src)
        if (stat.isDirectory()) return true
        return src.toLowerCase().endsWith('.md')
      } catch { return false }
    },
  })
})

step('Gera template.db (migrate + seed)', () => {
  const tmpDb = join(apiDir, 'prisma', 'template.db')
  if (existsSync(tmpDb)) rmSync(tmpDb, { force: true })
  // SQLite url é relativa ao schema.prisma (apps/api/prisma/), não ao cwd
  const envObj = { ...process.env, DATABASE_URL: 'file:./template.db' }
  execSync('npx prisma migrate deploy', { cwd: apiDir, stdio: 'inherit', env: envObj, shell: true })
  execSync('npx tsx prisma/seed.ts', { cwd: apiDir, stdio: 'inherit', env: envObj, shell: true })
  if (!existsSync(tmpDb)) throw new Error('template.db não foi gerado')
})

step('Copia api → resources/app/api', () => {
  mkdirSync(resApi, { recursive: true })
  cpSync(join(apiDir, 'dist'), join(resApi, 'dist'), { recursive: true })
  cpSync(join(apiDir, 'prisma'), join(resApi, 'prisma'), {
    recursive: true,
    filter: (src) => {
      const lower = src.toLowerCase()
      if (lower.endsWith('dev.db') || lower.endsWith('dev.db-journal')) return false
      return true
    },
  })
  copyFileSync(join(apiDir, 'package.json'), join(resApi, 'package.json'))
})

step('npm install --omit=dev em resources/app/api', () => {
  sh('npm install --omit=dev --ignore-scripts --no-audit --no-fund', resApi)
  // Prisma generate na cópia de produção (gera client + engines)
  sh('npx prisma generate', resApi)
})

step('Saneamento final', () => {
  const banidos = ['.env', '.env.local', '.env.production', '.secret']
  for (const f of banidos) {
    const p = join(resApi, f)
    if (existsSync(p)) {
      console.warn(`⚠  removendo arquivo sensível encontrado: ${p}`)
      rmSync(p, { force: true })
    }
  }
  const dataDir = join(resApi, 'data')
  if (existsSync(dataDir)) {
    console.warn(`⚠  removendo data/ residual: ${dataDir}`)
    rmSync(dataDir, { recursive: true, force: true })
  }
  // Stub package.json mínimo na raiz de resources/app (electron-builder convenience)
  writeFileSync(join(resDir, 'package.json'), JSON.stringify({
    name: 'planejai-runtime',
    version: '2.0.0',
    private: true,
  }, null, 2))
})

console.log('\n✓ Build pronto. Próximo: npm run build:win (gera .msi)')
