'use client';

/**
 * Agents Management Page
 * Halaman admin untuk mengelola agent dan hak akses
 */

import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
  status?: 'ACTIVE' | 'INACTIVE';
  permissions?: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800',
  OPS: 'bg-blue-100 text-blue-800',
  AGENT: 'bg-green-100 text-green-800',
  CUSTOMER: 'bg-gray-100 text-gray-800',
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-red-100 text-red-800',
};

const defaultPermissions: Permission[] = [
  { id: 'view_tickets', name: 'Lihat Tickets', description: 'Dapat melihat daftar tickets', category: 'Tickets' },
  { id: 'edit_tickets', name: 'Edit Tickets', description: 'Dapat mengubah status tickets', category: 'Tickets' },
  { id: 'assign_tickets', name: 'Assign Tickets', description: 'Dapat assign tickets ke agent lain', category: 'Tickets' },
  { id: 'view_payments', name: 'Lihat Payments', description: 'Dapat melihat daftar pembayaran', category: 'Payments' },
  { id: 'confirm_payments', name: 'Konfirmasi Payments', description: 'Dapat konfirmasi pembayaran', category: 'Payments' },
  { id: 'reject_payments', name: 'Reject Payments', description: 'Dapat reject pembayaran', category: 'Payments' },
  { id: 'view_gmail_sales', name: 'Lihat Gmail Sales', description: 'Dapat melihat penjualan Gmail', category: 'Gmail Sales' },
  { id: 'manage_agents', name: 'Kelola Agents', description: 'Dapat mengelola agent dan permissions', category: 'Admin' },
];

export default function AgentsPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    phone: '',
    role: 'AGENT',
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/agents');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat data agents');
      }

      // Add mock status and permissions for demo
      const agentsWithStatus = data.agents.map((agent: Agent) => ({
        ...agent,
        status: 'ACTIVE' as const,
        permissions: getDefaultPermissions(agent.role),
      }));

      setAgents(agentsWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'ADMIN':
        return defaultPermissions.map(p => p.id);
      case 'OPS':
        return ['view_tickets', 'edit_tickets', 'assign_tickets', 'view_payments', 'confirm_payments', 'reject_payments', 'view_gmail_sales'];
      case 'AGENT':
        return ['view_tickets', 'edit_tickets', 'view_payments'];
      default:
        return [];
    }
  };

  const updateAgentRole = async (agentId: string, newRole: string) => {
    setUpdating(agentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: agentId, role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal update role agent');
      }

      setSuccess(`Role agent berhasil diubah ke ${newRole}`);
      await fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setUpdating(null);
    }
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdating(agentId);
    setError(null);
    setSuccess(null);

    try {
      // Mock API call - in real implementation, this would update user status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: newStatus as 'ACTIVE' | 'INACTIVE' }
          : agent
      ));
      
      setSuccess(`Status agent berhasil diubah ke ${newStatus}`);
    } catch (err) {
      setError('Gagal mengubah status agent');
    } finally {
      setUpdating(null);
    }
  };

  const addNewAgent = async () => {
    if (!newAgent.name || !newAgent.phone) {
      setError('Nama dan nomor phone wajib diisi');
      return;
    }

    setUpdating('new');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/users/create-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal membuat agent baru');
      }

      setSuccess(`Agent ${newAgent.name} berhasil dibuat`);
      setShowAddAgentModal(false);
      setNewAgent({ name: '', phone: '', role: 'AGENT' });
      await fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setUpdating(null);
    }
  };

  const openPermissionsModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowPermissionsModal(true);
  };

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: Permission[] } = {};
    defaultPermissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Agents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola agent, role, dan hak akses sistem
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddAgentModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Tambah Agent
          </button>
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
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

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Agents ({agents.length})
          </h2>
        </div>

        {loading && agents.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Agents</h3>
            <p className="text-sm text-gray-500">Belum ada agents yang terdaftar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bergabung</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                      <div className="text-xs text-gray-500">{agent.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[agent.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
                        {agent.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[agent.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openPermissionsModal(agent)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {agent.permissions?.length || 0} permissions
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(agent.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {/* Role Update */}
                        <select
                          value={agent.role}
                          onChange={(e) => updateAgentRole(agent.id, e.target.value)}
                          disabled={updating === agent.id}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="AGENT">Agent</option>
                          <option value="OPS">OPS</option>
                          <option value="ADMIN">Admin</option>
                        </select>

                        {/* Status Toggle */}
                        <button
                          onClick={() => toggleAgentStatus(agent.id, agent.status || 'ACTIVE')}
                          disabled={updating === agent.id}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            agent.status === 'ACTIVE'
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {agent.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
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

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Agent Baru</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama lengkap agent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6281234567890"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newAgent.role}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AGENT">Agent</option>
                    <option value="OPS">OPS</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddAgentModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Batal
                </button>
                <button
                  onClick={addNewAgent}
                  disabled={updating === 'new'}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updating === 'new' ? 'Membuat...' : 'Tambah Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedAgent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Permissions untuk {selectedAgent.name}
              </h3>
              
              <div className="space-y-6">
                {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="text-md font-medium text-gray-800 mb-3">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id={permission.id}
                            checked={selectedAgent.permissions?.includes(permission.id) || false}
                            readOnly
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <label htmlFor={permission.id} className="text-sm font-medium text-gray-900">
                              {permission.name}
                            </label>
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setSuccess('Permissions berhasil disimpan');
                    setShowPermissionsModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Simpan Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}