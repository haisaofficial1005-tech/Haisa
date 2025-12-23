/**
 * Update Payment QRIS Data
 * Script untuk mengupdate Payment lama dengan data QRIS
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

/**
 * Generate 3 digit unique code for QRIS payment
 */
function generateQrisUniqueCode() {
  const min = 100;
  const max = 999;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

/**
 * Calculate QRIS amount with unique code
 */
function calculateQrisAmount(baseAmount, uniqueCode) {
  return baseAmount + parseInt(uniqueCode, 10);
}

/**
 * Get base price for tickets (fixed at 50k)
 */
function getTicketBasePrice() {
  return 50000; // 50k IDR
}

async function updatePaymentQris() {
  try {
    console.log('🔍 Mencari Payment yang perlu diupdate ke QRIS...');

    // Find Payments that need QRIS update
    const payments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { provider: { not: 'QRIS' } },
          { rawPayload: null },
          { rawPayload: '' },
        ],
      },
      include: {
        ticket: {
          select: {
            ticketNo: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (payments.length === 0) {
      console.log('✅ Tidak ada Payment yang perlu diupdate');
      return;
    }

    console.log(`📝 Ditemukan ${payments.length} Payment yang perlu diupdate:`);

    const baseAmount = getTicketBasePrice();
    let updatedCount = 0;

    for (const payment of payments) {
      console.log(`\n🔄 Mengupdate ${payment.orderId} (${payment.ticket.ticketNo})...`);

      // Generate QRIS data
      const uniqueCode = generateQrisUniqueCode();
      const totalAmount = calculateQrisAmount(baseAmount, uniqueCode);

      // Create new order ID with QRIS format
      const newOrderId = `QRIS-${payment.ticket.ticketNo}-${Date.now()}`;

      try {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            provider: 'QRIS',
            orderId: newOrderId,
            amount: totalAmount,
            rawPayload: JSON.stringify({
              baseAmount,
              uniqueCode,
              totalAmount,
              paymentMethod: 'QRIS',
            }),
          },
        });

        console.log(`   ✅ Berhasil: Amount = ${totalAmount}, Kode Unik = ${uniqueCode}`);
        console.log(`   📝 Order ID baru: ${newOrderId}`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Gagal update ${payment.orderId}:`, error.message);
      }
    }

    console.log(`\n🎉 Selesai! ${updatedCount}/${payments.length} Payment berhasil diupdate`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updatePaymentQris();