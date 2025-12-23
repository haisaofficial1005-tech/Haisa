#!/usr/bin/env node

/**
 * Create Test Ticket
 * Script untuk membuat test ticket dengan payment QRIS
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

async function createTestTicket() {
  try {
    console.log('🎫 Creating test ticket...\n');

    // Get customer user
    const customer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
    });

    if (!customer) {
      throw new Error('No customer user found');
    }

    // Generate ticket number
    const ticketCount = await prisma.ticket.count();
    const ticketNo = `WAC-2025-${String(ticketCount + 1).padStart(6, '0')}`;

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNo,
        customerId: customer.id,
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        whatsAppNumber: customer.phone || '6281234567893',
        countryRegion: 'Indonesia',
        issueType: 'Akun Diblokir',
        incidentAt: new Date(),
        device: 'Android',
        waVersion: '2.23.24.84',
        description: 'Akun WhatsApp saya tiba-tiba diblokir tanpa alasan yang jelas. Mohon bantuan untuk membuka blokir.',
      },
    });

    console.log('✅ Test ticket created:');
    console.log(`   Ticket No: ${ticket.ticketNo}`);
    console.log(`   Customer: ${customer.name} (${customer.phone})`);
    console.log(`   Issue: ${ticket.issueType}`);

    // Create QRIS payment
    const baseAmount = 50000;
    const uniqueCode = Math.floor(Math.random() * 900) + 100; // 3 digit random
    const totalAmount = baseAmount + uniqueCode;
    const orderId = `QRIS-${ticket.ticketNo}-${Date.now()}`;

    const payment = await prisma.payment.create({
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

    console.log('\n💳 QRIS payment created:');
    console.log(`   Order ID: ${payment.orderId}`);
    console.log(`   Amount: Rp ${totalAmount.toLocaleString('id-ID')}`);
    console.log(`   Base Amount: Rp ${baseAmount.toLocaleString('id-ID')}`);
    console.log(`   Unique Code: ${uniqueCode}`);
    console.log(`   Status: ${payment.status}`);

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Login as admin: http://localhost:3001/login');
    console.log('2. Use phone: 6281234567890');
    console.log('3. Go to Payment Verification page');
    console.log('4. Confirm the payment manually');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTicket();