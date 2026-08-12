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

  // Combine Sales projections for Recharts using AI Violet colors
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-6 flex flex-col gap-6" aria-label="AI Insights Hub">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-sm gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER AI BANNER ─── */}
      <header className="bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#3B82F6] rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 21m0 0l-.813-5.096L3.6 15.3M9 21l5.4-5.7m-2.868-6.104l1.906-17.15a1.204 1.204 0 0 1 2.384 0l1.906 17.15a1.204 1.204 0 0 1-2.384 0Z" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start border border-white/10">
            Analisis Kesehatan Finansial AI
          </span>
          <h1 className="text-xl font-bold mt-1">Kesehatan Finansial Bisnis: Sangat Sehat (A+)</h1>
          <p className="text-sm text-white/90 leading-relaxed max-w-3xl">
            Proyeksi omzet Anda untuk bulan depan diperkirakan meningkat sebesar **9,4%** didorong oleh kenaikan penjualan kategori Indomie dan minuman dingin. Terdapat **3 item lambat (slow-moving)** yang dianjurkan untuk diberikan diskon promosi guna meningkatkan perputaran kas operasional.
          </p>
        </div>
      </header>

      {/* ─── BARIS ATAS (Prediksi Berjalan) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kartu 1: Prediksi Restock Minggu Depan */}
        <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
              Prediksi Restock Minggu Depan
            </h2>
            <p className="text-xs text-text-secondary">Rekomendasi jumlah pengadaan stok berdasarkan pola penjualan bulanan.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" role="table">
              <thead>
                <tr className="border-b border-slate-100 text-text-secondary">
                  <th className="pb-2 font-semibold">Nama Barang</th>
                  <th className="pb-2 font-semibold">Estimasi Order</th>
                  <th className="pb-2 font-semibold text-right">Urgensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restockPredictions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-text-primary">{item.name}</td>
                    <td className="py-2.5 text-text-primary font-semibold">{item.qty} Unit</td>
                    <td className="py-2.5 text-right">
                      {item.urgency === 'Tinggi' ? (
                        <span className="bg-red-50 text-[#EF4444] border border-red-100 font-bold px-2 py-0.5 rounded text-[10px]">
                          Tinggi
                        </span>
                      ) : item.urgency === 'Sedang' ? (
                        <span className="bg-amber-50 text-[#F59E0B] border border-amber-100 font-bold px-2 py-0.5 rounded text-[10px]">
                          Sedang
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-[#10B981] border border-emerald-100 font-bold px-2 py-0.5 rounded text-[10px]">
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
        <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
                Prediksi Omzet & Kas Bulan Depan
              </h2>
              <p className="text-xs text-text-secondary">Estimasi tren pendapatan bisnis jangka pendek.</p>
            </div>
            <span className="bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-bold px-2 py-1 rounded">
              Akurasi: 94.2%
            </span>
          </div>

          <div className="h-60 w-full relative">
            {salesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-text-secondary">
                Memuat proyeksi...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiColorProjections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    formatter={(value: any) => [formatRupiah(value), 'Pendapatan']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="Omzet Riil"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="none"
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="Proyeksi AI"
                    stroke="#8B5CF6"
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
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
            Rekomendasi Penyesuaian Harga & Promosi AI
          </h2>
          <p className="text-xs text-text-secondary">Saran promosi dinamis untuk mempercepat perputaran inventaris dan optimasi margin kotor.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all duration-300 ${
                promo.status === 'applied'
                  ? 'bg-slate-50 border-slate-100 opacity-60'
                  : promo.status === 'ignored'
                  ? 'bg-slate-50 border-slate-100 opacity-30 line-through'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-text-primary leading-relaxed">{promo.text}</p>
                <span className="text-[10px] text-[#8B5CF6] font-bold bg-[#8B5CF6]/10 px-2 py-0.5 rounded self-start">
                  {promo.impact}
                </span>
              </div>

              {promo.status === 'pending' ? (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleIgnorePromo(promo.id)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-medium transition-colors"
                  >
                    Abaikan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPromo(promo.id, promo.text)}
                    className="flex-1 px-3 py-1.5 bg-[#8B5CF6] hover:bg-violet-600 text-white rounded text-[11px] font-bold transition-all shadow-sm active:scale-95"
                  >
                    Terapkan Diskon ke Sistem
                  </button>
                </div>
              ) : (
                <div className="text-[11px] font-semibold text-center mt-2 pt-2 border-t border-slate-100 text-slate-500">
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
        <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
              Analisis Pola Belanja Pelanggan
            </h2>
            <p className="text-xs text-text-secondary">Pola kombinasi item terpopuler dan analisis Best-Seller.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-1">
              <h4 className="font-semibold text-xs text-text-primary">Kombinasi Terpopuler: Teh Botol Sosro & Indomie Goreng</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Data transaksi mendeteksi **72%** pelanggan membeli Teh Botol Sosro 350ml bersamaan dengan Indomie Goreng Spesial. Disarankan membuat promo bundel untuk kategori ini di POS.
              </p>
            </div>
            
            <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-1">
              <h4 className="font-semibold text-xs text-text-primary">Produk Terlaris Minggu Ini: Kopi Kapal Api</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Mengalami pertumbuhan unit terjual sebesar **+22%** dibandingkan rata-rata mingguan. Disarankan menaikkan tingkat persediaan pengadaan minimum sebesar 15%.
              </p>
            </div>
          </div>
        </article>

        {/* Kanan: Laporan Keuangan AI & Saran Efisiensi */}
        <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
              Laporan Ringkasan Finansial AI
            </h2>
            <p className="text-xs text-text-secondary">Laporan laba rugi dan rekomendasi efisiensi operasional.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
            <div className="bg-slate-50 p-2.5 rounded-lg text-center">
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Laba Kotor</p>
              <p className="text-xs font-bold text-text-primary mt-0.5">{formatRupiah(35800000)}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg text-center">
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Laba Bersih</p>
              <p className="text-xs font-bold text-text-primary mt-0.5">{formatRupiah(28500000)}</p>
            </div>
            <div className="bg-[#8B5CF6]/10 p-2.5 rounded-lg text-center">
              <p className="text-[10px] text-[#8B5CF6] font-bold uppercase tracking-wider">Margin Operasional</p>
              <p className="text-xs font-bold text-[#8B5CF6] mt-0.5">42.5%</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-xs text-text-primary">Saran Efisiensi Operasional:</h4>
            <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1.5">
              <li>Kurangi frekuensi order untuk item deadstock seperti **Aqua Galon** guna mencegah dana kas mandek.</li>
              <li>Lakukan negosiasi ulang kontrak pengadaan Indomie dengan distributor untuk meningkatkan margin kotor kategori sebesar **3.5%**.</li>
              <li>Alokasikan kas berlebih ke kategori minuman dingin menjelang periode kenaikan suhu harian berdasarkan ramalan musim.</li>
            </ul>
          </div>
        </article>

      </section>

    </div>
  );
}
