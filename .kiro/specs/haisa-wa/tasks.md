# Implementation Plan

- [x] 1. Project Setup and Configuration
  - [x] 1.1 Initialize Next.js 14 project with TypeScript and App Router
    - Create Next.js project with `create-next-app`
    - Configure TypeScript strict mode
    - Set up path aliases in tsconfig.json
    - _Requirements: 13.1_
  - [x] 1.2 Set up Prisma with PostgreSQL/Neon
    - Install Prisma and initialize
    - Configure DATABASE_URL environment variable
    - Create initial schema with all models (User, Ticket, Attachment, Payment, AuditLog)
    - Run initial migration
    - _Requirements: 13.1, 13.4_
  - [x] 1.3 Configure environment variables structure
    - Create `.env.example` with all required variables
    - Set up `src/core/config/` directory with env loaders
    - Create `google.env.ts`, `payment.config.ts`, `auth.config.ts`
    - _Requirements: All_
  - [x] 1.4 Set up testing infrastructure
    - Install Vitest and fast-check
    - Configure vitest.config.ts
    - Create test utilities and helpers
    - _Requirements: Testing Strategy_

- [x] 2. Authentication Module
  - [x] 2.1 Implement NextAuth.js with Google provider
    - Install next-auth
    - Configure Google OAuth credentials
    - Create auth route handlers
    - Implement session callbacks for user role
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.2 Create User model integration with NextAuth
    - Implement Prisma adapter for NextAuth
    - Handle user creation/retrieval on sign-in
    - Add role field to user session
    - _Requirements: 1.2_
  - [x]* 2.3 Write property test for user authentication idempotence
    - **Property 1: User Authentication Idempotence**
    - **Validates: Requirements 1.2**

- [x] 3. Validation Module
  - [x] 3.1 Implement input validation functions
    - Create `src/core/validation/validators.ts`
    - Implement WhatsApp number validator (international format)
    - Implement sensitive keyword detector
    - Implement required fields checker
    - _Requirements: 2.4, 2.5, 2.6_
  - [x]* 3.2 Write property tests for validation




    - **Property 5: WhatsApp Number Validation**
    - **Property 6: Sensitive Keyword Blocking**
    - **Property 7: Required Fields Validation**
    - **Validates: Requirements 2.4, 2.5, 2.6**
  - [x] 3.3 Implement file validation functions
    - Create MIME type allowlist validator
    - Implement file size validator
    - Implement attachment count validator
    - _Requirements: 3.1, 3.2, 3.3_
  - [x]* 3.4 Write property test for file type validation
    - **Property 8: File Type Validation**
    - **Validates: Requirements 3.1**

- [x] 4. Ticket Service Core
  - [x] 4.1 Implement TicketNo generator
    - Create `src/core/tickets/ticketNo.ts`
    - Implement WAC-YYYY-NNNNNN format generator
    - Use database sequence for uniqueness
    - _Requirements: 2.2_
  - [x]* 4.2 Write property test for TicketNo format and uniqueness
    - **Property 3: TicketNo Format and Uniqueness**
    - **Validates: Requirements 2.2**
  - [x] 4.3 Implement ticket CRUD operations
    - Create `src/core/tickets/ticket.service.ts`
    - Implement createDraft with validation
    - Implement getById, getByCustomer, getAll
    - Implement updateStatus with state validation
    - _Requirements: 2.1, 7.2, 7.3_
  - [x]* 4.4 Write property test for ticket creation initial state
    - **Property 2: Ticket Creation Initial State**
    - **Validates: Requirements 2.1**
  - [x] 4.5 Implement ticket serialization/deserialization
    - Create JSON serialization helpers
    - Handle Date fields properly
    - Include relations in serialization
    - _Requirements: 13.5, 13.6_
  - [x]* 4.6 Write property test for ticket serialization round-trip
    - **Property 25: Ticket Serialization Round-Trip**
    - **Validates: Requirements 13.5, 13.6**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Payment Service
  - [x] 6.1 Implement payment provider abstraction
    - Create `src/core/payment/provider.ts` interface
    - Create `src/core/payment/midtrans.provider.ts` (or chosen provider)
    - Implement createOrder and verifyWebhook methods
    - _Requirements: 4.1_
  - [x] 6.2 Implement payment service
    - Create `src/core/payment/payment.service.ts`
    - Implement createOrder linking to ticket
    - Implement handleWebhook with status updates
    - Generate unique orderId
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x]* 6.3 Write property test for payment webhook state machine
    - **Property 10: Payment Webhook State Machine**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  - [x] 6.4 Implement draft ticket auto-cancellation
    - Create scheduled job/cron for cleanup
    - Query tickets older than 24h with DRAFT status
    - Update paymentStatus to EXPIRED
    - _Requirements: 4.6_
  - [x]* 6.5 Write property test for draft auto-cancellation
    - **Property 11: Draft Ticket Auto-Cancellation**
    - **Validates: Requirements 4.6**

