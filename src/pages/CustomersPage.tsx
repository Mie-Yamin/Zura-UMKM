import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLocalCustomers, getLocalTransactions, addCustomer } from '../api/client';
import type { Customer, Transaction } from '../types';

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
    
    // Active this month (August 2026 -> lastTxDate starting with "2026-08")
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
      // Exclude anonymous/general from search result if needed or keep it
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

    // Check what products they purchased most
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
    queryClient.invalidateQueries({ queryKey: ['inventory'] }); // force refresh
    setShowAddModal(false);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    showToast(`Pelanggan ${newCust.name} berhasil terdaftar!`);
  };



  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-6 flex flex-col gap-6" aria-label="Manajemen Pelanggan CRM">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-sm gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── BARIS ATAS: KONTROL CRM ─── */}
      <header className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Pelanggan & CRM</h1>
          <p className="text-xs text-text-secondary mt-0.5">Kelola data keanggotaan pelanggan, pantau tingkat loyalitas, dan lihat riwayat belanja keaktifan mereka.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Daftarkan Pelanggan
          </button>
        </div>
      </header>

      {/* ─── KARTU RINGKASAN CRM ─── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Ringkasan CRM">
        
        {/* Card 1: Registered */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Pelanggan Terdaftar</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{metrics.totalReg} Profil</h3>
            <span className="bg-slate-50 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">Dalam Database</span>
          </div>
        </article>

        {/* Card 2: Active */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Pelanggan Aktif Bulan Ini</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{metrics.activeThisMonth} Pelanggan</h3>
            <span className="bg-emerald-50 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></span>
              Belanja di Agustus
            </span>
          </div>
        </article>

        {/* Card 3: Avg Transaction Value */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Rata-rata Nilai Transaksi</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{formatRupiah(metrics.avgSpent)}</h3>
            <span className="text-[10px] text-text-secondary">Per member terdaftar</span>
          </div>
        </article>

      </section>

      {/* ─── BAGIAN UTAMA: DATABASE & DRAWER DETAIL ─── */}
      <section className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Kiri: Tabel Database */}
        <div className="flex-1 w-full bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-text-primary">Database Member & Loyalitas</h2>
            
            {/* Search input */}
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="crm-search"
                type="text"
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                placeholder="Cari nama, HP, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse" role="table">
              <thead>
                <tr className="border-b border-slate-100 text-text-secondary uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-bold">ID Member</th>
                  <th className="pb-3 font-bold">Nama Lengkap</th>
                  <th className="pb-3 font-bold">No. Handphone / Email</th>
                  <th className="pb-3 font-bold text-right">Poin Loyalitas</th>
                  <th className="pb-3 font-bold text-right">Total Transaksi</th>
                  <th className="pb-3 font-bold">Belanja Terakhir</th>
                  <th className="pb-3 font-bold text-center">Peringkat Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => {
                  const isSelected = c.id === selectedCustomerId;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(isSelected ? null : c.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="py-3 font-mono font-medium text-text-secondary">{c.id}</td>
                      <td className="py-3 font-semibold text-text-primary">{c.name}</td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span>{c.phone}</span>
                          <span className="text-[10px] text-text-secondary">{c.email}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-extrabold text-[#3B82F6]">{c.points} Poin</td>
                      <td className="py-3 text-right font-bold text-text-primary">{formatRupiah(c.totalTransactions)}</td>
                      <td className="py-3 text-text-secondary">{c.lastTxDate}</td>
                      <td className="py-3 text-center">
                        {c.tier === 'Gold' ? (
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            Gold
                          </span>
                        ) : c.tier === 'Silver' ? (
                          <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            Silver
                          </span>
                        ) : (
                          <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-[10px] font-bold">
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

        {/* Kanan: Drawer Detail (Muncul saat baris diklik) */}
        {selectedCustomer && (
          <div className="w-full lg:w-96 bg-white rounded-xl border border-slate-200 shadow-lg p-5 flex flex-col gap-4 animate-fadeIn flex-shrink-0 lg:sticky lg:top-6">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                Profil Detail Pelanggan
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            {/* Profile Summary */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-lg select-none">
                {selectedCustomer.name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm text-text-primary truncate">{selectedCustomer.name}</p>
                <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded ${
                  selectedCustomer.tier === 'Gold' ? 'bg-amber-100 text-amber-800' : selectedCustomer.tier === 'Silver' ? 'bg-slate-100 text-slate-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  Keanggotaan {selectedCustomer.tier}
                </span>
              </div>
            </div>

            {/* Contact details */}
            <div className="flex flex-col gap-2 text-xs border-b border-slate-50 pb-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Nomor HP:</span>
                <span className="font-semibold text-text-primary">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Email:</span>
                <span className="font-semibold text-text-primary">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Loyalty Points:</span>
                <span className="font-bold text-[#3B82F6]">{selectedCustomer.points} Poin</span>
              </div>
            </div>

            {/* AI Insights narrative */}
            <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
                <h4 className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">AI Insights Pola Belanja</h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {customerAiRecommendations}
              </p>
            </div>

            {/* Transaction History in detail */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Riwayat Belanja Member:</h4>
              
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {customerTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada transaksi terekam.</p>
                ) : (
                  customerTransactions.map((t) => (
                    <div key={t.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-lg flex flex-col gap-1 text-[11px]">
                      <div className="flex justify-between font-bold text-text-primary">
                        <span>{t.id}</span>
                        <span>{formatRupiah(t.amount)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-text-secondary">
                        <span>{t.date} {t.time}</span>
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold">{t.paymentMethod}</span>
                      </div>
                      {/* Sub-item list */}
                      <p className="text-[10px] text-text-secondary mt-1 leading-normal italic">
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
              <h2 className="text-base font-bold text-text-primary">Daftarkan Pelanggan Baru</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddCustomerSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-text-secondary uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                  placeholder="Contoh: Budi Santoso"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-text-secondary uppercase">Nomor Handphone</label>
                <input
                  type="tel"
                  className="border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                  placeholder="Contoh: 0812XXXXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-text-secondary uppercase">Email</label>
                <input
                  type="email"
                  className="border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                  placeholder="Contoh: budi@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs mt-3 shadow"
              >
                Simpan Profil Pelanggan
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
