import type { Product } from "../../types";

interface StockAlertsProps {
  understock: Product[];
  deadstock: Product[];
  onRestock: (product: Product) => void;
}

// ─── WIDGET STOCK WARNING UNDERSTOCK & DEADSTOCK ─────────────────────────────
export default function StockAlerts({
  understock,
  deadstock,
  onRestock,
}: StockAlertsProps) {
  return (
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
            {understock.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                Tidak ada produk understock.
              </div>
            ) : (
              understock.map((p) => (
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
                    onClick={() => onRestock(p)}
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
            {deadstock.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                Tidak ada produk deadstock.
              </div>
            ) : (
              deadstock.map((p) => (
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
  );
}