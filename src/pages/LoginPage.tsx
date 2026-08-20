// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/dashboard');
        } catch (err: any) {
            console.error("Firebase Auth Error Code:", err.code);
            console.error("Firebase Error Message:", err.message);

            if (err.code === 'auth/operation-not-allowed') {
                setErrorMsg('Metode Email/Password belum diaktifkan di Firebase Console.');
            } else if (err.code === 'auth/invalid-credential') {
                setErrorMsg('Email atau password salah.');
            } else if (err.code === 'auth/email-already-in-use') {
                setErrorMsg('Email sudah terdaftar. Silakan login.');
            } else if (err.code === 'auth/weak-password') {
                setErrorMsg('Password minimal 6 karakter.');
            } else {
                setErrorMsg(`Gagal: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            alert('Silakan masukkan email Anda di kolom email terlebih dahulu.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert(`Link reset password telah dikirim ke ${email}`);
        } catch (err: any) {
            alert('Gagal mengirim email reset password. Pastikan email benar.');
        }
    };

    return (
        <div className="min-h-screen bg-[#5F1E1E] flex items-center justify-center p-4 font-dmsans">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#B48328]/30 flex flex-col gap-6">

                {/* Header Logo dengan Kotak Merah Zura */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#5F1E1E] rounded-2xl flex items-center justify-center p-2.5 shadow-md border border-[#B48328]/40 hover:scale-105 transition-transform">
                        <img
                            src="/logo.png"
                            alt="Zura Logo"
                            className="w-full h-full object-contain drop-shadow"
                        />
                    </div>
                    <h1 className="text-xl md:text-2xl font-black text-[#5F1E1E] uppercase tracking-wide">
                        {isRegistering ? 'Daftar Akun Zura' : 'Login Zura Retail'}
                    </h1>
                    <p className="text-xs text-[#B48328] font-semibold">
                        {isRegistering
                            ? 'Buat akun baru untuk mengelola bisnis retail Anda.'
                            : 'Masukkan email dan password untuk mengelola toko.'}
                    </p>
                </div>

                {/* Warning Error */}
                {errorMsg && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-extrabold border border-red-200">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {/* Form Email & Password */}
                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-extrabold text-[#5F1E1E] uppercase tracking-wider">Email Toko</label>
                        <input
                            type="email"
                            placeholder="nama@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="p-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#5F1E1E] focus:ring-1 focus:ring-[#5F1E1E]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-extrabold text-[#5F1E1E] uppercase tracking-wider">Password</label>
                            {!isRegistering && (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-[11px] font-bold text-[#B48328] hover:underline"
                                >
                                    Lupa Password?
                                </button>
                            )}
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="p-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#5F1E1E] focus:ring-1 focus:ring-[#5F1E1E]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#5F1E1E] text-[#E8D3A7] py-3.5 rounded-xl font-bold text-sm hover:bg-[#4a1717] transition-all shadow-md active:scale-95 mt-2"
                    >
                        {loading
                            ? 'Memproses...'
                            : isRegistering
                                ? 'Daftar Sekarang'
                                : 'Masuk ke Dashboard'}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div className="text-center pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setErrorMsg(null);
                        }}
                        className="text-xs font-extrabold text-[#5F1E1E] hover:underline"
                    >
                        {isRegistering
                            ? 'Sudah punya akun? Login di sini'
                            : 'Belum punya akun? Daftar akun baru'}
                    </button>
                </div>

            </div>
        </div>
    );
}