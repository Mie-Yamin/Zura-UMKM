import type { SalesRecap } from "../../types";

interface RecapDetailModalProps {
  recap: SalesRecap | null;
  onClose: () => void;
}

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

// ─── MODAL RINCIAN DETAIL REKAP ──────────────────────────────────────────────
export default function RecapDetailModal({ recap, onClose }: RecapDetailModalProps) {
  if (!recap) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">

        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-[#5F1E1E] uppercase tracking-wide">RINCIAN DOKUMEN REKAP</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-3.5 text-xs">

          <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Kode Rekap</span>
              <span className="font-bold font-mono text-[#5F1E1E] truncate">{recap.id}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Sumber Laporan</span>
              <span className={`font-bold self-start mt-0.5 px-2.5 py-0.5 rounded-xl text-[10px] ${recap.source === 'Shopee' ? 'bg-orange-50 text-[#EE4D2D]' :
                recap.source === 'Tokopedia' ? 'bg-emerald-50 text-[#00AA5B]' :
                  recap.source === 'TikTok Shop' ? 'bg-neutral-900 text-white' :
                    'bg-[#5F1E1E] text-[#E8D3A7]'
                }`}>
                {recap.source}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center bg-[#E8D3A7]/20 p-2.5 rounded-2xl border border-[#B48328]/30">
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Unit Terjual</p>
              <p className="font-black text-[#5F1E1E] text-sm mt-0.5">{recap.unitsSold}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Bruto</p>
              <p className="font-black text-[#B48328] text-sm mt-0.5">{formatRupiah(recap.totalAmount)}</p>
            </div>
            <div>
              <p className="text-[9px] text-red-600 font-bold uppercase">Potongan Fee</p>
              <p className="font-black text-red-600 text-sm mt-0.5">-{formatRupiah(recap.adminFee)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase tracking-wider">
              DETIL ITEM BARANG TERJUAL:
            </span>

            {recap.items && recap.items.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                {recap.items.map((item, idx) => {
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
                  <span className="font-black text-[#5F1E1E] text-xs uppercase">Produk Rekap {recap.source}</span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {recap.unitsSold} unit × {formatRupiah(Math.round(recap.totalAmount / (recap.unitsSold || 1)))}
                  </span>
                </div>
                <span className="font-black text-[#B48328] text-xs">
                  {formatRupiah(recap.totalAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors mt-2 min-h-[44px]"
        >
          Tutup Rincian
        </button>
      </div>
    </div>
  );
}