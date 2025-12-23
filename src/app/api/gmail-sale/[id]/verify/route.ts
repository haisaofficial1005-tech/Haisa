/**
 * Gmail Sale Verification API
 * Endpoint untuk verifikasi Gmail sale oleh admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';
import { gmailSaleOperations, VerificationChecklist } from '@/core/db/gmail-sale';
import { prisma } from '@/core/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gmail-sale/[id]/verify
 * Verifikasi Gmail sale oleh admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    // Check admin permission
    if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'OPS') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Hanya admin yang dapat melakukan verifikasi' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, verificationData }: { action: 'approve' | 'reject'; verificationData: VerificationChecklist } = body;

    // Validate input
    if (!action || !verificationData) {
      return NextResponse.json(
        { error: 'MISSING_DATA', message: 'Data verifikasi tidak lengkap' },
        { status: 400 }
      );
    }

    // Check if Gmail sale exists
    const gmailSale = await gmailSaleOperations.findUnique({ id: params.id });
    if (!gmailSale) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Gmail sale tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (gmailSale.status !== 'PENDING' && gmailSale.status !== 'CHECKING') {
      return NextResponse.json(
        { error: 'ALREADY_PROCESSED', message: 'Gmail sale sudah diproses sebelumnya' },
        { status: 400 }
      );
    }

    // Update verification
    const updatedSale = await gmailSaleOperations.updateVerification(
      params.id,
      verificationData,
      authResult.user.id
    );

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorId: authResult.user.id,
        ticketId: params.id, // Using ticketId field for Gmail sale ID (reusing existing field)
        action: `GMAIL_SALE_${action.toUpperCase()}`,
        before: JSON.stringify({ status: gmailSale.status }),
        after: JSON.stringify({ 
          status: updatedSale.status,
          verificationData: verificationData,
          suggestedPrice: updatedSale.suggestedPrice
        }),
      },
    });

    // TODO: Send notification to customer
    // await sendStatusUpdateNotification(params.id, updatedSale.status);

    return NextResponse.json({
      success: true,
      gmailSale: {
        id: updatedSale.id,
        status: updatedSale.status,
        suggestedPrice: updatedSale.suggestedPrice,
        verifiedAt: updatedSale.verifiedAt,
      },
    });

  } catch (error) {
    console.error('Error verifying gmail sale:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal memproses verifikasi' },
      { status: 500 }
    );
  }
}