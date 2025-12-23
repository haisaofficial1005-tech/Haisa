'use client';

/**
 * Tickets Management Page
 * Halaman admin untuk mengelola semua ticket unblock WhatsApp
 */

import { useState, useEffect } from 'react';
import { formatIDR } from '@/core/payment/qris';

interface Ticket {
  id: string;
  ticketNo: string;
  status: string;
  paymentStatus: string;
  whatsAppNumber: string;
  issueType: string;
  description: string;
  device: string;
  waVersion: string;
  incidentAt: string;
  createdAt: string;
  assignedAgent?: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  payments: Array<{
    id: string;
    orderId: string;
    amount: number;
    status: string;
    provider: string;
  }>;
}

interface Agent {
  id: string;
  name: string;
  phone: string;
  role: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-purple-100 text-purple-800',
};

const paymentStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function TicketsPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  useEffect(() => {
    fetchTickets();
    fetchAgents();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tickets');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat data tickets');
      }

      setTickets(data.tickets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/users/agents');
      const data = await response.json();

      if (response.ok) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setUpdating(ticketId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/tickets/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal update status ticket');
      }

      setSuccess(`Status ticket berhasil diubah ke ${newStatus}`);
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setUpdating(null);
    }
  };

  const assignAgent = async (ticketId: string, agentId: string) => {
    setUpdating(ticketId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/tickets/assign-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, agentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal assign agent');
      }

      setSuccess('Agent berhasil di-assign ke ticket');
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setUpdating(null);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = statusFilter === 'ALL' || ticket.status === statusFilter;
    const paymentMatch = paymentFilter === 'ALL' || ticket.paymentStatus === paymentFilter;
    return statusMatch && paymentMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Tiket WhatsApp</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola semua ticket unblock WhatsApp dan assign ke agent
          </p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Status Ticket
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="RECEIVED">Received</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Status Pembayaran
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
            </select>
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

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Ticket ({filteredTickets.length})
          </h2>
        </div>

        {loading && tickets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Ticket</h3>
            <p className="text-sm text-gray-500">Belum ada ticket yang sesuai dengan filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ticket.ticketNo}</div>
                      <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.customer.name}</div>
                      <div className="text-xs text-gray-500">{ticket.whatsAppNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{ticket.issueType}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{ticket.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[ticket.paymentStatus as keyof typeof paymentStatusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {ticket.paymentStatus}
                      </span>
                      {ticket.payments.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatIDR(ticket.payments[0].amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.assignedAgent ? (
                        <div className="text-sm text-gray-900">{ticket.assignedAgent.name}</div>
                      ) : (
                        <span className="text-sm text-gray-500">Belum di-assign</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {/* Status Update */}
                        <select
                          value={ticket.status}
                          onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                          disabled={updating === ticket.id}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="RECEIVED">Received</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>

                        {/* Agent Assignment */}
                        <select
                          value={ticket.assignedAgent?.id || ''}
                          onChange={(e) => assignAgent(ticket.id, e.target.value)}
                          disabled={updating === ticket.id}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Pilih Agent</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}