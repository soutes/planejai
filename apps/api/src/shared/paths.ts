import { mkdirSync } from 'fs'
import { join } from 'path'

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

export function getSecretFile(): string {
  return join(getDataDir(), '.secret')
}
