import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, fetchKpiSummary, getLocalRecaps, getLocalCustomers, updateProduct } from '../api/client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Product } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

// Pemetaan Warna Otomatis Per Saluran Marketplace (Bar Chart)
const CHANNEL_COLORS: Record<string, string> = {
  'Shopee': '#EE4D2D',      // Oranye Shopee
  'Tokopedia': '#00AA5B',   // Hijau Tokopedia
  'TikTok Shop': '#000000', // Hitam TikTok
  'Lainnya': '#5F1E1E', // Maroon Zura
};

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Load queries
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi'],
    queryFn: fetchKpiSummary,
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });

  const products = inventoryData?.products ?? [];
  const recaps = useMemo(() => getLocalRecaps(), [inventoryData]);
  const customers = useMemo(() => getLocalCustomers(), [inventoryData]);

  // ─── STATE CABANG DINAMIS ──────────────────────────────────────────────────
  const [branches, setBranches] = useState([
    { label: 'SEMUA GUDANG/\nCABANG', value: 'Semua Cabang' },
    { label: 'GUDANG UTAMA', value: 'Gudang Utama' },
    { label: 'CABANG ONLINE\nSHOPEE', value: 'Cabang Shopee' },
    { label: 'CABANG ONLINE\nTOKOPEDIA', value: 'Cabang Tokopedia' },
  ]);

  const [selectedBranch, setSelectedBranch] = useState('Semua Cabang');
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // States Lainnya
  const [dateRange, setDateRange] = useState('30 Hari Terakhir');
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Restock State
  const [restockItem, setRestockItem] = useState<Product | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState('50');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handler Tambah Cabang Baru
  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const formattedLabel = newBranchName.trim().toUpperCase();
    const formattedValue = newBranchName.trim();

    const newBranchObj = {
      label: formattedLabel,
      value: formattedValue,
    };

    setBranches((prev) => [...prev, newBranchObj]);
    setSelectedBranch(formattedValue);
    setNewBranchName('');
    setIsAddBranchOpen(false);
    setIsBranchOpen(false);
    showToast(`Cabang "${formattedValue}" berhasil ditambahkan!`);
  };

  // 1. Calculations (Penyaringan Berdasarkan Cabang Terpilih)
  const metrics = useMemo(() => {
    const filteredRecaps = selectedBranch === 'Semua Cabang'
      ? recaps
      : recaps.filter(r => r.source.toLowerCase().includes(selectedBranch.toLowerCase()) || selectedBranch.toLowerCase().includes(r.source.toLowerCase()));

    const posRevenue = filteredRecaps.reduce((sum, r) => sum + r.totalAmount, 0);
    const baseOffset = selectedBranch === 'Semua Cabang' ? 66500000 : (selectedBranch === 'Gudang Utama' ? 40000000 : 15000000);
    const totalOmzet = posRevenue + baseOffset;
    const totalProfit = Math.round(totalOmzet * 0.428);

    const totalProducts = products.length;
    const kritisCount = products.filter((p) => p.stockCount <= (p.minStock || 10)).length;
    const amanCount = totalProducts - kritisCount;
    const totalCustomersCount = customers.length;

    return {
      totalOmzet,
      totalProfit,
      amanCount,
      kritisCount,
      totalCustomersCount,
    };
  }, [recaps, products, customers, selectedBranch]);

  // Understock & Deadstock alerts
  const criticalAlerts = useMemo(() => {
    const understock = products.filter((p) => p.stockCount <= (p.minStock || 10));
    const deadstock = products.filter((p) => p.isDeadstock === true);
    return { understock, deadstock };
  }, [products]);

  // Sales Channel distribution chart data (Dinamis Sesuai Cabang)
  const channelData = useMemo(() => {
    const shopeeSum = recaps.filter(r => r.source === 'Shopee').reduce((sum, r) => sum + r.totalAmount, 0);
    const tokoSum = recaps.filter(r => r.source === 'Tokopedia').reduce((sum, r) => sum + r.totalAmount, 0);
    const tiktokSum = recaps.filter(r => r.source === 'TikTok Shop').reduce((sum, r) => sum + r.totalAmount, 0);
    const manualSum = recaps.filter(r => r.source === 'Manual').reduce((sum, r) => sum + r.totalAmount, 0);

    if (selectedBranch === 'Cabang Shopee') {
      return [{ name: 'Shopee', 'Omzet (Rp)': shopeeSum + 22500000 }];
    }
    if (selectedBranch === 'Cabang Tokopedia') {
      return [{ name: 'Tokopedia', 'Omzet (Rp)': tokoSum + 18000000 }];
    }

    return [
      { name: 'Shopee', 'Omzet (Rp)': shopeeSum + 22500000 },
      { name: 'Tokopedia', 'Omzet (Rp)': tokoSum + 18000000 },
      { name: 'TikTok Shop', 'Omzet (Rp)': tiktokSum + 16000000 },
      { name: 'Lainnya', 'Omzet (Rp)': manualSum + 10000000 },
    ];
  }, [recaps, selectedBranch]);

  // Line chart daily peak hours data (Dinamis Sesuai Cabang)
  const trendData = useMemo(() => {
    const multiplier = selectedBranch === 'Semua Cabang' ? 1 : (selectedBranch === 'Gudang Utama' ? 0.6 : 0.35);

    return [
      { jam: '08:00', 'Omzet Shopee (Juta)': 1.2 * multiplier, 'Omzet Tokopedia (Juta)': 0.8 * multiplier },
      { jam: '10:00', 'Omzet Shopee (Juta)': 2.5 * multiplier, 'Omzet Tokopedia (Juta)': 1.4 * multiplier },
      { jam: '12:00', 'Omzet Shopee (Juta)': 4.8 * multiplier, 'Omzet Tokopedia (Juta)': 3.2 * multiplier },
      { jam: '14:00', 'Omzet Shopee (Juta)': 3.1 * multiplier, 'Omzet Tokopedia (Juta)': 2.0 * multiplier },
      { jam: '16:00', 'Omzet Shopee (Juta)': 3.5 * multiplier, 'Omzet Tokopedia (Juta)': 2.8 * multiplier },
      { jam: '18:00', 'Omzet Shopee (Juta)': 6.4 * multiplier, 'Omzet Tokopedia (Juta)': 4.5 * multiplier },
      { jam: '20:00', 'Omzet Shopee (Juta)': 4.2 * multiplier, 'Omzet Tokopedia (Juta)': 3.0 * multiplier },
    ];
  }, [selectedBranch]);

  // Quick restock submit handler
  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    const qty = parseInt(quickRestockQty) || 0;
    if (qty <= 0) {
      showToast('Jumlah restock harus lebih dari 0!');
      return;
    }

    const updated: Product = {
      ...restockItem,
      stockCount: restockItem.stockCount + qty,
      status: (restockItem.stockCount + qty) <= (restockItem.minStock || 10) ? 'low_stock' : 'healthy',
    };

    updateProduct(updated);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['kpi'] });
    setRestockItem(null);
    showToast(`Restock sukses! Stok ${updated.name} ditambah +${qty} unit.`);
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-6 flex flex-col gap-6 font-dmsans" aria-label="Dashboard Pemantauan Utama">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-sm gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER UTAMA SAAS ─── */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-transparent shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#5F1E1E] tracking-tight uppercase">
            BUSINESS MONITORING COMMAND CENTER
          </h1>
          <p className="text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
            Monitoring Operasional Terpadu, Rekap Inventaris Gedung Pusat, Dan Analisis Omzet Omnichannel
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">

          {/* Custom Branch Selector dengan Tombol Plus (+ Tambah Cabang) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBranchOpen(!isBranchOpen)}
              className="flex items-center justify-between gap-2 bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl px-3 py-1.5 text-[10px] font-bold tracking-wider leading-tight text-left focus:outline-none min-w-[145px]"
            >
              <span className="whitespace-pre-line">
                {branches.find((b) => b.value === selectedBranch)?.label || selectedBranch}
              </span>
              <svg className="w-4 h-4 stroke-[#5F1E1E] stroke-2 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Menu Dropdown Cabang */}
            {isBranchOpen && (
              <div className="absolute left-0 mt-1 w-full min-w-[170px] bg-white border-2 border-[#B48328] rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                {branches.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(option.value);
                      setIsBranchOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold whitespace-pre-line border-b border-slate-100 last:border-none leading-tight transition-colors ${selectedBranch === option.value
                      ? 'bg-[#E8D3A7]/50 text-[#5F1E1E]'
                      : 'text-[#5F1E1E] hover:bg-[#E8D3A7]/30'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}

                {/* Tombol Plus + Tambah Cabang Baru */}
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(true)}
                  className="w-full text-left px-3 py-2.5 text-[10px] font-black text-white bg-[#5F1E1E] hover:bg-[#4a1717] transition-colors flex items-center justify-between gap-1"
                >
                  <span>+ TAMBAH CABANG</span>
                  <span className="text-[12px] leading-none">+</span>
                </button>
              </div>
            )}
          </div>

          {/* Date Picker Range */}
          <div className="relative">
            <select
              aria-label="Pilih Rentang Waktu"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl pl-3 pr-8 py-2.5 text-[10px] font-bold tracking-wider uppercase focus:outline-none cursor-pointer leading-tight"
            >
              <option value="Hari Ini">HARI INI</option>
              <option value="7 Hari Terakhir">7 HARI TERAKHIR</option>
              <option value="30 Hari Terakhir">30 HARI TERAKHIR</option>
              <option value="Kuartal Berjalan">KUARTAL BERJALAN</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5F1E1E]">
              <svg className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>

          {/* Notification bell button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 rounded-xl bg-[#B48328] hover:bg-[#966b1e] transition-colors flex items-center justify-center relative focus:outline-none"
              aria-label="Notifikasi Stok Kritis"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-40">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-text-primary">Stok Kritis Pusat</span>
                  <span className="text-[9px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
                    {criticalAlerts.understock.length} Peringatan
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {criticalAlerts.understock.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">Semua stok pusat aman.</div>
                  ) : (
                    criticalAlerts.understock.map((p) => (
                      <div key={p.id} className="px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#EF4444] flex-shrink-0"></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{p.name}</p>
                          <p className="text-[9px] text-text-secondary">Tersisa {p.stockCount} unit | Perkiraan sisa {p.aiForecasterDays} hari</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ─── 1. KARTU RINGKASAN METRIK SAAS ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Metrik Pemantauan">

        {/* Kartu 1: Total Omzet Terakhir */}
        <article className="bg-white rounded-2xl p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
              TOTAL OMZET<br />TERAKHIR
            </h3>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[9px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider flex-shrink-0">
              OMNICHANNEL
            </span>
          </div>
          <div className="mt-auto pt-4 flex flex-col gap-0.5">
            <span className="text-xl font-extrabold text-[#B48328] leading-none">Rp</span>
            <span className="text-3xl md:text-4xl font-extrabold text-[#B48328] tracking-tight leading-none">
              {metrics.totalOmzet.toLocaleString('id-ID')}
            </span>
          </div>
        </article>

        {/* Kartu 2: Laba Bersih Estimasi */}
        <article className="bg-white rounded-2xl p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
              LABA BERSIH<br />ESTIMASI
            </h3>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[9px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider leading-tight text-center flex-shrink-0">
              ~26%<br />MARGIN
            </span>
          </div>
          <div className="mt-auto pt-4 flex flex-col gap-0.5">
            <span className="text-xl font-extrabold text-[#B48328] leading-none">Rp</span>
            <span className="text-3xl md:text-4xl font-extrabold text-[#B48328] tracking-tight leading-none">
              {metrics.totalProfit.toLocaleString('id-ID')}
            </span>
          </div>
        </article>

        {/* Kartu 3: Status Stok Gudang Pusat */}
        <article className="bg-white rounded-2xl p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
              STATUS STOK<br />GUDANG PUSAT
            </h3>
            <span className="bg-[#E8D3A7] text-[#B91C1C] text-[9px] font-extrabold px-3 py-1 rounded-xl uppercase tracking-wider leading-tight text-center flex-shrink-0">
              {metrics.kritisCount}<br /><span className="text-[7.5px]">KRITIS</span>
            </span>
          </div>
          <div className="mt-auto pt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#B48328] leading-none">{metrics.amanCount}</span>
            <span className="text-2xl font-extrabold text-[#B48328] tracking-tight leading-none">SKU AMAN</span>
          </div>
        </article>

        {/* Kartu 4: Total Pelanggan Terdaftar */}
        <article className="bg-white rounded-2xl p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
              TOTAL PELANGGAN<br />TERDAFTAR
            </h3>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[9px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider leading-tight text-center flex-shrink-0">
              MEMBER<br />CRM
            </span>
          </div>

          <div className="mt-auto pt-4 flex items-center gap-3">
            <svg className="w-8 h-8 fill-black flex-shrink-0" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            <div className="text-2xl md:text-3xl font-extrabold text-[#B48328] tracking-tight">
              {metrics.totalCustomersCount} PROFIL
            </div>
          </div>
        </article>

      </section>

      {/* ─── 2. GRAFIK KINERJA PENJUALAN ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kiri: Line chart Tren Omzet Harian */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
              Tren Omzet Omnichannel ({selectedBranch})
            </h2>
            <p className="text-xs font-medium text-[#B48328]">Kurva perbandingan performa harian Shopee vs Tokopedia.</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="jam" tick={{ fontSize: 10, fill: '#5F1E1E', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10, fill: '#5F1E1E', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#5F1E1E', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="Omzet Shopee (Juta)"
                  stroke="#EE4D2D"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#EE4D2D' }}
                />
                <Line
                  type="monotone"
                  dataKey="Omzet Tokopedia (Juta)"
                  stroke="#00AA5B"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#00AA5B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kanan: Bar chart Distribusi Saluran Penjualan */}
        <div className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">Kontribusi Saluran Marketplace</h2>
            <p className="text-xs font-medium text-[#B48328]">Distribusi nominal omzet berdasarkan asal saluran transaksi.</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5F1E1E', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10, fill: '#5F1E1E', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#5F1E1E', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                  formatter={(value: any) => [formatRupiah(value), 'Omzet']}
                />
                <Bar dataKey="Omzet (Rp)" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {channelData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={CHANNEL_COLORS[entry.name] || '#B48328'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* ─── 3. WIDGET STOCK WARNING UNDERSTOCK & DEADSTOCK ─── */}
      <section className="bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">Pusat Peringatan Pengadaan Stok (Gudang Utama)</h2>
          <p className="text-xs font-medium text-[#B48328]">Daftar item berisiko out-of-stock (Understock) dan produk yang mengendap lama di gudang (Deadstock).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Understock alerts */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold text-[#B91C1C] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B91C1C] animate-ping"></span>
              PERINGATAN UNDERSTOCK (BUTUH RESTOCK SEGERA)
            </h3>

            <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
              {criticalAlerts.understock.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-red-100 bg-red-50/20 text-xs flex justify-between items-center hover:border-red-200 transition-colors">
                  <div>
                    <p className="font-extrabold text-[#5F1E1E] text-sm">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tersisa: {p.stockCount} unit | Perkiraan sisa {p.aiForecasterDays} hari lagi</p>
                  </div>

                  {/* Tombol Restock Warna Merah Zura (#5F1E1E) */}
                  <button
                    type="button"
                    onClick={() => setRestockItem(p)}
                    className="bg-[#5F1E1E] hover:bg-[#4a1717] text-white font-bold px-4 py-2 rounded-xl text-[11px] shadow-sm transition-all active:scale-95"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Deadstock alerts */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              ITEM MENGENDAP (DEADSTOCK / LOW-MOVING)
            </h3>

            <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
              {criticalAlerts.deadstock.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-extrabold text-[#5F1E1E] text-sm">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">SKU: {p.sku} | Stok tersimpan: {p.stockCount} unit</p>
                  </div>

                  <span className="bg-[#E5C88B] text-[#5F1E1E] border border-[#5F1E1E]/20 font-bold px-3 py-1.5 rounded-xl text-[9px] uppercase tracking-wider">
                    Rekomendasi AI: Diskon Promo
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── MODAL: TAMBAH CABANG BARU ─── */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp font-dmsans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">Tambah Cabang / Gudang</h2>
              <button
                type="button"
                onClick={() => setIsAddBranchOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddBranchSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#5F1E1E] uppercase">Nama Cabang / Marketplace Baru</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang TikTok Surabaya"
                  className="border-2 border-[#B48328] rounded-xl p-3 text-xs text-[#5F1E1E] font-bold focus:outline-none"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow"
                >
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: QUICK RESTOCK ─── */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#5F1E1E]">Restock Item Cepat</h2>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="flex flex-col gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Produk</span>
                <span className="font-bold text-[#5F1E1E] text-sm">{restockItem.name}</span>
                <span className="text-[10px] font-mono text-slate-500">Sisa stok fisik saat ini: {restockItem.stockCount} unit</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600 uppercase">Jumlah Penambahan Stok</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#5F1E1E]"
                  value={quickRestockQty}
                  onChange={(e) => setQuickRestockQty(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="bg-[#5F1E1E] hover:bg-[#4a1717] text-white font-bold py-2.5 rounded-xl text-xs shadow mt-2"
              >
                Proses Pengadaan
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}