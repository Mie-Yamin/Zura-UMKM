import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, Users, Menu, X } from 'lucide-react';
import { auth } from '../config/firebase';

export default function AntiGravityLandingPage() {
  const navigate = useNavigate();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = React.useState<'home' | 'menu'>('home');
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const products = [
    {
      name: 'TEH BOTOL',
      image: 'https://images.tokopedia.net/img/cache/700/VqbcmM/2021/11/17/572cbf08-f40b-4dc1-beea-2ef83c8ffbf8.png',
    },
    {
      name: 'MIE GORENG',
      image: 'https://images.tokopedia.net/img/cache/700/OALuTo/2020/12/3/c88746c8-53e3-4b68-ab68-3d207399432f.png',
    },
    {
      name: 'BENG - BENG',
      image: 'https://images.tokopedia.net/img/cache/700/VqbcmM/2021/4/27/c887201c-6d87-43ca-a387-9556ee252fdf.png',
    },
  ];

  // Capture vertical mouse wheel scroll and convert it to horizontal scroll
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Update active slide index based on scroll position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const width = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const index = Math.round(scrollLeft / width);
    setCurrentSlideIndex(index);
  };

  // Scroll smoothly to a slide index (0 - 4)
  const scrollToSlide = (index: number) => {
    const container = scrollContainerRef.current;
    if (container) {
      const width = container.clientWidth;
      container.scrollTo({
        left: index * width,
        behavior: 'smooth',
      });
    }
    setActiveSection('home');
    setMobileMenuOpen(false);
  };

  // Handler Tombol Login (Pindah ke /login atau /dashboard jika sudah auth)
  const handleLoginClick = () => {
    if (auth.currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#5F1E1E] text-white font-sans overflow-hidden flex flex-col justify-between select-none transition-colors duration-500">

      {/* Hide Scrollbar style */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Background Ornament */}
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
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:py-4 md:px-12 bg-gradient-to-b from-[#5F1E1E]/90 to-transparent backdrop-blur-[2px] transition-colors duration-500">

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="Zura Logo"
            onClick={() => scrollToSlide(0)}
            className="cursor-pointer w-10 h-10 md:w-16 md:h-16 object-contain hover:scale-105 transition-transform"
          />
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex space-x-6 lg:space-x-8 text-sm font-medium font-dmsans items-center">
          <button
            type="button"
            onClick={() => scrollToSlide(0)}
            className={
              activeSection === 'home'
                ? "border-2 md:border-[3px] border-[#E8D3A7] text-[#E8D3A7] py-1 px-5 md:py-1.5 md:px-6 rounded-full transition-all duration-300 bg-transparent font-medium cursor-pointer"
                : "text-white/80 hover:text-[#E8D3A7] py-1 px-5 md:py-1.5 md:px-6 rounded-full transition-all duration-300 font-medium cursor-pointer"
            }
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('menu');
              navigate('/menu');
            }}
            className={
              activeSection === 'menu'
                ? "border-2 md:border-[3px] border-[#E8D3A7] text-[#E8D3A7] py-1 px-5 md:py-1.5 md:px-6 rounded-full transition-all duration-300 bg-transparent font-medium cursor-pointer"
                : "text-white/80 hover:text-[#E8D3A7] py-1 px-5 md:py-1.5 md:px-6 rounded-full transition-all duration-300 font-medium cursor-pointer"
            }
          >
            Menu
          </button>
        </div>

        {/* Right Side: LOGIN + Hamburger */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            type="button"
            onClick={handleLoginClick}
            className="relative z-50 border-2 md:border-[3px] border-[#E8D3A7] text-[#E8D3A7] hover:bg-[#E8D3A7] hover:text-[#5F1E1E] text-xs md:text-sm font-bold font-dmsans px-5 py-1.5 md:px-8 md:py-2 rounded-full transition-all duration-300 bg-transparent tracking-wider cursor-pointer active:scale-95"
          >
            {auth.currentUser ? 'DASHBOARD' : 'LOGIN'}
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-14 right-3 w-44 rounded-xl shadow-2xl p-3 space-y-1 bg-[#5F1E1E] border border-[#E8D3A7]/30">
            <button
              type="button"
              onClick={() => scrollToSlide(0)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all font-dmsans cursor-pointer ${activeSection === 'home' ? 'border border-[#E8D3A7] text-[#E8D3A7] font-semibold' : 'text-white hover:bg-white/10'
                }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection('menu');
                navigate('/menu');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all font-dmsans cursor-pointer ${activeSection === 'menu' ? 'border border-[#E8D3A7] text-[#E8D3A7] font-semibold' : 'text-white hover:bg-white/10'
                }`}
            >
              Menu
            </button>
          </div>
        </div>
      )}

      {/* Horizontal Scroll Container (5 SECTIONS TOTAL) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth no-scrollbar z-10"
      >
        {/* SLIDE 1: HOME */}
        <section
          id="home"
          className="w-screen min-w-[100vw] h-screen flex-shrink-0 snap-start flex items-center overflow-hidden px-4 md:px-6 lg:px-12 pt-16 pb-14 md:pt-20 md:pb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-7xl mx-auto w-full">
            <div className="space-y-3 md:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight drop-shadow-md">
                Kelola Usaha Lebih Mudah,
                <br />
                <span className="text-yellow-300">
                  Pantau & Prediksi Secara Real-Time.
                </span>
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-white/80 leading-relaxed max-w-xs sm:max-w-sm md:max-w-lg">
                Pantau transaksi, stok barang, dan keuntungan usaha kamu dalam satu dashboard terpadu.
              </p>
              <div className="flex items-center space-x-3 md:space-x-4 pt-2 md:pt-4">
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="bg-[#E8D3A7] hover:bg-[#dec391] text-[#705244] font-bold text-xs md:text-sm px-4 py-2.5 md:px-6 md:py-3 rounded-full transition-all shadow-xl cursor-pointer active:scale-95"
                >
                  Cek Selengkapnya
                </button>
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="w-9 h-9 md:w-11 md:h-11 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center p-0 cursor-pointer"
                >
                  <img src="/playButton.png" alt="Play" className="w-full h-full object-contain" />
                </button>
              </div>
            </div>

            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto h-[280px] sm:h-[340px] md:h-[380px] lg:h-[440px]">
              <div className="absolute top-0 left-0 w-4/5 bg-white/95 backdrop-blur-md text-gray-800 rounded-xl p-3 md:p-4 shadow-2xl z-10">
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3 md:mb-4">
                  <div className="bg-neutral-800 text-white p-1.5 md:p-2 rounded-md text-center">
                    <p className="text-[8px] md:text-[10px] text-gray-300">Today's Revenue</p>
                    <p className="text-[10px] md:text-xs font-bold text-red-400 flex items-center justify-center gap-0.5 md:gap-1">
                      <TrendingDown className="w-2.5 h-2.5 md:w-3 md:h-3" /> Rp 6.700.000
                    </p>
                  </div>
                  <div className="bg-neutral-800 text-white p-1.5 md:p-2 rounded-md text-center">
                    <p className="text-[8px] md:text-[10px] text-gray-300">Transaction</p>
                    <p className="text-[10px] md:text-xs font-bold flex items-center justify-center gap-0.5 md:gap-1">
                      <Users className="w-2.5 h-2.5 md:w-3 md:h-3" /> 2902
                    </p>
                  </div>
                  <div className="bg-neutral-800 text-white p-1.5 md:p-2 rounded-md text-center flex flex-col justify-center items-center">
                    <p className="text-[8px] md:text-[10px] text-gray-300">Best Seller</p>
                    <img
                      src="https://images.tokopedia.net/img/cache/700/OALuTo/2020/12/3/c88746c8-53e3-4b68-ab68-3d207399432f.png"
                      alt="Best Seller"
                      className="w-4 h-4 md:w-5 md:h-5 object-contain mt-0.5 md:mt-1"
                    />
                  </div>
                </div>

                <div className="h-20 md:h-32 border-b border-l border-gray-400 relative flex items-end p-1.5 md:p-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                    <path
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M 0 35 L 25 20 L 50 40 L 75 10"
                    />
                    <path
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M 75 10 L 100 25"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-1 md:bottom-2 right-0 w-4/5 bg-white/95 backdrop-blur-md text-gray-800 rounded-xl p-3 md:p-5 shadow-2xl z-20">
                <h2 className="text-sm md:text-lg font-black text-center mb-2 md:mb-4 tracking-wider">DAFTAR PRODUK</h2>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {products.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center group">
                      <div className="bg-[#8E24AA] w-full aspect-square rounded-lg md:rounded-xl p-1.5 md:p-2 flex items-center justify-center mb-1.5 md:mb-2 shadow-md">
                        <img src={item.image} alt={item.name} className="max-h-full object-contain" />
                      </div>
                      <span className="text-[8px] md:text-[10px] font-bold text-center leading-tight mb-0.5 md:mb-1">{item.name}</span>
                      <button
                        type="button"
                        onClick={handleLoginClick}
                        className="bg-black text-white text-[7px] md:text-[8px] px-1.5 md:px-2 py-0.5 rounded-full hover:bg-gray-800 transition cursor-pointer"
                      >
                        Cek Rincian →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 2: SALES */}
        <section
          id="sales"
          className="w-screen min-w-[100vw] h-screen flex-shrink-0 snap-start flex items-center overflow-hidden px-4 md:px-6 lg:px-12 pt-16 pb-14 md:pt-20 md:pb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-7xl mx-auto w-full">
            <div className="space-y-3 md:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight drop-shadow-md">
                Kelola Penjualan
                <br />
                <span className="text-yellow-300">Lebih Mudah</span>
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-white/80 leading-relaxed max-w-xs sm:max-w-sm md:max-w-lg">
                Catat transaksi, pantau penjualan, dan lihat performa usaha kamu secara real-time.
              </p>
            </div>

            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto h-[280px] sm:h-[340px] md:h-[380px] lg:h-[440px]">
              <div className="w-full bg-white/95 backdrop-blur-md text-gray-800 rounded-xl p-3 md:p-5 shadow-2xl border border-gray-100 flex flex-col justify-between h-full">
                <div className="grid grid-cols-2 gap-2 md:gap-4 mb-2 md:mb-4">
                  <div className="bg-neutral-800 text-white p-2 md:p-3 rounded-lg text-center shadow-md">
                    <p className="text-[8px] md:text-[10px] text-gray-300 font-medium">Total Penjualan</p>
                    <p className="text-xs md:text-sm font-black text-emerald-400 mt-0.5 md:mt-1">Rp 24.500.000</p>
                    <span className="text-[8px] md:text-[9px] text-emerald-300 font-semibold block mt-0.5">+12.4% vs last week</span>
                  </div>
                  <div className="bg-neutral-800 text-white p-2 md:p-3 rounded-lg text-center shadow-md">
                    <p className="text-[8px] md:text-[10px] text-gray-300 font-medium">Total Transaksi</p>
                    <p className="text-xs md:text-sm font-black text-yellow-400 mt-0.5 md:mt-1">1,240 Transaksi</p>
                    <span className="text-[8px] md:text-[9px] text-yellow-300 font-semibold block mt-0.5">+8.1% vs last week</span>
                  </div>
                </div>

                <div className="flex-1 min-h-[80px] md:min-h-[140px] border-b border-l border-gray-300 relative flex items-end justify-around px-2 md:px-4 pt-2 md:pt-4 pb-1 bg-gray-50/50 rounded-lg mb-2 md:mb-4">
                  <div className="flex flex-col items-center w-6 md:w-8">
                    <div className="w-3 md:w-4 bg-emerald-500 rounded-t-sm h-8 md:h-12" />
                    <span className="text-[7px] md:text-[9px] font-bold text-gray-500 mt-0.5 md:mt-1">Sen</span>
                  </div>
                  <div className="flex flex-col items-center w-6 md:w-8">
                    <div className="w-3 md:w-4 bg-emerald-500 rounded-t-sm h-12 md:h-20" />
                    <span className="text-[7px] md:text-[9px] font-bold text-gray-500 mt-0.5 md:mt-1">Sel</span>
                  </div>
                  <div className="flex flex-col items-center w-6 md:w-8">
                    <div className="w-3 md:w-4 bg-emerald-500 rounded-t-sm h-10 md:h-16" />
                    <span className="text-[7px] md:text-[9px] font-bold text-gray-500 mt-0.5 md:mt-1">Rab</span>
                  </div>
                  <div className="flex flex-col items-center w-6 md:w-8">
                    <div className="w-3 md:w-4 bg-emerald-500 rounded-t-sm h-16 md:h-28" />
                    <span className="text-[7px] md:text-[9px] font-bold text-gray-500 mt-0.5 md:mt-1">Kam</span>
                  </div>
                  <div className="flex flex-col items-center w-6 md:w-8">
                    <div className="w-3 md:w-4 bg-emerald-600 rounded-t-sm h-14 md:h-24" />
                    <span className="text-[7px] md:text-[9px] font-bold text-gray-500 mt-0.5 md:mt-1">Jum</span>
                  </div>
                </div>

                <div className="bg-neutral-800 text-white rounded-lg p-2 md:p-3">
                  <div className="flex justify-between items-center border-b border-neutral-700 pb-1 md:pb-1.5 mb-1 md:mb-1.5">
                    <span className="text-[8px] md:text-[10px] font-black text-amber-400">TRANSAKSI TERBARU</span>
                    <span className="text-[7px] md:text-[9px] text-gray-400">Live POS</span>
                  </div>
                  <div className="space-y-0.5 md:space-y-1 text-[8px] md:text-[10px]">
                    <div className="flex justify-between">
                      <span>Teh Botol (3 pcs)</span>
                      <span className="font-bold text-emerald-400">Rp 15.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mie Goreng (2 pcs)</span>
                      <span className="font-bold text-emerald-400">Rp 7.000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 3: INVENTORY */}
        <section
          id="inventory"
          className="w-screen min-w-[100vw] h-screen flex-shrink-0 snap-start flex items-center overflow-hidden px-4 md:px-6 lg:px-12 pt-16 pb-14 md:pt-20 md:pb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-7xl mx-auto w-full">
            <div className="space-y-3 md:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight drop-shadow-md">
                Stok Terkontrol
                <br />
                <span className="text-yellow-300">Dengan AI</span>
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-white/80 leading-relaxed max-w-xs sm:max-w-sm md:max-w-lg">
                Pantau ketersediaan produk, kelola SKU, dan dapatkan prediksi kebutuhan stok otomatis menggunakan kecerdasan buatan.
              </p>
            </div>

            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto h-[280px] sm:h-[340px] md:h-[380px] lg:h-[440px]">
              <div className="w-full bg-white/95 backdrop-blur-md text-gray-800 rounded-xl p-3 md:p-5 shadow-2xl border border-gray-100 flex flex-col justify-between h-full">
                <div className="flex justify-between items-center mb-2 md:mb-4 border-b border-gray-200 pb-2 md:pb-3">
                  <div>
                    <h3 className="text-xs md:text-sm font-black tracking-wider text-neutral-700">STATUS INVENTORY</h3>
                    <p className="text-[8px] md:text-[10px] text-gray-500 font-medium">Auto-Sync Zura Cloud</p>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <span className="bg-red-100 text-red-700 text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full">4 Menipis</span>
                    <span className="bg-neutral-800 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full">158 SKU</span>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden mb-2 md:mb-4">
                  <table className="w-full text-left border-collapse text-[8px] md:text-[10px]">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-bold">
                        <th className="pb-1 md:pb-1.5 font-bold">Produk</th>
                        <th className="pb-1 md:pb-1.5 font-bold hidden sm:table-cell">SKU</th>
                        <th className="pb-1 md:pb-1.5 font-bold">Stok</th>
                        <th className="pb-1 md:pb-1.5 font-bold">Status</th>
                        <th className="pb-1 md:pb-1.5 font-bold hidden sm:table-cell">AI Forecast</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-neutral-800">
                      <tr>
                        <td className="py-1.5 md:py-2 flex items-center gap-1 md:gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          Teh Botol
                        </td>
                        <td className="py-1.5 md:py-2 text-gray-500 hidden sm:table-cell">TB-250ML</td>
                        <td className="py-1.5 md:py-2">120 Pcs</td>
                        <td className="py-1.5 md:py-2 text-emerald-600">Aman</td>
                        <td className="py-1.5 md:py-2 text-neutral-700 font-bold hidden sm:table-cell">Restock +50</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 md:py-2 flex items-center gap-1 md:gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          Mie Goreng
                        </td>
                        <td className="py-1.5 md:py-2 text-gray-500 hidden sm:table-cell">MG-IND</td>
                        <td className="py-1.5 md:py-2 font-bold text-red-600">8 Pcs</td>
                        <td className="py-1.5 md:py-2 text-red-600 font-bold">Menipis</td>
                        <td className="py-1.5 md:py-2 text-amber-600 font-extrabold hidden sm:table-cell">Restock +200!</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 md:py-2 flex items-center gap-1 md:gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          Beng-Beng
                        </td>
                        <td className="py-1.5 md:py-2 text-gray-500 hidden sm:table-cell">BB-20G</td>
                        <td className="py-1.5 md:py-2">45 Pcs</td>
                        <td className="py-1.5 md:py-2 text-emerald-600">Aman</td>
                        <td className="py-1.5 md:py-2 text-gray-400 font-normal hidden sm:table-cell">Aman</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 md:p-3 text-neutral-800">
                  <div className="flex items-center space-x-1.5 md:space-x-2 mb-0.5 md:mb-1">
                    <span className="text-[8px] md:text-[10px] font-bold text-amber-700">Rekomendasi Restock AI</span>
                    <span className="bg-amber-100 text-amber-800 text-[7px] md:text-[8px] px-1 md:px-1.5 py-0.5 rounded font-black">PENTING</span>
                  </div>
                  <p className="text-[8px] md:text-[9px] leading-relaxed text-neutral-600">
                    Lakukan pemesanan <strong>Mie Goreng (200 pcs)</strong> sebelum akhir pekan untuk menghindari kekosongan stok.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 4: LAPORAN KEUANGAN */}
        <section
          id="finance"
          className="w-screen min-w-[100vw] h-screen flex-shrink-0 snap-start flex items-center overflow-hidden px-4 md:px-6 lg:px-12 pt-16 pb-14 md:pt-20 md:pb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-7xl mx-auto w-full">
            <div className="space-y-3 md:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight drop-shadow-md">
                Laporan Keuangan
                <br />
                <span className="text-yellow-300">Otomatis & Akurat</span>
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-white/80 leading-relaxed max-w-xs sm:max-w-sm md:max-w-lg">
                Pantau laba rugi, arus kas, dan margin keuntungan harian secara otomatis tanpa perhitungan manual.
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-md text-gray-800 rounded-xl p-6 shadow-2xl">
              <h3 className="font-bold text-xl mb-2 text-neutral-800">Ringkasan Keuangan Toko</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Setiap transaksi terhubung langsung dengan catatan arus kas untuk memastikan keuangan ritel kamu selalu transparan.
              </p>
            </div>
          </div>
        </section>

        {/* SLIDE 5: AI INSIGHT & CTA */}
        <section
          id="ai-insight"
          className="w-screen min-w-[100vw] h-screen flex-shrink-0 snap-start flex items-center overflow-hidden px-4 md:px-6 lg:px-12 pt-16 pb-14 md:pt-20 md:pb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-7xl mx-auto w-full">
            <div className="space-y-3 md:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight drop-shadow-md">
                AI Insight & Prediksi
                <br />
                <span className="text-yellow-300">Mulai Bersama Zura</span>
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-white/80 leading-relaxed max-w-xs sm:max-w-sm md:max-w-lg">
                Gunakan rekomendasi bertenaga AI untuk memprediksi tren penjualan dan kelola toko kamu dengan lebih efisien.
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-md text-gray-800 rounded-xl p-6 shadow-2xl flex flex-col items-center text-center">
              <h3 className="font-bold text-xl mb-2 text-neutral-800">Siap Mengembangkan Usaha?</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Akses dashboard manajemen Zura Retail langsung dari browser kamu.
              </p>
              <button
                type="button"
                onClick={handleLoginClick}
                className="bg-[#5F1E1E] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#4A1717] transition-all cursor-pointer"
              >
                Masuk Sekarang
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Carousel Dots - DIBUAT 5 TITIK */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-end items-center space-x-2 md:space-x-3 py-4 md:py-6 px-8 md:px-16 lg:px-24 max-w-7xl mx-auto bg-gradient-to-t from-[#5F1E1E]/80 to-transparent transition-colors duration-500">
        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollToSlide(index)}
            className="p-1.5 focus:outline-none cursor-pointer"
          >
            <div
              className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full transition-all duration-300 ${currentSlideIndex === index
                  ? 'bg-[#ECDFC4] scale-110 shadow-md'
                  : 'bg-[#E5C88B] hover:opacity-80'
                }`}
            />
            <span className="sr-only">Slide {index + 1}</span>
          </button>
        ))}
      </div>

    </div>
  );
}