- [x] 7. Audit Service
  - [x] 7.1 Implement audit logging service
    - Create `src/core/audit/audit.service.ts`
    - Implement log method with before/after diff
    - Implement getByTicket for history retrieval
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [x]* 7.2 Write property test for audit log completeness
    - **Property 19: Audit Log Completeness**
    - **Validates: Requirements 11.1, 11.2, 11.3**
  - [x]* 7.3 Write property test for audit log immutability
    - **Property 20: Audit Log Immutability**
    - **Validates: Requirements 11.4**

- [x] 8. RBAC and Access Control
  - [x] 8.1 Implement RBAC middleware
    - Create `src/core/auth/rbac.ts`
    - Implement role-based ticket filtering
    - Customer: own tickets only
    - Agent: assigned tickets
    - Admin: all tickets
    - _Requirements: 7.1, 8.1, 9.1, 9.4_
  - [x]* 8.2 Write property test for RBAC access control
    - **Property 17: RBAC Access Control**
    - **Validates: Requirements 7.1, 8.1, 9.1, 9.4**
  - [x] 8.3 Implement API authentication middleware
    - Create session validation middleware
    - Return 401 for unauthenticated requests
    - _Requirements: 12.3_
  - [x]* 8.4 Write property test for API authentication
    - **Property 22: API Authentication**
    - **Validates: Requirements 12.3**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Google Services
  - [x] 10.1 Implement Google configuration
    - Create `src/core/config/google.env.ts`
    - Load all Google-related env variables
    - Create `src/core/config/google.config.ts` for settings
    - _Requirements: 5.5_
  - [x] 10.2 Implement Apps Script client
    - Create `src/core/google/appsScript.client.ts`
    - Implement ticketCreated endpoint call
    - Implement ticketUpdated endpoint call
    - Add X-SYNC-SECRET header validation
    - _Requirements: 6.1, 6.3, 6.5_
  - [x]* 10.3 Write property test for Apps Script secret validation
    - **Property 16: Apps Script Secret Validation**
    - **Validates: Requirements 6.5**
  - [x] 10.4 Implement Drive client
    - Create `src/core/google/drive.client.ts`
    - Implement uploadFile to specific folder
    - Use service account credentials
    - _Requirements: 3.4, 5.4_
  - [x] 10.5 Implement Google sync orchestration
    - Create `src/core/google/sheets.sync.ts`
    - Orchestrate folder creation → row append → file upload
    - Store folderId, folderUrl, rowIndex in ticket
    - _Requirements: 5.1, 5.2, 5.3, 6.2_
  - [x]* 10.6 Write property tests for Google sync
    - **Property 12: Drive Folder Path Structure**
    - **Property 13: Drive Folder Record Persistence**
    - **Property 14: Sheets Row Index Persistence**
    - **Property 15: Sheets Sync Payload Completeness**
    - **Validates: Requirements 5.1, 5.3, 6.2, 6.4**

- [x] 11. Attachment Service
  - [x] 11.1 Implement attachment service
    - Create `src/core/attachments/attachment.service.ts`
    - Implement addAttachment with validation
    - Upload to Drive and store driveFileId/Url
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x]* 11.2 Write property test for drive upload persistence
    - **Property 9: Drive Upload Persistence**
    - **Validates: Requirements 3.5**

- [x] 12. WhatsApp Notification Service
  - [x] 12.1 Implement WhatsApp service with wwebjs
    - Create `src/core/whatsapp/whatsapp.service.ts`
    - Implement initialize for session management
    - Implement sendTicketNotification
    - Add retry logic (max 3 attempts)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x]* 12.2 Write property tests for WhatsApp notification
    - **Property 26: WhatsApp Notification Content**
    - **Property 27: Notification Retry Behavior**
    - **Validates: Requirements 10.2, 10.3**

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. API Routes - Customer
  - [x] 14.1 Implement ticket creation endpoint
    - Create `src/app/api/tickets/route.ts`
    - POST: Create draft ticket + payment order
    - GET: List customer's tickets
    - Apply validation and authentication
    - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2_
  - [x] 14.2 Implement ticket detail endpoint
    - Create `src/app/api/tickets/[id]/route.ts`
    - GET: Ticket details with attachments
    - Apply RBAC filtering
    - _Requirements: 7.3_
  - [x] 14.3 Implement attachment upload endpoint
    - Create `src/app/api/tickets/[id]/attachments/route.ts`
    - POST: Upload screenshot (only if PAID)
    - Apply file validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 14.4 Write property test for ticket list response fields

    - **Property 18: Ticket List Response Fields**
    - **Validates: Requirements 7.2**

