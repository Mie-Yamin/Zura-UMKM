import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, fetchKpiSummary, getLocalRecaps, getLocalCustomers, updateProduct } from '../api/client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

  // States
  const [selectedBranch, setSelectedBranch] = useState('Semua Cabang');
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

  // 1. Calculations
  const metrics = useMemo(() => {
    // Total Omzet (total nominal of all recaps)
    const posRevenue = recaps.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalOmzet = posRevenue + 66500000; // Base historical offset

    // Laba Bersih Estimasi (using roughly 42% net profit ratio from reports)
    const totalProfit = Math.round(totalOmzet * 0.428);

    // Status Stok (Aman vs Kritis)
    const totalProducts = products.length;
    const kritisCount = products.filter((p) => p.stockCount <= (p.minStock || 10)).length;
    const amanCount = totalProducts - kritisCount;

    // Total Pelanggan Terdaftar
    const totalCustomersCount = customers.length;

    return {
      totalOmzet,
      totalProfit,
      amanCount,
      kritisCount,
      totalCustomersCount,
    };
  }, [recaps, products, customers]);

  // Understock & Deadstock alerts
  const criticalAlerts = useMemo(() => {
    const understock = products.filter((p) => p.stockCount <= (p.minStock || 10));
    const deadstock = products.filter((p) => p.isDeadstock === true);
    return { understock, deadstock };
  }, [products]);

  // Sales Channel distribution chart data
  const channelData = useMemo(() => {
    const shopeeSum = recaps.filter(r => r.source === 'Shopee').reduce((sum, r) => sum + r.totalAmount, 0);
    const tokoSum = recaps.filter(r => r.source === 'Tokopedia').reduce((sum, r) => sum + r.totalAmount, 0);
    const tiktokSum = recaps.filter(r => r.source === 'TikTok Shop').reduce((sum, r) => sum + r.totalAmount, 0);
    const manualSum = recaps.filter(r => r.source === 'Manual').reduce((sum, r) => sum + r.totalAmount, 0);

    return [
      { name: 'Shopee', 'Omzet (Rp)': shopeeSum + 22500000 },
      { name: 'Tokopedia', 'Omzet (Rp)': tokoSum + 18000000 },
      { name: 'TikTok Shop', 'Omzet (Rp)': tiktokSum + 16000000 },
      { name: 'Direct / WA', 'Omzet (Rp)': manualSum + 10000000 },
    ];
  }, [recaps]);

  // Line chart daily peak hours data
  const trendData = [
    { jam: '08:00', 'Omzet Shopee (Juta)': 1.2, 'Omzet Tokopedia (Juta)': 0.8 },
    { jam: '10:00', 'Omzet Shopee (Juta)': 2.5, 'Omzet Tokopedia (Juta)': 1.4 },
    { jam: '12:00', 'Omzet Shopee (Juta)': 4.8, 'Omzet Tokopedia (Juta)': 3.2 },
    { jam: '14:00', 'Omzet Shopee (Juta)': 3.1, 'Omzet Tokopedia (Juta)': 2.0 },
    { jam: '16:00', 'Omzet Shopee (Juta)': 3.5, 'Omzet Tokopedia (Juta)': 2.8 },
    { jam: '18:00', 'Omzet Shopee (Juta)': 6.4, 'Omzet Tokopedia (Juta)': 4.5 },
    { jam: '20:00', 'Omzet Shopee (Juta)': 4.2, 'Omzet Tokopedia (Juta)': 3.0 },
  ];

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-6 flex flex-col gap-6" aria-label="Dashboard Pemantauan Utama">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-sm gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER UTAMA SAAS ─── */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Business Monitoring Command Center</h1>
          <p className="text-xs text-text-secondary mt-0.5">Monitoring operasional terpadu, rekap inventaris gudang pusat, dan analisis omzet omnichannel.</p>
        </div>

        {/* Global Selectors */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Branch selector */}
          <div className="relative">
            <select
              aria-label="Pilih Toko / Cabang"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
            >
              <option value="Semua Cabang">Semua Gudang/Cabang</option>
              <option value="Gudang Utama">Gudang Utama</option>
              <option value="Cabang Shopee">Cabang Online Shopee</option>
              <option value="Cabang Tokopedia">Cabang Online Tokopedia</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {/* Date Picker Range */}
          <div className="relative">
            <select
              aria-label="Pilih Rentang Waktu"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
            >
              <option value="Hari Ini">Hari Ini</option>
              <option value="7 Hari Terakhir">7 Hari Terakhir</option>
              <option value="30 Hari Terakhir">30 Hari Terakhir</option>
              <option value="Kuartal Berjalan">Kuartal Berjalan</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {/* Notification bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors relative"
              aria-label="Notifikasi Stok Kritis"
            >
              <svg className="h-4.5 w-4.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {criticalAlerts.understock.length > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#EF4444] border border-white"></span>
              )}
            </button>

            {/* Notification drop */}
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

      {/* ─── 1. KARTU RINGKASAN METRIK SAAS (4 Kolom) ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Metrik Pemantauan">
        
        {/* Total Omzet */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Omzet Terakhir</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-text-primary tracking-tight">{formatRupiah(metrics.totalOmzet)}</p>
            <span className="bg-blue-50 text-[#3B82F6] text-[10px] font-bold px-2 py-0.5 rounded-full">Omnichannel</span>
          </div>
        </article>

        {/* Laba Bersih Estimasi */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Laba Bersih Estimasi</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-[#10B981] tracking-tight">{formatRupiah(metrics.totalProfit)}</p>
            <span className="bg-emerald-50 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-full">~42% Margin</span>
          </div>
        </article>

        {/* Status Stok */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Status Stok Gudang Pusat</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {metrics.amanCount} SKU Aman
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              metrics.kritisCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-[#10B981]'
            }`}>
              {metrics.kritisCount} Kritis
            </span>
          </div>
        </article>

        {/* Total Pelanggan CRM */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Pelanggan Terdaftar</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-text-primary tracking-tight">{metrics.totalCustomersCount} Profil</p>
            <span className="bg-slate-50 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">Member CRM</span>
          </div>
        </article>

      </section>

      {/* ─── 2. GRAFIK KINERJA PENJUALAN (KOMPARATIF & SALURAN) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kiri: Line chart Tren Omzet Harian */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Tren Omzet Omnichannel</h2>
            <p className="text-xs text-text-secondary">Kurva perbandingan performa harian Shopee vs Tokopedia.</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="jam" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', pt: 8 }} />
                <Line
                  type="monotone"
                  dataKey="Omzet Shopee (Juta)"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Omzet Tokopedia (Juta)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kanan: Bar chart Distribusi Saluran Penjualan */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Kontribusi Saluran Marketplace</h2>
            <p className="text-xs text-text-secondary">Distribusi nominal omzet berdasarkan asal saluran transaksi.</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '11px' }}
                  formatter={(value: any) => [formatRupiah(value), 'Omzet']}
                />
                <Bar dataKey="Omzet (Rp)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* ─── 3. WIDGET STOCK WARNING UNDERSTOCK & DEADSTOCK (Bawah) ─── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">Pusat Peringatan Pengadaan Stok (Gudang Utama)</h2>
          <p className="text-xs text-text-secondary">Daftar item berisiko out-of-stock (Understock) dan produk yang mengendap lama di gudang (Deadstock).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Kiri: Understock alerts */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping"></span>
              Peringatan Understock (Butuh Restock Segera)
            </h3>
            
            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
              {criticalAlerts.understock.map((p) => (
                <div key={p.id} className="p-3.5 rounded-lg border border-red-50 bg-red-50/10 text-xs flex justify-between items-center hover:border-red-200 transition-colors">
                  <div>
                    <p className="font-bold text-text-primary">{p.name}</p>
                    <p className="text-[9px] font-mono text-text-secondary mt-0.5">Tersisa: {p.stockCount} unit | Perkiraan sisa {p.aiForecasterDays} hari lagi</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRestockItem(p)}
                    className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px]"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan: Deadstock alerts */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Item Mengendap (Deadstock / Low-Moving)
            </h3>

            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
              {criticalAlerts.deadstock.map((p) => (
                <div key={p.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-text-primary">{p.name}</p>
                    <p className="text-[9px] font-mono text-text-secondary mt-0.5">SKU: {p.sku} | Stok tersimpan: {p.stockCount} unit</p>
                  </div>
                  
                  <span className="bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 font-bold px-2.5 py-0.5 rounded text-[9px]">
                    Rekomendasi AI: Diskon Promo
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── MODAL: QUICK RESTOCK ─── */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-text-primary">Restock Item Cepat</h2>
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
                <span className="text-[10px] text-text-secondary uppercase font-bold">Produk</span>
                <span className="font-bold text-text-primary text-sm">{restockItem.name}</span>
                <span className="text-[10px] font-mono text-text-secondary">Sisa stok fisik saat ini: {restockItem.stockCount} unit</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-text-secondary uppercase">Jumlah Penambahan Stok</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  value={quickRestockQty}
                  onChange={(e) => setQuickRestockQty(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs shadow mt-2"
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
