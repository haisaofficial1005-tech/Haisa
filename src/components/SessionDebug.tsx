'use client';

import { useEffect, useState } from 'react';

interface SessionInfo {
  hasSession: boolean;
  userId?: string;
  phone?: string;
  role?: string;
  error?: string;
}

export default function SessionDebug() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.success) {
          setSessionInfo({
            hasSession: true,
            userId: data.user.userId,
            phone: data.user.phone,
            role: data.user.role,
          });
        } else {
          setSessionInfo({
            hasSession: false,
            error: data.error,
          });
        }
      } catch (error) {
        setSessionInfo({
          hasSession: false,
          error: 'Network error',
        });
      }
    };

    checkSession();
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-red-600 text-white px-3 py-1 rounded text-xs font-mono"
      >
        DEBUG
      </button>
      
      {showDebug && sessionInfo && (
        <div className="absolute bottom-8 right-0 bg-black text-white p-3 rounded text-xs font-mono w-64 border border-gray-600">
          <div className="font-bold mb-2">Session Debug</div>
          <div>Has Session: {sessionInfo.hasSession ? 'YES' : 'NO'}</div>
          {sessionInfo.hasSession ? (
            <>
              <div>User ID: {sessionInfo.userId}</div>
              <div>Phone: {sessionInfo.phone}</div>
              <div>Role: {sessionInfo.role}</div>
            </>
          ) : (
            <div>Error: {sessionInfo.error}</div>
          )}
          <div className="mt-2 text-gray-400">
            Cookie: {document.cookie.includes('haisa-session') ? 'EXISTS' : 'MISSING'}
          </div>
        </div>
      )}
    </div>
  );
}