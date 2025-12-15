/**
 * Database client with Turso (libSQL) adapter
 * 
 * This module sets up Prisma with the libSQL driver adapter for Turso.
 * For local development, it uses a local SQLite file.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

// Environment variables
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

// Determine if we're using Turso or local SQLite
const isUsingTurso = tursoUrl && tursoUrl.startsWith('libsql://');

// Create libsql client
const libsqlClient = createClient(
  isUsingTurso
    ? {
        url: tursoUrl,
        authToken: tursoAuthToken,
      }
    : {
        url: 'file:./prisma/dev.db',
      }
);

// Create Prisma adapter
const adapter = new PrismaLibSql(libsqlClient);

// Create Prisma client with adapter
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Export type for use in other modules
export type { PrismaClient };
