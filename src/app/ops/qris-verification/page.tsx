'use client';

/**
 * QRIS Payment Verification Page
 * Halaman admin untuk verifikasi pembayaran QRIS
 */

import { useState } from 'react';
import { formatIDR } from '@/core/payment/qris';

interface PaymentData {
  payment: {
    id: string;
    orderId: string;
    amount: number;
    uniqueCode: string;
    status: string;
    createdAt: string;
  };
  ticket: {
    id: string;
    ticketNo: string;
    status: string;
    paymentStatus: string;
  };
  customer: {
    name: string;
    email: string;
  };
}

export default function QrisVerificationPage() {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  
  const [searchForm, setSearchForm] = useState({
    amount: '',
    uniqueCode: '',
    orderId: '',
  });

  const [confirmForm, setConfirmForm] = useState({
    notes: '',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPaymentData(null);

    try {
      const { amount, uniqueCode, orderId } = searchForm;
      
      if (!amount || !uniqueCode) {
        setError('Amount dan kode unik wajib diisi');
        return;
      }

      const response = await fetch('/api/payments/verify-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount, 10),
          uniqueCode,
          orderId: orderId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Gagal mencari pembayaran');
        return;
      }

      setPaymentData(data);
      setSuccess('Pembayaran ditemukan!');
    } catch (err) {
      setError('Terjadi kesalahan saat mencari pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!paymentData) return;

    setConfirming(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/confirm-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentData.payment.id,
          orderId: paymentData.payment.orderId,
          confirmedAmount: paymentData.payment.amount,
          uniqueCode: paymentData.payment.uniqueCode,
          notes: confirmForm.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Gagal konfirmasi pembayaran');
        return;
      }

      setSuccess('Pembayaran berhasil dikonfirmasi!');
      setPaymentData(null);
      setSearchForm({ amount: '', uniqueCode: '', orderId: '' });
      setConfirmForm({ notes: '' });
    } catch (err) {
      setError('Terjadi kesalahan saat konfirmasi pembayaran');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pembayaran QRIS</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cari dan konfirmasi pembayaran QRIS berdasarkan nominal dan kode unik
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cari Pembayaran</h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nominal Pembayaran <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={searchForm.amount}
                onChange={(e) => setSearchForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="50123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Contoh: 50123 (50000 + 123)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Unik <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={searchForm.uniqueCode}
                onChange={(e) => setSearchForm(prev => ({ ...prev, uniqueCode: e.target.value }))}
                placeholder="123"
                maxLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">3 digit terakhir nominal</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order ID (Opsional)
              </label>
              <input
                type="text"
                value={searchForm.orderId}
                onChange={(e) => setSearchForm(prev => ({ ...prev, orderId: e.target.value }))}
                placeholder="QRIS-WAC-2025-000001-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Mencari...' : 'Cari Pembayaran'}
          </button>
        </form>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Payment Data */}
      {paymentData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Pembayaran</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Informasi Pembayaran</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Order ID</dt>
                  <dd className="text-sm font-mono text-gray-900">{paymentData.payment.orderId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Nominal</dt>
                  <dd className="text-sm font-semibold text-gray-900">{formatIDR(paymentData.payment.amount)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Kode Unik</dt>
                  <dd className="text-sm font-mono text-gray-900">{paymentData.payment.uniqueCode}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="text-sm">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {paymentData.payment.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Dibuat</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(paymentData.payment.createdAt).toLocaleString('id-ID')}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Informasi Tiket & Customer</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Nomor Tiket</dt>
                  <dd className="text-sm font-mono text-gray-900">{paymentData.ticket.ticketNo}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status Tiket</dt>
                  <dd className="text-sm text-gray-900">{paymentData.ticket.status}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Nama Customer</dt>
                  <dd className="text-sm text-gray-900">{paymentData.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Email Customer</dt>
                  <dd className="text-sm text-gray-900">{paymentData.customer.email}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Confirmation Form */}
          <div className="border-t pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Konfirmasi Pembayaran</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan (Opsional)
              </label>
              <textarea
                value={confirmForm.notes}
                onChange={(e) => setConfirmForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan tambahan untuk konfirmasi pembayaran..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {confirming ? 'Mengkonfirmasi...' : 'Konfirmasi Pembayaran'}
              </button>
              
              <button
                onClick={() => {
                  setPaymentData(null);
                  setSearchForm({ amount: '', uniqueCode: '', orderId: '' });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}