- [x] 15. API Routes - Payment
  - [x] 15.1 Implement payment creation endpoint
    - Create `src/app/api/payments/create/route.ts`
    - POST: Create payment order for ticket
    - Return payment URL
    - _Requirements: 4.1_
  - [x] 15.2 Implement payment webhook endpoint
    - Create `src/app/api/webhooks/payment/route.ts`
    - POST: Handle payment gateway webhook
    - Update ticket status and trigger Google sync
    - Send WhatsApp notification on success
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  - [x]* 15.3 Write property test for webhook payload preservation
    - **Property 24: Webhook Payload Preservation**
    - **Validates: Requirements 13.3**

- [x] 16. API Routes - Operations (Agent/Admin)



  - [x] 16.1 Implement ops ticket list endpoint

    - Create `src/app/api/ops/tickets/route.ts`
    - GET: List tickets based on role
    - Apply RBAC filtering
    - _Requirements: 8.1, 9.1_

  - [x] 16.2 Implement ops ticket update endpoint

    - Create `src/app/api/ops/tickets/[id]/route.ts`
    - PATCH: Update status, assign agent, add notes
    - Create audit log entry
    - Trigger Google Sheets sync
    - _Requirements: 8.2, 8.3, 9.2, 9.3_

- [x] 17. Rate Limiting



  - [x] 17.1 Implement rate limiting middleware

    - Create `src/core/rateLimit/rateLimit.ts`
    - Implement per-customer submission limit
    - Use sliding window algorithm
    - _Requirements: 12.1_

  - [x]* 17.2 Write property test for rate limiting

    - **Property 21: Rate Limiting**
    - **Validates: Requirements 12.1**

- [x] 18. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.



- [x] 19. Customer Dashboard UI

  - [x] 19.1 Create customer dashboard layout

    - Create `src/app/(customer)/dashboard/page.tsx`
    - Implement ticket list view
    - Show status, payment status, created date
    - _Requirements: 7.1, 7.2_


  - [x] 19.2 Create ticket detail page

    - Create `src/app/(customer)/tickets/[id]/page.tsx`
    - Display full ticket info and attachments
    - Add attachment upload form (if PAID)
    - _Requirements: 7.3, 7.4_

  - [x] 19.3 Create ticket submission form

    - Create `src/app/(customer)/tickets/new/page.tsx`
    - Implement form with all required fields
    - Add client-side validation
    - Redirect to payment after submission
    - _Requirements: 2.1, 2.4, 2.5, 2.6_

  - [x] 19.4 Create payment page

    - Create `src/app/(customer)/tickets/[id]/pay/page.tsx`
    - Display payment instructions
    - Redirect to payment gateway
    - _Requirements: 4.1_



- [x] 20. Agent/Admin Dashboard UI

  - [x] 20.1 Create ops dashboard layout

    - Create `src/app/(ops)/dashboard/page.tsx`
    - Implement ticket list with filters
    - Show assignment and status
    - _Requirements: 8.1, 9.1_
  - [x] 20.2 Create ops ticket detail page


    - Create `src/app/(ops)/tickets/[id]/page.tsx`
    - Display ticket info with Drive folder link
    - Add status update controls
    - Add agent assignment (admin only)
    - Add internal notes field
    - _Requirements: 8.2, 8.3, 8.4, 9.2, 9.3_



- [x] 21. Google Apps Script Deployment

  - [x] 21.1 Create Apps Script project

    - Create `apps-script/Code.gs`
    - Implement doPost handler for all endpoints
    - Implement X-SYNC-SECRET validation
    - _Requirements: 6.5_



  - [x] 21.2 Implement ticket-created endpoint
    - Create monthly folder if not exists
    - Create ticket folder
    - Append row to Sheets
    - Return folderId, folderUrl, rowIndex
    - _Requirements: 5.1, 5.2, 6.1_
  - [x] 21.3 Implement ticket-updated endpoint
    - Find row by rowIndex
    - Update status, assignment, notes columns
    - _Requirements: 6.3_

- [x] 22. Final Integration and Polish


  - [x] 22.1 Implement error handling middleware


    - Create global error handler
    - Map errors to appropriate HTTP responses
    - Log errors for debugging
    - _Requirements: Error Handling section_
  - [x] 22.2 Add loading states and error UI


    - Implement loading skeletons
    - Add error boundaries
    - Display user-friendly error messages
    - _Requirements: UX_

  - [x]* 22.3 Write integration tests for main flows



    - Test ticket creation → payment → Google sync flow
    - Test status update → audit log → Sheets sync flow
    - _Requirements: All_

- [x] 23. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
