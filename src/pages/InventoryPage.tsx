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

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'semua' | 'low_stock' | 'healthy' | 'deadstock'>('semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [minStock, setMinStock] = useState('10');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedFilter === 'low_stock') {
        return matchesSearch && p.stockCount <= (p.minStock || 10);
      }
      if (selectedFilter === 'deadstock') {
        return matchesSearch && p.isDeadstock === true;
      }
      if (selectedFilter === 'healthy') {
        return matchesSearch && p.stockCount > (p.minStock || 10);
      }
      return matchesSearch;
    });
  }, [products, searchQuery, selectedFilter]);

  // Reset Form
  const resetForm = () => {
    setName('');
    setSku('');
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
    <div
      className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0"
      aria-label="Manajemen Stok Pusat"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER MANAJEMEN STOK DENGAN TOMBOL SEPERTI DI GAMBAR ─── */}
      <header className="bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">
            Manajemen Stok Gudang Pusat
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
            Kelola data persediaan fisik, batas minimum persediaan, dan harga jual/beli produk.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-extrabold px-4 py-2.5 rounded-2xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 min-h-[42px] tracking-wider uppercase"
          >
            + TAMBAH BARANG BARU
          </button>

          <div className="bg-[#F5EAD4] border border-[#B48328]/30 text-[#5F1E1E] font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center min-h-[42px] uppercase tracking-wider">
            TOTAL {products.length} SKU
          </div>
        </div>
      </header>

      {/* ─── RINGKASAN STATUS STOK ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <article
          onClick={() => setSelectedFilter('semua')}
          className={`bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all ${selectedFilter === 'semua' ? 'border-[#5F1E1E]' : 'border-transparent'
            }`}
        >
          <span className="text-[10px] font-bold text-[#5F1E1E] uppercase">Total Item Produk</span>
          <h3 className="text-2xl font-extrabold text-[#B48328] mt-1">{products.length} SKU</h3>
        </article>

        <article
          onClick={() => setSelectedFilter('low_stock')}
          className={`bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all ${selectedFilter === 'low_stock' ? 'border-red-500' : 'border-transparent'
            }`}
        >
          <span className="text-[10px] font-bold text-red-600 uppercase">Stok Kritis (Understock)</span>
          <h3 className="text-2xl font-extrabold text-red-600 mt-1">
            {products.filter((p) => p.stockCount <= (p.minStock || 10)).length} SKU
          </h3>
        </article>

        <article
          onClick={() => setSelectedFilter('healthy')}
          className={`bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all ${selectedFilter === 'healthy' ? 'border-emerald-500' : 'border-transparent'
            }`}
        >
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Stok Aman</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
            {products.filter((p) => p.stockCount > (p.minStock || 10)).length} SKU
          </h3>
        </article>
      </section>

      {/* ─── TABEL MANAJEMEN BARANG ─── */}
      <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase">Daftar Inventaris Produk</h2>

          <input
            type="text"
            className="bg-[#E8D3A7]/20 border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2 text-xs focus:outline-none w-full sm:w-64 placeholder-[#B48328]/70"
            placeholder="Cari Nama Produk / SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabel Desktop */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#5F1E1E] text-[#E8D3A7] uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4 text-right">Harga Beli (HPP)</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-right">Stok Fisik</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5F1E1E] font-bold animate-pulse">
                    Memuat data stok produk dari Firestore...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                    Tidak ada produk yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockCount <= (p.minStock || 10);
                  return (
                    <tr key={p.id} className="hover:bg-[#E8D3A7]/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{p.sku}</td>
                      <td className="py-3 px-4 font-extrabold text-[#5F1E1E]">{p.name}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-500">{formatRupiah(p.buyPrice)}</td>
                      <td className="py-3 px-4 text-right font-black text-[#B48328]">{formatRupiah(p.sellPrice)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#5F1E1E]">{p.stockCount} Pcs</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                            }`}
                        >
                          {isLow ? 'KRITIS' : 'AMAN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="text-blue-600 hover:underline font-extrabold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="text-red-600 hover:underline font-extrabold"
                        >
                          Hapus
                        </button>
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
                  placeholder="Contoh: Gamis Rayon Premium"
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Kode SKU</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SKU-GMS-001"
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold font-mono text-[#5F1E1E] focus:outline-none"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Harga Beli / HPP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
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
                    placeholder="0"
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
                    placeholder="0"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Batas Stok Kritis</label>
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
    </div>
  );
}