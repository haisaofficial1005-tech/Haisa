'use client';

/**
 * Ticket Submission Form Page
 * Simplified: No WA version, with screenshot upload
 */

import { useState, useRef } from 'react';
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
  'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 
  'Philippines', 'Vietnam', 'Other',
];

interface FormData {
  whatsAppNumber: string;
  countryRegion: string;
  issueType: string;
  incidentAt: string;
  device: string;
  description: string;
}

interface UploadedFile {
  file: File;
  preview: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    whatsAppNumber: '',
    countryRegion: 'Indonesia',
    issueType: '',
    incidentAt: '',
    device: '',
    description: '',
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    const maxFiles = 5 - uploadedFiles.length;
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, files: 'Hanya file gambar yang diperbolehkan' }));
        continue;
      }
      
      // Validate file size
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, files: 'Ukuran file maksimal 5MB' }));
        continue;
      }

      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.whatsAppNumber) {
      newErrors.whatsAppNumber = 'Nomor WhatsApp wajib diisi';
    } else {
      // Remove + and spaces, then check if 10-15 digits starting with non-zero
      const cleaned = formData.whatsAppNumber.replace(/[\s+]/g, '');
      if (!/^[1-9]\d{9,14}$/.test(cleaned)) {
        newErrors.whatsAppNumber = 'Nomor WhatsApp harus 10-15 digit (contoh: 6289632614140)';
      }
    }

    if (!formData.issueType) newErrors.issueType = 'Jenis masalah wajib dipilih';
    if (!formData.incidentAt) newErrors.incidentAt = 'Tanggal kejadian wajib diisi';
    if (!formData.device) newErrors.device = 'Perangkat wajib diisi';
    if (!formData.description) {
      newErrors.description = 'Deskripsi wajib diisi';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Deskripsi minimal 20 karakter';
    }

    // Check for sensitive keywords
    const sensitiveKeywords = ['otp', 'password', 'pin', 'kode verifikasi'];
    const descLower = formData.description.toLowerCase();
    for (const keyword of sensitiveKeywords) {
      if (descLower.includes(keyword)) {
        newErrors.description = `Jangan sertakan "${keyword}" untuk keamanan Anda`;
        break;
      }
    }

    // Require at least 1 screenshot
    if (uploadedFiles.length === 0) {
      newErrors.files = 'Minimal 1 screenshot wajib diunggah';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append('whatsAppNumber', formData.whatsAppNumber);
      submitData.append('countryRegion', formData.countryRegion);
      submitData.append('issueType', formData.issueType);
      submitData.append('incidentAt', formData.incidentAt);
      submitData.append('device', formData.device);
      submitData.append('description', formData.description);
      
      // Append files
      uploadedFiles.forEach((uf, i) => {
        submitData.append(`screenshot_${i}`, uf.file);
      });

      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Terjadi kesalahan');
        return;
      }

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
    ${hasError ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/customer/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Buat Pengaduan Baru</h1>
          <p className="text-slate-400 mb-6">Isi form dan upload screenshot bukti</p>

          {serverError && (
            <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nomor WhatsApp <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="whatsAppNumber"
                value={formData.whatsAppNumber}
                onChange={handleChange}
                placeholder="+62812345678"
                className={inputClass(!!errors.whatsAppNumber)}
              />
              {errors.whatsAppNumber && <p className="mt-1 text-sm text-red-400">{errors.whatsAppNumber}</p>}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Negara/Wilayah <span className="text-red-400">*</span>
              </label>
              <select name="countryRegion" value={formData.countryRegion} onChange={handleChange} className={inputClass(false)}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Jenis Masalah <span className="text-red-400">*</span>
              </label>
              <select name="issueType" value={formData.issueType} onChange={handleChange} className={inputClass(!!errors.issueType)}>
                <option value="">Pilih jenis masalah</option>
                {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.issueType && <p className="mt-1 text-sm text-red-400">{errors.issueType}</p>}
            </div>

            {/* Incident Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tanggal Kejadian <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                name="incidentAt"
                value={formData.incidentAt}
                onChange={handleChange}
                max={new Date().toISOString().slice(0, 16)}
                className={inputClass(!!errors.incidentAt)}
              />
              {errors.incidentAt && <p className="mt-1 text-sm text-red-400">{errors.incidentAt}</p>}
            </div>

            {/* Device */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Perangkat <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="device"
                value={formData.device}
                onChange={handleChange}
                placeholder="iPhone 14, Samsung Galaxy S23, dll"
                className={inputClass(!!errors.device)}
              />
              {errors.device && <p className="mt-1 text-sm text-red-400">{errors.device}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Deskripsi Masalah <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Jelaskan masalah yang Anda alami..."
                className={inputClass(!!errors.description)}
              />
              {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
              <p className="mt-1 text-xs text-slate-500">Min 20 karakter. Jangan sertakan OTP/password.</p>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Screenshot Bukti <span className="text-red-400">*</span>
                <span className="text-slate-500 font-normal ml-2">({uploadedFiles.length}/5)</span>
              </label>
              
              {/* Upload Area */}
              <div 
                onClick={() => uploadedFiles.length < 5 && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${uploadedFiles.length >= 5 ? 'border-slate-600 bg-slate-800/30 cursor-not-allowed' : 'border-slate-600 hover:border-blue-500 hover:bg-slate-700/30'}
                  ${errors.files ? 'border-red-500' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadedFiles.length >= 5}
                />
                <svg className="mx-auto h-10 w-10 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 text-sm">
                  {uploadedFiles.length >= 5 ? 'Maksimal 5 file' : 'Klik untuk upload screenshot'}
                </p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG, max 5MB per file</p>
              </div>
              {errors.files && <p className="mt-1 text-sm text-red-400">{errors.files}</p>}

              {/* Preview */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uploadedFiles.map((uf, i) => (
                    <div key={i} className="relative group">
                      <img src={uf.preview} alt={`Screenshot ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-600" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <p className="text-xs text-slate-500 mt-1 truncate">{uf.file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-4">
              <Link href="/customer/dashboard" className="px-6 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
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
