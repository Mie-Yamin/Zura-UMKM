import React, { useState, useMemo, useEffect } from "react";
import { fetchUserSettings, updateUserSettings } from "../api/client";
import { useRecaps, useProducts } from "../hooks/useBusinessData";
import { exportToExcel, exportToPdfPrint } from "../utils/exportHelpers";
import { readStoredJSON, writeStoredJSON, STORAGE_KEYS } from "../utils/storage";
import { generateFinanceInsights } from "../api/grokService";

const formatMessageText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx} className="font-extrabold text-[#5F1E1E]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <React.Fragment key={lineIdx}>
        {renderedLine}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const formatRupiah = (val?: number) => {
  if (val === undefined) return "Rp 0";
  return `Rp ${val.toLocaleString("id-ID")}`;
};

export default function FinancePage() {
  // ─── AMBIL DATA FIRESTORE SECARA ASYNC (SHARED HOOKS) ───
  const { data: recaps = [] } = useRecaps();

  const { data: products = [] } = useProducts();

  // States
  const [selectedPeriod, setSelectedPeriod] = useState<
    "3_bulan" | "6_bulan" | "1_tahun"
  >("6_bulan");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // State Beban Operasional (Sewa, Gaji, Listrik/Utilitas)
  const [operationalExpenses, setOperationalExpenses] = useState({
    sewa: 0,
    gaji: 0,
    listrik: 0,
  });
  const [showOpsModal, setShowOpsModal] = useState(false);
  const [inputSewa, setInputSewa] = useState("0");
  const [inputGaji, setInputGaji] = useState("0");
  const [inputListrik, setInputListrik] = useState("0");
  const [isSavingOps, setIsSavingOps] = useState(false);

  useEffect(() => {
    const savedOps = readStoredJSON<{ sewa: number; gaji: number; listrik: number } | null>(
      STORAGE_KEYS.OPERATIONAL_EXPENSES,
      null
    );
    if (savedOps) {
      setOperationalExpenses(savedOps);
    }

    fetchUserSettings().then((settings) => {
      if (settings && settings.operationalExpenses) {
        setOperationalExpenses(settings.operationalExpenses);
        writeStoredJSON(STORAGE_KEYS.OPERATIONAL_EXPENSES, settings.operationalExpenses);
      }
    });
  }, []);

  const handleOpenOpsModal = () => {
    setInputSewa(operationalExpenses.sewa.toString());
    setInputGaji(operationalExpenses.gaji.toString());
    setInputListrik(operationalExpenses.listrik.toString());
    setShowOpsModal(true);
  };

  const handleSaveOps = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOps(true);

    const newOps = {
      sewa: Number(inputSewa.replace(/\D/g, "")) || 0,
      gaji: Number(inputGaji.replace(/\D/g, "")) || 0,
      listrik: Number(inputListrik.replace(/\D/g, "")) || 0,
    };

    setOperationalExpenses(newOps);
    writeStoredJSON(STORAGE_KEYS.OPERATIONAL_EXPENSES, newOps);
    try {
      await updateUserSettings({ operationalExpenses: newOps });
      showToast("Beban operasional bulanan berhasil diperbarui!");
      setShowOpsModal(false);
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan beban operasional!");
    } finally {
      setIsSavingOps(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Calculate SaaS financial metrics (Purely from real recaps & products)
  const finances = useMemo(() => {
    const recapRevenue = recaps.reduce(
      (sum, r) => sum + (r.totalAmount || 0),
      0,
    );
    const recapAdminFee = recaps.reduce((sum, r) => sum + (r.adminFee || 0), 0);

    // HPP calculations
    let recapHpp = 0;
    recaps.forEach((r) => {
      if (r.items && r.items.length > 0) {
        r.items.forEach((item) => {
          const product = products.find((p) => p.id === item.id);
          const buyPrice = product?.buyPrice ?? item.price * 0.75; // fallback to 75% of sell price
          recapHpp += buyPrice * item.qty;
        });
      } else {
        recapHpp += (r.totalAmount || 0) * 0.7; // assume 70% HPP for recaps without item breakdown
      }
    });

    const sewa = operationalExpenses.sewa || 0;
    const gaji = operationalExpenses.gaji || 0;
    const listrik = operationalExpenses.listrik || 0;
    const baseOperational = sewa + gaji + listrik;

    const totalRevenue = recapRevenue;
    const totalHpp = recapHpp;
    const totalAdminFee = recapAdminFee;
    const totalExpenses = totalHpp + totalAdminFee + baseOperational;
    const netProfit = totalRevenue - totalExpenses;
    const cashflow = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalHpp,
      totalAdminFee,
      totalExpenses,
      netProfit,
      cashflow,
      sewa,
      gaji,
      listrik,
      operational: baseOperational,
    };
  }, [recaps, products]);

  // 2. Generate monthly cashflow comparison chart data (Dinamis sesuai data riil)
  const chartData = useMemo(() => {
    // Jika tidak ada data rekap, tampilkan tren 0
    const hasData = recaps.length > 0;
    const currentRevenue = finances.totalRevenue;
    const currentExpense = finances.totalExpenses;

    const data12Months = [
      { bulan: "Sep 25", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Okt 25", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Nov 25", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Des 25", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Jan 26", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Feb 26", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Mar 26", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Apr 26", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Mei 26", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Jun 26", Pemasukan: 0, Pengeluaran: 0 },
      { bulan: "Jul 26", Pemasukan: 0, Pengeluaran: 0 },
      {
        bulan: "Agu 26 (Kini)",
        Pemasukan: hasData ? currentRevenue : 0,
        Pengeluaran: hasData ? currentExpense : 0,
      },
    ];

    if (selectedPeriod === "3_bulan") {
      return data12Months.slice(-3);
    } else if (selectedPeriod === "6_bulan") {
      return data12Months.slice(-6);
    }
    return data12Months;
  }, [selectedPeriod, finances, recaps]);

  // 3. AI Financial Narrative Summary Generator (Dinamis dari Groq API)
  const { data: aiFinancialSummary, isLoading: loadingInsights } = useQuery({
    queryKey: ["ai-finance-summary", finances.totalRevenue, finances.netProfit, finances.totalExpenses],
    queryFn: () => generateFinanceInsights(finances),
    enabled: finances.totalRevenue > 0,
  });

  // 4. Excel/PDF Export Trigger
  const handleExport = (type: "Excel" | "PDF") => {
    setIsExporting(type);

    setTimeout(async () => {
      setIsExporting(null);

      if (type === "Excel") {
        const headers = ["Komponen Laporan Finansial", "Nominal (Rupiah)"];
        const rows = [
          ["1. Pendapatan Penjualan (Bruto)", finances.totalRevenue],
          ["   - Pendapatan Impor Rekap", finances.totalRevenue],
          ["2. Harga Pokok Penjualan (HPP)", -finances.totalHpp],
          ["3. Biaya Admin Platform Marketplace", -finances.totalAdminFee],
          [
            "LABA KOTOR",
            finances.totalRevenue - finances.totalHpp - finances.totalAdminFee,
          ],
          ["4. Beban Operasional Bulanan", -finances.operational],
          ["LABA BERSIH RIIL (NET PROFIT)", finances.netProfit],
        ];

        try {
          await exportToExcel("Laporan_Laba_Rugi_Zura", "Laba Rugi", headers, rows);
          showToast("Laporan Keuangan diekspor ke Excel (.xlsx)!");
        } catch (err) {
          console.error("Export Excel gagal:", err);
          showToast("Gagal mengekspor Excel. Silakan coba lagi.");
        }
      } else {
        exportToPdfPrint("Laporan Laba Rugi Omnichannel", "table-laba-rugi");
        showToast("Mengunduh dokumen PDF...");
      }
    }, 800);
  };

  return (
    <div
      className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-6 font-dmsans w-full max-w-full overflow-x-hidden min-w-0"
      aria-label="Laporan Keuangan Laba Rugi"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#5F1E1E] text-[#E8D3A7] px-4 py-3 rounded-xl shadow-xl border border-[#B48328] text-sm gap-2 animate-bounce font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          {toastMessage}
        </div>
      )}

      {/* Export Loader Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
            <span className="w-10 h-10 border-4 border-[#5F1E1E] border-t-transparent rounded-full animate-spin"></span>
            <div className="flex flex-col gap-1">
              <p className="font-extrabold text-[#5F1E1E] text-sm">
                Menyiapkan Berkas Laporan
              </p>
              <p className="text-xs text-[#B48328] font-bold">
                Sedang memproses pengeksporan berkas {isExporting}...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── HEADER FINANSIAL ─── */}
      <header className="bg-white p-4 sm:p-5 rounded-2xl border border-transparent shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">
            Laporan Keuangan & Laba Rugi
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#B48328] mt-1 leading-snug">
            Analisis margin operasional laba rugi riil, komisi admin platform
            marketplace, dan visualisasi arus kas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenOpsModal}
          className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer shrink-0"
        >
          <span>⚙️</span>
          <span>Atur Beban Operasional</span>
        </button>
      </header>

      {/* ─── KARTU METRIK UTAMA ─── */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"
        aria-label="Ringkasan Finansial"
      >
        {/* Pemasukan Kotor */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#5F1E1E] uppercase tracking-wider">
            Pemasukan Kotor (Bruto)
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-[#B48328] tracking-tight">
              {formatRupiah(finances.totalRevenue)}
            </h3>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[10px] font-bold px-2 py-0.5 rounded">
              Omzet
            </span>
          </div>
        </article>

        {/* Biaya Admin Platform */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#5F1E1E] uppercase tracking-wider">
            Biaya Admin Platform
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-[#EF4444] tracking-tight">
              -{formatRupiah(finances.totalAdminFee)}
            </h3>
            <span className="bg-red-50 text-[#EF4444] text-[10px] font-bold px-2 py-0.5 rounded">
              Fee Cuts
            </span>
          </div>
        </article>

        {/* Beban Operasional */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#5F1E1E] uppercase tracking-wider">
            Beban Operasional
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-[#5F1E1E] tracking-tight">
              {formatRupiah(finances.operational)}
            </h3>
            <span className="bg-[#E8D3A7]/50 text-[#5F1E1E] text-[10px] font-semibold px-2 py-0.5 rounded">
              Sewa + Gaji
            </span>
          </div>
        </article>

        {/* Laba Bersih Riil */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#5F1E1E] uppercase tracking-wider">
            Laba Bersih Riil
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-[#B48328] tracking-tight">
              {formatRupiah(finances.netProfit)}
            </h3>
            <span className="bg-[#E5C88B] text-[#5F1E1E] text-[10px] font-bold px-2 py-0.5 rounded border border-[#5F1E1E]/20">
              Estimasi Net
            </span>
          </div>
        </article>
      </section>

      {/* ─── TENGAH: GRAFIK TREN ARUS KAS & RANGKUMAN AI ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Kiri: Grafik Tren Arus Kas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-transparent shadow-sm p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-3 w-full">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
                Tren Arus Kas Bulanan (Cashflow)
              </h2>
              <p className="text-[10px] sm:text-xs font-medium text-[#B48328] mt-0.5">
                Komparasi Pemasukan kotor vs Pengeluaran total bulanan.
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex bg-[#E8D3A7]/30 border-2 border-[#B48328] rounded-xl p-0.5 w-full sm:w-auto justify-center">
              {(["3_bulan", "6_bulan", "1_tahun"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${selectedPeriod === period
                    ? "bg-[#5F1E1E] text-[#E8D3A7] shadow-sm"
                    : "text-[#5F1E1E] hover:bg-[#E8D3A7]/50"
                    }`}
                >
                  {period === "3_bulan"
                    ? "3 Bulan"
                    : period === "6_bulan"
                      ? "6 Bulan"
                      : "1 Tahun"}
                </button>
              ))}
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  dataKey="bulan"
                  tick={{ fontSize: 10, fill: "#5F1E1E", fontWeight: 600 }}
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
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#5F1E1E] p-3 rounded-xl shadow-2xl border border-[#B48328]/40 text-xs">
                          <p className="font-extrabold text-[#E8D3A7] mb-1.5 pb-1 border-b border-white/10">
                            {label}
                          </p>
                          <div className="flex flex-col gap-1">
                            {payload.map((entry: any, index: number) => (
                              <div
                                key={`item-${index}`}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="font-medium text-white/90">
                                  {entry.name}:
                                </span>
                                <span className="font-extrabold text-[#E8D3A7]">
                                  {formatRupiah(entry.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                <Line
                  type="monotone"
                  dataKey="Pemasukan"
                  name="Pemasukan Kotor (Bruto)"
                  stroke="#B48328"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#B48328" }}
                />
                <Line
                  type="monotone"
                  dataKey="Pengeluaran"
                  name="Pengeluaran Total (HPP + Ops + Fee)"
                  stroke="#5F1E1E"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#5F1E1E" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kanan: AI Summary Narrative */}
        <div className="bg-white rounded-2xl border border-transparent shadow-sm p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B48328] animate-pulse"></span>
              Rangkuman Finansial AI
            </h2>
            <p className="text-[10px] sm:text-xs font-medium text-[#B48328] mt-0.5">
              Analisis kesehatan operasional dari asisten kecerdasan buatan.
            </p>
          </div>

          <div className="bg-[#E8D3A7]/30 border border-[#B48328]/30 rounded-2xl p-5 flex flex-col gap-3">
            {loadingInsights ? (
              <div className="flex flex-col gap-2 animate-pulse py-2">
                <div className="h-4 bg-slate-200/50 rounded-lg w-full"></div>
                <div className="h-4 bg-slate-200/50 rounded-lg w-5/6"></div>
                <div className="h-4 bg-slate-200/50 rounded-lg w-4/5"></div>
              </div>
            ) : (
              <p className="text-xs font-medium text-[#5F1E1E] leading-relaxed">
                {aiFinancialSummary ? formatMessageText(aiFinancialSummary) : (
                  "Belum ada data transaksi yang tercatat. AI akan memberikan analisis kesehatan finansial setelah Anda mengunggah atau memasukkan laporan rekap penjualan."
                )}
              </p>
            )}
            <div className="border-t border-[#B48328]/30 pt-3 flex justify-between text-xs font-extrabold text-[#5F1E1E]">
              <span>Rasio Net Profit Margin:</span>
              <span className="text-[#B48328]">
                {finances.totalRevenue > 0
                  ? `${((finances.netProfit / finances.totalRevenue) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BAWAH: RINCIAN LABA RUGI & EKSPOR ─── */}
      <section className="bg-white rounded-2xl border border-transparent shadow-sm p-4 sm:p-5 flex flex-col gap-4 w-full">
        {/* Table Header with Active Exports */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-3 w-full">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
              Laporan Rincian Laba / Rugi Omnichannel
            </h2>
            <p className="text-[10px] sm:text-xs font-medium text-[#B48328] mt-0.5">
              Komponen rincian pendapatan kotor, pengeluaran, HPP, komisi
              platform, dan keuntungan bersih.
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleExport("Excel")}
              className="w-full sm:w-auto bg-white border-2 border-[#B48328] hover:bg-[#E8D3A7]/20 text-[#5F1E1E] font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <svg
                className="w-3.5 h-3.5 stroke-[#5F1E1E]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Ekspor Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport("PDF")}
              className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Ekspor PDF / Cetak
            </button>
          </div>
        </div>

        {/* Laba Rugi Table*/}
        <div className="max-w-xl mx-auto w-full overflow-x-auto -mx-3 px-3">
          <table
            id="table-laba-rugi"
            className="w-full text-left text-xs border-collapse font-bold text-[#5F1E1E]"
            role="table"
          >
            <tbody className="divide-y divide-slate-100">
              {/* 1. Pendapatan */}
              <tr>
                <td className="py-3 font-extrabold text-sm text-[#5F1E1E]">
                  1. Pendapatan Penjualan (Bruto)
                </td>
                <td className="py-3 text-right font-black text-sm text-[#5F1E1E]">
                  {formatRupiah(finances.totalRevenue)}
                </td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">
                  Pendapatan dari Laporan Rekap Terunggah
                </td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">
                  {formatRupiah(finances.totalRevenue)}
                </td>
              </tr>

              {/* 2. HPP */}
              <tr>
                <td className="py-3 font-extrabold text-sm text-[#5F1E1E]">
                  2. Harga Pokok Penjualan (HPP)
                </td>
                <td className="py-3 text-right font-black text-sm text-[#5F1E1E]">
                  {formatRupiah(finances.totalHpp)}
                </td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">HPP Terjual dari Rekap Terunggah</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">
                  {formatRupiah(finances.totalHpp)}
                </td>
              </tr>

              {/* 3. Biaya Admin Platform */}
              <tr>
                <td className="py-3 font-extrabold text-sm text-[#5F1E1E]">
                  3. Komisi & Biaya Admin Platform Marketplace
                </td>
                <td className="py-3 text-right font-black text-sm text-[#5F1E1E]">
                  {formatRupiah(finances.totalAdminFee)}
                </td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Potongan Admin Rekap Terunggah</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">
                  {formatRupiah(finances.totalAdminFee)}
                </td>
              </tr>

              {/* Laba Kotor */}
              <tr className="bg-[#E8D3A7]/30">
                <td className="py-3 font-black pl-3 text-[#5F1E1E]">
                  LABA KOTOR (Pendapatan - HPP - Admin Platform)
                </td>
                <td className="py-3 text-right font-black pr-3 text-[#5F1E1E]">
                  {formatRupiah(
                    finances.totalRevenue -
                    finances.totalHpp -
                    finances.totalAdminFee,
                  )}
                </td>
              </tr>

              {/* 4. Beban Operasional */}
              <tr>
                <td className="py-3 font-extrabold text-sm text-[#5F1E1E] flex items-center gap-2">
                  <span>4. Beban Operasional Bulanan</span>
                  <button
                    type="button"
                    onClick={handleOpenOpsModal}
                    className="text-[10px] text-[#B48328] hover:underline font-extrabold bg-[#E8D3A7]/40 px-2 py-0.5 rounded-md cursor-pointer"
                  >
                    Edit
                  </button>
                </td>
                <td className="py-3 text-right font-black text-sm text-[#5F1E1E]">
                  {formatRupiah(finances.operational)}
                </td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">
                  Beban Sewa Toko Utama & Gudang Pusat
                </td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">
                  {formatRupiah(finances.sewa)}
                </td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">Beban Gaji Karyawan Toko</td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">
                  {formatRupiah(finances.gaji)}
                </td>
              </tr>
              <tr className="text-[#5F1E1E] font-medium">
                <td className="py-2 pl-6">
                  Tagihan Utilitas Listrik & Air Gudang
                </td>
                <td className="py-2 text-right font-bold text-xs text-[#5F1E1E]">
                  {formatRupiah(finances.listrik)}
                </td>
              </tr>

              {/* Laba Bersih Riil (Net Profit) */}
              <tr className="bg-[#5F1E1E] text-[#E8D3A7] border-t-2 border-[#B48328]">
                <td className="py-3.5 font-extrabold text-sm pl-3">
                  LABA BERSIH RIIL (Net Profit)
                </td>
                <td className="py-3.5 text-right font-black text-sm pr-3 text-[#E5C88B]">
                  {formatRupiah(finances.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── MODAL EDIT BEBAN OPERASIONAL ─── */}
      {showOpsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp font-dmsans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-[#5F1E1E] uppercase">
                ATUR BEBAN OPERASIONAL BULANAN
              </h2>
              <button
                type="button"
                onClick={() => setShowOpsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveOps} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-extrabold text-[#5F1E1E] uppercase">
                  Beban Sewa Toko / Gudang (Rp/Bulan)
                </label>
                <input
                  type="text"
                  className="border-2 border-[#B48328] rounded-xl p-3 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                  placeholder="Contoh: 1.500.000"
                  value={inputSewa ? Number(inputSewa).toLocaleString("id-ID") : ""}
                  onChange={(e) => setInputSewa(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-extrabold text-[#5F1E1E] uppercase">
                  Beban Gaji Karyawan (Rp/Bulan)
                </label>
                <input
                  type="text"
                  className="border-2 border-[#B48328] rounded-xl p-3 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                  placeholder="Contoh: 3.000.000"
                  value={inputGaji ? Number(inputGaji).toLocaleString("id-ID") : ""}
                  onChange={(e) => setInputGaji(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-extrabold text-[#5F1E1E] uppercase">
                  Tagihan Utilitas Listrik & Air (Rp/Bulan)
                </label>
                <input
                  type="text"
                  className="border-2 border-[#B48328] rounded-xl p-3 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                  placeholder="Contoh: 500.000"
                  value={inputListrik ? Number(inputListrik).toLocaleString("id-ID") : ""}
                  onChange={(e) => setInputListrik(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="bg-[#E8D3A7]/30 border border-[#B48328]/30 p-3 rounded-xl flex justify-between items-center font-extrabold text-[#5F1E1E]">
                <span>Total Beban Operasional:</span>
                <span className="text-[#B48328] text-sm font-black">
                  {formatRupiah(
                    (Number(inputSewa) || 0) +
                    (Number(inputGaji) || 0) +
                    (Number(inputListrik) || 0)
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowOpsModal(false)}
                  className="bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingOps}
                  className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-extrabold px-5 py-2.5 rounded-xl text-xs shadow transition-all active:scale-95 flex items-center justify-center min-w-[100px]"
                >
                  {isSavingOps ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "Simpan Beban"
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