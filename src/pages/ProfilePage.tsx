import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  deleteUser,
} from "firebase/auth";
import { auth } from "../config/firebase";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  lat: number;
  lng: number;
  isPhoneVerified: boolean;
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

const DEFAULT_LAT = -6.2428;
const DEFAULT_LNG = 106.8005;

export default function ProfilePage() {
  const navigate = useNavigate();

  // State Profil Utama
  const [profile, setProfile] = useState<UserProfile>({
    name: "ckhyy23",
    email: "",
    phone: "",
    category: "Makanan & Minuman (F&B)",
    location: "Taman Literasi, Jakarta",
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    isPhoneVerified: false,
    isEmailVerified: false,
  });

  // State Modal Edit Profil
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Pengaturan Keamanan Akun (Toggle Accordion & Tab)
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [activeSecurityTab, setActiveSecurityTab] = useState<
    "email" | "password" | "danger"
  >("email");

  // State Form Security
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State Modal OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const mainMapContainerRef = useRef<HTMLDivElement | null>(null);
  const mainMapInstanceRef = useRef<L.Map | null>(null);

  // Sync Firebase Auth
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
        };

        setProfile((prev) => ({ ...prev, ...updatedData }));
        setFormData((prev) => ({ ...prev, ...updatedData }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Inisialisasi Peta Utama
  useEffect(() => {
    if (!isEditOpen && mainMapContainerRef.current) {
      if (mainMapInstanceRef.current) {
        mainMapInstanceRef.current.remove();
      }

      const map = L.map(mainMapContainerRef.current).setView(
        [profile.lat, profile.lng],
        15,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      L.marker([profile.lat, profile.lng])
        .addTo(map)
        .bindPopup(`<b>${profile.name}</b><br/>${profile.location}`);

      mainMapInstanceRef.current = map;
    }

    return () => {
      if (mainMapInstanceRef.current) {
        mainMapInstanceRef.current.remove();
        mainMapInstanceRef.current = null;
      }
    };
  }, [isEditOpen, profile.lat, profile.lng, profile.location, profile.name]);

  // Inisialisasi Peta Interaktif Modal Edit
  useEffect(() => {
    if (isEditOpen && mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current).setView(
        [formData.lat, formData.lng],
        15,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([formData.lat, formData.lng], {
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setFormData((prev) => ({
          ...prev,
          lat: position.lat,
          lng: position.lng,
        }));
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setFormData((prev) => ({
          ...prev,
          lat,
          lng,
        }));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isEditOpen]);

  // Cari Lokasi di Peta
  const handleSearchLocation = async () => {
    if (!formData.location.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.location,
        )}`,
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

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 15);
          markerRef.current.setLatLng([newLat, newLng]);
        }
      } else {
        alert("Lokasi tidak ditemukan, coba nama area lain!");
      }
    } catch (error) {
      console.error("Gagal mencari lokasi:", error);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendEmailVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        showToast("Link verifikasi telah dikirim ke email Anda!");
      } catch (error) {
        console.error("Gagal mengirim email verifikasi:", error);
        alert("Gagal mengirim email. Coba login ulang terlebih dahulu.");
      }
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    if (auth.currentUser) {
      try {
        await updateEmail(auth.currentUser, newEmail);
        setProfile((prev) => ({
          ...prev,
          email: newEmail,
          isEmailVerified: false,
        }));
        setNewEmail("");
        showToast(
          "Email berhasil diperbarui! Silakan lakukan verifikasi ulang.",
        );
      } catch (error) {
        console.error("Gagal perbarui email:", error);
        alert("Gagal memperbarui email. Harap re-login demi keamanan.");
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert("Kata sandi baru dan konfirmasi tidak cocok!");
      return;
    }

    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword("");
        setConfirmPassword("");
        showToast("Kata sandi berhasil diubah!");
      } catch (error) {
        console.error("Gagal ubah password:", error);
        alert("Gagal mengubah kata sandi. Harap re-login terlebih dahulu.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin MENGHAPUS AKUN ini secara permanen? Tindakan ini tidak dapat dibatalkan!",
    );

    if (confirmDelete && auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
        alert("Akun Anda telah berhasil dihapus.");
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Gagal menghapus akun:", error);
        alert(
          "Gagal menghapus akun. Harap login ulang sebelum melakukan tindakan ini.",
        );
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

      {/* SECTION ATAS: INFORMASI PENGGUNA & LOKASI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card Kiri: Detail Akun (Tanpa Foto) */}
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
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#5F1E1E]">
                    {profile.phone || "Belum Diisi"}
                  </span>
                  {profile.phone &&
                    (profile.isPhoneVerified ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold">
                        ✓ Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowOtpModal(true)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-bold transition-all"
                      >
                        Verifikasi
                      </button>
                    ))}
                </div>
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
            💡 Untuk mengubah nama pemilik, telepon, dan kategori usaha klik
            tombol <b className="text-[#5F1E1E]">EDIT PROFIL</b>.
          </div>
        </div>

        {/* Card Kanan: Informasi Usaha & Peta Lokasi */}
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

          <div className="bg-slate-50 p-3 rounded-xl text-xs flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Lokasi Usaha</span>
              <span className="font-extrabold text-[#5F1E1E] text-xs">
                {profile.location}
              </span>
            </div>

            <div
              ref={mainMapContainerRef}
              className="w-full h-44 rounded-xl border border-slate-200 z-0 shadow-inner"
            ></div>
          </div>
        </div>
      </div>

      {/* SECTION BAWAH: PENGATURAN KEAMANAN AKUN (ACCORDION INTERAKTIF) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4 transition-all">
        <div
          onClick={() => setIsSecurityOpen(!isSecurityOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5F1E1E]/10 flex items-center justify-center text-[#5F1E1E] font-bold text-base">
              ⚙️
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
            <span>
              {isSecurityOpen ? "Tutup Pengaturan" : "Kelola Keamanan"}
            </span>
            <span className="text-xs">{isSecurityOpen ? "▲" : "▼"}</span>
          </button>
        </div>

        {/* ISI PENGATURAN (MUNCUL KETIKA DIKLIK) */}
        {isSecurityOpen && (
          <div className="border-t border-slate-100 pt-5 flex flex-col gap-5 animate-fadeIn">
            {/* Pilihan Tab Menu */}
            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setActiveSecurityTab("email")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSecurityTab === "email"
                    ? "bg-[#5F1E1E] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Ganti Email
              </button>

              <button
                type="button"
                onClick={() => setActiveSecurityTab("password")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSecurityTab === "password"
                    ? "bg-[#5F1E1E] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Ubah Kata Sandi
              </button>

              <button
                type="button"
                onClick={() => setActiveSecurityTab("danger")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSecurityTab === "danger"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-red-50 text-red-600 hover:bg-red-100"
                }`}
              >
                Zona Bahaya (Hapus Akun)
              </button>
            </div>

            {/* Konten Tab 1: Ganti Email */}
            {activeSecurityTab === "email" && (
              <form
                onSubmit={handleUpdateEmail}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 max-w-lg"
              >
                <div>
                  <h3 className="text-xs font-extrabold text-[#5F1E1E] uppercase mb-1">
                    Ganti Email Terdaftar
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Email aktif saat ini:{" "}
                    <b className="text-slate-700">{profile.email}</b>
                  </p>

                  <input
                    type="email"
                    placeholder="Masukkan Email Baru"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#B48328]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Simpan Email Baru
                  </button>
                </div>
              </form>
            )}

            {/* Konten Tab 2: Ganti Password */}
            {activeSecurityTab === "password" && (
              <form
                onSubmit={handleUpdatePassword}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 max-w-lg"
              >
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#B48328]"
                    />
                    <input
                      type="password"
                      placeholder="Konfirmasi Kata Sandi Baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#B48328]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Ubah Kata Sandi
                  </button>
                </div>
              </form>
            )}

            {/* Konten Tab 3: Hapus Akun */}
            {activeSecurityTab === "danger" && (
              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex flex-col gap-4 max-w-lg">
                <div>
                  <h3 className="text-xs font-extrabold text-red-700 uppercase mb-1">
                    Tindakan Permanen: Hapus Akun
                  </h3>
                  <p className="text-[11px] text-red-600/80 leading-relaxed">
                    Menghapus akun akan memusnahkan seluruh akses dashboard dan
                    data usaha Anda secara otomatis. Tindakan ini tidak dapat
                    dibatalkan!
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Hapus Akun Permanen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OVERLAY MODAL EDIT PROFIL (BACKGROUND BLUR) */}
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

              {/* EDIT LOKASI INTERAKTIF */}
              <div>
                <label className="block text-xs font-bold text-[#5F1E1E] uppercase mb-1.5">
                  Cari / Pilih Lokasi Usaha di Peta
                </label>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    name="location"
                    placeholder="Ketik alamat/kota lalu klik Cari"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B48328]"
                  />
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    className="bg-[#B48328] hover:bg-[#966b1e] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Cari Peta
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mb-2">
                  💡 *Klik di peta atau geser pin penanda untuk lokasi presisi.*
                </p>

                <div
                  ref={mapContainerRef}
                  className="w-full h-52 rounded-xl border border-slate-200 z-0"
                ></div>
              </div>

              {/* Action Buttons */}
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
