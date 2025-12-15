/**
 * Database client with Turso (libSQL) adapter for Prisma 7
 * Uses driver adapters - no DATABASE_URL needed at runtime
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Singleton for hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function initializePrisma(): PrismaClient {
  // Read env vars fresh each time
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const nodeEnv = process.env.NODE_ENV;

  // Detailed debug logging
  console.log('DB Init v2 - NODE_ENV:', nodeEnv);
  console.log('DB Init v2 - TURSO_DATABASE_URL:', tursoUrl ? `"${tursoUrl.substring(0, 50)}..."` : 'NOT_SET');
  console.log('DB Init v2 - TURSO_AUTH_TOKEN:', tursoAuthToken ? 'SET' : 'NOT_SET');

  // Validate Turso URL format
  const isValidTursoUrl = tursoUrl && tursoUrl.startsWith('libsql://') && tursoUrl.length > 15;
  
  let adapter;
  let dbUrl: string;
  
  if (isValidTursoUrl) {
    console.log('DB Init v2 - Connecting to Turso remote');
    dbUrl = tursoUrl;
    adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoAuthToken || undefined,
    });
  } else {
    console.log('DB Init v2 - Using local SQLite fallback');
    dbUrl = 'file:./prisma/dev.db';
    adapter = new PrismaLibSql({
      url: dbUrl,
    });
  }

  // Set DATABASE_URL as fallback for any internal Prisma checks
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = dbUrl;
  }
  
  const client = new PrismaClient({
    adapter,
    log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });

  console.log('DB Init v2 - PrismaClient created successfully');
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
