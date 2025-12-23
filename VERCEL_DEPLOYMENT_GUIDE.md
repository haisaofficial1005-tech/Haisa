# Panduan Deployment Vercel - Haisa WA

## ✅ Status Push ke GitHub
Semua file telah berhasil di-push ke GitHub repository. Total 121 files dengan 16,833 insertions.

## 🚨 CRITICAL: Database Connection Fix

**Error yang terjadi**: `SERVER_ERROR: Server returned HTTP status 401`

**Penyebab**: Environment variables Turso belum dikonfigurasi dengan benar di Vercel.

**Solusi**:
1. Pastikan environment variables berikut sudah diset di Vercel Dashboard:
   ```
   TURSO_DATABASE_URL=libsql://haisa-sulthonaj.aws-ap-northeast-1.turso.io
   TURSO_AUTH_TOKEN=your-turso-token-from-env-vercel-file
   ```

2. **PENTING**: Jangan gunakan `DATABASE_URL` untuk Turso, gunakan `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN`

3. Redeploy setelah environment variables diset

## 🚀 Langkah Deployment ke Vercel

### 1. Import Project ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Login dengan akun GitHub
3. Klik "New Project"
4. Import repository `haisaofficial1005-tech/Haisa`

### 2. Environment Variables yang Harus Dikonfigurasi
**PENTING**: Copy semua environment variables dari `.env.vercel` ke Vercel Dashboard, tapi ganti nilai-nilai sensitif dengan yang sebenarnya!

**PENTING**: Ganti `YOUR_VERCEL_URL` dengan URL Vercel yang sebenarnya!

```bash
# Database (Turso)
TURSO_DATABASE_URL=your-turso-database-url-from-env-vercel
TURSO_AUTH_TOKEN=your-turso-auth-token-from-env-vercel

# NextAuth.js (GANTI dengan URL Vercel!)
NEXTAUTH_URL=https://haisa.vercel.app
NEXTAUTH_SECRET=k8X2mP9vL4nQ7wR1tY6uI3oA5sD8fG0hJ2kZ4xC6vB

# JWT Security
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long
ENCRYPTION_KEY=your-encryption-key-32-chars!!

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-from-env-vercel
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-env-vercel

# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email-from-env-vercel
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=your-private-key-from-env-vercel
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-drive-folder-id-from-env-vercel

# Google Apps Script
GOOGLE_APPS_SCRIPT_URL=your-apps-script-url-from-env-vercel
GOOGLE_SYNC_SECRET=your-sync-secret-from-env-vercel

# Payment Gateway (Yukk)
PAYMENT_PROVIDER=yukk
YUKK_CLIENT_ID=your-yukk-client-id-from-env-vercel
YUKK_CLIENT_SECRET=your-yukk-client-secret-from-env-vercel
YUKK_API_KEY=your-yukk-api-key-from-env-vercel
PAYMENT_IS_PRODUCTION=false
PAYMENT_AMOUNT=49500
PAYMENT_CURRENCY=IDR

# App Settings (GANTI dengan URL Vercel!)
APP_URL=https://haisa.vercel.app

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=3600000

# Security
LOG_LEVEL=info
NODE_ENV=production
```

### 3. Build Settings
Vercel akan otomatis mendeteksi Next.js project. Build command sudah dikonfigurasi di `package.json`:
- Build Command: `npm run build` (sudah include `prisma generate`)
- Output Directory: `.next`
- Install Command: `npm install` (akan otomatis run `postinstall` script)

### 4. Domain Configuration
Setelah deployment berhasil:
1. Catat URL Vercel yang diberikan (misal: `haisa-xyz123.vercel.app`)
2. Update environment variables:
   - `NEXTAUTH_URL=https://haisa-xyz123.vercel.app`
   - `APP_URL=https://haisa-xyz123.vercel.app`
3. Redeploy untuk apply perubahan

### 5. Google OAuth Configuration
Update Google OAuth settings:
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Pilih project `haisa-wa-gmail`
3. Credentials > OAuth 2.0 Client IDs
4. Tambahkan Authorized redirect URIs:
   - `https://haisa-xyz123.vercel.app/api/auth/callback/google`

### 6. Verifikasi Deployment
Setelah deployment selesai, test:
1. Akses homepage: `https://haisa-xyz123.vercel.app`
2. Test login: `https://haisa-xyz123.vercel.app/login`
3. Test API health: `https://haisa-xyz123.vercel.app/api/health`

## 🔧 Troubleshooting

### Build Errors
Jika ada error saat build:
1. Check Vercel build logs
2. Pastikan semua environment variables sudah diset
3. Pastikan Turso database accessible

### Runtime Errors
1. Check Vercel function logs
2. Verify database connection
3. Check Google service account permissions

## 📋 Checklist Deployment

- [x] ✅ Push semua code ke GitHub
- [x] ✅ Konfigurasi environment variables
- [x] ✅ Build settings sudah benar
- [ ] ⏳ Import project ke Vercel
- [ ] ⏳ Set environment variables di Vercel
- [ ] ⏳ Deploy dan test
- [ ] ⏳ Update Google OAuth redirect URIs
- [ ] ⏳ Update NEXTAUTH_URL dan APP_URL
- [ ] ⏳ Final testing

## 🎯 Next Steps
1. Import project ke Vercel
2. Configure environment variables
3. Deploy dan test semua functionality
4. Update OAuth settings
5. Production testing

Semua file sudah siap untuk deployment! 🚀

## 📝 Catatan Penting Environment Variables

**SEMUA nilai environment variables yang sebenarnya ada di file `.env.vercel`**. 
File ini sudah dikonfigurasi dengan nilai-nilai yang benar, tapi tidak di-commit ke GitHub untuk keamanan.

Untuk deployment:
1. Buka file `.env.vercel` di local
2. Copy semua nilai dari file tersebut
3. Paste ke Vercel Dashboard > Settings > Environment Variables
4. Pastikan semua variable sudah diset dengan benar

Jangan lupa update `NEXTAUTH_URL` dan `APP_URL` dengan URL Vercel yang sebenarnya setelah deployment!