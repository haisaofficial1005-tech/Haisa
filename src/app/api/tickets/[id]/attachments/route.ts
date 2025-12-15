/**
 * Attachment Upload API Routes
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse, forbiddenResponse } from '@/core/auth/middleware';
import { canAccessTicket, canAddAttachment } from '@/core/auth/rbac';
import { attachmentService, MAX_ATTACHMENTS_PER_TICKET } from '@/core/attachments/attachment.service';
import { 
  isValidMimeType, 
  isValidFileSize, 
  ALLOWED_MIME_TYPES, 
  MAX_FILE_SIZE 
} from '@/core/validation/validators';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tickets/[id]/attachments
 * Uploads a screenshot attachment
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate authentication
    const authResult = await validateSession();
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const { id: ticketId } = await params;
    const user = authResult.user;

    // Get ticket with attachments
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attachments: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check access (Property 17: RBAC)
    if (!canAccessTicket(user, ticket)) {
      return forbiddenResponse('You do not have access to this ticket');
    }

    // Check if ticket is PAID (only allow uploads after payment)
    if (ticket.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'PAYMENT_NOT_PAID', message: 'Attachments can only be uploaded after payment' },
        { status: 402 }
      );
    }

    // Check attachment count limit (Requirements: 3.3)
    if (ticket.attachments.length >= MAX_ATTACHMENTS_PER_TICKET) {
      return NextResponse.json(
        { 
          error: 'MAX_ATTACHMENTS', 
          message: `Maximum ${MAX_ATTACHMENTS_PER_TICKET} attachments per ticket` 
        },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (Property 8: File Type Validation)
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        { 
          error: 'INVALID_FILE_TYPE', 
          message: `File type '${file.type}' is not allowed`,
          allowedTypes: ALLOWED_MIME_TYPES 
        },
        { status: 400 }
      );
    }

    // Validate file size (Requirements: 3.2)
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        { 
          error: 'FILE_TOO_LARGE', 
          message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` 
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Add attachment (Property 9: Drive Upload Persistence)
    const result = await attachmentService.addAttachment({
      ticketId,
      uploaderId: user.id,
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
    });

    return NextResponse.json({
      attachment: {
        id: result.attachment.id,
        fileName: result.attachment.fileName,
        mimeType: result.attachment.mimeType,
        size: result.attachment.size,
        driveFileId: result.attachment.driveFileId,
        driveFileUrl: result.attachment.driveFileUrl,
        createdAt: result.attachment.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to upload attachment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tickets/[id]/attachments
 * Lists attachments for a ticket
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate authentication
    const authResult = await validateSession();
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const { id: ticketId } = await params;
    const user = authResult.user;

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check access
    if (!canAccessTicket(user, ticket)) {
      return forbiddenResponse('You do not have access to this ticket');
    }

    // Get attachments
    const attachments = await attachmentService.getByTicket(ticketId);

    return NextResponse.json({ attachments });

  } catch (error) {
    console.error('Error listing attachments:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to list attachments' },
      { status: 500 }
    );
  }
}
