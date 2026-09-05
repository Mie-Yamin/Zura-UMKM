import type { UserProfile } from "./types";

interface ProfileInfoCardProps {
  profile: UserProfile;
  onSendVerification: () => void;
}

// ─── KARTU INFORMASI PROFIL ──────────────────────────────────────────────────
export default function ProfileInfoCard({
  profile,
  onSendVerification,
}: ProfileInfoCardProps) {
  return (
    <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between gap-5 border border-slate-100">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#5F1E1E]">
              {profile.name}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Pemilik Toko / Usaha
            </p>
          </div>
          <span className="bg-[#5F1E1E]/10 text-[#5F1E1E] text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider text-right max-w-[150px] truncate">
            {profile.category}
          </span>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 font-medium">Email Akun</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#5F1E1E] truncate max-w-[130px] sm:max-w-none">
                {profile.email || "Belum Diatur"}
              </span>
              {profile.email &&
                (profile.isEmailVerified ? (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold">
                    ✓ Verified
                  </span>
                ) : (
                  <button
                    onClick={onSendVerification}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer"
                  >
                    Verifikasi
                  </button>
                ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 font-medium">Telepon Toko</span>
            <span className="font-bold text-[#5F1E1E]">
              {profile.phone || "Belum Diisi"}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-500 font-medium">Status Akun</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Aktif
            </span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
        Untuk mengubah nama pemilik, telepon, dan kategori usaha klik tombol <b className="text-[#5F1E1E]">EDIT PROFIL</b>.
      </div>
    </div>
  );
}