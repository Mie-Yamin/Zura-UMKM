import React, { useState } from 'react';
import { useSalesChart } from '../hooks/useSalesChart';
import { useRestockPlan } from '../hooks/useRestockPlan';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RestockItem {
  name: string;
  qty: number;
  urgency: 'Tinggi' | 'Sedang' | 'Rendah';
}

interface PromoRecommendation {
  id: string;
  text: string;
  impact: string;
  status: 'pending' | 'applied' | 'ignored';
}

export default function AiInsightsPage() {
  const { data: salesData, isLoading: salesLoading } = useSalesChart();
  const { data: restockData } = useRestockPlan();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [promos, setPromos] = useState<PromoRecommendation[]>([
    {
      id: 'promo-1',
      text: 'Terapkan Diskon 20% untuk Chitato Sapi Panggang 68g (Barang lambat laku, mendekati masa kedaluwarsa dalam 10 hari) guna mengembalikan modal.',
      impact: 'Potensi likuiditas: +Rp 850.000',
      status: 'pending',
    },
    {
      id: 'promo-2',
      text: 'Buat Paket Bundling: Teh Botol Sosro + Indomie Goreng untuk akhir pekan depan guna mendongkrak penjualan silang.',
      impact: 'Potensi kenaikan omzet: +15%',
      status: 'pending',
    },
    {
      id: 'promo-3',
      text: 'Naikkan harga jual Kopi Kapal Api sebesar Rp 200/unit mengikuti peningkatan indeks permintaan lokal.',
      impact: 'Potensi margin tambahan: +Rp 140.000/minggu',
      status: 'pending',
    },
  ]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyPromo = (id: string, name: string) => {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'applied' } : p))
    );
    showToast(`Diskon berhasil diterapkan ke sistem toko online!`);
  };

  const handleIgnorePromo = (id: string) => {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'ignored' } : p))
    );
    showToast('Rekomendasi diabaikan.');
  };

  // Mock Restock Predictions
  const restockPredictions: RestockItem[] = [
    { name: 'Chitato Sapi Panggang 68g', qty: 150, urgency: 'Tinggi' },
    { name: 'Indomie Goreng Spesial', qty: 240, urgency: 'Sedang' },
    { name: 'Teh Botol Sosro 350ml', qty: 180, urgency: 'Rendah' },
    { name: 'Aqua Galon 19L', qty: 20, urgency: 'Tinggi' },
  ];

  // Combine Sales projections for Recharts using Zura palette
  const combineSalesProjections = () => {
    if (!salesData) return [];
    const points = [];

    // Historical
    for (const p of salesData.historical) {
      points.push({
        bulan: new Date(p.date).toLocaleDateString('id-ID', { month: 'short' }),
        'Omzet Riil': p.revenue,
        'Proyeksi AI': null,
      });
    }

    // Connect lines
    const lastHist = salesData.historical[salesData.historical.length - 1];

    // Predictions
    for (const p of salesData.prediction) {
      if (lastHist) {
        points.push({
          bulan: new Date(lastHist.date).toLocaleDateString('id-ID', { month: 'short' }),
          'Omzet Riil': lastHist.revenue,
          'Proyeksi AI': lastHist.revenue,
        });
      }
      points.push({
        bulan: new Date(p.date).toLocaleDateString('id-ID', { month: 'short' }),
        'Omzet Riil': null,
        'Proyeksi AI': p.revenue,
      });
    }

    return points;
  };

  const projectionChartData = combineSalesProjections();

  // Currency helper
  const formatRupiah = (val?: number) => {
    if (val === undefined) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-6 flex flex-col gap-6 font-dmsans" aria-label="AI Insights Hub">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER AI BANNER (Tema Zura) ─── */}
      <header className="bg-gradient-to-r from-[#5F1E1E] via-[#4a1717] to-[#B48328] rounded-2xl p-6 text-[#E8D3A7] shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <svg className="w-48 h-48 fill-current" viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 21m0 0l-.813-5.096L3.6 15.3M9 21l5.4-5.7m-2.868-6.104l1.906-17.15a1.204 1.204 0 0 1 2.384 0l1.906 17.15a1.204 1.204 0 0 1-2.384 0Z" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <span className="bg-[#E5C88B] text-[#5F1E1E] text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-wider self-start border border-[#5F1E1E]/20">
            Analisis AI Zura Retail
          </span>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-1 text-white">Kesehatan Finansial Bisnis: Sangat Sehat (A+)</h1>
          <p className="text-xs md:text-sm text-[#E8D3A7] font-medium leading-relaxed max-w-3xl">
            Proyeksi omzet Anda untuk bulan depan diperkirakan meningkat sebesar <strong className="text-white font-extrabold">9,4%</strong> didorong oleh kenaikan penjualan kategori Indomie dan minuman dingin. Terdapat <strong className="text-white font-extrabold">3 item lambat (slow-moving)</strong> yang dianjurkan untuk diberikan diskon promosi guna meningkatkan perputaran kas operasional.
          </p>
        </div>
      </header>

      {/* ─── BARIS ATAS (Prediksi Berjalan) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kartu 1: Prediksi Restock Minggu Depan */}
        <article className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B48328]"></span>
              Prediksi Restock Minggu Depan
            </h2>
            <p className="text-xs font-medium text-[#B48328]">Rekomendasi jumlah pengadaan stok berdasarkan pola penjualan bulanan.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse" role="table">
              <thead>
                <tr className="bg-[#5F1E1E] text-[#E8D3A7] uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4">Estimasi Order</th>
                  <th className="py-3 px-4 text-right">Urgensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restockPredictions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#E8D3A7]/20 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-[#5F1E1E]">{item.name}</td>
                    <td className="py-3 px-4 text-[#B48328] font-black">{item.qty} Unit</td>
                    <td className="py-3 px-4 text-right">
                      {item.urgency === 'Tinggi' ? (
                        <span className="bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded-xl text-[9px] uppercase tracking-wider">
                          Tinggi
                        </span>
                      ) : item.urgency === 'Sedang' ? (
                        <span className="bg-amber-100 text-[#B48328] font-extrabold px-2.5 py-0.5 rounded-xl text-[9px] uppercase tracking-wider">
                          Sedang
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-xl text-[9px] uppercase tracking-wider">
                          Rendah
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Kartu 2: Prediksi Omzet & Kas Bulan Depan */}
        <article className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B48328]"></span>
                Prediksi Omzet & Kas Bulan Depan
              </h2>
              <p className="text-xs font-medium text-[#B48328]">Estimasi tren pendapatan bisnis jangka pendek.</p>
            </div>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase">
              Akurasi: 94.2%
            </span>
          </div>

          <div className="h-60 w-full relative">
            {salesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#5F1E1E]">
                Memuat proyeksi...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiColorProjections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B48328" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#B48328" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#5F1E1E', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#5F1E1E', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#5F1E1E', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                    formatter={(value: any) => [formatRupiah(value), 'Pendapatan']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="Omzet Riil"
                    stroke="#5F1E1E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="none"
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="Proyeksi AI"
                    stroke="#B48328"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#aiColorProjections)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

      </section>

      {/* ─── BARIS TENGAH (Rekomendasi Harga & Promosi) ─── */}
      <section className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B48328]"></span>
            Rekomendasi Penyesuaian Harga & Promosi AI
          </h2>
          <p className="text-xs font-medium text-[#B48328]">Saran promosi dinamis untuk mempercepat perputaran inventaris dan optimasi margin kotor.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all duration-300 ${promo.status === 'applied'
                  ? 'bg-slate-50 border-slate-100 opacity-60'
                  : promo.status === 'ignored'
                    ? 'bg-slate-50 border-slate-100 opacity-30 line-through'
                    : 'bg-white border-[#B48328]/30 hover:border-[#B48328] shadow-sm'
                }`}
            >
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-[#5F1E1E] leading-relaxed">{promo.text}</p>
                <span className="text-[10px] text-[#5F1E1E] font-extrabold bg-[#E5C88B] border border-[#5F1E1E]/20 px-2.5 py-1 rounded-xl self-start uppercase">
                  {promo.impact}
                </span>
              </div>

              {promo.status === 'pending' ? (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleIgnorePromo(promo.id)}
                    className="flex-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[11px] font-bold text-slate-600 transition-colors"
                  >
                    Abaikan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPromo(promo.id, promo.text)}
                    className="flex-1 px-3 py-2 bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95"
                  >
                    Terapkan Diskon
                  </button>
                </div>
              ) : (
                <div className="text-[11px] font-extrabold text-center mt-2 pt-2 border-t border-slate-100 text-slate-500">
                  {promo.status === 'applied' ? '✓ Telah Diterapkan' : 'Diabaikan'}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── BARIS BAWAH (Analisis Produk & Laporan Keuangan AI) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kiri: Analisis Produk Terlaris & Kombinasi Belanja */}
        <article className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B48328]"></span>
              Analisis Pola Belanja Pelanggan
            </h2>
            <p className="text-xs font-medium text-[#B48328]">Pola kombinasi item terpopuler dan analisis Best-Seller.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 border border-[#B48328]/30 rounded-2xl bg-[#E8D3A7]/20 flex flex-col gap-1">
              <h4 className="font-extrabold text-xs text-[#5F1E1E]">Kombinasi Terpopuler: Teh Botol Sosro & Indomie Goreng</h4>
              <p className="text-xs font-medium text-[#5F1E1E] leading-relaxed">
                Data transaksi mendeteksi <strong className="text-[#B48328] font-black">72%</strong> pelanggan membeli Teh Botol Sosro 350ml bersamaan dengan Indomie Goreng Spesial. Disarankan membuat promo bundel di kasir POS.
              </p>
            </div>

            <div className="p-3.5 border border-[#B48328]/30 rounded-2xl bg-[#E8D3A7]/20 flex flex-col gap-1">
              <h4 className="font-extrabold text-xs text-[#5F1E1E]">Produk Terlaris Minggu Ini: Kopi Kapal Api</h4>
              <p className="text-xs font-medium text-[#5F1E1E] leading-relaxed">
                Mengalami pertumbuhan unit terjual sebesar <strong className="text-[#B48328] font-black">+22%</strong> dibandingkan rata-rata mingguan. Disarankan menaikkan tingkat persediaan pengadaan minimum sebesar 15%.
              </p>
            </div>
          </div>
        </article>

        {/* Kanan: Laporan Keuangan AI & Saran Efisiensi */}
        <article className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B48328]"></span>
              Laporan Ringkasan Finansial AI
            </h2>
            <p className="text-xs font-medium text-[#B48328]">Laporan laba rugi dan rekomendasi efisiensi operasional.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
            <div className="bg-[#E8D3A7]/20 p-2.5 rounded-xl text-center border border-[#B48328]/20">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Laba Kotor</p>
              <p className="text-xs font-extrabold text-[#5F1E1E] mt-0.5">{formatRupiah(35800000)}</p>
            </div>
            <div className="bg-[#E8D3A7]/20 p-2.5 rounded-xl text-center border border-[#B48328]/20">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Laba Bersih</p>
              <p className="text-xs font-extrabold text-[#5F1E1E] mt-0.5">{formatRupiah(28500000)}</p>
            </div>
            <div className="bg-[#5F1E1E] p-2.5 rounded-xl text-center">
              <p className="text-[10px] text-[#E8D3A7] font-bold uppercase tracking-wider">Margin Ops</p>
              <p className="text-xs font-black text-[#E5C88B] mt-0.5">42.5%</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="font-extrabold text-xs text-[#5F1E1E]">Saran Efisiensi Operasional:</h4>
            <ul className="list-disc pl-4 text-xs font-medium text-[#5F1E1E] space-y-1.5">
              <li>Kurangi frekuensi order untuk item deadstock seperti <strong className="text-[#B48328]">Aqua Galon</strong> guna mencegah dana kas mandek.</li>
              <li>Lakukan negosiasi ulang kontrak pengadaan Indomie dengan distributor untuk meningkatkan margin kotor kategori sebesar <strong className="text-[#B48328]">3.5%</strong>.</li>
              <li>Alokasikan kas berlebih ke kategori minuman dingin menjelang periode kenaikan suhu harian berdasarkan ramalan musim.</li>
            </ul>
          </div>
        </article>

      </section>

    </div>
  );
}