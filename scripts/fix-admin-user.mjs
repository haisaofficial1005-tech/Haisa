#!/usr/bin/env node

/**
 * Fix Admin User
 * Script untuk memperbaiki admin user dengan phone number yang benar
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

async function fixAdminUser() {
  try {
    console.log('🔧 Fixing admin user...\n');

    // Delete the duplicate customer user created by login
    const customerUser = await prisma.user.findFirst({
      where: {
        phone: '6281234567890',
        role: 'CUSTOMER',
      },
    });

    if (customerUser) {
      console.log('🗑️ Deleting duplicate customer user...');
      await prisma.user.delete({
        where: { id: customerUser.id },
      });
      console.log('✅ Duplicate customer user deleted');
    }

    // Update the admin user to have the correct phone number
    const adminUser = await prisma.user.findFirst({
      where: {
        email: '6281234567890',
        role: 'ADMIN',
      },
    });

    if (adminUser) {
      console.log('📱 Updating admin user with phone number...');
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          phone: '6281234567890',
          email: '6281234567890@haisa.wa', // Update email to match pattern
        },
      });
      console.log('✅ Admin user updated with phone number');
    }

    // Update other test users with phone numbers
    const opsUser = await prisma.user.findFirst({
      where: { role: 'OPS' },
    });
    if (opsUser) {
      await prisma.user.update({
        where: { id: opsUser.id },
        data: {
          phone: '6281234567891',
          email: '6281234567891@haisa.wa',
        },
      });
      console.log('✅ OPS user updated with phone number');
    }

    const agentUser = await prisma.user.findFirst({
      where: { role: 'AGENT' },
    });
    if (agentUser) {
      await prisma.user.update({
        where: { id: agentUser.id },
        data: {
          phone: '6281234567892',
          email: '6281234567892@haisa.wa',
        },
      });
      console.log('✅ Agent user updated with phone number');
    }

    const customerTestUser = await prisma.user.findFirst({
      where: { 
        role: 'CUSTOMER',
        email: '6281234567893',
      },
    });
    if (customerTestUser) {
      await prisma.user.update({
        where: { id: customerTestUser.id },
        data: {
          phone: '6281234567893',
          email: '6281234567893@haisa.wa',
        },
      });
      console.log('✅ Customer test user updated with phone number');
    }

    console.log('\n🎉 All users fixed successfully!');

    // Show final user list
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n📋 Final user list:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.phone}) - ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminUser();