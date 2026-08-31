import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { auth } from '../config/firebase';

export default function AntiGravityLandingPage() {
  const navigate = useNavigate();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = React.useState<'home' | 'menu'>('home');
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Menggunakan file SVG dari folder public/preview/
  const slideScreenshots = [
    {
      image: '/preview/PageDashboard.svg',
      alt: 'Dashboard Overview',
    },
    {
      image: '/preview/PageRecap.svg',
      alt: 'Rekap Penjualan',
    },
    {
      image: '/preview/PageStok.svg',
      alt: 'Manajemen Stok',
    },
    {
      image: '/preview/PageFinance.svg',
      alt: 'Laporan Keuangan',
    },
    {
      image: '/preview/PageAi.svg',
      alt: 'AI Insight & Prediksi',
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

  // Komponen Bingkai Gambar Berhias Emas
  const ImageFrame = ({ src, alt }: { src: string; alt: string }) => (
    <div className="relative w-full max-w-lg sm:max-w-xl lg:max-w-2xl mx-auto flex items-center justify-center p-2 sm:p-4">

      {/* Glow Effect */}
      <div className="absolute inset-2 bg-[#E8D3A7]/20 rounded-3xl blur-2xl pointer-events-none" />

      {/* Outer Decorative Container */}
      <div className="relative w-full aspect-[16/9] bg-gradient-to-b from-[#702424] to-[#4A1717] rounded-2xl p-2.5 sm:p-3.5 border-2 border-[#E8D3A7]/60 shadow-[0_0_30px_rgba(232,211,167,0.2)] group transition-all duration-500 hover:shadow-[0_0_40px_rgba(232,211,167,0.35)] flex flex-col overflow-hidden">

        {/* Hiasan Ornamen Klasik */}
        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-[#E8D3A7] rounded-tl-lg pointer-events-none z-10" />
        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-[#E8D3A7] rounded-tr-lg pointer-events-none z-10" />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-[#E8D3A7] rounded-bl-lg pointer-events-none z-10" />
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-[#E8D3A7] rounded-br-lg pointer-events-none z-10" />

        {/* Top Window Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8D3A7]/20 px-1 shrink-0 z-10">
          <div className="flex space-x-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#E8D3A7]" />
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#E8D3A7]/60" />
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#E8D3A7]/30" />
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-widest text-[#E8D3A7]/70 font-dmsans uppercase">
            Preview Interface
          </span>
        </div>

        {/* Container Gambar Utama */}
        <div className="relative flex-1 w-full bg-black/40 rounded-xl overflow-hidden border border-[#E8D3A7]/30">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto transform -translate-y-6 sm:-translate-y-10 scale-105 transition-transform duration-500 group-hover:scale-110"
          /* 👆 -translate-y-6 memaksa gambar bergeser naik ke atas! Ubah nilainya (-translate-y-8 / -translate-y-12) jika kurang naik */
          />
        </div>
      </div>
    </div>
  );

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
            {auth.currentUser ? 'LOGIN' : 'LOGIN'}
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

            <ImageFrame src={slideScreenshots[0].image} alt={slideScreenshots[0].alt} />
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

            <ImageFrame src={slideScreenshots[1].image} alt={slideScreenshots[1].alt} />
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

            <ImageFrame src={slideScreenshots[2].image} alt={slideScreenshots[2].alt} />
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

            <ImageFrame src={slideScreenshots[3].image} alt={slideScreenshots[3].alt} />
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

            <ImageFrame src={slideScreenshots[4].image} alt={slideScreenshots[4].alt} />
          </div>
        </section>

      </div>

      {/* Carousel Dots - 5 TITIK */}
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