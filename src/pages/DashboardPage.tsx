import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInventory,
  fetchKpiSummary,
  getLocalRecaps,
  getLocalCustomers,
  updateProduct,
} from "../api/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Product } from "../types";

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return "Rp 0";
  return `Rp ${val.toLocaleString("id-ID")}`;
};

// Warna asal TikTok Shop tetap Hitam (#000000) untuk diagram & grafik
const CHANNEL_COLORS: Record<string, string> = {
  Shopee: "#EE4D2D",
  Tokopedia: "#00AA5B",
  "TikTok Shop": "#000000", // Grafik & Bar tetap hitam
  Lainnya: "#5F1E1E",
};

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Load queries
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ["kpi"],
    queryFn: fetchKpiSummary,
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
  });

  // ─── FETCH ASYNC VIA USEQUERY (FIRESTORE & DEBUG LOGGING) ───
  const { data: rawRecaps = [] } = useQuery({
    queryKey: ["recaps"],
    queryFn: async () => {
      const res = await getLocalRecaps();

      console.log("=== ISI RAW DATA RECAPS ===", res);
      if (Array.isArray(res) && res.length > 0) {
        console.log("=== CONTOH ITEM PERTAMA ===", res[0]);
      }

      return Array.isArray(res) ? res : [];
    },
  });

  const { data: rawCustomers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await getLocalCustomers();
      return Array.isArray(res) ? res : [];
    },
  });

  // Pengaman bertipe Array murni
  const products = useMemo(() => {
    if (Array.isArray(inventoryData)) return inventoryData;
    if (inventoryData && Array.isArray((inventoryData as any).products)) {
      return (inventoryData as any).products;
    }
    return [];
  }, [inventoryData]);

  const recaps = useMemo(() => (Array.isArray(rawRecaps) ? rawRecaps : []), [rawRecaps]);
  const customers = useMemo(() => (Array.isArray(rawCustomers) ? rawCustomers : []), [rawCustomers]);

  // ─── STATE CABANG DINAMIS ──────────────────────────────────────────────────
  const [branches, setBranches] = useState([
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

  // 1. Calculations
  const metrics = useMemo(() => {
    const filteredRecaps =
      selectedBranch === "Semua Cabang"
        ? recaps
        : recaps.filter(
          (r) =>
            r?.source?.toLowerCase().includes(selectedBranch.toLowerCase()) ||
            selectedBranch
              .toLowerCase()
              .includes(r?.source?.toLowerCase() || ""),
        );

    const posRevenue = filteredRecaps.reduce(
      (sum, r) => sum + (r.totalAmount || 0),
      0,
    );
    const totalOmzet = posRevenue;
    const totalProfit = Math.round(totalOmzet * 0.428);

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

  // ─── TREN OMZET OMNICHANNEL ───
  const trendData = useMemo(() => {
    const timeSlots = [
      "08:00",
      "10:00",
      "12:00",
      "14:00",
      "16:00",
      "18:00",
      "20:00",
    ];

    const parseHour = (item: any): number | null => {
      const field = item.createdAt || item.timestamp || item.time;
      if (!field) return null;

      if (field instanceof Date) return field.getHours();
      if (typeof field === "object" && typeof field.toDate === "function") {
        return field.toDate().getHours();
      }

      const parsedDate = new Date(field);
      if (!isNaN(parsedDate.getTime()) && String(field).includes("T")) {
        return parsedDate.getHours();
      }

      if (typeof field === "string" && field.includes(":")) {
        const parts = field.split(":");
        const h = parseInt(parts[0].replace(/\D/g, ""), 10);
        return isNaN(h) ? null : h;
      }

      return null;
    };

    const hasAnyTime = recaps.some((r) => parseHour(r) !== null);

    if (hasAnyTime) {
      return timeSlots.map((jamSlot) => {
        const slotHour = parseInt(jamSlot.split(":")[0], 10);
        let shopeeSum = 0;
        let tokoSum = 0;
        let tiktokSum = 0;

        recaps.forEach((r) => {
          const itemHour = parseHour(r);
          if (itemHour !== null && itemHour >= slotHour && itemHour < slotHour + 2) {
            const amount = Number(r.totalAmount) || 0;
            if (r.source === "Shopee") shopeeSum += amount;
            else if (r.source === "Tokopedia") tokoSum += amount;
            else if (r.source === "TikTok Shop") tiktokSum += amount;
          }
        });

        return {
          jam: jamSlot,
          "Omzet Shopee": shopeeSum,
          "Omzet Tokopedia": tokoSum,
          "Omzet TikTok Shop": tiktokSum,
        };
      });
    }

    let totalShopee = 0;
    let totalTokopedia = 0;
    let totalTiktok = 0;

    recaps.forEach((r) => {
      const amount = Number(r.totalAmount) || 0;
      if (r.source === "Shopee") totalShopee += amount;
      else if (r.source === "Tokopedia") totalTokopedia += amount;
      else if (r.source === "TikTok Shop") totalTiktok += amount;
    });

    const weights = [0.05, 0.15, 0.25, 0.2, 0.15, 0.1, 0.1];

    return timeSlots.map((jamSlot, index) => {
      const weight = weights[index];
      return {
        jam: jamSlot,
        "Omzet Shopee": Math.round(totalShopee * weight),
        "Omzet Tokopedia": Math.round(totalTokopedia * weight),
        "Omzet TikTok Shop": Math.round(totalTiktok * weight),
      };
    });
  }, [recaps]);

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
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
        aria-label="Metrik Pemantauan"
      >
        <article className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[10px] sm:text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
              TOTAL OMZET
              <br />
              TERAKHIR
            </h3>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider flex-shrink-0">
              OMNICHANNEL
            </span>
          </div>
          <div className="mt-auto pt-4 flex flex-col gap-0.5">
            <span className="text-lg sm:text-xl font-extrabold text-[#B48328] leading-none">
              Rp
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#B48328] tracking-tight leading-none">
              {metrics.totalOmzet.toLocaleString("id-ID")}
            </span>
          </div>
        </article>

        <article className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[10px] sm:text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
              LABA BERSIH
              <br />
              ESTIMASI
            </h3>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider leading-tight text-center flex-shrink-0">
              {metrics.totalOmzet > 0
                ? `~${((metrics.totalProfit / metrics.totalOmzet) * 100).toFixed(0)}%`
                : "0%"}
              <br />
              MARGIN
            </span>
          </div>
          <div className="mt-auto pt-4 flex flex-col gap-0.5">
            <span className="text-lg sm:text-xl font-extrabold text-[#B48328] leading-none">
              Rp
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#B48328] tracking-tight leading-none">
              {metrics.totalProfit.toLocaleString("id-ID")}
            </span>
          </div>
        </article>

        <article className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[10px] sm:text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
              STATUS STOK
              <br />
              GUDANG PUSAT
            </h3>
            <span className="bg-[#E8D3A7] text-[#B91C1C] text-[9px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider leading-tight text-center flex-shrink-0">
              {metrics.kritisCount}
              <br />
              <span className="text-[7.5px]">KRITIS</span>
            </span>
          </div>
          <div className="mt-auto pt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#B48328] leading-none">
              {metrics.amanCount}
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-[#B48328] tracking-tight leading-none">
              SKU AMAN
            </span>
          </div>
        </article>
      </section>

      {/* ─── 2. GRAFIK KINERJA PENJUALAN ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Kiri: Line chart Tren Omzet Harian */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-transparent shadow-sm p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
              Tren Omzet Omnichannel ({selectedBranch})
            </h2>
            <p className="text-[10px] sm:text-xs font-medium text-[#B48328] mt-0.5">
              Kurva perbandingan performa harian Shopee, Tokopedia, dan TikTok Shop.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="jam"
                  tick={{ fontSize: 10, fill: "#5F1E1E", fontWeight: 600 }}
                />

                <YAxis
                  tick={{ fontSize: 10, fill: "#5F1E1E", fontWeight: 600 }}
                  tickFormatter={(val: number) => {
                    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} Jt`;
                    if (val >= 1_000) return `${(val / 1_000).toFixed(0)} Rb`;
                    return `${val}`;
                  }}
                />

                {/* TOOLTIP: KHUSUS TEKS TIKTOK SHOP DIUBAH KE WARNA PUTIH */}
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#5F1E1E] p-3 rounded-xl shadow-xl border border-white/10 text-white text-xs">
                          <p className="font-bold text-[#E8D3A7] mb-1">Rentang Jam {label}</p>
                          {payload.map((entry: any, index: number) => {
                            const isTiktok = entry.name === "Omzet TikTok Shop";
                            return (
                              <p
                                key={`item-${index}`}
                                className="font-semibold"
                                style={{
                                  // Jika TikTok Shop, paksakan teks berwarna putih murni (#FFFFFF)
                                  color: isTiktok ? "#FFFFFF" : entry.color,
                                }}
                              >
                                {entry.name}: Rp {Number(entry.value || 0).toLocaleString("id-ID")}
                              </p>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="Omzet Shopee"
                  stroke={CHANNEL_COLORS["Shopee"]}
                  strokeWidth={3}
                  dot={{ r: 4, fill: CHANNEL_COLORS["Shopee"] }}
                />
                <Line
                  type="monotone"
                  dataKey="Omzet Tokopedia"
                  stroke={CHANNEL_COLORS["Tokopedia"]}
                  strokeWidth={3}
                  dot={{ r: 4, fill: CHANNEL_COLORS["Tokopedia"] }}
                />
                <Line
                  type="monotone"
                  dataKey="Omzet TikTok Shop"
                  stroke={CHANNEL_COLORS["TikTok Shop"]} // Garis grafik tetap hitam
                  strokeWidth={3}
                  dot={{ r: 4, fill: CHANNEL_COLORS["TikTok Shop"] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kanan: Bar chart Distribusi Saluran Penjualan */}
        <div className="bg-white rounded-2xl border border-transparent shadow-sm p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
              KONTRIBUSI SALURAN MARKETPLACE
            </h2>
            <p className="text-[10px] sm:text-xs font-medium text-[#B48328] mt-0.5">
              Distribusi nominal omzet berdasarkan asal saluran transaksi.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelData}
                margin={{ top: 15, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.2}
                />

                <XAxis
                  dataKey="name"
                  stroke="#5F1E1E"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                />

                <YAxis
                  stroke="#5F1E1E"
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => {
                    if (value >= 1_000_000)
                      return `${(value / 1_000_000).toFixed(0)} Jt`;
                    if (value >= 1_000)
                      return `${(value / 1_000).toFixed(0)}rb`;
                    return `${value}`;
                  }}
                />

                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const val = payload[0].value as number;
                      return (
                        <div className="bg-[#5F1E1E] p-3 rounded-xl shadow-xl border border-white/10">
                          <p className="font-bold text-xs text-[#E8D3A7] mb-1">
                            {data.name}
                          </p>
                          <p className="text-xs font-semibold text-white">
                            Omzet : {formatRupiah(val)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Bar dataKey="Omzet" radius={[8, 8, 0, 0]} maxBarSize={36}>
                  {channelData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={CHANNEL_COLORS[entry.name] || "#5F1E1E"} // Batang diagram tetap hitam
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ─── 3. WIDGET STOCK WARNING UNDERSTOCK & DEADSTOCK ─── */}
      <section className="bg-white rounded-2xl border border-transparent shadow-sm p-4 sm:p-5 flex flex-col gap-3 md:gap-5">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
            Pusat Peringatan Pengadaan Stok (Gudang Utama)
          </h2>
          <p className="text-[10px] sm:text-xs font-medium text-[#B48328] mt-1">
            Daftar item berisiko out-of-stock (Understock) dan produk yang
            mengendap lama di gudang (Deadstock).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold text-[#B91C1C] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B91C1C] animate-ping"></span>
              PERINGATAN UNDERSTOCK (BUTUH RESTOCK SEGERA)
            </h3>

            <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
              {criticalAlerts.understock.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  Tidak ada produk understock.
                </div>
              ) : (
                criticalAlerts.understock.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 sm:p-4 rounded-xl border border-red-100 bg-red-50/20 text-xs flex justify-between items-center hover:border-red-200 transition-colors gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[#5F1E1E] text-xs sm:text-sm truncate">
                        {p.name}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">
                        Tersisa: {p.stockCount} unit | Sisa ~
                        {p.aiForecasterDays || 0} hari
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRestockItem(p)}
                      className="bg-[#5F1E1E] hover:bg-[#4a1717] text-white font-bold px-3.5 py-2.5 rounded-xl text-[10px] sm:text-[11px] shadow-sm transition-all active:scale-95 flex-shrink-0"
                    >
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              ITEM MENGENDAP (DEADSTOCK / LOW-MOVING)
            </h3>

            <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
              {criticalAlerts.deadstock.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  Tidak ada produk deadstock.
                </div>
              ) : (
                criticalAlerts.deadstock.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 sm:p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs flex justify-between items-center gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[#5F1E1E] text-xs sm:text-sm truncate">
                        {p.name}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">
                        SKU: {p.sku} | Stok: {p.stockCount} unit
                      </p>
                    </div>

                    <span className="bg-[#E5C88B] text-[#5F1E1E] border border-[#5F1E1E]/20 font-bold px-2.5 py-1.5 rounded-xl text-[8px] sm:text-[9px] uppercase tracking-wider text-center flex-shrink-0">
                      Diskon Promo
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MODAL: TAMBAH CABANG BARU ─── */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp font-dmsans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">
                Tambah Cabang / Gudang
              </h2>
              <button
                type="button"
                onClick={() => setIsAddBranchOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleAddBranchSubmit}
              className="flex flex-col gap-4 text-xs"
            >
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#5F1E1E] uppercase">
                  Nama Cabang / Marketplace Baru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang TikTok Surabaya"
                  className="border-2 border-[#B48328] rounded-xl p-3 text-xs text-[#5F1E1E] font-bold focus:outline-none"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow"
                >
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: QUICK RESTOCK ─── */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#5F1E1E]">
                Restock Item Cepat
              </h2>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleQuickRestockSubmit}
              className="flex flex-col gap-4 text-xs"
            >
              <div className="bg-slate-50 p-3 rounded-lg flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Produk
                </span>
                <span className="font-extrabold text-[#5F1E1E]">
                  {restockItem.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  Stok Saat Ini: {restockItem.stockCount} unit
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#5F1E1E] uppercase">
                  Jumlah Tambah Stok
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="border-2 border-[#B48328] rounded-xl p-3 text-xs text-[#5F1E1E] font-bold focus:outline-none"
                  value={quickRestockQty}
                  onChange={(e) => setQuickRestockQty(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-5 py-2.5 rounded-xl text-xs shadow"
                >
                  Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}