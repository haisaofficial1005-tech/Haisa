'use client';

/**
 * Payment Page
 * Requirements: 4.1
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PaymentInfo {
  orderId: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  expiresAt: string;
}

interface TicketInfo {
  id: string;
  ticketNo: string;
  status: string;
  paymentStatus: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);

  useEffect(() => {
    fetchTicketAndPayment();
  }, [ticketId]);

  const fetchTicketAndPayment = async () => {
    try {
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const ticketData = await ticketRes.json();

      if (!ticketRes.ok) {
        throw new Error(ticketData.message || 'Gagal memuat tiket');
      }

      setTicket(ticketData.ticket);

      if (ticketData.ticket.paymentStatus === 'PAID') {
        router.push(`/customer/tickets/${ticketId}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async () => {
    setCreatingPayment(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal membuat pembayaran');
      }

      setPayment({
        orderId: data.payment.orderId,
        amount: data.payment.amount,
        currency: data.payment.currency,
        paymentUrl: data.paymentUrl,
        expiresAt: data.expiresAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setCreatingPayment(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 w-full max-w-md">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 max-w-md">
          <h2 className="text-lg font-medium text-red-400">Error</h2>
          <p className="mt-2 text-sm text-red-300">{error}</p>
          <Link href="/customer/dashboard" className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link href="/customer/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Kembali ke Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white">Pembayaran</h1>
            <p className="text-green-100 text-sm">Tiket: {ticket?.ticketNo}</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {!payment ? (
              <div className="text-center">
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>

                <h2 className="text-lg font-medium text-white mb-2">Selesaikan Pembayaran</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Klik tombol di bawah untuk melanjutkan ke halaman pembayaran.
                </p>

                <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Biaya Layanan</span>
                    <span className="text-xl font-bold text-white">Rp 49.500</span>
                  </div>
                </div>

                <button
                  onClick={createPayment}
                  disabled={creatingPayment}
                  className="w-full px-4 py-3 rounded-lg text-base font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingPayment ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-medium text-white mb-4">Detail Pembayaran</h2>
                
                <dl className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-400">Order ID</dt>
                    <dd className="text-sm font-mono text-white">{payment.orderId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-400">Jumlah</dt>
                    <dd className="text-lg font-bold text-white">{formatCurrency(payment.amount, payment.currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-400">Batas Waktu</dt>
                    <dd className="text-sm text-white">{formatDate(payment.expiresAt)}</dd>
                  </div>
                </dl>

                <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-300">
                    Selesaikan pembayaran sebelum batas waktu berakhir. 
                    Pembayaran yang tidak diselesaikan akan otomatis dibatalkan.
                  </p>
                </div>

                <a
                  href={payment.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 rounded-lg text-base font-medium text-white bg-green-600 hover:bg-green-700 text-center transition-colors"
                >
                  Lanjut ke Halaman Pembayaran →
                </a>

                <p className="mt-4 text-xs text-slate-500 text-center">
                  Anda akan diarahkan ke halaman pembayaran Yukk.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Butuh bantuan?{' '}
            <a href="mailto:support@haisa.id" className="text-blue-400 hover:text-blue-300">
              Hubungi kami
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
