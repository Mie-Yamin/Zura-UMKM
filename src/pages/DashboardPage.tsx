import { useState, useMemo, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  updateProduct,
} from "../api/client";
import { useRecaps, useProducts } from "../hooks/useBusinessData";
import MetricCards from "../components/dashboard/MetricCards";
import SalesCharts from "../components/dashboard/SalesCharts";
import StockAlerts from "../components/dashboard/StockAlerts";
import AddBranchModal from "../components/dashboard/AddBranchModal";
import QuickRestockModal from "../components/dashboard/QuickRestockModal";
import type { Product } from "../types";

interface BranchOption {
  label: string;
  value: string;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Load queries terpusat (shared hooks)
  const { data: products = [] } = useProducts();

  const { data: recaps = [] } = useRecaps();

  // ─── STATE CABANG DINAMIS ──────────────────────────────────────────────────
  const [branches, setBranches] = useState<BranchOption[]>([
    { label: "SEMUA GUDANG/\nCABANG", value: "Semua Cabang" },
    { label: "GUDANG UTAMA", value: "Gudang Utama" },
    { label: "CABANG ONLINE\nSHOPEE", value: "Cabang Shopee" },
    { label: "CABANG ONLINE\nTOKOPEDIA", value: "Cabang Tokopedia" },
  ]);

  const [selectedBranch, setSelectedBranch] = useState("Semua Cabang");
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  // States Lainnya
  const [dateRange, setDateRange] = useState("30 Hari Terakhir");
  const [showCriticalPopover, setShowCriticalPopover] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Restock State
  const [restockItem, setRestockItem] = useState<Product | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState("50");

  const popoverRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Close popover ketika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowCriticalPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler Tambah Cabang Baru
  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const formattedLabel = newBranchName.trim().toUpperCase();
    const formattedValue = newBranchName.trim();

    const newBranchObj = {
      label: formattedLabel,
      value: formattedValue,
    };

