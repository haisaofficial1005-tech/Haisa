'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SessionErrorBoundary from './SessionErrorBoundary';

interface ClientSessionCheckerProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ClientSessionChecker({ 
  children, 
  redirectTo = '/login' 
}: ClientSessionCheckerProps) {
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSessionStatus('valid');
        setError('');
      } else {
        setSessionStatus('invalid');
        setError(data.error || 'Sesi tidak valid');
      }
    } catch (err) {
      setSessionStatus('invalid');
      setError('Gagal memeriksa sesi');
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleRetry = () => {
    setSessionStatus('checking');
    checkSession();
  };

  if (sessionStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'invalid') {
    return <SessionErrorBoundary error={error} onRetry={handleRetry} />;
  }

  return <>{children}</>;
}