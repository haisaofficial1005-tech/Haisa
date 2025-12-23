/**
 * Check Gmail Sale Data
 * Script untuk melihat data Gmail Sale yang ada
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

async function checkGmailSaleData() {
  try {
    console.log('🔍 Memeriksa data Gmail Sale...');

    // Get all Gmail Sales
    const gmailSales = await prisma.gmailSale.findMany({
      select: {
        id: true,
        saleNo: true,
        gmailAddress: true,
        paymentMethod: true,
        qrisAmount: true,
        qrisUniqueCode: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (gmailSales.length === 0) {
      console.log('📭 Tidak ada data Gmail Sale');
      return;
    }

    console.log(`📊 Ditemukan ${gmailSales.length} Gmail Sale:`);
    console.log('');

    gmailSales.forEach((sale, index) => {
      console.log(`${index + 1}. ${sale.saleNo}`);
      console.log(`   Gmail: ${sale.gmailAddress}`);
      console.log(`   Payment: ${sale.paymentMethod}`);
      console.log(`   Status: ${sale.status}`);
      if (sale.paymentMethod === 'QRIS') {
        console.log(`   QRIS Amount: ${sale.qrisAmount || 'NULL'}`);
        console.log(`   QRIS Code: ${sale.qrisUniqueCode || 'NULL'}`);
      }
      console.log(`   Created: ${sale.createdAt.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkGmailSaleData();