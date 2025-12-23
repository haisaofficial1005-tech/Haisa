/**
 * Ticket API Routes
 * Requirements: 2.1, 2.2, 2.3, 7.1, 7.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';
import { buildTicketWhereClause } from '@/core/auth/rbac';
import { createDraft } from '@/core/tickets/ticket.service';
import { paymentService } from '@/core/payment/payment.service';
import { 
  isValidWhatsAppNumber, 
  validateDescription, 
} from '@/core/validation/validators';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tickets
 * Creates a new ticket draft with screenshots
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    // Parse FormData
    const formData = await request.formData();
    
    const whatsAppNumber = formData.get('whatsAppNumber') as string;
    const countryRegion = formData.get('countryRegion') as string;
    const issueType = formData.get('issueType') as string;
    const incidentAt = formData.get('incidentAt') as string;
    const device = formData.get('device') as string;
    const description = formData.get('description') as string;

    // Collect screenshot files
    const screenshots: File[] = [];
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`screenshot_${i}`) as File | null;
      if (file && file.size > 0) {
        screenshots.push(file);
      }
    }

    // Validate required fields
    const errors: string[] = [];
    if (!whatsAppNumber) errors.push('whatsAppNumber');
    if (!countryRegion) errors.push('countryRegion');
    if (!issueType) errors.push('issueType');
    if (!incidentAt) errors.push('incidentAt');
    if (!device) errors.push('device');
    if (!description) errors.push('description');
    
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELD', fields: errors, message: 'Field wajib tidak lengkap' },
        { status: 400 }
      );
    }

    // Validate WhatsApp number
    if (!isValidWhatsAppNumber(whatsAppNumber)) {
      return NextResponse.json(
        { error: 'INVALID_WA_NUMBER', message: 'Format nomor WhatsApp tidak valid' },
        { status: 400 }
      );
    }

    // Validate description
    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.valid) {
      return NextResponse.json(
        { error: 'SENSITIVE_CONTENT', message: descriptionValidation.errors[0]?.message || 'Deskripsi mengandung kata terlarang' },
        { status: 400 }
      );
    }

    // Require at least 1 screenshot
    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: 'NO_SCREENSHOTS', message: 'Minimal 1 screenshot wajib diunggah' },
        { status: 400 }
      );
    }

    // Create ticket draft
    const ticket = await createDraft({
      customerId: authResult.user.id,
      whatsAppNumber,
      countryRegion,
      issueType,
      incidentAt: new Date(incidentAt),
      device,
      waVersion: '-', // Not required anymore
      description,
    });

    // Store screenshots with file data (base64) for later upload to Drive
    for (const file of screenshots) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      await prisma.attachment.create({
        data: {
          ticketId: ticket.id,
          uploaderId: authResult.user.id,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          fileData: base64Data, // Store file data temporarily until uploaded to Drive
        },
      });
    }

    // Create payment order
    const { paymentOrder } = await paymentService.createOrder({
      ticketId: ticket.id,
      amount: 49500,
      customerEmail: authResult.user.email,
      customerName: authResult.user.name,
      description: `Pembayaran tiket ${ticket.ticketNo}`,
    });

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus,
        createdAt: ticket.createdAt,
      },
      payment: {
        orderId: paymentOrder.orderId,
        paymentUrl: paymentOrder.paymentUrl,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        expiresAt: paymentOrder.expiresAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal membuat tiket' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tickets
 * Lists tickets for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    // Get all tickets with related data for admin/ops/agent
    if (['ADMIN', 'OPS', 'AGENT'].includes(authResult.user.role)) {
      const tickets = await prisma.ticket.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
            },
          },
          payments: {
            select: {
              id: true,
              orderId: true,
              amount: true,
              status: true,
              provider: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        tickets,
      });
    }

    // For customers, only show their own tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        customer: {
          phone: authResult.user.phone,
        },
      },
      select: {
        id: true,
        ticketNo: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        issueType: true,
        whatsAppNumber: true,
        countryRegion: true,
        assignedAgentId: true,
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tickets });

  } catch (error) {
    console.error('Error listing tickets:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal memuat tiket' },
      { status: 500 }
    );
  }
}
