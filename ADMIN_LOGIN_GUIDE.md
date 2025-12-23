# Admin Login Guide - Haisa WA

## ✅ SISTEM ADMIN SUDAH BERFUNGSI PENUH!

### 🚀 Cara Login sebagai Admin

1. **Buka halaman login:** `http://localhost:3001/login`
2. **Masukkan kredensial admin:**
   - **Nomor WhatsApp:** `6281234567890`
   - **Nama:** `Admin Haisa WA` (opsional, bisa dikosongkan)
3. **Klik "Masuk"**
4. **Otomatis diarahkan ke:** `/ops/dashboard`

### 👤 Akun yang Tersedia

| Role | Phone | Name | Access |
|------|-------|------|--------|
| **ADMIN** | `6281234567890` | Admin Haisa WA | Semua fitur admin |
| **OPS** | `6281234567891` | OPS User | Operasional |
| **AGENT** | `6281234567892` | Agent User | Agent support |
| **CUSTOMER** | `6281234567893` | Customer User | Customer portal |

### 🎛️ Menu Admin yang Tersedia

#### 1. **Dashboard** (`/ops/dashboard`)
- ✅ Overview sistem dengan statistik real-time
- ✅ Quick actions untuk akses cepat
- ✅ Status sistem dan aktivitas terbaru

#### 2. **Tiket WA** (`/ops/tickets`) ⭐ **BARU**
- ✅ Kelola semua ticket unblock WhatsApp
- ✅ Update status ticket (DRAFT → RECEIVED → IN_PROGRESS → RESOLVED → CLOSED)
- ✅ Assign agent ke ticket
- ✅ Filter berdasarkan status ticket dan pembayaran
- ✅ Lihat detail customer dan pembayaran

#### 3. **Jual Gmail** (`/ops/gmail-sales`)
- ✅ Kelola penjualan akun Gmail
- ✅ Verifikasi akun Gmail
- ✅ Proses pembayaran

#### 4. **Verifikasi Pembayaran** (`/ops/payment-verification`) ⭐ **FITUR UTAMA**
- ✅ Lihat pembayaran QRIS yang pending
- ✅ **Konfirmasi pembayaran** dengan satu klik
- ✅ **Reject pembayaran** dengan alasan
- ✅ **Edit status pembayaran** yang sudah dikonfirmasi
- ✅ Auto-refresh setiap 30 detik
- ✅ Riwayat pembayaran terkonfirmasi hari ini
- ✅ Pencarian berdasarkan nominal dan kode unik

#### 5. **Kelola Agents** (`/ops/agents`) ⭐ **BARU - ADMIN ONLY**
- ✅ Lihat semua agent dan status mereka
- ✅ Ubah role user (CUSTOMER → AGENT → OPS → ADMIN)
- ✅ Aktifkan/nonaktifkan agent
- ✅ Tambah agent baru
- ✅ Kelola permissions dan hak akses
- ✅ Audit trail untuk semua perubahan

### 💳 Cara Verifikasi Pembayaran QRIS

#### Langkah-langkah Verifikasi:

1. **Login sebagai Admin** dengan nomor `6281234567890`

2. **Akses Menu "Verifikasi Pembayaran"** di sidebar kiri

3. **Cek Dashboard QRIS Provider** (GoPay, DANA, OVO, dll)
   - Lihat pembayaran yang masuk
   - Catat nominal dan waktu pembayaran

4. **Cocokkan di Halaman Verifikasi**
   - Cari pembayaran dengan nominal yang sama
   - Pastikan kode unik cocok (3 digit terakhir)
   - Periksa nama customer dan nomor WhatsApp

5. **Pilih Aksi:**
   - **Konfirmasi**: Klik tombol hijau "Konfirmasi" untuk menerima pembayaran
   - **Reject**: Klik tombol merah "Reject" untuk menolak pembayaran

6. **Status Otomatis Berubah:**
   - **Konfirmasi**: Payment `PENDING` → `PAID`, Ticket `DRAFT` → `RECEIVED`
   - **Reject**: Payment `PENDING` → `REJECTED`, Ticket tetap `DRAFT`

