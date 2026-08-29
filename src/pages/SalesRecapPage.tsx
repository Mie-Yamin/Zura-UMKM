import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLocalProducts, addProduct, updateProduct, deleteProduct } from '../api/client';
import type { Product } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function InventoryPage() {
  const queryClient = useQueryClient();

  // ─── AMBIL DATA INVENTORY DARI FIRESTORE ───
  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await getLocalProducts();
      return Array.isArray(res) ? res : [];
    },
  });

  const products = useMemo(() => (Array.isArray(rawProducts) ? rawProducts : []), [rawProducts]);

  // States Filter & Toast
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form States Tambah Produk
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState(`ZR-KP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newProductCategory, setNewProductCategory] = useState('Makanan & Minuman');

  // HPP Mode States (grosir / satuan)
  const [hppMode, setHppMode] = useState<'grosir' | 'satuan'>('grosir');
  const [dusPrice, setDusPrice] = useState<string | number>('180000');
  const [pcsPerDus, setPcsPerDus] = useState<string | number>('120');
  const [calculatedHpp, setCalculatedHpp] = useState<string | number>('1500');

  const [newProductSellPrice, setNewProductSellPrice] = useState<string | number>('3000');
  const [newProductStock, setNewProductStock] = useState<string | number>('120');
  const [newProductMinStock, setNewProductMinStock] = useState<string | number>('10');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ─── OTOMATISASI HITUNG HPP BERDASARKAN MODE ───
  React.useEffect(() => {
    if (hppMode === 'grosir') {
      const dus = Number(dusPrice) || 0;
      const pcs = Number(pcsPerDus) || 1;
      if (pcs > 0) {
        setCalculatedHpp(Math.round(dus / pcs));
      }
    }
  }, [dusPrice, pcsPerDus, hppMode]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // SUBMIT HANDLER TAMBAH PRODUK BARU
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProductName.trim()) {
      showToast('Nama produk wajib diisi!');
      return;
    }

    const hppValue = Number(calculatedHpp) || 0;
    const sellPriceValue = Number(newProductSellPrice) || 0;
    const stockCountValue = Number(newProductStock) || 0;
    const minStockValue = Number(newProductMinStock) || 10;

    const newProductData: Omit<Product, 'id'> = {
      name: newProductName.trim(),
      sku: newProductSku.trim(),
      category: newProductCategory,
      costPrice: hppValue,
      sellPrice: sellPriceValue,
      stockCount: stockCountValue,
      minStock: minStockValue,
      status: stockCountValue <= minStockValue ? 'low_stock' : 'healthy',
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    try {
      await addProduct(newProductData);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });

      setShowAddModal(false);
      // Reset Form State
      setNewProductName('');
      setNewProductSku(`ZR-KP-${Math.floor(1000 + Math.random() * 9000)}`);
      showToast(`Produk ${newProductName} berhasil ditambahkan ke inventaris!`);
    } catch (err) {
      console.error('Gagal menambah produk:', err);
      showToast('Gagal menambahkan produk ke Firestore!');
    }
  };

  // SUBMIT HANDLER UPDATE PRODUK
  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const updatedData: Product = {
        ...editingProduct,
        status: editingProduct.stockCount <= (editingProduct.minStock || 10) ? 'low_stock' : 'healthy',
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      await updateProduct(editingProduct.id, updatedData);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });

      setEditingProduct(null);
      showToast(`Produk ${editingProduct.name} berhasil diperbarui!`);
    } catch (err) {
      console.error('Gagal memperbarui produk:', err);
      showToast('Gagal memperbarui data produk!');
    }
  };

  // DELETE HANDLER
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      showToast(`Produk "${name}" berhasil dihapus dari inventaris!`);
    } catch (err) {
      console.error('Gagal menghapus produk:', err);
      showToast('Gagal menghapus produk!');
    }
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold max-w-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">
            Manajemen Inventaris Stok Pusat
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
            Pantau stok fisik barang, harga Pokok Penjualan (HPP), dan atur batas minimum stok kritis.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk Baru
        </button>
      </header>

      {/* RINGKASAN KPIS STOK */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <article className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Variasi Produk</span>
          <h3 className="text-2xl font-extrabold text-[#5F1E1E] mt-2">{products.length} SKU</h3>
        </article>

        <article className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Unit Stok Fisik</span>
          <h3 className="text-2xl font-extrabold text-[#B48328] mt-2">
            {products.reduce((acc, p) => acc + (p.stockCount || 0), 0)} Unit
          </h3>
        </article>

        <article className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-red-500 uppercase">Stok Kritis / Menipis</span>
          <h3 className="text-2xl font-extrabold text-red-600 mt-2">
            {products.filter((p) => (p.stockCount || 0) <= (p.minStock || 10)).length} Produk
          </h3>
        </article>
      </section>

      {/* TABEL INVENTARIS PRODUK */}
      <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3 md:gap-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase">Daftar Produk & Batas Kritis</h2>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <select
              className="w-full sm:w-auto bg-white border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none uppercase min-h-[44px] cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Makanan & Minuman">Makanan & Minuman</option>
              <option value="Sembako">Sembako</option>
              <option value="Cemilan">Cemilan</option>
              <option value="Lainnya">Lainnya</option>
            </select>

            <input
              type="text"
              className="bg-[#E8D3A7]/20 border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none w-full md:w-48 placeholder-[#B48328]/70 min-h-[44px]"
              placeholder="Cari SKU / Nama Barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabel Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#5F1E1E] text-[#E8D3A7] uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Modal / HPP</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-right">Stok Fisik</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#5F1E1E] font-bold animate-pulse">
                    Memuat data inventaris...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                    Tidak ada data produk yang cocok.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockCount <= (p.minStock || 10);
                  return (
                    <tr key={p.id} className="hover:bg-[#E8D3A7]/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{p.sku}</td>
                      <td className="py-3 px-4 font-extrabold text-[#5F1E1E]">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{p.category}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 font-bold">{formatRupiah(p.costPrice)}</td>
                      <td className="py-3 px-4 text-right font-black text-[#B48328]">{formatRupiah(p.sellPrice)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#5F1E1E]">{p.stockCount} Pcs</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-xl text-[10px] ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-red-600' : 'bg-emerald-600'}`}></span>
                          {isLow ? 'Stok Kritis' : 'Aman'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="text-[#5F1E1E] hover:underline font-extrabold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 rounded-lg text-[10px] transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Stack */}
        <div className="block md:hidden flex flex-col gap-3">
          {isLoading ? (
            <div className="text-center py-8 text-[#5F1E1E] font-bold text-xs animate-pulse">
              Memuat data inventaris...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-bold text-xs">
              Tidak ada data produk yang cocok.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isLow = p.stockCount <= (p.minStock || 10);
              return (
                <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="font-mono font-bold text-xs text-slate-500">{p.sku}</span>
                    <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-xl text-[10px] ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-red-600' : 'bg-emerald-600'}`}></span>
                      {isLow ? 'Stok Kritis' : 'Aman'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-[#5F1E1E] text-sm uppercase">{p.name}</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{p.category}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">HPP Modal</p>
                      <p className="font-bold text-slate-600 text-[11px]">{formatRupiah(p.costPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Harga Jual</p>
                      <p className="font-black text-[#B48328] text-[11px]">{formatRupiah(p.sellPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Stok Fisik</p>
                      <p className="font-black text-[#5F1E1E] text-[11px]">{p.stockCount} Pcs</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-50 pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1.5 px-3 rounded-lg"
                    >
                      Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="text-[#5F1E1E] hover:underline font-extrabold text-xs py-1.5 px-3 hover:bg-[#E8D3A7]/20 rounded-lg"
                    >
                      Edit Produk
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ─── 💥 MODAL TAMBAH PRODUK BARU - RESPONSIVE MOBILE & DESKTOP 💥 ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp text-xs font-dmsans">

            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-black text-[#5F1E1E] uppercase tracking-wide">
                TAMBAH PRODUK BARU
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2 py-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="flex flex-col gap-4">

              {/* NAMA PRODUK */}
              <div className="flex flex-col gap-1">
                <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">
                  NAMA PRODUK
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kripik Pisang"
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs placeholder-[#B48328]/50"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </div>

              {/* KODE SKU & KATEGORI (1 Kolom di Mobile, 2 Kolom di Desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">
                    KODE SKU
                  </label>
                  <input
                    type="text"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={newProductSku}
                    onChange={(e) => setNewProductSku(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">
                    KATEGORI
                  </label>
                  <select
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] bg-[#FFFDF9] focus:outline-none text-xs cursor-pointer truncate"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                  >
                    <option value="Makanan & Minuman">MAKANAN & MINUMAN</option>
                    <option value="Sembako">SEMBAKO</option>
                    <option value="Cemilan">CEMILAN</option>
                    <option value="Lainnya">LAINNYA</option>
                  </select>
                </div>
              </div>

              {/* CONTAINER MODE HITUNG MODAL BELI (HPP) */}
              <div className="border-2 border-[#B48328]/40 p-3.5 rounded-2xl bg-[#E8D3A7]/15 flex flex-col gap-3">

                {/* Toggle Mode Button yang Rapi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#B48328]/20 pb-2">
                  <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase">
                    MODE HITUNG MODAL BELI (HPP):
                  </span>
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1 self-start sm:self-auto border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setHppMode('grosir')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${hppMode === 'grosir'
                          ? 'bg-[#5F1E1E] text-[#E8D3A7] shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      📦 Grosir / Dus
                    </button>
                    <button
                      type="button"
                      onClick={() => setHppMode('satuan')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${hppMode === 'satuan'
                          ? 'bg-[#5F1E1E] text-[#E8D3A7] shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      🏷️ Satuan Pcs
                    </button>
                  </div>
                </div>

                {/* Input Dus & Isi jika mode Grosir */}
                {hppMode === 'grosir' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <label className="font-extrabold text-slate-600 text-[9px] uppercase">
                        TOTAL MODAL DUS (RP)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="border border-[#B48328] rounded-xl p-2 font-bold text-[#5F1E1E] bg-white text-xs focus:outline-none"
                        value={dusPrice}
                        onChange={(e) => setDusPrice(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-extrabold text-slate-600 text-[9px] uppercase">
                        JUMLAH ISI (PCS)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="border border-[#B48328] rounded-xl p-2 font-bold text-[#5F1E1E] bg-white text-xs focus:outline-none"
                        value={pcsPerDus}
                        onChange={(e) => setPcsPerDus(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* HARGA BELI (HPP) & HARGA JUAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">
                      HARGA BELI / HPP (RP)
                    </label>
                    {hppMode === 'grosir' && (
                      <span className="text-[9px] font-black text-[#B48328] uppercase bg-[#E8D3A7]/40 px-1.5 py-0.5 rounded">
                        AUTO
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    readOnly={hppMode === 'grosir'}
                    placeholder="0"
                    className={`border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] text-xs focus:outline-none ${hppMode === 'grosir' ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-[#FFFDF9]'
                      }`}
                    value={calculatedHpp}
                    onChange={(e) => setCalculatedHpp(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">
                    HARGA JUAL (RP)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={newProductSellPrice}
                    onChange={(e) => setNewProductSellPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* STOK FISIK & MIN. STOK KRITIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">
                    STOK FISIK
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">
                    MIN. STOK KRITIS
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={newProductMinStock}
                    onChange={(e) => setNewProductMinStock(e.target.value)}
                  />
                </div>
              </div>

              {/* TOMBOL AKSI MODAL */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 mt-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-black px-6 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition-all min-h-[44px]"
                >
                  Tambah Barang
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL EDIT PRODUK ─── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp text-xs font-dmsans">

            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-black text-[#5F1E1E] uppercase tracking-wide">
                EDIT DATA PRODUK
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2 py-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="flex flex-col gap-4">

              <div className="flex flex-col gap-1">
                <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">NAMA PRODUK</label>
                <input
                  type="text"
                  required
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">KODE SKU</label>
                  <input
                    type="text"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">KATEGORI</label>
                  <select
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] bg-[#FFFDF9] focus:outline-none text-xs cursor-pointer truncate"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  >
                    <option value="Makanan & Minuman">MAKANAN & MINUMAN</option>
                    <option value="Sembako">SEMBAKO</option>
                    <option value="Cemilan">CEMILAN</option>
                    <option value="Lainnya">LAINNYA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">HARGA BELI / HPP (RP)</label>
                  <input
                    type="number"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">HARGA JUAL (RP)</label>
                  <input
                    type="number"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={editingProduct.sellPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellPrice: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">STOK FISIK</label>
                  <input
                    type="number"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={editingProduct.stockCount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockCount: Number(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase text-[10px]">MIN. STOK KRITIS</label>
                  <input
                    type="number"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] text-xs"
                    value={editingProduct.minStock || 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: Number(e.target.value) || 10 })}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 mt-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-black px-6 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition-all min-h-[44px]"
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}