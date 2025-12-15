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
  console.log('DB Init - NODE_ENV:', nodeEnv);
  console.log('DB Init - TURSO_DATABASE_URL value:', tursoUrl ? `"${tursoUrl.substring(0, 40)}..."` : 'EMPTY/UNDEFINED');
  console.log('DB Init - TURSO_AUTH_TOKEN exists:', !!tursoAuthToken && tursoAuthToken.length > 0);

  // Validate Turso URL format
  const isValidTursoUrl = tursoUrl && tursoUrl.startsWith('libsql://') && tursoUrl.length > 15;
  
  let adapter;
  
  if (isValidTursoUrl) {
    console.log('DB Init - Using Turso remote database');
    // PrismaLibSql in v7 accepts config object directly
    adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoAuthToken || undefined,
    });
  } else {
    // Fallback to local SQLite for development
    console.log('DB Init - Using local SQLite database (fallback)');
    adapter = new PrismaLibSql({
      url: 'file:./prisma/dev.db',
    });
  }
  
  return new PrismaClient({
    adapter,
    log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });
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
