import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../config/firebase";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  lat: number;
  lng: number;
  isEmailVerified: boolean;
}

const BUSINESS_CATEGORIES = [
  "Makanan & Minuman (F&B)",
  "Pakaian & Fashion",
  "Ritel / Toko Kelontong",
  "Jasa & Pelayanan",
  "Kecantikan & Kesehatan",
  "Lainnya",
];

const DEFAULT_LAT = -6.2088;
const DEFAULT_LNG = 106.8456;

// GANTI DENGAN API KEY GEOAPIFY MILIKMU (atau simpan di .env)
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "YOUR_GEOAPIFY_API_KEY";

const INITIAL_PROFILE: UserProfile = {
  name: "Pengguna Zura",
  email: "",
  phone: "",
  category: "Lainnya",
  location: "Belum Diatur",
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  isEmailVerified: false,
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("user_profile_data");
      return saved
        ? { ...INITIAL_PROFILE, ...JSON.parse(saved) }
        : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Pengaturan Keamanan Akun
  const [isSecurityOpen, setIsSecurityOpen] = useState(true);
  const [activeSecurityTab, setActiveSecurityTab] = useState<
    "email" | "password" | "danger"
  >("email");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showReauthModal, setShowReauthModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "email" | "password" | "delete" | null
  >(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userEmail = user.email || "";
        const emailIsVerified = user.emailVerified;
        const autoName =
          user.displayName || userEmail.split("@")[0] || "Pengguna Zura";

        setProfile((prev) => {
          const isDefaultName =
            !prev.name ||
            prev.name === "ckhyy23" ||
            prev.name === "Pengguna Zura";

          const updated = {
            ...prev,
            name: isDefaultName ? autoName : prev.name,
            email: userEmail,
            isEmailVerified: emailIsVerified,
          };
          try {
            localStorage.setItem("user_profile_data", JSON.stringify(updated));
          } catch (e) {
            console.error("Gagal simpan local", e);
          }
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSearchLocation = async () => {
    if (!formData.location.trim()) return;

    try {
      const searchQuery = formData.location.toLowerCase().includes("indonesia")
        ? formData.location
        : `${formData.location}, Indonesia`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=id&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);

        setFormData((prev) => ({
          ...prev,
          lat: newLat,
          lng: newLng,
        }));
        showToast("Koordinat peta berhasil ditemukan!");
      } else {
        alert(
          "Lokasi tidak ditemukan. Coba gunakan format: Nama Jalan/Area, Kota (Contoh: Tebet, Jakarta Selatan)"
        );
      }
    } catch (error) {
      console.error("Gagal mencari lokasi:", error);
    }
  };

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur lokasi GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          location:
            prev.location && prev.location !== "Belum Diatur"
              ? prev.location
              : "Lokasi GPS Terdeteksi",
        }));
        showToast("Koordinat GPS HP berhasil terdeteksi!");
      },
      (error) => {
        console.error("Gagal GPS:", error);
        alert(
          "Gagal mengambil GPS. Harap pastikan Izin Lokasi di HP/Browser sudah diaktifkan."
        );
      },
      { enableHighAccuracy: true }
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendEmailVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser, {
          url: window.location.origin + "/profile",
          handleCodeInApp: true,
        });
        showToast("Link verifikasi dikirim ke email!");
      } catch (error) {
        console.error("Gagal kirim verifikasi:", error);
      }
    }
  };

  const triggerEmailUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setPendingAction("email");
    setShowReauthModal(true);
  };

  const triggerPasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert("Kata sandi baru dan konfirmasi tidak cocok!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Kata sandi minimal 6 karakter!");
      return;
    }
    setPendingAction("password");
    setShowReauthModal(true);
  };

  const triggerAccountDelete = async () => {
    const user = auth.currentUser;
    if (!user || isDeleting) return;

    if (!window.confirm("Apakah Anda yakin ingin MENGHAPUS AKUN ini secara permanen?")) return;

    setIsDeleting(true);
    const isGoogleUser = user.providerData.some((p) => p.providerId === "google.com");

    if (isGoogleUser) {
      try {
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: "select_account" });
        await reauthenticateWithPopup(user, googleProvider);
        await deleteUser(user);

        queryClient.clear();
        localStorage.clear();
        sessionStorage.clear();
        navigate("/", { replace: true });
      } catch (error: any) {
        alert("Gagal hapus akun: " + error.message);
      } finally {
        setIsDeleting(false);
      }
    } else {
      setIsDeleting(false);
      setPendingAction("delete");
      setShowReauthModal(true);
    }
  };

  const handleReauthenticateAndExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPasswordInput);
      await reauthenticateWithCredential(user, credential);

      if (pendingAction === "email") {
        await verifyBeforeUpdateEmail(user, newEmail, {
          url: window.location.origin + "/profile",
          handleCodeInApp: true,
        });
        showToast(`Link verifikasi terkirim ke ${newEmail}`);
        setNewEmail("");
      } else if (pendingAction === "password") {
        await updatePassword(user, newPassword);
        showToast("Kata sandi berhasil diubah!");
        setNewPassword("");
        setConfirmPassword("");
      } else if (pendingAction === "delete") {
        await deleteUser(user);
        queryClient.clear();
        localStorage.clear();
        sessionStorage.clear();
        navigate("/", { replace: true });
        return;
      }

      setShowReauthModal(false);
      setCurrentPasswordInput("");
      setPendingAction(null);
    } catch (error: any) {
      alert("Gagal memproses: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    try {
      localStorage.setItem("user_profile_data", JSON.stringify(formData));
    } catch (err) {
      console.error("Gagal simpan local", err);
    }
    setIsEditOpen(false);
    showToast("Profil berhasil diperbarui!");
  };

  return (
    <div className="relative min-h-screen bg-[#E8D3A7] text-[#0F172A] p-6 flex flex-col gap-6 font-dmsans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-lg text-sm gap-2 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
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
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* SECTION INFORMASI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 border border-slate-100">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#5F1E1E]">
                  {profile.name}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Pemilik Toko / Usaha
                </p>
              </div>
              <span className="bg-[#5F1E1E]/10 text-[#5F1E1E] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {profile.category}
              </span>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-500 font-medium">Email Akun</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#5F1E1E]">
                    {profile.email || "Belum Diatur"}
                  </span>
                  {profile.email &&
                    (profile.isEmailVerified ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold">
                        ✓ Verified
                      </span>
                    ) : (
                      <button
                        onClick={handleSendEmailVerification}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-bold transition-all"
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
            💡 Untuk mengubah nama pemilik, telepon, dan kategori usaha klik tombol <b className="text-[#5F1E1E]">EDIT PROFIL</b>.
          </div>
        </div>

        {/* PETA GEOAPIFY */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4 border border-slate-100">
          <h2 className="text-sm font-extrabold text-[#5F1E1E] uppercase tracking-wide border-b border-slate-100 pb-3">
            Informasi Usaha & Lokasi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400 font-medium block mb-0.5">
                Nama Pemilik
              </span>
              <span className="font-extrabold text-[#5F1E1E] text-sm">
                {profile.name}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400 font-medium block mb-0.5">
                Kategori Usaha
              </span>
              <span className="font-extrabold text-[#5F1E1E] text-sm">
                {profile.category}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl text-xs flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Lokasi Usaha</span>
              <span className="font-extrabold text-[#5F1E1E] text-xs">
                {profile.location}
              </span>
            </div>

            {/* PETA STATIS GEOAPIFY */}
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
              <img
                src={`https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=300&center=lonlat:${profile.lng},${profile.lat}&zoom=15&marker=lonlat:${profile.lng},${profile.lat};color:%235f1e1e;size:medium&apiKey=${GEOAPIFY_API_KEY}`}
                alt="Peta Lokasi Toko Geoapify"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── PENGATURAN KEAMANAN AKUN (DARI GAMBAR) ─── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-5">
        <div
          onClick={() => setIsSecurityOpen(!isSecurityOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5F1E1E]/10 flex items-center justify-center text-[#5F1E1E] font-extrabold">
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
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#5F1E1E] text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <span>{isSecurityOpen ? "Tutup Pengaturan ▲" : "Kelola Keamanan ▼"}</span>
          </button>
        </div>

        {isSecurityOpen && (
          <div className="flex flex-col gap-5 pt-2">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveSecurityTab("email")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSecurityTab === "email"
                    ? "bg-[#5F1E1E] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                Ganti Email
              </button>

              <button
                type="button"
                onClick={() => setActiveSecurityTab("password")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSecurityTab === "password"
                    ? "bg-[#5F1E1E] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                Ubah Kata Sandi
              </button>

              <button
                type="button"
                onClick={() => setActiveSecurityTab("danger")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSecurityTab === "danger"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
              >
                Zona Bahaya (Hapus Akun)
              </button>
            </div>

            {/* Tab 1: Ganti Email */}
            {activeSecurityTab === "email" && (
              <form
                onSubmit={triggerEmailUpdate}
                className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 max-w-xl"
              >
                <div>
                  <h3 className="text-xs font-extrabold text-[#5F1E1E] uppercase mb-1">
                    Ganti Email Terdaftar
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Email aktif saat ini:{" "}
                    <b className="text-slate-700">{profile.email || "Belum Diatur"}</b>
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
                    className="bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Simpan Email Baru
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Ubah Kata Sandi */}
            {activeSecurityTab === "password" && (
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 max-w-xl">
                {auth.currentUser?.providerData.some(
                  (p) => p.providerId === "google.com"
                ) ? (
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xs font-extrabold text-[#5F1E1E] uppercase">
                      Kata Sandi Dikelola oleh Google
                    </h3>
                    <p className="text-xs text-slate-600">
                      Akun Anda terhubung via <b>Google Sign-In</b>. Ubah kata sandi langsung di akun Google Anda.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={triggerPasswordUpdate} className="flex flex-col gap-4">
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
                        className="bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        Ubah Kata Sandi
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Tab 3: Zona Bahaya */}
            {activeSecurityTab === "danger" && (
              <div className="bg-red-50/80 p-5 rounded-2xl border border-red-100 flex flex-col gap-4 max-w-xl">
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
                    onClick={triggerAccountDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    {isDeleting ? "Memproses Hapus..." : "Hapus Akun Permanen"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL RE-AUTHENTICATION */}
      {showReauthModal && (
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
            <form onSubmit={handleReauthenticateAndExecute} className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Masukkan Kata Sandi Saat Ini"
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#B48328]"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReauthModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5F1E1E] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Konfirmasi & Lanjutkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROFIL */}
      {isEditOpen && (
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
                onClick={() => setIsEditOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
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

              <div>
                <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-2">
                  Kategori Usaha
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${formData.category === cat
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

              <div>
                <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-1.5">
                  Lokasi Usaha
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    name="location"
                    placeholder="Contoh: Tebet Barat, Jakarta Selatan"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
                  />
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all whitespace-nowrap"
                  >
                    Cari
                  </button>
                  <button
                    type="button"
                    onClick={handleGetGPSLocation}
                    className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] text-xs font-bold px-3 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 shadow-sm active:scale-95"
                    title="Deteksi Lokasi GPS HP"
                  >
                    <span>📍 GPS</span>
                  </button>
                </div>

                {/* PREVIEW PETA MODAL */}
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                  <img
                    src={`https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=300&center=lonlat:${formData.lng},${formData.lat}&zoom=15&marker=lonlat:${formData.lng},${formData.lat};color:%235f1e1e;size:medium&apiKey=${GEOAPIFY_API_KEY}`}
                    alt="Preview Peta Modal Geoapify"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5F1E1E] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}