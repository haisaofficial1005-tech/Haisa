/**
 * Simulate Payment Flow
 * Script untuk simulasi flow pembayaran lengkap
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

async function simulatePaymentFlow() {
  try {
    const ticketId = '1e1565c0-cea6-4558-8ea1-ddac1756089d'; // WAC-2025-000004
    console.log(`🎭 Simulasi Payment Flow untuk ticket: ${ticketId}`);

    // 1. Get ticket (simulate fetchTicketAndPayment)
    console.log('\n1️⃣ Fetching ticket...');
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        payments: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      console.log('❌ Ticket tidak ditemukan');
      return;
    }

    console.log(`✅ Ticket found: ${ticket.ticketNo}`);
    console.log(`   Status: ${ticket.status}`);
    console.log(`   Payment Status: ${ticket.paymentStatus}`);

    // 2. Check existing payment (simulate API logic)
    console.log('\n2️⃣ Checking existing payment...');
    const existingPayment = ticket.payments[0];
    
    if (existingPayment) {
      console.log(`✅ Existing payment found: ${existingPayment.orderId}`);
      console.log(`   Provider: ${existingPayment.provider}`);
      console.log(`   Amount: ${existingPayment.amount}`);
      
      // Parse rawPayload (simulate API response)
      let qrisData = { uniqueCode: '', baseAmount: 50000 };
      try {
        qrisData = JSON.parse(existingPayment.rawPayload || '{}');
        console.log(`   Base Amount: ${qrisData.baseAmount}`);
        console.log(`   Unique Code: ${qrisData.uniqueCode}`);
        console.log(`   Total Amount: ${qrisData.totalAmount}`);
      } catch (error) {
        console.log(`❌ Error parsing rawPayload: ${error.message}`);
      }

      // Simulate API response
      const apiResponse = {
        payment: {
          id: existingPayment.id,
          orderId: existingPayment.orderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          status: existingPayment.status,
        },
        paymentMethod: 'QRIS',
        qrisAmount: existingPayment.amount,
        qrisUniqueCode: qrisData.uniqueCode,
        baseAmount: qrisData.baseAmount,
        message: 'Payment already exists',
      };

      console.log('\n📤 Simulated API Response:');
      console.log(JSON.stringify(apiResponse, null, 2));

      if (apiResponse.qrisUniqueCode) {
        console.log(`\n✅ Frontend akan menerima kode unik: ${apiResponse.qrisUniqueCode}`);
        console.log(`✅ Frontend akan menampilkan nominal: Rp ${apiResponse.qrisAmount.toLocaleString('id-ID')}`);
      } else {
        console.log(`\n❌ Frontend tidak akan menerima kode unik!`);
      }

    } else {
      console.log('❌ No existing payment found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the simulation
simulatePaymentFlow();