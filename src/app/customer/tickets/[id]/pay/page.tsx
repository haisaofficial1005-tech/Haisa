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
      // Fetch ticket details
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const ticketData = await ticketRes.json();

      if (!ticketRes.ok) {
        throw new Error(ticketData.message || 'Gagal memuat tiket');
      }

      setTicket(ticketData.ticket);

      // If already paid, redirect to ticket detail
      if (ticketData.ticket.paymentStatus === 'PAID') {
        router.push(`/tickets/${ticketId}`);
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
        headers: {
          'Content-Type': 'application/json',
        },
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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
    }).format(amount);
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
      <div className="max-w-lg mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-red-800">Error</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          ← Kembali ke Dashboard
        </Link>
      </nav>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">Pembayaran</h1>
          <p className="text-blue-100 text-sm">
            Tiket: {ticket?.ticketNo}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!payment ? (
            // Show payment creation button
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>

              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Selesaikan Pembayaran
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Klik tombol di bawah untuk melanjutkan ke halaman pembayaran.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Biaya Layanan</span>
                  <span className="text-xl font-bold text-gray-900">
                    Rp 50.000
                  </span>
                </div>
              </div>

              <button
                onClick={createPayment}
                disabled={creatingPayment}
                className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingPayment ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          ) : (
            // Show payment details
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Detail Pembayaran
                </h2>
                
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Order ID</dt>
                    <dd className="text-sm font-mono text-gray-900">
                      {payment.orderId}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Jumlah</dt>
                    <dd className="text-lg font-bold text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Batas Waktu</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(payment.expiresAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Selesaikan pembayaran sebelum batas waktu berakhir. 
                  Pembayaran yang tidak diselesaikan akan otomatis dibatalkan.
                </p>
              </div>

              <a
                href={payment.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-center"
              >
                Lanjut ke Halaman Pembayaran →
              </a>

              <p className="mt-4 text-xs text-gray-500 text-center">
                Anda akan diarahkan ke halaman pembayaran pihak ketiga.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Butuh bantuan?{' '}
          <a href="mailto:support@haisa.id" className="text-blue-600 hover:text-blue-800">
            Hubungi kami
          </a>
        </p>
      </div>
    </div>
  );
}
