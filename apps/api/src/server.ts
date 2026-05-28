import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'
import { buildApp } from './app.js'
import { getDataDir, getDatabaseFile } from './shared/paths.js'

const PORT = Number(process.env.PORT ?? 3001)

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
