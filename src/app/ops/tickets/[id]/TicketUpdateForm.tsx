'use client';

/**
 * Ticket Update Form Component
 * Requirements: 8.2, 8.3, 9.2, 9.3
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TicketUpdateFormProps {
  ticketId: string;
  currentStatus: string;
  currentAgentId: string | null;
  currentNotes: string | null;
  agents: Agent[];
  isAdmin: boolean;
}

const STATUS_OPTIONS = [
  { value: 'RECEIVED', label: 'Received' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'NEED_MORE_INFO', label: 'Need More Info' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' },
];

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['RECEIVED'],
  RECEIVED: ['IN_REVIEW', 'REJECTED'],
  IN_REVIEW: ['NEED_MORE_INFO', 'IN_PROGRESS', 'REJECTED'],
  NEED_MORE_INFO: ['IN_REVIEW', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'NEED_MORE_INFO'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  REJECTED: [],
};

export default function TicketUpdateForm({
  ticketId,
  currentStatus,
  currentAgentId,
  currentNotes,
  agents,
  isAdmin,
}: TicketUpdateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [status, setStatus] = useState(currentStatus);
  const [assignedAgentId, setAssignedAgentId] = useState(currentAgentId || '');
  const [notesInternal, setNotesInternal] = useState(currentNotes || '');

  const availableStatuses = STATUS_OPTIONS.filter(
    (opt) =>
      opt.value === currentStatus ||
      VALID_TRANSITIONS[currentStatus]?.includes(opt.value)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: Record<string, unknown> = {};

      if (status !== currentStatus) {
        updates.status = status;
      }

      if (isAdmin && assignedAgentId !== (currentAgentId || '')) {
        updates.assignedAgentId = assignedAgentId || null;
      }

      if (notesInternal !== (currentNotes || '')) {
        updates.notesInternal = notesInternal;
      }

      if (Object.keys(updates).length === 0) {
        setError('Tidak ada perubahan');
        return;
      }

      const response = await fetch(`/api/ops/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui tiket');
      }

      setSuccess('Tiket berhasil diperbarui');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const isTerminalStatus = currentStatus === 'CLOSED' || currentStatus === 'REJECTED';

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Update Tiket
      </h2>

      {isTerminalStatus && (
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-600">
            Tiket ini sudah {currentStatus.toLowerCase()} dan tidak dapat diubah.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isTerminalStatus || loading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
          >
            {availableStatuses.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Assignment (Admin only) */}
        {isAdmin && (
          <div>
            <label htmlFor="assignedAgentId" className="block text-sm font-medium text-gray-700">
              Assign ke Agent
            </label>
            <select
              id="assignedAgentId"
              value={assignedAgentId}
              onChange={(e) => setAssignedAgentId(e.target.value)}
              disabled={isTerminalStatus || loading}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">-- Tidak ada --</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Internal Notes */}
        <div>
          <label htmlFor="notesInternal" className="block text-sm font-medium text-gray-700">
            Catatan Internal
          </label>
          <textarea
            id="notesInternal"
            rows={4}
            value={notesInternal}
            onChange={(e) => setNotesInternal(e.target.value)}
            disabled={isTerminalStatus || loading}
            placeholder="Catatan untuk tim internal..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Catatan ini tidak terlihat oleh customer.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isTerminalStatus || loading}
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}
