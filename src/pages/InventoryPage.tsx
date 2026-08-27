import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchKpiSummary, fetchInventory, fetchRecaps } from '../api/client';

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function DashboardPage() {
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');

  // Fetch KPI & Data via React Query
  const { data: kpi, isLoading: isKpiLoading } = useQuery({
    queryKey: ['kpi'],
    queryFn: fetchKpiSummary,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });

  const { data: recaps = [] } = useQuery({
    queryKey: ['recaps'],
    queryFn: fetchRecaps,
  });

  // Hitung Stok Kritis
  const lowStockCount = useMemo(() => {
    return inventory.filter((p) => p.stockCount <= (p.minStock || 10)).length;
  }, [inventory]);

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-4 md:gap-5 font-dmsans w-full max-w-full overflow-x-hidden">

      {/* ─── 1. CARD HEADER COMMAND CENTER ─── */}
      <header className="bg-white p-5 sm:p-6 rounded-3xl border border-transparent shadow-sm flex flex-col gap-4 w-full">

        {/* Baris Judul + Indikator Titik Merah (Dipindah ke Samping Judul) */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#5F1E1E] uppercase tracking-wide leading-tight">
                BUSINESS MONITORING COMMAND CENTER
              </h1>

              {/* 💥 ELEMEN INDIKATOR STATUS DIPINDAH KE SINI 💥 */}
              <div
                className="bg-[#B48328]/20 border border-[#B48328]/40 p-2 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                title="Status Sistem Aktif"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[#B48328] mt-1.5 leading-relaxed">
              Monitoring Operasional Terpadu, Rekap Inventaris Gedung Pusat, Dan Analisis Omzet Omnichannel
            </p>
          </div>
        </div>

        {/* Baris Dropdown Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-1">
          {/* Dropdown 1: Cabang */}
          <div className="relative w-full">
            <select
              aria-label="Pilih Gudang atau Cabang"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full appearance-none bg-[#FFFDF9] border-2 border-[#B48328] text-[#5F1E1E] font-extrabold rounded-2xl pl-4 pr-10 py-3 text-xs focus:outline-none uppercase cursor-pointer shadow-inner"
            >
              <option value="ALL">SEMUA GUDANG / CABANG</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#5F1E1E]">
              <svg className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>

          {/* Dropdown 2: Rentang Waktu */}
          <div className="relative w-full">
            <select
              aria-label="Pilih Rentang Waktu Data"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full appearance-none bg-[#FFFDF9] border-2 border-[#B48328] text-[#5F1E1E] font-extrabold rounded-2xl pl-4 pr-10 py-3 text-xs focus:outline-none uppercase cursor-pointer shadow-inner"
            >
              <option value="30">30 HARI TERAKHIR</option>
              <option value="7">7 HARI TERAKHIR</option>
              <option value="90">90 HARI TERAKHIR</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#5F1E1E]">
              <svg className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>
        </div>

      </header>

      {/* ─── 2. KARTU METRIK KPI ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {/* Total Omzet */}
        <div className="bg-white p-5 rounded-3xl border border-transparent shadow-sm flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-[#5F1E1E] uppercase tracking-wider">
              TOTAL OMZET TERAKHIR
            </span>
            <span className="bg-[#5F1E1E] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase">
              OMNICHANNEL
            </span>
          </div>
          <p className="text-2xl font-black text-[#B48328] mt-2">
            {isKpiLoading ? '...' : formatRupiah(kpi?.totalRevenue)}
          </p>
        </div>

        {/* Laba Bersih Estimasi */}
        <div className="bg-white p-5 rounded-3xl border border-transparent shadow-sm flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-[#5F1E1E] uppercase tracking-wider">
              LABA BERSIH ESTIMASI
            </span>
            <span className="bg-[#5F1E1E] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase">
              ~43% MARGIN
            </span>
          </div>
          <p className="text-2xl font-black text-[#B48328] mt-2">
            {isKpiLoading ? '...' : formatRupiah((kpi?.totalRevenue || 0) * 0.43)}
          </p>
        </div>

        {/* Status Stok */}
        <div className="bg-white p-5 rounded-3xl border border-transparent shadow-sm flex flex-col justify-between gap-3 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-[#5F1E1E] uppercase tracking-wider">
              STATUS STOK GUDANG PUSAT
            </span>
            <span className="bg-[#F5EAD4] text-[#5F1E1E] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
              {lowStockCount} KRITIS
            </span>
          </div>
          <p className="text-2xl font-black text-[#5F1E1E] mt-2">
            {inventory.length} <span className="text-xs font-bold text-slate-500">TOTAL SKU</span>
          </p>
        </div>
      </section>

    </div>
  );
}