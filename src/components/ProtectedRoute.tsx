import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function ProtectedRoute() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#E8D3A7] flex items-center justify-center font-bold text-[#5F1E1E]">
                Memeriksa Sesi Login...
            </div>
        );
    }

    // Jika belum login di Firebase, lempar kembali ke /login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}