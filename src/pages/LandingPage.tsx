import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, TrendingDown, Users } from 'lucide-react';

export default function AntiGravityLandingPage() {
  const navigate = useNavigate();

  const products = [
    {
      name: 'TEH BOTOL',
      image: 'https://images.tokopedia.net/img/cache/700/VqbcmM/2021/11/17/572cbf08-f40b-4dc1-beea-2ef83c8ffbf8.png'
    },
    {
      name: 'MIE GORENG',
      image: 'https://images.tokopedia.net/img/cache/700/OALuTo/2020/12/3/c88746c8-53e3-4b68-ab68-3d207399432f.png'
    },
    {
      name: 'BENG - BENG',
      image: 'https://images.tokopedia.net/img/cache/700/VqbcmM/2021/4/27/c887201c-6d87-43ca-a387-9556ee252fdf.png'
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#575F1E] text-white font-sans overflow-hidden flex flex-col justify-between p-6 md:px-12 select-none">

      {/* Dynamic Floating Keyframe Styles */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-4deg); }
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        .animate-float-slow { animation: floatSlow 6s ease-in-out infinite; }
        .animate-float-reverse { animation: floatReverse 7s ease-in-out infinite; }
        .animate-float-fast { animation: floatFast 4s ease-in-out infinite; }
      `}</style>

      {/* Background Ornament Overlays - Anti-Gravity Floating */}
      <div
        className="absolute top-0 left-0 w-72 h-72 bg-contain bg-no-repeat opacity-80 pointer-events-none -translate-x-10 -translate-y-10 animate-float-slow"
        style={{ backgroundImage: `url('/ukiran.png')` }}
      />
      <div
        className="absolute top-0 right-0 w-80 h-80 bg-contain bg-no-repeat opacity-80 pointer-events-none translate-x-10 -translate-y-10 animate-float-reverse"
        style={{ backgroundImage: `url('/ukiran.png')` }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-96 h-96 bg-contain bg-no-repeat opacity-80 pointer-events-none translate-y-20 animate-float-slow"
        style={{ backgroundImage: `url('/ukiran.png')` }}
      />

      {/* Floating Dust Particles Effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/5 w-2 h-2 bg-yellow-300 rounded-full blur-[1px] opacity-70 animate-float-fast" />
        <div className="absolute top-2/3 left-1/2 w-3 h-3 bg-purple-300 rounded-full blur-[1px] opacity-50 animate-float-reverse" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white rounded-full blur-[1px] opacity-60 animate-float-slow" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between pt-0 pb-4">
        <div className="flex items-center space-x-2">
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Zura Logo"
            onClick={() => navigate('/')}
            className="cursor-pointer w-16 h-16 object-contain hover:scale-105 transition-transform"
          />
        </div>

        <div className="hidden md:flex space-x-8 text-sm font-medium">
          <a href="#home" className="hover:text-purple-200 transition">Home</a>
          <button onClick={() => navigate('/pos')} className="hover:text-purple-200 transition">Sales</button>
          <button onClick={() => navigate('/inventory')} className="hover:text-purple-200 transition">Inventory</button>
          <button onClick={() => navigate('/customers')} className="hover:text-purple-200 transition">Customers</button>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="bg-black hover:bg-gray-900 text-white text-sm font-bold px-8 py-2.5 rounded-full transition shadow-lg hover:shadow-purple-900/50"
        >
          LOGIN
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center my-auto py-8">

        {/* Left Column: Typography & CTA */}
        <div className="space-y-6 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight drop-shadow-md">
            Kelola Usaha Lebih Mudah,
            <br />
            <span className="text-yellow-300">
              Pantau & Prediksi Secara Real-Time.
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-lg">
            Pantau transaksi, stok barang, dan keuntungan usaha kamu
            dalam satu dashboard terpadu.
          </p>
          <div className="flex items-center space-x-4 pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-black hover:bg-gray-900 text-white font-semibold text-sm px-6 py-3 rounded-full transition shadow-xl hover:-translate-y-1"
            >
              Cek Selengkapnya
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-11 h-11 bg-black hover:bg-gray-900 rounded-full flex items-center justify-center transition shadow-xl hover:-translate-y-1"
            >
              <Play className="w-5 h-5 text-white fill-current translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Anti-Gravity Floating Dashboard Cards */}
        <div className="relative w-full max-w-lg mx-auto h-[440px]">

          {/* Top Floating Card: Analytics & Chart */}
          <div className="absolute top-0 left-0 w-4/5 bg-white/95 backdrop-blur-md text-gray-800 rounded-xl p-4 shadow-2xl z-10 animate-float-slow -rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-neutral-800 text-white p-2 rounded-md text-center">
                <p className="text-[10px] text-gray-300">Today's Revenue</p>
                <p className="text-xs font-bold text-red-400 flex items-center justify-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Rp 6.700.000
                </p>
              </div>
              <div className="bg-neutral-800 text-white p-2 rounded-md text-center">
                <p className="text-[10px] text-gray-300">Transaction</p>
                <p className="text-xs font-bold flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> 2902
                </p>
              </div>
              <div className="bg-neutral-800 text-white p-2 rounded-md text-center flex flex-col justify-center items-center">
                <p className="text-[10px] text-gray-300">Best Seller</p>
                <img
                  src="https://images.tokopedia.net/img/cache/700/OALuTo/2020/12/3/c88746c8-53e3-4b68-ab68-3d207399432f.png"
                  alt="Best Seller"
                  className="w-5 h-5 object-contain mt-1 animate-pulse"
                />
              </div>
            </div>

            {/* Simulated Chart */}
            <div className="h-32 border-b border-l border-gray-400 relative flex items-end p-2">
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

          {/* Bottom Floating Overlay Card: Daftar Produk */}
          <div className="absolute bottom-2 right-0 w-4/5 bg-white/95 backdrop-blur-md text-gray-800 rounded-xl p-5 shadow-2xl z-20 animate-float-reverse rotate-3 hover:rotate-0 transition-transform duration-500">
            <h2 className="text-lg font-black text-center mb-4 tracking-wider">DAFTAR PRODUK</h2>
            <div className="grid grid-cols-3 gap-3">
              {products.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center group">
                  {/* Floating Product Image Container */}
                  <div className="bg-[#8E24AA] w-full aspect-square rounded-xl p-2 flex items-center justify-center mb-2 shadow-md group-hover:-translate-y-2 group-hover:shadow-lg transition-all duration-300">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full object-contain animate-float-fast"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight mb-1">{item.name}</span>
                  <button
                    onClick={() => navigate('/inventory')}
                    className="bg-black text-white text-[8px] px-2 py-0.5 rounded-full hover:bg-gray-800 transition"
                  >
                    Cek Rincian &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Carousel Dots */}
      <div className="relative z-10 flex justify-center items-center space-x-3 py-4">
        <span className="w-4 h-4 bg-white rounded-full cursor-pointer shadow-md animate-float-fast"></span>
        <span className="w-3.5 h-3.5 bg-black rounded-full cursor-pointer opacity-80 hover:opacity-100 transition"></span>
        <span className="w-3.5 h-3.5 bg-black rounded-full cursor-pointer opacity-80 hover:opacity-100 transition"></span>
        <span className="w-3.5 h-3.5 bg-black rounded-full cursor-pointer opacity-80 hover:opacity-100 transition"></span>
        <span className="w-3.5 h-3.5 bg-black rounded-full cursor-pointer opacity-80 hover:opacity-100 transition"></span>
      </div>
    </div>
  );
}
