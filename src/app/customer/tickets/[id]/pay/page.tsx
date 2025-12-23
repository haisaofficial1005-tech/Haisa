'use client';

/**
 * Payment Page - QRIS Implementation
 * QRIS payment for tickets
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatIDR } from '@/core/payment/qris';

interface PaymentInfo {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  qrisAmount: number;
  qrisUniqueCode: string;
  baseAmount: number;
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
        paymentMethod: data.paymentMethod,
        qrisAmount: data.qrisAmount,
        qrisUniqueCode: data.qrisUniqueCode,
        baseAmount: data.baseAmount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setCreatingPayment(false);
    }
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
          <Link href="/customer/tickets" className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300">
            ← Kembali ke Riwayat Tiket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link href={`/customer/tickets/${ticketId}`} className="text-blue-400 hover:text-blue-300 text-sm">
            ← Kembali ke Detail Tiket
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white">Pembayaran QRIS</h1>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>

                <h2 className="text-lg font-medium text-white mb-2">Bayar dengan QRIS</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Scan kode QRIS untuk melakukan pembayaran dengan aplikasi e-wallet atau mobile banking Anda.
                </p>

                <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Biaya Layanan</span>
                    <span className="text-xl font-bold text-white">Rp 50.000</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">+ kode unik untuk verifikasi</p>
                </div>

                <button
                  onClick={createPayment}
                  disabled={creatingPayment}
                  className="w-full px-4 py-3 rounded-lg text-base font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingPayment ? 'Memproses...' : 'Generate QRIS'}
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-medium text-white mb-4">Scan QRIS untuk Pembayaran</h2>
                
                {/* QRIS Display */}
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
                  <div className="text-center mb-4">
                    <div className="space-y-1">
                      <p className="text-blue-300">
                        <span className="font-semibold">Nominal: {formatIDR(payment.qrisAmount)}</span>
                      </p>
                      <p className="text-blue-300 text-sm">
                        Kode Unik: <span className="font-mono font-bold">{payment.qrisUniqueCode}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* QRIS Code */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <Image
                        src="/qris.png"
                        alt="QRIS Code"
                        width={200}
                        height={200}
                        className="w-48 h-48 object-contain"
                        priority
                      />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-blue-300 text-sm">
                      Scan kode QRIS di atas dengan aplikasi pembayaran Anda
                    </p>
                    <p className="text-blue-200 font-semibold">
                      Pastikan nominal yang dibayar: {formatIDR(payment.qrisAmount)}
                    </p>
                    <p className="text-blue-300 text-xs">
                      Nominal sudah termasuk kode unik untuk verifikasi otomatis
                    </p>
                  </div>
                </div>

                {/* Payment Details */}
                <dl className="space-y-3 mb-6 bg-slate-700/30 rounded-lg p-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-400">Order ID</dt>
                    <dd className="text-sm font-mono text-white">{payment.orderId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-400">Biaya Dasar</dt>
                    <dd className="text-sm text-white">{formatIDR(payment.baseAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-400">Kode Unik</dt>
                    <dd className="text-sm text-white">+{payment.qrisUniqueCode}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-600 pt-3">
                    <dt className="text-sm font-semibold text-slate-300">Total Bayar</dt>
                    <dd className="text-lg font-bold text-white">{formatIDR(payment.qrisAmount)}</dd>
                  </div>
                </dl>

                <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-300">
                    Setelah melakukan pembayaran, status tiket akan otomatis diperbarui. 
                    Pastikan nominal yang dibayar sesuai dengan yang tertera di atas.
                  </p>
                </div>

                <Link
                  href={`/customer/tickets/${ticketId}`}
                  className="block w-full px-4 py-3 rounded-lg text-base font-medium text-white bg-slate-600 hover:bg-slate-700 text-center transition-colors"
                >
                  Kembali ke Detail Tiket
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Butuh bantuan?{' '}
            <a href="https://wa.me/6289632614140" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              Hubungi kami
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
