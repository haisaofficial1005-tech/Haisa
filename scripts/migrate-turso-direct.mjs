#!/usr/bin/env node

/**
 * Direct migration to Turso using SQL commands
 * This script applies the migration SQL directly to Turso database
 */

import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables from .env.vercel
config({ path: '.env.vercel' });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing Turso environment variables');
  process.exit(1);
}

console.log('🚀 Applying migrations directly to Turso database...');

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function applyMigrations() {
  try {
    console.log('📋 Checking current database schema...');
    
    // Check if User table exists and has phone column
    try {
      const result = await client.execute("PRAGMA table_info(User)");
      const columns = result.rows.map(row => row.name);
      console.log('📊 Current User table columns:', columns);
      
      if (!columns.includes('phone')) {
        console.log('❌ Phone column missing - need to apply migrations');
        
        // Read and apply the first migration
        console.log('📤 Applying first migration (add phone field)...');
        const migration1 = readFileSync('prisma/migrations/20251223065506_add_phone_field/migration.sql', 'utf8');
        
        // Split migration into individual statements
        const statements = migration1
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        // Drop existing tables first (if they exist)
        const dropStatements = [
          'DROP TABLE IF EXISTS "AuditLog"',
          'DROP TABLE IF EXISTS "Attachment"', 
          'DROP TABLE IF EXISTS "Payment"',
          'DROP TABLE IF EXISTS "GmailSale"',
          'DROP TABLE IF EXISTS "Ticket"',
          'DROP TABLE IF EXISTS "VerificationToken"',
          'DROP TABLE IF EXISTS "Session"',
          'DROP TABLE IF EXISTS "Account"',
          'DROP TABLE IF EXISTS "User"'
        ];
        
        console.log('🗑️ Dropping existing tables...');
        for (const stmt of dropStatements) {
          try {
            await client.execute(stmt);
            console.log(`   ✅ ${stmt}`);
          } catch (error) {
            console.log(`   ⚠️ ${stmt} - ${error.message}`);
          }
        }
        
        console.log('🏗️ Creating new tables...');
        for (const stmt of statements) {
          if (stmt.trim()) {
            try {
              await client.execute(stmt);
              console.log(`   ✅ Executed: ${stmt.substring(0, 50)}...`);
            } catch (error) {
              console.error(`   ❌ Error executing: ${stmt.substring(0, 50)}...`);
              console.error(`      ${error.message}`);
            }
          }
        }
        
        // Apply second migration
        console.log('📤 Applying second migration (gmail verification fields)...');
        const migration2 = readFileSync('prisma/migrations/20251223134747_add_gmail_verification_fields/migration.sql', 'utf8');
        const statements2 = migration2
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const stmt of statements2) {
          if (stmt.trim()) {
            try {
              await client.execute(stmt);
              console.log(`   ✅ Executed: ${stmt.substring(0, 50)}...`);
            } catch (error) {
              console.error(`   ❌ Error executing: ${stmt.substring(0, 50)}...`);
              console.error(`      ${error.message}`);
            }
          }
        }
        
      } else {
        console.log('✅ Phone column already exists');
      }
      
    } catch (error) {
      console.log('❌ User table does not exist - applying full schema...');
      
      // Apply full migration
      const migration1 = readFileSync('prisma/migrations/20251223065506_add_phone_field/migration.sql', 'utf8');
      const statements = migration1
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const stmt of statements) {
        if (stmt.trim()) {
          try {
            await client.execute(stmt);
            console.log(`✅ Executed: ${stmt.substring(0, 50)}...`);
          } catch (error) {
            console.error(`❌ Error: ${error.message}`);
          }
        }
      }
      
      // Apply second migration
      const migration2 = readFileSync('prisma/migrations/20251223134747_add_gmail_verification_fields/migration.sql', 'utf8');
      const statements2 = migration2
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const stmt of statements2) {
        if (stmt.trim()) {
          try {
            await client.execute(stmt);
            console.log(`✅ Executed: ${stmt.substring(0, 50)}...`);
          } catch (error) {
            console.error(`❌ Error: ${error.message}`);
          }
        }
      }
    }
    
    // Verify the schema
    console.log('\n🔍 Verifying final schema...');
    const finalResult = await client.execute("PRAGMA table_info(User)");
    const finalColumns = finalResult.rows.map(row => row.name);
    console.log('📊 Final User table columns:', finalColumns);
    
    if (finalColumns.includes('phone')) {
      console.log('✅ Migration successful! Phone column is now available.');
    } else {
      console.log('❌ Migration failed - phone column still missing.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

applyMigrations();