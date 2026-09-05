import type { Product } from "../../types";

interface QuickRestockModalProps {
  item: Product;
  qty: string;
  onQtyChange: (qty: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

// ─── MODAL QUICK RESTOCK ─────────────────────────────────────────────────────
export default function QuickRestockModal({
  item,
  qty,
  onQtyChange,
  onClose,
  onSubmit,
}: QuickRestockModalProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-[#5F1E1E]">
            Restock Item Cepat
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 text-xs"
        >
          <div className="bg-slate-50 p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">
              Produk
            </span>
            <span className="font-extrabold text-[#5F1E1E]">
              {item.name}
            </span>
            <span className="text-[10px] text-slate-400">
              Stok Saat Ini: {item.stockCount} unit
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
              value={qty}
              onChange={(e) => onQtyChange(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
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
  );
}