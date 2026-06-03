import { createHash, randomUUID } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { prisma } from './prisma.js'

// Aplica migrations pendentes no DB do usuário SEM o CLI do Prisma.
// O CLI (`prisma migrate deploy`) não roda no app empacotado: a árvore de deps
// dele (@prisma/config → effect → fast-check) fica incompleta após
// `npm install --omit=dev`, estourando MODULE_NOT_FOUND. O @prisma/client, que
// roda a aplicação, funciona — então lemos os migration.sql e aplicamos via
// $executeRawUnsafe, registrando em _prisma_migrations no mesmo formato do CLI.

// dist/shared/ (prod) ou src/shared/ (dev) → ../../prisma/migrations
function migrationsDir(): string {
  return join(__dirname, '..', '..', 'prisma', 'migrations')
}

function listMigrationDirs(): string[] {
  const dir = migrationsDir()
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'migration.sql')))
    .map((e) => e.name)
    .sort() // nomes têm prefixo timestamp → ordem cronológica
}

async function ensureMigrationsTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
      "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
    )`)
}

async function appliedMigrations(): Promise<Set<string>> {
  const rows = await prisma.$queryRawUnsafe<Array<{ migration_name: string }>>(
    `SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL`,
  )
  return new Set(rows.map((r) => r.migration_name))
}

// migration.sql do Prisma: statements DDL terminados por ';', comentários em
// linhas próprias ('-- ...'). DDL SQLite não tem ';' dentro de string literal,
// então split por ';' é seguro aqui.
function splitStatements(sql: string): string[] {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function applyOne(name: string): Promise<void> {
  const file = join(migrationsDir(), name, 'migration.sql')
  const raw = readFileSync(file)
  const statements = splitStatements(raw.toString('utf8'))
  const checksum = createHash('sha256').update(raw).digest('hex')

  // Transação interativa → mesma conexão p/ todos os statements (PRAGMA
  // foreign_keys é por-conexão). 'PRAGMA defer_foreign_keys=ON' nas migrations
  // de RedefineTables adia a checagem de FK até o COMMIT, mantendo integridade.
  await prisma.$transaction(
    async (tx) => {
      for (const stmt of statements) {
        await tx.$executeRawUnsafe(stmt)
      }
      await tx.$executeRawUnsafe(
        `INSERT INTO "_prisma_migrations"
           ("id","checksum","migration_name","started_at","finished_at","applied_steps_count")
         VALUES (?, ?, ?, datetime('now'), datetime('now'), ?)`,
        randomUUID(),
        checksum,
        name,
        statements.length,
      )
    },
    { timeout: 120_000, maxWait: 120_000 },
  )
}

// Aplica todas as migrations pendentes em ordem. Retorna os nomes aplicados.
export async function runMigrations(): Promise<string[]> {
  await ensureMigrationsTable()
  const applied = await appliedMigrations()
  const pending = listMigrationDirs().filter((name) => !applied.has(name))

  for (const name of pending) {
    console.log(`[migrate] aplicando ${name}`)
    await applyOne(name)
  }
  return pending
}

// Há migrations pendentes? (sem aplicar) — usado p/ decidir backup pré-migração.
export async function hasPendingMigrations(): Promise<boolean> {
  await ensureMigrationsTable()
  const applied = await appliedMigrations()
  return listMigrationDirs().some((name) => !applied.has(name))
}
