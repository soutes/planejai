import { copyFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { getDataDir, getDatabaseFile, getSecretFile } from './paths.js'

// Quantos conjuntos de backup manter. Override via env.
const KEEP = Number(process.env.PLANEJAI_BACKUP_KEEP ?? 10)

// Sidecars do SQLite que precisam acompanhar o .db p/ consistência pós-crash.
const SIDECARS = ['-journal', '-wal', '-shm'] as const

function localStamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `bak-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

/**
 * Backup do banco SQLite. Copia o .db + sidecars (-journal/-wal/-shm) e o
 * .secret (par indissociável — a apiKey é cifrada com ele). Skip silencioso se
 * o DB não existe (primeira instalação).
 *
 * Nota: cópia de arquivo é consistente quando o DB está em repouso — o caso dos
 * call sites atuais (startup antes do Prisma conectar; antes de cada migrate).
 * Não é seguro para um DB sob escrita concorrente.
 */
export function backupDatabase(): string | null {
  const dbFile = getDatabaseFile()
  if (!existsSync(dbFile)) return null

  const dir = getDataDir()
  let stamp = localStamp()

  // guarda contra colisão no mesmo segundo
  let suffix = 0
  while (existsSync(join(dir, `planejAI.db.${stamp}`))) {
    suffix += 1
    stamp = `${localStamp()}-${suffix}`
  }

  const dbDest = join(dir, `planejAI.db.${stamp}`)
  copyFileSync(dbFile, dbDest)
  for (const ext of SIDECARS) {
    const side = `${dbFile}${ext}`
    if (existsSync(side)) copyFileSync(side, `${dbDest}${ext}`)
  }

  const secret = getSecretFile()
  if (existsSync(secret)) copyFileSync(secret, join(dir, `.secret.${stamp}`))

  console.log(`[backup] salvo em ${dbDest}`)
  pruneOldBackups(dir)
  return dbDest
}

// Mantém apenas os KEEP backups mais recentes; remove o conjunto inteiro
// (.db + sidecars + .secret) de cada backup excedente.
function pruneOldBackups(dir: string): void {
  if (!Number.isFinite(KEEP) || KEEP <= 0) return

  const mains = readdirSync(dir)
    .filter((f) => /^planejAI\.db\.bak-/.test(f) && !SIDECARS.some((s) => f.endsWith(s)))
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)

  for (const { f } of mains.slice(KEEP)) {
    const stamp = f.replace(/^planejAI\.db\./, '')
    const victims = [f, ...SIDECARS.map((s) => `${f}${s}`), `.secret.${stamp}`]
    for (const v of victims) {
      const p = join(dir, v)
      if (existsSync(p)) unlinkSync(p)
    }
  }
}
