interface ReauthModalProps {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

// ─── MODAL RE-AUTHENTICATION ─────────────────────────────────────────────────
export default function ReauthModal({
  open,
  value,
  onChange,
  onSubmit,
  onClose,
}: ReauthModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-[#5F1E1E] uppercase">
            Konfirmasi Kata Sandi
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Masukkan kata sandi Anda saat ini untuk melanjutkan.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Masukkan Kata Sandi Saat Ini"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
            autoFocus
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#B48328]"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#5F1E1E] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              Konfirmasi & Lanjutkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}