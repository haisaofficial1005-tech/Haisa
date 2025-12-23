# 🧪 User Testing Checklist - Haisa WA System

## ✅ Pre-Testing Verification

### System Status
- [x] ✅ ES Module conflict resolved
- [x] ✅ TypeScript errors fixed
- [x] ✅ Build test successful
- [x] ✅ Database configuration verified
- [x] ✅ All critical APIs tested
- [x] ✅ Security measures implemented

### Environment Setup
- [x] ✅ Environment variables configured
- [x] ✅ Database connection working
- [x] ✅ JWT security enabled
- [x] ✅ Rate limiting active
- [x] ✅ Logging system operational

## 🔐 Authentication & Security Testing

### Login System
- [ ] **Login dengan nomor WhatsApp valid**
  - Test: `6281234567890`
  - Expected: Login berhasil, redirect ke dashboard
  - Check: Session cookie terset, JWT valid

- [ ] **Login dengan nomor WhatsApp invalid**
  - Test: `123456`
  - Expected: Error validation "Format nomor tidak valid"

- [ ] **Login dengan nama (opsional)**
  - Test: `6281234567890` + nama `Test User`
  - Expected: Login berhasil, nama tersimpan

- [ ] **Rate limiting login**
  - Test: 6+ login attempts dalam 15 menit
  - Expected: Error "Terlalu banyak percobaan"

- [ ] **Session persistence**
  - Test: Refresh halaman setelah login
  - Expected: Tetap login, tidak redirect ke login page

### Authorization
- [ ] **Customer access control**
  - Test: Customer akses `/ops/dashboard`
  - Expected: Redirect atau error 403

- [ ] **Admin access**
  - Test: Admin akses semua halaman ops
  - Expected: Akses berhasil

## 📱 Customer Features Testing

### Dashboard
- [ ] **Customer dashboard loading**
  - URL: `/customer/dashboard`
  - Expected: Menu pilihan "Unblock WA" dan "Jual Gmail"

### Ticket System
- [ ] **Create new ticket**
  - URL: `/customer/tickets/new`
  - Test: Isi form lengkap + upload screenshot
  - Expected: Ticket terbuat, payment URL tersedia

- [ ] **Ticket validation**
  - Test: Submit form tanpa screenshot
  - Expected: Error "Minimal 1 screenshot wajib"

- [ ] **WhatsApp number validation**
  - Test: Nomor invalid `123`
  - Expected: Error "Format nomor WhatsApp tidak valid"

- [ ] **File upload validation**
  - Test: Upload file > 5MB
  - Expected: Error "Ukuran file maksimal 5MB"

- [ ] **View ticket list**
  - URL: `/customer/tickets`
  - Expected: List tiket customer, status payment

### Gmail Sales System
- [ ] **Create Gmail sale**
  - URL: `/customer/gmail-sale/new`
  - Test: Isi form Gmail sale
  - Expected: Sale terbuat dengan QRIS payment

- [ ] **Upload payment proof**
  - Test: Upload bukti transfer
  - Expected: File terupload, status berubah

- [ ] **View Gmail sales**
  - URL: `/customer/gmail-sale`
  - Expected: List penjualan Gmail

## 👨‍💼 Admin/Ops Features Testing

### Dashboard
- [ ] **Ops dashboard**
  - URL: `/ops/dashboard`
  - Expected: Statistics, recent activities

### Ticket Management
- [ ] **View all tickets**
  - URL: `/ops/tickets`
  - Expected: List semua tiket dengan filter

- [ ] **Assign agent**
  - Test: Assign tiket ke agent
  - Expected: Status berubah, agent assigned

- [ ] **Update ticket status**
  - Test: Ubah status tiket
  - Expected: Status terupdate, log tersimpan

### Payment Verification
- [ ] **Manual payment confirmation**
  - URL: `/ops/payment-verification`
  - Test: Konfirmasi pembayaran manual
  - Expected: Status payment berubah

- [ ] **QRIS verification**
  - URL: `/ops/qris-verification`
  - Test: Verifikasi QRIS payment
  - Expected: Amount validation, status update

### Gmail Sales Management
- [ ] **View Gmail sales**
  - URL: `/ops/gmail-sales`
  - Expected: List semua penjualan Gmail

- [ ] **Verify Gmail sale**
  - Test: Verifikasi penjualan Gmail
  - Expected: Status berubah ke APPROVED/REJECTED

- [ ] **Export Gmail sales**
  - Test: Export data ke CSV
  - Expected: File CSV terdownload

### Agent Management
- [ ] **Create agent**
  - URL: `/ops/agents`
  - Test: Buat user agent baru
  - Expected: Agent terbuat dengan role AGENT

- [ ] **Update user role**
  - Test: Ubah role user
  - Expected: Role terupdate

## 🔒 Security Testing

### Rate Limiting
- [ ] **API rate limiting**
  - Test: 100+ requests dalam 15 menit
  - Expected: Error 429 "Too many requests"

- [ ] **Payment rate limiting**
  - Test: 10+ payment requests dalam 1 menit
  - Expected: Rate limit triggered

