'use client';

/**
 * Gmail Sales Admin Client Component
 * Interactive admin interface dengan bulk export functionality
 */

import { useState } from 'react';
import Link from 'next/link';

interface GmailSaleWithCustomer {
  id: string;
  saleNo: string;
  gmailAddress: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentAccountNumber: string;
  status: string;
  qrisAmount?: number;
  qrisUniqueCode?: string;
  qrisPaymentProofUrl?: string;
  suggestedPrice?: number;
  verifiedAt?: Date;
  createdAt: Date;
  customer: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  checking: number;
  approved: number;
  transferred: number;
  rejected: number;
}

interface Props {
  gmailSales: GmailSaleWithCustomer[];
  stats: Stats;
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

export default function GmailSalesAdminClient({ gmailSales, stats }: Props) {
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const approvedSales = filteredSales.filter(sale => sale.status === 'APPROVED').map(sale => sale.id);
      setSelectedSales(approvedSales);
    } else {
      setSelectedSales([]);
    }
  };

  const handleSelectSale = (saleId: string, checked: boolean) => {
    if (checked) {
      setSelectedSales(prev => [...prev, saleId]);
    } else {
      setSelectedSales(prev => prev.filter(id => id !== saleId));
    }
  };

  const handleBulkExport = async (format: 'csv' | 'excel') => {
    if (selectedSales.length === 0) {
      alert('Pilih minimal satu Gmail sale yang sudah disetujui untuk di-export');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/gmail-sale/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleIds: selectedSales, format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gmail-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}`;
        a.click();
        
        // Clear selection after successful export
        setSelectedSales([]);
        alert(`Berhasil export ${selectedSales.length} Gmail credentials`);
      } else {
        const error = await response.json();
        alert(`Export failed: ${error.message}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat export');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter sales based on status
  const filteredSales = statusFilter === 'ALL' 
    ? gmailSales 
    : gmailSales.filter(sale => sale.status === statusFilter);

  const approvedSalesCount = filteredSales.filter(sale => sale.status === 'APPROVED').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Jual Gmail</h1>
        <p className="mt-1 text-sm text-gray-500">Kelola pengajuan penjualan Gmail dari customer</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Menunggu</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Dicek</p>
          <p className="text-2xl font-bold text-blue-600">{stats.checking}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Disetujui</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Ditransfer</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.transferred}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Ditolak</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm text-gray-700 mr-2">Filter Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">Semua ({gmailSales.length})</option>
                <option value="PENDING">Menunggu ({stats.pending})</option>
                <option value="CHECKING">Sedang Dicek ({stats.checking})</option>
                <option value="APPROVED">Disetujui ({stats.approved})</option>
                <option value="TRANSFERRED">Ditransfer ({stats.transferred})</option>
                <option value="REJECTED">Ditolak ({stats.rejected})</option>
              </select>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedSales.length} dipilih dari {approvedSalesCount} yang dapat di-export
            </span>
            <button
              onClick={() => handleBulkExport('csv')}
              disabled={selectedSales.length === 0 || isExporting}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => handleBulkExport('excel')}
              disabled={selectedSales.length === 0 || isExporting}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredSales.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            {statusFilter === 'ALL' 
              ? 'Belum ada pengajuan penjualan Gmail' 
              : `Tidak ada Gmail sale dengan status ${statusLabels[statusFilter]}`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedSales.length === approvedSalesCount && approvedSalesCount > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Penjualan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gmail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode Terima</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Saran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale: GmailSaleWithCustomer) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedSales.includes(sale.id)}
                        onChange={(e) => handleSelectSale(sale.id, e.target.checked)}
                        disabled={sale.status !== 'APPROVED'}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.saleNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.customer.name || '-'}</div>
                      <div className="text-xs text-gray-500">{sale.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.gmailAddress}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.paymentMethod === 'QRIS' ? (
                          <>
                            <span className="font-medium">QRIS</span>
                            {sale.qrisAmount && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Rp {sale.qrisAmount.toLocaleString('id-ID')}
                              </span>
                            )}
                          </>
                        ) : (
                          sale.paymentProvider
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.paymentMethod === 'QRIS' 
                          ? (sale.qrisPaymentProofUrl ? '✓ Bukti uploaded' : 'Menunggu bukti')
                          : sale.paymentAccountNumber
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[sale.status]}`}>
                        {statusLabels[sale.status]}
                      </span>
                      {sale.verifiedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(sale.verifiedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.suggestedPrice ? (
                        <span className="font-medium text-green-600">
                          Rp {sale.suggestedPrice.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/ops/gmail-sales/${sale.id}`} className="text-indigo-600 hover:text-indigo-900">
                        Detail
                      </Link>
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