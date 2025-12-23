#!/usr/bin/env node

/**
 * Check Gmail Sales Script
 * Simple script to check existing Gmail sales
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGmailSales() {
  console.log('🔍 Checking Gmail sales...');
  
  try {
    const count = await prisma.gmailSale.count();
    console.log(`📊 Found ${count} Gmail sales in database`);
    
    if (count > 0) {
      const sales = await prisma.gmailSale.findMany({
        select: {
          id: true,
          saleNo: true,
          gmailAddress: true,
          status: true,
          gmailPasswordEncrypted: true,
          createdAt: true,
        },
        take: 5,
      });
      
      console.log('\n📋 Sample records:');
      sales.forEach(sale => {
        console.log(`  - ${sale.saleNo}: ${sale.gmailAddress} (${sale.status}) - Encrypted: ${sale.gmailPasswordEncrypted ? 'Yes' : 'No'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGmailSales();