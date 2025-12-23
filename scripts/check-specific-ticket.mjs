/**
 * Check Specific Ticket
 * Script untuk melihat data ticket dan payment spesifik
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

async function checkSpecificTicket() {
  try {
    const ticketId = '1e1565c0-cea6-4558-8ea1-ddac17560893';
    console.log(`🔍 Memeriksa ticket: ${ticketId}`);

    // Get ticket with payment
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        customer: {
          select: { name: true, email: true },
        },
      },
    });

    if (!ticket) {
      console.log('❌ Ticket tidak ditemukan');
      return;
    }

    console.log(`📊 Ticket Details:`);
    console.log(`   Ticket No: ${ticket.ticketNo}`);
    console.log(`   Status: ${ticket.status}`);
    console.log(`   Payment Status: ${ticket.paymentStatus}`);
    console.log(`   Customer: ${ticket.customer.name} (${ticket.customer.email})`);
    console.log(`   Created: ${ticket.createdAt.toISOString()}`);
    console.log('');

    if (ticket.payments.length === 0) {
      console.log('📭 Tidak ada payment untuk ticket ini');
      console.log('💡 Perlu create payment baru dengan klik "Generate QRIS"');
      return;
    }

    console.log(`💳 Payment Details (${ticket.payments.length} payments):`);
    ticket.payments.forEach((payment, index) => {
      console.log(`\n${index + 1}. ${payment.orderId}`);
      console.log(`   Amount: ${payment.amount} ${payment.currency}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Provider: ${payment.provider}`);
      
      if (payment.rawPayload) {
        try {
          const payload = JSON.parse(payment.rawPayload);
          console.log(`   Base Amount: ${payload.baseAmount || 'NULL'}`);
          console.log(`   Unique Code: ${payload.uniqueCode || 'NULL'}`);
          console.log(`   Total Amount: ${payload.totalAmount || 'NULL'}`);
        } catch (error) {
          console.log(`   Raw Payload: ${payment.rawPayload}`);
        }
      } else {
        console.log(`   Raw Payload: NULL`);
      }
      
      console.log(`   Created: ${payment.createdAt.toISOString()}`);
    });

    // Check if this ticket needs payment creation
    const latestPayment = ticket.payments[0];
    if (!latestPayment || latestPayment.provider !== 'QRIS') {
      console.log('\n⚠️  Ticket ini perlu payment QRIS baru!');
      console.log('💡 Customer perlu klik "Generate QRIS" di halaman pembayaran');
    } else {
      console.log('\n✅ Ticket sudah memiliki payment QRIS');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkSpecificTicket();