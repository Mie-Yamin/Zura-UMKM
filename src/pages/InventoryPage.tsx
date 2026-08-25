import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, updateProduct, addProduct, deleteProduct } from '../api/client';
import type { Product } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

const DEFAULT_CATEGORIES = [
  'Makanan & Minuman (F&B)',
  'Pakaian & Fashion',
  'Ritel / Toko Kelontong',
  'Kecantikan & Kesehatan',
  'Elektronik & Aksesori',
];

const generateAutoSKU = (productName: string = '') => {
  const prefix = 'ZR';
  const nameParts = productName.trim().split(' ').filter(Boolean);
  let code = '';

  if (nameParts.length >= 2) {
    code = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
    code = nameParts[0].substring(0, 2).toUpperCase();
  } else {
    code = 'PR';
  }

  const timestampSuffix = Date.now().toString().slice(-4);
  return `${prefix}-${code}-${timestampSuffix}`;
};

export default function InventoryPage() {
  const queryClient = useQueryClient();

  const { data: rawProducts, isLoading, isError } = useQuery<Product[]>({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });

  const products: Product[] = useMemo(() => {
    return Array.isArray(rawProducts) ? rawProducts : [];
  }, [rawProducts]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editStockQty, setEditStockQty] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: DEFAULT_CATEGORIES[0],
    buyPrice: '',
    sellPrice: '',
    stockCount: '',
    minStock: '10',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const availableCategories = useMemo(() => {
    const existingCats = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCats]));
  }, [products]);

  const filterCategories = useMemo(() => {
    return ['Semua', ...availableCategories];
  }, [availableCategories]);

  const handleOpenAddModal = () => {
    setNewProduct({
      name: '',
      sku: generateAutoSKU(''),
      category: availableCategories[0] || DEFAULT_CATEGORIES[0],
      buyPrice: '',
      sellPrice: '',
      stockCount: '',
      minStock: '10',
    });
    setIsCustomCategory(false);
    setCustomCategory('');
    setIsAddModalOpen(true);
  };

  const handleNameChange = (nameVal: string) => {
    setNewProduct((prev) => ({
      ...prev,
      name: nameVal,
      sku: nameVal.trim() ? generateAutoSKU(nameVal) : prev.sku,
    }));
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
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

  // HAPUS PRODUK DENGAN AWAIT DAN RE-FETCH
  const handleDeleteProduct = async (product: Product) => {
    if (!product.id) {
      showToast('Error: ID Produk tidak ditemukan.');
      return;
    }

    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`);
    if (!isConfirmed) return;

    try {
      // 1. Eksekusi penghapusan di Firestore
      await deleteProduct(product.id);

      // 2. Perbarui data cache TanStack Query
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });

      showToast(`Produk "${product.name}" berhasil dihapus!`);
    } catch (error) {
      console.error('Gagal menghapus produk:', error);
      showToast('Gagal menghapus produk dari Firebase');
    }
  };

  const handleUpdateStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const addedQty = parseInt(editStockQty) || 0;
    const newStock = selectedProduct.stockCount + addedQty;

    const updatedData = {
      stockCount: newStock,
      status: newStock <= (selectedProduct.minStock || 10) ? 'low_stock' : 'healthy',
    };

    try {
      await updateProduct(selectedProduct.id, updatedData);
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedProduct(null);
      setEditStockQty('');
      showToast(`Stok ${selectedProduct.name} berhasil diperbarui (+${addedQty} unit)!`);
    } catch (error) {
      console.error('Gagal memperbarui stok:', error);
      showToast('Gagal memperbarui stok di Firestore');
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const stock = parseInt(newProduct.stockCount) || 0;
    const minStk = parseInt(newProduct.minStock) || 10;
    const finalCategory = isCustomCategory ? (customCategory.trim() || 'Umum') : newProduct.category;

    const productPayload: Omit<Product, 'id'> = {
      name: newProduct.name,
      sku: newProduct.sku.toUpperCase(),
      category: finalCategory,
      buyPrice: parseFloat(newProduct.buyPrice) || 0,
      sellPrice: parseFloat(newProduct.sellPrice) || 0,
      stockCount: stock,
      minStock: minStk,
      status: stock <= minStk ? 'low_stock' : 'healthy',
      aiForecasterDays: Math.floor(Math.random() * 20) + 10,
      isDeadstock: false,
    };

    try {
      await addProduct(productPayload);
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddModalOpen(false);
      setIsCustomCategory(false);
      setCustomCategory('');
      showToast(`Produk "${productPayload.name}" berhasil ditambahkan!`);
    } catch (error) {
      console.error('Gagal menambah produk:', error);
      showToast('Gagal menyimpan produk ke Firestore');
    }
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm w-full">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] tracking-tight uppercase">
            MANAJEMEN STOK GUDANG PUSAT
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
            Sistem Inventaris Terintegrasi Firebase, Prediksi AI Sisa Stok, Dan Pengadaan Barang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-start md:justify-end">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px] w-full sm:w-auto cursor-pointer"
          >
            <span className="text-base font-extrabold leading-none">+</span>
            <span>Tambah Barang Baru</span>
          </button>

          <span className="bg-[#E8D3A7]/60 border border-[#B48328]/40 text-[#5F1E1E] text-xs font-extrabold px-3.5 py-2.5 rounded-xl uppercase tracking-wider w-full sm:w-auto text-center min-h-[44px] flex items-center justify-center">
            Total {products.length} SKU
          </span>
        </div>
      </header>

      {/* FILTER BAR */}
      <section className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between w-full">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari Nama Produk / SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#E8D3A7]/20 border-2 border-[#B48328] text-[#5F1E1E] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none placeholder-[#B48328]/70 min-h-[44px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl px-3 py-2.5 text-xs font-bold tracking-wider uppercase focus:outline-none cursor-pointer min-h-[44px]"
          >
            {filterCategories.map((cat) => (
              <option key={cat} value={cat}>
                KATEGORI: {cat.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl px-3 py-2.5 text-xs font-bold tracking-wider uppercase focus:outline-none cursor-pointer min-h-[44px]"
          >
            <option value="all">SEMUA STATUS</option>
            <option value="healthy">STOK AMAN</option>
            <option value="low_stock">STOK KRITIS</option>
            <option value="deadstock">DEADSTOCK</option>
          </select>
        </div>
      </section>

      {/* TABEL INVENTARIS */}
      <section className="bg-white rounded-2xl shadow-sm overflow-hidden w-full">
        {isLoading ? (
          <div className="p-12 text-center text-[#5F1E1E] font-bold text-sm">
            Memuat data dari Firebase...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-600 font-bold text-sm">
            Gagal mengambil data dari database Firestore.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      Tidak ada produk yang cocok dengan pencarian / Database masih kosong.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = p.stockCount <= (p.minStock || 10);
                    return (
                      <tr key={p.id} className="hover:bg-[#E8D3A7]/20 transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="font-extrabold text-[#5F1E1E] text-sm">{p.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 font-semibold mt-0.5">{p.sku}</p>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="bg-[#E8D3A7]/60 text-[#5F1E1E] border border-[#B48328]/40 font-extrabold px-3 py-1 rounded-xl text-[10px] uppercase tracking-wider">
                            {p.category || 'Umum'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-medium">
                          <p className="text-slate-500 text-[10px]">Beli: {formatRupiah(p.buyPrice)}</p>
                          <p className="font-bold text-[#5F1E1E]">{formatRupiah(p.sellPrice)}</p>
                        </td>
                        <td className="py-3.5 px-5">
                          <p className={`text-sm font-black ${isLow ? 'text-red-600' : 'text-[#5F1E1E]'}`}>
                            {p.stockCount} <span className="text-[10px] font-normal text-slate-500">unit</span>
                          </p>
                          <p className="text-[9px] text-slate-400">Min. Stok: {p.minStock || 10}</p>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#B48328]"></span>
                            <span className="font-bold text-[#5F1E1E]">~{p.aiForecasterDays || 14} Hari lagi</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          {p.isDeadstock ? (
                            <span className="bg-[#E5C88B] text-[#5F1E1E] font-bold px-2.5 py-1 rounded-xl text-[9px] uppercase tracking-wider">
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
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(p)}
                              className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              + Restock
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2.5 py-1.5 rounded-xl text-[10px] transition-all active:scale-95 cursor-pointer"
                              title="Hapus Produk"
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
        )}
      </section>

      {/* MODAL TAMBAH BARANG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">Tambah Barang / Produk Baru</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sirup Marjan"
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold focus:outline-none"
                  value={newProduct.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Kode SKU (Tetap)</label>
                  <input
                    type="text"
                    readOnly
                    className="border-2 border-slate-200 bg-slate-100 text-slate-600 font-mono font-bold rounded-xl p-2.5 uppercase cursor-not-allowed"
                    value={newProduct.sku}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Kategori</label>
                  <select
                    value={isCustomCategory ? 'OTHER' : newProduct.category}
                    onChange={(e) => {
                      if (e.target.value === 'OTHER') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setNewProduct({ ...newProduct, category: e.target.value });
                      }
                    }}
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold focus:outline-none bg-white cursor-pointer"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="OTHER">+ Tambah Kategori Lainnya...</option>
                  </select>
                </div>
              </div>

              {isCustomCategory && (
                <div className="flex flex-col gap-1 bg-[#E8D3A7]/20 p-2.5 rounded-xl border border-[#B48328]/40">
                  <label className="font-bold text-[#5F1E1E] uppercase text-[10px]">Nama Kategori Baru</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama kategori baru..."
                    className="border-2 border-[#B48328] rounded-xl p-2 font-bold focus:outline-none bg-white text-xs"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold focus:outline-none"
                    value={newProduct.buyPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold focus:outline-none"
                    value={newProduct.sellPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Stok Awal (Unit)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold focus:outline-none"
                    value={newProduct.stockCount}
                    onChange={(e) => setNewProduct({ ...newProduct, stockCount: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5F1E1E] uppercase">Batas Stok Kritis</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="10"
                    className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold focus:outline-none"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5F1E1E] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow"
                >
                  Simpan Produk Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESTOCK */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
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
                <span className="text-[10px] font-mono text-slate-600">
                  SKU: {selectedProduct.sku} | Stok Fisik: {selectedProduct.stockCount} unit
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#5F1E1E] uppercase">Jumlah Tambah Stok</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Masukkan jumlah..."
                  className="border-2 border-[#B48328] rounded-xl p-3 text-sm font-bold text-center focus:outline-none"
                  value={editStockQty}
                  onChange={(e) => setEditStockQty(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5F1E1E] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow"
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