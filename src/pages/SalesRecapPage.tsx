import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getLocalRecaps, addRecap, importRecapsFromFile, getLocalProducts } from '../api/client';
import type { SalesRecap } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function SalesRecapPage() {
  const queryClient = useQueryClient();

  // Load local recaps & products
  const recaps = useMemo(() => getLocalRecaps(), [queryClient]);
  const products = useMemo(() => getLocalProducts(), [queryClient]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeDetailRecap, setActiveDetailRecap] = useState<SalesRecap | null>(null);

  // Form states
  const [importSource, setImportSource] = useState<'Shopee' | 'Tokopedia' | 'TikTok Shop'>('Shopee');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Manual Form states
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualUnits, setManualUnits] = useState('5');
  const [manualAmount, setManualAmount] = useState('75000');
  const [manualProductId, setManualProductId] = useState('');
  const [manualProductQty, setManualProductQty] = useState('1');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered recaps list
  const filteredRecaps = useMemo(() => {
    return recaps.filter((r) => {
      const matchesSearch = r.id.toLowerCase().includes(searchQuery.toLowerCase()) || r.source.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = selectedSourceFilter === 'Semua' || r.source === selectedSourceFilter;
      return matchesSearch && matchesSource;
    });
  }, [recaps, searchQuery, selectedSourceFilter]);

  // Handle manual sales entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const units = parseInt(manualUnits) || 0;
    const amount = parseFloat(manualAmount) || 0;

    if (units <= 0 || amount <= 0) {
      showToast('Jumlah unit dan nominal harus lebih besar dari 0!');
      return;
    }

    const recapId = `RCP-MAN-${Math.floor(100 + Math.random() * 900)}`;
    const selectedProd = products.find((p) => p.id === manualProductId);

    const manualRecap: SalesRecap = {
      id: recapId,
      date: manualDate,
      source: 'Manual',
      unitsSold: units,
      totalAmount: amount,
      adminFee: 0,
      status: 'Tersinkronisasi',
      items: selectedProd
        ? [
          {
            id: selectedProd.id,
            name: selectedProd.name,
            qty: parseInt(manualProductQty) || units,
            price: selectedProd.sellPrice || (amount / units),
          },
        ]
        : undefined,
    };

    addRecap(manualRecap);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['kpi'] });

    setShowManualModal(false);
    setManualProductId('');
    showToast('Rekap Penjualan Manual berhasil dimasukkan!');
  };

  // Handle marketplace file import simulation
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Silakan pilih berkas Excel/CSV rekap marketplace!');
      return;
    }

    setIsImporting(true);
    setTimeout(async () => {
      await importRecapsFromFile(importSource);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });

      setIsImporting(false);
      setShowImportModal(false);
      setImportFile(null);
      showToast(`Laporan rekap ${importSource} berhasil diimpor & stok pusat diperbarui!`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0" aria-label="Rekap Penjualan & Input Data">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER REKAP PENJUALAN ─── */}
      <header className="bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">Rekap Penjualan & Input Data</h1>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">Impor laporan Excel/CSV berkala dari marketplace atau masukkan transaksi manual secara langsung.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Impor Laporan Excel
          </button>

          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="w-full sm:w-auto bg-white border-2 border-[#B48328] hover:bg-[#E8D3A7]/20 text-[#5F1E1E] font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <svg className="w-4 h-4 stroke-[#5F1E1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Input Manual / Opname
          </button>
        </div>
      </header>

      {/* ─── KARTU SALURAN PENJUALAN ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6" aria-label="Saluran Penjualan Ringkasan">
        {['Shopee', 'Tokopedia', 'TikTok Shop', 'Manual'].map((src) => {
          const matchingRecaps = recaps.filter((r) => r.source === src);
          const totalUnits = matchingRecaps.reduce((sum, r) => sum + r.unitsSold, 0);
          const totalNominal = matchingRecaps.reduce((sum, r) => sum + r.totalAmount, 0);
          const counts = matchingRecaps.length;

          return (
            <article key={src} className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase ${src === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' : src === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' : src === 'TikTok Shop' ? 'bg-neutral-900 text-white' : 'bg-[#5F1E1E] text-[#E8D3A7]'
                  }`}>
                  {src}
                </span>
                <h3 className="text-xl font-extrabold text-[#B48328] mt-3">{formatRupiah(totalNominal)}</h3>
              </div>
              <p className="text-[10px] font-bold text-[#5F1E1E] mt-2 flex justify-between">
                <span>{totalUnits} Unit Terjual</span>
                <span>{counts} Berkas Rekap</span>
              </p>
            </article>
          );
        })}
      </section>

      {/* ─── TABEL RIWAYAT REKAP ─── */}
      <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3 md:gap-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase">Log Riwayat Unggahan Rekap & Opname</h2>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            {/* Source filter */}
            <select
              aria-label="Filter Saluran Rekap"
              className="w-full sm:w-auto bg-white border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none uppercase min-h-[44px]"
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
            >
              <option value="Semua">Semua Saluran</option>
              <option value="Shopee">Shopee</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="Manual">Manual/Opname</option>
            </select>

            {/* Search */}
            <input
              id="recap-search"
              type="text"
              className="bg-[#E8D3A7]/20 border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none w-full md:w-48 placeholder-[#B48328]/70 min-h-[44px]"
              placeholder="Cari Kode Rekap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#5F1E1E] text-[#E8D3A7] uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-4">Kode Rekap</th>
                <th className="py-3 px-4">Tanggal Rekap</th>
                <th className="py-3 px-4">Saluran Penjualan</th>
                <th className="py-3 px-4 text-right">Total Unit</th>
                <th className="py-3 px-4 text-right">Total Nominal</th>
                <th className="py-3 px-4 text-right">Biaya Admin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecaps.map((r) => (
                <tr key={r.id} className="hover:bg-[#E8D3A7]/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">{r.id}</td>
                  <td className="py-3 px-4 font-bold text-[#5F1E1E]">{r.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold ${r.source === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' : r.source === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' : r.source === 'TikTok Shop' ? 'bg-neutral-900 text-white' : 'bg-[#5F1E1E] text-[#E8D3A7]'
                      }`}>
                      {r.source}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#5F1E1E]">{r.unitsSold} Unit</td>
                  <td className="py-3 px-4 text-right font-black text-[#B48328]">{formatRupiah(r.totalAmount)}</td>
                  <td className="py-3 px-4 text-right font-mono text-red-600 font-bold">-{formatRupiah(r.adminFee)}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-xl text-[10px]">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveDetailRecap(r)}
                      className="text-[#5F1E1E] hover:underline font-extrabold"
                    >
                      Lihat Rincian
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Stack */}
        <div className="block md:hidden flex flex-col gap-3">
          {filteredRecaps.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-bold text-xs">
              Tidak ada data rekap yang cocok.
            </div>
          ) : (
            filteredRecaps.map((r) => (
              <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="font-mono font-bold text-xs text-slate-500">{r.id}</span>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-xl text-[10px]">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                    {r.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Tanggal</p>
                    <p className="font-bold text-[#5F1E1E]">{r.date}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Saluran</p>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-xl text-[9px] font-bold ${r.source === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' :
                        r.source === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' :
                          r.source === 'TikTok Shop' ? 'bg-neutral-900 text-white' :
                            'bg-[#5F1E1E] text-[#E8D3A7]'
                      }`}>
                      {r.source}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Volume</p>
                    <p className="font-bold text-[#5F1E1E]">{r.unitsSold} Unit</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Total Nominal</p>
                    <p className="font-black text-[#B48328]">{formatRupiah(r.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-red-600 font-bold uppercase">Biaya Admin</p>
                    <p className="font-mono text-red-600 font-bold">-{formatRupiah(r.adminFee)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveDetailRecap(r)}
                    className="text-[#5F1E1E] hover:underline font-extrabold text-xs py-2 px-3 hover:bg-[#E8D3A7]/20 rounded-lg"
                  >
                    Lihat Rincian
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ─── MODAL: IMPOR REKAP DATA ─── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">Impor Rekap Marketplace</h2>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Pilih Saluran Asal Berkas</label>
                <select
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] bg-white focus:outline-none"
                  value={importSource}
                  onChange={(e) => setImportSource(e.target.value as any)}
                >
                  <option value="Shopee">Shopee Seller Center</option>
                  <option value="Tokopedia">Tokopedia Seller Center</option>
                  <option value="TikTok Shop">TikTok Shop Seller Center</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-[#B48328] hover:bg-[#E8D3A7]/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                    }
                  }}
                />
                <svg className="w-8 h-8 text-[#B48328]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <span className="font-bold text-[#5F1E1E] truncate max-w-full text-center">
                  {importFile ? importFile.name : 'Pilih file ekspor laporan marketplace'}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold">Mendukung format .CSV atau .XLSX</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-4 py-2.5 rounded-xl flex justify-center items-center shadow min-h-[44px]"
                >
                  {isImporting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Impor Laporan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: INPUT PENJUALAN MANUAL / OPNAME ─── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">Input Penjualan / Opname Manual</h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Tanggal Rekap</label>
                <input
                  type="date"
                  required
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Unit Terjual</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                    value={manualUnits}
                    onChange={(e) => setManualUnits(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Total Nominal (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold font-mono text-[#5F1E1E] focus:outline-none"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Deduct stock option */}
              <div className="border border-[#B48328]/30 p-3 rounded-xl bg-[#E8D3A7]/20 flex flex-col gap-2">
                <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase">Potong Stok Pusat:</span>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Produk Fisik</label>
                    <select
                      className="border border-[#B48328] rounded-lg p-1.5 font-bold text-[#5F1E1E] bg-white text-[10px] min-h-[32px]"
                      value={manualProductId}
                      onChange={(e) => setManualProductId(e.target.value)}
                    >
                      <option value="">-- Lewati Pemotongan --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stockCount})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-500">Kuantitas</label>
                    <input
                      type="number"
                      min="1"
                      className="border border-[#B48328] rounded-lg p-1.5 w-full font-bold text-[#5F1E1E] text-[10px] min-h-[32px]"
                      value={manualProductQty}
                      onChange={(e) => setManualProductQty(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow min-h-[44px]"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: RINCIAN DETAIL REKAP ─── */}
      {activeDetailRecap && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#5F1E1E] uppercase">Rincian Dokumen Rekap</h3>
              <button
                type="button"
                onClick={() => setActiveDetailRecap(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Kode Rekap</span>
                  <span className="font-bold font-mono text-[#5F1E1E]">{activeDetailRecap.id}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Sumber Laporan</span>
                  <span className={`font-bold self-start mt-0.5 px-2 py-0.5 rounded-xl text-[10px] ${activeDetailRecap.source === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' : activeDetailRecap.source === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' : activeDetailRecap.source === 'TikTok Shop' ? 'bg-neutral-900 text-white' : 'bg-[#5F1E1E] text-[#E8D3A7]'
                    }`}>
                    {activeDetailRecap.source}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-[#E8D3A7]/20 p-2.5 rounded-xl border border-[#B48328]/30">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Unit Terjual</p>
                  <p className="font-extrabold text-[#5F1E1E] text-sm mt-0.5">{activeDetailRecap.unitsSold}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Bruto</p>
                  <p className="font-extrabold text-[#B48328] text-sm mt-0.5">{formatRupiah(activeDetailRecap.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-red-600 font-bold uppercase">Potongan Fee</p>
                  <p className="font-extrabold text-red-600 text-sm mt-0.5">-{formatRupiah(activeDetailRecap.adminFee)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-bold text-[10px] text-[#5F1E1E] uppercase">Detil Pemotongan Persediaan:</span>

                {activeDetailRecap.items ? (
                  <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {activeDetailRecap.items.map((item, idx) => (
                      <div key={idx} className="p-2 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#5F1E1E]">{item.name}</span>
                          <span className="text-[10px] text-slate-500">Harga: {formatRupiah(item.price)}</span>
                        </div>
                        <span className="bg-[#5F1E1E] text-[#E8D3A7] font-bold px-2 py-0.5 rounded-lg text-[10px]">
                          {item.qty} Pcs
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Laporan ini diunggah sebagai rekap finansial global tanpa rincian SKU.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveDetailRecap(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors mt-2 min-h-[44px]"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

    </div>
  );
}