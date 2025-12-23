'use client';

/**
 * Payment Verification Page
 * Halaman admin untuk verifikasi pembayaran QRIS secara manual
 */

import { useState, useEffect } from 'react';
import { formatIDR } from '@/core/payment/qris';

interface PendingPayment {
  id: string;
  orderId: string;
  amount: number;
  uniqueCode: string;
  baseAmount: number;
  status: string;
  provider: string;
  createdAt: string;
  ticket: {
    id: string;
    ticketNo: string;
    status: string;
    paymentStatus: string;
    whatsAppNumber: string;
    issueType: string;
    customer: {
      name: string;
      email: string;
    };
  };
}

interface ConfirmedPayment {
  id: string;
  orderId: string;
  ticketNo: string;
  amount: number;
  confirmedAt: string;
}

export default function PaymentVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [recentConfirmed, setRecentConfirmed] = useState<ConfirmedPayment[]>([]);
  const [searchAmount, setSearchAmount] = useState('');
  const [searchUniqueCode, setSearchUniqueCode] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  // Auto refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchPendingPayments();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/pending-list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat data');
      }

      setPendingPayments(data.pendingPayments || []);
      setRecentConfirmed(data.recentConfirmed || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId: string, orderId: string) => {
    setConfirming(paymentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/manual-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal konfirmasi pembayaran');
      }

      setSuccess(`Pembayaran ${orderId} berhasil dikonfirmasi! Ticket status: ${data.ticketStatus}`);
      await fetchPendingPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setConfirming(null);
    }
  };

  const rejectPayment = async (paymentId: string, orderId: string) => {
    setConfirming(paymentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/manual-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal reject pembayaran');
      }

      setSuccess(`Pembayaran ${orderId} berhasil direject!`);
      await fetchPendingPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setConfirming(null);
    }
  };

  const editConfirmedPayment = async (paymentId: string, orderId: string, newStatus: string) => {
    setConfirming(paymentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/edit-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, orderId, newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal edit status pembayaran');
      }

      setSuccess(`Status pembayaran ${orderId} berhasil diubah ke ${newStatus}!`);
      await fetchPendingPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setConfirming(null);
    }
  };

  const searchPayment = async () => {
    if (!searchAmount || !searchUniqueCode) {
      setError('Masukkan nominal dan kode unik untuk mencari');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/verify-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(searchAmount, 10),
          uniqueCode: searchUniqueCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Pembayaran tidak ditemukan');
      }

      setSuccess(`Pembayaran ditemukan: ${data.ticket.ticketNo} - ${data.customer.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pembayaran tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = pendingPayments.filter(payment => {
    if (!searchAmount && !searchUniqueCode) return true;
    
    const matchAmount = !searchAmount || payment.amount.toString().includes(searchAmount);
    const matchCode = !searchUniqueCode || payment.uniqueCode.includes(searchUniqueCode);
    
    return matchAmount && matchCode;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pembayaran QRIS</h1>
          <p className="mt-1 text-sm text-gray-500">
            Verifikasi pembayaran QRIS secara manual berdasarkan nominal dan kode unik
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto Refresh (30s)</span>
          </label>
          <button
            onClick={fetchPendingPayments}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 font-medium">Cara Verifikasi Pembayaran</p>
            <ol className="text-sm text-blue-700 mt-1 list-decimal list-inside space-y-1">
              <li>Cek dashboard QRIS provider untuk melihat pembayaran yang masuk</li>
              <li>Cocokkan nominal pembayaran dengan daftar di bawah</li>
              <li>Klik "Konfirmasi" untuk mengubah status pembayaran</li>
              <li>Status ticket akan otomatis berubah ke "RECEIVED"</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cari Pembayaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nominal Pembayaran
            </label>
            <input
              type="number"
              value={searchAmount}
              onChange={(e) => setSearchAmount(e.target.value)}
              placeholder="50765"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Contoh: 50765</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Unik (3 digit terakhir)
            </label>
            <input
              type="text"
              value={searchUniqueCode}
              onChange={(e) => setSearchUniqueCode(e.target.value)}
              placeholder="765"
              maxLength={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">3 digit terakhir nominal</p>
          </div>
          <div className="flex items-end">
            <button
              onClick={searchPayment}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Cari
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Pending Payments */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Pembayaran Menunggu Konfirmasi ({filteredPayments.length})
          </h2>
        </div>

        {loading && pendingPayments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Pembayaran Pending</h3>
            <p className="text-sm text-gray-500">Semua pembayaran sudah dikonfirmasi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Unik</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.ticket.ticketNo}</div>
                      <div className="text-xs text-gray-500">{payment.ticket.issueType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.ticket.customer.name}</div>
                      <div className="text-xs text-gray-500">{payment.ticket.whatsAppNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">{formatIDR(payment.amount)}</div>
                      <div className="text-xs text-gray-500">Base: {formatIDR(payment.baseAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-lg font-bold bg-yellow-100 text-yellow-800">
                        {payment.uniqueCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => confirmPayment(payment.id, payment.orderId)}
                          disabled={confirming === payment.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {confirming === payment.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Proses...
                            </>
                          ) : (
                            <>
                              <svg className="-ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Konfirmasi
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => rejectPayment(payment.id, payment.orderId)}
                          disabled={confirming === payment.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {confirming === payment.id ? (
                            'Proses...'
                          ) : (
                            <>
                              <svg className="-ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Confirmed */}
      {recentConfirmed.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pembayaran Terkonfirmasi Hari Ini ({recentConfirmed.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Konfirmasi</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentConfirmed.map((payment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{payment.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.ticketNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatIDR(payment.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.confirmedAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => editConfirmedPayment(payment.id, payment.orderId, 'PENDING')}
                          disabled={confirming === payment.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="-ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Ubah ke Pending
                        </button>
                        <button
                          onClick={() => editConfirmedPayment(payment.id, payment.orderId, 'REJECTED')}
                          disabled={confirming === payment.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="-ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}