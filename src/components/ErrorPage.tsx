'use client';

import Link from 'next/link';

interface ErrorPageProps {
  title?: string;
  message?: string;
  backUrl?: string;
  backLabel?: string;
}

export default function ErrorPage({ 
  title = "Terjadi Kesalahan",
  message = "Maaf, terjadi kesalahan saat memuat halaman. Tim kami sedang memperbaikinya.",
  backUrl = "/customer/dashboard",
  backLabel = "Kembali ke Dashboard"
}: ErrorPageProps) {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 rounded-xl p-8 max-w-md w-full text-center border border-slate-700">
        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 mb-6">{message}</p>
        
        <div className="space-y-3">
          <Link
            href={backUrl}
            className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            {backLabel}
          </Link>
          
          <button
            type="button"
            onClick={handleRetry}
            className="block w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );
}