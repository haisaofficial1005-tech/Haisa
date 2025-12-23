/**
 * Gmail Sale Detail API Routes
 * Endpoint untuk get detail dan update status (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { gmailSaleOperations } from '@/core/db/gmail-sale';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

/**
 * Sync update to Google Sheets
 */
async function syncUpdateToGoogleSheets(data: {
  action: string;
  data: Record<string, unknown>;
}): Promise<{ success: boolean }> {
  const syncUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const syncSecret = process.env.GOOGLE_SYNC_SECRET;
  
  if (!syncUrl || !syncSecret) {
    return { success: false };
  }
  
  try {
    const response = await fetch(`${syncUrl}?secret=${syncSecret}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    return { success: response.ok };
  } catch {
    return { success: false };
  }
}

/**
 * GET /api/gmail-sale/[id]
 * Get detail penjualan Gmail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const gmailSale = await gmailSaleOperations.findUnique(
      { id },
      {
        customer: {
          select: { id: true, name: true, email: true },
        },
      }
    );

    if (!gmailSale) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check access: customer can only see their own, admin/ops can see all
    const isOwner = gmailSale.customerId === authResult.user.id;
    const isAdmin = authResult.user.role === 'ADMIN' || authResult.user.role === 'OPS';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Akses ditolak' },
        { status: 403 }
      );
    }

    // Hide password for non-admin
    const responseData = {
      ...gmailSale,
      gmailPassword: isAdmin ? gmailSale.gmailPassword : '********',
    };

    return NextResponse.json({ gmailSale: responseData });

  } catch (error) {
    console.error('Error getting gmail sale:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal memuat data' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/gmail-sale/[id]
 * Update status penjualan Gmail (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    // Only admin/ops can update
    if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'OPS') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Hanya admin yang dapat mengubah status' },
        { status: 403 }
      );
    }

    const gmailSale = await gmailSaleOperations.findUnique({ id });

    if (!gmailSale) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, adminNotes, proofImageUrl } = body;

    // Validate status
    const validStatuses = ['PENDING', 'CHECKING', 'APPROVED', 'REJECTED', 'TRANSFERRED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // Update record
    const updatedSale = await gmailSaleOperations.update(
      { id },
      {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(proofImageUrl !== undefined && { proofImageUrl }),
      }
    );

    // Sync to Google Sheets
    if (gmailSale.googleSheetRowIndex) {
      await syncUpdateToGoogleSheets({
        action: 'gmail-sale-updated',
        data: {
          rowIndex: gmailSale.googleSheetRowIndex,
          status: updatedSale.status,
          adminNotes: updatedSale.adminNotes || '',
          proofImageUrl: updatedSale.proofImageUrl || '',
          lastUpdatedAt: updatedSale.updatedAt.toISOString(),
        },
      });
    }

    return NextResponse.json({
      gmailSale: {
        id: updatedSale.id,
        saleNo: updatedSale.saleNo,
        status: updatedSale.status,
        adminNotes: updatedSale.adminNotes,
        proofImageUrl: updatedSale.proofImageUrl,
        updatedAt: updatedSale.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error updating gmail sale:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal mengubah data' },
      { status: 500 }
    );
  }
}
