/**
 * Create Admin User
 * Script untuk membuat user admin
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
  log: ['error', 'warn'],
});

async function createAdminUser() {
  try {
    console.log('👤 Creating admin user...');

    // Admin credentials
    const adminPhone = '6281234567890'; // Nomor WhatsApp admin
    const adminName = 'Admin Haisa WA';
    const adminRole = 'ADMIN';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: adminPhone },
    });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists:`);
      console.log(`   Phone: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update role if needed
      if (existingAdmin.role !== adminRole) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: adminRole },
        });
        console.log(`   ✅ Role updated to ${adminRole}`);
      }
      
      return;
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: adminPhone,
        name: adminName,
        role: adminRole,
      },
    });

    console.log(`✅ Admin user created successfully:`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Phone: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}`);

    console.log(`\n🔑 Login credentials:`);
    console.log(`   URL: http://localhost:3001/login`);
    console.log(`   Nomor WhatsApp: ${adminPhone}`);
    console.log(`   Nama: ${adminName} (opsional)`);

    // Also create some test users with different roles
    const testUsers = [
      { phone: '6281234567891', name: 'OPS User', role: 'OPS' },
      { phone: '6281234567892', name: 'Agent User', role: 'AGENT' },
      { phone: '6281234567893', name: 'Customer User', role: 'CUSTOMER' },
    ];

    console.log(`\n👥 Creating test users...`);
    for (const testUser of testUsers) {
      const existing = await prisma.user.findFirst({
        where: { email: testUser.phone },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email: testUser.phone,
            name: testUser.name,
            role: testUser.role,
          },
        });
        console.log(`   ✅ Created ${testUser.role}: ${testUser.phone} (${testUser.name})`);
      } else {
        console.log(`   ⏭️  ${testUser.role} already exists: ${testUser.phone}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();