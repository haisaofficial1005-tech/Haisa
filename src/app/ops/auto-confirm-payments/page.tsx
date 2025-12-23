'use client';

/**
 * Auto Confirm Payments Page
 * Halaman admin untuk konfirmasi pembayaran otomatis
 */

import { useState, useEffect } from 'react';
import { formatIDR } from '@/core/payment/qris';

interface PendingPayment {
  id: string;
  orderId: string;
  amount: number;
  uniqueCode: string;
  status: string;
  createdAt: string;
  ticket: {
    ticketNo: string;
    status: string;
    paymentStatus: string;
    customer: {
      name: string;
      email: string;
    };
  };
}

export default function AutoConfirmPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/auto-confirm');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat data');
      }

      setPendingPayments(data.pendingPayments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const confirmAllPayments = async () => {
    setConfirming(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/auto-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmAll: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal konfirmasi pembayaran');
      }

      setSuccess(`Berhasil konfirmasi ${data.confirmedCount} pembayaran`);
      await fetchPendingPayments(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setConfirming(false);
    }
  };

  const confirmSinglePayment = async (orderId: string) => {
    setConfirming(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/auto-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal konfirmasi pembayaran');
      }

      setSuccess(`Berhasil konfirmasi pembayaran ${orderId}`);
      await fetchPendingPayments(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">Auto Confirm Payments</h1>
          <p className="text-sm text-slate-400">Konfirmasi pembayaran QRIS secara otomatis</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Info Box */}
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-200 font-medium">Development Tool</p>
              <p className="text-sm text-blue-300 mt-1">
                Halaman ini untuk development/testing. Di production, pembayaran akan dikonfirmasi otomatis via webhook dari provider QRIS.
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Pending QRIS Payments</h2>
            <p className="text-sm text-slate-400">
              {loading ? 'Memuat...' : `${pendingPayments.length} pembayaran menunggu konfirmasi`}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={fetchPendingPayments}
              disabled={loading}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Memuat...' : 'Refresh'}
            </button>
            {pendingPayments.length > 0 && (
              <button
                onClick={confirmAllPayments}
                disabled={confirming}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
              >
                {confirming ? 'Memproses...' : `Konfirmasi Semua (${pendingPayments.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Pending Payments Table */}
        {loading ? (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">Tidak Ada Pembayaran Pending</h3>
            <p className="text-sm text-slate-400">Semua pembayaran QRIS sudah dikonfirmasi</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Unique Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {pendingPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-white">{payment.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{payment.ticket.ticketNo}</div>
                        <div className="text-xs text-slate-400">{payment.ticket.status}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{payment.ticket.customer.name}</div>
                        <div className="text-xs text-slate-400">{payment.ticket.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">{formatIDR(payment.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-white">{payment.uniqueCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(payment.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => confirmSinglePayment(payment.orderId)}
                          disabled={confirming}
                          className="text-green-400 hover:text-green-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                        >
                          {confirming ? 'Processing...' : 'Konfirmasi'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}