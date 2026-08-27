import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../config/firebase";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  image: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    image: "/sideBar/dashboard.svg",
  },
  {
    id: "rekap",
    label: "Penjualan",
    path: "/rekap",
    image: "/sideBar/rekapPenjualan.svg",
  },
  {
    id: "inventory",
    label: "Manajemen Stok\nPusat",
    path: "/inventory",
    image: "/sideBar/manajemenStok.svg",
  },
  {
    id: "finance",
    label: "Laporan Keuangan &\nLaba Rugi",
    path: "/finance",
    image: "/sideBar/laporanKeuangan.svg",
  },
  {
    id: "ai-insights",
    label: "AI Insight Hub",
    path: "/ai-insights",
    image: "/sideBar/aiInsight.svg",
  },

  {
    id: "profile",
    label: "Profil Pengguna",
    path: "/profile",
    image: "/sideBar/profile.svg",
  },
];

// ─── NavBar Component ─────────────────────────────────────────────────────────

export default function NavBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Insialisasi TanStack Query Client
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);

      queryClient.clear();
      localStorage.clear();

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Gagal keluar dari sesi:", error);
    }
  };

  return (
    <>
      {/* 1. Top Bar for Mobile Screens (visible on < md) */}
      <header className="flex md:hidden items-center justify-between w-full h-16 bg-[#5F1E1E] px-4 border-b border-white/10 flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Zura Logo"
            className="w-10 h-10 object-contain pointer-events-none"
          />
          <span className="font-extrabold text-sm tracking-widest text-[#E8D3A7]">
            ZURA RETAIL
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-white hover:text-[#E8D3A7] focus:outline-none"
          aria-label="Buka Menu Navigasi"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* 2. Mobile Navigation Drawer (visible on < md when open) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu Container */}
          <div className="relative flex flex-col w-64 max-w-[80vw] h-full bg-[#5F1E1E] text-white shadow-2xl p-4 transition-transform duration-300 ease-out z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Zura Logo"
                  className="w-8 h-8 object-contain pointer-events-none"
                />
                <span className="font-extrabold text-xs tracking-wider text-[#E8D3A7]">
                  ZURA RETAIL
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-[#E8D3A7] font-bold text-xl p-1 focus:outline-none"
                aria-label="Tutup Menu Navigasi"
              >
                &times;
              </button>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto">
              <ul className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/dashboard"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 leading-snug",
                          isActive
                            ? "border-2 border-[#E8D3A7] text-[#E8D3A7] bg-transparent font-semibold shadow-sm"
                            : "text-white/80 border border-transparent hover:text-[#E8D3A7]",
                        ].join(" ")
                      }
                    >
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={item.id}
                          className="max-w-full max-h-full object-contain pointer-events-none"
                        />
                      </div>
                      <span className="whitespace-pre-line tracking-wide">
                        {item.label}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Logout Button */}
            <div className="border-t border-white/20 pt-4 mt-auto">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold text-white/90 hover:text-[#E8D3A7] hover:bg-white/10 transition-all focus:outline-none"
              >
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                  <img
                    src="/sideBar/logOut.png"
                    alt="Logout"
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />
                </div>
                <span className="font-dmsans text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Standard Navigation Sidebar for Desktop (visible on >= md) */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="hidden md:flex flex-col w-64 h-screen bg-[#5F1E1E] text-white flex-shrink-0 select-none justify-between"
      >
        {/* Bagian Atas: Logo & Menu List */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-center py-5 px-4 border-b border-white/20">
            <img
              src="/logo.png"
              alt="Zura Logo"
              className="w-20 h-20 object-contain pointer-events-none"
            />
          </div>

          <ul className="flex flex-col gap-3 px-3 py-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 leading-snug",
                      isActive
                        ? "border-2 border-[#E8D3A7] text-[#E8D3A7] bg-transparent font-semibold shadow-sm"
                        : "text-white/80 border border-transparent hover:text-[#E8D3A7]",
                    ].join(" ")
                  }
                >
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.id}
                      className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                  </div>

                  <span className="whitespace-pre-line tracking-wide">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Bagian Bawah: Tombol Logout */}
        <div className="p-3 border-t border-white/20 bg-[#5F1E1E] flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold text-white/90 hover:text-[#E8D3A7] hover:bg-white/10 transition-all focus:outline-none"
          >
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
              <img
                src="/sideBar/logOut.png"
                alt="Logout"
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
            </div>
            <span className="font-dmsans text-sm">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}