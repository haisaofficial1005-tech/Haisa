/**
 * Customer Dashboard Page - Menu Pilihan
 * Setelah login, user memilih: Unblock WA atau Jual Gmail
 */

import { getSession } from '@/core/auth/session';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function CustomerDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Haisa WA</h1>
            <p className="text-sm text-slate-400">Selamat datang, {session.name}</p>
          </div>
          <Link
            href="/api/auth/logout"
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Keluar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Pilih Layanan</h2>
          <p className="text-slate-400">Silakan pilih layanan yang Anda butuhkan</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Unblock WA Card */}
          <Link href="/customer/tickets" className="group">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 hover:border-green-500 hover:bg-slate-800/70 transition-all h-full">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-600/30 transition-colors">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Unblock WhatsApp</h3>
              <p className="text-slate-400 mb-4">
                Ajukan pengaduan untuk membuka blokir akun WhatsApp Anda yang terkena banned atau suspended.
              </p>
              <div className="flex items-center text-green-400 font-medium">
                <span>Ajukan Sekarang</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Jual Gmail Card */}
          <Link href="/customer/gmail-sale" className="group">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 hover:border-blue-500 hover:bg-slate-800/70 transition-all h-full">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-colors">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Jual Gmail</h3>
              <p className="text-slate-400 mb-4">
                Jual akun Gmail Anda dan terima pembayaran melalui Bank atau E-Wallet. Proses 1-2 hari kerja.
              </p>
              <div className="flex items-center text-blue-400 font-medium">
                <span>Jual Sekarang</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm mb-4">Lihat riwayat pengajuan Anda:</p>
          <div className="flex justify-center gap-4">
            <Link href="/customer/tickets" className="text-sm text-slate-400 hover:text-white transition-colors">
              Riwayat Unblock WA →
            </Link>
            <Link href="/customer/gmail-sale" className="text-sm text-slate-400 hover:text-white transition-colors">
              Riwayat Jual Gmail →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
