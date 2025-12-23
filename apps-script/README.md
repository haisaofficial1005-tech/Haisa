# Haisa WA - Google Apps Script

Script ini menangani sinkronisasi data tiket dan penjualan Gmail ke Google Drive dan Google Sheets.

## Features

### Ticket Management (Unblock WA)
- Creates Drive folders for ticket attachments
- Appends ticket data to Google Sheets
- Updates ticket status in Sheets

### Gmail Sale Management
- Creates Drive folders for Gmail sale records
- Appends Gmail sale data to separate sheet
- Updates sale status (PENDING → CHECKING → APPROVED/REJECTED → TRANSFERRED)

## Setup

### 1. Buat Project Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Klik "New Project"
3. Copy isi `Code.gs` ke editor
4. Simpan project dengan nama "Haisa WA Sync"

### 2. Konfigurasi Script Properties

1. Klik ⚙️ (Project Settings)
2. Scroll ke "Script Properties"
3. Tambahkan properties berikut:

| Property | Deskripsi |
|----------|-----------|
| `SYNC_SECRET` | Secret key untuk validasi request (sama dengan di .env) |
| `ROOT_FOLDER_ID` | ID folder Google Drive root untuk menyimpan tiket |
| `SPREADSHEET_ID` | ID Google Spreadsheet untuk data tiket |
| `SHEET_NAME` | Nama sheet untuk tiket (default: "Tickets") |
| `GMAIL_SALE_SHEET_NAME` | Nama sheet untuk Gmail sales (default: "GmailSales") |

### 3. Inisialisasi Spreadsheet

1. Buka spreadsheet yang akan digunakan
2. Di Apps Script editor, jalankan fungsi `initializeSheet()` untuk membuat header Tickets
3. Jalankan fungsi `initializeGmailSaleSheet()` untuk membuat header Gmail Sales

### 4. Deploy sebagai Web App

1. Klik "Deploy" > "New deployment"
2. Pilih type: "Web app"
3. Konfigurasi:
   - Description: "Haisa WA Sync v2"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Klik "Deploy"
5. Copy URL deployment

### 5. Update Environment Variables

Tambahkan URL deployment ke `.env`:

```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxx/exec
GOOGLE_SYNC_SECRET=your-secret-key
```

## Endpoints

### POST /exec

Semua request menggunakan method POST dengan parameter `secret` untuk autentikasi.

#### Health Check
```json
{ "action": "health" }
```

#### Ticket Created
```json
{
  "action": "ticket-created",
  "data": { ... }
}
```

#### Ticket Updated
```json
{
  "action": "ticket-updated",
  "data": { "rowIndex": 2, "status": "IN_PROGRESS", ... }
}
```

#### Gmail Sale Created
```json
{
  "action": "gmail-sale-created",
  "data": {
    "saleNo": "GS-20251220-0001",
    "createdAt": "2025-12-20T00:00:00.000Z",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "gmailAddress": "selling@gmail.com",
    "gmailPassword": "password123",
    "paymentMethod": "BANK",
    "paymentProvider": "BCA",
    "paymentAccountNumber": "1234567890",
    "paymentAccountName": "John Doe",
    "status": "PENDING",
    "adminNotes": "",
    "proofImageUrl": "",
    "lastUpdatedAt": "2025-12-20T00:00:00.000Z"
  }
}
```

#### Gmail Sale Updated
```json
{
  "action": "gmail-sale-updated",
  "data": {
    "rowIndex": 2,
    "status": "TRANSFERRED",
    "adminNotes": "Sudah ditransfer ke BCA",
    "proofImageUrl": "https://drive.google.com/...",
    "lastUpdatedAt": "2025-12-20T00:00:00.000Z"
  }
}
```

## Sheet Columns

### Tickets Sheet

| Column | Field | Description |
|--------|-------|-------------|
| A | TicketNo | Nomor tiket (WAC-YYYY-NNNNNN) |
| B | CreatedAt | Tanggal pembuatan |
| C | CustomerName | Nama customer |
| D | CustomerEmail | Email customer |
| E | WhatsAppNumber | Nomor WhatsApp |
| F | CountryRegion | Negara/Wilayah |
| G | IssueType | Jenis masalah |
| H | IncidentAt | Tanggal kejadian |
| I | Device | Perangkat |
| J | WhatsAppVersion | Versi WhatsApp |
| K | Status | Status tiket |
| L | PaymentStatus | Status pembayaran |
| M | AssignedAgent | Agent yang ditugaskan |
| N | DriveFolderUrl | URL folder Drive |
| O | AttachmentUrls | Link gambar di Drive |
| P | NotesInternal | Catatan internal |
| Q | LastUpdatedAt | Terakhir diupdate |

### Gmail Sales Sheet

| Column | Field | Description |
|--------|-------|-------------|
| A | SaleNo | Nomor penjualan (GS-YYYYMMDD-XXXX) |
| B | CreatedAt | Tanggal pembuatan |
| C | CustomerName | Nama customer |
| D | CustomerEmail | Email customer |
| E | GmailAddress | Alamat Gmail yang dijual |
| F | GmailPassword | Password Gmail |
| G | PaymentMethod | Metode (BANK/EWALLET) |
| H | PaymentProvider | Provider (BCA, OVO, dll) |
| I | PaymentAccountNumber | Nomor rekening/akun |
| J | PaymentAccountName | Nama pemilik rekening |
| K | Status | Status penjualan |
| L | AdminNotes | Catatan admin |
| M | ProofImageUrl | URL bukti transfer |
| N | DriveFolderUrl | URL folder Drive |
| O | LastUpdatedAt | Terakhir diupdate |

## Gmail Sale Status Flow

```
PENDING → CHECKING → APPROVED → TRANSFERRED
                  ↘ REJECTED
```

- **PENDING**: Baru disubmit, menunggu pengecekan
- **CHECKING**: Admin sedang mengecek akun Gmail
- **APPROVED**: Gmail valid, siap untuk transfer pembayaran
- **REJECTED**: Gmail tidak valid/tidak memenuhi kriteria
- **TRANSFERRED**: Pembayaran sudah ditransfer ke customer

## Troubleshooting

### Error: Unauthorized
- Pastikan `secret` parameter dikirim dengan benar
- Pastikan nilai `SYNC_SECRET` di Script Properties sama dengan di aplikasi

### Error: Folder not found
- Pastikan `ROOT_FOLDER_ID` valid dan script memiliki akses

### Error: Spreadsheet not found
- Pastikan `SPREADSHEET_ID` valid dan script memiliki akses
- Pastikan sheet dengan nama yang sesuai sudah ada