#### Fitur Edit Pembayaran Terkonfirmasi:

Untuk pembayaran yang sudah dikonfirmasi, admin dapat:
- **Ubah ke Pending**: Kembalikan status ke pending untuk review ulang
- **Reject**: Ubah status menjadi rejected jika ada kesalahan

### 🎫 Cara Kelola Tiket WA

#### Fitur Kelola Tiket:

1. **Akses Menu "Tiket WA"** di sidebar

2. **Filter Tiket:**
   - Filter berdasarkan status ticket
   - Filter berdasarkan status pembayaran

3. **Update Status Tiket:**
   - **DRAFT**: Tiket baru, belum ada pembayaran
   - **RECEIVED**: Pembayaran sudah diterima
   - **IN_PROGRESS**: Sedang diproses oleh agent
   - **RESOLVED**: Masalah sudah diselesaikan
   - **CLOSED**: Tiket ditutup

4. **Assign Agent:**
   - Pilih agent dari dropdown
   - Agent akan bertanggung jawab menangani tiket

### 👥 Cara Kelola Agents (Admin Only)

#### Fitur Kelola Agents:

1. **Akses Menu "Kelola Agents"** (hanya untuk ADMIN)

2. **Lihat Daftar Agents:**
   - Semua user dengan role ADMIN, OPS, AGENT
   - Status aktif/nonaktif
   - Permissions yang dimiliki

3. **Ubah Role User:**
   - CUSTOMER → AGENT → OPS → ADMIN
   - Otomatis mendapat permissions sesuai role

4. **Tambah Agent Baru:**
   - Klik "Tambah Agent"
   - Isi nama, nomor WhatsApp, dan role
   - Agent bisa langsung login dengan nomor tersebut

5. **Kelola Permissions:**
   - Klik jumlah permissions untuk melihat detail
   - Permissions otomatis berdasarkan role:
     - **ADMIN**: Semua permissions
     - **OPS**: Kelola tickets, payments, Gmail sales
     - **AGENT**: Lihat dan edit tickets, lihat payments

#### Contoh Verifikasi:

**Di Dashboard QRIS Provider:**
```
Pembayaran Masuk:
- Nominal: Rp 50.738
- Waktu: 23/12/2025, 14:45:30
- Dari: Customer (628123456789)
```

**Di Halaman Verifikasi:**
```
Ticket: WAC-2025-000006
Customer: Customer User (6281234567893)
Nominal: Rp 50.738
Kode Unik: 738
Status: PENDING
```

**✅ Cocok!** → Pilih "Konfirmasi" atau "Reject"

### 📊 Data Test yang Tersedia

Sistem sudah dilengkapi dengan data test:
- **6 tickets** dengan berbagai jenis masalah dan status
- **Multiple pembayaran** dengan status berbeda (PENDING, PAID, REJECTED)
- **4 agents** dengan role berbeda (ADMIN, OPS, AGENT, CUSTOMER)
- **Audit trail** untuk semua aktivitas admin

### 🔧 Scripts Bantuan

#### Cek Status Semua User:
```bash
npx tsx scripts/check-all-users.mjs
```

#### Test Semua Fitur Baru:
```bash
npx tsx scripts/test-new-features.mjs
```

#### Buat Test Ticket Baru:
```bash
npx tsx scripts/create-test-ticket.mjs
```

#### Test Payment Verification:
```bash
npx tsx scripts/test-payment-verification.mjs
```

### 🔒 Keamanan & Hak Akses

#### Role-based Access Control:
- ✅ **ADMIN**: Akses semua fitur, kelola agents, ubah role
- ✅ **OPS**: Kelola tickets, payments, Gmail sales, assign agents
- ✅ **AGENT**: Lihat dan edit tickets, lihat payments
- ✅ **CUSTOMER**: Hanya akses customer portal

#### Audit Trail:
- ✅ Setiap konfirmasi/reject pembayaran dicatat
- ✅ Setiap perubahan status ticket dicatat
- ✅ Setiap assignment agent dicatat
- ✅ Setiap perubahan role user dicatat

