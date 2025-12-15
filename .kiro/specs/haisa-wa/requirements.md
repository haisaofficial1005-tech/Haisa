# Requirements Document

## Introduction

Haisa WA adalah aplikasi web untuk mengelola pengaduan terkait WhatsApp. Sistem ini memungkinkan customer untuk mengajukan keluhan, melakukan pembayaran, dan mengunggah bukti screenshot. Tim penanganan dapat mengelola tiket melalui dashboard admin dengan sinkronisasi otomatis ke Google Drive dan Google Sheets untuk monitoring operasional.

## Glossary

- **Ticket**: Unit pengaduan yang dibuat oleh customer, berisi informasi keluhan dan bukti screenshot
- **Customer**: Pengguna yang mengajukan pengaduan WhatsApp
- **Agent**: Tim penanganan yang mengelola dan menyelesaikan tiket
- **Admin**: Pengguna dengan akses penuh untuk mengelola sistem dan agent
- **Draft**: Status tiket sebelum pembayaran dikonfirmasi
- **Payment Gateway**: Layanan pihak ketiga untuk memproses pembayaran
- **Google Sync Service**: Layanan Apps Script untuk sinkronisasi data ke Google Drive dan Sheets
- **Attachment**: File screenshot yang diunggah sebagai bukti pengaduan
- **TicketNo**: Nomor tiket dengan format WAC-YYYY-NNNNNN

## Requirements

### Requirement 1: Customer Authentication

**User Story:** As a customer, I want to login using my Google account, so that I can securely access the complaint system without creating a new account.

#### Acceptance Criteria

1. WHEN a customer clicks the login button THEN the System SHALL redirect to Google OAuth authentication flow
2. WHEN Google authentication succeeds THEN the System SHALL create or retrieve the customer profile and establish a session
3. WHEN Google authentication fails THEN the System SHALL display an error message and return to the login page
4. WHEN a customer clicks logout THEN the System SHALL terminate the session and redirect to the home page

### Requirement 2: Ticket Draft Creation

**User Story:** As a customer, I want to create a complaint ticket with my WhatsApp issue details, so that I can report my problem to the support team.

#### Acceptance Criteria

1. WHEN a customer submits the complaint form with valid data THEN the System SHALL create a Ticket with status DRAFT and paymentStatus PENDING
2. WHEN a customer submits the form THEN the System SHALL generate a unique TicketNo in format WAC-YYYY-NNNNNN
3. WHEN a Ticket draft is created THEN the System SHALL create a payment order via Payment Gateway
4. WHEN the form contains invalid WhatsApp number format THEN the System SHALL reject the submission and display validation error
5. WHEN the form description contains sensitive keywords (OTP, password) THEN the System SHALL block the submission and display a warning
6. THE System SHALL require the following fields: WhatsApp number, country/region, issue type, incident date, device type, WhatsApp version, and description

### Requirement 3: Screenshot Upload

**User Story:** As a customer, I want to upload screenshots as evidence for my complaint, so that the support team can better understand my issue.

#### Acceptance Criteria

1. WHEN a customer uploads files THEN the System SHALL validate file type against allowlist (PNG, JPG, WEBP)
2. WHEN a customer uploads a file exceeding 10MB THEN the System SHALL reject the upload and display size limit error
3. WHEN a customer attempts to upload more than 5 files per ticket THEN the System SHALL reject additional uploads
4. WHEN payment status is PAID THEN the System SHALL upload files to the ticket's Google Drive folder
5. WHEN file upload to Google Drive succeeds THEN the System SHALL store the driveFileId and driveFileUrl in the Attachment record

### Requirement 4: Payment Processing

**User Story:** As a customer, I want to pay for my complaint ticket, so that my issue can be processed by the support team.

#### Acceptance Criteria

1. WHEN a payment order is created THEN the System SHALL generate a unique orderId and redirect customer to payment page
2. WHEN Payment Gateway sends a success webhook THEN the System SHALL update paymentStatus to PAID and ticket status to RECEIVED
3. WHEN Payment Gateway sends a failed webhook THEN the System SHALL update paymentStatus to FAILED and keep ticket status as DRAFT
4. WHEN Payment Gateway sends an expired webhook THEN the System SHALL update paymentStatus to EXPIRED
5. WHEN payment succeeds THEN the System SHALL trigger Google Sync Service to create Drive folder and append Sheets row
6. WHEN a draft ticket exceeds 24 hours without payment THEN the System SHALL automatically cancel the ticket

### Requirement 5: Google Drive Synchronization

**User Story:** As a system operator, I want ticket attachments stored in organized Google Drive folders, so that the support team can easily access evidence files.

#### Acceptance Criteria

1. WHEN Google Sync is triggered for a new ticket THEN the System SHALL create a folder structure ROOT_DRIVE_FOLDER/YYYY-MM/TicketNo/
2. WHEN a monthly folder does not exist THEN the System SHALL create the monthly folder before creating the ticket folder
3. WHEN ticket folder is created THEN the System SHALL store googleDriveFolderId and googleDriveFolderUrl in the Ticket record
4. WHEN screenshots are uploaded THEN the System SHALL place files in the ticket's Drive folder
5. THE System SHALL use Google Service Account credentials for all Drive API operations

### Requirement 6: Google Sheets Synchronization

