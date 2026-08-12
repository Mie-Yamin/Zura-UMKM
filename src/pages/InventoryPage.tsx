import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, addProduct, updateProduct, getLocalProducts } from '../api/client';
import type { Product } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function InventoryPage() {
  const queryClient = useQueryClient();

  // Load inventory products
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });

  const products = inventoryData?.products ?? [];

  // Local state for modals & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal display states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editProductItem, setEditProductItem] = useState<Product | null>(null);
  const [restockProductItem, setRestockProductItem] = useState<Product | null>(null);

  // Form states for Add / Edit
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Makanan');
  const [formStockCount, setFormStockCount] = useState('0');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formBuyPrice, setFormBuyPrice] = useState('0');
  const [formSellPrice, setFormSellPrice] = useState('0');

  // Form states for quick restock
  const [restockQtyInput, setRestockQtyInput] = useState('50');

  // Import file state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Calculations
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.stockCount * (p.buyPrice || 0)), 0);
    const lowStockCount = products.filter((p) => p.stockCount <= (p.minStock || 10)).length;
    const deadstockCount = products.filter((p) => p.isDeadstock === true).length;

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      deadstockCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);



  // 2. Open Add Modal
  const handleOpenAddModal = () => {
    setFormSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormCategory('Makanan');
    setFormStockCount('50');
    setFormMinStock('15');
    setFormBuyPrice('5000');
    setFormSellPrice('7000');
    setShowAddModal(true);
  };

  // 3. Add product submission
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formSku.trim()) {
      showToast('Nama dan SKU wajib diisi!');
      return;
    }

    // Check SKU uniqueness
    const existing = products.find((p) => p.sku.toLowerCase() === formSku.toLowerCase());
    if (existing) {
      showToast('Kode SKU sudah terdaftar!');
      return;
    }

    const buyPrice = parseFloat(formBuyPrice) || 0;
    const sellPrice = parseFloat(formSellPrice) || 0;
    const stockCount = parseInt(formStockCount) || 0;
    const minStock = parseInt(formMinStock) || 0;

    const newProd: Product = {
      id: `prod-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formName,
      sku: formSku.toUpperCase(),
      category: formCategory,
      stockCount,
      minStock,
      buyPrice,
      sellPrice,
      aiForecasterDays: stockCount > 50 ? 15 : stockCount > 10 ? 8 : 3,
      status: stockCount <= minStock ? 'low_stock' : 'healthy',
      isDeadstock: false,
    };

    addProduct(newProd);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['kpi'] });
    setShowAddModal(false);
    showToast(`Produk ${newProd.name} berhasil ditambahkan!`);
  };

  // 4. Open Edit Modal
  const handleOpenEditModal = (p: Product) => {
    setEditProductItem(p);
    setFormSku(p.sku);
    setFormName(p.name);
    setFormCategory(p.category || 'Makanan');
    setFormStockCount(String(p.stockCount));
    setFormMinStock(String(p.minStock || 10));
    setFormBuyPrice(String(p.buyPrice || 0));
    setFormSellPrice(String(p.sellPrice || 0));
  };

  // 5. Edit product submission
  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductItem) return;

    if (!formName.trim()) {
      showToast('Nama produk wajib diisi!');
      return;
    }

    const buyPrice = parseFloat(formBuyPrice) || 0;
    const sellPrice = parseFloat(formSellPrice) || 0;
    const stockCount = parseInt(formStockCount) || 0;
    const minStock = parseInt(formMinStock) || 0;

    const updatedProd: Product = {
      ...editProductItem,
      name: formName,
      sku: formSku.toUpperCase(),
      category: formCategory,
      stockCount,
      minStock,
      buyPrice,
      sellPrice,
      status: stockCount <= minStock ? 'low_stock' : 'healthy',
    };

    updateProduct(updatedProd);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['kpi'] });
    setEditProductItem(null);
    showToast(`Produk ${updatedProd.name} berhasil diperbarui!`);
  };

  // 6. Quick Restock Submission
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductItem) return;

    const qtyToAdd = parseInt(restockQtyInput) || 0;
    if (qtyToAdd <= 0) {
      showToast('Jumlah restock harus lebih besar dari 0!');
      return;
    }

    const updatedProd: Product = {
      ...restockProductItem,
      stockCount: restockProductItem.stockCount + qtyToAdd,
      status: (restockProductItem.stockCount + qtyToAdd) <= (restockProductItem.minStock || 10) ? 'low_stock' : 'healthy',
    };

    updateProduct(updatedProd);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['kpi'] });
    setRestockProductItem(null);
    showToast(`Restock sukses! Stok ${updatedProd.name} ditambah +${qtyToAdd}.`);
  };

  // 7. Simulate Import Data
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Silakan pilih file CSV/Excel terlebih dahulu!');
      return;
    }

    setIsImporting(true);
    setTimeout(() => {
      // Add 3 mock imported products
      const newItems: Product[] = [
        {
          id: 'prod-imp-1',
          name: 'Indomie Ayam Bawang',
          sku: 'IMI-ABW-011',
          category: 'Makanan',
          stockCount: 150,
          minStock: 25,
          buyPrice: 2700,
          sellPrice: 3500,
          aiForecasterDays: 14,
          status: 'healthy',
        },
        {
          id: 'prod-imp-2',
          name: 'Kecap Manis ABC 135ml',
          sku: 'ABC-KCP-012',
          category: 'Kebutuhan Harian',
          stockCount: 60,
          minStock: 15,
          buyPrice: 6500,
          sellPrice: 8000,
          aiForecasterDays: 12,
          status: 'healthy',
        },
        {
          id: 'prod-imp-3',
          name: 'Roma Kelapa 300g',
          sku: 'RMA-KLP-013',
          category: 'Makanan',
          stockCount: 40,
          minStock: 12,
          buyPrice: 8500,
          sellPrice: 11000,
          aiForecasterDays: 9,
          status: 'healthy',
        },
      ];

      newItems.forEach((item) => addProduct(item));
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });

      setIsImporting(false);
      setShowImportModal(false);
      setImportFile(null);
      showToast('Berhasil mengimpor 3 produk baru dari template Excel!');
    }, 1500); // 1.5s simulated loading delay
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-6 flex flex-col gap-6" aria-label="Manajemen Inventaris">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-sm gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── BARIS ATAS: KONTROL INVENTARIS ─── */}
      <header className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Manajemen Stok & Inventaris</h1>
          <p className="text-xs text-text-secondary mt-0.5">Pantau status persediaan produk, kelola harga jual beli, dan prediksi pengadaan barang.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Barang
          </button>
          
          <button
            type="button"
            onClick={() => setShowBarcodeModal(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-text-secondary hover:text-text-primary font-semibold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Cetak Barcode
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-text-secondary hover:text-text-primary font-semibold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Data
          </button>
        </div>
      </header>

      {/* ─── KARTU RINGKASAN RINGKASAN METRIK INVENTARIS ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Ringkasan Inventaris">
        
        {/* Card 1: Total SKU */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Produk (SKU)</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{metrics.totalProducts} Item</h3>
            <span className="bg-blue-50 text-[#3B82F6] text-[10px] font-bold px-2 py-0.5 rounded">Aktif</span>
          </div>
        </article>

        {/* Card 2: Total Nilai Inventaris */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Nilai Inventaris</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{formatRupiah(metrics.totalValue)}</h3>
            <span className="text-[10px] text-text-secondary">Harga Beli × Stok</span>
          </div>
        </article>

        {/* Card 3: Barang Kritis */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Barang Kritis (Low Stock)</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{metrics.lowStockCount} Produk</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              metrics.lowStockCount > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-[#10B981]'
            }`}>
              {metrics.lowStockCount > 0 ? 'Butuh PO' : 'Aman'}
            </span>
          </div>
        </article>

        {/* Card 4: Barang Mati */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Barang Mati (Deadstock)</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{metrics.deadstockCount} Item</h3>
            <span className="bg-slate-50 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">Rendah Penjualan</span>
          </div>
        </article>

      </section>

      {/* ─── TABEL UTAMA STOK ─── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        
        {/* Filters and search in table */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          {/* Category Select Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            {['Semua', 'Makanan', 'Minuman', 'Kebutuhan Harian'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-100 text-[#3B82F6]'
                    : 'bg-white text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search table */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="inv-search"
              type="text"
              className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="Cari SKU atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>

        {/* Database Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Memuat data inventaris...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Tidak ada produk inventaris terdaftar.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse" role="table">
              <thead>
                <tr className="border-b border-slate-100 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-3">Kode SKU</th>
                  <th className="pb-3">Nama Produk</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3 text-right">Sisa Stok Fisik</th>
                  <th className="pb-3 text-right">Batas Min. Stok</th>
                  <th className="pb-3 text-right">Sisa Hari Stok (AI)</th>
                  <th className="pb-3 text-right font-mono">Harga Beli</th>
                  <th className="pb-3 text-right font-mono">Harga Jual</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stockCount <= (p.minStock || 10);
                  const isDead = p.isDeadstock === true;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-mono font-medium text-text-secondary">{p.sku}</td>
                      <td className="py-3 font-semibold text-text-primary">{p.name}</td>
                      <td className="py-3 text-text-secondary font-medium">{p.category || 'Makanan'}</td>
                      <td className={`py-3 text-right font-extrabold ${isLow ? 'text-red-600' : 'text-text-primary'}`}>
                        {p.stockCount} Unit
                      </td>
                      <td className="py-3 text-right text-text-secondary">{p.minStock || 10} Unit</td>
                      <td className="py-3 text-right font-bold text-violet-600">
                        🧠 {p.aiForecasterDays} Hari
                      </td>
                      <td className="py-3 text-right font-mono text-text-secondary">{formatRupiah(p.buyPrice || 0)}</td>
                      <td className="py-3 text-right font-mono font-bold text-text-primary">{formatRupiah(p.sellPrice || 0)}</td>
                      <td className="py-3">
                        {isDead ? (
                          <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            Deadstock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            Kritis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#10B981] border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-bold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestockProductItem(p)}
                            className="bg-slate-100 hover:bg-slate-200 text-text-primary px-2.5 py-1 rounded font-bold"
                          >
                            Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </section>

      {/* ─── MODAL: TAMBAH BARANG BARU ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-text-primary">Tambah Barang Baru</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddProductSubmit} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Kode SKU</label>
                  <input
                    type="text"
                    required
                    className="border border-slate-200 rounded-lg p-2 font-mono uppercase bg-slate-50 focus:bg-white focus:outline-none"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Kategori</label>
                  <select
                    className="border border-slate-200 rounded-lg p-2 font-semibold bg-white focus:outline-none"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Kebutuhan Harian">Kebutuhan Harian</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-text-secondary uppercase">Nama Barang</label>
                <input
                  type="text"
                  required
                  className="border border-slate-200 rounded-lg p-2 focus:outline-none"
                  placeholder="Contoh: Indomie Soto Lamongan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="border border-slate-200 rounded-lg p-2 focus:outline-none"
                    value={formStockCount}
                    onChange={(e) => setFormStockCount(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Min. Batas Stok</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="border border-slate-200 rounded-lg p-2 focus:outline-none"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Harga Beli (HPP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="border border-slate-200 rounded-lg p-2 font-mono text-right focus:outline-none"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Harga Jual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="border border-slate-200 rounded-lg p-2 font-mono text-right focus:outline-none"
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs mt-3 shadow"
              >
                Simpan Produk baru
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT PRODUK ─── */}
      {editProductItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-text-primary">Edit Produk</h2>
              <button
                type="button"
                onClick={() => setEditProductItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditProductSubmit} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Kode SKU</label>
                  <input
                    type="text"
                    disabled
                    className="border border-slate-200 rounded-lg p-2 font-mono uppercase bg-slate-100 cursor-not-allowed"
                    value={formSku}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Kategori</label>
                  <select
                    className="border border-slate-200 rounded-lg p-2 font-semibold bg-white focus:outline-none"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Kebutuhan Harian">Kebutuhan Harian</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-text-secondary uppercase">Nama Barang</label>
                <input
                  type="text"
                  required
                  className="border border-slate-200 rounded-lg p-2 focus:outline-none"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Stok</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="border border-slate-200 rounded-lg p-2 focus:outline-none"
                    value={formStockCount}
                    onChange={(e) => setFormStockCount(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Min. Batas Stok</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="border border-slate-200 rounded-lg p-2 focus:outline-none"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Harga Beli (HPP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="border border-slate-200 rounded-lg p-2 font-mono text-right focus:outline-none"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase">Harga Jual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="border border-slate-200 rounded-lg p-2 font-mono text-right focus:outline-none"
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs mt-3 shadow"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: QUICK RESTOCK ─── */}
      {restockProductItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-text-primary">Restock Cepat</h2>
              <button
                type="button"
                onClick={() => setRestockProductItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleRestockSubmit} className="flex flex-col gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary uppercase font-bold">Produk</span>
                <span className="font-bold text-text-primary text-sm">{restockProductItem.name}</span>
                <span className="text-[10px] font-mono text-text-secondary">Stok saat ini: {restockProductItem.stockCount} unit</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-text-secondary uppercase">Jumlah Penambahan Stok</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  value={restockQtyInput}
                  onChange={(e) => setRestockQtyInput(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1">
                {[10, 25, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRestockQtyInput(String(val))}
                    className="flex-1 border border-slate-200 py-1 hover:bg-slate-50 font-bold rounded"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs mt-2 shadow"
              >
                Tambah ke Persediaan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CETAK BARCODE ─── */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 11v3m8-8h-1m-15 0H3m13 4h.01M8 16h.01m-1-4h.01M9 12H9m12-4h.01M16 16h.01m-3-4h.01m-5 4h.01M6 16h.01m-2-4h.01m10-4h.01M10 16h.01M14 8h.01M10 8h.01" />
                </svg>
                Cetak Lembar Barcode SKU
              </h2>
              <button
                type="button"
                onClick={() => setShowBarcodeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Berikut pratinjau lembar stiker barcode siap cetak untuk pelabelan fisik produk di toko Anda.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[300px] overflow-y-auto grid grid-cols-2 gap-3">
              {products.map((p) => (
                <div key={p.id} className="bg-white p-3 border border-slate-200 rounded-lg flex flex-col items-center gap-1.5 text-center">
                  <span className="font-bold text-[10px] text-text-primary truncate w-full">{p.name}</span>
                  {/* Mock Barcode block */}
                  <div className="w-full h-8 bg-neutral-800 flex flex-col justify-end text-[7px] font-mono tracking-widest text-transparent relative overflow-hidden select-none">
                    |||| || || | |||| || | || |||| | ||
                  </div>
                  <span className="text-[8px] font-mono text-text-secondary">{p.sku}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowBarcodeModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl text-xs transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBarcodeModal(false);
                  showToast('Perintah cetak dikirim ke printer label!');
                }}
                className="flex-1 px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95"
              >
                Kirim ke Printer (Print)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: IMPORT DATA ─── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-text-primary">Impor Produk CSV/Excel</h2>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-4 text-xs">
              <p className="text-text-secondary leading-relaxed">
                Silakan pilih berkas spreadsheet Anda (`.csv`, `.xlsx`). Unggah berkas yang mengikuti format SKU, Kategori, Nama, Stok, MinStok, HargaBeli, dan HargaJual.
              </p>

              <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer relative bg-slate-50/50">
                <input
                  type="file"
                  accept=".csv,.xlsx"
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
                <span className="font-bold text-text-primary truncate max-w-full">
                  {importFile ? importFile.name : 'Pilih file CSV atau Excel'}
                </span>
                <span className="text-[10px] text-text-secondary">Maksimum ukuran 5 MB</span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="flex-1 px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95 flex justify-center items-center"
                >
                  {isImporting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Mulai Impor'
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
