import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
} from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../config/firebase";

export default function LoginPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            queryClient.clear();
            localStorage.clear();

            await signInWithEmailAndPassword(auth, email.trim(), password);
            navigate("/dashboard", { replace: true });
        } catch (error: any) {
            console.error("Login error:", error.code);
            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password"
            ) {
                showToast("Email atau password yang Anda masukkan salah.");
            } else if (error.code === "auth/too-many-requests") {
                showToast("Terlalu banyak percobaan gagal. Silakan coba lagi nanti.");
            } else {
                showToast("Gagal masuk: " + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast("Konfirmasi password tidak cocok!");
            return;
        }
        if (password.length < 6) {
            showToast("Password minimal 6 karakter!");
            return;
        }

        setIsLoading(true);

        try {
            queryClient.clear();
            localStorage.clear();

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            if (name.trim()) {
                await updateProfile(userCredential.user, {
                    displayName: name.trim(),
                });
            }

            showToast("Akun berhasil dibuat! Silakan masuk.");
            setIsRegisterMode(false);
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Register error:", error.code);
            if (error.code === "auth/email-already-in-use") {
                showToast("Email ini sudah terdaftar. Silakan login.");
            } else if (error.code === "auth/invalid-email") {
                showToast("Format email tidak valid.");
            } else {
                showToast("Gagal mendaftar: " + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });

            queryClient.clear();
            localStorage.clear();

            await signInWithPopup(auth, provider);
            navigate("/dashboard", { replace: true });
        } catch (error: any) {
            console.error("Google Auth Error:", error);
            if (error.code !== "auth/popup-closed-by-user") {
                showToast("Gagal masuk dengan Google: " + error.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#5F1E1E] text-[#0F172A] p-4 flex items-center justify-center font-dmsans">

            {/* Toast Alert */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center bg-white text-[#5F1E1E] px-4 py-3 rounded-xl shadow-xl border border-red-200 text-xs gap-2 animate-bounce font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    {toastMessage}
                </div>
            )}

            {/* Card Form Putih */}
            <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-2xl w-full max-w-[430px] flex flex-col gap-6">

                {/* Header Logo Dalam Kotak Maroon */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-[#5F1E1E] rounded-2xl flex items-center justify-center mb-4 shadow-md">
                        <img src="/logo.png" alt="Zura Logo" className="w-10 h-10 object-contain" />
                    </div>

                    <h1 className="text-xl font-extrabold text-[#5F1E1E] tracking-tight uppercase">
                        {isRegisterMode ? "BUAT AKUN ZURA RETAIL" : "LOGIN ZURA RETAIL"}
                    </h1>
                    <p className="text-xs text-[#B48328] font-medium mt-1">
                        {isRegisterMode
                            ? "Lengkapi data untuk mendaftarkan toko."
                            : "Masukkan email dan password untuk mengelola toko."}
                    </p>
                </div>

                {/* Form Login / Register */}
                <form
                    onSubmit={isRegisterMode ? handleRegister : handleEmailLogin}
                    className="flex flex-col gap-4 text-xs"
                >
                    {isRegisterMode && (
                        <div className="flex flex-col gap-1.5">
                            <label className="font-extrabold text-[#5F1E1E] uppercase text-[11px] tracking-wider">
                                NAMA TOKO / PEMILIK
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Masukkan nama toko Anda"
                                className="bg-[#F0F5FF] border border-transparent rounded-xl px-4 py-3 font-normal text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#B48328] focus:bg-white transition-all text-xs"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="font-extrabold text-[#5F1E1E] uppercase text-[11px] tracking-wider">
                            EMAIL TOKO
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="nama@email.com"
                            className="bg-[#F0F5FF] border border-transparent rounded-xl px-4 py-3 font-normal text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#B48328] focus:bg-white transition-all text-xs"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                            <label className="font-extrabold text-[#5F1E1E] uppercase text-[11px] tracking-wider">
                                PASSWORD
                            </label>
                            {!isRegisterMode && (
                                <button
                                    type="button"
                                    onClick={() => showToast("Gunakan opsi login Google jika Anda lupa password.")}
                                    className="text-[11px] font-bold text-[#B48328] hover:underline"
                                >
                                    Lupa Password?
                                </button>
                            )}
                        </div>

                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#F0F5FF] border border-transparent rounded-xl pl-4 pr-10 py-3 font-normal text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#B48328] focus:bg-white transition-all text-xs"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {isRegisterMode && (
                        <div className="flex flex-col gap-1.5">
                            <label className="font-extrabold text-[#5F1E1E] uppercase text-[11px] tracking-wider">
                                KONFIRMASI PASSWORD
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="Ulangi password"
                                className="bg-[#F0F5FF] border border-transparent rounded-xl px-4 py-3 font-normal text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#B48328] focus:bg-white transition-all text-xs"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Tombol Utama */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 bg-[#5F1E1E] hover:bg-[#4a1717] text-white font-extrabold py-3.5 px-4 rounded-xl text-xs transition-all shadow-md active:scale-95 flex justify-center items-center min-h-[44px]"
                    >
                        {isLoading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : isRegisterMode ? (
                            "Daftar Akun Baru"
                        ) : (
                            "Masuk ke Dashboard"
                        )}
                    </button>
                </form>

                {/* Opsi Login Google (MUNCUL HANYA SAAT MODE LOGIN) */}
                {!isRegisterMode && (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] bg-slate-200 flex-1"></div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ATAU</span>
                            <div className="h-[1px] bg-slate-200 flex-1"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleAuth}
                            className="flex items-center justify-center gap-2.5 bg-white border border-slate-300 hover:border-slate-400 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all min-h-[44px] shadow-sm"
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google Logo"
                                className="w-4 h-4"
                            />
                            Masuk dengan Google
                        </button>
                    </>
                )}

                {/* Switch Mode Flow */}
                <div className="text-center text-xs font-semibold text-slate-600">
                    {isRegisterMode ? (
                        <p>
                            Sudah punya akun?{" "}
                            <button
                                type="button"
                                onClick={() => setIsRegisterMode(false)}
                                className="text-[#B48328] font-bold hover:underline"
                            >
                                Masuk di sini
                            </button>
                        </p>
                    ) : (
                        <p>
                            Belum punya akun?{" "}
                            <button
                                type="button"
                                onClick={() => setIsRegisterMode(true)}
                                className="text-[#B48328] font-bold hover:underline"
                            >
                                Daftar akun baru
                            </button>
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}