### 🎯 Fitur Unggulan Baru

#### 1. **Multi-Action Payment Verification**
- ✅ Konfirmasi pembayaran
- ✅ Reject pembayaran dengan alasan
- ✅ Edit status pembayaran yang sudah dikonfirmasi
- ✅ Audit trail lengkap untuk semua aksi

#### 2. **Comprehensive Ticket Management**
- ✅ 5 status ticket yang jelas (DRAFT → CLOSED)
- ✅ Agent assignment dengan dropdown
- ✅ Filter berdasarkan status ticket dan pembayaran
- ✅ Lihat detail customer dan pembayaran dalam satu tabel

#### 3. **Advanced Agent Management**
- ✅ Role hierarchy: CUSTOMER → AGENT → OPS → ADMIN
- ✅ Permission system berdasarkan role
- ✅ Tambah agent baru langsung dari admin panel
- ✅ Status aktif/nonaktif untuk kontrol akses
- ✅ Audit trail untuk semua perubahan role

#### 4. **Enhanced Security**
- ✅ Role-based menu visibility
- ✅ API endpoint protection berdasarkan role
- ✅ Prevent admin dari mengubah role sendiri
- ✅ Session validation untuk semua admin actions

### 🚨 Troubleshooting

#### Jika Login Gagal:
1. ✅ Pastikan nomor WhatsApp benar: `6281234567890`
2. ✅ Pastikan server berjalan di `localhost:3001`
3. ✅ Cek console browser untuk error
4. ✅ Coba refresh halaman dan login ulang

#### Jika Tidak Bisa Akses Menu Admin:
1. ✅ Pastikan login dengan nomor admin yang benar
2. ✅ Cek role user dengan script: `npx tsx scripts/check-all-users.mjs`
3. ✅ Logout dan login ulang jika perlu

#### Jika Menu Tidak Muncul:
- **Menu "Kelola Agents"**: Hanya muncul untuk role ADMIN
- **Menu "Tiket WA"**: Muncul untuk ADMIN, OPS, AGENT
- **Menu "Verifikasi Pembayaran"**: Muncul untuk ADMIN, OPS, AGENT

#### Jika Pembayaran Tidak Muncul:
1. ✅ Pastikan payment status `PENDING` dan provider `QRIS`
2. ✅ Klik tombol "Refresh" di halaman verifikasi
3. ✅ Aktifkan "Auto Refresh" untuk update otomatis
4. ✅ Cek data dengan: `npx tsx scripts/check-payment-data.mjs`

### 🎉 Status Implementasi

| Fitur | Status | Keterangan |
|-------|--------|------------|
| ✅ Admin Login | **SELESAI** | Phone-based auth working |
| ✅ Admin Dashboard | **SELESAI** | Real-time stats & quick actions |
| ✅ Payment Verification | **SELESAI** | Konfirmasi, reject, edit status |
| ✅ Ticket Management | **SELESAI** | CRUD tickets, assign agents |
| ✅ Agent Management | **SELESAI** | Role management, permissions |
| ✅ Session Management | **SELESAI** | 30-day cookie sessions |
| ✅ Role-based Access | **SELESAI** | ADMIN/OPS/AGENT access control |
| ✅ Audit Trail | **SELESAI** | Full activity logging |
| ✅ Auto Refresh | **SELESAI** | 30-second intervals |
| ✅ Search & Filter | **SELESAI** | Multiple filter options |
| ✅ Test Data | **SELESAI** | 6 tickets, multiple payments, 4 agents |

## 🎊 SISTEM LENGKAP DAN SIAP DIGUNAKAN!

Admin sekarang memiliki kontrol penuh atas:
- ✅ **Verifikasi Pembayaran**: Konfirmasi, reject, dan edit status
- ✅ **Kelola Tiket**: Update status dan assign agent
- ✅ **Kelola Agents**: Tambah, ubah role, dan kelola permissions
- ✅ **Audit Trail**: Tracking semua aktivitas admin
- ✅ **Role-based Security**: Akses berdasarkan level user

Semua fitur telah ditest dan berfungsi dengan baik!