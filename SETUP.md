# Haisa WA - Setup Guide

Panduan lengkap untuk menyiapkan aplikasi Haisa WA.

## Status Build: ✅ BERHASIL

Aplikasi sudah berhasil di-build. Sekarang kamu perlu mengisi environment variables.

---

## 1. Database (Turso)

### Langkah-langkah:

1. **Daftar di Turso**: https://turso.tech
2. **Install Turso CLI**:
   ```bash
   # Windows (PowerShell)
   irm https://get.turso.tech/install.ps1 | iex
   
   # atau dengan npm
   npm install -g @turso/cli
   ```

3. **Login ke Turso**:
   ```bash
   turso auth login
   ```

4. **Buat Database**:
   ```bash
   turso db create haisa-wa
   ```

5. **Dapatkan URL dan Token**:
   ```bash
   # Dapatkan URL
   turso db show haisa-wa --url
   
   # Buat auth token
   turso db tokens create haisa-wa
   ```

6. **Isi di file `.env`**:
   ```env
   TURSO_DATABASE_URL="libsql://haisa-wa-your-org.turso.io"
   TURSO_AUTH_TOKEN="your-token-here"
   ```

7. **Generate Prisma Client & Push Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

---

## 2. Google OAuth (Login dengan Google)

### Langkah-langkah:

1. **Buka Google Cloud Console**: https://console.cloud.google.com

2. **Buat Project Baru** (atau pilih yang sudah ada)

3. **Enable Google+ API**:
   - Pergi ke "APIs & Services" > "Library"
   - Cari "Google+ API" dan enable

4. **Buat OAuth Credentials**:
   - Pergi ke "APIs & Services" > "Credentials"
   - Klik "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Haisa WA"
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

5. **Copy Client ID dan Client Secret ke `.env`**:
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

---

## 3. Google Service Account (untuk Drive API)

### Langkah-langkah:

1. **Di Google Cloud Console**, pergi ke "IAM & Admin" > "Service Accounts"

2. **Buat Service Account**:
   - Klik "Create Service Account"
   - Name: "haisa-wa-drive"
   - Klik "Create and Continue"
   - Skip role assignment
   - Klik "Done"

3. **Buat Key**:
   - Klik service account yang baru dibuat
   - Tab "Keys" > "Add Key" > "Create new key"
   - Pilih JSON
   - Download file JSON

4. **Dari file JSON, copy ke `.env`**:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL="haisa-wa-drive@your-project.iam.gserviceaccount.com"
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

5. **Buat Folder di Google Drive**:
   - Buat folder baru di Google Drive (misal: "Haisa WA Tickets")
   - Share folder tersebut dengan email service account
   - Copy folder ID dari URL (bagian setelah `/folders/`)
   
   ```env
   GOOGLE_DRIVE_ROOT_FOLDER_ID="your-folder-id"
   ```

---

## 4. Google Apps Script

### Langkah-langkah:

1. **Buka Google Apps Script**: https://script.google.com

2. **Buat Project Baru**:
   - Klik "New Project"
   - Rename menjadi "Haisa WA Sync"

3. **Copy Code**:
   - Hapus semua isi di `Code.gs`
   - Copy seluruh isi dari `apps-script/Code.gs` di project ini

4. **Buat Google Sheets**:
   - Buat spreadsheet baru di Google Drive
   - Rename menjadi "Haisa WA Tickets"
   - Copy Spreadsheet ID dari URL

5. **Set Script Properties**:
   - Di Apps Script, klik ⚙️ (Project Settings)
   - Scroll ke "Script Properties"
   - Tambahkan:
     - `SYNC_SECRET`: buat random string (misal: `haisa-wa-sync-secret-123`)
     - `ROOT_FOLDER_ID`: folder ID dari langkah 3
     - `SPREADSHEET_ID`: spreadsheet ID dari langkah 4
     - `SHEET_NAME`: `Tickets`

6. **Initialize Sheet**:
   - Kembali ke editor
   - Pilih function `initializeSheet` dari dropdown
   - Klik Run
   - Authorize jika diminta

7. **Deploy sebagai Web App**:
   - Klik "Deploy" > "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Klik "Deploy"
   - Copy URL deployment

8. **Isi di `.env`**:
   ```env
   GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/your-deployment-id/exec"
   GOOGLE_SYNC_SECRET="haisa-wa-sync-secret-123"
   ```

---

## 5. Payment Gateway (Midtrans)

### Langkah-langkah:

1. **Daftar di Midtrans**: https://midtrans.com

2. **Buat Merchant Account** (Sandbox untuk testing)

3. **Dapatkan API Keys**:
   - Login ke Dashboard Midtrans
   - Pergi ke Settings > Access Keys
   - Copy Server Key dan Client Key

4. **Isi di `.env`**:
   ```env
   PAYMENT_PROVIDER="midtrans"
   MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxx"
   MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"
   MIDTRANS_IS_PRODUCTION="false"
   PAYMENT_AMOUNT="50000"
   PAYMENT_CURRENCY="IDR"
   ```

---

## 6. NextAuth Secret

Generate random secret:

```bash
# Di terminal
openssl rand -base64 32
```

Atau gunakan: https://generate-secret.vercel.app/32

```env
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 7. WhatsApp (Optional)

WhatsApp notification menggunakan wwebjs yang memerlukan session WhatsApp Web.

```env
WHATSAPP_TEAM_NUMBER="+6281234567890"
WHATSAPP_SESSION_PATH="./whatsapp-session"
WHATSAPP_MAX_RETRIES="3"
```

**Note**: Saat pertama kali run, akan muncul QR code di terminal untuk scan dengan WhatsApp.

---

## 8. Final Setup

1. **Copy `.env.example` ke `.env`**:
   ```bash
   copy .env.example .env
   ```

2. **Isi semua nilai di `.env`**

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Push Schema ke Database**:
   ```bash
   npx prisma db push
   ```

5. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

6. **Buka Browser**: http://localhost:3000

---

## Checklist

- [ ] Turso database created
- [ ] Google OAuth credentials
- [ ] Google Service Account
- [ ] Google Drive folder shared
- [ ] Google Apps Script deployed
- [ ] Google Sheets created
- [ ] Midtrans account (sandbox)
- [ ] NextAuth secret generated
- [ ] All `.env` values filled
- [ ] `npx prisma generate` success
- [ ] `npx prisma db push` success
- [ ] `npm run dev` running

---

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Error: "Database connection failed"
- Pastikan `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` benar
- Coba: `turso db shell haisa-wa` untuk test koneksi

### Error: "Google OAuth redirect_uri_mismatch"
- Pastikan redirect URI di Google Console sama persis dengan `NEXTAUTH_URL/api/auth/callback/google`

### Error: "Apps Script unauthorized"
- Pastikan `GOOGLE_SYNC_SECRET` sama di `.env` dan Script Properties
