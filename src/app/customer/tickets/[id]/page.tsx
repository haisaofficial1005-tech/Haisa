/**
 * Customer Ticket Detail Page
 * Requirements: 7.3, 7.4
 */

import { getSession } from '@/core/auth/session';
import { prisma } from '@/core/db';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import AttachmentUploadForm from './AttachmentUploadForm';

// Status badge colors
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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    redirect('/login');
  }

  // Fetch ticket with relations
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          size: true,
          driveFileUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      payments: {
        select: {
          id: true,
          orderId: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  // Check ownership
  if (ticket.customerId !== session.userId) {
    redirect('/customer/tickets');
  }

  const canUploadAttachments = ticket.paymentStatus === 'PAID' && ticket.attachments.length < 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/customer/tickets" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Kembali ke Riwayat Tiket
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">{ticket.ticketNo}</h1>
            <p className="mt-1 text-sm text-slate-400">
              Dibuat pada {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex space-x-2">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[ticket.status] || 'bg-gray-500 text-white'}`}>
              {ticket.status.replace(/_/g, ' ')}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${paymentStatusColors[ticket.paymentStatus] || 'bg-gray-500 text-white'}`}>
              {ticket.paymentStatus}
            </span>
          </div>
        </div>

        {/* Payment CTA for unpaid tickets */}
        {ticket.status === 'DRAFT' && ticket.paymentStatus === 'PENDING' && (
          <div className="mb-6 bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-400">Menunggu Pembayaran</h3>
                <p className="mt-1 text-sm text-yellow-300">
                  Silakan selesaikan pembayaran untuk memproses pengaduan Anda.
                </p>
              </div>
              <Link
                href={`/customer/tickets/${ticket.id}/pay`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
              >
                Bayar Sekarang
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-medium text-white mb-4">Detail Pengaduan</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-400">Nomor WhatsApp</dt>
                  <dd className="mt-1 text-sm text-white">{ticket.whatsAppNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-400">Negara/Wilayah</dt>
                  <dd className="mt-1 text-sm text-white">{ticket.countryRegion}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-400">Jenis Masalah</dt>
                  <dd className="mt-1 text-sm text-white">
                    {issueTypeLabels[ticket.issueType] || ticket.issueType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-400">Tanggal Kejadian</dt>
                  <dd className="mt-1 text-sm text-white">{formatDate(ticket.incidentAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-400">Perangkat</dt>
                  <dd className="mt-1 text-sm text-white">{ticket.device}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-400">Versi WhatsApp</dt>
                  <dd className="mt-1 text-sm text-white">{ticket.waVersion}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <dt className="text-sm font-medium text-slate-400">Deskripsi</dt>
                <dd className="mt-1 text-sm text-white whitespace-pre-wrap">{ticket.description}</dd>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-white">
                  Screenshot ({ticket.attachments.length}/5)
                </h2>
              </div>

              {ticket.attachments.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada screenshot yang diunggah.</p>
              ) : (
                <ul className="divide-y divide-slate-700">
                  {ticket.attachments.map((attachment) => (
                    <li key={attachment.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{attachment.fileName}</p>
                          <p className="text-xs text-slate-400">
                            {formatFileSize(attachment.size)} • {formatDate(attachment.createdAt)}
                          </p>
                        </div>
                      </div>
                      {attachment.driveFileUrl && (
                        <a href={attachment.driveFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300">
                          Lihat
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {canUploadAttachments && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <AttachmentUploadForm ticketId={ticket.id} />
                </div>
              )}

              {ticket.paymentStatus !== 'PAID' && (
                <p className="mt-4 text-sm text-slate-400">
                  Anda dapat mengunggah screenshot setelah pembayaran selesai.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Info */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-medium text-white mb-4">Informasi Pembayaran</h2>
              {ticket.payments.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada pembayaran.</p>
              ) : (
                <ul className="space-y-3">
                  {ticket.payments.map((payment) => (
                    <li key={payment.id} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order ID</span>
                        <span className="text-white font-mono text-xs">{payment.orderId}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-slate-400">Jumlah</span>
                        <span className="text-white">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-slate-400">Status</span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${paymentStatusColors[payment.status] || 'bg-gray-500 text-white'}`}>
                          {payment.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-medium text-white mb-4">Timeline</h2>
              <div className="flow-root">
                <ul className="-mb-8">
                  <li className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-4 ring-slate-800">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <p className="text-sm text-slate-400">
                          Tiket dibuat pada <time dateTime={ticket.createdAt.toISOString()}>{formatDate(ticket.createdAt)}</time>
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
