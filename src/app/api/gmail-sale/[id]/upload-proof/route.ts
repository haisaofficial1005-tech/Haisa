/**
 * Upload QRIS Payment Proof API
 * Endpoint untuk upload bukti transfer QRIS
 */

import { NextRequest, NextResponse } from 'next/server';
import { gmailSaleOperations } from '@/core/db/gmail-sale';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';
import { uploadBase64ToGoogleDrive } from '@/core/attachments/drive-upload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gmail-sale/[id]/upload-proof
 * Upload bukti transfer QRIS
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await validateSession(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    // Get Gmail Sale record
    const gmailSale = await gmailSaleOperations.findUnique({ id });
    
    if (!gmailSale || gmailSale.customerId !== authResult.user.id) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if payment method is QRIS
    if (gmailSale.paymentMethod !== 'QRIS') {
      return NextResponse.json(
        { error: 'INVALID_PAYMENT_METHOD', message: 'Upload bukti hanya untuk pembayaran QRIS' },
        { status: 400 }
      );
    }

    // Check if proof already uploaded
    if (gmailSale.qrisPaymentProofUrl) {
      return NextResponse.json(
        { error: 'ALREADY_UPLOADED', message: 'Bukti transfer sudah diupload' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'INVALID_FILE_TYPE', message: 'File harus berupa gambar' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', message: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `qris-proof-${gmailSale.saleNo}-${timestamp}.${file.type.split('/')[1]}`;

    // Upload to Google Drive
    const uploadResult = await uploadBase64ToGoogleDrive(
      base64,
      fileName,
      file.type,
      gmailSale.googleDriveFolderId || undefined
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: 'UPLOAD_FAILED', message: 'Gagal upload ke Google Drive' },
        { status: 500 }
      );
    }

    // Update Gmail Sale record
    await gmailSaleOperations.update(
      { id: gmailSale.id },
      {
        qrisPaymentProofUrl: uploadResult.fileUrl,
        qrisPaymentProofDriveId: uploadResult.fileId,
        status: 'CHECKING', // Change status to checking when proof is uploaded
      }
    );

    // Sync to Google Sheets
    const syncUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    const syncSecret = process.env.GOOGLE_SYNC_SECRET;
    
    if (syncUrl && syncSecret && gmailSale.googleSheetRowIndex) {
      try {
        await fetch(`${syncUrl}?secret=${syncSecret}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-gmail-sale',
            data: {
              rowIndex: gmailSale.googleSheetRowIndex,
              status: 'CHECKING',
              qrisPaymentProofUrl: uploadResult.fileUrl,
              lastUpdatedAt: new Date().toISOString(),
            },
          }),
        });
      } catch (error) {
        console.error('Failed to sync to Google Sheets:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bukti transfer berhasil diupload',
      fileUrl: uploadResult.fileUrl,
    });

  } catch (error) {
    console.error('Error uploading proof:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal upload bukti transfer' },
      { status: 500 }
    );
  }
}