import type { SalesRecap } from "../../types";

// ─── RINGKASAN SALURAN ───────────────────────────────────────────────────────
export default function ChannelSummaryGrid({ recaps }: { recaps: SalesRecap[] }) {
  const formatRupiah = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
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
  );
}