/**
 * Gmail Sales Admin Page
 * Halaman admin untuk manage penjualan Gmail dengan verification tools
 */

import { prisma } from '@/core/db';
import Link from 'next/link';
import { gmailSaleOperations } from '@/core/db/gmail-sale';
import GmailSalesAdminClient from './client';

interface GmailSaleWithCustomer {
  id: string;
  saleNo: string;
  gmailAddress: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentAccountNumber: string;
  status: string;
  qrisAmount?: number;
  qrisUniqueCode?: string;
  qrisPaymentProofUrl?: string;
  suggestedPrice?: number;
  verifiedAt?: Date;
  createdAt: Date;
  customer: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default async function GmailSalesAdminPage() {
  const gmailSales: GmailSaleWithCustomer[] = await gmailSaleOperations.findMany(
    {},
    {
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }
  );

  // Stats
  const stats = {
    total: gmailSales.length,
    pending: gmailSales.filter((s: GmailSaleWithCustomer) => s.status === 'PENDING').length,
    checking: gmailSales.filter((s: GmailSaleWithCustomer) => s.status === 'CHECKING').length,
    approved: gmailSales.filter((s: GmailSaleWithCustomer) => s.status === 'APPROVED').length,
    transferred: gmailSales.filter((s: GmailSaleWithCustomer) => s.status === 'TRANSFERRED').length,
    rejected: gmailSales.filter((s: GmailSaleWithCustomer) => s.status === 'REJECTED').length,
  };

  return <GmailSalesAdminClient gmailSales={gmailSales} stats={stats} />;
}
