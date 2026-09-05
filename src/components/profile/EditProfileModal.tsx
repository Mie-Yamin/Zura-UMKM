import { DEFAULT_BUSINESS_CATEGORIES } from "./types";
import type { UserProfile } from "./types";

interface EditProfileModalProps {
  open: boolean;
  formData: UserProfile;
  isCustomCategoryMode: boolean;
  customCategoryInput: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectStandardCategory: (cat: string) => void;
  onSelectCustomMode: () => void;
  setCustomCategoryInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

// ─── MODAL EDIT PROFIL ───────────────────────────────────────────────────────
export default function EditProfileModal({
  open,
  formData,
  isCustomCategoryMode,
  customCategoryInput,
  onInputChange,
  onSelectStandardCategory,
  onSelectCustomMode,
  setCustomCategoryInput,
  onSubmit,
  onClose,
}: EditProfileModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#5F1E1E] uppercase">
              Edit Profil & Usaha
            </h2>
            <p className="text-xs text-slate-500">
              Perbarui detail informasi toko Anda
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-1.5">
              Nama Pemilik / Lengkap
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-1.5">
              Nomor Telepon Toko
            </label>
            <input
              type="text"
              name="phone"
              placeholder="+62 8xx-xxxx-xxxx"
              value={formData.phone}
              onChange={onInputChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
            />
          </div>

          {/* KATEGORI USAHA */}
          <div>
            <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-2">
              Kategori Usaha
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_BUSINESS_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${!isCustomCategoryMode && formData.category === cat
                    ? "border-[#5F1E1E] bg-[#5F1E1E]/5 text-[#5F1E1E] font-bold"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <input
                    type="radio"
                    name="category_radio"
                    value={cat}
                    checked={!isCustomCategoryMode && formData.category === cat}
                    onChange={() => onSelectStandardCategory(cat)}
                    className="accent-[#5F1E1E]"
                  />
                  <span>{cat}</span>
                </label>
              ))}

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${isCustomCategoryMode
                  ? "border-[#5F1E1E] bg-[#5F1E1E]/5 text-[#5F1E1E] font-bold"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <input
                  type="radio"
                  name="category_radio"
                  value="CUSTOM"
                  checked={isCustomCategoryMode}
                  onChange={onSelectCustomMode}
                  className="accent-[#5F1E1E]"
                />
                <span>➕ Lainnya / Ketik Custom...</span>
              </label>
            </div>

            {isCustomCategoryMode && (
              <div className="mt-3 animate-scaleUp">
                <label className="block text-[10px] font-bold text-[#B48328] uppercase mb-1">
                  Ketik Nama Kategori Usaha Custom:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kerajinan Tangan / Otomotif"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  className="w-full bg-[#FFFDF9] border-2 border-[#B48328] rounded-xl px-4 py-2.5 text-xs font-bold text-[#5F1E1E] focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#5F1E1E] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}