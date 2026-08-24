import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, updateProduct } from '../api/client';
import type { Product } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function InventoryPage() {
  const queryClient = useQueryClient();

  // Load Inventory Data
  const { data: inventoryData, isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });

  const products: Product[] = inventoryData?.products ?? [];

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State Edit/Restock
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editStockQty, setEditStockQty] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Categories Extraction
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category || 'Umum'));
    return ['Semua', ...Array.from(cats)];
  }, [products]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'Semua' || (p.category || 'Umum') === selectedCategory;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'low_stock'
            ? p.stockCount <= (p.minStock || 10)
            : statusFilter === 'deadstock'
              ? p.isDeadstock
              : p.stockCount > (p.minStock || 10);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, statusFilter]);

  // Handle Quick Stock Update
  const handleUpdateStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const addedQty = parseInt(editStockQty) || 0;
    const newStock = selectedProduct.stockCount + addedQty;

    const updated: Product = {
      ...selectedProduct,
      stockCount: newStock,
      status: newStock <= (selectedProduct.minStock || 10) ? 'low_stock' : 'healthy',
    };

    updateProduct(updated);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    setSelectedProduct(null);
    setEditStockQty('');
    showToast(`Stok ${updated.name} berhasil diperbarui (+${addedQty} unit)!`);
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0" aria-label="Manajemen Stok Pusat">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER UTAMA MANAJEMEN STOK ─── */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm w-full">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] tracking-tight uppercase">
            MANAJEMEN STOK GUDANG PUSAT
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
            Sistem Inventaris Terintegrasi, Prediksi AI Sisa Stok, Dan Pengadaan Barang
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          <span className="bg-[#5F1E1E] text-[#E8D3A7] text-xs font-bold px-3.5 py-2.5 rounded-xl uppercase tracking-wider shadow-sm w-full sm:w-auto text-center min-h-[44px] flex items-center justify-center">
            Total {products.length} SKU
          </span>
        </div>
      </header>

      {/* ─── FILTER & SEARCH BAR ─── */}
      <section className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between w-full">

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari Nama Produk / SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#E8D3A7]/20 border-2 border-[#B48328] text-[#5F1E1E] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none placeholder-[#B48328]/70 min-h-[44px]"
          />
          <svg className="w-4 h-4 stroke-[#5F1E1E] stroke-2 absolute left-3 top-3.5" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-start md:justify-end">

          {/* Category Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold tracking-wider uppercase focus:outline-none cursor-pointer min-h-[44px]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  KATEGORI: {cat.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5F1E1E]">
              <svg className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold tracking-wider uppercase focus:outline-none cursor-pointer min-h-[44px]"
            >
              <option value="all">SEMUA STATUS</option>
              <option value="healthy">STOK AMAN</option>
              <option value="low_stock">STOK KRITIS</option>
              <option value="deadstock">DEADSTOCK</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5F1E1E]">
              <svg className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>

        </div>
      </section>

      {/* ─── TABEL INVENTARIS STOK PUSAT ─── */}
      <section className="bg-white rounded-2xl shadow-sm border border-transparent overflow-hidden w-full">
        {isLoading ? (
          <div className="p-12 text-center text-[#5F1E1E] font-bold text-sm">
            Memuat data gudang pusat...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-600 font-bold text-sm">
            Gagal mengambil data inventaris stok.
          </div>
        ) : (
          <>
            {/* Desktop grid table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#5F1E1E] text-[#E8D3A7] text-[10px] uppercase font-black tracking-wider border-b border-[#B48328]/30">
                    <th className="py-4 px-5">Produk & SKU</th>
                    <th className="py-4 px-5">Kategori</th>
                    <th className="py-4 px-5">Harga (Beli / Jual)</th>
                    <th className="py-4 px-5">Stok Fisik</th>
                    <th className="py-4 px-5">Prediksi AI</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada produk yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLow = p.stockCount <= (p.minStock || 10);
                      return (
                        <tr key={p.id} className="hover:bg-[#E8D3A7]/20 transition-colors">
                          {/* Nama & SKU */}
                          <td className="py-3.5 px-5">
                            <p className="font-extrabold text-[#5F1E1E] text-sm">{p.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 font-semibold mt-0.5">{p.sku}</p>
                          </td>

                          {/* Kolom Kategori (1 Warna Seragam Zura Retail) */}
                          <td className="py-3.5 px-5">
                            <span className="bg-[#E8D3A7]/60 text-[#5F1E1E] border border-[#B48328]/40 font-extrabold px-3 py-1 rounded-xl text-[10px] uppercase tracking-wider">
                              {p.category || 'Umum'}
                            </span>
                          </td>

                          {/* Harga */}
                          <td className="py-3.5 px-5 font-medium">
                            <p className="text-slate-500 text-[10px]">Beli: {formatRupiah(p.buyPrice)}</p>
                            <p className="font-bold text-[#5F1E1E]">{formatRupiah(p.sellPrice)}</p>
                          </td>

                          {/* Stok Fisik */}
                          <td className="py-3.5 px-5">
                            <p className={`text-sm font-black ${isLow ? 'text-red-600' : 'text-[#5F1E1E]'}`}>
                              {p.stockCount} <span className="text-[10px] font-normal text-slate-500">unit</span>
                            </p>
                            <p className="text-[9px] text-slate-400">Min. Stok: {p.minStock || 10}</p>
                          </td>

                          {/* Prediksi AI */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#B48328]"></span>
                              <span className="font-bold text-[#5F1E1E]">~{p.aiForecasterDays} Hari lagi</span>
                            </div>
                            <span className="text-[9px] text-slate-400">Perkiraan Habis</span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-5">
                            {p.isDeadstock ? (
                              <span className="bg-[#E5C88B] text-[#5F1E1E] font-bold px-2.5 py-1 rounded-xl text-[9px] uppercase tracking-wider border border-[#5F1E1E]/20">
                                Deadstock
                              </span>
                            ) : isLow ? (
                              <span className="bg-red-100 text-red-700 font-extrabold px-2.5 py-1 rounded-xl text-[9px] uppercase tracking-wider">
                                Kritis
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-xl text-[9px] uppercase tracking-wider">
                                Aman
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(p)}
                              className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-3.5 py-1.5 rounded-xl text-[10px] shadow-sm transition-all active:scale-95"
                            >
                              + Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card stack view */}
            <div className="block md:hidden flex flex-col gap-3 p-4 bg-slate-50/30">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-medium">
                  Tidak ada produk yang cocok dengan pencarian.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockCount <= (p.minStock || 10);
                  return (
                    <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-3.5 shadow-sm">
                      <div className="flex flex-col border-b border-slate-50 pb-2">
                        <h3 className="font-extrabold text-[#5F1E1E] text-sm leading-snug">{p.name}</h3>
                        <p className="text-[9px] font-mono text-slate-500 font-semibold mt-0.5">{p.sku}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Kategori</p>
                          <span className="inline-block mt-1 bg-[#E8D3A7]/60 text-[#5F1E1E] border border-[#B48328]/40 font-extrabold px-2.5 py-0.5 rounded-xl text-[9px] uppercase tracking-wider">
                            {p.category || 'Umum'}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Harga</p>
                          <p className="text-slate-500 text-[9px] mt-0.5">Beli: {formatRupiah(p.buyPrice)}</p>
                          <p className="font-bold text-[#5F1E1E]">{formatRupiah(p.sellPrice)}</p>
                        </div>
                        
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Stok Fisik</p>
                          <p className={`text-sm font-black mt-0.5 ${isLow ? 'text-red-600' : 'text-[#5F1E1E]'}`}>
                            {p.stockCount} <span className="text-[10px] font-normal text-slate-500">unit</span>
                          </p>
                          <p className="text-[9px] text-slate-400">Min: {p.minStock || 10}</p>
                        </div>
                        
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Prediksi AI</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B48328]"></span>
                            <span className="font-bold text-[#5F1E1E] text-[11px]">~{p.aiForecasterDays} Hari</span>
                          </div>
                          <span className="text-[9px] text-slate-400">Perkiraan Habis</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                        <div>
                          {p.isDeadstock ? (
                            <span className="bg-[#E5C88B] text-[#5F1E1E] font-bold px-2 py-0.5 rounded-xl text-[9px] uppercase tracking-wider border border-[#5F1E1E]/20">
                              Deadstock
                            </span>
                          ) : isLow ? (
                            <span className="bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-xl text-[9px] uppercase tracking-wider">
                              Kritis
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-xl text-[9px] uppercase tracking-wider">
                              Aman
                            </span>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(p)}
                          className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-4 py-2.5 rounded-xl text-[10px] shadow-sm transition-all active:scale-95 flex items-center justify-center min-h-[36px]"
                        >
                          + Restock
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>

      {/* ─── MODAL RESTOCK PRODUK ─── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">Pengadaan Stok Pusat</h2>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateStockSubmit} className="flex flex-col gap-4 text-xs">
              <div className="bg-[#E8D3A7]/30 p-3 rounded-xl border border-[#B48328]/30 flex flex-col gap-1">
                <span className="text-[10px] text-[#B48328] uppercase font-bold">Produk</span>
                <span className="font-extrabold text-[#5F1E1E] text-sm">{selectedProduct.name}</span>
                <span className="text-[10px] font-mono text-slate-600">SKU: {selectedProduct.sku} | Stok Fisik: {selectedProduct.stockCount} unit</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#5F1E1E] uppercase">Jumlah Tambah Stok</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Masukkan jumlah..."
                  className="border-2 border-[#B48328] rounded-xl p-3 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#5F1E1E]"
                  value={editStockQty}
                  onChange={(e) => setEditStockQty(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow min-h-[44px]"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}