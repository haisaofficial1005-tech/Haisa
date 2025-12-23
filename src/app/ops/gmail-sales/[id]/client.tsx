'use client';

/**
 * Gmail Sale Detail Client Component
 * Interactive admin interface untuk verifikasi Gmail sale
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VerificationChecklist } from '@/core/db/gmail-sale';

interface GmailSaleDetail {
  id: string;
  saleNo: string;
  gmailAddress: string;
  gmailPassword: string;
  gmailPasswordEncrypted?: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentAccountNumber: string;
  paymentAccountName: string;
  status: string;
  adminNotes?: string;
  proofImageUrl?: string;
  qrisAmount?: number;
  qrisUniqueCode?: string;
  qrisPaymentProofUrl?: string;
  verificationData?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  suggestedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

interface Props {
  gmailSale: GmailSaleDetail;
  verificationData: VerificationChecklist | null;
  verifiedByUser: { name: string | null; email: string } | null;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CHECKING: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  TRANSFERRED: 'bg-emerald-100 text-emerald-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  CHECKING: 'Sedang Dicek',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  TRANSFERRED: 'Ditransfer',
};

export default function GmailSaleDetailClient({ gmailSale, verificationData, verifiedByUser }: Props) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState<VerificationChecklist>(
    verificationData || {
      loginSuccess: false,
      emailCount: 0,
      accountAge: '',
      recoveryInfo: {
        hasPhoneNumber: false,
        hasRecoveryEmail: false,
      },
      securityStatus: {
        twoFactorEnabled: false,
        suspiciousActivity: false,
      },
      notes: '',
    }
  );

  const updateChecklist = (field: string, value: any) => {
    setChecklist(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof VerificationChecklist],
            [child]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleVerificationSubmit = async (action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/gmail-sale/${gmailSale.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          verificationData: checklist,
        }),
      });

      if (response.ok) {
        router.refresh();
        alert(`Gmail sale berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat memproses verifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/gmail-sale/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleIds: [gmailSale.id], format: 'csv' }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gmail-export-${gmailSale.saleNo}.csv`;
        a.click();
      } else {
        const error = await response.json();
        alert(`Export failed: ${error.message}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat export');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/ops/gmail-sales" className="text-sm text-gray-500 hover:text-gray-700">
              ← Kembali ke daftar
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Gmail Sale: {gmailSale.saleNo}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[gmailSale.status]}`}>
                {statusLabels[gmailSale.status]}
              </span>
              {gmailSale.suggestedPrice && (
                <span className="text-sm text-gray-600">
                  Harga Saran: Rp {gmailSale.suggestedPrice.toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {gmailSale.status === 'APPROVED' && (
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer & Gmail Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Customer</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Nama</label>
                <p className="font-medium">{gmailSale.customer.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{gmailSale.customer.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">WhatsApp</label>
                <p className="font-medium">{gmailSale.customer.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Gmail</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Gmail Address</label>
                <p className="font-medium font-mono">{gmailSale.gmailAddress}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Password</label>
                <div className="flex items-center gap-2">
                  <p className="font-medium font-mono">
                    {showPassword ? gmailSale.gmailPassword : '••••••••'}
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Metode</label>
                <p className="font-medium">{gmailSale.paymentMethod}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Provider</label>
                <p className="font-medium">{gmailSale.paymentProvider}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Nomor Rekening</label>
                <p className="font-medium">{gmailSale.paymentAccountNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Nama Rekening</label>
                <p className="font-medium">{gmailSale.paymentAccountName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Verifikasi Gmail</h2>
            
            {gmailSale.status === 'PENDING' || gmailSale.status === 'CHECKING' ? (
              <div className="space-y-4">
                {/* Login Test */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="loginSuccess"
                    checked={checklist.loginSuccess}
                    onChange={(e) => updateChecklist('loginSuccess', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="loginSuccess" className="text-sm">Login berhasil</label>
                </div>

                {/* Email Count */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Jumlah Email</label>
                  <input
                    type="number"
                    value={checklist.emailCount}
                    onChange={(e) => updateChecklist('emailCount', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0"
                  />
                </div>

                {/* Account Age */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Tahun Pembuatan</label>
                  <select
                    value={checklist.accountAge}
                    onChange={(e) => updateChecklist('accountAge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Pilih tahun</option>
                    <option value="2024">2024 (Baru)</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                    <option value="2019">2019 atau lebih lama</option>
                  </select>
                </div>

                {/* Recovery Info */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Info Recovery</p>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasPhoneNumber"
                      checked={checklist.recoveryInfo.hasPhoneNumber}
                      onChange={(e) => updateChecklist('recoveryInfo.hasPhoneNumber', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="hasPhoneNumber" className="text-sm">Ada nomor HP recovery</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasRecoveryEmail"
                      checked={checklist.recoveryInfo.hasRecoveryEmail}
                      onChange={(e) => updateChecklist('recoveryInfo.hasRecoveryEmail', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="hasRecoveryEmail" className="text-sm">Ada email recovery</label>
                  </div>
                </div>

                {/* Security Status */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Status Keamanan</p>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="twoFactorEnabled"
                      checked={checklist.securityStatus.twoFactorEnabled}
                      onChange={(e) => updateChecklist('securityStatus.twoFactorEnabled', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="twoFactorEnabled" className="text-sm">2FA aktif</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="suspiciousActivity"
                      checked={checklist.securityStatus.suspiciousActivity}
                      onChange={(e) => updateChecklist('securityStatus.suspiciousActivity', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="suspiciousActivity" className="text-sm">Ada aktivitas mencurigakan</label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Catatan Verifikasi</label>
                  <textarea
                    value={checklist.notes}
                    onChange={(e) => updateChecklist('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Catatan tambahan tentang kondisi akun..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleVerificationSubmit('approve')}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Setujui'}
                  </button>
                  <button
                    onClick={() => handleVerificationSubmit('reject')}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Tolak'}
                  </button>
                </div>
              </div>
            ) : (
              // Show verification results
              <div className="space-y-4">
                {verificationData && (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Login:</span>
                        <span className={`ml-2 ${verificationData.loginSuccess ? 'text-green-600' : 'text-red-600'}`}>
                          {verificationData.loginSuccess ? '✓ Berhasil' : '✗ Gagal'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email Count:</span>
                        <span className="ml-2 font-medium">{verificationData.emailCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tahun:</span>
                        <span className="ml-2 font-medium">{verificationData.accountAge}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">2FA:</span>
                        <span className={`ml-2 ${verificationData.securityStatus.twoFactorEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                          {verificationData.securityStatus.twoFactorEnabled ? '✓ Aktif' : '✗ Tidak aktif'}
                        </span>
                      </div>
                    </div>
                    {verificationData.notes && (
                      <div>
                        <span className="text-gray-500 text-sm">Catatan:</span>
                        <p className="mt-1 text-sm">{verificationData.notes}</p>
                      </div>
                    )}
                  </>
                )}
                
                {verifiedByUser && gmailSale.verifiedAt && (
                  <div className="text-xs text-gray-500 border-t pt-2">
                    Diverifikasi oleh {verifiedByUser.name || verifiedByUser.email} pada {formatDate(gmailSale.verifiedAt)}
                  </div>
                )}

                {gmailSale.rejectionReason && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    <strong>Alasan Ditolak:</strong> {gmailSale.rejectionReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}