import { NavLink } from 'react-router-dom';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  image: string;
}

// ─── Nav Items List dengan Gambar dari Folder Public ─────────────────────────

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    image: '/sideBar/dashboard.svg'
  },
  {
    id: 'rekap',
    label: 'Penjualan',
    path: '/rekap',
    image: '/sideBar/rekapPenjualan.svg'
  },
  {
    id: 'inventory',
    label: 'Manajemen Stok\nPusat',
    path: '/inventory',
    image: '/sideBar/manajemenStok.svg'
  },
  {
    id: 'finance',
    label: 'Laporan Keuangan &\nLaba Rugi',
    path: '/finance',
    image: '/sideBar/laporanKeuangan.svg'
  },
  {
    id: 'customers',
    label: 'CRM & Database\nPelanggan',
    path: '/customers',
    image: '/sideBar/crm.svg'
  },
  {
    id: 'ai-insights',
    label: 'AI Insight Hub',
    path: '/ai-insights',
    image: '/sideBar/aiInsight.svg'
  },
];

// ─── NavBar Component ─────────────────────────────────────────────────────────

export default function NavBar() {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="flex flex-col w-64 h-full bg-[#5F1E1E] text-white flex-shrink-0 select-none overflow-y-auto"
    >
      {/* Header Logo Zura */}
      <div className="flex items-center justify-center py-5 px-4 border-b border-white/20">
        <img
          src="/logo.png"
          alt="Zura Logo"
          className="w-20 h-20 object-contain pointer-events-none"
        />
      </div>

      {/* Navigasi Menu Sidebar */}
      <ul className="flex flex-col gap-3 px-3 py-6">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 leading-snug',
                  isActive
                    ? 'border-2 border-[#E8D3A7] text-[#E8D3A7] bg-transparent font-semibold shadow-sm'
                    : 'text-white/80 border border-transparent hover:text-[#E8D3A7]',
                ].join(' ')
              }
            >
              {/* Gambar Ikon dari Public */}
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.id}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              </div>

              {/* Teks Label Navigasi */}
              <span className="whitespace-pre-line tracking-wide">
                {item.label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}