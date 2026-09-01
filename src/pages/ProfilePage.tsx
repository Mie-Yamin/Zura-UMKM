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
import { fetchUserSettings, updateUserSettings } from "../api/client";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  category: string;
  isEmailVerified: boolean;
}

interface SopTask {
  id: string;
  label: string;
  completed: boolean;
}

const DEFAULT_BUSINESS_CATEGORIES = [
  "Makanan & Minuman (F&B)",
  "Pakaian & Fashion",
  "Ritel / Toko Kelontong",
  "Jasa & Pelayanan",
  "Kecantikan & Kesehatan",
];

const INITIAL_PROFILE: UserProfile = {
  name: "Pengguna Zura",
  email: "",
  phone: "",
  category: "Lainnya",
  isEmailVerified: false,
};

const DEFAULT_SOP: SopTask[] = [
  { id: "1", label: "Cek stok kritis & restock barang di gudang", completed: false },
  { id: "2", label: "Rekap transaksi harian dari marketplace / POS", completed: false },
  { id: "3", label: "Cetak resi & kemas pesanan sebelum kirim", completed: false },
  { id: "4", label: "Verifikasi Laporan Keuangan & Laba Rugi", completed: false },
];

const SOP_TEMPLATES = {
  online: [
    "Cek obrolan / pesan masuk dari calon pembeli",
    "Update nomor resi pengiriman marketplace",
    "Ganti foto banner promo toko",
  ],
  fnb: [
    "Cek tanggal kadaluarsa stok bahan baku",
    "Bersihkan area kasir & mesin EDC / QRIS",
    "Hitung uang kas masuk & kembalian",
  ],
  monthly: [
    "Cek tagihan sewa tempat & listrik harian",
    "Audit fisik persediaan stok (Stok Opname)",
    "Evaluasi produk terlaris vs deadstock",
  ],
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

  const [sopTasks, setSopTasks] = useState<SopTask[]>(() => {
    try {
      const saved = localStorage.getItem("zura_sop_checklist");
      return saved ? JSON.parse(saved) : DEFAULT_SOP;
    } catch {
      return DEFAULT_SOP;
    }
  });

  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchUserSettings().then((settings) => {
      if (settings && Array.isArray(settings.sopTasks) && settings.sopTasks.length > 0) {
        setSopTasks(settings.sopTasks);
        localStorage.setItem("zura_sop_checklist", JSON.stringify(settings.sopTasks));
      }
    });
  }, []);

  const saveSopTasks = (tasks: SopTask[]) => {
    setSopTasks(tasks);
    try {
      localStorage.setItem("zura_sop_checklist", JSON.stringify(tasks));
      updateUserSettings({ sopTasks: tasks });
    } catch (e) {
      console.error("Gagal simpan SOP", e);
    }
  };

  const toggleSopTask = (id: string) => {
    const updated = sopTasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveSopTasks(updated);
  };

  const handleResetChecklist = () => {
    const resetTasks = sopTasks.map((t) => ({ ...t, completed: false }));
    saveSopTasks(resetTasks);
    showToast("Semua centang tugas berhasil direset!");
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskLabel.trim()) return;

    const newTask: SopTask = {
      id: Date.now().toString(),
      label: newTaskLabel.trim(),
      completed: false,
    };

    saveSopTasks([...sopTasks, newTask]);
    setNewTaskLabel("");
    showToast("Tugas kustom berhasil ditambahkan!");
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sopTasks.filter((t) => t.id !== id);
    saveSopTasks(updated);
    showToast("Tugas berhasil dihapus");
  };

  const handleApplyTemplate = (categoryKey: keyof typeof SOP_TEMPLATES) => {
    const templateItems = SOP_TEMPLATES[categoryKey];
    const newItems: SopTask[] = templateItems.map((text, index) => ({
      id: `${Date.now()}-${index}`,
      label: text,
      completed: false,
    }));

    saveSopTasks([...sopTasks, ...newItems]);
    setShowTemplates(false);
    showToast("Rekomendasi tugas berhasil ditambahkan!");
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

  const handleOpenEditModal = () => {
    setFormData(profile);
    const isStandard = DEFAULT_BUSINESS_CATEGORIES.includes(profile.category);
    if (isStandard) {
      setIsCustomCategoryMode(false);
      setCustomCategoryInput("");
    } else {
      setIsCustomCategoryMode(true);
      setCustomCategoryInput(profile.category === "Lainnya" ? "" : profile.category);
    }
    setIsEditOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCategory = formData.category;
    if (isCustomCategoryMode) {
      finalCategory = customCategoryInput.trim() || "Lainnya";
    }

    const updatedProfile = {
      ...formData,
      category: finalCategory,
    };

    setProfile(updatedProfile);
    try {
      localStorage.setItem("user_profile_data", JSON.stringify(updatedProfile));
    } catch (err) {
      console.error("Gagal simpan local", err);
    }
    setIsEditOpen(false);
    showToast("Profil berhasil diperbarui!");
  };

  return (
    <div className="relative min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-6 flex flex-col gap-4 sm:gap-6 font-dmsans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-lg text-sm gap-2 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Header Utama */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-lg md:text-2xl font-extrabold text-[#5F1E1E] tracking-tight uppercase">
            PROFIL PENGGUNA
          </h1>
          <p className="text-xs md:text-sm font-medium text-[#B48328] mt-1">
            Kelola Informasi Akun Dan Detail Usaha
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="flex-1 md:flex-none bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            EDIT PROFIL
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* SECTION INFORMASI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
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

        {/* SOP CHECKLIST KUSTOM & REKOMENDASI */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between gap-4 border border-slate-100">
          <div>
            {/* Header Checklist */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#5F1E1E] uppercase tracking-wide">
                  Checklist Operasional Harian Toko
                </h2>
                <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                  {sopTasks.filter((t) => t.completed).length} / {sopTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-[#5F1E1E] bg-slate-100 px-2.5 py-1.5 rounded-xl transition-all"
                  title="Kosongkan semua centang"
                >
                  🔄 Reset
                </button>

                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-[10px] sm:text-[11px] font-bold text-[#B48328] hover:text-[#5F1E1E] bg-[#E8D3A7]/30 px-3 py-1.5 rounded-xl transition-all border border-[#B48328]/30 flex items-center gap-1"
                >
                  <span>💡 Rekomendasi SOP</span>
                  <span>{showTemplates ? "▲" : "▼"}</span>
                </button>
              </div>
            </div>

            {/* Panel Pilihan Template SOP */}
            {showTemplates && (
              <div className="bg-[#FFFDF9] border-2 border-[#B48328]/40 p-3.5 rounded-2xl mb-4 flex flex-col gap-2.5 animate-scaleUp text-xs">
                <span className="font-extrabold text-[#5F1E1E] text-[10px] uppercase">
                  PILIH TEMPLATE TUGAS REKOMENDASI:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("online")}
                    className="p-2.5 bg-white border border-slate-200 hover:border-[#5F1E1E] rounded-xl text-left font-bold text-[#5F1E1E] transition-all hover:shadow-sm"
                  >
                    🛒 Toko Online
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                      Chat, Resi & Banner
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("fnb")}
                    className="p-2.5 bg-white border border-slate-200 hover:border-[#5F1E1E] rounded-xl text-left font-bold text-[#5F1E1E] transition-all hover:shadow-sm"
                  >
                    🍵 F&B / Toko Fisik
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                      Kadaluarsa & Kasir
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("monthly")}
                    className="p-2.5 bg-white border border-slate-200 hover:border-[#5F1E1E] rounded-xl text-left font-bold text-[#5F1E1E] transition-all hover:shadow-sm"
                  >
                    📅 Rutin / Akhir Bulan
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                      Stok Opname & Tagihan
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Form Input Tambah Tugas Kustom */}
            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                placeholder="Tambah tugas operasional baru..."
                value={newTaskLabel}
                onChange={(e) => setNewTaskLabel(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-[#B48328]"
              />
              <button
                type="submit"
                className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-extrabold text-xs px-4 py-2.5 sm:py-2 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
              >
                + Tambah
              </button>
            </form>

            {/* List Item Checklist */}
            <div className="flex flex-col gap-2 max-h-[260px] sm:max-h-[220px] overflow-y-auto pr-1">
              {sopTasks.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold border border-dashed rounded-xl">
                  Belum ada tugas operasional. Klik <b>Rekomendasi SOP</b> di atas untuk menambahkan tugas.
                </div>
              ) : (
                sopTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleSopTask(task.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-xs font-semibold ${task.completed
                        ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                        : "bg-[#FFFDF9] border-[#B48328]/40 text-[#5F1E1E] hover:border-[#B48328]"
                      }`}
                  >
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 sm:mt-0 ${task.completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-[#B48328] bg-white text-transparent"
                          }`}
                      >
                        ✓
                      </span>
                      <span className="leading-snug break-words text-[11px] sm:text-xs">{task.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-center">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal">
                        {task.completed ? "Selesai" : "Pending"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="text-slate-300 hover:text-red-600 transition-colors p-1 text-sm font-bold"
                        title="Hapus Tugas"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Catatan Kaki SOP */}
          <div className="bg-[#E8D3A7]/20 p-3 rounded-xl border border-[#B48328]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] mt-2">
            <span className="text-[#5F1E1E] font-bold shrink-0">📋 SOP Usaha Mandiri</span>
            <span className="text-slate-600">Gunakan tombol "🔄 Reset" untuk mengulang daftar centang harian.</span>
          </div>
        </div>
      </div>

      {/* PENGATURAN KEAMANAN AKUN */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col gap-4 sm:gap-5">
        <div
          onClick={() => setIsSecurityOpen(!isSecurityOpen)}
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
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#5F1E1E] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-1 sm:mt-0"
          >
            <span>{isSecurityOpen ? "Tutup Pengaturan ▲" : "Kelola Keamanan ▼"}</span>
          </button>
        </div>

        {isSecurityOpen && (
          <div className="flex flex-col gap-4 sm:gap-5 pt-2 border-t border-slate-100 sm:border-0">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                type="button"
                onClick={() => setActiveSecurityTab("email")}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${activeSecurityTab === "email"
                    ? "bg-[#5F1E1E] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                Ganti Email
              </button>

              <button
                type="button"
                onClick={() => setActiveSecurityTab("password")}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${activeSecurityTab === "password"
                    ? "bg-[#5F1E1E] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                Ubah Kata Sandi
              </button>

              <button
                type="button"
                onClick={() => setActiveSecurityTab("danger")}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${activeSecurityTab === "danger"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
              >
                Zona Bahaya (Hapus Akun)
              </button>
            </div>

            {activeSecurityTab === "email" && (
              <form
                onSubmit={triggerEmailUpdate}
                className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 max-w-xl w-full"
              >
                <div>
                  <h3 className="text-xs font-extrabold text-[#5F1E1E] uppercase mb-1">
                    Ganti Email Terdaftar
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-3 break-all">
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
                    className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Simpan Email Baru
                  </button>
                </div>
              </form>
            )}

            {activeSecurityTab === "password" && (
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 max-w-xl w-full">
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
                        className="w-full sm:w-auto bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        Ubah Kata Sandi
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeSecurityTab === "danger" && (
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
                    onClick={triggerAccountDelete}
                    disabled={isDeleting}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
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

      {/* ─── 💥 MODAL EDIT PROFIL (KATEGORI CUSTOM & TANPA ALAMAT) 💥 ─── */}
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

              {/* KATEGORI USAHA BISA DICUSTOM */}
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
                        onChange={() => {
                          setIsCustomCategoryMode(false);
                          setFormData((prev) => ({ ...prev, category: cat }));
                        }}
                        className="accent-[#5F1E1E]"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}

                  {/* OPSI KATEGORI CUSTOM (LAINNYA) */}
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
                      onChange={() => {
                        setIsCustomCategoryMode(true);
                      }}
                      className="accent-[#5F1E1E]"
                    />
                    <span>➕ Lainnya / Ketik Custom...</span>
                  </label>
                </div>

                {/* INPUT TEXT UNTUK KATEGORI CUSTOM */}
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