/**
 * Gmail Sale Detail Admin Page
 * Halaman detail untuk verifikasi dan manage Gmail sale
 */

import { prisma } from '@/core/db';
import { gmailSaleOperations, VerificationChecklist } from '@/core/db/gmail-sale';
import { notFound } from 'next/navigation';
import GmailSaleDetailClient from './client';

interface GmailSaleDetail {
  id: string;
  saleNo: string;
  gmailAddress: string;
  gmailPassword: string;
  gmailPasswordEncrypted?: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentAccountNumber: string;
  paymentAccountName: string;
  status: string;
  adminNotes?: string;
  proofImageUrl?: string;
  qrisAmount?: number;
  qrisUniqueCode?: string;
  qrisPaymentProofUrl?: string;
  verificationData?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  suggestedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export default async function GmailSaleDetailPage({ params }: { params: { id: string } }) {
  const gmailSale: GmailSaleDetail | null = await gmailSaleOperations.findUnique(
    { id: params.id },
    {
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    }
  );

  if (!gmailSale) {
    notFound();
  }

  // Parse verification data if exists
  let verificationData: VerificationChecklist | null = null;
  if (gmailSale.verificationData) {
    try {
      verificationData = JSON.parse(gmailSale.verificationData);
    } catch (error) {
      console.error('Failed to parse verification data:', error);
    }
  }

  // Get verified by user info
  let verifiedByUser = null;
  if (gmailSale.verifiedBy) {
    verifiedByUser = await prisma.user.findUnique({
      where: { id: gmailSale.verifiedBy },
      select: { name: true, email: true },
    });
  }

  return (
    <GmailSaleDetailClient
      gmailSale={gmailSale}
      verificationData={verificationData}
      verifiedByUser={verifiedByUser}
    />
  );
}