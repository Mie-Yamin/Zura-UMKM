import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getLocalCustomers, getLocalTransactions, addCustomer } from '../api/client';
import type { Customer } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function CustomersPage() {
  const queryClient = useQueryClient();

  // Read state from localStorage
  const customers = useMemo(() => getLocalCustomers(), [queryClient]);
  const transactions = useMemo(() => getLocalTransactions(), [queryClient]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Calculations
  const metrics = useMemo(() => {
    const totalReg = customers.length;

    // Active this month
    const activeThisMonth = customers.filter(
      (c) => c.lastTxDate && c.lastTxDate.startsWith('2026-08') && c.id !== 'cust-005'
    ).length;

    // Average transaction amount per customer (excluding general/anonymous)
    const validCustomers = customers.filter((c) => c.id !== 'cust-005');
    const totalSpent = validCustomers.reduce((sum, c) => sum + c.totalTransactions, 0);
    const avgSpent = validCustomers.length > 0 ? totalSpent / validCustomers.length : 0;

    return {
      totalReg,
      activeThisMonth,
      avgSpent,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesQuery;
    });
  }, [customers, searchQuery]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filter transactions for selected customer
  const customerTransactions = useMemo(() => {
    if (!selectedCustomerId) return [];
    return transactions.filter((t) => t.customerId === selectedCustomerId);
  }, [transactions, selectedCustomerId]);

  // AI suggestions generator based on customer's shopping patterns
  const customerAiRecommendations = useMemo(() => {
    if (!selectedCustomer) return '';

    if (customerTransactions.length === 0) {
      return 'Pelanggan belum memiliki riwayat transaksi di toko ini. Rekomendasi AI: Kirimkan kode kupon sambutan diskon 10% untuk transaksi pertamanya.';
    }

    const purchasedItems: Record<string, number> = {};
    customerTransactions.forEach((t) => {
      t.items.forEach((item) => {
        purchasedItems[item.name] = (purchasedItems[item.name] || 0) + item.qty;
      });
    });

    const itemsList = Object.entries(purchasedItems).sort((a, b) => b[1] - a[1]);
    if (itemsList.length > 0) {
      const topItem = itemsList[0][0];

      if (topItem.toLowerCase().includes('indomie')) {
        return `Pelanggan ini adalah pembeli setia mie instan (${topItem}). Rekomendasi AI: Berikan penawaran paket bundling Indomie Goreng + Teh Botol Sosro dengan diskon kotor 8% di POS.`;
      }
      if (topItem.toLowerCase().includes('chitato') || topItem.toLowerCase().includes('beng')) {
        return `Pelanggan sering membeli camilan manis/asin (${topItem}). Rekomendasi AI: Tawarkan diskon khusus 15% untuk Chitato Sapi Panggang menjelang jam sibuk sore hari.`;
      }
      if (topItem.toLowerCase().includes('teh') || topItem.toLowerCase().includes('pocari')) {
        return `Pelanggan sangat menyukai minuman segar (${topItem}). Rekomendasi AI: Berikan promo 'Beli 3 Gratis 1' untuk semua produk minuman dingin selama bulan Agustus.`;
      }

      return `Pola pembelian menunjukkan ketertarikan tinggi pada kategori ${topItem}. Rekomendasi AI: Sarankan produk serupa saat checkout di mesin kasir POS.`;
    }

    return 'Pelanggan reguler. Rekomendasi AI: Tawarkan peningkatan loyalitas ke level Gold untuk mendapatkan bonus poin belanja 2x lipat.';
  }, [selectedCustomer, customerTransactions]);

  // 2. Submit new customer
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast('Nama pelanggan wajib diisi!');
      return;
    }

    const newCust: Customer = {
      id: `cust-${Math.floor(100 + Math.random() * 900)}`,
      name: formName,
      phone: formPhone || '-',
      email: formEmail || '-',
      points: 0,
      totalTransactions: 0,
      lastTxDate: '-',
      tier: 'Bronze',
    };

    addCustomer(newCust);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    setShowAddModal(false);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    showToast(`Pelanggan ${newCust.name} berhasil terdaftar!`);
  };

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-6 flex flex-col gap-6 font-dmsans" aria-label="Manajemen Pelanggan CRM">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER CRM ─── */}
      <header className="bg-white p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">Pelanggan & CRM Zura</h1>
          <p className="text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">Kelola data keanggotaan pelanggan, pantau tingkat loyalitas, dan pantau riwayat belanja member.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Daftarkan Pelanggan
          </button>
        </div>
      </header>

      {/* ─── KARTU RINGKASAN CRM (3 Kolom) ─── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Ringkasan CRM">

        {/* Card 1: Registered */}
        <article className="bg-white rounded-2xl p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[140px]">
          <p className="text-xs font-extrabold text-[#5F1E1E] uppercase tracking-wider">Total Pelanggan Terdaftar</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#B48328] tracking-tight">{metrics.totalReg} Profil</h3>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase">Database</span>
          </div>
        </article>

        {/* Card 2: Active */}
        <article className="bg-white rounded-2xl p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[140px]">
          <p className="text-xs font-extrabold text-[#5F1E1E] uppercase tracking-wider">Pelanggan Aktif Bulan Ini</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#5F1E1E] tracking-tight">{metrics.activeThisMonth} Member</h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-xl uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
              Agustus
            </span>
          </div>
        </article>

        {/* Card 3: Avg Transaction Value */}
        <article className="bg-white rounded-2xl p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[140px]">
          <p className="text-xs font-extrabold text-[#5F1E1E] uppercase tracking-wider">Rata-rata Nilai Transaksi</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#B48328] tracking-tight">{formatRupiah(metrics.avgSpent)}</h3>
            <span className="text-[10px] font-bold text-slate-400">/ Member</span>
          </div>
        </article>

      </section>

      {/* ─── BAGIAN UTAMA: DATABASE & DRAWER DETAIL ─── */}
      <section className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Kiri: Tabel Database */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-transparent shadow-sm p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">Database Member & Loyalitas</h2>

            {/* Search input */}
            <div className="relative w-full md:w-64">
              <input
                id="crm-search"
                type="text"
                className="w-full bg-[#E8D3A7]/20 border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none placeholder-[#B48328]/70"
                placeholder="Cari nama, HP, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="w-4 h-4 stroke-[#5F1E1E] stroke-2 absolute left-3 top-2" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse" role="table">
              <thead>
                <tr className="bg-[#5F1E1E] text-[#E8D3A7] uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">ID Member</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">No. HP / Email</th>
                  <th className="py-3 px-4 text-right">Poin Loyalitas</th>
                  <th className="py-3 px-4 text-right">Total Transaksi</th>
                  <th className="py-3 px-4">Belanja Terakhir</th>
                  <th className="py-3 px-4 text-center">Peringkat Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => {
                  const isSelected = c.id === selectedCustomerId;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(isSelected ? null : c.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#E8D3A7]/40 font-bold' : 'hover:bg-[#E8D3A7]/20'
                        }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{c.id}</td>
                      <td className="py-3 px-4 font-extrabold text-[#5F1E1E]">{c.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#5F1E1E]">{c.phone}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{c.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-[#B48328]">{c.points} Poin</td>
                      <td className="py-3 px-4 text-right font-black text-[#5F1E1E]">{formatRupiah(c.totalTransactions)}</td>
                      <td className="py-3 px-4 font-bold text-slate-500">{c.lastTxDate}</td>
                      <td className="py-3 px-4 text-center">
                        {c.tier === 'Gold' ? (
                          <span className="bg-[#E5C88B] text-[#5F1E1E] border border-[#5F1E1E]/20 px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold uppercase">
                            Gold
                          </span>
                        ) : c.tier === 'Silver' ? (
                          <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold uppercase">
                            Silver
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-[#B48328] border border-[#B48328]/30 px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold uppercase">
                            Bronze
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kanan: Drawer Detail */}
        {selectedCustomer && (
          <div className="w-full lg:w-96 bg-white rounded-2xl border border-transparent shadow-lg p-5 flex flex-col gap-4 animate-fadeIn flex-shrink-0 lg:sticky lg:top-6">

            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#5F1E1E] uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B48328]"></span>
                Profil Detail Pelanggan
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Profile Summary */}
            <div className="flex items-center gap-4 bg-[#E8D3A7]/30 p-4 rounded-2xl border border-[#B48328]/30">
              <div className="w-12 h-12 rounded-2xl bg-[#5F1E1E] text-[#E8D3A7] flex items-center justify-center font-black text-lg select-none">
                {selectedCustomer.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm text-[#5F1E1E] truncate">{selectedCustomer.name}</p>
                <span className={`inline-block mt-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-xl uppercase ${selectedCustomer.tier === 'Gold' ? 'bg-[#E5C88B] text-[#5F1E1E]' : selectedCustomer.tier === 'Silver' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-[#B48328]'
                  }`}>
                  Keanggotaan {selectedCustomer.tier}
                </span>
              </div>
            </div>

            {/* Contact details */}
            <div className="flex flex-col gap-2 text-xs border-b border-slate-100 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Nomor HP:</span>
                <span className="font-extrabold text-[#5F1E1E]">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Email:</span>
                <span className="font-extrabold text-[#5F1E1E]">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Loyalty Points:</span>
                <span className="font-black text-[#B48328]">{selectedCustomer.points} Poin</span>
              </div>
            </div>

            {/* AI Insights narrative */}
            <div className="bg-[#E8D3A7]/30 border border-[#B48328]/30 rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5F1E1E]"></span>
                <h4 className="text-[10px] font-black text-[#5F1E1E] uppercase tracking-wider">AI Insights Pola Belanja</h4>
              </div>
              <p className="text-xs font-medium text-[#5F1E1E] leading-relaxed">
                {customerAiRecommendations}
              </p>
            </div>

            {/* Transaction History in detail */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-[10px] font-extrabold text-[#5F1E1E] uppercase tracking-wider">Riwayat Belanja Member:</h4>

              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {customerTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">Belum ada transaksi terekam.</p>
                ) : (
                  customerTransactions.map((t) => (
                    <div key={t.id} className="p-3 border border-slate-100 bg-slate-50 rounded-xl flex flex-col gap-1 text-[11px]">
                      <div className="flex justify-between font-extrabold text-[#5F1E1E]">
                        <span>{t.id}</span>
                        <span className="text-[#B48328]">{formatRupiah(t.amount)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>{t.date} {t.time}</span>
                        <span className="bg-[#5F1E1E] text-[#E8D3A7] px-2 py-0.5 rounded-lg font-bold">{t.paymentMethod}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal italic">
                        Membeli: {t.items.map((i) => `${i.name} (${i.qty}x)`).join(', ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </section>

      {/* ─── MODAL: DAFTAR PELANGGAN BARU ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">Daftarkan Pelanggan Baru</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                  placeholder="Contoh: Budi Santoso"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Nomor Handphone</label>
                <input
                  type="tel"
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                  placeholder="Contoh: 0812XXXXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#5F1E1E] uppercase">Email</label>
                <input
                  type="email"
                  className="border-2 border-[#B48328] rounded-xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none"
                  placeholder="Contoh: budi@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}