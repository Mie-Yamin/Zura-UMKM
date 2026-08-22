import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithPopup
} from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { auth, googleProvider } from '../config/firebase';

export default function LoginPage() {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            console.error('Auth Error:', err.code, err.message);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setErrorMsg('Email atau password salah.');
            } else if (err.code === 'auth/email-already-in-use') {
                setErrorMsg('Email sudah terdaftar. Silakan login.');
            } else if (err.code === 'auth/weak-password') {
                setErrorMsg('Password minimal 6 karakter.');
            } else {
                setErrorMsg(err.message);
            }
        }
    };

    const handleGoogleLogin = async () => {
        setErrorMsg('');
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            console.error('Google Sign-In Error:', err);
            if (err.code !== 'auth/popup-closed-by-user') {
                setErrorMsg('Gagal masuk dengan Google: ' + err.message);
            }
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            alert('Silakan isi kolom email terlebih dahulu.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert(`Link reset password telah dikirim ke ${email}. Cek folder Spam jika tidak ada di Inbox.`);
        } catch (err: any) {
            console.error('Reset Error:', err.code);
            if (err.code === 'auth/too-many-requests') {
                alert('Terlalu banyak percobaan. Silakan tunggu beberapa menit.');
            } else if (err.code === 'auth/user-not-found') {
                alert('Email ini belum terdaftar.');
            } else {
                alert(`Gagal: ${err.message}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#5F1E1E] flex items-center justify-center p-4 sm:p-6 font-dmsans overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md shadow-2xl my-auto">
                {/* Header & Logo */}
                <div className="flex flex-col items-center mb-5 sm:mb-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#5F1E1E] rounded-2xl flex items-center justify-center p-2 mb-2 sm:mb-3 shadow-md">
                        <img src="/logo.png" alt="Zura Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#5F1E1E] uppercase tracking-wide text-center">
                        {isRegister ? 'Daftar Akun Zura' : 'Login Zura Retail'}
                    </h1>
                    <p className="text-[11px] sm:text-xs text-[#B26227] text-center mt-1 px-2">
                        {isRegister
                            ? 'Buat akun baru untuk mengelola bisnis retail Anda.'
                            : 'Masukkan email dan password untuk mengelola toko.'}
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-2.5 sm:p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl text-center leading-tight">
                        {errorMsg}
                    </div>
                )}

                {/* Form Login / Register */}
                <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                    <div>
                        <label className="block text-[10px] sm:text-xs font-bold text-[#5F1E1E] uppercase tracking-wider mb-1">
                            Email Toko
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-blue-50/50 border border-transparent focus:border-[#5F1E1E] focus:bg-white text-xs sm:text-sm outline-none transition-all"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] sm:text-xs font-bold text-[#5F1E1E] uppercase tracking-wider">
                                Password
                            </label>
                            {!isRegister && (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-[10px] sm:text-xs font-semibold text-[#B26227] hover:underline cursor-pointer"
                                >
                                    Lupa Password?
                                </button>
                            )}
                        </div>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-3.5 pr-10 py-2.5 sm:pl-4 sm:pr-11 sm:py-3 rounded-xl border border-gray-200 focus:border-[#5F1E1E] text-xs sm:text-sm outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 sm:right-3 text-gray-400 hover:text-[#5F1E1E] focus:outline-none cursor-pointer p-1"
                                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                ) : (
                                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2.5 sm:py-3 bg-[#5F1E1E] hover:bg-[#4A1717] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 mt-2 cursor-pointer"
                    >
                        {isRegister ? 'Daftar Sekarang' : 'Masuk ke Dashboard'}
                    </button>
                </form>

                {/* Pembatas / Divider */}
                <div className="my-4 sm:my-5 flex items-center justify-between">
                    <span className="w-1/4 border-b border-gray-200"></span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">atau</span>
                    <span className="w-1/4 border-b border-gray-200"></span>
                </div>

                {/* Tombol Masuk dengan Google */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-xs cursor-pointer"
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google Logo"
                        className="w-4 h-4"
                    />
                    <span>Masuk dengan Google</span>
                </button>

                {/* Toggle Login / Register */}
                <div className="mt-5 sm:mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setErrorMsg('');
                        }}
                        className="text-xs font-semibold text-[#5F1E1E] hover:underline cursor-pointer"
                    >
                        {isRegister
                            ? 'Sudah punya akun? Login di sini'
                            : 'Belum punya akun? Daftar akun baru'}
                    </button>
                </div>
            </div>
        </div>
    );
}