import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../config/firebase";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  avatarUrl: string;
}

const BUSINESS_CATEGORIES = [
  "Makanan & Minuman (F&B)",
  "Pakaian & Fashion",
  "Ritel / Toko Kelontong",
  "Jasa & Pelayanan",
  "Kecantikan & Kesehatan",
  "Lainnya",
];

export default function ProfilePage() {
  const navigate = useNavigate();

  // State Profil Utama
  const [profile, setProfile] = useState<UserProfile>({
    name: "ckhyy23",
    email: "",
    phone: "",
    category: "Makanan & Minuman (F&B)",
    location: "Taman Literasi, Jakarta",
    isPhoneVerified: false,
    isEmailVerified: false,
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=ZuraUser",
  });

  // Control Modal Edit (Tampil di atas latar blur)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Modal OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  // Sinkronisasi Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userEmail = user.email || "";
        const userName =
          user.displayName || userEmail.split("@")[0] || "ckhyy23";
        const emailIsVerified = user.emailVerified;

        const updatedData = {
          email: userEmail,
          name: userName,
          isEmailVerified: emailIsVerified,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userName}`,
        };

        setProfile((prev) => ({ ...prev, ...updatedData }));
        setFormData((prev) => ({ ...prev, ...updatedData }));
      }
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendEmailVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        alert(`Link verifikasi telah dikirim ke ${auth.currentUser.email}`);
      } catch (error) {
        console.error("Gagal mengirim email verifikasi:", error);
        alert("Gagal mengirim email. Coba lagi nanti.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Gagal keluar dari sesi:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const isNumberChanged = formData.phone !== profile.phone;
    const updatedProfile = {
      ...formData,
      isPhoneVerified: isNumberChanged ? false : formData.isPhoneVerified,
    };

    setProfile(updatedProfile);
    setIsEditOpen(false);
    showToast("Profil berhasil diperbarui!");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === "123456" || otpInput.length === 6) {
      setProfile((prev) => ({ ...prev, isPhoneVerified: true }));
      setFormData((prev) => ({ ...prev, isPhoneVerified: true }));
      setShowOtpModal(false);
      setOtpInput("");
      showToast("Nomor Telepon Toko Berhasil Diverifikasi!");
    } else {
      alert("Kode OTP Salah! Masukkan 6 digit angka.");
    }
  };

  // Safe Google Maps Search URL
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    (isEditOpen ? formData.location : profile.location) || "Jakarta",
  )}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="relative min-h-screen bg-[#E8D3A7] text-[#0F172A] p-6 flex flex-col gap-6 font-dmsans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-lg text-sm gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
          {toastMessage}
        </div>
      )}

      {/* Header Utama */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#5F1E1E] tracking-tight uppercase">
            PROFIL PENGGUNA
          </h1>
          <p className="text-xs md:text-sm font-medium text-[#B48328] mt-1">
            Kelola Informasi Akun Dan Detail Usaha
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFormData(profile);
              setIsEditOpen(true);
            }}
            className="bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            EDIT PROFIL
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <img
              src="/sideBar/logOut.png"
              alt="Logout"
              className="w-4 h-4 object-contain brightness-0 invert"
            />
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* HALAMAN UTAMA PROFIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Card Kiri: Identitas Pengguna */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-5">
          <div className="relative">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-28 h-28 rounded-full bg-[#E8D3A7]/40 border-4 border-[#B48328] p-1 object-cover shadow-sm"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-[#5F1E1E]">
              {profile.name}
            </h2>
            <span className="inline-block mt-2 bg-[#5F1E1E] text-[#E8D3A7] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {profile.category}
            </span>
          </div>

          <div className="w-full border-t border-slate-100 pt-4 flex flex-col gap-3 text-left text-xs font-medium text-slate-600">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Email</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#5F1E1E]">
                  {profile.email || "Belum Diatur"}
                </span>
                {profile.email &&
                  (profile.isEmailVerified ? (
                    <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      onClick={handleSendEmailVerification}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-all"
                    >
                      Verifikasi
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Telepon Toko</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#5F1E1E]">
                  {profile.phone || "Belum Diisi"}
                </span>
                {profile.phone &&
                  (profile.isPhoneVerified ? (
                    <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowOtpModal(true)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-all"
                    >
                      Verifikasi
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status Akun</span>
              <span className="font-bold text-green-600">Aktif</span>
            </div>
          </div>
        </div>

        {/* Card Kanan: Informasi Usaha & Lokasi Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide border-b border-slate-100 pb-3">
            Informasi Usaha & Lokasi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium block mb-1">
                Nama Pemilik
              </span>
              <span className="font-extrabold text-[#5F1E1E] text-sm">
                {profile.name}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium block mb-1">
                Kategori Usaha
              </span>
              <span className="font-extrabold text-[#5F1E1E] text-sm">
                {profile.category}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-400 font-medium block mb-1">
              Lokasi Usaha
            </span>
            <span className="font-extrabold text-[#5F1E1E] text-sm block mb-3">
              {profile.location}
            </span>

            <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <iframe
                title="Google Maps Location View"
                width="100%"
                height="100%"
                src={mapEmbedUrl}
                style={{ border: 0 }}
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY MODAL EDIT PROFIL (BACKGROUND BLUR) */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-all animate-fadeIn">
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
                onClick={() => setIsEditOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              {/* Nama Pemilik */}
              <div>
                <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-1.5">
                  Nama Pemilik / Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
                />
              </div>

              {/* Email (Read-Only) */}
              <div>
                <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-1.5">
                  Email Akun
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Telepon */}
              <div>
                <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-1.5">
                  Nomor Telepon Toko
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+62 8xx-xxxx-xxxx"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
                />
              </div>

              {/* Kategori Usaha */}
              <div>
                <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-2">
                  Kategori Usaha
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        formData.category === cat
                          ? "border-[#5F1E1E] bg-[#5F1E1E]/5 text-[#5F1E1E] font-bold"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={formData.category === cat}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="accent-[#5F1E1E]"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Edit Lokasi Ala E-Commerce (Ketik + Sync Map) */}
              <div>
                <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-1.5">
                  Alamat / Lokasi Usaha
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    name="location"
                    placeholder="Contoh: Taman Literasi, Jakarta"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
                  />
                </div>

                <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 relative">
                  <iframe
                    title="Edit Location Map Preview"
                    width="100%"
                    height="100%"
                    src={mapEmbedUrl}
                    style={{ border: 0 }}
                    loading="lazy"
                  ></iframe>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal OTP */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-[#5F1E1E]">
              Verifikasi Nomor Telepon
            </h3>
            <p className="text-xs text-slate-600">
              Kode OTP dikirim ke{" "}
              <span className="font-bold text-[#5F1E1E]">{profile.phone}</span>.
              (Masukkan 6 digit angka/123456 untuk tes).
            </p>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-lg font-bold border border-slate-300 rounded-xl py-2.5 focus:outline-none focus:border-[#B48328]"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold rounded-xl"
                >
                  Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
