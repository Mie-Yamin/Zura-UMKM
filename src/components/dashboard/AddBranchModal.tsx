interface AddBranchModalProps {
  open: boolean;
  value: string;
  onChange: (name: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

// ─── MODAL TAMBAH CABANG ─────────────────────────────────────────────────────
export default function AddBranchModal({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
}: AddBranchModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp font-dmsans">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase">
            Tambah Cabang / Gudang
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={onSubmit}
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
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
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
  );
}