import { backupDatabase } from '../src/shared/backup.js'

const path = backupDatabase()
if (!path) console.log('[backup] Nenhum DB encontrado — skip.')
