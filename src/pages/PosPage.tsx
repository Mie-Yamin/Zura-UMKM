import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInventory, getLocalCustomers, addTransaction } from '../api/client';
import type { Product, Transaction, TransactionItem } from '../types';

interface CartItem {
  product: Product;
  qty: number;
}

export default function PosPage() {
  const queryClient = useQueryClient();

  // Load products and customers
  const { data: inventoryData, isLoading: productsLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });

  const products = inventoryData?.products ?? [];
  const customers = useMemo(() => getLocalCustomers(), [inventoryData]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedCustomerId, setSelectedCustomerId] = useState('cust-005');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountInput, setDiscountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Kartu'>('Tunai');
  const [cashPaidInput, setCashPaidInput] = useState('');

  // Modals / Alerts
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const handleQuickCash = (amount: number) => {
    setCashPaidInput(amount.toLocaleString('id-ID'));
  };

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

    addTransaction(newTrx);

    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['kpi'] });

    setActiveReceipt(newTrx);
    showToast('Transaksi berhasil diproses!');
  };

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
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col lg:flex-row gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0" aria-label="Halaman Kasir POS">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── KIRI (2/3 LAYAR): Katalog Produk ─── */}
      <section className="flex-1 lg:w-2/3 flex flex-col gap-3 md:gap-5 w-full">

        {/* Header POS */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">Kasir / POS Zura</h1>
            <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">Pilih produk dan masukkan ke keranjang belanja.</p>
          </div>

          <div className="relative w-full md:w-80">
            <input
              id="pos-search"
              type="text"
              className="w-full bg-[#E8D3A7]/20 border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none placeholder-[#B48328]/70 min-h-[44px]"
              placeholder="Cari SKU atau nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-4 h-4 stroke-[#5F1E1E] stroke-2 absolute left-3 top-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Categories selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3">
          {['Semua', 'Makanan', 'Minuman', 'Kebutuhan Harian'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all whitespace-nowrap min-h-[44px] ${selectedCategory === cat
                ? 'bg-[#5F1E1E] border-[#5F1E1E] text-[#E8D3A7] shadow-sm'
                : 'bg-white border-[#B48328] text-[#5F1E1E] hover:bg-[#E8D3A7]/30'
                }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        {productsLoading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-[#5F1E1E] font-bold text-sm">
            Memuat katalog produk...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 bg-white border border-dashed border-[#B48328] rounded-2xl p-12 text-center text-slate-400 font-bold text-sm">
            Tidak ada produk ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((p) => {
              const isOut = p.stockCount <= 0;
              const isLow = p.stockCount > 0 && p.stockCount <= (p.minStock || 15);

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
                  className={`bg-white border text-left rounded-2xl p-4 flex flex-col justify-between h-56 transition-all duration-300 ${isOut
                    ? 'border-slate-200 opacity-60 cursor-not-allowed'
                    : 'border-transparent hover:border-[#B48328] hover:shadow-md active:scale-98'
                    }`}
                >
                  <div className="w-full flex flex-col gap-2.5">
                    <div className="h-24 w-full rounded-xl bg-[#E8D3A7]/40 border border-[#B48328]/30 flex items-center justify-center text-lg font-black tracking-widest text-[#5F1E1E]">
                      {initials}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <p className="font-extrabold text-xs text-[#5F1E1E] line-clamp-2 leading-tight">
                        {p.name}
                      </p>
                      <p className="text-[9px] font-mono font-bold text-slate-400">{p.sku}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-black text-[#B48328]">
                      {formatRupiah(p.sellPrice)}
                    </p>
                    {isOut ? (
                      <span className="bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase">
                        Habis
                      </span>
                    ) : isLow ? (
                      <span className="bg-amber-100 text-[#B48328] font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase animate-pulse">
                        Kritis: {p.stockCount}
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase">
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
      <section className="w-full lg:w-1/3 bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm flex flex-col justify-between min-h-[600px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
        <div className="flex flex-col gap-3 sm:gap-4">

          {/* Cart Header */}
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase">Keranjang Belanja</h2>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase">
              {cart.reduce((sum, item) => sum + item.qty, 0)} Item
            </span>
          </div>

          {/* Customer CRM Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-[#5F1E1E] uppercase tracking-wider">
              Pelanggan (CRM):
            </label>
            <select
              aria-label="Pilih Pelanggan CRM"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none min-h-[44px]"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.id !== 'cust-005' ? `(Tier: ${c.tier} | Poin: ${c.points})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                Keranjang belanja masih kosong.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-[#5F1E1E] truncate">{item.product.name}</p>
                    <p className="text-[10px] font-bold text-[#B48328] mt-0.5">{formatRupiah(item.product.sellPrice)} / unit</p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#5F1E1E] font-extrabold text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xs font-extrabold w-5 text-center text-[#5F1E1E]">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#5F1E1E] font-extrabold text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded-lg ml-1"
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

          {/* Pricing breakdown */}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-bold">Diskon:</span>
              <input
                id="pos-discount"
                type="text"
                className="w-28 px-2 py-2 text-xs text-right border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-lg focus:outline-none min-h-[36px]"
                placeholder="10% / 5000"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
              />
            </div>

            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Subtotal:</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-xs font-bold text-red-600">
                <span>Diskon Terpotong:</span>
                <span>-{formatRupiah(discountVal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-[#5F1E1E] border-t border-slate-100 pt-2">
              <span>Total Tagihan:</span>
              <span className="text-[#B48328]">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
            <span className="text-[10px] font-extrabold text-[#5F1E1E] uppercase tracking-wider">Metode Pembayaran:</span>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {(['Tunai', 'QRIS', 'Kartu'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold border-2 transition-colors min-h-[44px] ${paymentMethod === method
                    ? 'bg-[#5F1E1E] border-[#5F1E1E] text-[#E8D3A7]'
                    : 'bg-white border-[#B48328] text-[#5F1E1E] hover:bg-[#E8D3A7]/20'
                    }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Tunai details block */}
          {paymentMethod === 'Tunai' && (
            <div className="bg-[#E8D3A7]/20 border border-[#B48328]/30 rounded-2xl p-3.5 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-[#5F1E1E] uppercase tracking-wider">Uang Bayar Tunai:</span>
              <input
                id="pos-cash"
                type="text"
                className="w-full px-3 py-2.5 text-sm text-right font-mono font-bold border-2 border-[#B48328] text-[#5F1E1E] rounded-xl focus:outline-none min-h-[44px]"
                placeholder="0"
                value={cashPaidInput}
                onChange={(e) => setCashPaidInput(e.target.value)}
              />

              <div className="grid grid-cols-3 gap-1">
                {[subtotal - discountVal, 10000, 20000, 50000, 100000].map((amt) => {
                  if (amt <= 0) return null;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="bg-white border border-[#B48328] text-[#5F1E1E] text-[10px] font-bold py-1 rounded-lg text-center hover:bg-[#E8D3A7]/40"
                    >
                      {amt === subtotal - discountVal ? 'Uang Pas' : formatRupiah(amt)}
                    </button>
                  );
                })}
              </div>

              {!isCashInsufficient && total > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-[#5F1E1E] mt-1 border-t border-slate-200 pt-2">
                  <span>Kembalian:</span>
                  <span className="text-emerald-700 font-black text-sm">{formatRupiah(changeDue)}</span>
                </div>
              )}
              {isCashInsufficient && total > 0 && (
                <div className="text-[10px] font-bold text-red-600 text-right mt-1">
                  Uang kurang Rp {(total - (parseFloat(cashPaidInput.replace(/[^0-9]/g, '')) || 0)).toLocaleString('id-ID')}
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
          className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow transition-all mt-6 ${cart.length === 0 || isCashInsufficient
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] active:scale-95'
            }`}
        >
          Proses Transaksi
        </button>

      </section>

      {/* ─── MODAL STRUK PENJUALAN (RECEIPT) ─── */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">

            <div className="flex flex-col gap-4 border-2 border-[#B48328]/30 p-4 rounded-2xl bg-[#E8D3A7]/10 font-mono text-xs text-[#5F1E1E] max-h-[450px] overflow-y-auto">

              <div className="text-center flex flex-col gap-1 border-b border-dashed border-slate-300 pb-3">
                <h3 className="text-base font-black tracking-widest text-[#5F1E1E]">ZURA RETAIL</h3>
                <p className="text-[10px] font-sans font-bold text-[#B48328]">Business Command Center</p>
              </div>

              <div className="flex flex-col gap-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Trx ID:</span>
                  <span className="font-bold">{activeReceipt.id}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>Tanggal:</span>
                  <span>{activeReceipt.date} {activeReceipt.time}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>Pelanggan:</span>
                  <span>{activeReceipt.customer}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-b border-dashed border-slate-300 pb-2">
                {activeReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-bold">{item.name}</span>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>{item.qty} pcs x {formatRupiah(item.price)}</span>
                      <span>{formatRupiah(item.price * item.qty)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {activeReceipt.discountApplied > 0 && (
                  <div className="flex justify-between text-[10px] text-red-600 font-bold">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(activeReceipt.discountApplied)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-[#B48328]">
                  <span>Total Bayar:</span>
                  <span>{formatRupiah(activeReceipt.amount)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between font-bold">
                  <span>Metode:</span>
                  <span>{activeReceipt.paymentMethod}</span>
                </div>
                {activeReceipt.paymentMethod === 'Tunai' && (
                  <>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Dibayar:</span>
                      <span>{formatRupiah(activeReceipt.cashPaid)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-emerald-700">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(activeReceipt.changeGiven)}</span>
                    </div>
                  </>
                )}
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:flex-1 px-4 py-2.5 border-2 border-[#B48328] hover:bg-[#E8D3A7]/20 text-[#5F1E1E] font-bold rounded-xl text-xs min-h-[44px]"
              >
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={startNewTransaction}
                className="w-full sm:flex-1 px-4 py-2.5 bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold rounded-xl text-xs shadow min-h-[44px]"
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