import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#5F1E1E] flex items-center justify-center text-[#E8D3A7]">
          <Users size={20} />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">
            Pelanggan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola data pelanggan toko Anda
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-100 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-[#5F1E1E]/5 flex items-center justify-center text-[#5F1E1E]/40">
          <Users size={32} />
        </div>
        <h2 className="text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
          Modul Pelanggan
        </h2>
        <p className="text-sm text-slate-500 max-w-md">
          Fitur pengelolaan pelanggan akan segera tersedia. Pantau terus
          pembaruan Zura untuk menikmati modul ini.
        </p>
      </div>
    </div>
  );
}