import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function MenuPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigasi 6 tombol menu sesuai rute di App.tsx
  const menuGridItems = [
    { title: "DASHBOARD", image: "/dashboard.svg", path: "/dashboard" },
    { title: "REKAP PENJUALAN", image: "/rekapPenjualan.svg", path: "/rekap" },
    {
      title: "MANAJEMEN STOK",
      image: "/manajemenStok.svg",
      path: "/inventory",
    },
    {
      title: "LAPORAN KEUANGAN",
      image: "/laporanKeuangan.svg",
      path: "/finance",
    },
    { title: "CRM", image: "/crm.svg", path: "/customers" },
    { title: "AI Insight Hub", image: "/aiInsight.svg", path: "/ai-insights" },
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#5F1E1E] text-white font-sans overflow-hidden flex flex-col justify-between select-none">
      <div
        className="absolute top-0 left-0 w-40 h-40 md:w-72 md:h-72 bg-contain bg-no-repeat opacity-60 md:opacity-80 pointer-events-none -translate-x-6 -translate-y-6 md:-translate-x-10 md:-translate-y-10 z-0"
        style={{ backgroundImage: `url('/ukiran.png')` }}
      />
      <div
        className="absolute top-0 right-0 w-44 h-44 md:w-80 md:h-80 bg-contain bg-no-repeat opacity-60 md:opacity-80 pointer-events-none translate-x-6 -translate-y-6 md:translate-x-10 md:-translate-y-10 z-0"
        style={{ backgroundImage: `url('/ukiran.png')` }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-48 h-48 md:w-96 md:h-96 bg-contain bg-no-repeat opacity-60 md:opacity-80 pointer-events-none translate-y-12 md:translate-y-20 z-0"
        style={{ backgroundImage: `url('/ukiran.png')` }}
      />

      {/* Floating Dust */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/5 w-2 h-2 bg-yellow-300 rounded-full blur-[1px] opacity-70" />
        <div className="absolute top-2/3 left-1/2 w-3 h-3 bg-purple-300 rounded-full blur-[1px] opacity-50" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white rounded-full blur-[1px] opacity-60" />
      </div>

      {/* Navbar Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:py-4 md:px-12 bg-gradient-to-b from-[#5F1E1E]/90 to-transparent backdrop-blur-[2px]">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="Zura Logo"
            onClick={() => navigate("/")}
            className="cursor-pointer w-10 h-10 md:w-16 md:h-16 object-contain hover:scale-105 transition-transform"
          />
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex space-x-6 lg:space-x-8 text-sm font-medium items-center">
          <button
            onClick={() => navigate("/")}
            className="text-white/80 hover:text-[#E8D3A7] py-1 px-5 md:py-1.5 md:px-6 rounded-full transition-all duration-300 font-medium"
          >
            Home
          </button>

          <button className="border-2 md:border-[3px] border-[#E8D3A7] text-[#E8D3A7] py-1 px-5 md:py-1.5 md:px-6 rounded-full transition-all duration-300 bg-transparent font-medium">
            Menu
          </button>
        </div>

        {/* Right Side: LOGIN + Mobile Toggle */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="border-2 md:border-[3px] border-[#E8D3A7] text-[#E8D3A7] hover:bg-[#E8D3A7] hover:text-[#5F1E1E] text-xs md:text-sm font-bold px-5 py-1.5 md:px-8 md:py-2 rounded-full transition-all duration-300 bg-transparent tracking-wider"
          >
            LOGIN
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-14 right-3 w-44 rounded-xl shadow-2xl p-3 space-y-1 bg-[#5F1E1E] border border-[#E8D3A7]/30">
            <button
              onClick={() => {
                navigate("/");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left text-sm px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all"
            >
              Home
            </button>
            <button className="w-full text-left text-sm px-3 py-2 rounded-lg border border-[#E8D3A7] text-[#E8D3A7] font-semibold transition-all">
              Menu
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Grid 6 Tombol Menu */}
      <main className="relative z-10 w-full h-full flex items-center justify-center px-6 md:px-12 pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12 max-w-3xl w-full mx-auto">
          {menuGridItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="group relative w-full aspect-square bg-white hover:bg-[#F5E8CE] rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.3)] p-6 flex items-center justify-center transition-all duration-300 hover:scale-105 focus:outline-none overflow-hidden"
            >
              <div className="w-full h-full flex items-center justify-center p-2">
                <img
                  src={item.image}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain pointer-events-none scale-90 -translate-y-1"
                />
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
