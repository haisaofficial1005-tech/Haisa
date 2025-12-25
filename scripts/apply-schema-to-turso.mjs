#!/usr/bin/env node

/**
 * Apply Prisma schema to Turso database
 * This script pushes the current schema to the production Turso database
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing Turso environment variables:');
  console.error('   TURSO_DATABASE_URL:', TURSO_DATABASE_URL ? '✅ SET' : '❌ MISSING');
  console.error('   TURSO_AUTH_TOKEN:', TURSO_AUTH_TOKEN ? '✅ SET' : '❌ MISSING');
  console.error('\nPlease set these environment variables and try again.');
  process.exit(1);
}

console.log('🚀 Applying Prisma schema to Turso database...');
console.log('📍 Database URL:', TURSO_DATABASE_URL);

try {
  // Use prisma db push to apply schema to Turso
  console.log('\n📤 Pushing schema to Turso database...');
  
  const result = execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: TURSO_DATABASE_URL,
      TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN
    }
  });
  
  console.log('\n✅ Schema successfully applied to Turso database!');
  console.log('\n🔄 Generating Prisma client...');
  
  // Regenerate Prisma client
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n✅ Prisma client regenerated successfully!');
  console.log('\n🎉 Database schema is now up to date!');
  
} catch (error) {
  console.error('\n❌ Error applying schema to Turso database:');
  console.error(error.message);
  
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Verify Turso credentials are correct');
  console.log('2. Check if Turso database is accessible');
  console.log('3. Ensure you have the latest Prisma CLI');
  console.log('4. Try running: npm install @prisma/client@latest');
  
  process.exit(1);
}