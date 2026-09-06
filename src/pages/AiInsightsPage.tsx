import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  Wallet,
} from 'lucide-react';
import { useRecaps, useProducts } from '../hooks/useBusinessData';
import { generateGrokInsights, AI_PRIVACY_NOTICE } from '../api/grokService';

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

// Parser inline markdown yang aman dari crash
const renderFormattedInline = (text: string) => {
  if (!text || typeof text !== 'string') return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-extrabold text-[#5F1E1E]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export default function AiInsightsPage() {
  const navigate = useNavigate();

  const { data: recaps = [], isLoading: loadingRecaps } = useRecaps();

  const { data: products = [], isLoading: loadingProducts } = useProducts();

  const { data: aiInsightsText, isLoading: loadingInsights } = useQuery({
    queryKey: ['ai-insights-report', products.length, recaps.length],
    queryFn: () => generateGrokInsights(products, recaps),
    enabled: products.length > 0 || recaps.length > 0,
  });

  const [selectedChannel, setSelectedChannel] = useState('Semua Saluran');

  // Metrik Ringkas AI
  const aiMetrics = useMemo(() => {
    const filteredRecaps =
      selectedChannel === 'Semua Saluran'
        ? recaps
        : recaps.filter((r) => r.source === selectedChannel);

    const totalOmzet = filteredRecaps.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalUnits = filteredRecaps.reduce((sum, r) => sum + (r.unitsSold || 0), 0);
    const totalAdminFee = filteredRecaps.reduce((sum, r) => sum + (r.adminFee || 0), 0);

    const understockCount = products.filter((p) => p.stockCount <= (p.minStock || 10)).length;
    const deadstockCount = products.filter((p) => p.isDeadstock === true).length;

    return {
      totalOmzet,
      totalUnits,
      totalAdminFee,
      understockCount,
      deadstockCount,
      totalSKU: products.length,
    };
  }, [recaps, products, selectedChannel]);

  // Robust Parser untuk 3 Kolom Eksekutif
  const executiveSummary = useMemo(() => {
    if (!aiInsightsText || typeof aiInsightsText !== 'string') return null;

    const lines = aiInsightsText.split('\n').map((l) => l.trim()).filter(Boolean);

    const financial: string[] = [];
    const inventory: string[] = [];
    const action: string[] = [];

    let currentSection: 'fin' | 'inv' | 'act' | null = null;

    lines.forEach((line) => {
      // Deteksi pergantian section
      if (/1\.\s+|finansial|saluran|omzet|keuangan/i.test(line) && line.length < 80) {
        currentSection = 'fin';
        return;
      }
      if (/2\.\s+|manajemen stok|risiko inventaris|inventaris/i.test(line) && line.length < 80) {
        currentSection = 'inv';
        return;
      }
      if (/3\.\s+|rekomendasi aksi|taktis|prioritas|langkah/i.test(line) && line.length < 80) {
        currentSection = 'act';
        return;
      }

      // Bersihkan bullet & spasi
      const clean = line.replace(/^[-*•–—]\s*/, '').replace(/^\d+\.\s*/, '').trim();

      if (clean && clean.length > 5 && !/semoga laporan ini|selamat berbisnis/i.test(clean)) {
        if (currentSection === 'fin') financial.push(clean);
        else if (currentSection === 'inv') inventory.push(clean);
        else if (currentSection === 'act') action.push(clean);
        else {
          // Fallback deteksi berdasarkan kata kunci
          if (/omzet|jual|transaksi|harga|rp|margin/i.test(clean)) financial.push(clean);
          else if (/stok|restock|deadstock|sku|unit/i.test(clean)) inventory.push(clean);
          else action.push(clean);
        }
      }
    });

    return { financial, inventory, action };
  }, [aiInsightsText]);

  return (
    <div className="min-h-screen bg-[#E8D3A7] text-[#0F172A] p-3 sm:p-5 md:p-6 flex flex-col gap-3 md:gap-5 font-dmsans w-full max-w-full overflow-x-hidden min-w-0">

      {/* HEADER UTAMA */}
      <header className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B48328] animate-pulse"></span>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#5F1E1E] uppercase tracking-tight">
              EXECUTIVE AI BUSINESS BRIEF
            </h1>
          </div>
          <p className="text-xs text-[#B48328] mt-1 font-medium">
            Laporan ringkas eksekutif performa bisnis dan arah strategi operasional UMKM.
          </p>
        </div>

        <select
          className="bg-slate-50 border-2 border-[#B48328] text-[#5F1E1E] font-bold rounded-xl px-3 py-2 text-xs focus:outline-none uppercase cursor-pointer"
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
        >
          <option value="Semua Saluran">Semua Saluran</option>
          <option value="Shopee">Shopee</option>
          <option value="Tokopedia">Tokopedia</option>
          <option value="TikTok Shop">TikTok Shop</option>
          <option value="Manual">Manual / POS</option>
        </select>
      </header>

      {/* Privacy Notice AI */}
      <div className="flex items-start gap-2 rounded-xl border border-[#B48328]/30 bg-[#B48328]/10 px-3 py-2 text-[10px] font-medium text-[#5F1E1E]/80">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#B48328]" />
        <p>{AI_PRIVACY_NOTICE}</p>
      </div>

      {/* METRICS ROW */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <article className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Omzet Berjalan</span>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#B48328] mt-1">{formatRupiah(aiMetrics.totalOmzet)}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{aiMetrics.totalUnits} Terjual</p>
        </article>

        <article className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Beban Komisi</span>
          <h3 className="text-lg sm:text-xl font-extrabold text-rose-600 mt-1">-{formatRupiah(aiMetrics.totalAdminFee)}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Admin Marketplace</p>
        </article>

        <article className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Stok Menipis</span>
          <h3 className="text-lg sm:text-xl font-extrabold text-rose-600 mt-1">{aiMetrics.understockCount} SKU</h3>
          <p className="text-[10px] text-rose-500 font-bold mt-0.5">Perlu Restock</p>
        </article>

        <article className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Stok Mengendap</span>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-600 mt-1">{aiMetrics.deadstockCount} SKU</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">30+ Hari</p>
        </article>
      </section>

      {/* EXECUTIVE SUMMARY BODY */}
      {loadingInsights || loadingRecaps || loadingProducts ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse flex flex-col gap-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-4/5"></div>
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          {/* Highlight Banner */}
          <div className="bg-gradient-to-r from-[#5F1E1E] to-[#3D1313] text-white p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8D3A7]/20 border border-[#E8D3A7]/30 flex items-center justify-center text-[#E8D3A7] shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8D3A7]">
                  Ringkasan Eksekutif Terkini
                </span>
                <h2 className="text-sm sm:text-base font-extrabold leading-snug mt-0.5">
                  {aiMetrics.understockCount > 0
                    ? `Perhatian: Ada ${aiMetrics.understockCount} SKU berpotensi kehilangan omzet jika tidak segera di-restock.`
                    : 'Kondisi inventaris sehat. Fokus utama adalah percepatan perputaran produk dan efisiensi margin.'}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="bg-[#E8D3A7] hover:bg-[#d8c08f] text-[#5F1E1E] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer self-stretch md:self-auto justify-center"
            >
              <span>Buka Inventaris</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 PILAR KARTU: PANJANG MENYESUAIKAN ISI (items-start) */}
          {executiveSummary ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

              {/* Pilar 1: Finansial & Saluran */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3 transition-all hover:shadow-md">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#B48328] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#5F1E1E] uppercase tracking-wide">
                    1. Finansial & Saluran
                  </h3>
                </div>

                {executiveSummary.financial.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {executiveSummary.financial.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80">
                        <span className="w-2 h-2 rounded-full bg-[#B48328] mt-1.5 shrink-0" />
                        <div className="flex-1">{renderFormattedInline(pt)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 px-3 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <Wallet className="w-6 h-6 text-slate-300 mb-1.5" />
                    <p className="text-xs font-bold text-slate-600">Arus Kas Stabil</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Belum ada anomali biaya atau fluktuasi omzet yang memerlukan intervensi.
                    </p>
                  </div>
                )}
              </div>

              {/* Pilar 2: Stok & Risiko */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3 transition-all hover:shadow-md">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#5F1E1E] uppercase tracking-wide">
                    2. Stok & Risiko
                  </h3>
                </div>

                {executiveSummary.inventory.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {executiveSummary.inventory.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <div className="flex-1">{renderFormattedInline(pt)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 px-3 text-center bg-emerald-50/40 rounded-xl border border-dashed border-emerald-200">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 mb-1.5" />
                    <p className="text-xs font-bold text-emerald-700">Inventaris Aman</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Semua stok berada di atas ambang batas minimum dan tidak ada deadstock.
                    </p>
                  </div>
                )}
              </div>

              {/* Pilar 3: Aksi Prioritas */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3 transition-all hover:shadow-md">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#5F1E1E] uppercase tracking-wide">
                    3. Aksi Prioritas
                  </h3>
                </div>

                {executiveSummary.action.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {executiveSummary.action.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/80">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="flex-1">{renderFormattedInline(pt)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 px-3 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <Zap className="w-6 h-6 text-amber-500 mb-1.5" />
                    <p className="text-xs font-bold text-slate-600">Semua Strategi Berjalan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Lanjutkan pemantauan rutin dan rekap transaksi harian untuk saran baru.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs font-medium border border-dashed">
              Belum ada data untuk menghasilkan Executive Brief.
            </div>
          )}
        </section>
      )}
    </div>
  );
}