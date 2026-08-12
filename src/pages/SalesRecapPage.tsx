import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLocalRecaps, addRecap, importRecapsFromFile, getLocalProducts } from '../api/client';
import type { SalesRecap, Product } from '../types';

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
      showToast('Jumlah unit dan nominal nominal harus lebih besar dari 0!');
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
      adminFee: 0, // no admin fee for manual/WA
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
    }, 1500); // simulate delay
  };



  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-6 flex flex-col gap-6" aria-label="Rekap Penjualan & Input Data">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-sm gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER REKAP PENJUALAN ─── */}
      <header className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Rekap Penjualan & Input Data</h1>
          <p className="text-xs text-text-secondary mt-0.5">Impor laporan Excel/CSV berkala dari Shopee, Tokopedia, TikTok Shop atau masukkan transaksi WA/manual secara langsung.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Impor Laporan Excel
          </button>
          
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-text-secondary hover:text-text-primary font-semibold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Input Manual / Opname
          </button>
        </div>
      </header>

      {/* ─── KARTU SALURAN PENJUALAN MOCK ─── */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4" aria-label="Saluran Penjualan Ringkasan">
        {['Shopee', 'Tokopedia', 'TikTok Shop', 'Manual'].map((src) => {
          const matchingRecaps = recaps.filter((r) => r.source === src);
          const totalUnits = matchingRecaps.reduce((sum, r) => sum + r.unitsSold, 0);
          const totalNominal = matchingRecaps.reduce((sum, r) => sum + r.totalAmount, 0);
          const counts = matchingRecaps.length;

          return (
            <article key={src} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  src === 'Shopee' ? 'bg-orange-50 text-orange-600' : src === 'Tokopedia' ? 'bg-emerald-50 text-[#10B981]' : src === 'TikTok Shop' ? 'bg-neutral-800 text-white' : 'bg-blue-50 text-[#3B82F6]'
                }`}>
                  {src}
                </span>
                <h3 className="text-lg font-bold text-text-primary mt-3">{formatRupiah(totalNominal)}</h3>
              </div>
              <p className="text-[10px] text-text-secondary mt-1.5 flex justify-between">
                <span>{totalUnits} Unit Terjual</span>
                <span>{counts} Berkas Rekap</span>
              </p>
            </article>
          );
        })}
      </section>

      {/* ─── TABEL RIWAYAT REKAP ─── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-text-primary">Log Riwayat Unggahan Rekap & Opname</h2>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Source filter */}
            <select
              aria-label="Filter Saluran Rekap"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
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
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none w-full md:w-48"
              placeholder="Cari Kode Rekap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" role="table">
            <thead>
              <tr className="border-b border-slate-100 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
                <th className="pb-3">Kode Rekap</th>
                <th className="pb-3">Tanggal Rekap</th>
                <th className="pb-3">Saluran Penjualan</th>
                <th className="pb-3 text-right">Total Unit Terjual</th>
                <th className="pb-3 text-right">Total Nominal</th>
                <th className="pb-3 text-right">Biaya Admin Platform</th>
                <th className="pb-3">Status Sinkronisasi</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecaps.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-mono font-medium text-text-secondary">{r.id}</td>
                  <td className="py-3 font-medium text-text-primary">{r.date}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.source === 'Shopee' ? 'bg-orange-50 text-orange-600' : r.source === 'Tokopedia' ? 'bg-emerald-50 text-[#10B981]' : r.source === 'TikTok Shop' ? 'bg-neutral-800 text-white' : 'bg-blue-50 text-[#3B82F6]'
                    }`}>
                      {r.source}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-text-primary">{r.unitsSold} Unit</td>
                  <td className="py-3 text-right font-extrabold text-text-primary">{formatRupiah(r.totalAmount)}</td>
                  <td className="py-3 text-right font-mono text-red-500">-{formatRupiah(r.adminFee)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#10B981] font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></span>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveDetailRecap(r)}
                      className="text-[#3B82F6] hover:underline font-bold"
                    >
                      Lihat Rincian
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── MODAL: IMPOR REKAP DATA (UPLOAD EXCEL/CSV) ─── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-text-primary">Impor Rekap Penjualan Marketplace</h2>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-text-secondary uppercase">Pilih Saluran Asal Berkas</label>
                <select
                  className="border border-slate-200 rounded-lg p-2 font-semibold bg-white focus:outline-none"
                  value={importSource}
                  onChange={(e) => setImportSource(e.target.value as any)}
                >
                  <option value="Shopee">Shopee Seller Center</option>
                  <option value="Tokopedia">Tokopedia Seller Center</option>
                  <option value="TikTok Shop">TikTok Shop Seller Center</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 relative">
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
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <span className="font-bold text-text-primary truncate max-w-full text-center">
                  {importFile ? importFile.name : 'Pilih file ekspor laporan marketplace'}
                </span>
                <span className="text-[9px] text-text-secondary">Mendukung format .CSV atau .XLSX</span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="flex-1 px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-xl flex justify-center items-center shadow"
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
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-text-primary">Input Penjualan / Opname Manual</h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-text-secondary uppercase">Tanggal Rekap</label>
                <input
                  type="date"
                  required
                  className="border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Unit Terjual</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    value={manualUnits}
                    onChange={(e) => setManualUnits(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Total Nominal (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Deduct stock option */}
              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50 flex flex-col gap-2">
                <span className="font-bold text-[10px] text-text-secondary uppercase">Sinkronisasi Potong Stok Pusat:</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] text-text-secondary">Produk Fisik</label>
                    <select
                      className="border border-slate-200 rounded p-1 font-semibold bg-white"
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
                    <label className="text-[9px] text-text-secondary">Kuantitas</label>
                    <input
                      type="number"
                      min="1"
                      className="border border-slate-200 rounded p-1 w-full"
                      value={manualProductQty}
                      onChange={(e) => setManualProductQty(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs mt-2 shadow"
              >
                Simpan Transaksi Manual
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: RINCIAN DETAIL REKAP ─── */}
      {activeDetailRecap && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-text-primary">Rincian Dokumen Rekap</h3>
              <button
                type="button"
                onClick={() => setActiveDetailRecap(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs text-text-primary">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-text-secondary uppercase">Kode Rekap</span>
                  <span className="font-bold font-mono">{activeDetailRecap.id}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-text-secondary uppercase">Sumber Laporan</span>
                  <span className={`font-bold self-start mt-0.5 px-2 py-0.2 rounded text-[10px] ${
                    activeDetailRecap.source === 'Shopee' ? 'bg-orange-50 text-orange-600' : activeDetailRecap.source === 'Tokopedia' ? 'bg-emerald-50 text-[#10B981]' : activeDetailRecap.source === 'TikTok Shop' ? 'bg-neutral-800 text-white' : 'bg-blue-50 text-[#3B82F6]'
                  }`}>
                    {activeDetailRecap.source}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <p className="text-[9px] text-text-secondary uppercase">Unit Terjual</p>
                  <p className="font-bold text-text-primary text-sm mt-0.5">{activeDetailRecap.unitsSold}</p>
                </div>
                <div>
                  <p className="text-[9px] text-text-secondary uppercase">Bruto</p>
                  <p className="font-bold text-text-primary text-sm mt-0.5">{formatRupiah(activeDetailRecap.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-red-500 uppercase">Potongan Fee</p>
                  <p className="font-bold text-red-500 text-sm mt-0.5">-{formatRupiah(activeDetailRecap.adminFee)}</p>
                </div>
              </div>

              {/* Items Table details */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-[10px] text-text-secondary uppercase">Detil Pemotongan Persediaan:</span>
                
                {activeDetailRecap.items ? (
                  <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {activeDetailRecap.items.map((item, idx) => (
                      <div key={idx} className="p-2 border border-slate-100 rounded-lg flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-bold">{item.name}</span>
                          <span className="text-[10px] text-text-secondary">Unit Harga: {formatRupiah(item.price)}</span>
                        </div>
                        <span className="bg-blue-50 text-[#3B82F6] font-bold px-2 py-0.5 rounded text-[10px]">
                          {item.qty} Pcs
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Laporan ini diunggah sebagai rekap finansial global tanpa rincian item SKU.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveDetailRecap(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-text-primary font-bold rounded-xl text-xs transition-colors mt-2"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
