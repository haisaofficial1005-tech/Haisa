/**
 * Database client with fallback to local SQLite
 * Uses driver adapters for Prisma 7
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Singleton for hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function initializePrisma(): PrismaClient {
  const nodeEnv = process.env.NODE_ENV;
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const localUrl = process.env.DATABASE_URL;

  console.log('DB Init - NODE_ENV:', nodeEnv);
  console.log('DB Init - TURSO_DATABASE_URL:', tursoUrl ? 'SET' : 'NOT_SET');
  console.log('DB Init - TURSO_AUTH_TOKEN:', tursoToken ? 'SET' : 'NOT_SET');

  let adapter: PrismaLibSql;

  // Use Turso in production or when explicitly configured
  if (tursoUrl && tursoToken) {
    console.log('DB Init - Using Turso database:', tursoUrl);
    adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });
  } else {
    // Fallback to local SQLite for development
    const dbUrl = localUrl || 'file:./prisma/dev.db';
    console.log('DB Init - Using local database:', dbUrl);
    adapter = new PrismaLibSql({
      url: dbUrl,
    });
  }

  const client = new PrismaClient({
    adapter,
    log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });

  console.log('DB Init - PrismaClient created successfully');
  return client;
}

// Lazy initialization - create on first access
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = initializePrisma();
  }
  return globalForPrisma.prisma;
}

// Export as getter proxy for true lazy initialization
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
export type { PrismaClient };
