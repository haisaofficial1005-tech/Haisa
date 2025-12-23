'use client';

/**
 * Gmail Sale Submission Form
 * Form untuk menjual akun Gmail
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PAYMENT_METHODS = [
  { value: 'BANK', label: 'Transfer Bank' },
  { value: 'EWALLET', label: 'E-Wallet' },
];

const BANK_PROVIDERS = [
  { value: 'BCA', label: 'BCA' },
  { value: 'BNI', label: 'BNI' },
  { value: 'BRI', label: 'BRI' },
  { value: 'MANDIRI', label: 'Mandiri' },
  { value: 'BSI', label: 'BSI' },
  { value: 'CIMB', label: 'CIMB Niaga' },
  { value: 'PERMATA', label: 'Permata' },
  { value: 'DANAMON', label: 'Danamon' },
  { value: 'OTHER_BANK', label: 'Bank Lainnya' },
];

const EWALLET_PROVIDERS = [
  { value: 'GOPAY', label: 'GoPay' },
  { value: 'OVO', label: 'OVO' },
  { value: 'DANA', label: 'DANA' },
  { value: 'SHOPEEPAY', label: 'ShopeePay' },
  { value: 'LINKAJA', label: 'LinkAja' },
  { value: 'OTHER_EWALLET', label: 'E-Wallet Lainnya' },
];

interface FormData {
  gmailAddress: string;
  gmailPassword: string;
  confirmPassword: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentAccountNumber: string;
  paymentAccountName: string;
}

export default function NewGmailSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    gmailAddress: '',
    gmailPassword: '',
    confirmPassword: '',
    paymentMethod: '',
    paymentProvider: '',
    paymentAccountNumber: '',
    paymentAccountName: '',
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate Gmail address
    if (!formData.gmailAddress) {
      newErrors.gmailAddress = 'Alamat Gmail wajib diisi';
    } else if (!formData.gmailAddress.toLowerCase().endsWith('@gmail.com')) {
      newErrors.gmailAddress = 'Harus menggunakan domain @gmail.com';
    } else {
      // Check valid email format
      const emailRegex = /^[a-zA-Z0-9.]+@gmail\.com$/i;
      if (!emailRegex.test(formData.gmailAddress)) {
        newErrors.gmailAddress = 'Format email tidak valid';
      }
    }

    // Validate password
    if (!formData.gmailPassword) {
      newErrors.gmailPassword = 'Password Gmail wajib diisi';
    } else if (formData.gmailPassword.length < 6) {
      newErrors.gmailPassword = 'Password minimal 6 karakter';
    }

    // Confirm password
    if (formData.gmailPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    // Validate payment method
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Metode penerimaan wajib dipilih';
    }

    // Validate provider, account number, and account name
    if (!formData.paymentProvider) {
      newErrors.paymentProvider = 'Provider wajib dipilih';
    }

    if (!formData.paymentAccountNumber) {
      newErrors.paymentAccountNumber = 'Nomor rekening/akun wajib diisi';
    }

    if (!formData.paymentAccountName) {
      newErrors.paymentAccountName = 'Nama pemilik rekening/akun wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset provider when payment method changes
    if (name === 'paymentMethod') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value, 
        paymentProvider: '',
        paymentAccountNumber: '',
        paymentAccountName: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/gmail-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailAddress: formData.gmailAddress.toLowerCase(),
          gmailPassword: formData.gmailPassword,
          paymentMethod: formData.paymentMethod,
          paymentProvider: formData.paymentProvider,
          paymentAccountNumber: formData.paymentAccountNumber,
          paymentAccountName: formData.paymentAccountName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Terjadi kesalahan');
        return;
      }

      router.push(`/customer/gmail-sale/${data.gmailSale.id}`);
    } catch {
      setServerError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) => `
    w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 
    focus:outline-none transition-colors
    ${hasError ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}
  `;

  const providers = formData.paymentMethod === 'BANK' ? BANK_PROVIDERS : 
                    formData.paymentMethod === 'EWALLET' ? EWALLET_PROVIDERS : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/customer/gmail-sale" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Kembali ke Riwayat
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Jual Akun Gmail</h1>
          <p className="text-slate-400 mb-6">Isi data Gmail dan metode penerimaan pembayaran</p>

          {/* Warning Box */}
          <div className="mb-6 bg-amber-500/20 border border-amber-500 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm text-amber-200 font-medium">Perhatian!</p>
                <ul className="text-sm text-amber-300 mt-1 list-disc list-inside space-y-1">
                  <li>Pastikan email dan password yang Anda masukkan <strong>benar</strong></li>
                  <li>Proses pengecekan membutuhkan waktu <strong>1-2 hari kerja</strong></li>
                  <li>Setelah disetujui, uang akan ditransfer ke metode penerimaan Anda</li>
                  <li>Pastikan data rekening/e-wallet Anda <strong>valid dan aktif</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {serverError && (
            <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Gmail Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Alamat Gmail <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="gmailAddress"
                value={formData.gmailAddress}
                onChange={handleChange}
                placeholder="contoh@gmail.com"
                className={inputClass(!!errors.gmailAddress)}
              />
              {errors.gmailAddress && <p className="mt-1 text-sm text-red-400">{errors.gmailAddress}</p>}
              <p className="mt-1 text-xs text-slate-500">Harus menggunakan domain @gmail.com</p>
            </div>

            {/* Gmail Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password Gmail <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="gmailPassword"
                  value={formData.gmailPassword}
                  onChange={handleChange}
                  placeholder="Masukkan password Gmail"
                  className={inputClass(!!errors.gmailPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.gmailPassword && <p className="mt-1 text-sm text-red-400">{errors.gmailPassword}</p>}
              <p className="mt-1 text-xs text-slate-500">Pastikan password yang Anda masukkan benar</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Konfirmasi Password <span className="text-red-400">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password Gmail"
                className={inputClass(!!errors.confirmPassword)}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
            </div>

            <hr className="border-slate-700 my-6" />

            <h3 className="text-lg font-semibold text-white">Metode Penerimaan Pembayaran</h3>
            <p className="text-sm text-slate-400 -mt-3 mb-4">Pilih cara Anda ingin menerima hasil penjualan</p>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Metode Penerimaan <span className="text-red-400">*</span>
              </label>
              <select 
                name="paymentMethod" 
                value={formData.paymentMethod} 
                onChange={handleChange} 
                className={inputClass(!!errors.paymentMethod)}
              >
                <option value="">Pilih metode</option>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              {errors.paymentMethod && <p className="mt-1 text-sm text-red-400">{errors.paymentMethod}</p>}
            </div>

            {/* Payment Provider */}
            {formData.paymentMethod && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {formData.paymentMethod === 'BANK' ? 'Nama Bank' : 'Nama E-Wallet'} <span className="text-red-400">*</span>
                </label>
                <select 
                  name="paymentProvider" 
                  value={formData.paymentProvider} 
                  onChange={handleChange} 
                  className={inputClass(!!errors.paymentProvider)}
                >
                  <option value="">Pilih {formData.paymentMethod === 'BANK' ? 'bank' : 'e-wallet'}</option>
                  {providers.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {errors.paymentProvider && <p className="mt-1 text-sm text-red-400">{errors.paymentProvider}</p>}
              </div>
            )}

            {/* Account Number */}
            {formData.paymentMethod && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {formData.paymentMethod === 'BANK' ? 'Nomor Rekening' : 'Nomor HP/Akun'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="paymentAccountNumber"
                  value={formData.paymentAccountNumber}
                  onChange={handleChange}
                  placeholder={formData.paymentMethod === 'BANK' ? '1234567890' : '08123456789'}
                  className={inputClass(!!errors.paymentAccountNumber)}
                />
                {errors.paymentAccountNumber && <p className="mt-1 text-sm text-red-400">{errors.paymentAccountNumber}</p>}
              </div>
            )}

            {/* Account Name */}
            {formData.paymentMethod && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nama Pemilik {formData.paymentMethod === 'BANK' ? 'Rekening' : 'Akun'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="paymentAccountName"
                  value={formData.paymentAccountName}
                  onChange={handleChange}
                  placeholder="Nama sesuai rekening/akun"
                  className={inputClass(!!errors.paymentAccountName)}
                />
                {errors.paymentAccountName && <p className="mt-1 text-sm text-red-400">{errors.paymentAccountName}</p>}
                <p className="mt-1 text-xs text-slate-500">Pastikan nama sesuai dengan data di bank/e-wallet</p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-4">
              <Link href="/customer/gmail-sale" className="px-6 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Memproses...' : 'Kirim Pengajuan'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
