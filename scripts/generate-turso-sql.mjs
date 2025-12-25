#!/usr/bin/env node

/**
 * Generate SQL commands to apply to Turso database manually
 */

import { readFileSync } from 'fs';

console.log('🔧 Generating SQL commands for Turso database...\n');

console.log('='.repeat(80));
console.log('TURSO DATABASE MIGRATION SQL');
console.log('='.repeat(80));
console.log('Copy and paste these commands into Turso CLI or dashboard:\n');

try {
  // Read the first migration
  const migration1 = readFileSync('prisma/migrations/20251223065506_add_phone_field/migration.sql', 'utf8');
  
  console.log('-- STEP 1: Drop existing tables (if they exist)');
  const dropStatements = [
    'DROP TABLE IF EXISTS "AuditLog";',
    'DROP TABLE IF EXISTS "Attachment";', 
    'DROP TABLE IF EXISTS "Payment";',
    'DROP TABLE IF EXISTS "GmailSale";',
    'DROP TABLE IF EXISTS "Ticket";',
    'DROP TABLE IF EXISTS "VerificationToken";',
    'DROP TABLE IF EXISTS "Session";',
    'DROP TABLE IF EXISTS "Account";',
    'DROP TABLE IF EXISTS "User";'
  ];
  
  dropStatements.forEach(stmt => console.log(stmt));
  
  console.log('\n-- STEP 2: Create tables with phone field');
  console.log(migration1);
  
  // Read the second migration
  const migration2 = readFileSync('prisma/migrations/20251223134747_add_gmail_verification_fields/migration.sql', 'utf8');
  console.log('\n-- STEP 3: Add Gmail verification fields');
  console.log(migration2);
  
  console.log('\n' + '='.repeat(80));
  console.log('MANUAL TURSO SETUP INSTRUCTIONS');
  console.log('='.repeat(80));
  console.log('1. Go to https://turso.tech/app');
  console.log('2. Select your database: haisa-sulthonaj');
  console.log('3. Go to "SQL Console" or use Turso CLI');
  console.log('4. Copy and paste the SQL commands above');
  console.log('5. Execute them in order');
  console.log('\nOR use Turso CLI:');
  console.log('turso db shell haisa-sulthonaj');
  console.log('Then paste the SQL commands');
  
} catch (error) {
  console.error('❌ Error reading migration files:', error.message);
}