    setBranches((prev) => [...prev, newBranchObj]);
    setSelectedBranch(formattedValue);
    setNewBranchName("");
    setIsAddBranchOpen(false);
    setIsBranchOpen(false);
    showToast(`Cabang "${formattedValue}" berhasil ditambahkan!`);
  };

  // ─── CALCULATIONS ──────────────────────────────────────────────────────────
  const filterByBranch = (items: typeof recaps) =>
    selectedBranch === "Semua Cabang"
      ? items
      : items.filter(
          (r) =>
            r?.source?.toLowerCase().includes(selectedBranch.toLowerCase()) ||
            selectedBranch
              .toLowerCase()
              .includes(r?.source?.toLowerCase() || ""),
        );

  // 1. Metrics
  const metrics = useMemo(() => {
    const filteredRecaps = filterByBranch(recaps);

    const posRevenue = filteredRecaps.reduce(
      (sum, r) => sum + (r.totalAmount || 0),
      0,
    );
    const totalOmzet = posRevenue;

    // HPP (Harga Pokok Penjualan) dihitung dari detail item rekap × harga beli produk.
    const cogs = filteredRecaps.reduce((sum, r) => {
      let itemsSum = 0;
      (r.items || []).forEach((it) => {
        const product = products.find((p) => p.id === it.id);
        if (product?.buyPrice && it.qty) {
          itemsSum += product.buyPrice * it.qty;
        }
      });
      return sum + itemsSum;
    }, 0);

    // Biaya admin platform marketplace dari rekap
    const adminFees = filteredRecaps.reduce(
      (sum, r) => sum + (Number(r.adminFee) || 0),
      0,
    );

    // Jika tidak ada detail item (impor tanpa rincian), gunakan estimasi empiris
    const hasItemDetail = filteredRecaps.some((r) => (r.items?.length ?? 0) > 0);
    const effectiveCogs = hasItemDetail
      ? Math.round(cogs + adminFees)
      : Math.round(totalOmzet * 0.572);

    const totalProfit = Math.max(0, Math.round(totalOmzet - effectiveCogs));

    const totalProducts = products.length;
    const lowStockItems = products.filter(
      (p) => (p.stockCount || 0) <= (p.minStock || 10),
    );
    const kritisCount = lowStockItems.length;
    const amanCount = totalProducts - kritisCount;

    return {
      totalOmzet,
      totalProfit,
      amanCount,
      kritisCount,
      lowStockItems,
    };
  }, [recaps, products, selectedBranch]);

  // Understock & Deadstock alerts
  const criticalAlerts = useMemo(() => {
    const understock = products.filter(
      (p) => (p.stockCount || 0) <= (p.minStock || 10),
    );
    const deadstock = products.filter((p) => p.isDeadstock === true);
    return { understock, deadstock };
  }, [products]);

  // Sales Channel distribution chart data
  const channelData = useMemo(() => {
    const shopeeSum = recaps
      .filter((r) => r.source === "Shopee")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const tokoSum = recaps
      .filter((r) => r.source === "Tokopedia")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const tiktokSum = recaps
      .filter((r) => r.source === "TikTok Shop")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const manualSum = recaps
      .filter((r) => r.source === "Manual" || r.source === "POS")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    if (selectedBranch === "Cabang Shopee") {
      return [{ name: "Shopee", Omzet: shopeeSum }];
    }
    if (selectedBranch === "Cabang Tokopedia") {
      return [{ name: "Tokopedia", Omzet: tokoSum }];
    }

    return [
      { name: "Shopee", Omzet: shopeeSum },
      { name: "Tokopedia", Omzet: tokoSum },
      { name: "TikTok Shop", Omzet: tiktokSum },
      { name: "Lainnya", Omzet: manualSum },
    ];
  }, [recaps, selectedBranch]);

  // ─── TREN OMZET OMNICHANNEL (MEMBACA TANGGAL INPUT USER) ───
  const trendData = useMemo(() => {
    const now = new Date();

    // Helper: Prioritaskan tanggal yang DIINPUT USER terlebih dahulu daripada time device (createdAt)
    const getTxDate = (item: any): Date | null => {
      // 1. Cek field input manual dari form rekap (misal: date, recapDate, tanggal, transactionDate)
      const manualDate = item.date || item.recapDate || item.tanggal || item.transactionDate;
      const field = manualDate || item.createdAt || item.timestamp || item.time;

      if (!field) return null;

      // Format Firestore Timestamp
      if (typeof field === "object" && typeof field.toDate === "function") {
        return field.toDate();
      }

      // Format JavaScript Date Object
      if (field instanceof Date) {
        return field;
      }

      // Format String (YYYY-MM-DD atau ISO String)
      if (typeof field === "string") {
        // Mencegah selisih timezone jam 00:00 UTC pada string "YYYY-MM-DD"
        if (field.length === 10 && field.includes("-")) {
          const [year, month, day] = field.split("-").map(Number);
          return new Date(year, month - 1, day);
        }
        const parsed = new Date(field);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      return null;
    };

    // Filter transaksi berdasarkan Cabang yang dipilih
    const filteredRecaps = filterByBranch(recaps);

    // MODE 1: PER MINGGU (Hari Ini / 7 Hari Terakhir)
    if (dateRange === "Hari Ini" || dateRange === "7 Hari Terakhir") {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

      // Membuat 7 slot hari ke belakang berdasarkan tanggal hari ini
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        // Reset waktu ke 00:00:00 agar perbandingan tanggal presisi
        d.setHours(0, 0, 0, 0);
        return {
          jam: days[d.getDay()],
          dateStr: d.toDateString(),
          "Omzet Shopee": 0,
          "Omzet Tokopedia": 0,
          "Omzet TikTok Shop": 0,
        };
      });

      filteredRecaps.forEach((r) => {
        const txDate = getTxDate(r);
        if (txDate) {
          // Normalisasi tanggal transaksi user ke 00:00:00
          const normalizedTxDate = new Date(txDate);
          normalizedTxDate.setHours(0, 0, 0, 0);

          const match = last7Days.find((d) => d.dateStr === normalizedTxDate.toDateString());
          if (match) {
            const amount = Number(r.totalAmount) || 0;
            if (r.source === "Shopee") match["Omzet Shopee"] += amount;
            else if (r.source === "Tokopedia") match["Omzet Tokopedia"] += amount;
            else if (r.source === "TikTok Shop") match["Omzet TikTok Shop"] += amount;
          }
        }
      });

      return last7Days;
    }

    // MODE 2: PER BULAN (30 Hari Terakhir / Kuartal Berjalan)
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlySlots = months.map((m, idx) => ({
      jam: m,
      monthIdx: idx,
      "Omzet Shopee": 0,
      "Omzet Tokopedia": 0,
      "Omzet TikTok Shop": 0,
    }));

    filteredRecaps.forEach((r) => {
      const txDate = getTxDate(r);
      // Membaca tahun dan bulan dari tanggal yang diinput user
      if (txDate && txDate.getFullYear() === now.getFullYear()) {
        const mIdx = txDate.getMonth();
        const amount = Number(r.totalAmount) || 0;
        if (r.source === "Shopee") monthlySlots[mIdx]["Omzet Shopee"] += amount;
        else if (r.source === "Tokopedia") monthlySlots[mIdx]["Omzet Tokopedia"] += amount;
        else if (r.source === "TikTok Shop") monthlySlots[mIdx]["Omzet TikTok Shop"] += amount;
      }
    });

    return monthlySlots;
  }, [recaps, dateRange, selectedBranch]);

  // Quick restock submit handler
  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    const qty = parseInt(quickRestockQty) || 0;
    if (qty <= 0) {
      showToast("Jumlah restock harus lebih dari 0!");
      return;
    }

    const updated: Product = {
      ...restockItem,
      stockCount: restockItem.stockCount + qty,
      status:
        restockItem.stockCount + qty <= (restockItem.minStock || 10)
          ? "low_stock"
          : "healthy",
    };

    await updateProduct(updated.id, updated);
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["kpi"] });
    setRestockItem(null);
    showToast(`Restock sukses! Stok ${updated.name} ditambah +${qty} unit.`);
  };

  // Komponen Tombol Indikator Emas
  const RenderCriticalButton = () => (
    <div className="relative shrink-0 self-start" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setShowCriticalPopover(!showCriticalPopover)}
        className="bg-[#B8860B] hover:bg-[#a07409] w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[18px] flex items-center justify-center transition-all active:scale-95 shadow-sm"
        title="Lihat Peringatan Stok Kritis"
      >
        <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#B91C1C]"></span>
      </button>

      {/* POPUP FLOATING STOK KRITIS */}
      {showCriticalPopover && (
        <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl border border-slate-100 z-50 flex flex-col gap-2.5 sm:gap-3 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-[#0F172A]">
              Stok Kritis Pusat
            </h3>
            <span className="bg-red-50 text-red-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
              {metrics.kritisCount} Peringatan
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
            {metrics.lowStockItems.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-4 font-semibold">
                Semua stok aman, tidak ada barang kritis!
              </p>
            ) : (
              metrics.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50/80 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-100 flex items-start gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"></span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Tersisa {item.stockCount} unit | Perkiraan sisa {item.aiForecasterDays || 0} hari
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0"
      aria-label="Dashboard Pemantauan Utama"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 text-sm gap-2 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
          {toastMessage}
        </div>
      )}

      {/* ─── HEADER UTAMA ─── */}
      <header className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border border-transparent shadow-sm flex flex-col gap-3 sm:gap-4 w-full relative">
        <div className="flex md:hidden items-start justify-between gap-2 w-full">
          <div className="flex-1 min-w-0 pr-1">
            <h1 className="text-base font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
              BUSINESS MONITORING COMMAND CENTER
            </h1>
            <p className="text-[10px] font-medium text-[#B48328] mt-1 leading-snug">
              Monitoring Operasional Terpadu, Rekap Inventaris Gedung Pusat, Dan Analisis Omzet Omnichannel
            </p>
          </div>
          <RenderCriticalButton />
        </div>

        <div className="hidden md:flex items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#5F1E1E] tracking-tight uppercase">
              BUSINESS MONITORING COMMAND CENTER
            </h1>
            <p className="text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
              Monitoring Operasional Terpadu, Rekap Inventaris Gedung Pusat, Dan
              Analisis Omzet Omnichannel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-end">
            <div className="relative w-auto">
              <button
                type="button"
                onClick={() => setIsBranchOpen(!isBranchOpen)}
                className="flex items-center justify-between gap-2 bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl px-3 py-2.5 text-[10px] font-bold tracking-wider leading-tight text-left focus:outline-none min-w-[145px]"
              >
                <span className="whitespace-pre-line">
                  {branches.find((b) => b.value === selectedBranch)?.label ||
                    selectedBranch}
                </span>
                <svg
                  className="w-4 h-4 stroke-[#5F1E1E] stroke-2 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M19 9l-7 7-7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isBranchOpen && (
                <div className="absolute left-0 mt-1 min-w-[170px] bg-white border-2 border-[#B48328] rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                  {branches.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedBranch(option.value);
                        setIsBranchOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-[10px] font-bold whitespace-pre-line border-b border-slate-100 last:border-none leading-tight transition-colors ${selectedBranch === option.value
                        ? "bg-[#E8D3A7]/50 text-[#5F1E1E]"
                        : "text-[#5F1E1E] hover:bg-[#E8D3A7]/30"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsAddBranchOpen(true)}
                    className="w-full text-left px-3 py-3 text-[10px] font-black text-white bg-[#5F1E1E] hover:bg-[#4a1717] transition-colors flex items-center justify-between gap-1"
                  >
                    <span>TAMBAH CABANG</span>
                    <span className="text-[12px] leading-none">+</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative w-auto">
              <select
                aria-label="Pilih Rentang Waktu"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl pl-3 pr-8 py-2.5 text-[10px] font-bold tracking-wider uppercase focus:outline-none cursor-pointer leading-tight"
              >
                <option value="Hari Ini">HARI INI</option>
                <option value="7 Hari Terakhir">7 HARI TERAKHIR</option>
                <option value="30 Hari Terakhir">30 HARI TERAKHIR</option>
                <option value="Kuartal Berjalan">KUARTAL BERJALAN</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5F1E1E]">
                <svg
                  className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 9l-7 7-7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            <RenderCriticalButton />
          </div>
        </div>

        <div className="flex md:hidden flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full mt-1">
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setIsBranchOpen(!isBranchOpen)}
              className="flex items-center justify-between gap-2 bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl px-3 py-2.5 text-[10px] font-bold tracking-wider leading-tight text-left focus:outline-none w-full"
            >
              <span className="whitespace-pre-line truncate">
                {branches.find((b) => b.value === selectedBranch)?.label ||
                  selectedBranch}
              </span>
              <svg
                className="w-4 h-4 stroke-[#5F1E1E] stroke-2 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M19 9l-7 7-7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isBranchOpen && (
              <div className="absolute left-0 mt-1 w-full bg-white border-2 border-[#B48328] rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                {branches.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(option.value);
                      setIsBranchOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-[10px] font-bold whitespace-pre-line border-b border-slate-100 last:border-none leading-tight transition-colors ${selectedBranch === option.value
                      ? "bg-[#E8D3A7]/50 text-[#5F1E1E]"
                      : "text-[#5F1E1E] hover:bg-[#E8D3A7]/30"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(true)}
                  className="w-full text-left px-3 py-3 text-[10px] font-black text-white bg-[#5F1E1E] hover:bg-[#4a1717] transition-colors flex items-center justify-between gap-1"
                >
                  <span>TAMBAH CABANG</span>
                  <span className="text-[12px] leading-none">+</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full">
            <select
              aria-label="Pilih Rentang Waktu"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full appearance-none bg-white border-2 border-[#B48328] text-[#5F1E1E] rounded-xl pl-3 pr-8 py-2.5 text-[10px] font-bold tracking-wider uppercase focus:outline-none cursor-pointer leading-tight"
            >
              <option value="Hari Ini">HARI INI</option>
              <option value="7 Hari Terakhir">7 HARI TERAKHIR</option>
              <option value="30 Hari Terakhir">30 HARI TERAKHIR</option>
              <option value="Kuartal Berjalan">KUARTAL BERJALAN</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5F1E1E]">
              <svg
                className="w-4 h-4 fill-current stroke-[#5F1E1E] stroke-2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 9l-7 7-7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* ─── 1. KARTU RINGKASAN METRIK ─── */}
      <MetricCards metrics={metrics} />

      {/* ─── 2. GRAFIK KINERJA PENJUALAN ─── */}
      <SalesCharts
        trendData={trendData}
        channelData={channelData}
        selectedBranch={selectedBranch}
      />

      {/* ─── 3. WIDGET STOCK WARNING UNDERSTOCK & DEADSTOCK ─── */}
      <StockAlerts
        understock={criticalAlerts.understock}
        deadstock={criticalAlerts.deadstock}
        onRestock={setRestockItem}
      />

      {/* ─── MODAL: TAMBAH CABANG BARU ─── */}
      <AddBranchModal
        open={isAddBranchOpen}
        value={newBranchName}
        onChange={setNewBranchName}
        onClose={() => setIsAddBranchOpen(false)}
        onSubmit={handleAddBranchSubmit}
      />

      {/* ─── MODAL: QUICK RESTOCK ─── */}
      {restockItem && (
        <QuickRestockModal
          item={restockItem}
          qty={quickRestockQty}
          onQtyChange={setQuickRestockQty}
          onClose={() => setRestockItem(null)}
          onSubmit={handleQuickRestockSubmit}
        />
      )}
    </div>
  );
}