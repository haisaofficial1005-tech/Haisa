/**
 * Database client with Turso (libSQL) adapter
 * Lazy initialization to ensure env vars are available at runtime
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient, Client } from '@libsql/client';

// Global cache
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  libsqlClient: Client | undefined;
};

function getLibsqlClient(): Client {
  if (globalForPrisma.libsqlClient) {
    return globalForPrisma.libsqlClient;
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    globalForPrisma.libsqlClient = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
  } else {
    globalForPrisma.libsqlClient = createClient({
      url: 'file:./prisma/dev.db',
    });
  }

  return globalForPrisma.libsqlClient;
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const libsqlClient = getLibsqlClient();
  const adapter = new PrismaLibSql(libsqlClient);

  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  return globalForPrisma.prisma;
}

// Export as getter to ensure lazy initialization
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient();
    const value = (client as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
export type { PrismaClient };
