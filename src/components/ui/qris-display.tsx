/**
 * QRIS Display Component
 * Menampilkan kode QRIS dengan informasi pembayaran
 */

import Image from 'next/image';
import { formatIDR } from '@/core/payment/qris';

interface QrisDisplayProps {
  amount: number;
  uniqueCode: string;
  className?: string;
}

export function QrisDisplay({ amount, uniqueCode, className = '' }: QrisDisplayProps) {
  return (
    <div className={`bg-blue-500/20 border border-blue-500 rounded-lg p-6 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Scan QRIS untuk Pembayaran</h3>
        <div className="space-y-1">
          <p className="text-blue-300">
            <span className="font-semibold">Nominal: {formatIDR(amount)}</span>
          </p>
          <p className="text-blue-300 text-sm">
            Kode Unik: <span className="font-mono font-bold">{uniqueCode}</span>
          </p>
        </div>
      </div>
      
      {/* QRIS Code */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <Image
            src="/qris.png"
            alt="QRIS Code"
            width={200}
            height={200}
            className="w-48 h-48 object-contain"
            priority
          />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-blue-300 text-sm">
          Scan kode QRIS di atas dengan aplikasi pembayaran Anda
        </p>
        <p className="text-blue-200 font-semibold">
          Pastikan nominal yang dibayar: {formatIDR(amount)}
        </p>
        <p className="text-blue-300 text-xs">
          Nominal sudah termasuk kode unik untuk verifikasi otomatis
        </p>
      </div>
    </div>
  );
}