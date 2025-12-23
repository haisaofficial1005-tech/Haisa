/**
 * Test QRIS Verification
 * Script untuk test API verifikasi QRIS
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

async function testQrisVerification() {
  try {
    console.log('🔍 Testing QRIS Verification...');

    // Get a sample payment
    const payment = await prisma.payment.findFirst({
      where: {
        provider: 'QRIS',
        status: 'PENDING',
      },
      include: {
        ticket: {
          select: {
            ticketNo: true,
          },
        },
      },
    });

    if (!payment) {
      console.log('❌ Tidak ada payment QRIS untuk ditest');
      return;
    }

    console.log(`📊 Testing dengan payment: ${payment.orderId}`);
    console.log(`   Ticket: ${payment.ticket.ticketNo}`);
    console.log(`   Amount: ${payment.amount}`);

    // Parse rawPayload to get unique code
    let uniqueCode = '';
    try {
      const payload = JSON.parse(payment.rawPayload || '{}');
      uniqueCode = payload.uniqueCode;
      console.log(`   Unique Code: ${uniqueCode}`);
    } catch (error) {
      console.log('❌ Gagal parse rawPayload:', error.message);
      return;
    }

    if (!uniqueCode) {
      console.log('❌ Unique code tidak ditemukan');
      return;
    }

    // Test verification API (simulate)
    console.log('\n🧪 Simulating verification API call...');
    console.log(`   POST /api/payments/verify-qris`);
    console.log(`   Body: { amount: ${payment.amount}, uniqueCode: "${uniqueCode}" }`);

    // Find matching payments (simulate API logic)
    const matchingPayments = await prisma.payment.findMany({
      where: {
        amount: payment.amount,
        status: 'PENDING',
        provider: 'QRIS',
      },
      include: {
        ticket: {
          include: {
            customer: true,
          },
        },
      },
    });

    console.log(`   Found ${matchingPayments.length} payments with matching amount`);

    // Filter by unique code
    const filteredPayments = matchingPayments.filter(p => {
      try {
        const payload = JSON.parse(p.rawPayload || '{}');
        return payload.uniqueCode === uniqueCode;
      } catch {
        return false;
      }
    });

    console.log(`   Found ${filteredPayments.length} payments with matching unique code`);

    if (filteredPayments.length === 1) {
      const matchedPayment = filteredPayments[0];
      console.log('✅ Verification would succeed!');
      console.log(`   Matched Payment: ${matchedPayment.orderId}`);
      console.log(`   Customer: ${matchedPayment.ticket.customer.name}`);
      console.log(`   Email: ${matchedPayment.ticket.customer.email}`);
    } else if (filteredPayments.length === 0) {
      console.log('❌ Verification would fail: No matching unique code');
    } else {
      console.log('❌ Verification would fail: Multiple matches');
    }

    console.log('\n📝 Test Summary:');
    console.log(`   Amount: ${payment.amount}`);
    console.log(`   Unique Code: ${uniqueCode}`);
    console.log(`   Expected Result: ${filteredPayments.length === 1 ? 'SUCCESS' : 'FAIL'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testQrisVerification();