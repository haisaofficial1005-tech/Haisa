# Sistem Verifikasi Pembayaran QRIS

## Overview
Sistem verifikasi pembayaran QRIS yang memungkinkan admin untuk memverifikasi dan mengkonfirmasi pembayaran berdasarkan nominal dan kode unik 3 digit.

## Fitur Utama

### 1. Generate Kode Unik 3 Digit
- **Fungsi**: `generateQrisUniqueCode()`
- **Range**: 100-999 (selalu 3 digit)
- **Tujuan**: Memudahkan identifikasi dan verifikasi pembayaran

### 2. Sistem Verifikasi Pembayaran
- **Endpoint**: `POST /api/payments/verify-qris`
- **Parameter**: 
  - `amount`: Nominal total pembayaran (base + kode unik)
  - `uniqueCode`: Kode unik 3 digit
  - `orderId`: (Opsional) Order ID spesifik

### 3. Konfirmasi Pembayaran
- **Endpoint**: `POST /api/payments/confirm-qris`
- **Fungsi**: Mengkonfirmasi pembayaran dan mengubah status
- **Trigger**: Google Sheets sync, WhatsApp notification

### 4. Interface Admin
- **Halaman**: `/ops/qris-verification`
- **Fitur**: 
  - Pencarian pembayaran berdasarkan nominal dan kode unik
  - Konfirmasi pembayaran dengan catatan
  - Real-time status update

## Flow Pembayaran QRIS

### 1. Customer Side
```
1. Customer buat tiket/gmail sale
2. Pilih pembayaran QRIS
3. Sistem generate kode unik 3 digit (contoh: 123)
4. Nominal total = Base amount (50.000) + Kode unik (123) = 50.123
5. Customer scan QRIS dan bayar sesuai nominal
6. Customer dapat bukti pembayaran dengan nominal 50.123
```

### 2. Admin Side
```
1. Admin terima notifikasi pembayaran
2. Admin buka halaman verifikasi QRIS
3. Input nominal yang diterima (50.123) dan kode unik (123)
4. Sistem cari pembayaran yang match
5. Admin konfirmasi pembayaran
6. Status otomatis berubah ke PAID
7. Trigger Google Sheets sync dan WhatsApp notification
```

## API Endpoints

### Verify QRIS Payment
```http
POST /api/payments/verify-qris
Content-Type: application/json

{
  "amount": 50123,
  "uniqueCode": "123",
  "orderId": "QRIS-WAC-2025-000001-1734876543210" // optional
}
```

**Response Success:**
```json
{
  "success": true,
  "payment": {
    "id": "payment-id",
    "orderId": "QRIS-WAC-2025-000001-1734876543210",
    "amount": 50123,
    "uniqueCode": "123",
    "status": "PENDING",
    "createdAt": "2025-12-22T13:00:00.000Z"
  },
  "ticket": {
    "id": "ticket-id",
    "ticketNo": "WAC-2025-000001",
    "status": "DRAFT",
    "paymentStatus": "PENDING"
  },
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "Payment found and ready for confirmation"
}
```

### Confirm QRIS Payment
```http
POST /api/payments/confirm-qris
Content-Type: application/json

{
  "paymentId": "payment-id",
  "orderId": "QRIS-WAC-2025-000001-1734876543210",
  "confirmedAmount": 50123,
  "uniqueCode": "123",
  "notes": "Pembayaran dikonfirmasi via transfer BCA"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "QRIS payment confirmed successfully",
  "payment": {
    "id": "payment-id",
    "orderId": "QRIS-WAC-2025-000001-1734876543210",
    "amount": 50123,
    "status": "PAID"
  },
  "ticket": {
    "id": "ticket-id",
    "ticketNo": "WAC-2025-000001",
    "status": "RECEIVED",
    "paymentStatus": "PAID"
  },
  "attachmentUrls": []
}
```

## Database Schema

### Payment Table
```sql
-- Existing fields
id, ticketId, provider, orderId, amount, currency, status, rawPayload, createdAt, updatedAt

-- rawPayload contains:
{
  "baseAmount": 50000,
  "uniqueCode": "123",
  "totalAmount": 50123,
  "paymentMethod": "QRIS",
  "confirmedAt": "2025-12-22T13:05:00.000Z", // when confirmed
  "confirmedBy": "admin-user-id",
  "confirmedAmount": 50123,
  "adminNotes": "Pembayaran dikonfirmasi via transfer BCA"
}
```

## Security Features

### 1. Authentication & Authorization
- Hanya admin/ops yang bisa verifikasi dan konfirmasi
- Session validation untuk semua endpoint

### 2. Data Validation
- Validasi nominal pembayaran
- Validasi kode unik 3 digit
- Cross-check dengan data di database

### 3. Audit Trail
- Semua konfirmasi tercatat dengan timestamp
- ID admin yang mengkonfirmasi tersimpan
- Catatan admin tersimpan untuk audit

## Error Handling

### Common Errors
- `PAYMENT_NOT_FOUND`: Tidak ada pembayaran yang match
- `UNIQUE_CODE_MISMATCH`: Kode unik tidak sesuai
- `AMOUNT_MISMATCH`: Nominal tidak sesuai
- `MULTIPLE_MATCHES`: Ada beberapa pembayaran dengan kriteria sama
- `INVALID_STATUS`: Status pembayaran bukan PENDING

## Testing

### Manual Testing Steps
1. Buat tiket baru dengan pembayaran QRIS
2. Catat nominal dan kode unik yang di-generate
3. Buka halaman `/ops/qris-verification`
4. Input nominal dan kode unik
5. Konfirmasi pembayaran
6. Verifikasi status berubah ke PAID

### API Testing
```bash
# Test verify payment
curl -X POST http://localhost:3000/api/payments/verify-qris \
  -H "Content-Type: application/json" \
  -d '{"amount": 50123, "uniqueCode": "123"}'

# Test confirm payment
curl -X POST http://localhost:3000/api/payments/confirm-qris \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "payment-id",
    "orderId": "order-id",
    "confirmedAmount": 50123,
    "uniqueCode": "123",
    "notes": "Test confirmation"
  }'
```

## Monitoring & Analytics

### Key Metrics
- Jumlah pembayaran QRIS per hari
- Waktu rata-rata konfirmasi pembayaran
- Success rate konfirmasi
- Pembayaran yang belum dikonfirmasi

### Logs
- Semua verifikasi dan konfirmasi tercatat di server logs
- Error logs untuk troubleshooting
- Audit logs untuk compliance

## Future Enhancements

### 1. Automated Verification
- Integrasi dengan bank API untuk auto-verify
- Webhook dari payment gateway untuk real-time update

### 2. Bulk Operations
- Konfirmasi multiple pembayaran sekaligus
- Export data pembayaran untuk reconciliation

### 3. Mobile App
- Mobile app untuk admin verifikasi on-the-go
- Push notification untuk pembayaran baru

### 4. Analytics Dashboard
- Real-time dashboard untuk monitoring pembayaran
- Grafik dan statistik pembayaran QRIS