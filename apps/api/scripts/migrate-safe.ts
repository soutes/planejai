import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { backupDatabase, withDatabaseOperationLock } from '../src/shared/backup.js'
import { getDatabaseFile } from '../src/shared/paths.js'

const isDev = process.argv.includes('--dev')
const cmd = isDev ? 'prisma migrate dev' : 'prisma migrate deploy'

function databaseUrlFromDotEnv(): string | undefined {
  const envPath = join(process.cwd(), '.env')
  try {
    const line = readFileSync(envPath, 'utf8').split(/\r?\n/).find((value) => value.startsWith('DATABASE_URL='))
    return line?.slice('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '')
  } catch {
    return undefined
  }
}

async function main(): Promise<void> {
  try {
    await withDatabaseOperationLock(async () => {
      const configuredUrl = process.env.DATABASE_URL ?? databaseUrlFromDotEnv()
      const expectedUrl = `file:${getDatabaseFile()}`
      if (configuredUrl && configuredUrl !== expectedUrl) {
        throw new Error(`DATABASE_URL diverge do PLANEJAI_DATA_DIR: ${configuredUrl} != ${expectedUrl}`)
      }
      const backupPath = backupDatabase()
      try {
        execSync(cmd, { stdio: 'inherit', env: { ...process.env, DATABASE_URL: expectedUrl } })
      } catch {
        if (backupPath) console.error(`Backup disponível em: ${backupPath}`)
        throw new Error('Migration falhou; restaure o backup antes de tentar novamente')
      }
    })
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

void main()
