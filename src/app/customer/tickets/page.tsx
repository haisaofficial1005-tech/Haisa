/**
 * Customer Tickets List Page
 * Riwayat pengaduan Unblock WA
 */

import { prisma } from '@/core/db';
import { getSession } from '@/core/auth/session';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ErrorPage from '@/components/ErrorPage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500 text-white',
  RECEIVED: 'bg-blue-500 text-white',
  IN_REVIEW: 'bg-yellow-500 text-white',
  NEED_MORE_INFO: 'bg-orange-500 text-white',
  IN_PROGRESS: 'bg-purple-500 text-white',
  RESOLVED: 'bg-green-500 text-white',
  CLOSED: 'bg-gray-600 text-white',
  REJECTED: 'bg-red-500 text-white',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500 text-white',
  PAID: 'bg-green-500 text-white',
  FAILED: 'bg-red-500 text-white',
  EXPIRED: 'bg-gray-500 text-white',
  REFUNDED: 'bg-blue-500 text-white',
};

const issueTypeLabels: Record<string, string> = {
  ACCOUNT_BANNED: 'Akun Diblokir',
  ACCOUNT_SUSPENDED: 'Akun Ditangguhkan',
  VERIFICATION_ISSUE: 'Masalah Verifikasi',
  HACKED_ACCOUNT: 'Akun Diretas',
  OTHER: 'Lainnya',
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

export default async function TicketsListPage() {
  try {
    const session = await getSession();

    if (!session) {
      redirect('/login');
    }

    const tickets = await prisma.ticket.findMany({
      where: { customerId: session.userId },
      select: {
        id: true,
        ticketNo: true,
        status: true,
        paymentStatus: true,
        issueType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Haisa WA</h1>
            <p className="text-sm text-slate-400">Riwayat Unblock WhatsApp</p>
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
            <h2 className="text-2xl font-bold text-white">Pengaduan WhatsApp</h2>
            <p className="mt-1 text-sm text-slate-400">Kelola pengaduan unblock WhatsApp Anda</p>
          </div>
          <Link
            href="/customer/tickets/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            + Buat Pengaduan Baru
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-white">Belum ada pengaduan</h3>
            <p className="mt-2 text-sm text-slate-400">Mulai dengan membuat pengaduan baru.</p>
            <div className="mt-6">
              <Link href="/customer/tickets/new" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors">
                + Buat Pengaduan
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">No. Tiket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jenis Masalah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Pembayaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{ticket.ticketNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{issueTypeLabels[ticket.issueType] || ticket.issueType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[ticket.status] || 'bg-gray-500 text-white'}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[ticket.paymentStatus] || 'bg-gray-500 text-white'}`}>
                          {ticket.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatDate(ticket.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <Link href={`/customer/tickets/${ticket.id}`} className="text-blue-400 hover:text-blue-300">Lihat</Link>
                        {ticket.status === 'DRAFT' && ticket.paymentStatus === 'PENDING' && (
                          <Link href={`/customer/tickets/${ticket.id}/pay`} className="text-green-400 hover:text-green-300">Bayar</Link>
                        )}
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
    console.error('Tickets page error:', error);
    
    // Return error page instead of crashing
    return (
      <ErrorPage 
        title="Gagal Memuat Riwayat Tiket"
        message="Terjadi kesalahan saat memuat riwayat pengaduan WhatsApp. Tim kami sedang memperbaiki masalah ini."
        backUrl="/customer/dashboard"
        backLabel="Kembali ke Dashboard"
      />
    );
  }
}
