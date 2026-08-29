import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, addProduct, updateProduct, deleteProduct } from '../api/client';
import type { Product } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

// HELPER FORMAT FORMATTING RUPIAH UNTUK INPUT FIELD
const formatRupiahInput = (val: string | number) => {
  if (!val && val !== 0) return '';
  const cleanNumber = val.toString().replace(/\D/g, '');
  if (!cleanNumber) return '';
  return Number(cleanNumber).toLocaleString('id-ID');
};

const parseRawNumber = (formattedVal: string) => {
  const cleanNumber = formattedVal.replace(/\D/g, '');
  return cleanNumber ? Number(cleanNumber) : 0;
};

// Kategori Bawaan Sistem
const DEFAULT_CATEGORIES = [
  'MAKANAN & MINUMAN (F&B)',
  'FASHION & PAKAIAN',
  'ELEKTRONIK',
  'KECANTIKAN & KESEHATAN',
  'LAINNYA',
];

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

  // STATE KATEGORI CUSTOM (TERSIMPAN DI LOCALSTORAGE)
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zura_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('zura_custom_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false); // Modal khusus kelola/hapus kategori
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restock Modal
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('10');

  // Form States Basic
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('MAKANAN & MINUMAN (F&B)');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [minStock, setMinStock] = useState('10');

  const [inputMode, setInputMode] = useState<'satuan' | 'grosir'>('grosir');
  const [wholesaleTotal, setWholesaleTotal] = useState('180000');
  const [wholesaleQty, setWholesaleQty] = useState('120');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Gabungan Kategori Utama + Custom
  const fullCategoriesList = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...customCategories];
  }, [customCategories]);

  const categoriesFilterList = useMemo(() => {
    return ['SEMUA', ...fullCategoriesList];
  }, [fullCategoriesList]);

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
    setSku(`ZR-KP-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('MAKANAN & MINUMAN (F&B)');
    setCustomCategoryInput('');
    setBuyPrice('1500');
    setSellPrice('3000');
    setStockCount('120');
    setMinStock('10');
    setInputMode('grosir');
    setWholesaleTotal('180000');
    setWholesaleQty('120');
    setEditingProduct(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);

    const existingCategory = p.category || 'MAKANAN & MINUMAN (F&B)';
    if (fullCategoriesList.includes(existingCategory)) {
      setCategory(existingCategory);
      setCustomCategoryInput('');
    } else {
      setCategory('CUSTOM');
      setCustomCategoryInput(existingCategory);
    }

    setBuyPrice(p.buyPrice ? p.buyPrice.toString() : '');
    setSellPrice(p.sellPrice ? p.sellPrice.toString() : '');
    setStockCount(p.stockCount.toString());
    setMinStock((p.minStock || 10).toString());
    setInputMode('satuan');
    setShowAddModal(true);
  };

  const handleWholesaleChange = (totalStr: string, qtyStr: string) => {
    const rawTotal = parseRawNumber(totalStr);
    const rawQty = parseRawNumber(qtyStr);

    setWholesaleTotal(rawTotal.toString());
    setWholesaleQty(rawQty.toString());

    if (rawQty > 0 && rawTotal > 0) {
      const calculatedHpp = Math.round(rawTotal / rawQty);
      setBuyPrice(calculatedHpp.toString());
      setStockCount(rawQty.toString());
    }
  };

  const handleDeleteCustomCategory = (catToDelete: string) => {
    if (window.confirm(`Hapus kategori "${catToDelete}" dari daftar?`)) {
      setCustomCategories((prev) => prev.filter((c) => c !== catToDelete));
      if (category === catToDelete) {
        setCategory('MAKANAN & MINUMAN (F&B)');
      }
      showToast(`Kategori "${catToDelete}" berhasil dihapus!`);
    }
  };

  // Submit Handler (Tambah / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) {
      showToast('Nama produk dan SKU wajib diisi!');
      return;
    }

    let finalCategory = category;
    if (category === 'CUSTOM') {
      const trimmedCustom = customCategoryInput.trim().toUpperCase();
      if (!trimmedCustom) {
        showToast('Silakan masukkan nama kategori custom!');
        return;
      }
      finalCategory = trimmedCustom;

      if (!fullCategoriesList.includes(trimmedCustom)) {
        setCustomCategories((prev) => [...prev, trimmedCustom]);
      }
    }

    setIsSubmitting(true);
    const stock = parseInt(stockCount) || 0;
    const min = parseInt(minStock) || 10;

    const payload: Omit<Product, 'id'> = {
      name,
      sku,
      category: finalCategory,
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
              {categoriesFilterList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'SEMUA' ? 'KATEGORI: SEMUA' : cat}
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
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
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
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
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
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold font-mono text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                {/* FIELD DROPDOWN KATEGORI + TOMBOL KELOLA */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-[#5F1E1E] uppercase">Kategori</label>
                    {customCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowCategoryManager(true)}
                        className="text-[9px] text-[#B48328] hover:underline font-bold"
                      >
                        ⚙️ Kelola
                      </button>
                    )}
                  </div>
                  <select
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] cursor-pointer truncate"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {fullCategoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CUSTOM">➕ Tambah Kategori Custom...</option>
                  </select>
                </div>
              </div>

              {/* Input Teks Khusus jika memilih 'CUSTOM' */}
              {category === 'CUSTOM' && (
                <div className="flex flex-col gap-1 animate-scaleUp">
                  <label className="font-bold text-[#5F1E1E] uppercase text-[10px]">
                    Ketik Nama Kategori Baru:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: ATK & ALAT TULIS"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                  />
                </div>
              )}

              {!editingProduct && (
                <div className="bg-[#FFFDF9] p-3 rounded-xl border-2 border-[#B48328]/40 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase">
                      Mode Hitung Modal Beli (HPP):
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInputMode('grosir')}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all ${inputMode === 'grosir'
                          ? 'bg-[#5F1E1E] text-[#E8D3A7]'
                          : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        📦 Grosir / Dus
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('satuan')}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all ${inputMode === 'satuan'
                          ? 'bg-[#5F1E1E] text-[#E8D3A7]'
                          : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        🏷️ Satuan Pcs
                      </button>
                    </div>
                  </div>

                  {inputMode === 'grosir' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-slate-500">Total Modal Dus (Rp)</label>
                        <input
                          type="text"
                          placeholder="180.000"
                          value={formatRupiahInput(wholesaleTotal)}
                          onChange={(e) => handleWholesaleChange(e.target.value, wholesaleQty)}
                          className="w-full border border-[#B48328] rounded-lg p-1.5 font-bold text-[#5F1E1E] text-xs bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-slate-500">Jumlah Isi (Pcs)</label>
                        <input
                          type="text"
                          placeholder="120"
                          value={formatRupiahInput(wholesaleQty)}
                          onChange={(e) => handleWholesaleChange(wholesaleTotal, e.target.value)}
                          className="w-full border border-[#B48328] rounded-lg p-1.5 font-bold text-[#5F1E1E] text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase flex justify-between items-center">
                    <span>Harga Beli / HPP (Rp)</span>
                    {inputMode === 'grosir' && !editingProduct && (
                      <span className="text-[9px] text-[#B48328] font-bold">Auto</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="1.500"
                    readOnly={inputMode === 'grosir' && !editingProduct}
                    className={`border-2 border-[#B48328] rounded-xl p-2.5 font-bold font-mono focus:outline-none ${inputMode === 'grosir' && !editingProduct
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'bg-[#FFFDF9] text-[#5F1E1E]'
                      }`}
                    value={formatRupiahInput(buyPrice)}
                    onChange={(e) => setBuyPrice(parseRawNumber(e.target.value).toString())}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Harga Jual (Rp)</label>
                  <input
                    type="text"
                    placeholder="3.000"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold font-mono text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                    value={formatRupiahInput(sellPrice)}
                    onChange={(e) => setSellPrice(parseRawNumber(e.target.value).toString())}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Stok Fisik</label>
                  <input
                    type="text"
                    required
                    placeholder="105"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                    value={formatRupiahInput(stockCount)}
                    onChange={(e) => setStockCount(parseRawNumber(e.target.value).toString())}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Min. Stok Kritis</label>
                  <input
                    type="text"
                    required
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                    value={formatRupiahInput(minStock)}
                    onChange={(e) => setMinStock(parseRawNumber(e.target.value).toString())}
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

      {showCategoryManager && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-xs p-5 shadow-2xl flex flex-col gap-3 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-[#5F1E1E] uppercase">Kelola Kategori Custom</h3>
              <button
                type="button"
                onClick={() => setShowCategoryManager(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto my-1">
              {customCategories.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic text-center py-4">Belum ada kategori custom tersimpan.</p>
              ) : (
                customCategories.map((cat) => (
                  <div key={cat} className="flex justify-between items-center p-2 bg-[#FFFDF9] border border-[#B48328]/30 rounded-xl">
                    <span className="font-extrabold text-[#5F1E1E] text-xs truncate max-w-[170px]">{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomCategory(cat)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 rounded-lg text-[10px] transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCategoryManager(false)}
              className="w-full py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors mt-1"
            >
              Selesai
            </button>
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
                  type="text"
                  required
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                  value={formatRupiahInput(restockQty)}
                  onChange={(e) => setRestockQty(parseRawNumber(e.target.value).toString())}
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