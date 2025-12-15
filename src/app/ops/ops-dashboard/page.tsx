/**
 * Operations Dashboard Page
 * Requirements: 8.1, 9.1
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/core/auth/auth.options';
import { prisma } from '@/core/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function OpsDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userRole = (session.user as { role?: string })?.role;
  const userId = session.user.id;

  // Build where clause based on role
  let whereClause: Record<string, unknown> = {
    status: { not: 'DRAFT' },
  };

  if (userRole === 'AGENT') {
    whereClause = {
      ...whereClause,
      OR: [
        { assignedAgentId: userId },
        { assignedAgentId: null },
      ],
    };
  }

  // Get statistics
  const [totalTickets, receivedCount, inProgressCount, resolvedCount, recentTickets] = await Promise.all([
    prisma.ticket.count({ where: whereClause }),
    prisma.ticket.count({ where: { ...whereClause, status: 'RECEIVED' } }),
    prisma.ticket.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { ...whereClause, status: 'RESOLVED' } }),
    prisma.ticket.findMany({
      where: whereClause,
      select: {
        id: true,
        ticketNo: true,
        status: true,
        issueType: true,
        createdAt: true,
        customer: {
          select: { name: true, email: true },
        },
        assignedAgent: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const stats = [
    { name: 'Total Tiket', value: totalTickets, color: 'bg-blue-500' },
    { name: 'Baru Masuk', value: receivedCount, color: 'bg-yellow-500' },
    { name: 'Dalam Proses', value: inProgressCount, color: 'bg-purple-500' },
    { name: 'Selesai', value: resolvedCount, color: 'bg-green-500' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Selamat datang, {session.user?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Tiket Terbaru</h2>
          <Link
            href="/ops/tickets"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className="border-t border-gray-200">
          {recentTickets.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Belum ada tiket
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Tiket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.ticketNo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ticket.customer.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.customer.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[ticket.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.assignedAgent?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/ops/tickets/${ticket.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
