# Implementasi Sistem Pembayaran QRIS

## Overview
Sistem pembayaran QRIS telah diimplementasi untuk memudahkan customer dalam melakukan pembayaran jual Gmail tanpa perlu mengisi detail rekening bank atau e-wallet.

## Fitur yang Diimplementasi

### 1. Opsi Pembayaran QRIS
- Ditambahkan opsi "QRIS (Scan & Pay)" pada form penjualan Gmail
- Ketika dipilih, customer tidak perlu mengisi detail rekening/e-wallet

### 2. Generate Kode Unik
- Sistem otomatis generate kode unik 2-3 digit (10-999)
- Nominal pembayaran = Harga base (Rp 50.000) + kode unik
- Contoh: Rp 50.000 + 123 = Rp 50.123

### 3. Tampilan QRIS
- Menampilkan gambar QRIS dari file `/qris.png`
- Menampilkan nominal yang harus dibayar dengan kode unik
- Instruksi pembayaran yang jelas

### 4. Upload Bukti Transfer
- Customer dapat upload bukti transfer setelah pembayaran
- File otomatis diupload ke Google Drive
- Mendukung format gambar (JPG, PNG, GIF) maksimal 5MB
- Drag & drop interface untuk kemudahan

### 5. Integrasi Google Drive
- Bukti transfer otomatis tersimpan di Google Drive
- File tersimpan dalam folder sesuai dengan sale number
- Link file tersinkron ke Google Sheets

### 6. Status Management
- Status otomatis berubah ke "CHECKING" setelah bukti diupload
- Admin dapat melihat bukti transfer dan mengubah status
- Timeline yang jelas untuk customer

## File yang Dimodifikasi/Ditambahkan

### Database Schema
- `prisma/schema.prisma`: Ditambahkan field QRIS di model GmailSale
  - `qrisAmount`: Nominal dengan kode unik
  - `qrisUniqueCode`: Kode unik 2-3 digit
  - `qrisPaymentProofUrl`: URL bukti transfer
  - `qrisPaymentProofDriveId`: Google Drive file ID

### Core Utilities
- `src/core/payment/qris.ts`: Utility untuk generate kode unik dan format currency
- `src/core/attachments/drive-upload.ts`: Utility untuk upload file ke Google Drive

### API Routes
- `src/app/api/gmail-sale/route.ts`: Updated untuk handle QRIS payment
- `src/app/api/gmail-sale/[id]/upload-proof/route.ts`: Endpoint upload bukti transfer

### UI Components
- `src/components/ui/qris-display.tsx`: Komponen tampilan QRIS
- `src/components/ui/proof-upload.tsx`: Komponen upload bukti transfer

### Pages
- `src/app/customer/gmail-sale/new/page.tsx`: Form dengan opsi QRIS
- `src/app/customer/gmail-sale/[id]/page.tsx`: Detail dengan QRIS dan upload
- `src/app/customer/gmail-sale/page.tsx`: List dengan info QRIS
- `src/app/ops/gmail-sales/page.tsx`: Admin view dengan info QRIS

### Apps Script
- `apps-script/Code.gs`: Ditambahkan fungsi upload file dan update QRIS data

## Flow Pembayaran QRIS

1. **Customer Submit Form**
   - Pilih "QRIS (Scan & Pay)" sebagai metode pembayaran
   - Sistem generate kode unik dan nominal total

2. **Tampilan QRIS**
   - Customer melihat kode QRIS dan nominal yang harus dibayar
   - Scan QRIS dengan aplikasi pembayaran

3. **Upload Bukti**
   - Setelah pembayaran, customer upload bukti transfer
   - File otomatis tersimpan ke Google Drive
   - Status berubah ke "CHECKING"

4. **Verifikasi Admin**
   - Admin melihat bukti transfer
   - Verifikasi nominal sesuai dengan kode unik
   - Update status sesuai hasil verifikasi

## Konfigurasi yang Diperlukan

### Environment Variables
```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
GOOGLE_SYNC_SECRET=your_secret_key
```

### Google Apps Script Properties
- `SYNC_SECRET`: Secret key untuk validasi
- `ROOT_FOLDER_ID`: ID folder root di Google Drive
- `SPREADSHEET_ID`: ID Google Sheets
- `GMAIL_SALE_SHEET_NAME`: Nama sheet untuk Gmail sales

### File Assets
- `/qris.png`: Gambar kode QRIS yang akan ditampilkan

## Keamanan

1. **File Upload Validation**
   - Hanya menerima file gambar
   - Maksimal ukuran 5MB
   - Validasi MIME type

2. **Access Control**
   - Customer hanya bisa upload bukti untuk sale mereka sendiri
   - Admin/ops dapat melihat semua data

3. **Google Drive Integration**
   - File tersimpan dengan nama yang unik (timestamp)
   - Akses file dibatasi dengan link sharing

## Testing

Untuk testing implementasi:

1. Jalankan development server: `npm run dev`
2. Buat akun customer dan login
3. Akses `/customer/gmail-sale/new`
4. Pilih "QRIS (Scan & Pay)" dan submit form
5. Lihat detail sale dengan kode QRIS
6. Test upload bukti transfer

## Catatan Implementasi

- Harga base Gmail sale saat ini fixed di Rp 50.000
- Kode unik di-generate random setiap kali ada sale baru
- File QRIS menggunakan gambar static `/qris.png`
- Untuk production, pertimbangkan menggunakan dynamic QRIS dengan nominal yang sudah ter-embed