### Input Validation
- [ ] **XSS prevention**
  - Test: Input `<script>alert('xss')</script>`
  - Expected: Script tags stripped

- [ ] **SQL injection prevention**
  - Test: Input `'; DROP TABLE users; --`
  - Expected: Input sanitized, no SQL execution

- [ ] **File upload security**
  - Test: Upload file .exe atau .php
  - Expected: Error "Tipe file tidak diizinkan"

### Session Security
- [ ] **JWT expiration**
  - Test: Wait 24+ hours
  - Expected: Session expired, redirect to login

- [ ] **Device fingerprinting**
  - Test: Login dari device berbeda
  - Expected: New session created

## 💳 Payment System Testing

### QRIS Payment
- [ ] **QRIS generation**
  - Test: Create ticket/Gmail sale
  - Expected: QRIS code generated with unique amount

- [ ] **Payment verification**
  - Test: Upload payment proof
  - Expected: Amount validation, status update

### Payment Gateway
- [ ] **Yukk integration**
  - Test: Payment flow dengan Yukk
  - Expected: Payment URL valid, webhook working

- [ ] **Payment webhook**
  - Test: Simulate webhook dari payment gateway
  - Expected: Status payment terupdate otomatis

## 📊 Data Integrity Testing

### Database Operations
- [ ] **User creation**
  - Test: Login user baru
  - Expected: User terbuat dengan data lengkap

- [ ] **Data relationships**
  - Test: Ticket dengan customer, payment, attachments
  - Expected: Relasi data konsisten

- [ ] **Audit logging**
  - Test: Berbagai operasi
  - Expected: Log tersimpan di security.log

### File Management
- [ ] **Google Drive integration**
  - Test: Upload attachment
  - Expected: File tersimpan di Google Drive

- [ ] **File access control**
  - Test: Akses file orang lain
  - Expected: Access denied

## 🚨 Error Handling Testing

### API Errors
- [ ] **Database connection error**
  - Test: Disconnect database
  - Expected: Graceful error message

- [ ] **External service error**
  - Test: Google Drive/Payment gateway down
  - Expected: Fallback mechanism, user notification

### User Experience
- [ ] **Network timeout**
  - Test: Slow network connection
  - Expected: Loading states, timeout handling

- [ ] **Invalid routes**
  - Test: Access `/invalid-route`
  - Expected: 404 page with navigation

## 📱 Mobile Responsiveness

### Mobile Testing
- [ ] **Login page mobile**
  - Test: Login di mobile browser
  - Expected: Responsive design, easy input

- [ ] **Dashboard mobile**
  - Test: Navigate dashboard di mobile
  - Expected: Touch-friendly, readable

- [ ] **Form submission mobile**
  - Test: Create ticket di mobile
  - Expected: File upload working, form usable

## 🔄 Performance Testing

### Load Testing
- [ ] **Concurrent users**
  - Test: 10+ users simultaneous login
  - Expected: System responsive

- [ ] **Large file uploads**
  - Test: Upload file 4.9MB
  - Expected: Upload berhasil dalam waktu wajar

- [ ] **Database queries**
  - Test: Load page dengan banyak data
  - Expected: Query optimized, loading cepat

## 📋 Final Verification

### Production Readiness
- [ ] **All environment variables set**
- [ ] **Database migrations applied**
- [ ] **SSL certificate valid**
- [ ] **Domain configuration correct**
- [ ] **Monitoring setup**
- [ ] **Backup system active**

### User Acceptance
- [ ] **Customer workflow complete**
- [ ] **Admin workflow complete**
- [ ] **Payment flow working**
- [ ] **Security measures effective**
- [ ] **Performance acceptable**

## 🎯 Critical Issues to Watch

### High Priority
1. **Login failures** - Must work 100%
2. **Payment processing** - Critical for business
3. **File uploads** - Core functionality
4. **Security breaches** - Zero tolerance

### Medium Priority
1. **UI/UX issues** - Affects user experience
2. **Performance slowdowns** - Monitor response times
3. **Mobile compatibility** - Growing user base

### Low Priority
1. **Minor UI glitches** - Can be fixed post-launch
2. **Non-critical features** - Nice to have

## 📞 Emergency Contacts

### Technical Issues
- **Database**: Check Turso dashboard
- **Hosting**: Check Vercel dashboard
- **Domain**: Check DNS settings
- **SSL**: Check certificate expiry

### Business Issues
- **Payment**: Contact Yukk support
- **Google Services**: Check Google Cloud Console
- **User Support**: Monitor logs/security.log

---

## 🚀 Testing Instructions

1. **Start with Authentication** - Login must work first
2. **Test Core Features** - Ticket creation, payment flow
3. **Verify Security** - Rate limiting, input validation
4. **Check Edge Cases** - Error scenarios, invalid inputs
5. **Performance Test** - Load testing, file uploads
6. **Mobile Test** - Responsive design, touch interface

**Remember**: Test each feature thoroughly before moving to the next. Document any issues found with steps to reproduce.