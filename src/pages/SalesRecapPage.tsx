import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { importRecapsFromFile, deleteRecap, recordSaleWithBatch } from '../api/client';
import { useRecaps, useProducts } from '../hooks/useBusinessData';
import ChannelSummaryGrid from '../components/sales/ChannelSummaryGrid';
import WebhookDemoModal from '../components/sales/WebhookDemoModal';
import ImportModal from '../components/sales/ImportModal';
import ManualEntryModal from '../components/sales/ManualEntryModal';
import RecapDetailModal from '../components/sales/RecapDetailModal';
import type { SalesRecap } from '../types';

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

  // ─── AMBIL DATA FIRESTORE (SHARED HOOKS) ───
  const { data: recaps = [], isLoading: isLoadingRecaps } = useRecaps();

  const { data: products = [] } = useProducts();

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

  // SMART MAPPING & PREVIEW STATES UNTUK FILE UNKNOWN FORMAT
  const [parsedRawRows, setParsedRawRows] = useState<any[]>([]);
  const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);
  const [selectedNameHeader, setSelectedNameHeader] = useState<string>('');
  const [selectedQtyHeader, setSelectedQtyHeader] = useState<string>('');
  const [selectedPriceHeader, setSelectedPriceHeader] = useState<string>('');
  const [showMappingStep, setShowMappingStep] = useState(false);

  // Form Manual States
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemRows, setItemRows] = useState<DynamicItemRow[]>([{ productId: '', qty: '' }]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 💥 ─── MENGAMBIL DAFTAR NAMA SALURAN DINAMIS TERMASUK CUSTOM ─── 💥
  const dynamicSourcesList = useMemo(() => {
    const defaultSources = ['Shopee', 'TikTok Shop', 'Tokopedia', 'Manual'];
    const customSourcesFromRecaps = recaps
      .map((r) => r.source)
      .filter((src) => Boolean(src) && !defaultSources.includes(src));

    const uniqueCustom = Array.from(new Set<string>(customSourcesFromRecaps));
    return ['Semua', ...defaultSources, ...uniqueCustom];
  }, [recaps]);

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

  // LOGIKA MEMBACA SEMENTARA HEADER & BARIS EXCEL/CSV (STEP 1)
  const handleFileChange = (file: File) => {
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const parsedRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (parsedRows.length === 0) {
          showToast('Berkas CSV/Excel kosong!');
          return;
        }

        const headers = Object.keys(parsedRows[0] || {});
        setAvailableHeaders(headers);
        setParsedRawRows(parsedRows);

        // Auto-detect kolom terdekat
        const autoName = headers.find(h => /nama|product|item|barang/i.test(h)) || headers[0] || '';
        const autoQty = headers.find(h => /jumlah|qty|quantity|banyak/i.test(h)) || headers[1] || '';
        const autoPrice = headers.find(h => /harga|price|nominal|jual/i.test(h)) || headers[2] || '';

        setSelectedNameHeader(autoName);
        setSelectedQtyHeader(autoQty);
        setSelectedPriceHeader(autoPrice);

        setShowMappingStep(true);
      } catch (err) {
        console.error('Error reading file headers:', err);
        showToast('Gagal membaca struktur file Excel/CSV!');
      }
    };
    reader.readAsBinaryString(file);
  };

  // LOGIKA KONFIRMASI SIMPAN DATA HASIL MAPPING KE FIRESTORE (STEP 2)
  const handleConfirmImport = async () => {
    const finalSource = importSource === 'Custom' ? customImportSource.trim() : importSource;

    if (!finalSource) {
      showToast('Silakan isi nama saluran penjualan custom!');
      return;
    }

    if (parsedRawRows.length === 0) {
      showToast('Tidak ada data untuk diimpor!');
      return;
    }

    setIsImporting(true);

    try {
      let calculatedUnits = 0;
      let calculatedTotalNominal = 0;
      const importedItems: { id: string; name: string; qty: number; price: number }[] = [];

      parsedRawRows.forEach((row, index) => {
        const nameVal = row[selectedNameHeader] ? String(row[selectedNameHeader]).trim() : `Produk Impor #${index + 1}`;
        const qtyVal = Number(String(row[selectedQtyHeader] || 1).replace(/\D/g, '')) || 1;

        // Pencocokan cerdas dengan katalog inventaris jika harga di berkas kosong
        const matchedProduct = products.find(
          (p) => p.name.toLowerCase().trim() === nameVal.toLowerCase()
        );

        const rawPrice = row[selectedPriceHeader] !== undefined && row[selectedPriceHeader] !== ''
          ? Number(String(row[selectedPriceHeader]).replace(/\D/g, ''))
          : NaN;

        const priceVal = !isNaN(rawPrice) && rawPrice > 0
          ? rawPrice
          : (matchedProduct?.sellPrice || 0);

        calculatedUnits += qtyVal;
        calculatedTotalNominal += priceVal * qtyVal;

        importedItems.push({
          id: matchedProduct?.id || `PRD-IMP-${index + 1}`,
          name: nameVal,
          qty: qtyVal,
          price: priceVal,
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
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
      queryClient.invalidateQueries({ queryKey: ['restock-plan'] });

      setShowImportModal(false);
      setShowMappingStep(false);
      setImportFile(null);
      setParsedRawRows([]);
      setCustomImportSource('');
      showToast(`Berhasil mengimpor ${parsedRawRows.length} baris data! Total: ${calculatedUnits} unit.`);
    } catch (err) {
      console.error('Error importing mapped file:', err);
      showToast('Gagal menyimpan rekap hasil impor!');
    } finally {
      setIsImporting(false);
    }
  };

  // ─── LOGIKA SIMULASI WEBHOOK BAYANGAN (DEMO LOMBA / PENJURIAN) ───
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
    const itemPrice = randomProduct.sellPrice || 0;
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
      const updatedStock = randomProduct.stockCount - orderQty;
      await recordSaleWithBatch(simulatedRecap, [
        {
          productId: randomProduct.id,
          newStock: updatedStock,
          minStock: randomProduct.minStock,
        },
      ]);

      queryClient.invalidateQueries({ queryKey: ['recaps'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
      queryClient.invalidateQueries({ queryKey: ['restock-plan'] });

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
      const stockUpdates = recapItems.map((item) => {
        const targetProd = products.find((p) => p.id === item.id);
        const currentStock = targetProd ? targetProd.stockCount : item.qty;
        return {
          productId: item.id,
          newStock: currentStock - item.qty,
          minStock: targetProd?.minStock,
        };
      });

      await recordSaleWithBatch(manualRecap, stockUpdates);

      queryClient.invalidateQueries({ queryKey: ['recaps'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
      queryClient.invalidateQueries({ queryKey: ['restock-plan'] });

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

  const handleDeleteRecap = async (recapId: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen rekap ${recapId}?`)) {
      return;
    }

    try {
      await deleteRecap(recapId);
      queryClient.invalidateQueries({ queryKey: ['recaps'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
      queryClient.invalidateQueries({ queryKey: ['restock-plan'] });
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
            onClick={() => {
              setShowMappingStep(false);
              setImportFile(null);
              setParsedRawRows([]);
              setShowImportModal(true);
            }}
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
      <ChannelSummaryGrid recaps={recaps} />

      {/* TABEL REKAP */}
      <section className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3 md:gap-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase">Log Riwayat Unggahan Rekap & Opname</h2>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">

            {/* DROPDOWN FILTER DENGAN DAFTAR DINAMIS TERMASUK CUSTOM */}
            <select
              className="w-full sm:w-auto bg-white border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none uppercase min-h-[44px] cursor-pointer"
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
            >
              {dynamicSourcesList.map((src) => (
                <option key={src} value={src}>
                  {src === 'Semua' ? 'SEMUA SALURAN' : src.toUpperCase()}
                </option>
              ))}
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

      {/* ─── MODAL SIMULASI WEBHOOK EVENT-DRIVEN ─── */}
      {showWebhookDemoModal && (
        <WebhookDemoModal
          open={showWebhookDemoModal}
          isSimulating={isSimulating}
          onSimulate={handleExecuteWebhookDemo}
          onClose={() => setShowWebhookDemoModal(false)}
        />
      )}

      {/* ─── MODAL IMPOR REKAP DENGAN TEKS PETUNJUK INFORMASI & SMART COLUMN MAPPING ─── */}
      {showImportModal && (
        <ImportModal
          open={showImportModal}
          showMappingStep={showMappingStep}
          importDate={importDate}
          setImportDate={setImportDate}
          importSource={importSource}
          setImportSource={setImportSource}
          customImportSource={customImportSource}
          setCustomImportSource={setCustomImportSource}
          importFile={importFile}
          availableHeaders={availableHeaders}
          selectedNameHeader={selectedNameHeader}
          setSelectedNameHeader={setSelectedNameHeader}
          selectedQtyHeader={selectedQtyHeader}
          setSelectedQtyHeader={setSelectedQtyHeader}
          selectedPriceHeader={selectedPriceHeader}
          setSelectedPriceHeader={setSelectedPriceHeader}
          parsedRawRows={parsedRawRows}
          products={products}
          isImporting={isImporting}
          onDownloadTemplate={handleDownloadTemplate}
          onFileChange={handleFileChange}
          onBackToStep1={() => setShowMappingStep(false)}
          onConfirm={handleConfirmImport}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* MODAL INPUT PENJUALAN DYNAMIC ITEM ROWS */}
      {showManualModal && (
        <ManualEntryModal
          open={showManualModal}
          products={products}
          manualDate={manualDate}
          setManualDate={setManualDate}
          itemRows={itemRows}
          calculatedTotals={calculatedTotals}
          isSubmitting={isSubmittingManual}
          onRowChange={handleRowChange}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
          onSubmit={handleManualSubmit}
          onClose={() => setShowManualModal(false)}
        />
      )}

      {/* MODAL RINCIAN DETAIL REKAP */}
      <RecapDetailModal
        recap={activeDetailRecap}
        onClose={() => setActiveDetailRecap(null)}
      />

    </div>
  );
}