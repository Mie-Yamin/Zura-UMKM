import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLocalRecaps, getLocalProducts, fetchCustomers } from '../api/client';
import type { SalesRecap, Product, Customer } from '../types';
import { generateGrokInsights } from '../api/grokService';

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

const formatMessageText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx} className="font-extrabold text-[#5F1E1E]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <React.Fragment key={lineIdx}>
        {renderedLine}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export default function AiInsightsPage() {
  // ─── AMBIL DATA FIRESTORE SECARA ASYNC VIA USEQUERY (SOLUSI REDUCE CRASH) ───
  const { data: rawRecaps = [], isLoading: loadingRecaps } = useQuery({
    queryKey: ['recaps'],
    queryFn: async () => {
      const res = await getLocalRecaps();
      return Array.isArray(res) ? res : [];
    },
  });

  const { data: rawProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await getLocalProducts();
      return Array.isArray(res) ? res : [];
    },
  });

  const { data: rawCustomers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetchCustomers();
      return Array.isArray(res) ? res : [];
    },
  });

  // Jaminan pengaman bertipe Array murni
  const recaps = useMemo(() => (Array.isArray(rawRecaps) ? rawRecaps : []), [rawRecaps]);
  const products = useMemo(() => (Array.isArray(rawProducts) ? rawProducts : []), [rawProducts]);
  const customers = useMemo(() => (Array.isArray(rawCustomers) ? rawCustomers : []), [rawCustomers]);

  // Ambil laporan AI dinamis menggunakan Groq
  const { data: aiInsightsText, isLoading: loadingInsights } = useQuery({
    queryKey: ['ai-insights-report', products.length, recaps.length],
    queryFn: () => generateGrokInsights(products, recaps),
    enabled: products.length > 0 || recaps.length > 0,
  });

  // States
  const [selectedChannel, setSelectedChannel] = useState('Semua Saluran');

  // 1. Perhitungan Statistik Dasar AI
  const aiMetrics = useMemo(() => {
    const filteredRecaps =
      selectedChannel === 'Semua Saluran'
        ? recaps
        : recaps.filter((r) => r.source === selectedChannel);

    const totalOmzet = filteredRecaps.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalUnits = filteredRecaps.reduce((sum, r) => sum + (r.unitsSold || 0), 0);
    const totalAdminFee = filteredRecaps.reduce((sum, r) => sum + (r.adminFee || 0), 0);

    const understockCount = products.filter((p) => p.stockCount <= (p.minStock || 10)).length;
    const deadstockCount = products.filter((p) => p.isDeadstock === true).length;

    return {
      totalOmzet,
      totalUnits,
      totalAdminFee,
      understockCount,
      deadstockCount,
      totalSKU: products.length,
    };
  }, [recaps, products, selectedChannel]);

  // 2. AI Recommendation Generator Logic
  const aiRecommendations = useMemo(() => {
    const recs = [];

    if (aiMetrics.understockCount > 0) {
      recs.push({
        type: 'CRITICAL',
        title: 'Pengadaan Stok Segera (Restock Warning)',
        desc: `Terdapat ${aiMetrics.understockCount} SKU produk dengan stok kritis di bawah batas minimum. Disarankan untuk segera melakukan restock ke pemasok agar tidak kehilangan potensi penjualan.`,
        action: 'Restock Sekarang',
      });
    }

    if (aiMetrics.deadstockCount > 0) {
      recs.push({
        type: 'WARNING',
        title: 'Optimasi Produk Mengendap (Deadstock)',
        desc: `Ditemukan ${aiMetrics.deadstockCount} SKU produk yang tidak mengalami pergerakan dalam 30+ hari terakhir. Pertimbangkan membuat paket bundle atau diskon promo untuk mengalirkan arus kas.`,
        action: 'Buat Promo',
      });
    }

    if (aiMetrics.totalOmzet > 0) {
      const adminPercent = ((aiMetrics.totalAdminFee / aiMetrics.totalOmzet) * 100).toFixed(1);
      recs.push({
        type: 'INFO',
        title: 'Efisiensi Biaya Admin Marketplace',
        desc: `Potongan biaya admin marketplace mencapai ${adminPercent}% (${formatRupiah(aiMetrics.totalAdminFee)}) dari total omzet kotor. Dorong transaksi langsung via WhatsApp atau Web untuk margin laba lebih tinggi.`,
        action: 'Lihat Analisis Fee',
      });
    } else {
      recs.push({
        type: 'INFO',
        title: 'Belum Ada Data Penjualan Cukup',
        desc: 'Unggah laporan rekap toko online Anda dari Shopee, Tokopedia, atau TikTok Shop untuk mengaktifkan prediksi bisnis berbasis AI.',
        action: 'Impor Rekap',
      });
    }

    return recs;
  }, [aiMetrics]);

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0" aria-label="AI Business Insights & Forecaster">

      {/* ─── HEADER AI INSIGHTS ─── */}
      <header className="bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#B48328] animate-pulse"></span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">
              AI Business Intelligence & Forecaster
            </h1>
          </div>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
            Rekomendasi otomatis berbasis pembelajaran data inventaris, efisiensi komisi marketplace, dan estimasi arus kas.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            className="w-full sm:w-auto bg-white border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none uppercase min-h-[44px]"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
          >
            <option value="Semua Saluran">Semua Saluran</option>
            <option value="Shopee">Shopee</option>
            <option value="Tokopedia">Tokopedia</option>
            <option value="TikTok Shop">TikTok Shop</option>
            <option value="Manual">Manual / POS</option>
          </select>
        </div>
      </header>

      {/* ─── RINGKASAN PERSPECTIVE METRICS ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <article className="bg-white rounded-2xl p-4 shadow-sm border border-transparent flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-[#5F1E1E] uppercase">Total Omzet Diproses</span>
          <h3 className="text-xl font-extrabold text-[#B48328] mt-2">{formatRupiah(aiMetrics.totalOmzet)}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">{aiMetrics.totalUnits} Unit Terjual</p>
        </article>

        <article className="bg-white rounded-2xl p-4 shadow-sm border border-transparent flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-[#5F1E1E] uppercase">Beban Komisi Admin</span>
          <h3 className="text-xl font-extrabold text-red-600 mt-2">-{formatRupiah(aiMetrics.totalAdminFee)}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Potongan Platform</p>
        </article>

        <article className="bg-white rounded-2xl p-4 shadow-sm border border-transparent flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-[#5F1E1E] uppercase">Risiko Out-Of-Stock</span>
          <h3 className="text-xl font-extrabold text-red-600 mt-2">{aiMetrics.understockCount} SKU</h3>
          <p className="text-[10px] text-red-500 font-bold mt-1">Butuh Restock Cepat</p>
        </article>

        <article className="bg-white rounded-2xl p-4 shadow-sm border border-transparent flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-[#5F1E1E] uppercase">Produk Deadstock</span>
          <h3 className="text-xl font-extrabold text-slate-600 mt-2">{aiMetrics.deadstockCount} SKU</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">30+ Hari Tanpa Penjualan</p>
        </article>
      </section>

      {/* ─── KARTU REKOMENDASI AI DINAMIS ─── */}
      {loadingInsights || loadingRecaps || loadingProducts ? (
        <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 w-full animate-pulse border border-transparent">
          <div className="h-5 bg-slate-200 rounded-lg w-1/3"></div>
          <div className="h-px bg-slate-100 my-2"></div>
          <div className="flex flex-col gap-3">
            <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
            <div className="h-4 bg-slate-100 rounded-lg w-5/6"></div>
            <div className="h-4 bg-slate-100 rounded-lg w-4/5"></div>
            <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 w-full">
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B48328] animate-pulse"></span>
            Rekomendasi Tindakan Strategis Bisnis (Grok AI)
          </h2>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 p-1 font-medium">
            {aiInsightsText ? formatMessageText(aiInsightsText) : (
              <p className="text-slate-400 font-semibold italic text-center py-6">
                Belum ada data transaksi atau produk yang cukup untuk dianalisis oleh AI.
              </p>
            )}
          </div>
        </section>
      )}

    </div>
  );
}