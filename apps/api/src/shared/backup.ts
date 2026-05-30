import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getDataDir, getDatabaseFile } from './paths.js'

export function backupDatabase(): string | null {
  const src = getDatabaseFile()
  if (!existsSync(src)) return null

  const ts = new Date()
    .toISOString()
    .replace('T', '_')
    .replace(/:/g, '')
    .slice(0, 17)
  const dest = join(getDataDir(), `planejAI.db.bak-${ts}`)

  copyFileSync(src, dest)
  console.log(`[backup] DB salvo em ${dest}`)
  return dest
}
