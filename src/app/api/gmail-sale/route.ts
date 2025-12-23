/**
 * Gmail Sale API Routes
 * Endpoint untuk submit dan list penjualan Gmail dengan encryption support
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { gmailSaleOperations } from '@/core/db/gmail-sale';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';
import { encrypt } from '@/core/security/encryption';

export const dynamic = 'force-dynamic';

/**
 * Generate sale number: GS-YYYYMMDD-XXXX
 */
async function generateSaleNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `GS-${dateStr}-`;
  
  // Find the latest sale number for today
  const latestSale = await gmailSaleOperations.findFirst(
    { saleNo: { startsWith: prefix } },
    { orderBy: { saleNo: 'desc' } }
  );
  
  let sequence = 1;
  if (latestSale) {
    const lastSeq = parseInt(latestSale.saleNo.slice(-4), 10);
    sequence = lastSeq + 1;
  }
  
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

/**
 * Sync to Google Sheets via Apps Script
 */
async function syncToGoogleSheets(data: {
  action: string;
  data: Record<string, unknown>;
}): Promise<{ success: boolean; folderId?: string; folderUrl?: string; rowIndex?: number }> {
  const syncUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const syncSecret = process.env.GOOGLE_SYNC_SECRET;
  
  if (!syncUrl || !syncSecret) {
    console.warn('Google Sheets sync not configured');
    return { success: false };
  }
  
  try {
    const response = await fetch(`${syncUrl}?secret=${syncSecret}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      console.error('Sync failed:', await response.text());
      return { success: false };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false };
  }
}

/**
 * POST /api/gmail-sale
 * Submit penjualan Gmail baru
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      gmailAddress,
      gmailPassword,
      paymentMethod,
      paymentProvider,
      paymentAccountNumber,
      paymentAccountName,
    } = body;

    // Validate required fields
    const errors: string[] = [];
    if (!gmailAddress) errors.push('gmailAddress');
    if (!gmailPassword) errors.push('gmailPassword');
    if (!paymentMethod) errors.push('paymentMethod');
    if (!paymentProvider) errors.push('paymentProvider');
    if (!paymentAccountNumber) errors.push('paymentAccountNumber');
    if (!paymentAccountName) errors.push('paymentAccountName');

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELD', fields: errors, message: 'Field wajib tidak lengkap' },
        { status: 400 }
      );
    }

    // Validate Gmail format
    if (!gmailAddress.toLowerCase().endsWith('@gmail.com')) {
      return NextResponse.json(
        { error: 'INVALID_GMAIL', message: 'Harus menggunakan domain @gmail.com' },
        { status: 400 }
      );
    }

    // Check if Gmail already submitted by this user
    const existingSale = await gmailSaleOperations.findFirst({
      gmailAddress: gmailAddress.toLowerCase(),
      customerId: authResult.user.id,
      status: { notIn: ['REJECTED'] },
    });

    if (existingSale) {
      return NextResponse.json(
        { error: 'DUPLICATE_GMAIL', message: 'Gmail ini sudah pernah diajukan' },
        { status: 400 }
      );
    }

    // Generate sale number
    const saleNo = await generateSaleNo();

    // Create Gmail Sale record
    const gmailSale = await gmailSaleOperations.create({
      saleNo,
      customerId: authResult.user.id,
      gmailAddress: gmailAddress.toLowerCase(),
      gmailPassword,
      paymentMethod,
      paymentProvider,
      paymentAccountNumber,
      paymentAccountName,
      status: 'PENDING',
    });

    // Sync to Google Sheets
    const syncResult = await syncToGoogleSheets({
      action: 'gmail-sale-created',
      data: {
        saleNo: gmailSale.saleNo,
        createdAt: gmailSale.createdAt.toISOString(),
        customerName: authResult.user.name || '-',
        customerEmail: authResult.user.email,
        gmailAddress: gmailSale.gmailAddress,
        gmailPassword: gmailSale.gmailPassword,
        paymentMethod: gmailSale.paymentMethod,
        paymentProvider: gmailSale.paymentProvider,
        paymentAccountNumber: gmailSale.paymentAccountNumber,
        paymentAccountName: gmailSale.paymentAccountName,
        status: gmailSale.status,
        adminNotes: '',
        proofImageUrl: '',
        lastUpdatedAt: gmailSale.updatedAt.toISOString(),
      },
    });

    // Update with Google Drive info if sync successful
    if (syncResult.success && syncResult.rowIndex) {
      const updateData: any = {
        googleDriveFolderId: syncResult.folderId,
        googleDriveFolderUrl: syncResult.folderUrl,
        googleSheetRowIndex: syncResult.rowIndex,
      };
      
      await gmailSaleOperations.update({ id: gmailSale.id }, updateData);
    }

    return NextResponse.json({
      gmailSale: {
        id: gmailSale.id,
        saleNo: gmailSale.saleNo,
        status: gmailSale.status,
        paymentMethod: gmailSale.paymentMethod,
        createdAt: gmailSale.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating gmail sale:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal membuat pengajuan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gmail-sale
 * List penjualan Gmail user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const gmailSales = await gmailSaleOperations.findMany(
      { customerId: authResult.user.id },
      {
        select: {
          id: true,
          saleNo: true,
          gmailAddress: true,
          paymentMethod: true,
          paymentProvider: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }
    );

    return NextResponse.json({ gmailSales });

  } catch (error) {
    console.error('Error listing gmail sales:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal memuat data' },
      { status: 500 }
    );
  }
}
