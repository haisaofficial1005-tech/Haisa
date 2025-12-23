/**
 * Simulate Webhook Confirmation
 * Script untuk simulasi konfirmasi pembayaran otomatis
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

async function simulateWebhookConfirmation() {
  try {
    console.log('🎭 Simulasi Webhook Confirmation...');

    // Find pending QRIS payments
    const pendingPayments = await prisma.payment.findMany({
      where: {
        provider: 'QRIS',
        status: 'PENDING',
      },
      include: {
        ticket: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingPayments.length === 0) {
      console.log('✅ Tidak ada payment PENDING yang perlu dikonfirmasi');
      return;
    }

    console.log(`📊 Ditemukan ${pendingPayments.length} payment PENDING:`);

    for (const payment of pendingPayments) {
      console.log(`\n🔄 Processing payment: ${payment.orderId}`);
      console.log(`   Ticket: ${payment.ticket.ticketNo}`);
      console.log(`   Amount: Rp ${payment.amount.toLocaleString('id-ID')}`);
      console.log(`   Customer: ${payment.ticket.customer.name}`);

      // Parse unique code from rawPayload
      let uniqueCode = '';
      try {
        const payload = JSON.parse(payment.rawPayload || '{}');
        uniqueCode = payload.uniqueCode;
        console.log(`   Unique Code: ${uniqueCode}`);
      } catch (error) {
        console.log(`   ❌ Cannot parse unique code: ${error.message}`);
        continue;
      }

      // Ask for confirmation
      console.log(`\n❓ Konfirmasi pembayaran untuk ${payment.ticket.ticketNo}?`);
      console.log(`   Amount: Rp ${payment.amount.toLocaleString('id-ID')}`);
      console.log(`   Unique Code: ${uniqueCode}`);
      
      // For demo, we'll auto-confirm the first payment
      // In real scenario, you would check with actual payment provider
      const shouldConfirm = true; // Change this to false if you don't want to auto-confirm

      if (shouldConfirm) {
        console.log(`   ✅ Mengkonfirmasi pembayaran...`);

        // Update payment and ticket status
        const [updatedPayment, updatedTicket] = await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
              rawPayload: JSON.stringify({
                ...JSON.parse(payment.rawPayload || '{}'),
                confirmedAt: new Date().toISOString(),
                confirmedBy: 'AUTO_SYSTEM',
                simulatedWebhook: true,
              }),
            },
          }),
          prisma.ticket.update({
            where: { id: payment.ticketId },
            data: {
              paymentStatus: 'PAID',
              status: 'RECEIVED',
            },
          }),
        ]);

        console.log(`   ✅ Payment status: ${updatedPayment.status}`);
        console.log(`   ✅ Ticket status: ${updatedTicket.status}`);
        console.log(`   📧 Ticket ${payment.ticket.ticketNo} siap diproses!`);

        // Note: In real implementation, you would also trigger:
        // - Google Sheets sync
        // - WhatsApp notification
        // - Email notification
        console.log(`   💡 Next: Admin dapat memproses ticket di dashboard`);

      } else {
        console.log(`   ⏭️  Skipping payment confirmation`);
      }
    }

    console.log(`\n🎉 Simulasi webhook selesai!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the simulation
simulateWebhookConfirmation();