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
import {
  fetchUserSettings,
  updateUserSettings,
  fetchUserProfile,
  updateUserProfile
} from "../api/client";
import { readStoredJSON, writeStoredJSON, STORAGE_KEYS } from "../utils/storage";
import { DEFAULT_BUSINESS_CATEGORIES } from "../components/profile/types";
import type { UserProfile, SopTask, SopTemplateKey } from "../components/profile/types";
import ProfileInfoCard from "../components/profile/ProfileInfoCard";
import SopChecklistCard from "../components/profile/SopChecklistCard";
import SecuritySettingsSection from "../components/profile/SecuritySettingsSection";
import ReauthModal from "../components/profile/ReauthModal";
import EditProfileModal from "../components/profile/EditProfileModal";

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
    const saved = readStoredJSON<Partial<UserProfile> | null>(
      STORAGE_KEYS.PROFILE,
      null
    );
    return saved ? { ...INITIAL_PROFILE, ...saved } : INITIAL_PROFILE;
  });

  const [sopTasks, setSopTasks] = useState<SopTask[]>(() =>
    readStoredJSON(STORAGE_KEYS.SOP_CHECKLIST, DEFAULT_SOP)
  );

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

  // 1. Ambil Profil dari Firestore saat Auth siap
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userEmail = user.email || "";
        const emailIsVerified = user.emailVerified;
        const autoName =
          user.displayName || userEmail.split("@")[0] || "Pengguna Zura";

        // Tarik data profil dari Firestore
        const remoteProfile = await fetchUserProfile();

        setProfile((prev) => {
          const finalName = remoteProfile?.name || prev.name || autoName;
          const finalPhone = remoteProfile?.phone || prev.phone || "";
          const finalCategory = remoteProfile?.category || prev.category || "Lainnya";

          const updated: UserProfile = {
            name: finalName,
            email: userEmail,
            phone: finalPhone,
            category: finalCategory,
            isEmailVerified: emailIsVerified,
          };

          writeStoredJSON(STORAGE_KEYS.PROFILE, updated);
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

  // 2. Ambil Checklist SOP dari Cloud Settings
  useEffect(() => {
    fetchUserSettings().then((settings) => {
      if (settings && Array.isArray(settings.sopTasks) && settings.sopTasks.length > 0) {
        setSopTasks(settings.sopTasks);
        writeStoredJSON(STORAGE_KEYS.SOP_CHECKLIST, settings.sopTasks);
      }
    });
  }, []);

  const saveSopTasks = (tasks: SopTask[]) => {
    setSopTasks(tasks);
    writeStoredJSON(STORAGE_KEYS.SOP_CHECKLIST, tasks);
    updateUserSettings({ sopTasks: tasks });
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

  const handleApplyTemplate = (categoryKey: SopTemplateKey) => {
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

  // 3. Simpan Profil ke Firestore & Local Cache
  const handleSaveProfile = async (e: React.FormEvent) => {
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
      // Simpan ke Firestore
      await updateUserProfile({
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        category: updatedProfile.category,
      });

      // Simpan ke cache lokal
      writeStoredJSON(STORAGE_KEYS.PROFILE, updatedProfile);
      showToast("Profil berhasil diperbarui dan disinkronkan!");
    } catch (err) {
      console.error("Gagal simpan profil ke Firestore:", err);
      showToast("Profil tersimpan lokal, gagal sinkron ke cloud.");
    }

    setIsEditOpen(false);
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
            className="flex-1 md:flex-none bg-[#5F1E1E] hover:bg-[#4a1717] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            EDIT PROFIL
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* SECTION INFORMASI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* KARTU INFORMASI PROFIL */}
        <ProfileInfoCard
          profile={profile}
          onSendVerification={handleSendEmailVerification}
        />

        {/* SOP CHECKLIST KUSTOM & REKOMENDASI */}
        <SopChecklistCard
          sopTasks={sopTasks}
          showTemplates={showTemplates}
          newTaskLabel={newTaskLabel}
          setNewTaskLabel={setNewTaskLabel}
          onToggleTask={toggleSopTask}
          onDeleteTask={handleDeleteTask}
          onResetChecklist={handleResetChecklist}
          onAddTask={handleAddTask}
          onApplyTemplate={handleApplyTemplate}
          onToggleTemplates={() => setShowTemplates(!showTemplates)}
        />
      </div>

      {/* PENGATURAN KEAMANAN AKUN */}
      <SecuritySettingsSection
        isOpen={isSecurityOpen}
        onToggleOpen={() => setIsSecurityOpen(!isSecurityOpen)}
        activeTab={activeSecurityTab}
        onTabChange={setActiveSecurityTab}
        profileEmail={profile.email}
        isGoogleUser={auth.currentUser?.providerData.some(
          (p) => p.providerId === "google.com"
        ) ?? false}
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        isDeleting={isDeleting}
        onSubmitEmail={triggerEmailUpdate}
        onSubmitPassword={triggerPasswordUpdate}
        onDeleteAccount={triggerAccountDelete}
      />

      {/* MODAL RE-AUTHENTICATION */}
      <ReauthModal
        open={showReauthModal}
        value={currentPasswordInput}
        onChange={setCurrentPasswordInput}
        onSubmit={handleReauthenticateAndExecute}
        onClose={() => setShowReauthModal(false)}
      />

      {/* MODAL EDIT PROFIL */}
      <EditProfileModal
        open={isEditOpen}
        formData={formData}
        isCustomCategoryMode={isCustomCategoryMode}
        customCategoryInput={customCategoryInput}
        onInputChange={handleInputChange}
        onSelectStandardCategory={(cat) => {
          setIsCustomCategoryMode(false);
          setFormData((prev) => ({ ...prev, category: cat }));
        }}
        onSelectCustomMode={() => setIsCustomCategoryMode(true)}
        setCustomCategoryInput={setCustomCategoryInput}
        onSubmit={handleSaveProfile}
        onClose={() => setIsEditOpen(false)}
      />
    </div>
  );
}