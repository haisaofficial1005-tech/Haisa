// Prisma configuration for Turso (libSQL)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // For Turso, we use the local SQLite file for migrations
  // The actual connection to Turso is handled by the adapter in src/core/db/index.ts
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
