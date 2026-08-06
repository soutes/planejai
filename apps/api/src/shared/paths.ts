import { mkdirSync } from 'fs'
import { isAbsolute, join, resolve } from 'path'

let cachedDataDir: string | null = null

export function getDataDir(): string {
  if (cachedDataDir) return cachedDataDir

  const fromEnv = process.env.PLANEJAI_DATA_DIR
  const resolved = fromEnv && fromEnv.trim().length > 0
    ? fromEnv
    : join(process.cwd(), '..', '..', 'data')

  mkdirSync(resolved, { recursive: true })
  cachedDataDir = resolved
  return resolved
}

export function getDatabaseFile(): string {
  return join(getDataDir(), 'planejAI.db')
}

export function getConfiguredDatabaseFile(): string {
  const configured = process.env.DATABASE_URL?.trim()
  if (!configured) return getDatabaseFile()
  if (!configured.startsWith('file:')) throw new Error('DATABASE_URL deve usar um arquivo SQLite local')
  const raw = configured.slice('file:'.length).split('?')[0]
  const resolved = resolve(isAbsolute(raw) ? raw : join(process.cwd(), raw))
  const expected = resolve(getDatabaseFile())
  if (resolved !== expected) throw new Error(`DATABASE_URL diverge de PLANEJAI_DATA_DIR: ${resolved} != ${expected}`)
  return resolved
}

export function getSecretFile(): string {
  return join(getDataDir(), '.secret')
}
