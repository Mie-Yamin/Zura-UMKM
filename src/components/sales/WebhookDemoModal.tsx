export type WebhookSource = 'Shopee' | 'TikTok Shop' | 'Tokopedia';

interface WebhookDemoModalProps {
  open: boolean;
  isSimulating: boolean;
  onSimulate: (source: WebhookSource) => void;
  onClose: () => void;
}

// ─── MODAL SIMULASI WEBHOOK EVENT-DRIVEN ─────────────────────────────────────
export default function WebhookDemoModal({
  open,
  isSimulating,
  onSimulate,
  onClose,
}: WebhookDemoModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-black text-[#5F1E1E] uppercase tracking-wide flex items-center gap-1.5">
            <span>⚡</span>
            <span>PENGUJI SIMULASI WEBHOOK (DEMO MODE)</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <div className="bg-[#FFFDF9] border-2 border-[#B48328]/40 p-3.5 rounded-2xl flex flex-col gap-2 text-xs text-[#5F1E1E]">
          <span className="font-extrabold uppercase text-[10px] text-[#B48328]">
            📢 Catatan Pengujian Lomba:
          </span>
          <p className="text-[11px] leading-relaxed font-semibold text-slate-700">
            Fitur ini disediakan khusus untuk <strong className="text-[#5F1E1E]">Pengujian Penjurian / Lomba</strong> untuk mendemonstrasikan integrasi <strong className="text-[#5F1E1E]">Event-Driven Multi-Channel Sync</strong> secara <em>real-time</em> tanpa harus melakukan transaksi pembelian sungguhan di aplikasi marketplace.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase">
            PILIH SALURAN E-COMMERCE UNTUK DISIMULASIKAN:
          </span>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => onSimulate('Shopee')}
              className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#EE4D2D] font-black p-3 rounded-2xl text-xs transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center gap-2 group h-28"
            >
              <div className="h-10 flex items-center justify-center">
                <img
                  src="/shopee.png"
                  alt="Shopee Logo"
                  className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <span className="text-[11px]">Shopee</span>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              onClick={() => onSimulate('TikTok Shop')}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-neutral-900 font-black p-3 rounded-2xl text-xs transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center gap-2 group h-28"
            >
              <div className="h-10 flex items-center justify-center w-full px-1">
                <img
                  src="/tiktok.png"
                  alt="TikTok Logo"
                  className="w-full max-w-[80px] h-9 object-contain group-hover:scale-110 transition-transform"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <span className="text-[11px]">TikTok Shop</span>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              onClick={() => onSimulate('Tokopedia')}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#00AA5B] font-black p-3 rounded-2xl text-xs transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center gap-2 group h-28"
            >
              <div className="h-10 flex items-center justify-center">
                <img
                  src="/tokopedia.png"
                  alt="Tokopedia Logo"
                  className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <span className="text-[11px]">Tokopedia</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors mt-2"
        >
          Tutup Penguji
        </button>
      </div>
    </div>
  );
}