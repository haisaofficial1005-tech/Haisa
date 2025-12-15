/**
 * Customer Ticket Detail Page
 * Requirements: 7.3, 7.4
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/auth.options';
import { prisma } from '@/core/db';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import AttachmentUploadForm from './AttachmentUploadForm';

// Status badge colors
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  NEED_MORE_INFO: 'bg-orange-100 text-orange-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-blue-100 text-blue-800',
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
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    redirect('/auth/signin');
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
  if (ticket.customerId !== session.user.id) {
    redirect('/dashboard');
  }

  const canUploadAttachments = ticket.paymentStatus === 'PAID' && ticket.attachments.length < 5;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          ← Kembali ke Dashboard
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.ticketNo}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Dibuat pada {formatDate(ticket.createdAt)}
          </p>
        </div>
        <div className="flex space-x-2">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              statusColors[ticket.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {ticket.status.replace(/_/g, ' ')}
          </span>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              paymentStatusColors[ticket.paymentStatus] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {ticket.paymentStatus}
          </span>
        </div>
      </div>

      {/* Payment CTA for unpaid tickets */}
      {ticket.status === 'DRAFT' && ticket.paymentStatus === 'PENDING' && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Menunggu Pembayaran
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Silakan selesaikan pembayaran untuk memproses pengaduan Anda.
              </p>
            </div>
            <Link
              href={`/tickets/${ticket.id}/pay`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
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
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Detail Pengaduan
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nomor WhatsApp</dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.whatsAppNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Negara/Wilayah</dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.countryRegion}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Jenis Masalah</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {issueTypeLabels[ticket.issueType] || ticket.issueType}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tanggal Kejadian</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(ticket.incidentAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Perangkat</dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.device}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Versi WhatsApp</dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.waVersion}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500">Deskripsi</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {ticket.description}
              </dd>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Screenshot ({ticket.attachments.length}/5)
              </h2>
            </div>

            {ticket.attachments.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada screenshot yang diunggah.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {ticket.attachments.map((attachment) => (
                  <li key={attachment.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)} • {formatDate(attachment.createdAt)}
                        </p>
                      </div>
                    </div>
                    {attachment.driveFileUrl && (
                      <a
                        href={attachment.driveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Lihat
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Upload Form */}
            {canUploadAttachments && (
              <div className="mt-4 pt-4 border-t">
                <AttachmentUploadForm ticketId={ticket.id} />
              </div>
            )}

            {ticket.paymentStatus !== 'PAID' && (
              <p className="mt-4 text-sm text-gray-500">
                Anda dapat mengunggah screenshot setelah pembayaran selesai.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informasi Pembayaran
            </h2>
            {ticket.payments.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada pembayaran.</p>
            ) : (
              <ul className="space-y-3">
                {ticket.payments.map((payment) => (
                  <li key={payment.id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order ID</span>
                      <span className="text-gray-900 font-mono text-xs">
                        {payment.orderId}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">Jumlah</span>
                      <span className="text-gray-900">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: payment.currency,
                        }).format(payment.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">Status</span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          paymentStatusColors[payment.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Timeline</h2>
            <div className="flow-root">
              <ul className="-mb-8">
                <li className="relative pb-8">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <p className="text-sm text-gray-500">
                        Tiket dibuat pada{' '}
                        <time dateTime={ticket.createdAt.toISOString()}>
                          {formatDate(ticket.createdAt)}
                        </time>
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