**User Story:** As a system operator, I want ticket data synchronized to Google Sheets, so that the operations team can monitor tickets without technical access.

#### Acceptance Criteria

1. WHEN a ticket status changes to RECEIVED THEN the System SHALL append a new row to the Tickets sheet via Apps Script
2. WHEN a row is appended THEN the System SHALL store the rowIndex in the Ticket record for future updates
3. WHEN ticket status or assignment changes THEN the System SHALL update the corresponding row in Sheets via Apps Script
4. THE System SHALL include these columns: TicketNo, CreatedAt, CustomerName, CustomerEmail, WhatsAppNumber, Country/Region, IssueType, IncidentAt, Device, WhatsAppVersion, Status, PaymentStatus, AssignedAgent, DriveFolderUrl, NotesInternal, LastUpdatedAt
5. WHEN Apps Script endpoint is called THEN the System SHALL validate X-SYNC-SECRET header before processing

### Requirement 7: Customer Dashboard

**User Story:** As a customer, I want to view my submitted tickets and their status, so that I can track the progress of my complaints.

#### Acceptance Criteria

1. WHEN a customer accesses the dashboard THEN the System SHALL display only tickets belonging to that customer
2. WHEN viewing ticket list THEN the System SHALL show TicketNo, status, paymentStatus, createdAt, and issue type
3. WHEN a customer clicks a ticket THEN the System SHALL display full ticket details including attachments
4. WHEN a ticket requires additional information THEN the System SHALL allow customer to add comments or attachments

### Requirement 8: Agent Dashboard

**User Story:** As an agent, I want to manage assigned tickets, so that I can process and resolve customer complaints efficiently.

#### Acceptance Criteria

1. WHEN an agent accesses the dashboard THEN the System SHALL display tickets based on assignment policy
2. WHEN an agent updates ticket status THEN the System SHALL record the change in AuditLog and sync to Google Sheets
3. WHEN an agent adds internal notes THEN the System SHALL store notes in the Ticket record and sync to Sheets
4. WHEN viewing a ticket THEN the System SHALL provide a clickable link to the Google Drive folder
5. THE System SHALL support these ticket statuses: DRAFT, RECEIVED, IN_REVIEW, NEED_MORE_INFO, IN_PROGRESS, RESOLVED, CLOSED, REJECTED

### Requirement 9: Admin Management

**User Story:** As an admin, I want to manage agents and view all tickets, so that I can oversee operations and assign workload.

#### Acceptance Criteria

1. WHEN an admin accesses the system THEN the System SHALL display all tickets regardless of assignment
2. WHEN an admin assigns a ticket to an agent THEN the System SHALL update assignedAgentId and sync to Google Sheets
3. WHEN an admin changes ticket status THEN the System SHALL record the action in AuditLog with before/after state
4. THE System SHALL enforce RBAC: customers see own tickets only, agents see assigned tickets, admins see all tickets

### Requirement 10: WhatsApp Notification

**User Story:** As a support team member, I want to receive WhatsApp notifications for new tickets, so that I can respond quickly to customer complaints.

#### Acceptance Criteria

1. WHEN a ticket status changes to RECEIVED THEN the System SHALL send a WhatsApp notification to the designated team number
2. WHEN sending notification THEN the System SHALL include TicketNo, customer name, issue type, and dashboard link
3. WHEN WhatsApp notification fails THEN the System SHALL log the error and retry up to 3 times
4. THE System SHALL use wwebjs library for WhatsApp Web integration

### Requirement 11: Audit Logging

**User Story:** As a system administrator, I want all ticket changes logged, so that I can track accountability and investigate issues.

#### Acceptance Criteria

1. WHEN any ticket field is modified THEN the System SHALL create an AuditLog entry with actorId, action, before state, and after state
2. WHEN status changes THEN the System SHALL record the specific status transition in the AuditLog
3. WHEN assignment changes THEN the System SHALL record the previous and new assignedAgentId
4. THE System SHALL store AuditLog entries with timestamp and never delete them

### Requirement 12: Rate Limiting and Security

**User Story:** As a system operator, I want protection against abuse, so that the system remains available and secure.

#### Acceptance Criteria

1. WHEN a customer submits tickets exceeding rate limit THEN the System SHALL reject submissions temporarily
2. WHEN file upload contains disallowed MIME type THEN the System SHALL reject the upload
3. WHEN API endpoint receives request without valid authentication THEN the System SHALL return 401 Unauthorized
4. WHEN Apps Script endpoint receives request without valid X-SYNC-SECRET THEN the System SHALL reject the request
5. THE System SHALL validate and sanitize all user inputs before processing

### Requirement 13: Data Persistence

**User Story:** As a system operator, I want reliable data storage, so that ticket information is never lost.

#### Acceptance Criteria

1. THE System SHALL use PostgreSQL (Neon) as the primary database for tickets, attachments, payments, and audit logs
2. WHEN a ticket is created THEN the System SHALL generate a UUID for the id field
3. WHEN storing payment webhook data THEN the System SHALL preserve the rawPayload JSON for debugging
4. THE System SHALL maintain referential integrity between Ticket, Attachment, Payment, and AuditLog tables
5. WHEN serializing ticket data for API responses THEN the System SHALL use consistent JSON format
6. WHEN deserializing ticket data from database THEN the System SHALL reconstruct the complete ticket object with all relations
