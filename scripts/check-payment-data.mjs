/**
 * Check Payment Data
 * Script untuk melihat data Payment yang ada
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

async function checkPaymentData() {
  try {
    console.log('🔍 Memeriksa data Payment...');

    // Get all Payments
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        orderId: true,
        amount: true,
        currency: true,
        status: true,
        provider: true,
        rawPayload: true,
        createdAt: true,
        ticket: {
          select: {
            ticketNo: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (payments.length === 0) {
      console.log('📭 Tidak ada data Payment');
      return;
    }

    console.log(`📊 Ditemukan ${payments.length} Payment:`);
    console.log('');

    payments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment.orderId}`);
      console.log(`   Ticket: ${payment.ticket.ticketNo}`);
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
      
      console.log(`   Ticket Status: ${payment.ticket.status}`);
      console.log(`   Payment Status: ${payment.ticket.paymentStatus}`);
      console.log(`   Created: ${payment.createdAt.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkPaymentData();