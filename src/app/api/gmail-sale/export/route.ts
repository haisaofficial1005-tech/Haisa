/**
 * Gmail Sale Export API
 * Endpoint untuk export credentials Gmail yang sudah approved
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';
import { gmailSaleOperations } from '@/core/db/gmail-sale';
import { prisma } from '@/core/db';

export const dynamic = 'force-dynamic';

interface ExportData {
  saleNo: string;
  gmailAddress: string;
  gmailPassword: string;
  customerName: string;
  customerEmail: string;
  approvedAt: string;
  verificationNotes: string;
  suggestedPrice: number;
}

/**
 * Generate CSV format
 */
function generateCSV(data: ExportData[]): string {
  const headers = [
    'Sale No',
    'Gmail Address', 
    'Password',
    'Customer Name',
    'Customer Email',
    'Approved Date',
    'Suggested Price',
    'Verification Notes'
  ];
  
  const rows = data.map(item => [
    item.saleNo,
    item.gmailAddress,
    item.gmailPassword,
    item.customerName,
    item.customerEmail,
    item.approvedAt,
    item.suggestedPrice.toString(),
    `"${item.verificationNotes.replace(/"/g, '""')}"` // Escape quotes in CSV
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Generate Excel-compatible CSV (with BOM for proper UTF-8 display)
 */
function generateExcelCSV(data: ExportData[]): Buffer {
  const csv = generateCSV(data);
  // Add BOM for proper UTF-8 display in Excel
  const bom = '\uFEFF';
  return Buffer.from(bom + csv, 'utf8');
}

/**
 * POST /api/gmail-sale/export
 * Export Gmail credentials untuk admin
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    // Check admin permission
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Hanya admin yang dapat melakukan export' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { saleIds, format = 'csv' }: { saleIds: string[]; format: 'csv' | 'excel' } = body;

    // Validate input
    if (!saleIds || !Array.isArray(saleIds) || saleIds.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Sale IDs tidak valid' },
        { status: 400 }
      );
    }

    // Get approved sales only
    const gmailSales = await gmailSaleOperations.findMany(
      {
        id: { in: saleIds },
        status: 'APPROVED'
      },
      {
        include: {
          customer: {
            select: { name: true, email: true }
          }
        }
      }
    );

    if (gmailSales.length === 0) {
      return NextResponse.json(
        { error: 'NO_DATA', message: 'Tidak ada data yang dapat di-export' },
        { status: 400 }
      );
    }

    // Decrypt passwords and prepare export data
    const exportData: ExportData[] = await Promise.all(
      gmailSales.map(async (sale) => {
        const decryptedPassword = await gmailSaleOperations.getDecryptedPassword(sale.id);
        
        // Parse verification data for notes
        let verificationNotes = '';
        if (sale.verificationData) {
          try {
            const verification = JSON.parse(sale.verificationData);
            verificationNotes = verification.notes || '';
          } catch (error) {
            console.error('Failed to parse verification data:', error);
          }
        }

        return {
          saleNo: sale.saleNo,
          gmailAddress: sale.gmailAddress,
          gmailPassword: decryptedPassword || '***DECRYPT_ERROR***',
          customerName: sale.customer.name || '-',
          customerEmail: sale.customer.email,
          approvedAt: sale.verifiedAt?.toISOString() || sale.updatedAt.toISOString(),
          verificationNotes,
          suggestedPrice: sale.suggestedPrice || 0,
        };
      })
    );

    // Generate file content
    let fileContent: Buffer;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'excel') {
      fileContent = generateExcelCSV(exportData);
      mimeType = 'text/csv; charset=utf-8';
      fileExtension = 'csv';
    } else {
      fileContent = Buffer.from(generateCSV(exportData), 'utf8');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    // Log export activity
    await prisma.auditLog.create({
      data: {
        actorId: authResult.user.id,
        ticketId: saleIds[0], // Use first sale ID as reference
        action: 'EXPORT_GMAIL_CREDENTIALS',
        before: '',
        after: JSON.stringify({
          exportedCount: exportData.length,
          saleIds: saleIds,
          format: format,
          timestamp: new Date().toISOString()
        }),
      },
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `gmail-export-${timestamp}.${fileExtension}`;

    // Return file
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileContent.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error exporting gmail sales:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal melakukan export' },
      { status: 500 }
    );
  }
}