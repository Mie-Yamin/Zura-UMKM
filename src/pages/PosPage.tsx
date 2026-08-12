import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, getLocalCustomers, addTransaction } from '../api/client';
import type { Product, Customer, Transaction, TransactionItem } from '../types';

// Category color mappings for product cards
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Makanan': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Minuman': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Kebutuhan Harian': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

interface CartItem {
  product: Product;
  qty: number;
}

export default function PosPage() {
  const queryClient = useQueryClient();

  // Load products and customers using React Query or direct API
  const { data: inventoryData, isLoading: productsLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });

  const products = inventoryData?.products ?? [];
  const customers = useMemo(() => getLocalCustomers(), [inventoryData]); // read on mount/render

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedCustomerId, setSelectedCustomerId] = useState('cust-005'); // Default: Pelanggan Umum
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountInput, setDiscountInput] = useState(''); // input e.g. "10%" or "5000"
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Kartu'>('Tunai');
  const [cashPaidInput, setCashPaidInput] = useState('');
  
  // Modals / Alerts
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Filtered products list
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

  // 2. Cart actions
  const addToCart = (product: Product) => {
    if (product.stockCount <= 0) {
      showToast(`Stok ${product.name} telah habis!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stockCount) {
          showToast(`Stok ${product.name} tidak mencukupi untuk menambah item.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            // Check stock limits
            if (newQty > (item.product.stockCount ?? 0)) {
              showToast(`Stok ${item.product.name} tidak mencukupi.`);
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // 3. Calculation values
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.sellPrice || 0) * item.qty, 0);
  }, [cart]);

  const discountVal = useMemo(() => {
    if (!discountInput) return 0;
    if (discountInput.includes('%')) {
      const pct = parseFloat(discountInput.replace('%', ''));
      if (isNaN(pct) || pct <= 0) return 0;
      return Math.round((subtotal * Math.min(pct, 100)) / 100);
    } else {
      const nominal = parseFloat(discountInput.replace(/[^0-9]/g, ''));
      if (isNaN(nominal) || nominal <= 0) return 0;
      return Math.min(nominal, subtotal);
    }
  }, [discountInput, subtotal]);

  const total = Math.max(0, subtotal - discountVal);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) ?? customers[0];
  }, [customers, selectedCustomerId]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Tunai') return 0;
    const paid = parseFloat(cashPaidInput.replace(/[^0-9]/g, '')) || 0;
    return Math.max(0, paid - total);
  }, [cashPaidInput, total, paymentMethod]);

  const isCashInsufficient = useMemo(() => {
    if (paymentMethod !== 'Tunai') return false;
    const paid = parseFloat(cashPaidInput.replace(/[^0-9]/g, '')) || 0;
    return paid < total;
  }, [cashPaidInput, total, paymentMethod]);

  // 4. Quick Cash Helpers
  const handleQuickCash = (amount: number) => {
    setCashPaidInput(amount.toLocaleString('id-ID'));
  };

  // 5. Checkout execution
  const handleProcessTransaction = () => {
    if (cart.length === 0) {
      showToast('Keranjang belanja kosong!');
      return;
    }

    if (paymentMethod === 'Tunai') {
      const paid = parseFloat(cashPaidInput.replace(/[^0-9]/g, '')) || 0;
      if (paid < total) {
        showToast('Uang pembayaran tunai kurang!');
        return;
      }
    }

    // Build transaction object
    const trxId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const dateStr = now.toISOString().split('T')[0];

    const transactionItems: TransactionItem[] = cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      qty: item.qty,
      price: item.product.sellPrice || 0,
    }));

    const paidVal = paymentMethod === 'Tunai'
      ? parseFloat(cashPaidInput.replace(/[^0-9]/g, '')) || total
      : total;

    const changeVal = paymentMethod === 'Tunai'
      ? paidVal - total
      : 0;

    const newTrx: Transaction = {
      id: trxId,
      time: timeStr,
      date: dateStr,
      customer: selectedCustomer?.name || 'Pelanggan Umum',
      customerId: selectedCustomerId,
      amount: total,
      discountApplied: discountVal,
      paymentStatus: 'Lunas',
      stockStatus: 'Tersinkronisasi',
      items: transactionItems,
      paymentMethod,
      cashPaid: paidVal,
      changeGiven: changeVal,
    };

    // Save transaction and decrement stocks
    addTransaction(newTrx);

    // Refresh queries
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['kpi'] });

    // Open receipt modal
    setActiveReceipt(newTrx);
    showToast('Transaksi berhasil diproses!');
  };

  // Reset cart for next transaction
  const startNewTransaction = () => {
    setCart([]);
    setDiscountInput('');
    setCashPaidInput('');
    setActiveReceipt(null);
  };

  const formatRupiah = (val?: number) => {
    if (val === undefined) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-6 flex flex-col lg:flex-row gap-6 relative" aria-label="Halaman Kasir POS">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-sm gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── KIRI (2/3 LAYAR): Katalog Produk ─── */}
      <section className="flex-1 lg:w-2/3 flex flex-col gap-5">
        
        {/* Header POS */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Kasir / POS</h1>
            <p className="text-xs text-text-secondary mt-0.5">Pilih produk dan masukkan ke dalam keranjang untuk memproses checkout belanja.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="pos-search"
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
              placeholder="Cari SKU atau nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['Semua', 'Makanan', 'Minuman', 'Kebutuhan Harian'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-text-secondary hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        {productsLoading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-slate-400 text-sm">
            Memuat katalog produk...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 text-sm">
            Tidak ada produk ditemukan untuk kriteria pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const catStyles = CATEGORY_COLORS[p.category || 'Makanan'] || CATEGORY_COLORS['Makanan'];
              const isOut = p.stockCount <= 0;
              const isLow = p.stockCount > 0 && p.stockCount <= (p.minStock || 15);

              // Initials for visual card avatar
              const initials = p.name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              return (
                <button
                  key={p.id}
                  disabled={isOut}
                  onClick={() => addToCart(p)}
                  className={`bg-white border text-left rounded-xl p-4 flex flex-col justify-between h-56 transition-all duration-300 ${
                    isOut
                      ? 'border-slate-100 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-98'
                  }`}
                >
                  <div className="w-full flex flex-col gap-2.5">
                    {/* Visual Card Image Placeholder */}
                    <div className={`h-24 w-full rounded-lg ${catStyles.bg} ${catStyles.border} border flex items-center justify-center text-lg font-black tracking-widest ${catStyles.text}`}>
                      {initials}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold text-xs text-text-primary line-clamp-2 leading-tight">
                        {p.name}
                      </p>
                      <p className="text-[9px] font-mono text-text-secondary">{p.sku}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-50">
                    <p className="text-xs font-extrabold text-[#3B82F6]">
                      {formatRupiah(p.sellPrice)}
                    </p>
                    {isOut ? (
                      <span className="bg-red-50 text-red-600 border border-red-100 font-bold px-1.5 py-0.5 rounded text-[9px]">
                        Habis
                      </span>
                    ) : isLow ? (
                      <span className="bg-amber-50 text-[#F59E0B] border border-amber-100 font-bold px-1.5 py-0.5 rounded text-[9px] animate-pulse">
                        Kritis: {p.stockCount}
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-[#10B981] border border-emerald-100 font-bold px-1.5 py-0.5 rounded text-[9px]">
                        Stok: {p.stockCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── KANAN (1/3 LAYAR): Keranjang Belanja ─── */}
      <section className="w-full lg:w-1/3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[600px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
        <div className="flex flex-col gap-4">
          
          {/* Cart Header */}
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-primary">Keranjang Belanja</h2>
            <span className="bg-blue-50 text-[#3B82F6] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.qty, 0)} Item
            </span>
          </div>

          {/* Customer CRM Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Pilih Pelanggan (CRM):
            </label>
            <select
              aria-label="Pilih Pelanggan CRM"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.id !== 'cust-005' ? `(Tier: ${c.tier} | Poin: ${c.points})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Keranjang belanja masih kosong. Klik barang di katalog untuk menambahkan.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{item.product.name}</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">{formatRupiah(item.product.sellPrice)} / unit</p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, -1)}
                      className="w-5.5 h-5.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, 1)}
                      className="w-5.5 h-5.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-xs font-bold"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 hover:text-red-600 ml-1 p-1 hover:bg-red-50 rounded"
                      aria-label="Hapus item"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing breakdown & discounts */}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            
            {/* Discount input */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-secondary font-medium">Diskon:</span>
              <input
                id="pos-discount"
                type="text"
                className="w-24 px-2 py-1 text-xs text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                placeholder="Contoh: 10% / 5000"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
              />
            </div>

            {/* Price values */}
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Subtotal:</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-xs text-red-500">
                <span>Diskon Terpotong:</span>
                <span>-{formatRupiah(discountVal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-text-primary border-t border-slate-100 pt-2">
              <span>Total Tagihan:</span>
              <span className="text-[#3B82F6]">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Metode Pembayaran:</span>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {(['Tunai', 'QRIS', 'Kartu'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                    paymentMethod === method
                      ? 'bg-blue-50 border-[#3B82F6] text-[#3B82F6]'
                      : 'bg-white border-slate-200 text-text-secondary hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Tunai details block */}
          {paymentMethod === 'Tunai' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2 animate-fadeIn">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Uang Bayar Tunai:</span>
              <input
                id="pos-cash"
                type="text"
                className="w-full px-3 py-1.5 text-sm text-right font-mono font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                placeholder="0"
                value={cashPaidInput}
                onChange={(e) => setCashPaidInput(e.target.value)}
              />
              
              {/* Cash Quick Choices */}
              <div className="grid grid-cols-3 gap-1">
                {[subtotal - discountVal, 10000, 20000, 50000, 100000].map((amt) => {
                  if (amt <= 0) return null;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="bg-white border border-slate-200 text-[10px] font-semibold py-1 rounded text-center hover:bg-slate-100"
                    >
                      {amt === subtotal - discountVal ? 'Uang Pas' : formatRupiah(amt)}
                    </button>
                  );
                })}
              </div>

              {/* Change due summary */}
              {!isCashInsufficient && total > 0 && (
                <div className="flex justify-between items-center text-xs font-semibold text-text-primary mt-1 border-t border-slate-200 pt-2">
                  <span>Kembalian:</span>
                  <span className="text-emerald-600 font-extrabold text-sm">{formatRupiah(changeDue)}</span>
                </div>
              )}
              {isCashInsufficient && total > 0 && (
                <div className="text-[10px] font-bold text-red-500 text-right mt-1">
                  Uang masih kurang Rp {(total - (parseFloat(cashPaidInput.replace(/[^0-9]/g, '')) || 0)).toLocaleString('id-ID')}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Process transaction button */}
        <button
          type="button"
          disabled={cart.length === 0 || isCashInsufficient}
          onClick={handleProcessTransaction}
          className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow transition-all mt-6 ${
            cart.length === 0 || isCashInsufficient
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-[#3B82F6] hover:bg-blue-600 active:scale-95'
          }`}
        >
          Proses Transaksi
        </button>

      </section>

      {/* ─── MODAL STRUK PENJUALAN (RECEIPT) ─── */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            
            {/* Struk Content */}
            <div className="flex flex-col gap-4 border border-slate-200 p-4 rounded-xl bg-slate-50 font-mono text-xs text-text-primary select-text max-h-[450px] overflow-y-auto">
              
              {/* Receipt Header */}
              <div className="text-center flex flex-col gap-1 border-b border-dashed border-slate-300 pb-3">
                <h3 className="text-sm font-black tracking-widest text-[#3B82F6]">ZURA RETAIL</h3>
                <p className="text-[10px] text-text-secondary">Jl. Raya Digital No. 101, Bandung</p>
                <p className="text-[10px] text-text-secondary">Telp: 0812-3456-7890</p>
              </div>

              {/* Receipt Metadata */}
              <div className="flex flex-col gap-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Trx ID:</span>
                  <span className="font-bold">{activeReceipt.id}</span>
                </div>
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>Tanggal:</span>
                  <span>{activeReceipt.date} {activeReceipt.time}</span>
                </div>
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>Kasir:</span>
                  <span>Alex Carter</span>
                </div>
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>Pelanggan:</span>
                  <span>{activeReceipt.customer} {selectedCustomerId !== 'cust-005' ? `(${selectedCustomer?.tier})` : ''}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="flex flex-col gap-1.5 border-b border-dashed border-slate-300 pb-2">
                {activeReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-bold">{item.name}</span>
                    <div className="flex justify-between text-[10px] text-text-secondary">
                      <span>{item.qty} pcs x {formatRupiah(item.price)}</span>
                      <span>{formatRupiah(item.price * item.qty)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total calculations */}
              <div className="flex flex-col gap-1 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {activeReceipt.discountApplied > 0 && (
                  <div className="flex justify-between text-[10px] text-red-500">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(activeReceipt.discountApplied)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm">
                  <span>Total Bayar:</span>
                  <span>{formatRupiah(activeReceipt.amount)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span>{activeReceipt.paymentMethod}</span>
                </div>
                {activeReceipt.paymentMethod === 'Tunai' && (
                  <>
                    <div className="flex justify-between">
                      <span>Dibayar:</span>
                      <span>{formatRupiah(activeReceipt.cashPaid)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-600">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(activeReceipt.changeGiven)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="text-center border-t border-dashed border-slate-300 pt-3 mt-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-bold text-[#10B981]">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
                
                {/* Mock QR / Barcode */}
                <div className="w-full flex items-center justify-center p-2 bg-white border border-slate-200 rounded">
                  <div className="h-6 w-48 bg-gradient-to-r from-neutral-800 via-neutral-100 to-neutral-800 flex items-center justify-center text-[8px] font-bold tracking-widest text-transparent">
                    |||| | |||| || ||| || |||| | |||
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl text-xs transition-colors"
              >
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={startNewTransaction}
                className="flex-1 px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95"
              >
                Transaksi Baru
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
