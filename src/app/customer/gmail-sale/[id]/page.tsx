'use client';

/**
 * Gmail Sale Detail Page
 * Menampilkan detail dan status penjualan Gmail
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500 text-white',
  CHECKING: 'bg-blue-500 text-white',
  APPROVED: 'bg-green-500 text-white',
  REJECTED: 'bg-red-500 text-white',
  TRANSFERRED: 'bg-emerald-600 text-white',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Menunggu Pengecekan',
  CHECKING: 'Sedang Dicek',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  TRANSFERRED: 'Uang Sudah Ditransfer',
};

const statusDescriptions: Record<string, string> = {
  PENDING: 'Pengajuan Anda sedang menunggu untuk diproses oleh admin.',
  CHECKING: 'Admin sedang melakukan pengecekan terhadap akun Gmail Anda.',
  APPROVED: 'Akun Gmail Anda telah disetujui. Pembayaran akan segera diproses.',
  REJECTED: 'Maaf, akun Gmail Anda tidak memenuhi kriteria.',
  TRANSFERRED: 'Pembayaran telah ditransfer ke rekening/e-wallet Anda.',
};

interface GmailSale {
  id: string;
  saleNo: string;
  gmailAddress: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentAccountNumber: string;
  paymentAccountName: string;
  status: string;
  adminNotes?: string;
  proofImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function GmailSaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [gmailSale, setGmailSale] = useState<GmailSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGmailSale();
  }, [params.id]);

  const fetchGmailSale = async () => {
    try {
      const response = await fetch(`/api/gmail-sale/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Data tidak ditemukan');
        } else if (response.status === 401) {
          router.push('/login');
          return;
        } else {
          setError('Gagal memuat data');
        }
        return;
      }
      const data = await response.json();
      setGmailSale(data.gmailSale);
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Memuat...</div>
      </div>
    );
  }

  if (error || !gmailSale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error || 'Data tidak ditemukan'}</div>
          <Link href="/customer/gmail-sale" className="text-blue-400 hover:text-blue-300">
            ← Kembali ke Riwayat
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

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
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{gmailSale.saleNo}</h1>
              <p className="text-slate-400 text-sm mt-1">Dibuat: {formatDate(gmailSale.createdAt)}</p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[gmailSale.status]}`}>
              {statusLabels[gmailSale.status]}
            </span>
          </div>

          {/* Status Description */}
          <div className={`mb-6 p-4 rounded-lg ${
            gmailSale.status === 'REJECTED' ? 'bg-red-500/20 border border-red-500' :
            gmailSale.status === 'TRANSFERRED' ? 'bg-emerald-500/20 border border-emerald-500' :
            'bg-blue-500/20 border border-blue-500'
          }`}>
            <p className={`text-sm ${
              gmailSale.status === 'REJECTED' ? 'text-red-300' :
              gmailSale.status === 'TRANSFERRED' ? 'text-emerald-300' :
              'text-blue-300'
            }`}>
              {statusDescriptions[gmailSale.status]}
            </p>
          </div>

          {/* Gmail Info */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Informasi Gmail</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Alamat Gmail</p>
                <p className="text-white">{gmailSale.gmailAddress}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Password</p>
                <p className="text-white">••••••••</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Metode Penerimaan</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Metode</p>
                <p className="text-white">{gmailSale.paymentMethod === 'BANK' ? 'Transfer Bank' : 'E-Wallet'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Provider</p>
                <p className="text-white">{gmailSale.paymentProvider}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Nomor Rekening/Akun</p>
                <p className="text-white">{gmailSale.paymentAccountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Nama Pemilik</p>
                <p className="text-white">{gmailSale.paymentAccountName}</p>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {gmailSale.adminNotes && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Catatan Admin</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{gmailSale.adminNotes}</p>
            </div>
          )}

          {/* Proof Image */}
          {gmailSale.proofImageUrl && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Bukti Transfer</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <img 
                  src={gmailSale.proofImageUrl} 
                  alt="Bukti Transfer" 
                  className="max-w-full h-auto rounded-lg border border-slate-600"
                />
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 mr-3"></div>
                <div>
                  <p className="text-white text-sm">Pengajuan dibuat</p>
                  <p className="text-slate-500 text-xs">{formatDate(gmailSale.createdAt)}</p>
                </div>
              </div>
              {new Date(gmailSale.updatedAt) > new Date(gmailSale.createdAt) && (
                <div className="flex items-start">
                  <div className={`w-3 h-3 rounded-full mt-1.5 mr-3 ${
                    gmailSale.status === 'REJECTED' ? 'bg-red-500' :
                    gmailSale.status === 'TRANSFERRED' ? 'bg-emerald-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-white text-sm">Status diperbarui: {statusLabels[gmailSale.status]}</p>
                    <p className="text-slate-500 text-xs">{formatDate(gmailSale.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
