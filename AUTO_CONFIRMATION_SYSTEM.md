# Auto Confirmation System - QRIS Payments

## Masalah Webhook di Development

Dalam development (localhost), webhook dari provider QRIS **tidak bisa berfungsi** karena:

1. **URL tidak dapat diakses dari internet** - Provider tidak bisa mengirim webhook ke `localhost:3000`
2. **Tidak ada konfigurasi webhook** - Provider QRIS perlu dikonfigurasi untuk mengirim webhook ke URL kita
3. **Development environment** - Webhook hanya berfungsi di production dengan domain publik
4. **Perlu pengajuan API** - Beberapa provider QRIS memerlukan pengajuan API khusus untuk webhook

## Solusi: Verifikasi Manual oleh Admin

Karena webhook tidak tersedia, sistem menggunakan **verifikasi manual** oleh admin:

### Halaman Verifikasi Pembayaran: `/ops/payment-verification`

**Fitur:**
- ✅ Lihat semua pembayaran PENDING
- ✅ Cari berdasarkan nominal dan kode unik
- ✅ Konfirmasi pembayaran satu per satu
- ✅ Auto-refresh setiap 30 detik (opsional)
- ✅ Lihat riwayat pembayaran terkonfirmasi hari ini

**Cara Penggunaan:**
1. Admin login ke sistem
2. Akses menu "Verifikasi Pembayaran" di sidebar
3. Cek dashboard QRIS provider untuk melihat pembayaran masuk
4. Cocokkan nominal dan kode unik dengan daftar di halaman
5. Klik "Konfirmasi" untuk mengubah status

### API Endpoints

#### 1. GET `/api/payments/pending-list`
Mendapatkan daftar pembayaran pending:
```json
{
  "success": true,
  "pendingCount": 4,
  "pendingPayments": [
    {
      "id": "...",
      "orderId": "QRIS-WAC-2025-000004-...",
      "amount": 50765,
      "uniqueCode": "765",
      "baseAmount": 50000,
      "ticket": {
        "ticketNo": "WAC-2025-000004",
        "customer": { "name": "Customer Name" }
      }
    }
  ],
  "recentConfirmed": [...]
}
```

#### 2. POST `/api/payments/manual-confirm`
Konfirmasi pembayaran manual:
```json
{
  "paymentId": "...",
  "orderId": "QRIS-WAC-2025-000004-...",
  "notes": "Verified via QRIS dashboard"
}
```

Response:
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "ticketStatus": "RECEIVED",
  "paymentStatus": "PAID"
}
```

## Flow Verifikasi Manual

### Langkah-langkah Admin:

```
1. Customer bayar QRIS dengan nominal + kode unik
   ↓
2. Pembayaran masuk ke dashboard QRIS provider
   ↓
3. Admin buka /ops/payment-verification
   ↓
4. Admin cocokkan nominal (contoh: Rp 50.765)
   ↓
5. Admin klik "Konfirmasi" pada pembayaran yang sesuai
   ↓
6. Status ticket berubah: DRAFT → RECEIVED
   ↓
7. Status payment berubah: PENDING → PAID
```

### Contoh Verifikasi:

**Di Dashboard QRIS Provider:**
- Nominal: Rp 50.765
- Waktu: 23/12/2025, 13:21:09
- Metode: GOPAY

**Di Halaman Verifikasi:**
- Ticket: WAC-2025-000004
- Nominal: Rp 50.765
- Kode Unik: 765
- Customer: tezaa

**Cocok!** → Klik "Konfirmasi"

## Scripts untuk Development

### 1. Reset Payment untuk Testing
```bash
npx tsx scripts/reset-payment-for-testing.mjs
```

### 2. Cek Status Semua Ticket
```bash
npx tsx scripts/check-all-tickets.mjs
```

### 3. Cek Data Payment
```bash
npx tsx scripts/check-payment-data.mjs
```

## Akses Admin

### Menu Sidebar:
- **Dashboard** - `/ops/dashboard`
- **Tiket WA** - `/ops/tickets`
- **Jual Gmail** - `/ops/gmail-sales`
- **Verifikasi Pembayaran** - `/ops/payment-verification` ← BARU

### Login Admin:
- URL: `/login`
- Role yang diizinkan: ADMIN, OPS, AGENT

## Security

### Authentication:
- Semua endpoint memerlukan login
- Hanya role ADMIN, OPS, AGENT yang dapat mengakses
- Session-based authentication

### Audit Trail:
- Setiap konfirmasi dicatat dengan:
  - ID admin yang mengkonfirmasi
  - Nama admin
  - Waktu konfirmasi
  - Notes (opsional)

## Files yang Terlibat

### Halaman Admin:
- `src/app/ops/payment-verification/page.tsx` - Halaman verifikasi
- `src/app/ops/layout.tsx` - Layout dengan menu sidebar

### API Endpoints:
- `src/app/api/payments/pending-list/route.ts` - List pending payments
- `src/app/api/payments/manual-confirm/route.ts` - Konfirmasi manual
- `src/app/api/payments/verify-qris/route.ts` - Verifikasi QRIS
- `src/app/api/webhooks/payment/route.ts` - Webhook (untuk production)

### Scripts:
- `scripts/reset-payment-for-testing.mjs` - Reset untuk testing
- `scripts/check-all-tickets.mjs` - Cek status ticket
- `scripts/check-payment-data.mjs` - Cek data payment

## Kesimpulan

Sistem verifikasi pembayaran QRIS sekarang menggunakan **verifikasi manual** oleh admin karena:
- Webhook memerlukan pengajuan API khusus ke provider
- Development di localhost tidak bisa menerima webhook
- Verifikasi manual lebih aman dan terkontrol

Admin dapat dengan mudah:
1. Melihat pembayaran yang masuk di dashboard QRIS provider
2. Mencocokkan dengan daftar di halaman verifikasi
3. Mengkonfirmasi pembayaran dengan satu klik
4. Status ticket otomatis berubah ke RECEIVED