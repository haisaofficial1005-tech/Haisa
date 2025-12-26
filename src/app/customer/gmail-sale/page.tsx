/**
 * Gmail Sale List & History Page
 */

import { prisma } from '@/core/db';
import { gmailSaleOperations } from '@/core/db/gmail-sale';
import { getSession } from '@/core/auth/session';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface GmailSaleItem {
  id: string;
  saleNo: string;
  gmailAddress: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentAccountNumber: string;
  status: string;
  qrisAmount?: number;
  qrisUniqueCode?: string;
  createdAt: Date;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500 text-white',
  CHECKING: 'bg-blue-500 text-white',
  APPROVED: 'bg-green-500 text-white',
  REJECTED: 'bg-red-500 text-white',
  TRANSFERRED: 'bg-emerald-600 text-white',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  CHECKING: 'Sedang Dicek',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  TRANSFERRED: 'Uang Ditransfer',
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function GmailSaleListPage() {
  try {
    const session = await getSession();

    if (!session) {
      redirect('/login');
    }

    const gmailSales: GmailSaleItem[] = await gmailSaleOperations.findMany(
      { customerId: session.userId },
      { orderBy: { createdAt: 'desc' } }
    );

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Haisa WA</h1>
            <p className="text-sm text-slate-400">Jual Gmail</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/customer/dashboard" className="text-sm text-slate-400 hover:text-white">
              ← Dashboard
            </Link>
            <Link href="/api/auth/logout" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              Keluar
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Riwayat Jual Gmail</h2>
            <p className="mt-1 text-sm text-slate-400">Kelola penjualan akun Gmail Anda</p>
          </div>
          <Link
            href="/customer/gmail-sale/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            + Jual Gmail Baru
          </Link>
        </div>

        {gmailSales.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-white">Belum ada penjualan Gmail</h3>
            <p className="mt-2 text-sm text-slate-400">Mulai dengan menjual akun Gmail Anda.</p>
            <div className="mt-6">
              <Link href="/customer/gmail-sale/new" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                + Jual Gmail
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">No. Penjualan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Gmail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Metode Terima</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {gmailSales.map((sale: GmailSaleItem) => (
                    <tr key={sale.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{sale.saleNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{sale.gmailAddress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">
                          {sale.paymentMethod === 'QRIS' ? 'QRIS' : sale.paymentProvider}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sale.paymentMethod === 'QRIS' && sale.qrisAmount 
                            ? `Rp ${sale.qrisAmount.toLocaleString('id-ID')}` 
                            : sale.paymentAccountNumber
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[sale.status] || 'bg-gray-500 text-white'}`}>
                          {statusLabels[sale.status] || sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatDate(sale.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/customer/gmail-sale/${sale.id}`} className="text-blue-400 hover:text-blue-300">Lihat</Link>
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
  } catch (error) {
    console.error('Gmail sale page error:', error);
    
    // Return error page instead of crashing
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 rounded-xl p-8 max-w-md w-full text-center border border-slate-700">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h2>
          <p className="text-slate-400 mb-6">
            Maaf, terjadi kesalahan saat memuat halaman. Tim kami sedang memperbaikinya.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/customer/dashboard"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Kembali ke Dashboard
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="block w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }
}
