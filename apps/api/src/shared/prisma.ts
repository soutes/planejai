import { PrismaClient } from '@prisma/client'
import { getDatabaseFile } from './paths.js'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? `file:${getDatabaseFile()}`
  return new PrismaClient({ log: ['error'], datasourceUrl: url })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
