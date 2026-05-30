import { execSync } from 'child_process'
import { backupDatabase } from '../src/shared/backup.js'

const isDev = process.argv.includes('--dev')
const cmd = isDev ? 'prisma migrate dev' : 'prisma migrate deploy'

const backupPath = backupDatabase()

try {
  execSync(cmd, { stdio: 'inherit' })
} catch {
  if (backupPath) console.error(`Backup disponível em: ${backupPath}`)
  process.exit(1)
}
