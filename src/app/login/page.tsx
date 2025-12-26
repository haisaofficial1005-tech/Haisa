'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginStep = 'phone' | 'password' | 'set-password';

interface UserInfo {
  userExists: boolean;
  hasPassword: boolean;
  userName?: string;
  nextStep: 'login' | 'set-password';
}

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Normalize phone: remove +, spaces, dashes, keep only digits
  const normalizePhone = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizePhone(e.target.value);
    setPhone(normalized);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (phone.length < 10) {
      setError('Nomor WhatsApp minimal 10 digit');
      setLoading(false);
      return;
    }

    if (phone.length > 15) {
      setError('Nomor WhatsApp maksimal 15 digit');
      setLoading(false);
      return;
    }

    if (!/^\d+$/.test(phone)) {
      setError('Nomor WhatsApp hanya boleh berisi angka');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.success) {
        setUserInfo(data);
        if (data.nextStep === 'login') {
          setStep('password');
        } else {
          setStep('set-password');
        }
      } else {
        setError(data.error || 'Terjadi kesalahan');
        
        if (data.retryAfter) {
          setError(`Terlalu banyak percobaan. Coba lagi dalam ${data.retryAfter} detik.`);
        }
      }
    } catch (err) {
      console.error('Check phone error:', err);
      setError('Terjadi kesalahan koneksi. Periksa internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect based on user role
        if (data.user.role === 'ADMIN' || data.user.role === 'OPS' || data.user.role === 'AGENT') {
          router.push('/ops/dashboard');
        } else {
          router.push('/customer/dashboard');
        }
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan koneksi. Periksa internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect based on user role
        if (data.user.role === 'ADMIN' || data.user.role === 'OPS' || data.user.role === 'AGENT') {
          router.push('/ops/dashboard');
        } else {
          router.push('/customer/dashboard');
        }
      } else {
        setError(data.error || 'Gagal membuat password');
      }
    } catch (err) {
      console.error('Set password error:', err);
      setError('Terjadi kesalahan koneksi. Periksa internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setError('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Haisa WA</h1>
        
        {step === 'phone' && (
          <>
            <p className="text-slate-400 text-center mb-6">Masuk dengan nomor WhatsApp</p>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Contoh: 6281234567890"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                  minLength={10}
                  maxLength={15}
                />
                <p className="text-slate-500 text-xs mt-1">Masukkan nomor WhatsApp tanpa tanda + (contoh: 6281234567890)</p>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !phone || phone.length < 10}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Memproses...' : 'Lanjutkan'}
              </button>
            </form>
          </>
        )}

        {step === 'password' && userInfo && (
          <>
            <div className="text-center mb-6">
              <p className="text-slate-400">Selamat datang kembali!</p>
              <p className="text-white font-medium">{userInfo.userName || phone}</p>
              <p className="text-slate-500 text-sm">Masukkan password Anda</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
                
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  ← Kembali
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'set-password' && (
          <>
            <div className="text-center mb-6">
              <p className="text-slate-400">
                {userInfo?.userExists ? 'Atur Password Baru' : 'Selamat Datang!'}
              </p>
              <p className="text-white font-medium">{phone}</p>
              <p className="text-slate-500 text-sm">
                {userInfo?.userExists 
                  ? 'Atur password untuk keamanan akun Anda' 
                  : 'Buat password untuk akun baru Anda'
                }
              </p>
            </div>
            
            <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
              {!userInfo?.userExists && (
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Nama (opsional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama kamu"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-sm mb-1">Password Baru</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword || password.length < 6}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Memproses...' : (userInfo?.userExists ? 'Atur Password' : 'Buat Akun')}
                </button>
                
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  ← Kembali
                </button>
              </div>
            </form>
          </>
        )}

        <p className="text-slate-500 text-xs text-center mt-6">
          Dengan masuk, kamu menyetujui syarat dan ketentuan kami
        </p>
      </div>
    </div>
  );
}
