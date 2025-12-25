'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
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
        
        // Show specific error messages
        if (data.retryAfter) {
          setError(`Terlalu banyak percobaan. Coba lagi dalam ${data.retryAfter} detik.`);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan koneksi. Periksa internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Haisa WA</h1>
        <p className="text-slate-400 text-center mb-6">Masuk dengan nomor WhatsApp</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !phone || phone.length < 10}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-slate-500 text-xs text-center mt-6">
          Dengan masuk, kamu menyetujui syarat dan ketentuan kami
        </p>
      </div>
    </div>
  );
}
