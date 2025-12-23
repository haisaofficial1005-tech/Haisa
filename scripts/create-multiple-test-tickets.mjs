#!/usr/bin/env node

/**
 * Create Multiple Test Tickets
 * Script untuk membuat beberapa test ticket dengan berbagai status
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

const issueTypes = [
  'Akun Diblokir',
  'Nomor Dibanned',
  'Tidak Bisa Kirim Pesan',
  'Akun Disuspend',
  'Verifikasi Gagal'
];

const descriptions = [
  'Akun WhatsApp saya tiba-tiba diblokir tanpa alasan yang jelas. Mohon bantuan untuk membuka blokir.',
  'Nomor WhatsApp saya dibanned setelah mengirim pesan ke banyak orang. Bagaimana cara mengatasinya?',
  'Saya tidak bisa mengirim pesan WhatsApp, selalu muncul error. Mohon bantuannya.',
  'Akun WhatsApp saya disuspend dan tidak bisa digunakan. Tolong bantu restore.',
  'Proses verifikasi WhatsApp selalu gagal dengan kode yang dikirim. Butuh bantuan.'
];

async function createMultipleTestTickets() {
  try {
    console.log('🎫 Creating multiple test tickets...\n');

    // Get customer user
    const customer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
    });

    if (!customer) {
      throw new Error('No customer user found');
    }

    // Get current ticket count
    const ticketCount = await prisma.ticket.count();

    // Create 4 more tickets (we already have 1)
    for (let i = 0; i < 4; i++) {
      const ticketNo = `WAC-2025-${String(ticketCount + i + 1).padStart(6, '0')}`;
      const issueType = issueTypes[i % issueTypes.length];
      const description = descriptions[i % descriptions.length];

      // Create ticket
      const ticket = await prisma.ticket.create({
        data: {
          ticketNo,
          customerId: customer.id,
          status: 'DRAFT',
          paymentStatus: 'PENDING',
          whatsAppNumber: `628123456789${i}`,
          countryRegion: 'Indonesia',
          issueType,
          incidentAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Different dates
          device: i % 2 === 0 ? 'Android' : 'iPhone',
          waVersion: '2.23.24.84',
          description,
        },
      });

      // Create QRIS payment
      const baseAmount = 50000;
      const uniqueCode = Math.floor(Math.random() * 900) + 100; // 3 digit random
      const totalAmount = baseAmount + uniqueCode;
      const orderId = `QRIS-${ticket.ticketNo}-${Date.now() + i}`;

      await prisma.payment.create({
        data: {
          ticketId: ticket.id,
          provider: 'QRIS',
          orderId,
          amount: totalAmount,
          currency: 'IDR',
          status: 'PENDING',
          rawPayload: JSON.stringify({
            baseAmount,
            uniqueCode: String(uniqueCode),
            qrisData: {
              merchantName: 'Haisa WA',
              amount: totalAmount,
              currency: 'IDR',
            },
            createdAt: new Date().toISOString(),
          }),
        },
      });

      console.log(`✅ Created ticket ${ticketNo} - ${issueType} (Rp ${totalAmount.toLocaleString('id-ID')} - Code: ${uniqueCode})`);
    }

    // Get final stats
    const totalTickets = await prisma.ticket.count();
    const totalPendingPayments = await prisma.payment.count({
      where: { status: 'PENDING' },
    });

    console.log('\n📊 Final Statistics:');
    console.log(`   Total Tickets: ${totalTickets}`);
    console.log(`   Pending Payments: ${totalPendingPayments}`);

    console.log('\n🎉 Multiple test tickets created successfully!');
    console.log('\n📋 Admin Dashboard will now show:');
    console.log(`   - ${totalTickets} total tickets`);
    console.log(`   - ${totalPendingPayments} pending payments`);
    console.log('   - Recent activity with multiple entries');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMultipleTestTickets();