/**
 * Gmail Sale Database Operations
 * Wrapper untuk operasi database Gmail Sale dengan encryption support
 */

import { prisma } from './index';
import { encrypt, decrypt } from '../security/encryption';

export interface GmailSaleData {
  saleNo: string;
  customerId: string;
  gmailAddress: string;
  gmailPassword: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentAccountNumber: string;
  paymentAccountName: string;
  status?: string;
}

export interface GmailSaleUpdate {
  status?: string;
  adminNotes?: string;
  proofImageUrl?: string;
  googleDriveFolderId?: string;
  googleDriveFolderUrl?: string;
  googleSheetRowIndex?: number;
  qrisAmount?: number;
  qrisUniqueCode?: string;
  qrisPaymentProofUrl?: string;
  qrisPaymentProofDriveId?: string;
  verificationData?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  suggestedPrice?: number;
}

export interface VerificationChecklist {
  loginSuccess: boolean;
  emailCount: number;
  accountAge: string; // "2019", "2020", etc
  recoveryInfo: {
    hasPhoneNumber: boolean;
    hasRecoveryEmail: boolean;
  };
  securityStatus: {
    twoFactorEnabled: boolean;
    suspiciousActivity: boolean;
  };
  notes: string;
}

export interface PricingGuidelines {
  basePrice: number;
  ageMultiplier: Record<string, number>;
  emailCountBonus: Record<string, number>;
}

// Pricing guidelines
const PRICING_GUIDELINES: PricingGuidelines = {
  basePrice: 50000,
  ageMultiplier: {
    '2024': 0.8,  // Akun baru, harga lebih rendah
    '2023': 1.0,  // Standard
    '2022': 1.2,  // Lebih mahal
    '2021': 1.4,
    '2020': 1.6,
    '2019': 2.0   // Akun lama, paling mahal
  },
  emailCountBonus: {
    '0-100': 0,
    '100-1000': 5000,
    '1000-5000': 10000,
    '5000+': 20000
  }
};

// Helper functions
export function getEmailRange(count: number): string {
  if (count <= 100) return '0-100';
  if (count <= 1000) return '100-1000';
  if (count <= 5000) return '1000-5000';
  return '5000+';
}

export function suggestPrice(verificationData: VerificationChecklist): number {
  let price = PRICING_GUIDELINES.basePrice;
  
  // Age multiplier
  const ageMultiplier = PRICING_GUIDELINES.ageMultiplier[verificationData.accountAge] || 1.0;
  price *= ageMultiplier;
  
  // Email count bonus
  const emailRange = getEmailRange(verificationData.emailCount);
  price += PRICING_GUIDELINES.emailCountBonus[emailRange];
  
  // Security features bonus
  if (verificationData.securityStatus.twoFactorEnabled) {
    price += 10000; // Bonus untuk 2FA
  }
  
  return Math.round(price);
}

// Type-safe wrapper functions
export const gmailSaleOperations = {
  async create(data: GmailSaleData) {
    // Encrypt password before storing
    const encryptedPassword = encrypt(data.gmailPassword);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma as any).gmailSale.create({ 
      data: {
        ...data,
        gmailPasswordEncrypted: encryptedPassword,
        // Keep original for backward compatibility (will be removed later)
      }
    });
  },

  async findMany(where?: any, options?: any) {
    const query: any = {};
    if (where) query.where = where;
    if (options) Object.assign(query, options);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma as any).gmailSale.findMany(query);
  },

  async findFirst(where: any, options?: any) {
    const query: any = { where };
    if (options) Object.assign(query, options);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma as any).gmailSale.findFirst(query);
  },

  async findUnique(where: { id: string }, include?: any) {
    const query: any = { where };
    if (include) query.include = include;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma as any).gmailSale.findUnique(query);
  },

  async update(where: { id: string }, data: GmailSaleUpdate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma as any).gmailSale.update({
      where,
      data,
    });
  },

  // Get decrypted password for admin use
  async getDecryptedPassword(saleId: string): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sale = await (prisma as any).gmailSale.findUnique({
      where: { id: saleId },
      select: { gmailPasswordEncrypted: true, gmailPassword: true }
    });
    
    if (!sale) return null;
    
    // Try encrypted password first, fallback to plain text
    if (sale.gmailPasswordEncrypted) {
      try {
        return decrypt(sale.gmailPasswordEncrypted);
      } catch (error) {
        console.error('Failed to decrypt password:', error);
        // Fallback to plain text if decryption fails
        return sale.gmailPassword || null;
      }
    }
    
    return sale.gmailPassword || null;
  },

  // Get password for display (masked for non-admin)
  getPasswordForDisplay(userRole: string, encryptedPassword?: string, plainPassword?: string): string {
    if (userRole === 'ADMIN' || userRole === 'OPS') {
      // Admin can see actual password
      if (encryptedPassword) {
        try {
          return decrypt(encryptedPassword);
        } catch (error) {
          console.error('Failed to decrypt password:', error);
          return plainPassword || '••••••••';
        }
      }
      return plainPassword || '••••••••';
    }
    
    // Customer only sees masked password
    return '••••••••';
  },

  // Update verification data
  async updateVerification(saleId: string, verificationData: VerificationChecklist, adminId: string) {
    const suggestedPriceValue = suggestPrice(verificationData);
    
    return await this.update({ id: saleId }, {
      verificationData: JSON.stringify(verificationData),
      verifiedBy: adminId,
      verifiedAt: new Date(),
      suggestedPrice: suggestedPriceValue,
      status: verificationData.loginSuccess ? 'APPROVED' : 'REJECTED',
      rejectionReason: verificationData.loginSuccess ? undefined : 'Login gagal atau akun bermasalah',
    });
  },
};