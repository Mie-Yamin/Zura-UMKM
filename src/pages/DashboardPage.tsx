import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchKpiSummary, fetchInventory, fetchRecaps } from '../api/client';

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function DashboardPage() {
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [showCriticalPopover, setShowCriticalPopover] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

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

  // Filter Produk Stok Kritis
  const lowStockItems = useMemo(() => {
    return inventory.filter((p) => p.stockCount <= (p.minStock || 10));
  }, [inventory]);

  // Close popover ketika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowCriticalPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-4 md:gap-5 font-dmsans w-full max-w-full overflow-x-hidden">

      {/* ─── 1. CARD HEADER COMMAND CENTER ─── */}
      <header className="bg-white p-5 sm:p-6 rounded-3xl border border-transparent shadow-sm flex flex-col gap-4 w-full relative">

        {/* Baris Atas: Judul & Tombol Stok Kritis di Samping Kanan */}
        <div className="flex items-start justify-between gap-3">
          <div className="pr-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#5F1E1E] uppercase tracking-wide leading-tight">
              BUSINESS MONITORING COMMAND CENTER
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#B48328] mt-1.5 leading-relaxed">
              Monitoring Operasional Terpadu, Rekap Inventaris Gedung Pusat, Dan Analisis Omzet Omnichannel
            </p>
          </div>

          {/* 💥 TOMBOL PRESISI GAMBAR (BENTUK, WARNA & TITIK MERAH SAMA PERSIS) 💥 */}
          <div className="relative shrink-0" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setShowCriticalPopover(!showCriticalPopover)}
              className="bg-[#B8860B] hover:bg-[#a07409] w-12 h-12 rounded-[18px] flex items-center justify-center transition-all active:scale-95 shadow-sm"
              title="Lihat Peringatan Stok Kritis"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-[#B91C1C]"></span>
            </button>

            {/* POPUP CARD LIST STOK KRITIS */}
            {showCriticalPopover && (
              <div className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 z-50 flex flex-col gap-3 animate-scaleUp">

                {/* Header Popup */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-extrabold text-[#0F172A]">
                    Stok Kritis Pusat
                  </h3>
                  <span className="bg-red-50 text-red-600 font-extrabold text-[10px] px-2.5 py-1 rounded-full">
                    {lowStockItems.length} Peringatan
                  </span>
                </div>

                {/* Content Items */}
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                  {lowStockItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-4 font-semibold">
                      Semua stok aman, tidak ada barang kritis!
                    </p>
                  ) : (
                    lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 flex items-start gap-2.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"></span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Tersisa {item.stockCount} unit | Perkiraan sisa {item.aiForecasterDays || 0} hari
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
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
              {lowStockItems.length} KRITIS
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