import type { Product } from "../../types";

export interface DashboardMetrics {
  totalOmzet: number;
  totalProfit: number;
  amanCount: number;
  kritisCount: number;
  lowStockItems: Product[];
}

// ─── KARTU RINGKASAN METRIK ──────────────────────────────────────────────────
export default function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const marginPct =
    metrics.totalOmzet > 0
      ? `~${((metrics.totalProfit / metrics.totalOmzet) * 100).toFixed(0)}%`
      : "0%";

  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
      aria-label="Metrik Pemantauan"
    >
      <article className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-transparent flex flex-col justify-between min-h-[160px]">
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-[10px] sm:text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
            TOTAL OMZET
            <br />
            TERAKHIR
          </h2>
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
          <h2 className="text-[10px] sm:text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
            LABA BERSIH
            <br />
            ESTIMASI
          </h2>
          <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider leading-tight text-center flex-shrink-0">
            {marginPct}
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
          <h2 className="text-[10px] sm:text-xs font-extrabold text-[#5F1E1E] tracking-tight uppercase leading-tight">
            STATUS STOK
            <br />
            GUDANG PUSAT
          </h2>
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
  );
}