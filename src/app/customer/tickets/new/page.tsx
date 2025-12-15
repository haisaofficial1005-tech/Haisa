'use client';

/**
 * Ticket Submission Form Page
 * Requirements: 2.1, 2.4, 2.5, 2.6
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ISSUE_TYPES = [
  { value: 'ACCOUNT_BANNED', label: 'Akun Diblokir' },
  { value: 'ACCOUNT_SUSPENDED', label: 'Akun Ditangguhkan' },
  { value: 'VERIFICATION_ISSUE', label: 'Masalah Verifikasi' },
  { value: 'HACKED_ACCOUNT', label: 'Akun Diretas' },
  { value: 'OTHER', label: 'Lainnya' },
];

const COUNTRIES = [
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Thailand',
  'Philippines',
  'Vietnam',
  'Other',
];

interface FormData {
  whatsAppNumber: string;
  countryRegion: string;
  issueType: string;
  incidentAt: string;
  device: string;
  waVersion: string;
  description: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    whatsAppNumber: '',
    countryRegion: 'Indonesia',
    issueType: '',
    incidentAt: '',
    device: '',
    waVersion: '',
    description: '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // WhatsApp number validation
    if (!formData.whatsAppNumber) {
      newErrors.whatsAppNumber = 'Nomor WhatsApp wajib diisi';
    } else if (!/^\+?[1-9]\d{6,14}$/.test(formData.whatsAppNumber.replace(/\s/g, ''))) {
      newErrors.whatsAppNumber = 'Format nomor WhatsApp tidak valid';
    }

    // Required fields
    if (!formData.countryRegion) {
      newErrors.countryRegion = 'Negara/Wilayah wajib dipilih';
    }
    if (!formData.issueType) {
      newErrors.issueType = 'Jenis masalah wajib dipilih';
    }
    if (!formData.incidentAt) {
      newErrors.incidentAt = 'Tanggal kejadian wajib diisi';
    }
    if (!formData.device) {
      newErrors.device = 'Perangkat wajib diisi';
    }
    if (!formData.waVersion) {
      newErrors.waVersion = 'Versi WhatsApp wajib diisi';
    }
    if (!formData.description) {
      newErrors.description = 'Deskripsi wajib diisi';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Deskripsi minimal 20 karakter';
    }

    // Sensitive keyword check
    const sensitiveKeywords = ['otp', 'password', 'pin', 'verification code', 'kode verifikasi'];
    const descLower = formData.description.toLowerCase();
    for (const keyword of sensitiveKeywords) {
      if (descLower.includes(keyword)) {
        newErrors.description = `Deskripsi tidak boleh mengandung kata "${keyword}" untuk keamanan Anda`;
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'SENSITIVE_CONTENT') {
          setErrors({ description: data.message });
        } else if (data.error === 'INVALID_WA_NUMBER') {
          setErrors({ whatsAppNumber: data.message });
        } else if (data.error === 'MISSING_REQUIRED_FIELD') {
          const fieldErrors: FormErrors = {};
          data.fields?.forEach((field: string) => {
            fieldErrors[field] = 'Field ini wajib diisi';
          });
          setErrors(fieldErrors);
        } else {
          setServerError(data.message || 'Terjadi kesalahan');
        }
        return;
      }

      // Redirect to payment page
      router.push(`/customer/tickets/${data.ticket.id}/pay`);
    } catch {
      setServerError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) => `
    w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 
    focus:outline-none transition-colors
    ${hasError ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-blue-500'}
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/customer/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Buat Pengaduan Baru
          </h1>
          <p className="text-slate-400 mb-6">
            Isi form di bawah untuk membuat pengaduan WhatsApp
          </p>

          {serverError && (
            <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* WhatsApp Number */}
            <div>
              <label htmlFor="whatsAppNumber" className="block text-sm font-medium text-slate-300 mb-1">
                Nomor WhatsApp <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                id="whatsAppNumber"
                name="whatsAppNumber"
                value={formData.whatsAppNumber}
                onChange={handleChange}
                placeholder="+62812345678"
                className={inputClass(!!errors.whatsAppNumber)}
              />
              {errors.whatsAppNumber && (
                <p className="mt-1 text-sm text-red-400">{errors.whatsAppNumber}</p>
              )}
            </div>

            {/* Country/Region */}
            <div>
              <label htmlFor="countryRegion" className="block text-sm font-medium text-slate-300 mb-1">
                Negara/Wilayah <span className="text-red-400">*</span>
              </label>
              <select
                id="countryRegion"
                name="countryRegion"
                value={formData.countryRegion}
                onChange={handleChange}
                className={inputClass(!!errors.countryRegion)}
              >
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.countryRegion && (
                <p className="mt-1 text-sm text-red-400">{errors.countryRegion}</p>
              )}
            </div>

            {/* Issue Type */}
            <div>
              <label htmlFor="issueType" className="block text-sm font-medium text-slate-300 mb-1">
                Jenis Masalah <span className="text-red-400">*</span>
              </label>
              <select
                id="issueType"
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                className={inputClass(!!errors.issueType)}
              >
                <option value="">Pilih jenis masalah</option>
                {ISSUE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.issueType && (
                <p className="mt-1 text-sm text-red-400">{errors.issueType}</p>
              )}
            </div>

            {/* Incident Date */}
            <div>
              <label htmlFor="incidentAt" className="block text-sm font-medium text-slate-300 mb-1">
                Tanggal Kejadian <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                id="incidentAt"
                name="incidentAt"
                value={formData.incidentAt}
                onChange={handleChange}
                max={new Date().toISOString().slice(0, 16)}
                className={inputClass(!!errors.incidentAt)}
              />
              {errors.incidentAt && (
                <p className="mt-1 text-sm text-red-400">{errors.incidentAt}</p>
              )}
            </div>

            {/* Device */}
            <div>
              <label htmlFor="device" className="block text-sm font-medium text-slate-300 mb-1">
                Perangkat <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="device"
                name="device"
                value={formData.device}
                onChange={handleChange}
                placeholder="iPhone 14, Samsung Galaxy S23, dll"
                className={inputClass(!!errors.device)}
              />
              {errors.device && (
                <p className="mt-1 text-sm text-red-400">{errors.device}</p>
              )}
            </div>

            {/* WhatsApp Version */}
            <div>
              <label htmlFor="waVersion" className="block text-sm font-medium text-slate-300 mb-1">
                Versi WhatsApp <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="waVersion"
                name="waVersion"
                value={formData.waVersion}
                onChange={handleChange}
                placeholder="2.23.25.83"
                className={inputClass(!!errors.waVersion)}
              />
              {errors.waVersion && (
                <p className="mt-1 text-sm text-red-400">{errors.waVersion}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                Deskripsi Masalah <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Jelaskan masalah yang Anda alami secara detail..."
                className={inputClass(!!errors.description)}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Minimal 20 karakter. Jangan sertakan informasi sensitif seperti OTP atau password.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <Link
                href="/customer/dashboard"
                className="px-6 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Memproses...' : 'Lanjut ke Pembayaran'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
