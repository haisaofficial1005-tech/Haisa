'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (res.ok) {
        router.push('/login');
      } else {
        console.error('Logout failed');
        // Still redirect to login on error
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login on error
      router.push('/login');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={className || "px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"}
      >
        Keluar
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm mx-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">Konfirmasi Keluar</h3>
            <p className="text-slate-400 mb-6">Apakah Anda yakin ingin keluar dari akun?</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Keluar...' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}