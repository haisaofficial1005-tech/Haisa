/**
 * Check All Tickets
 * Script untuk melihat semua ticket yang ada
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

async function checkAllTickets() {
  try {
    console.log('🔍 Memeriksa semua ticket...');

    // Get all tickets
    const tickets = await prisma.ticket.findMany({
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        customer: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (tickets.length === 0) {
      console.log('📭 Tidak ada ticket di database');
      return;
    }

    console.log(`📊 Ditemukan ${tickets.length} ticket:`);
    console.log('');

    tickets.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticketNo} (${ticket.id})`);
      console.log(`   Status: ${ticket.status} | Payment: ${ticket.paymentStatus}`);
      console.log(`   Customer: ${ticket.customer.name} (${ticket.customer.email})`);
      console.log(`   Created: ${ticket.createdAt.toISOString()}`);
      
      if (ticket.payments.length > 0) {
        const latestPayment = ticket.payments[0];
        console.log(`   Latest Payment: ${latestPayment.orderId}`);
        console.log(`   Payment Provider: ${latestPayment.provider}`);
        console.log(`   Payment Amount: ${latestPayment.amount}`);
        
        if (latestPayment.rawPayload) {
          try {
            const payload = JSON.parse(latestPayment.rawPayload);
            console.log(`   QRIS Code: ${payload.uniqueCode || 'NULL'}`);
          } catch (error) {
            console.log(`   Raw Payload: ${latestPayment.rawPayload}`);
          }
        } else {
          console.log(`   Raw Payload: NULL`);
        }
      } else {
        console.log(`   No payments`);
      }
      
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAllTickets();