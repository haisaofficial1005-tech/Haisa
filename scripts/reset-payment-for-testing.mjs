/**
 * Reset Payment for Testing
 * Script untuk reset status payment ke PENDING untuk testing
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

async function resetPaymentForTesting() {
  try {
    console.log('🔄 Resetting payments for testing...');

    // Get all PAID payments
    const paidPayments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        provider: 'QRIS',
      },
      include: {
        ticket: {
          select: {
            ticketNo: true,
          },
        },
      },
    });

    if (paidPayments.length === 0) {
      console.log('✅ Tidak ada payment PAID yang perlu direset');
      return;
    }

    console.log(`📊 Ditemukan ${paidPayments.length} payment PAID:`);

    for (const payment of paidPayments) {
      console.log(`\n🔄 Resetting ${payment.orderId} (${payment.ticket.ticketNo})...`);

      // Parse existing rawPayload
      let existingPayload = {};
      try {
        existingPayload = JSON.parse(payment.rawPayload || '{}');
      } catch {
        // ignore
      }

      // Reset payment and ticket status
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PENDING',
            rawPayload: JSON.stringify({
              ...existingPayload,
              resetAt: new Date().toISOString(),
              resetReason: 'Testing',
            }),
          },
        }),
        prisma.ticket.update({
          where: { id: payment.ticketId },
          data: {
            paymentStatus: 'PENDING',
            status: 'DRAFT',
          },
        }),
      ]);

      console.log(`   ✅ Reset berhasil`);
    }

    console.log(`\n🎉 Selesai! ${paidPayments.length} payment berhasil direset ke PENDING`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetPaymentForTesting();