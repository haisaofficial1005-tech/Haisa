# Haisa WA - Google Apps Script

Script ini menangani sinkronisasi data tiket ke Google Drive dan Google Sheets.

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
| `SHEET_NAME` | Nama sheet (default: "Tickets") |

### 3. Inisialisasi Spreadsheet

1. Buka spreadsheet yang akan digunakan
2. Buat sheet baru dengan nama "Tickets" (atau sesuai SHEET_NAME)
3. Di Apps Script editor, jalankan fungsi `initializeSheet()` untuk membuat header

### 4. Deploy sebagai Web App

1. Klik "Deploy" > "New deployment"
2. Pilih type: "Web app"
3. Konfigurasi:
   - Description: "Haisa WA Sync v1"
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
{
  "action": "health"
}
```

Response:
```json
{
  "status": "ok"
}
```

#### Ticket Created

```json
{
  "action": "ticket-created",
  "data": {
    "ticketNo": "WAC-2025-000001",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "whatsAppNumber": "+6281234567890",
    "countryRegion": "Indonesia",
    "issueType": "ACCOUNT_BANNED",
    "incidentAt": "2025-01-01T00:00:00.000Z",
    "device": "iPhone 14",
    "waVersion": "2.23.25.83",
    "status": "RECEIVED",
    "paymentStatus": "PAID",
    "assignedAgent": null,
    "notesInternal": null,
    "lastUpdatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

Response:
```json
{
  "success": true,
  "folderId": "xxx",
  "folderUrl": "https://drive.google.com/...",
  "rowIndex": 2
}
```

#### Ticket Updated

```json
{
  "action": "ticket-updated",
  "data": {
    "ticketNo": "WAC-2025-000001",
    "rowIndex": 2,
    "status": "IN_PROGRESS",
    "assignedAgent": "Agent Name",
    "notesInternal": "Some notes",
    "lastUpdatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

Response:
```json
{
  "success": true,
  "rowIndex": 2
}
```

## Troubleshooting

### Error: Unauthorized

- Pastikan `secret` parameter dikirim dengan benar
- Pastikan nilai `SYNC_SECRET` di Script Properties sama dengan di aplikasi

### Error: Folder not found

- Pastikan `ROOT_FOLDER_ID` valid dan script memiliki akses

### Error: Spreadsheet not found

- Pastikan `SPREADSHEET_ID` valid dan script memiliki akses
- Pastikan sheet dengan nama `SHEET_NAME` ada

## Columns

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
| O | NotesInternal | Catatan internal |
| P | LastUpdatedAt | Terakhir diupdate |
