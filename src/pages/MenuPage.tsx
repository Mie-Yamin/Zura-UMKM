import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function MenuPage() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Daftar Menu Utama
    const menuItems = [
        { title: "DASHBOARD", image: "/landingPage/dashboard.svg", path: "/dashboard" },
        { title: "REKAP PENJUALAN", image: "/landingPage/rekapPenjualan.svg", path: "/rekap" },
        { title: "MANAJEMEN STOK", image: "/landingPage/manajemenStok.svg", path: "/inventory" },
        { title: "LAPORAN KEUANGAN", image: "/landingPage/laporanKeuangan.svg", path: "/finance" },
        { title: "AI Insight Hub", image: "/landingPage/aiInsight.svg", path: "/ai-insights" },
    ];

    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#5F1E1E] text-white font-sans overflow-hidden flex flex-col justify-between select-none">
            {/* Background Ornaments */}
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

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:py-4 md:px-12 bg-gradient-to-b from-[#5F1E1E]/90 to-transparent backdrop-blur-[2px]">
                <div className="flex items-center space-x-2">
                    <img
                        src="/logo.png"
                        alt="Zura Logo"
                        onClick={() => navigate("/")}
                        className="cursor-pointer w-10 h-10 md:w-16 md:h-16 object-contain hover:scale-105 transition-transform"
                    />
                </div>

                <div className="hidden md:flex space-x-6 lg:space-x-8 text-sm font-medium items-center">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-white/80 hover:text-[#E8D3A7] py-1 px-5 md:py-1.5 md:px-6 rounded-full transition-all duration-300 font-medium cursor-pointer"
                    >
                        Home
                    </button>
                    <button
                        type="button"
                        className="border-2 md:border-[3px] border-[#E8D3A7] text-[#E8D3A7] py-1 px-5 md:py-1.5 md:px-6 rounded-full transition-all duration-300 bg-transparent font-medium cursor-pointer"
                    >
                        Menu
                    </button>
                </div>

                <div className="flex items-center space-x-2 md:space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="border-2 md:border-[3px] border-[#E8D3A7] text-[#E8D3A7] hover:bg-[#E8D3A7] hover:text-[#5F1E1E] text-xs md:text-sm font-bold px-5 py-1.5 md:px-8 md:py-2 rounded-full transition-all duration-300 bg-transparent tracking-wider cursor-pointer"
                    >
                        LOGIN
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                            type="button"
                            onClick={() => {
                                navigate("/");
                                setMobileMenuOpen(false);
                            }}
                            className="w-full text-left text-sm px-3 py-2 rounded-lg text-[#E8D3A7] hover:bg-white/10 transition-all cursor-pointer font-medium"
                        >
                            Home
                        </button>
                        <button
                            type="button"
                            className="w-full text-left text-sm px-3 py-2 rounded-lg border border-[#E8D3A7] text-[#E8D3A7] font-semibold transition-all cursor-pointer"
                        >
                            Menu
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Layout */}
            <main className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 pt-20 pb-8 overflow-y-auto">

                <div className="md:hidden max-w-3xl w-full grid grid-cols-2 gap-4 sm:gap-6 justify-items-center">
                    {menuItems.map((item, index) => {
                        const isLastItem = index === menuItems.length - 1;
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => navigate(item.path)}
                                className={`group relative w-full max-w-[170px] aspect-square bg-white hover:bg-[#F5E8CE] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.25)] p-3 flex items-center justify-center transition-all duration-300 active:scale-95 focus:outline-none overflow-hidden cursor-pointer ${isLastItem ? "col-span-2 justify-self-center w-1/2" : ""
                                    }`}
                            >
                                <div className="w-full h-full flex items-center justify-center p-1">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="max-w-full max-h-full object-contain pointer-events-none scale-95"
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="hidden md:flex flex-col gap-6 w-full max-w-4xl items-center justify-center">
                    {/* Baris Atas: 3 Kotak */}
                    <div className="flex justify-center items-center gap-6 lg:gap-8 w-full">
                        {menuItems.slice(0, 3).map((item, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => navigate(item.path)}
                                className="group relative w-48 h-48 lg:w-56 lg:h-56 bg-white hover:bg-[#F5E8CE] rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.3)] p-6 flex items-center justify-center transition-all duration-300 hover:scale-105 focus:outline-none overflow-hidden cursor-pointer shrink-0"
                            >
                                <div className="w-full h-full flex items-center justify-center p-2">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="max-w-full max-h-full object-contain pointer-events-none transform group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Baris Bawah: 2 Kotak (Center Aligned) */}
                    <div className="flex justify-center items-center gap-6 lg:gap-8 w-full">
                        {menuItems.slice(3, 5).map((item, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => navigate(item.path)}
                                className="group relative w-48 h-48 lg:w-56 lg:h-56 bg-white hover:bg-[#F5E8CE] rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.3)] p-6 flex items-center justify-center transition-all duration-300 hover:scale-105 focus:outline-none overflow-hidden cursor-pointer shrink-0"
                            >
                                <div className="w-full h-full flex items-center justify-center p-2">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="max-w-full max-h-full object-contain pointer-events-none transform group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}