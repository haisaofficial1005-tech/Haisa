import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/auth.options";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Jika sudah login, redirect ke halaman yang sesuai
  if (session) {
    // Cek role user (bisa ditambahkan logic role nanti)
    redirect("/customer");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Haisa WA</h1>
          <p className="text-slate-400">Sistem Manajemen Tiket</p>
        </div>

        {/* Description */}
        <div className="bg-slate-800/50 rounded-xl p-6 space-y-4">
          <p className="text-slate-300 text-sm">
            Kelola tiket layanan dengan mudah. Submit tiket baru, track status, 
            dan terima notifikasi via WhatsApp.
          </p>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-medium py-3 px-6 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Login dengan Google
          </Link>
        </div>

        {/* Footer */}
        <p className="text-slate-500 text-xs">
          © 2024 Haisa WA. All rights reserved.
        </p>
      </div>
    </div>
  );
}
