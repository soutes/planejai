import { execSync } from 'child_process'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'
import { buildApp } from './app.js'
import { backupDatabase } from './shared/backup.js'
import { getDataDir, getDatabaseFile } from './shared/paths.js'

const PORT = Number(process.env.PORT ?? 3001)

// Backup só se há migration pendente (migrate status sai != 0).
// Em estado normal sai 0 → sem backup → sem spam no dev watch.
function hasPendingMigrations(): boolean {
  try {
    execSync('prisma migrate status', { stdio: 'ignore' })
    return false
  } catch {
    return true
  }
}

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

void (async () => {
  if (process.env.SKIP_BACKUP !== 'true' && existsSync(getDatabaseFile()) && hasPendingMigrations()) {
    backupDatabase()
  }
  ensureDatabase()
  const app = await buildApp()
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`planejAÍ API v2 running on http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
})()
