#!/usr/bin/env node

/**
 * Update User Schema in Production
 * Adds hasPassword and passwordHash fields
 */

import { createClient } from '@libsql/client';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const updateUserTableSQL = `
-- Add new columns to User table
ALTER TABLE "User" ADD COLUMN "hasPassword" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
`;

async function updateUserSchema() {
  try {
    console.log('🔄 Updating User schema in production...');
    console.log('📍 Database URL:', TURSO_DATABASE_URL);
    
    // Execute the SQL to add columns
    const statements = updateUserTableSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.execute(statement.trim());
          console.log('✅ Executed:', statement.trim());
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            console.log('⚠️  Column already exists:', statement.trim());
          } else {
            console.error('❌ Error executing statement:', error.message);
            console.error('Statement:', statement.trim());
          }
        }
      }
    }
    
    // Verify the schema
    console.log('\n🔍 Verifying User table schema...');
    const schema = await client.execute("PRAGMA table_info(User)");
    console.log('📋 User table columns:');
    schema.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
    });
    
    console.log('\n✅ User schema update completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

updateUserSchema();