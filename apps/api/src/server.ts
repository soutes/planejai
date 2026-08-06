import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'
import { buildApp } from './app.js'
import { backupDatabase, withDatabaseOperationLock } from './shared/backup.js'
import { runMigrations, hasPendingMigrations } from './shared/migrate.js'
import { getDataDir, getDatabaseFile } from './shared/paths.js'

const PORT = Number(process.env.PORT ?? 3001)
// App single-user sem autenticação (ADR-0004): o socket precisa ser local.
// Expor em 0.0.0.0 entrega CRUD do financeiro e a chave de IA a qualquer
// máquina da mesma rede. Só sai do loopback com HOST explícito.
const HOST = process.env.HOST ?? '127.0.0.1'

function ensureDatabase() {
  const target = getDatabaseFile()
  if (existsSync(target)) return

  const templateEnv = process.env.PLANEJAI_DB_TEMPLATE
  const candidates = [
    templateEnv,
    join(process.cwd(), 'prisma', 'template.db'),
    join(__dirname, '..', 'prisma', 'template.db'),
  ].filter(Boolean) as string[]

  for (const src of candidates) {
    if (existsSync(src)) {
      getDataDir()
      copyFileSync(src, target)
      console.log(`planejAÍ DB inicializado em ${target} (template: ${src})`)
      return
    }
  }

  console.warn(`Template DB não encontrado. Prisma criará tabelas vazias em ${target} no primeiro acesso.`)
}

async function migrateDatabase(): Promise<void> {
  await withDatabaseOperationLock(async () => {
    if (!(await hasPendingMigrations())) return
    if (process.env.SKIP_BACKUP !== 'true') backupDatabase()
    const applied = await runMigrations()
    console.log(`[migrate] ${applied.length} migration(s) aplicada(s): ${applied.join(', ')}`)
  })
}

void (async () => {
  ensureDatabase()
  try {
    await migrateDatabase()
  } catch (err) {
    console.error('[migrate] falha crítica: startup abortado. Verifique o backup e faça rollback antes de tentar novamente.', err)
    process.exit(1)
  }

  const app = await buildApp()
  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`planejAÍ API v2 running on http://${HOST}:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
})()
