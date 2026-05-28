import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'

  // Check if using Turso (libsql://) or local SQLite (file:)
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('http')) {
    // Turso cloud database - pass config directly to adapter
    const adapter = new PrismaLibSQL({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || '',
    })

    return new PrismaClient({
      adapter,
    })
  } else {
    // Local SQLite file
    return new PrismaClient({
      log: ['query'],
    })
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
