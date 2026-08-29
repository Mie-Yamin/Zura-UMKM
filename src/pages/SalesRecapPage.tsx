import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { getLocalRecaps, addRecap, importRecapsFromFile, getLocalProducts, updateProduct, deleteRecap } from '../api/client';
import type { SalesRecap, Product } from '../types';

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

// Interface untuk Baris Item Dinamis Modal Manual
interface DynamicItemRow {
  productId: string;
  qty: number | '';
}

export default function SalesRecapPage() {
  const queryClient = useQueryClient();

  // ─── AMBIL DATA FIRESTORE VIA USEQUERY ───
  const { data: rawRecaps = [], isLoading: isLoadingRecaps } = useQuery({
    queryKey: ['recaps'],
    queryFn: async () => {
      const res = await getLocalRecaps();
      return Array.isArray(res) ? res : [];
    },
  });

  const { data: rawProducts = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await getLocalProducts();
      return Array.isArray(res) ? res : [];
    },
  });

  const recaps = useMemo(() => (Array.isArray(rawRecaps) ? rawRecaps : []), [rawRecaps]);
  const products = useMemo(() => (Array.isArray(rawProducts) ? rawProducts : []), [rawProducts]);

  // States Utama
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showWebhookDemoModal, setShowWebhookDemoModal] = useState(false);
  const [activeDetailRecap, setActiveDetailRecap] = useState<SalesRecap | null>(null);

  // Form Import States
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [importSource, setImportSource] = useState<string>('Shopee');
  const [customImportSource, setCustomImportSource] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Form Manual States
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemRows, setItemRows] = useState<DynamicItemRow[]>([{ productId: '', qty: '' }]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── UNDUH TEMPLATE EXCEL (.XLSX) RAPI ───
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Nama Produk": "Kripik Pisang Manis 200g",
        "Jumlah": 10,
        "Harga Jual": 15000,
        "Tanggal": "2026-08-29",
        "Saluran": "Shopee",
      },
      {
        "Nama Produk": "Teh Botol Melati 450ml",
        "Jumlah": 5,
        "Harga Jual": 5000,
        "Tanggal": "2026-08-29",
        "Saluran": "Shopee",
      },
      {
        "Nama Produk": "Mie Goreng Spesial",
        "Jumlah": 12,
        "Harga Jual": 3500,
        "Tanggal": "2026-08-29",
        "Saluran": "Shopee",
      },
      {
        "Nama Produk": "Kripik Singkong Balado",
        "Jumlah": 8,
        "Harga Jual": 12000,
        "Tanggal": "2026-08-29",
        "Saluran": "Shopee",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Rekap Penjualan");
    XLSX.writeFile(workbook, "template_rekap_penjualan_zura.xlsx");

    showToast("Template Excel (.xlsx) rapih berhasil diunduh!");
  };

  // 💥 ─── LOGIKA SIMULASI WEBHOOK BAYANGAN (DEMO LOMBA / PENJURIAN) ─── 💥
  const handleExecuteWebhookDemo = async (source: 'Shopee' | 'TikTok Shop' | 'Tokopedia') => {
    const availableProducts = products.filter((p) => p.stockCount > 0);

    if (availableProducts.length === 0) {
      showToast('⚠️ Tidak ada produk fisik yang stoknya tersisa untuk disimulasikan!');
      setShowWebhookDemoModal(false);
      return;
    }

    setIsSimulating(true);

    const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
    const orderQty = Math.min(Math.floor(1 + Math.random() * 3), randomProduct.stockCount);
    const itemPrice = randomProduct.sellPrice || 15000;
    const totalAmount = itemPrice * orderQty;
    const adminFee = Math.round(totalAmount * 0.05);

    const recapId = `RCP-HOOK-${Math.floor(1000 + Math.random() * 9000)}`;

    const simulatedRecap: SalesRecap = {
      id: recapId,
      date: new Date().toISOString().split('T')[0],
      source: source,
      unitsSold: orderQty,
      totalAmount: totalAmount,
      adminFee: adminFee,
      status: 'Tersinkronisasi',
      items: [
        {
          id: randomProduct.id,
          name: randomProduct.name,
          qty: orderQty,
          price: itemPrice,
        },
      ],
    };

    try {
      // 1. Simpan Rekap Penjualan Baru ke Firestore
      await addRecap(simulatedRecap);

      // 2. Potong Stok Produk Fisik di Firestore
      const updatedStock = randomProduct.stockCount - orderQty;
      const updatedProduct: Product = {
        ...randomProduct,
        stockCount: updatedStock,
        status: updatedStock <= (randomProduct.minStock || 10) ? 'low_stock' : 'healthy',
      };
      await updateProduct(updatedProduct.id, updatedProduct);

      // 3. Refresh UI Real-time
      queryClient.invalidateQueries({ queryKey: ['recaps'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });

      setShowWebhookDemoModal(false);
      showToast(`⚡ DEMO EVENT WEBHOOK! [${source}] Pesanan Baru: ${orderQty}x ${randomProduct.name} (Stok Otomatis Terpotong -${orderQty})`);
    } catch (err) {
      console.error('Simulasi Webhook gagal:', err);
      showToast('Gagal menjalankan simulasi webhook!');
    } finally {
      setIsSimulating(false);
    }
  };

  // ─── LOGIKA DYNAMIC ROWS (INPUT MANUAL) ───
  const handleAddRow = () => {
    setItemRows((prev) => [...prev, { productId: '', qty: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (itemRows.length === 1) return;
    setItemRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof DynamicItemRow, value: any) => {
    setItemRows((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const calculatedTotals = useMemo(() => {
    let totalUnits = 0;
    let totalNominal = 0;

    itemRows.forEach((row) => {
      const prod = products.find((p) => p.id === row.productId);
      const numericQty = typeof row.qty === 'number' ? row.qty : 0;
      if (prod && numericQty > 0) {
        totalUnits += numericQty;
        totalNominal += (prod.sellPrice || 0) * numericQty;
      }
    });

    return { totalUnits, totalNominal };
  }, [itemRows, products]);

  const filteredRecaps = useMemo(() => {
    return recaps.filter((r) => {
      const matchesSearch = (r.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.source || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = selectedSourceFilter === 'Semua' || r.source === selectedSourceFilter;
      return matchesSearch && matchesSource;
    });
  }, [recaps, searchQuery, selectedSourceFilter]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validRows = itemRows
      .map((r) => ({ ...r, qty: typeof r.qty === 'number' ? r.qty : 0 }))
      .filter((r) => r.productId !== '' && r.qty > 0);

    if (validRows.length === 0) {
      showToast('Pilih minimal 1 produk fisik dengan kuantitas lebih dari 0!');
      return;
    }

    for (const row of validRows) {
      const prod = products.find((p) => p.id === row.productId);
      if (prod && row.qty > prod.stockCount) {
        showToast(`Stok ${prod.name} tidak mencukupi! Tersisa: ${prod.stockCount}`);
        return;
      }
    }

    setIsSubmittingManual(true);

    const recapId = `RCP-MAN-${Math.floor(100 + Math.random() * 900)}`;

    const recapItems = validRows.map((row) => {
      const prod = products.find((p) => p.id === row.productId)!;
      return {
        id: prod.id,
        name: prod.name,
        qty: row.qty,
        price: prod.sellPrice || 0,
      };
    });

    const manualRecap: SalesRecap = {
      id: recapId,
      date: manualDate,
      source: 'Manual',
      unitsSold: calculatedTotals.totalUnits,
      totalAmount: calculatedTotals.totalNominal,
      adminFee: 0,
      status: 'Tersinkronisasi',
      items: recapItems,
    };

    try {
      await addRecap(manualRecap);

      for (const item of recapItems) {
        const targetProd = products.find((p) => p.id === item.id);
        if (targetProd) {
          const updatedStock = targetProd.stockCount - item.qty;
          const updatedProduct: Product = {
            ...targetProd,
            stockCount: updatedStock,
            status: updatedStock <= (targetProd.minStock || 10) ? 'low_stock' : 'healthy',
          };
          await updateProduct(updatedProduct.id, updatedProduct);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['recaps'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });

      setShowManualModal(false);
      setItemRows([{ productId: '', qty: '' }]);
      showToast('Penjualan Multi-Item berhasil disimpan & stok terpotong!');
    } catch (error) {
      console.error('Error saving recap to Firestore:', error);
      showToast('Gagal menyimpan transaksi ke Firestore!');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // ─── IMPORT FILE HANDLER (MEMBACA BERKAS CSV & EXCEL ASLI) ───
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalSource = importSource === 'Custom' ? customImportSource.trim() : importSource;

    if (!finalSource) {
      showToast('Silakan isi nama saluran penjualan custom!');
      return;
    }

    if (!importFile) {
      showToast('Silakan pilih berkas Excel/CSV rekap marketplace!');
      return;
    }

    setIsImporting(true);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const parsedRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (parsedRows.length === 0) {
          showToast('Berkas CSV/Excel kosong atau format tidak sesuai!');
          setIsImporting(false);
          return;
        }

        let calculatedUnits = 0;
        let calculatedTotalNominal = 0;
        const importedItems: { id: string; name: string; qty: number; price: number }[] = [];

        parsedRows.forEach((row, index) => {
          const productName =
            row['Nama Produk'] ||
            row['Nama Barang'] ||
            row['Product Name'] ||
            row['Item'] ||
            `Produk Impor #${index + 1}`;

          const qty =
            Number(row['Jumlah'] || row['Qty'] || row['Quantity'] || row['Jumlah Produk'] || 1) || 1;

          const rawPrice =
            row['Harga Jual'] || row['Harga'] || row['Price'] || row['Harga Satuan'] || 15000;

          const price = Number(String(rawPrice).replace(/\D/g, '')) || 15000;

          calculatedUnits += qty;
          calculatedTotalNominal += price * qty;

          importedItems.push({
            id: `PRD-IMP-${index + 1}`,
            name: String(productName),
            qty: qty,
            price: price,
          });
        });

        const calculatedAdminFee = Math.round(calculatedTotalNominal * 0.05);

        await importRecapsFromFile([
          {
            date: importDate,
            source: finalSource,
            unitsSold: calculatedUnits,
            totalAmount: calculatedTotalNominal,
            adminFee: calculatedAdminFee,
            status: 'Tersinkronisasi',
            items: importedItems,
          },
        ]);

        queryClient.invalidateQueries({ queryKey: ['recaps'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['kpi'] });

        setShowImportModal(false);
        setImportFile(null);
        setCustomImportSource('');
        showToast(
          `Berhasil membaca ${parsedRows.length} baris dari file ${importFile.name}! Total: ${calculatedUnits} unit.`
        );
      } catch (err) {
        console.error('Error parsing CSV/Excel:', err);
        showToast('Gagal membaca isi berkas CSV/Excel! Pastikan format file valid.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsBinaryString(importFile);
  };

  const handleDeleteRecap = async (recapId: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen rekap ${recapId}?`)) {
      return;
    }

    try {
      await deleteRecap(recapId);
      queryClient.invalidateQueries({ queryKey: ['recaps'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      showToast(`Dokumen rekap ${recapId} berhasil dihapus!`);
    } catch (err) {
      console.error('Gagal menghapus rekap:', err);
      showToast('Gagal menghapus dokumen rekap!');
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
            Rekap Penjualan & Input Data
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
            Impor laporan Excel/CSV berkala dari marketplace atau masukkan transaksi manual secara langsung.
          </p>
        </div>

        {/* TOMBOL AKSI TERMASUK DEMO WEBHOOK LOMBA */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {/* TOMBOL DEMO WEBHOOK DISAMARKAN & RAPI HANYA UNTUK PENJURIAN */}
          <button
            type="button"
            onClick={() => setShowWebhookDemoModal(true)}
            className="w-full sm:w-auto bg-[#F5EAD4] border border-[#B48328] hover:bg-[#E8D3A7] text-[#5F1E1E] font-extrabold px-3 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
            title="Klik untuk membuka penguji simulasi webhook event-driven"
          >
            <span>⚡</span>
            <span>Simulasi Webhook</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Impor Laporan Excel
          </button>

          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="w-full sm:w-auto bg-white border-2 border-[#B48328] hover:bg-[#E8D3A7]/20 text-[#5F1E1E] font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <svg className="w-4 h-4 stroke-[#5F1E1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Input Manual / Opname
          </button>
        </div>
      </header>

      {/* RINGKASAN SALURAN */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {['Shopee', 'Tokopedia', 'TikTok Shop', 'Manual'].map((src) => {
          const matchingRecaps = recaps.filter((r) => r.source === src);
          const totalUnits = matchingRecaps.reduce((sum, r) => sum + (r.unitsSold || 0), 0);
          const totalNominal = matchingRecaps.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
          const counts = matchingRecaps.length;

          return (
            <article key={src} className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase ${src === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' :
                  src === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' :
                    src === 'TikTok Shop' ? 'bg-neutral-900 text-white' :
                      'bg-[#5F1E1E] text-[#E8D3A7]'
                  }`}>
                  {src}
                </span>
                <h3 className="text-xl font-extrabold text-[#B48328] mt-3">{formatRupiah(totalNominal)}</h3>
              </div>
              <p className="text-[10px] font-bold text-[#5F1E1E] mt-2 flex justify-between">
                <span>{totalUnits} Unit Terjual</span>
                <span>{counts} Berkas Rekap</span>
              </p>
            </article>
          );
        })}
      </section>

      {/* TABEL REKAP */}
      <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3 md:gap-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase">Log Riwayat Unggahan Rekap & Opname</h2>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <select
              className="w-full sm:w-auto bg-white border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none uppercase min-h-[44px]"
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
            >
              <option value="Semua">Semua Saluran</option>
              <option value="Shopee">Shopee</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="Manual">Manual/Opname</option>
            </select>

            <input
              type="text"
              className="bg-[#E8D3A7]/20 border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none w-full md:w-48 placeholder-[#B48328]/70 min-h-[44px]"
              placeholder="Cari Kode Rekap..."
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
                <th className="py-3 px-4">Kode Rekap</th>
                <th className="py-3 px-4">Tanggal Rekap</th>
                <th className="py-3 px-4">Saluran Penjualan</th>
                <th className="py-3 px-4 text-right">Total Unit</th>
                <th className="py-3 px-4 text-right">Total Nominal</th>
                <th className="py-3 px-4 text-right">Biaya Admin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingRecaps ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#5F1E1E] font-bold animate-pulse">
                    Memuat data rekap...
                  </td>
                </tr>
              ) : filteredRecaps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                    Tidak ada data rekap yang cocok.
                  </td>
                </tr>
              ) : (
                filteredRecaps.map((r) => (
                  <tr key={r.id} className="hover:bg-[#E8D3A7]/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{r.id}</td>
                    <td className="py-3 px-4 font-bold text-[#5F1E1E]">{r.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold ${r.source === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' :
                        r.source === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' :
                          r.source === 'TikTok Shop' ? 'bg-neutral-900 text-white' :
                            'bg-[#5F1E1E] text-[#E8D3A7]'
                        }`}>
                        {r.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#5F1E1E]">{r.unitsSold} Unit</td>
                    <td className="py-3 px-4 text-right font-black text-[#B48328]">{formatRupiah(r.totalAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono text-red-600 font-bold">-{formatRupiah(r.adminFee)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-xl text-[10px]">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDetailRecap(r)}
                          className="text-[#5F1E1E] hover:underline font-extrabold"
                        >
                          Lihat Rincian
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecap(r.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 rounded-lg text-[10px] transition-colors"
                          title="Hapus Rekap Ini"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Stack Card */}
        <div className="block md:hidden flex flex-col gap-3">
          {isLoadingRecaps ? (
            <div className="text-center py-8 text-[#5F1E1E] font-bold text-xs animate-pulse">
              Memuat data rekap...
            </div>
          ) : filteredRecaps.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-bold text-xs">
              Tidak ada data rekap yang cocok.
            </div>
          ) : (
            filteredRecaps.map((r) => (
              <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="font-mono font-bold text-xs text-slate-500">{r.id}</span>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-xl text-[10px]">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                    {r.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Tanggal</p>
                    <p className="font-bold text-[#5F1E1E]">{r.date}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Saluran</p>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-xl text-[9px] font-bold ${r.source === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' :
                      r.source === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' :
                        r.source === 'TikTok Shop' ? 'bg-neutral-900 text-white' :
                          'bg-[#5F1E1E] text-[#E8D3A7]'
                      }`}>
                      {r.source}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Volume</p>
                    <p className="font-bold text-[#5F1E1E]">{r.unitsSold} Unit</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Total Nominal</p>
                    <p className="font-black text-[#B48328]">{formatRupiah(r.totalAmount)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteRecap(r.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1.5 px-3 rounded-lg"
                  >
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDetailRecap(r)}
                    className="text-[#5F1E1E] hover:underline font-extrabold text-xs py-1.5 px-3 hover:bg-[#E8D3A7]/20 rounded-lg"
                  >
                    Lihat Rincian
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ─── MODAL SIMULASI WEBHOOK EVENT-DRIVEN (INFORMASI PENJURIAN LOMBA) ─── */}
      {showWebhookDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-black text-[#5F1E1E] uppercase tracking-wide flex items-center gap-1.5">
                <span>⚡</span>
                <span>PENGUJI SIMULASI WEBHOOK (DEMO MODE)</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowWebhookDemoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* ALERT PENJELASAN UNTUK JURI */}
            <div className="bg-[#FFFDF9] border-2 border-[#B48328]/40 p-3.5 rounded-2xl flex flex-col gap-2 text-xs text-[#5F1E1E]">
              <span className="font-extrabold uppercase text-[10px] text-[#B48328]">
                📢 Catatan Pengujian Lomba:
              </span>
              <p className="text-[11px] leading-relaxed font-semibold text-slate-700">
                Fitur ini disediakan khusus untuk <strong className="text-[#5F1E1E]">Pengujian Penjurian / Lomba</strong> untuk mendemonstrasikan integrasi <strong className="text-[#5F1E1E]">Event-Driven Multi-Channel Sync</strong> secara <em>real-time</em> tanpa harus melakukan transaksi pembelian sungguhan di aplikasi marketplace.
              </p>
              <p className="text-[10px] text-slate-500 italic">
                Sistem akan berpura-pura menerima payload webhook pesanan, mencatat laporan, dan memotong stok fisik di Firestore secara otomatis.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase">
                PILIH SALURAN E-COMMERCE UNTUK DISIMULASIKAN:
              </span>

              {/* TOMBOL DENGAN LOGO GAMBAR DARI FOLDER PUBLIC */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Shopee */}
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleExecuteWebhookDemo('Shopee')}
                  className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#EE4D2D] font-black p-3 rounded-2xl text-xs transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center gap-2 group h-28"
                >
                  <div className="h-10 flex items-center justify-center">
                    <img
                      src="/shopee.png"
                      alt="Shopee Logo"
                      className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-[11px]">Shopee</span>
                </button>

                {/* TikTok Shop (Ukuran Diperbesar Khusus Logo Horizontal) */}
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleExecuteWebhookDemo('TikTok Shop')}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-neutral-900 font-black p-3 rounded-2xl text-xs transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center gap-2 group h-28"
                >
                  <div className="h-10 flex items-center justify-center w-full px-1">
                    <img
                      src="/tiktok.png"
                      alt="TikTok Logo"
                      className="w-full max-w-[80px] h-9 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-[11px]">TikTok Shop</span>
                </button>

                {/* Tokopedia */}
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleExecuteWebhookDemo('Tokopedia')}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#00AA5B] font-black p-3 rounded-2xl text-xs transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center gap-2 group h-28"
                >
                  <div className="h-10 flex items-center justify-center">
                    <img
                      src="/tokopedia.png"
                      alt="Tokopedia Logo"
                      className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-[11px]">Tokopedia</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWebhookDemoModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors mt-2"
            >
              Tutup Penguji
            </button>
          </div>
        </div>
      )}

      {/* MODAL IMPOR REKAP MARKETPLACE */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-[#5F1E1E] uppercase tracking-wide">IMPOR REKAP MARKETPLACE</h2>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* BOX CATATAN FORMAT KOLOM & TOMBOL UNDUH TEMPLATE .XLSX */}
            <div className="bg-[#E8D3A7]/20 border border-[#B48328]/40 p-3 rounded-2xl flex flex-col gap-2 text-[10px] text-[#5F1E1E]">
              <div className="flex justify-between items-center">
                <span className="font-extrabold uppercase">📌 Format Kolom Excel/CSV:</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-2 py-1 rounded-lg text-[9px] transition-colors flex items-center gap-1"
                >
                  <span>📥</span> Unduh Template
                </button>
              </div>
              <p className="leading-tight text-slate-600 font-medium">
                Pastikan file CSV/Excel memiliki header kolom: <strong className="text-[#5F1E1E]">Nama Produk</strong>, <strong className="text-[#5F1E1E]">Jumlah (Qty)</strong>, dan <strong className="text-[#5F1E1E]">Harga Jual</strong>.
              </p>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-extrabold text-[#5F1E1E] uppercase">TANGGAL REKAP</label>
                <input
                  type="date"
                  required
                  className="border-2 border-[#B48328] rounded-2xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-extrabold text-[#5F1E1E] uppercase">PILIH SALURAN ASAL BERKAS</label>
                <select
                  className="border-2 border-[#B48328] rounded-2xl p-2.5 font-bold text-[#5F1E1E] bg-[#FFFDF9] focus:outline-none cursor-pointer"
                  value={importSource}
                  onChange={(e) => setImportSource(e.target.value)}
                >
                  <option value="Shopee">Shopee Seller Center</option>
                  <option value="TikTok Shop">TikTok Shop Seller Center</option>
                  <option value="Tokopedia">Tokopedia Seller Center</option>
                  <option value="Custom">➕ Lainnya / Tambah Custom...</option>
                </select>

                {importSource === 'Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lazada, WhatsApp, atau Bazar"
                    className="border-2 border-[#B48328] rounded-2xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] animate-scaleUp mt-1"
                    value={customImportSource}
                    onChange={(e) => setCustomImportSource(e.target.value)}
                  />
                )}
              </div>

              <div className="border-2 border-dashed border-[#B48328] hover:bg-[#E8D3A7]/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#FFFDF9] relative transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                    }
                  }}
                />
                <span className="font-bold text-[#5F1E1E] truncate max-w-full text-center">
                  {importFile ? importFile.name : 'Pilih file ekspor laporan marketplace'}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold">Mendukung format .CSV atau .XLSX</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-black px-5 py-2.5 rounded-2xl shadow-md min-h-[44px] flex justify-center items-center active:scale-95 transition-all"
                >
                  {isImporting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Impor Laporan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT PENJUALAN DYNAMIC ITEM ROWS */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-[#5F1E1E] uppercase tracking-wide">
                INPUT PENJUALAN / OPNAME MANUAL
              </h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-extrabold text-[#5F1E1E] uppercase">TANGGAL REKAP</label>
                <input
                  type="date"
                  required
                  className="border-2 border-[#B48328] rounded-2xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>

              <div className="border-2 border-[#B48328] p-3.5 rounded-2xl bg-[#E8D3A7]/20 flex flex-col gap-3">
                <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase tracking-wider block">
                  POTONG STOK PUSAT (MULTI-ITEM):
                </span>

                <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {itemRows.map((row, index) => {
                    const selectedProd = products.find((p) => p.id === row.productId);
                    const numericQty = typeof row.qty === 'number' ? row.qty : 0;
                    const subtotal = (selectedProd?.sellPrice || 0) * numericQty;

                    return (
                      <div key={index} className="bg-white p-2.5 rounded-xl border border-[#B48328]/40 flex flex-col gap-2 shadow-sm">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-7 flex flex-col gap-0.5">
                            <label className="text-[9px] font-bold text-slate-500">Produk Fisik #{index + 1}</label>
                            <select
                              required
                              className="border border-[#B48328] rounded-lg p-1.5 font-bold text-[#5F1E1E] bg-white text-[10px] min-h-[32px] cursor-pointer truncate"
                              value={row.productId}
                              onChange={(e) => handleRowChange(index, 'productId', e.target.value)}
                            >
                              <option value="">-- Pilih Produk --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id} disabled={p.stockCount <= 0}>
                                  {p.name} {p.stockCount <= 0 ? '(HABIS)' : `(Stok: ${p.stockCount})`}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-3 flex flex-col gap-0.5">
                            <label className="text-[9px] font-bold text-slate-500">Qty</label>
                            <input
                              type="number"
                              min="1"
                              required
                              placeholder="0"
                              className="border border-[#B48328] rounded-lg p-1.5 w-full font-bold text-[#5F1E1E] text-[10px] min-h-[32px]"
                              value={row.qty}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleRowChange(index, 'qty', val === '' ? '' : parseInt(val) || 0);
                              }}
                            />
                          </div>

                          <div className="col-span-2 flex items-end justify-center pt-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(index)}
                              disabled={itemRows.length === 1}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${itemRows.length === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-red-600 hover:bg-red-50'
                                }`}
                              title="Hapus Baris"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {selectedProd && (
                          <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-1 text-slate-500 font-bold">
                            <span>Harga: {formatRupiah(selectedProd.sellPrice)} / unit</span>
                            <span className="text-[#5F1E1E]">Subtotal: {formatRupiah(subtotal)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full py-2 bg-white border-2 border-dashed border-[#B48328] hover:bg-[#E8D3A7]/30 text-[#5F1E1E] font-extrabold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 active:scale-98"
                >
                  <span>+</span>
                  <span>Tambah Produk Lain</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase">UNIT TERJUAL</label>
                  <input
                    type="number"
                    readOnly
                    className="border-2 border-[#B48328]/50 bg-slate-100 rounded-xl p-2.5 font-bold text-slate-600 focus:outline-none cursor-not-allowed"
                    value={calculatedTotals.totalUnits}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-extrabold text-[#5F1E1E] uppercase">TOTAL NOMINAL (RP)</label>
                  <input
                    type="text"
                    readOnly
                    className="border-2 border-[#B48328]/50 bg-slate-100 rounded-xl p-2.5 font-black font-mono text-[#B48328] focus:outline-none cursor-not-allowed"
                    value={formatRupiah(calculatedTotals.totalNominal)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual || calculatedTotals.totalUnits === 0}
                  className={`w-full sm:w-auto font-black px-6 py-2.5 rounded-xl text-xs shadow-md min-h-[44px] flex items-center justify-center transition-all ${calculatedTotals.totalUnits === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] active:scale-95'
                    }`}
                >
                  {isSubmittingManual ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Simpan Transaksi'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL RINCIAN DETAIL REKAP */}
      {activeDetailRecap && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">

            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-[#5F1E1E] uppercase tracking-wide">RINCIAN DOKUMEN REKAP</h3>
              <button
                type="button"
                onClick={() => setActiveDetailRecap(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">

              <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Kode Rekap</span>
                  <span className="font-bold font-mono text-[#5F1E1E] truncate">{activeDetailRecap.id}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Sumber Laporan</span>
                  <span className={`font-bold self-start mt-0.5 px-2.5 py-0.5 rounded-xl text-[10px] ${activeDetailRecap.source === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' :
                    activeDetailRecap.source === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' :
                      activeDetailRecap.source === 'TikTok Shop' ? 'bg-neutral-900 text-white' :
                        'bg-[#5F1E1E] text-[#E8D3A7]'
                    }`}>
                    {activeDetailRecap.source}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-[#E8D3A7]/20 p-2.5 rounded-2xl border border-[#B48328]/30">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Unit Terjual</p>
                  <p className="font-black text-[#5F1E1E] text-sm mt-0.5">{activeDetailRecap.unitsSold}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Bruto</p>
                  <p className="font-black text-[#B48328] text-sm mt-0.5">{formatRupiah(activeDetailRecap.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-red-600 font-bold uppercase">Potongan Fee</p>
                  <p className="font-black text-red-600 text-sm mt-0.5">-{formatRupiah(activeDetailRecap.adminFee)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase tracking-wider">
                  DETIL ITEM BARANG TERJUAL:
                </span>

                {activeDetailRecap.items && activeDetailRecap.items.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                    {activeDetailRecap.items.map((item, idx) => {
                      const itemSubtotal = (item.price || 0) * (item.qty || 1);
                      return (
                        <div key={idx} className="p-3 border-2 border-[#B48328]/30 rounded-2xl flex justify-between items-center bg-[#FFFDF9] shadow-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-[#5F1E1E] text-xs uppercase">{item.name}</span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {item.qty} unit × {formatRupiah(item.price)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-[#B48328] text-xs block">
                              {formatRupiah(itemSubtotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 border-2 border-[#B48328]/30 rounded-2xl bg-[#FFFDF9] flex justify-between items-center shadow-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-[#5F1E1E] text-xs uppercase">Produk Rekap {activeDetailRecap.source}</span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {activeDetailRecap.unitsSold} unit × {formatRupiah(Math.round(activeDetailRecap.totalAmount / (activeDetailRecap.unitsSold || 1)))}
                      </span>
                    </div>
                    <span className="font-black text-[#B48328] text-xs">
                      {formatRupiah(activeDetailRecap.totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveDetailRecap(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors mt-2 min-h-[44px]"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

    </div>
  );
}