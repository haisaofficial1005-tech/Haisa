#!/usr/bin/env node

/**
 * Migration Script: Encrypt existing Gmail passwords
 * Migrates plain text passwords to encrypted format
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Inline encryption function (same as in encryption.ts)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'haisa-wa-encryption-key-32-chars!!';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv + authTag + encrypted
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

async function migrateGmailPasswords() {
  console.log('🔄 Starting Gmail password encryption migration...');
  
  try {
    // Get all Gmail sales with plain text passwords
    const gmailSales = await prisma.gmailSale.findMany({
      where: {
        gmailPasswordEncrypted: null, // Only migrate unencrypted ones
      },
      select: {
        id: true,
        saleNo: true,
        gmailAddress: true,
        gmailPassword: true,
      },
    });
    
    console.log(`📊 Found ${gmailSales.length} Gmail sales to migrate`);
    
    if (gmailSales.length === 0) {
      console.log('✅ No migration needed - all passwords already encrypted');
      return;
    }
    
    let migrated = 0;
    let errors = 0;
    
    for (const sale of gmailSales) {
      try {
        // Encrypt the password
        const encryptedPassword = encrypt(sale.gmailPassword);
        
        // Update the record
        await prisma.gmailSale.update({
          where: { id: sale.id },
          data: {
            gmailPasswordEncrypted: encryptedPassword,
            // Keep original password for now (will be removed in next phase)
          },
        });
        
        migrated++;
        console.log(`✅ Migrated ${sale.saleNo} (${sale.gmailAddress})`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Failed to migrate ${sale.saleNo}:`, error.message);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${gmailSales.length}`);
    
    if (errors === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 Next steps:');
      console.log('   1. Test the admin interface with encrypted passwords');
      console.log('   2. Verify export functionality works');
      console.log('   3. Remove plain text passwords in next migration');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review failed records.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateGmailPasswords().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});