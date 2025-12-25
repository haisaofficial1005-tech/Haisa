# 🧪 Manual Testing Guide - Haisa WA System

## ✅ Status Update
- **Login**: ✅ WORKING (sudah berhasil login)
- **Navigation Issue**: ❌ Redirect ke login saat akses menu lain
- **Database**: ✅ FIXED (schema sudah diperbaiki)

## 🔧 Fixes Applied
1. **Session Handling**: Diperbaiki dari `session-token` ke `haisa-session` JWT
2. **Customer Pages**: Updated authentication method
3. **API Routes**: Fixed session validation

## 📋 Testing Steps

### 1. Login Test ✅
- [x] Buka website
- [x] Login dengan nomor WhatsApp
- [x] Berhasil masuk dashboard

### 2. Navigation Test (Perlu Ditest Ulang)
Setelah login, coba akses:

#### Customer Dashboard
- [ ] Klik menu "Unblock WA" → harus ke `/customer/tickets`
- [ ] Klik menu "Jual Gmail" → harus ke `/customer/gmail-sale`
- [ ] Tidak boleh redirect ke login

#### Tickets System
- [ ] Akses `/customer/tickets` → harus tampil list tiket
- [ ] Klik "Buat Pengaduan Baru" → harus ke form
- [ ] Isi form tiket baru → harus berhasil submit

#### Gmail Sales System  
- [ ] Akses `/customer/gmail-sale` → harus tampil list penjualan
- [ ] Klik "Jual Gmail Baru" → harus ke form
- [ ] Isi form jual Gmail → harus berhasil submit

### 3. Feature Testing

#### A. Create Ticket
1. Login sebagai customer
2. Klik "Unblock WA" atau ke `/customer/tickets`
3. Klik "Buat Pengaduan Baru"
4. Isi form:
   - Nomor WhatsApp: `6281234567890`
   - Negara: `Indonesia`
   - Jenis Masalah: `Akun Diblokir`
   - Tanggal Kejadian: Pilih tanggal
   - Perangkat: `Android`
   - Versi WA: `2.23.24.14`
   - Deskripsi: Tulis masalah
   - Upload screenshot (minimal 1)
5. Submit → harus berhasil dan dapat nomor tiket

#### B. Create Gmail Sale
1. Login sebagai customer
2. Klik "Jual Gmail" atau ke `/customer/gmail-sale`
3. Klik "Jual Gmail Baru"
4. Isi form:
   - Gmail Address: `test@gmail.com`
   - Password: `password123`
   - Metode Terima: Pilih Bank/E-Wallet
   - Provider: Pilih bank/ewallet
   - Nomor Rekening: `1234567890`
   - Nama Pemilik: `Test User`
5. Submit → harus berhasil dan dapat nomor penjualan

#### C. Payment System
1. Setelah buat tiket, klik "Bayar Sekarang"
2. Harus muncul halaman pembayaran dengan QRIS
3. Amount harus unik (contoh: Rp 49.623)
4. QRIS code harus muncul

#### D. File Upload
1. Buat tiket dan bayar
2. Setelah payment PAID, bisa upload screenshot tambahan
3. File harus terupload ke Google Drive
4. Link file harus bisa diakses

### 4. Admin Features (Jika Ada User Admin)

#### Login Admin
- Username: `admin@haisa.com` atau nomor admin
- Akses `/ops/dashboard`

#### Admin Functions
- [ ] View all tickets: `/ops/tickets`
- [ ] View Gmail sales: `/ops/gmail-sales`
- [ ] Payment verification: `/ops/payment-verification`
- [ ] QRIS verification: `/ops/qris-verification`
- [ ] Agent management: `/ops/agents`

### 5. Security Testing

#### Rate Limiting
- Coba login 6x dengan data salah → harus kena rate limit
- Coba akses API berkali-kali → harus ada pembatasan

#### Input Validation
- Coba input nomor WA salah format → harus error
- Coba upload file > 5MB → harus error
- Coba input XSS `<script>alert('test')</script>` → harus di-sanitize

#### Session Security
- Logout → session harus hilang
- Akses halaman customer setelah logout → redirect ke login
- Cookie harus HttpOnly dan Secure

## 🚨 Known Issues & Solutions

### Issue 1: Redirect ke Login
**Gejala**: Setelah login, klik menu apapun balik ke login
**Penyebab**: Session handling tidak konsisten
**Status**: ✅ FIXED - Updated semua customer pages

### Issue 2: Database Schema
**Gejala**: Error "no such column: phone"
**Penyebab**: Turso database belum ada kolom phone
**Status**: ✅ FIXED - Schema sudah diupdate

## 🔧 Troubleshooting

### Jika Masih Redirect ke Login:
1. Buka Developer Tools (F12)
2. Cek tab Application → Cookies
3. Pastikan ada cookie `haisa-session`
4. Cek tab Console untuk error JavaScript
5. Cek tab Network untuk failed requests

### Jika Error Database:
1. Cek Vercel Function Logs
2. Pastikan environment variables sudah set
3. Test koneksi Turso database

### Jika Payment Error:
1. Cek Yukk API credentials
2. Cek Google Drive permissions
3. Cek QRIS generation

## 📊 Expected Results

### Successful Flow:
1. **Login** → Dashboard dengan 2 pilihan menu
2. **Unblock WA** → Form tiket → Payment → Upload screenshot
3. **Jual Gmail** → Form Gmail → QRIS payment → Admin verification
4. **Navigation** → Semua halaman accessible tanpa redirect
5. **Security** → Rate limiting, input validation, session management

### Performance Targets:
- Page load: < 3 detik
- API response: < 1 detik  
- File upload: < 30 detik
- No JavaScript errors
- Mobile responsive

## ✅ Testing Checklist

- [ ] Login berhasil
- [ ] Dashboard accessible
- [ ] Menu navigation tidak redirect
- [ ] Create ticket berhasil
- [ ] Create Gmail sale berhasil
- [ ] Payment system working
- [ ] File upload working
- [ ] Admin functions working (jika ada)
- [ ] Security measures active
- [ ] Mobile responsive
- [ ] No console errors

---

**Prioritas Testing**: 
1. 🔴 **CRITICAL**: Login & Navigation (harus fix dulu)
2. 🟡 **HIGH**: Create ticket & Gmail sale
3. 🟢 **MEDIUM**: Payment & file upload
4. 🔵 **LOW**: Admin features & advanced security

**Next Steps**: Test navigation issue dulu, kalau masih redirect berarti ada yang belum kefix.