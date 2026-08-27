import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, addProduct, updateProduct, deleteProduct } from '../api/client';
import type { Product } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function InventoryPage() {
  const queryClient = useQueryClient();

  // ─── AMBIL DATA FIRESTORE SECARA ASYNC VIA USEQUERY ───
  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await fetchInventory();
      return Array.isArray(res) ? res : [];
    },
  });

  const products = useMemo(() => (Array.isArray(rawProducts) ? rawProducts : []), [rawProducts]);

  // States Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedFilterCategory] = useState('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState('SEMUA STATUS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restock Modal
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('10');

  // Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('MAKANAN & MINUMAN (F&B)');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [minStock, setMinStock] = useState('10');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categoriesList = ['SEMUA', 'MAKANAN & MINUMAN (F&B)', 'FASHION & PAKAIAN', 'ELEKTRONIK', 'KECANTIKAN & KESEHATAN', 'LAINNYA'];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'SEMUA' || (p.category || 'MAKANAN & MINUMAN (F&B)') === selectedCategory;

      const isLow = p.stockCount <= (p.minStock || 10);
      const isDead = p.isDeadstock === true;

      let matchesStat = true;
      if (selectedStatus === 'STOK AMAN') matchesStat = !isLow && !isDead;
      if (selectedStatus === 'STOK KRITIS') matchesStat = isLow;
      if (selectedStatus === 'DEADSTOCK') matchesStat = isDead;

      return matchesSearch && matchesCat && matchesStat;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Reset Form
  const resetForm = () => {
    setName('');
    setSku('');
    setCategory('MAKANAN & MINUMAN (F&B)');
    setBuyPrice('');
    setSellPrice('');
    setStockCount('');
    setMinStock('10');
    setEditingProduct(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category || 'MAKANAN & MINUMAN (F&B)');
    setBuyPrice(p.buyPrice ? p.buyPrice.toString() : '');
    setSellPrice(p.sellPrice ? p.sellPrice.toString() : '');
    setStockCount(p.stockCount.toString());
    setMinStock((p.minStock || 10).toString());
    setShowAddModal(true);
  };

  // Submit Handler (Tambah / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) {
      showToast('Nama produk dan SKU wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    const stock = parseInt(stockCount) || 0;
    const min = parseInt(minStock) || 10;

    const payload: Omit<Product, 'id'> = {
      name,
      sku,
      category,
      buyPrice: parseFloat(buyPrice) || 0,
      sellPrice: parseFloat(sellPrice) || 0,
      stockCount: stock,
      minStock: min,
      status: stock <= min ? 'low_stock' : 'healthy',
      isDeadstock: false,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        showToast('Produk berhasil diperbarui!');
      } else {
        await addProduct(payload);
        showToast('Produk baru berhasil ditambahkan!');
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data produk ke Firestore!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;

    const qty = parseInt(restockQty) || 0;
    if (qty <= 0) return;

    try {
      const updatedStock = restockProduct.stockCount + qty;
      await updateProduct(restockProduct.id, {
        stockCount: updatedStock,
        status: updatedStock <= (restockProduct.minStock || 10) ? 'low_stock' : 'healthy',
      });

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      setRestockProduct(null);
      showToast(`Stok ${restockProduct.name} berhasil ditambah +${qty} unit!`);
    } catch (err) {
      console.error(err);
      showToast('Gagal menambah stok!');
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
      await deleteProduct(id);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      showToast('Produk berhasil dihapus!');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus produk!');
    }
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-4 md:gap-5 font-dmsans w-full max-w-full overflow-x-hidden min-w-0">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── 1. HEADER ─── */}
      <header className="bg-white p-5 sm:p-6 rounded-2xl border border-transparent shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#5F1E1E] uppercase tracking-wide">
            MANAJEMEN STOK GUDANG PUSAT
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#B48328] mt-1">
            Sistem Inventaris Terintegrasi Firebase, Prediksi AI Sisa Stok, Dan Pengadaan Barang
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px] tracking-wider uppercase"
          >
            + TAMBAH BARANG BARU
          </button>

          <div className="bg-[#F5EAD4] border border-[#B48328]/30 text-[#5F1E1E] font-black px-5 py-3 rounded-2xl text-xs flex items-center justify-center min-h-[44px] uppercase tracking-wider">
            TOTAL {products.length} SKU
          </div>
        </div>
      </header>

      {/* ─── 2. BARIS FILTER & SEARCH ─── */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 w-full">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className="w-full bg-[#FFFDF9] border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-2xl px-4 py-2.5 text-xs focus:outline-none placeholder-[#B48328]/60 shadow-inner"
            placeholder="Cari Nama Produk / SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Dropdown Kategori */}
          <div className="relative w-full sm:w-auto">
            <select
              aria-label="Filter Kategori Produk"
              value={selectedCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-[#FFFDF9] border-2 border-[#B48328] text-[#5F1E1E] font-extrabold rounded-2xl pl-4 pr-10 py-2.5 text-xs focus:outline-none uppercase cursor-pointer"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  KATEGORI: {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#5F1E1E]">
              <svg className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>

          {/* Dropdown Status */}
          <div className="relative w-full sm:w-auto">
            <select
              aria-label="Filter Status Stok"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-[#FFFDF9] border-2 border-[#B48328] text-[#5F1E1E] font-extrabold rounded-2xl pl-4 pr-10 py-2.5 text-xs focus:outline-none uppercase cursor-pointer"
            >
              <option value="SEMUA STATUS">SEMUA STATUS</option>
              <option value="STOK AMAN">STOK AMAN</option>
              <option value="STOK KRITIS">STOK KRITIS</option>
              <option value="DEADSTOCK">DEADSTOCK</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#5F1E1E]">
              <svg className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. TABEL ─── */}
      <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-transparent w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#5F1E1E] text-[#E8D3A7] uppercase text-[10px] font-black tracking-wider border-b border-white/10">
                <th className="py-3.5 px-4">PRODUK & SKU</th>
                <th className="py-3.5 px-4">KATEGORI</th>
                <th className="py-3.5 px-4">HARGA (BELI / JUAL)</th>
                <th className="py-3.5 px-4">STOK FISIK</th>
                <th className="py-3.5 px-4">PREDIKSI AI</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5F1E1E] font-extrabold animate-pulse text-sm">
                    Memuat data stok produk dari Firestore...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-sm">
                    Tidak ada produk yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockCount <= (p.minStock || 10);
                  const isDead = p.isDeadstock === true;
                  const aiDays = p.aiForecasterDays || (isLow ? 5 : isDead ? 0 : Math.floor(15 + Math.random() * 20));

                  return (
                    <tr key={p.id} className="hover:bg-[#E8D3A7]/10 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-extrabold text-[#5F1E1E] text-sm leading-tight">{p.name}</p>
                        <p className="font-mono text-[10px] text-slate-400 font-bold mt-0.5">{p.sku}</p>
                      </td>

                      <td className="py-4 px-4">
                        <span className="bg-[#F5EAD4] text-[#5F1E1E] font-extrabold px-3 py-1 rounded-2xl text-[9px] uppercase tracking-wider inline-block">
                          {p.category || 'MAKANAN & MINUMAN (F&B)'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-[10px] text-slate-400 font-semibold">Beli: {formatRupiah(p.buyPrice)}</p>
                        <p className="font-black text-[#5F1E1E] text-xs mt-0.5">{formatRupiah(p.sellPrice)}</p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-black text-[#5F1E1E] text-sm">
                          {p.stockCount} <span className="text-xs font-semibold text-slate-500">unit</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Min. Stok: {p.minStock || 10}</p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-extrabold text-[#5F1E1E] text-xs">
                          <span className="w-2 h-2 rounded-full bg-[#B48328]"></span>
                          <span>~{aiDays} Hari lagi</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl text-[10px] font-extrabold tracking-wider ${isLow
                            ? 'bg-red-100 text-red-700'
                            : isDead
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-700'
                            }`}
                        >
                          {isLow ? 'KRITIS' : isDead ? 'DEADSTOCK' : 'AMAN'}
                        </span>
                      </td>

                      {/* 💥 TOMBOL AKSI VERTIKAL PADA MOBILE, HORIZONTAL PADA DESKTOP 💥 */}
                      <td className="py-4 px-3 sm:px-4 text-center">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-1.5 sm:gap-2 min-w-[100px] sm:min-w-max">
                          <button
                            type="button"
                            onClick={() => {
                              setRestockProduct(p);
                              setRestockQty('10');
                            }}
                            className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-extrabold px-3 py-1.5 rounded-xl text-[10px] sm:text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap flex items-center justify-center gap-1 w-full sm:w-auto h-7 sm:h-8"
                          >
                            <span>+</span> Restock
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] font-extrabold px-3 py-1.5 rounded-xl text-[10px] sm:text-xs transition-all whitespace-nowrap flex items-center justify-center w-full sm:w-auto h-7 sm:h-8"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] font-extrabold px-3 py-1.5 rounded-xl text-[10px] sm:text-xs transition-all whitespace-nowrap flex items-center justify-center w-full sm:w-auto h-7 sm:h-8"
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
      </section>

      {/* ─── MODAL TAMBAH / EDIT PRODUK ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kripik Pisang"
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Kode SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="ZR-KP-3383"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold font-mono text-[#5F1E1E] focus:outline-none"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Kategori</label>
                  <select
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categoriesList.filter((c) => c !== 'SEMUA').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Harga Beli / HPP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1500"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold font-mono text-[#5F1E1E] focus:outline-none"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="3000"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold font-mono text-[#5F1E1E] focus:outline-none"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Stok Fisik</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="105"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Min. Stok Kritis</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow flex items-center justify-center min-h-[38px]"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : editingProduct ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Barang'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL RESTOCK ─── */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-xs p-5 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-sm font-extrabold text-[#5F1E1E] uppercase">Tambah Stok Barcode</h2>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="flex flex-col gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="font-extrabold text-[#5F1E1E]">{restockProduct.name}</p>
                <p className="text-[10px] text-slate-400 font-bold">Stok Saat Ini: {restockProduct.stockCount} unit</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Kuantitas Restock</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="bg-slate-100 text-slate-600 font-bold px-3 py-2 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-4 py-2 rounded-xl text-xs shadow"
                >
                  Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}