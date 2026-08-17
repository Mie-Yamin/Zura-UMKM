import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getLocalRecaps, getLocalProducts } from '../api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const formatRupiah = (val?: number) => {
  if (val === undefined) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function FinancePage() {
  const queryClient = useQueryClient();

  // Read recaps & products for real-time calculations
  const recaps = useMemo(() => getLocalRecaps(), [queryClient]);
  const products = useMemo(() => getLocalProducts(), [queryClient]);

  // States
  const [selectedPeriod, setSelectedPeriod] = useState<'3_bulan' | '6_bulan' | '1_tahun'>('6_bulan');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Calculate SaaS financial metrics
  const finances = useMemo(() => {
    const recapRevenue = recaps.reduce((sum, r) => sum + r.totalAmount, 0);
    const recapAdminFee = recaps.reduce((sum, r) => sum + r.adminFee, 0);

    // HPP calculations
    let recapHpp = 0;
    recaps.forEach((r) => {
      if (r.items) {
        r.items.forEach((item) => {
          const product = products.find((p) => p.id === item.id);
          const buyPrice = product?.buyPrice ?? (item.price * 0.75); // fallback to 75% of sell price
          recapHpp += buyPrice * item.qty;
        });
      } else {
        recapHpp += r.totalAmount * 0.70; // assume 70% HPP for recaps without item breakdown
      }
    });

    // Base historical financial values
    const baseRevenue = 66500000;
    const baseHpp = 28200000;
    const baseAdminFee = 2450000; // historical admin fees
    const baseOperational = 3200000; // Sewa: 1.0M, Gaji: 1.5M, Listrik/Air: 700K

    const totalRevenue = baseRevenue + recapRevenue;
    const totalHpp = baseHpp + recapHpp;
    const totalAdminFee = baseAdminFee + recapAdminFee;
    const totalExpenses = totalHpp + totalAdminFee + baseOperational;
    const netProfit = totalRevenue - totalExpenses;
    const cashflow = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalHpp,
      totalAdminFee,
      totalExpenses,
      netProfit,
      cashflow,
      sewa: 1000000,
      gaji: 1500000,
      listrik: 700000,
      operational: baseOperational,
    };
  }, [recaps, products]);

  // 2. Generate monthly cashflow comparison chart data
  const chartData = useMemo(() => {
    const data12Months = [
      { bulan: 'Sep 25', Pemasukan: 48000000, Pengeluaran: 28000000 },
      { bulan: 'Okt 25', Pemasukan: 51200000, Pengeluaran: 31500000 },
      { bulan: 'Nov 25', Pemasukan: 49800000, Pengeluaran: 29800000 },
      { bulan: 'Des 25', Pemasukan: 55400000, Pengeluaran: 33000000 },
      { bulan: 'Jan 26', Pemasukan: 52000000, Pengeluaran: 31200000 },
      { bulan: 'Feb 26', Pemasukan: 47500000, Pengeluaran: 29400000 },
      { bulan: 'Mar 26', Pemasukan: 61000000, Pengeluaran: 35100000 },
      { bulan: 'Apr 26', Pemasukan: 58750000, Pengeluaran: 32800000 },
      { bulan: 'Mei 26', Pemasukan: 67200000, Pengeluaran: 33400000 },
      { bulan: 'Jun 26', Pemasukan: 71500000, Pengeluaran: 36500000 },
      { bulan: 'Jul 26', Pemasukan: 68300000, Pengeluaran: 34000000 },
      {
        bulan: 'Agu 26 (Kini)',
        Pemasukan: finances.totalRevenue,
        Pengeluaran: finances.totalExpenses,
      },
    ];

    if (selectedPeriod === '3_bulan') {
      return data12Months.slice(-3);
    } else if (selectedPeriod === '6_bulan') {
      return data12Months.slice(-6);
    }
    return data12Months;
  }, [selectedPeriod, finances]);

  // 3. AI Financial Narrative Summary Generator
  const aiNarrativeText = useMemo(() => {
    const profitMargin = ((finances.netProfit / finances.totalRevenue) * 100).toFixed(1);

    return `Kesehatan Keuangan SaaS Command Center dinilai Sangat Sehat (A) dengan Laba Bersih aktual ${formatRupiah(finances.netProfit)} dan Margin Laba Bersih ${profitMargin}%. Biaya admin platform rata-rata berkontribusi sebesar 4.2% dari omzet kotor. AI menyarankan optimasi pengunggahan laporan rekap Shopee dan Tokopedia setiap hari Jumat sore untuk menghindari keterlambatan pembukuan kas bulanan.`;
  }, [finances]);

  // 4. Excel/PDF Export Trigger
  const handleExport = (type: 'Excel' | 'PDF') => {
    setIsExporting(type);

    setTimeout(() => {
      setIsExporting(null);

      if (type === 'Excel') {
        const headers = 'Komponen Laporan Finansial,Jumlah (Rupiah)\n';
        const rows = [
          `Pemasukan Kotor (Omzet),${finances.totalRevenue}`,
          `Harga Pokok Penjualan (HPP),${finances.totalHpp}`,
          `Biaya Admin Platform Marketplace,${finances.totalAdminFee}`,
          `Laba Kotor,${finances.totalRevenue - finances.totalHpp - finances.totalAdminFee}`,
          `Beban Sewa Toko,${finances.sewa}`,
          `Beban Gaji Karyawan,${finances.gaji}`,
          `Beban Listrik & Air,${finances.listrik}`,
          `Total Pengeluaran Buku Kas,${finances.totalExpenses}`,
          `Laba Bersih Riil,${finances.netProfit}`,
        ].join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan_keuangan_saas_zura.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Laporan Keuangan Laba/Rugi berhasil diunduh dalam format Excel (CSV)!');
      } else {
        showToast('Laporan Keuangan PDF berhasil dibuat dan dicetak!');
        window.print();
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-6 flex flex-col gap-6 font-dmsans" aria-label="Laporan Keuangan Laba Rugi">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* Export Loader Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
            <span className="w-10 h-10 border-4 border-[#5F1E1E] border-t-transparent rounded-full animate-spin"></span>
            <div className="flex flex-col gap-1">
              <p className="font-extrabold text-[#5F1E1E] text-sm">Menyiapkan Berkas Laporan</p>
              <p className="text-xs text-[#B48328] font-bold">Sedang memproses pengeksporan berkas {isExporting}...</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── HEADER FINANSIAL ─── */}
      <header className="bg-white p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">Laporan Keuangan & Laba Rugi</h1>
          <p className="text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">Analisis margin operasional laba rugi riil, komisi admin platform marketplace, dan visualisasi arus kas.</p>
        </div>
      </header>

      {/* ─── KARTU METRIK UTAMA ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Ringkasan Finansial">

        {/* Pemasukan Kotor */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#5F1E1E] uppercase tracking-wider">Pemasukan Kotor (Bruto)</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-[#B48328] tracking-tight">{formatRupiah(finances.totalRevenue)}</h3>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[10px] font-bold px-2 py-0.5 rounded">Omzet</span>
          </div>
        </article>

        {/* Biaya Admin Platform */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#5F1E1E] uppercase tracking-wider">Biaya Admin Platform</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-[#EF4444] tracking-tight">-{formatRupiah(finances.totalAdminFee)}</h3>
            <span className="bg-red-50 text-[#EF4444] text-[10px] font-bold px-2 py-0.5 rounded">Fee Cuts</span>
          </div>
        </article>

        {/* Beban Operasional */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#5F1E1E] uppercase tracking-wider">Beban Operasional</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-[#5F1E1E] tracking-tight">{formatRupiah(finances.operational)}</h3>
            <span className="bg-[#E8D3A7]/50 text-[#5F1E1E] text-[10px] font-semibold px-2 py-0.5 rounded">Sewa + Gaji</span>
          </div>
        </article>

        {/* Laba Bersih Riil */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#5F1E1E] uppercase tracking-wider">Laba Bersih Riil</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-[#B48328] tracking-tight">{formatRupiah(finances.netProfit)}</h3>
            <span className="bg-[#E5C88B] text-[#5F1E1E] text-[10px] font-bold px-2 py-0.5 rounded border border-[#5F1E1E]/20">Estimasi Net</span>
          </div>
        </article>

      </section>

      {/* ─── TENGAH: GRAFIK TREN ARUS KAS & RANGKUMAN AI ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kiri: Grafik Tren Arus Kas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">Tren Arus Kas Bulanan (Cashflow)</h2>
              <p className="text-xs font-medium text-[#B48328]">Komparasi Pemasukan kotor vs Pengeluaran total bulanan.</p>
            </div>

            {/* Period Selector */}
            <div className="flex bg-[#E8D3A7]/30 border-2 border-[#B48328] rounded-xl p-0.5">
              {(['3_bulan', '6_bulan', '1_tahun'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${selectedPeriod === period
                    ? 'bg-[#5F1E1E] text-[#E8D3A7] shadow-sm'
                    : 'text-[#5F1E1E] hover:bg-[#E8D3A7]/50'
                    }`}
                >
                  {period === '3_bulan' ? '3 Bulan' : period === '6_bulan' ? '6 Bulan' : '1 Tahun'}
                </button>
              ))}
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#5F1E1E', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10, fill: '#5F1E1E', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#5F1E1E', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                  formatter={(value: any) => [formatRupiah(value), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="Pemasukan"
                  name="Pemasukan Kotor (Bruto)"
                  stroke="#B48328"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#B48328' }}
                />
                <Line
                  type="monotone"
                  dataKey="Pengeluaran"
                  name="Pengeluaran Total (HPP + Ops + Fee)"
                  stroke="#5F1E1E"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#5F1E1E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kanan: AI Summary Narrative */}
        <div className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B48328]"></span>
              Rangkuman Finansial AI
            </h2>
            <p className="text-xs font-medium text-[#B48328]">Analisis kesehatan operasional dari asisten kecerdasan buatan.</p>
          </div>

          <div className="bg-[#E8D3A7]/30 border border-[#B48328]/30 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-xs font-medium text-[#5F1E1E] leading-relaxed">
              {aiNarrativeText}
            </p>
            <div className="border-t border-[#B48328]/30 pt-3 flex justify-between text-xs font-extrabold text-[#5F1E1E]">
              <span>Rasio Net Profit Margin:</span>
              <span className="text-[#B48328]">{((finances.netProfit / finances.totalRevenue) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

      </section>

      {/* ─── BAWAH: RINCIAN LABA RUGI & EKSPOR ─── */}
      <section className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">

        {/* Table Header with Active Exports */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">Laporan Rincian Laba / Rugi Omnichannel</h2>
            <p className="text-xs font-medium text-[#B48328]">Komponen rincian pendapatan kotor, pengeluaran, HPP, komisi platform, dan keuntungan bersih.</p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('Excel')}
              className="bg-white border-2 border-[#B48328] hover:bg-[#E8D3A7]/20 text-[#5F1E1E] font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 stroke-[#5F1E1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Ekspor Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport('PDF')}
              className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ekspor PDF / Cetak
            </button>
          </div>
        </div>

        {/* Laba Rugi Table*/}
        <div className="max-w-xl mx-auto w-full">
          <table className="w-full text-left text-xs border-collapse font-bold text-[#5F1E1E]" role="table">
            <tbody className="divide-y divide-slate-100">

              {/* 1. Pendapatan */}
              <tr>
                <td className="py-3 font-extrabold text-sm text-[#5F1E1E]">1. Pendapatan Penjualan (Bruto)</td>
                <td className="py-3 text-right font-black text-sm text-[#5F1E1E]">{formatRupiah(finances.totalRevenue)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Pendapatan dari Laporan Impor Rekap</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(finances.totalRevenue - 66500000)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Pendapatan Pokok Historis (Omnichannel)</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(66500000)}</td>
              </tr>

              {/* 2. HPP */}
              <tr>
                <td className="py-3 font-extrabold text-sm text-[#5F1E1E]">2. Harga Pokok Penjualan (HPP)</td>
                <td className="py-3 text-right font-black text-sm text-[#5F1E1E]">{formatRupiah(finances.totalHpp)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">HPP Terjual dari Rekap Terunggah</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(finances.totalHpp - 28200000)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">HPP Persediaan Terjual Historis</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(28200000)}</td>
              </tr>

              {/* 3. Biaya Admin Platform */}
              <tr>
                <td className="py-3 font-extrabold text-sm text-[#5F1E1E]">3. Komisi & Biaya Admin Platform Marketplace</td>
                <td className="py-3 text-right font-black text-sm text-[#5F1E1E]">{formatRupiah(finances.totalAdminFee)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Potongan Admin Rekap Terunggah (4%-6%)</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(finances.totalAdminFee - 2450000)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Potongan Admin Historis</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(2450000)}</td>
              </tr>

              {/* Laba Kotor */}
              <tr className="bg-[#E8D3A7]/30">
                <td className="py-3 font-black pl-3 text-[#5F1E1E]">LABA KOTOR (Pendapatan - HPP - Admin Platform)</td>
                <td className="py-3 text-right font-black pr-3 text-[#5F1E1E]">{formatRupiah(finances.totalRevenue - finances.totalHpp - finances.totalAdminFee)}</td>
              </tr>

              {/* 4. Beban Operasional */}
              <tr>
                <td className="py-3 font-extrabold text-sm text-[#5F1E1E]">4. Beban Operasional Bulanan</td>
                <td className="py-3 text-right font-black text-sm text-[#5F1E1E]">{formatRupiah(finances.operational)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Beban Sewa Toko Utama & Gudang Pusat</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(1000000)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Beban Gaji Karyawan Toko</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(1500000)}</td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Tagihan Utilitas Listrik & Air Gudang</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">{formatRupiah(700000)}</td>
              </tr>

              {/* Laba Bersih Riil (Net Profit) */}
              <tr className="bg-[#5F1E1E] text-[#E8D3A7] border-t-2 border-[#B48328]">
                <td className="py-3.5 font-extrabold text-sm pl-3">LABA BERSIH RIIL (Net Profit)</td>
                <td className="py-3.5 text-right font-black text-sm pr-3 text-[#E5C88B]">{formatRupiah(finances.netProfit)}</td>
              </tr>

            </tbody>
          </table>
        </div>

      </section >

    </div >
  );
}