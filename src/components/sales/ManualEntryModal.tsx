import type { Product } from "../../types";

export interface ManualRow {
  productId: string;
  qty: number | '';
}

interface ManualEntryModalProps {
  open: boolean;
  products: Product[];
  manualDate: string;
  setManualDate: (v: string) => void;
  itemRows: ManualRow[];
  calculatedTotals: { totalUnits: number; totalNominal: number };
  isSubmitting: boolean;
  onRowChange: (index: number, field: keyof ManualRow, value: any) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

// ─── MODAL INPUT PENJUALAN DYNAMIC ITEM ROWS ────────────────────────────────
export default function ManualEntryModal({
  open,
  products,
  manualDate,
  setManualDate,
  itemRows,
  calculatedTotals,
  isSubmitting,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onSubmit,
  onClose,
}: ManualEntryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-[#5F1E1E] uppercase tracking-wide">
            INPUT PENJUALAN / OPNAME MANUAL
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 text-xs">
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
                          onChange={(e) => onRowChange(index, 'productId', e.target.value)}
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
                            onRowChange(index, 'qty', val === '' ? '' : parseInt(val) || 0);
                          }}
                        />
                      </div>

                      <div className="col-span-2 flex items-end justify-center pt-3">
                        <button
                          type="button"
                          onClick={() => onRemoveRow(index)}
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
              onClick={onAddRow}
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
              onClick={onClose}
              className="w-full sm:w-auto bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedTotals.totalUnits === 0}
              className={`w-full sm:w-auto font-black px-6 py-2.5 rounded-xl text-xs shadow-md min-h-[44px] flex items-center justify-center transition-all ${calculatedTotals.totalUnits === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] active:scale-95'
                }`}
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Simpan Transaksi'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}