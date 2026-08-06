import { backupDatabase, withDatabaseOperationLock } from '../src/shared/backup.js'

try {
  await withDatabaseOperationLock(async () => {
    const path = backupDatabase()
    if (!path) console.log('[backup] Nenhum DB encontrado — skip.')
  })
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
