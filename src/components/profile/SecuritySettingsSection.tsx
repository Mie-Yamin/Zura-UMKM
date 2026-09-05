export type SecurityTab = "email" | "password" | "danger";

interface SecuritySettingsSectionProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  activeTab: SecurityTab;
  onTabChange: (tab: SecurityTab) => void;
  profileEmail: string;
  isGoogleUser: boolean;
  newEmail: string;
  setNewEmail: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  isDeleting: boolean;
  onSubmitEmail: (e: React.FormEvent) => void;
  onSubmitPassword: (e: React.FormEvent) => void;
  onDeleteAccount: () => void;
}

// ─── PENGATURAN KEAMANAN AKUN ────────────────────────────────────────────────
export default function SecuritySettingsSection({
  isOpen,
  onToggleOpen,
  activeTab,
  onTabChange,
  profileEmail,
  isGoogleUser,
  newEmail,
  setNewEmail,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isDeleting,
  onSubmitEmail,
  onSubmitPassword,
  onDeleteAccount,
}: SecuritySettingsSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col gap-4 sm:gap-5">
      <div
        onClick={onToggleOpen}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#5F1E1E]/10 flex items-center justify-center text-[#5F1E1E] font-extrabold shrink-0 mt-0.5 sm:mt-0">
            ⚙
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#5F1E1E] uppercase tracking-wide">
              Pengaturan Keamanan Akun
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola kata sandi, ganti email terdaftar, atau hapus akun Anda.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#5F1E1E] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-1 sm:mt-0 cursor-pointer"
        >
          <span>{isOpen ? "Tutup Pengaturan ▲" : "Kelola Keamanan ▼"}</span>
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-4 sm:gap-5 pt-2 border-t border-slate-100 sm:border-0">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <button
              type="button"
              onClick={() => onTabChange("email")}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${activeTab === "email"
                ? "bg-[#5F1E1E] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              Ganti Email
            </button>

            <button
              type="button"
              onClick={() => onTabChange("password")}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${activeTab === "password"
                ? "bg-[#5F1E1E] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              Ubah Kata Sandi
            </button>

            <button
              type="button"
              onClick={() => onTabChange("danger")}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${activeTab === "danger"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-red-50 text-red-600 hover:bg-red-100"
                }`}
            >
              Zona Bahaya (Hapus Akun)
            </button>
          </div>

          {activeTab === "email" && (
            <form
              onSubmit={onSubmitEmail}
              className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 max-w-xl w-full"
            >
              <div>
                <h3 className="text-xs font-extrabold text-[#5F1E1E] uppercase mb-1">
                  Ganti Email Terdaftar
                </h3>
                <p className="text-[11px] text-slate-500 mb-3 break-all">
                  Email aktif saat ini:{" "}
                  <b className="text-slate-700">{profileEmail || "Belum Diatur"}</b>
                </p>

                <input
                  type="email"
                  placeholder="Masukkan Email Baru"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
                />
              </div>

              <div className="flex justify-start">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Simpan Email Baru
                </button>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 max-w-xl w-full">
              {isGoogleUser ? (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xs font-extrabold text-[#5F1E1E] uppercase">
                    Kata Sandi Dikelola oleh Google
                  </h3>
                  <p className="text-xs text-slate-600">
                    Akun Anda terhubung via <b>Google Sign-In</b>. Ubah kata sandi langsung di akun Google Anda.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmitPassword} className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#5F1E1E] uppercase mb-1">
                      Perbarui Kata Sandi Akun
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Pastikan kata sandi baru minimal 6 karakter.
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <input
                        type="password"
                        placeholder="Kata Sandi Baru"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
                      />
                      <input
                        type="password"
                        placeholder="Konfirmasi Kata Sandi Baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Ubah Kata Sandi
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "danger" && (
            <div className="bg-red-50/80 p-4 sm:p-5 rounded-2xl border border-red-100 flex flex-col gap-4 max-w-xl w-full">
              <div>
                <h3 className="text-xs font-extrabold text-red-700 uppercase mb-1">
                  Tindakan Permanen: Hapus Akun
                </h3>
                <p className="text-[11px] text-red-600/80 leading-relaxed">
                  Menghapus akun akan memusnahkan seluruh akses dashboard dan data usaha Anda secara permanen!
                </p>
              </div>

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={onDeleteAccount}
                  disabled={isDeleting}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {isDeleting ? "Memproses Hapus..." : "Hapus Akun Permanen"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}