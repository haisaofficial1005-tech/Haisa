#!/usr/bin/env node

/**
 * Check All Users
 * Script untuk memeriksa semua user di database
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Setup database connection sama seperti di aplikasi
const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
console.log('Using database:', dbUrl);

const adapter = new PrismaLibSql({
  url: dbUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function checkAllUsers() {
  try {
    console.log('🔍 Memeriksa semua user...\n');

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('📭 Tidak ada user di database');
      return;
    }

    console.log(`📊 Total user: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toLocaleString('id-ID')}`);
      console.log('');
    });

    // Check for admin users
    const adminUsers = users.filter(user => ['ADMIN', 'OPS', 'AGENT'].includes(user.role));
    console.log(`👑 Admin users: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.phone}) - ${admin.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();