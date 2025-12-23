'use client';

/**
 * Operations Dashboard Page
 * Dashboard admin untuk monitoring sistem
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatIDR } from '@/core/payment/qris';

interface DashboardStats {
  totalTickets: number;
  pendingPayments: number;
  receivedTickets: number;
  resolvedTickets: number;
  totalGmailSales: number;
  pendingGmailSales: number;
}

interface RecentActivity {
  id: string;
  type: 'ticket' | 'payment' | 'gmail_sale';
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function OpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    pendingPayments: 0,
    receivedTickets: 0,
    resolvedTickets: 0,
    totalGmailSales: 0,
    pendingGmailSales: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const [ticketsRes, paymentsRes, gmailSalesRes] = await Promise.all([
        fetch('/api/tickets/stats'),
        fetch('/api/payments/stats'),
        fetch('/api/gmail-sale/stats'),
      ]);

      // For now, we'll use mock data since the APIs might not exist
      setStats({
        totalTickets: 4,
        pendingPayments: 4,
        receivedTickets: 0,
        resolvedTickets: 0,
        totalGmailSales: 0,
        pendingGmailSales: 0,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'payment',
          title: 'Pembayaran QRIS Pending',
          description: 'WAC-2025-000004 - Rp 50.765',
          timestamp: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          type: 'ticket',
          title: 'Ticket Baru',
          description: 'WAC-2025-000003 - Akun Diblokir',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'draft',
        },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Tickets',
      value: stats.totalTickets,
      icon: '🎫',
      color: 'bg-blue-500',
      link: '/ops/tickets',
    },
    {
      title: 'Pembayaran Pending',
      value: stats.pendingPayments,
      icon: '💳',
      color: 'bg-yellow-500',
      link: '/ops/payment-verification',
    },
    {
      title: 'Tickets Received',
      value: stats.receivedTickets,
      icon: '✅',
      color: 'bg-green-500',
      link: '/ops/tickets',
    },
    {
      title: 'Gmail Sales',
      value: stats.totalGmailSales,
      icon: '📧',
      color: 'bg-purple-500',
      link: '/ops/gmail-sales',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-gray-600">
            Selamat datang di panel admin Haisa WA
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link
            key={index}
            href={card.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.color} rounded-full p-3 text-white text-2xl`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/ops/payment-verification"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-green-100 rounded-full p-2 mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Verifikasi Pembayaran</p>
              <p className="text-sm text-gray-500">Konfirmasi pembayaran QRIS</p>
            </div>
          </Link>

          <Link
            href="/ops/tickets"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Kelola Tickets</p>
              <p className="text-sm text-gray-500">Proses unblock WhatsApp</p>
            </div>
          </Link>

          <Link
            href="/ops/gmail-sales"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-purple-100 rounded-full p-2 mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Gmail Sales</p>
              <p className="text-sm text-gray-500">Kelola penjualan Gmail</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Tidak ada aktivitas terbaru</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'pending' ? 'bg-yellow-400' :
                    activity.status === 'completed' ? 'bg-green-400' :
                    'bg-gray-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Sistem</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Database: Online</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">QRIS System: Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Webhook: Manual Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}