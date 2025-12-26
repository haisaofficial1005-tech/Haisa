/**
 * FAQ Page - Frequently Asked Questions
 */

import Link from 'next/link';

const faqs = [
  {
    category: "Unblock WhatsApp",
    questions: [
      {
        q: "Berapa lama proses unblock WhatsApp?",
        a: "Proses unblock WhatsApp biasanya memakan waktu 1-3 hari kerja setelah pembayaran dikonfirmasi dan dokumen lengkap diterima."
      },
      {
        q: "Apa saja dokumen yang diperlukan?",
        a: "Anda perlu menyediakan screenshot error WhatsApp, nomor yang diblokir, dan bukti identitas. Tim kami akan memandu Anda melalui proses pengajuan."
      },
      {
        q: "Apakah ada jaminan berhasil?",
        a: "Kami memiliki tingkat keberhasilan tinggi, namun hasil tergantung pada jenis dan tingkat keparahan blokir. Jika tidak berhasil, kami akan memberikan refund sesuai kebijakan."
      },
      {
        q: "Berapa biaya unblock WhatsApp?",
        a: "Biaya unblock WhatsApp adalah Rp 50.000. Pembayaran dapat dilakukan melalui QRIS atau transfer bank."
      }
    ]
  },
  {
    category: "Jual Gmail",
    questions: [
      {
        q: "Berapa harga jual akun Gmail?",
        a: "Harga berkisar Rp 15.000 - 25.000 tergantung usia akun, jumlah email, dan fitur keamanan yang aktif. Akun yang lebih lama dan memiliki banyak email biasanya lebih mahal."
      },
      {
        q: "Bagaimana proses penjualan Gmail?",
        a: "1) Ajukan penjualan melalui form, 2) Tim kami verifikasi akun Anda, 3) Jika disetujui, Anda transfer akun, 4) Pembayaran dikirim ke rekening/e-wallet Anda dalam 1-2 hari kerja."
      },
      {
        q: "Apa syarat akun Gmail yang bisa dijual?",
        a: "Akun harus aktif, bisa login, tidak dalam kondisi suspended, dan memiliki akses penuh. Akun dengan 2FA aktif dan recovery info lengkap lebih bernilai."
      },
      {
        q: "Bagaimana keamanan data saya?",
        a: "Kami menggunakan enkripsi untuk menyimpan password dan data sensitif. Setelah verifikasi selesai, data akan dihapus dari sistem kami."
      }
    ]
  },
  {
    category: "Pembayaran & Akun",
    questions: [
      {
        q: "Metode pembayaran apa saja yang tersedia?",
        a: "Untuk unblock WhatsApp: QRIS dan transfer bank. Untuk penjualan Gmail: kami transfer ke rekening bank atau e-wallet Anda (OVO, GoPay, DANA)."
      },
      {
        q: "Bagaimana cara login ke akun?",
        a: "Cukup masukkan nomor WhatsApp Anda (tanpa tanda +). Sistem akan otomatis membuat akun jika belum ada. Tidak perlu password atau verifikasi tambahan."
      },
      {
        q: "Apakah data saya aman?",
        a: "Ya, kami menggunakan enkripsi tingkat enterprise dan tidak menyimpan data sensitif lebih lama dari yang diperlukan. Semua transaksi dilindungi SSL."
      },
      {
        q: "Bagaimana cara menghubungi customer service?",
        a: "Anda bisa menghubungi kami melalui WhatsApp di +6281234567890 atau email ke support@haisa.wa. Jam operasional: Senin-Jumat, 09:00-17:00 WIB."
      }
    ]
  },
  {
    category: "Kebijakan & Lainnya",
    questions: [
      {
        q: "Apakah ada kebijakan refund?",
        a: "Ya, jika layanan unblock WhatsApp tidak berhasil dalam 7 hari kerja, Anda berhak mendapat refund 80%. Untuk penjualan Gmail, jika akun ditolak setelah verifikasi, tidak ada biaya."
      },
      {
        q: "Bisakah saya membatalkan pesanan?",
        a: "Pesanan dapat dibatalkan sebelum proses dimulai. Setelah tim mulai bekerja, pembatalan hanya bisa dilakukan dengan kebijakan refund yang berlaku."
      },
      {
        q: "Apakah layanan ini legal?",
        a: "Ya, kami menyediakan layanan bantuan teknis yang sah. Untuk unblock WhatsApp, kami membantu proses appeal resmi. Untuk Gmail, kami memfasilitasi jual-beli akun sesuai ToS yang berlaku."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Haisa WA</h1>
            <p className="text-sm text-slate-400">Frequently Asked Questions</p>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Beranda
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-slate-400">Temukan jawaban atas pertanyaan umum tentang layanan kami</p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-3">
                {category.category}
              </h3>
              
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => (
                  <details key={faqIndex} className="group">
                    <summary className="flex justify-between items-center cursor-pointer p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <span className="font-medium text-white">{faq.q}</span>
                      <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-3 p-4 text-slate-300 leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-4">Masih Ada Pertanyaan?</h3>
          <p className="text-slate-400 mb-6">
            Jika Anda tidak menemukan jawaban yang dicari, jangan ragu untuk menghubungi tim support kami.
          </p>
          
          <div className="flex justify-center gap-4">
            <a 
              href="https://wa.me/6281234567890" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              WhatsApp Support
            </a>
            
            <Link 
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Form Kontak
            </Link>
          </div>
          
          <p className="text-slate-500 text-sm mt-4">
            Jam operasional: Senin - Jumat, 09:00 - 17:00 WIB
          </p>
        </div>
      </main>
    </div>
  );
}