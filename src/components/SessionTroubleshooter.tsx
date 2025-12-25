'use client';

import { useEffect, useState } from 'react';

interface SessionDiagnostic {
  cookieExists: boolean;
  cookieValue?: string;
  sessionValid: boolean;
  userInfo?: any;
  error?: string;
  timestamp: string;
}

export default function SessionTroubleshooter() {
  const [diagnostic, setDiagnostic] = useState<SessionDiagnostic | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostic = async () => {
    const timestamp = new Date().toISOString();
    
    // Check if cookie exists
    const cookieExists = document.cookie.includes('haisa-session');
    const cookieMatch = document.cookie.match(/haisa-session=([^;]+)/);
    const cookieValue = cookieMatch ? cookieMatch[1] : undefined;

    try {
      // Test session endpoint
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await res.json();
      
      setDiagnostic({
        cookieExists,
        cookieValue: cookieValue ? `${cookieValue.substring(0, 20)}...` : undefined,
        sessionValid: data.success,
        userInfo: data.success ? data.user : null,
        error: data.success ? undefined : data.error,
        timestamp,
      });
    } catch (error) {
      setDiagnostic({
        cookieExists,
        cookieValue: cookieValue ? `${cookieValue.substring(0, 20)}...` : undefined,
        sessionValid: false,
        error: 'Network error',
        timestamp,
      });
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs font-mono text-white max-w-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-yellow-400">SESSION DEBUG</span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-400 hover:text-blue-300"
          >
            {showDetails ? 'Hide' : 'Show'}
          </button>
        </div>
        
        <div className="space-y-1">
          <div className={`flex justify-between ${diagnostic?.cookieExists ? 'text-green-400' : 'text-red-400'}`}>
            <span>Cookie:</span>
            <span>{diagnostic?.cookieExists ? 'EXISTS' : 'MISSING'}</span>
          </div>
          
          <div className={`flex justify-between ${diagnostic?.sessionValid ? 'text-green-400' : 'text-red-400'}`}>
            <span>Session:</span>
            <span>{diagnostic?.sessionValid ? 'VALID' : 'INVALID'}</span>
          </div>
          
          {diagnostic?.userInfo && (
            <div className="text-green-400">
              <span>User: {diagnostic.userInfo.phone}</span>
            </div>
          )}
          
          {diagnostic?.error && (
            <div className="text-red-400">
              <span>Error: {diagnostic.error}</span>
            </div>
          )}
        </div>
        
        {showDetails && diagnostic && (
          <div className="mt-3 pt-2 border-t border-slate-600 text-xs">
            <div className="space-y-1">
              <div>
                <span className="text-slate-400">Cookie Value:</span>
                <div className="text-slate-300 break-all">{diagnostic.cookieValue || 'None'}</div>
              </div>
              
              {diagnostic.userInfo && (
                <div>
                  <span className="text-slate-400">User Info:</span>
                  <pre className="text-slate-300 text-xs mt-1 overflow-auto max-h-32">
                    {JSON.stringify(diagnostic.userInfo, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="text-slate-500">
                Last check: {new Date(diagnostic.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={runDiagnostic}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}