import type { Product } from "../../types";

export interface ManualRow {
  productId: string;
  qty: number | '';
}

interface ImportModalProps {
  open: boolean;
  showMappingStep: boolean;
  importDate: string;
  setImportDate: (v: string) => void;
  importSource: string;
  setImportSource: (v: string) => void;
  customImportSource: string;
  setCustomImportSource: (v: string) => void;
  importFile: File | null;
  availableHeaders: string[];
  selectedNameHeader: string;
  setSelectedNameHeader: (v: string) => void;
  selectedQtyHeader: string;
  setSelectedQtyHeader: (v: string) => void;
  selectedPriceHeader: string;
  setSelectedPriceHeader: (v: string) => void;
  parsedRawRows: any[];
  products: Product[];
  isImporting: boolean;
  onDownloadTemplate: () => void;
  onFileChange: (file: File) => void;
  onBackToStep1: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
};

// ─── MODAL IMPOR REKAP + SMART COLUMN MAPPING ────────────────────────────────
export default function ImportModal({
  open,
  showMappingStep,
  importDate,
  setImportDate,
  importSource,
  setImportSource,
  customImportSource,
  setCustomImportSource,
  importFile,
  availableHeaders,
  selectedNameHeader,
  setSelectedNameHeader,
  selectedQtyHeader,
  setSelectedQtyHeader,
  selectedPriceHeader,
  setSelectedPriceHeader,
  parsedRawRows,
  products,
  isImporting,
  onDownloadTemplate,
  onFileChange,
  onBackToStep1,
  onConfirm,
  onClose,
}: ImportModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-[#5F1E1E] uppercase tracking-wide">
            {showMappingStep ? 'PRATINJAU & PENYESUAIAN KOLOM' : 'IMPOR REKAP MARKETPLACE'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* STEP 1: PILIH FILE & TANGGAL DENGAN PETUNJUK USER-FRIENDLY */}
        {!showMappingStep ? (
          <div className="flex flex-col gap-3.5 text-xs">

            <div className="bg-[#FFFDF9] border-2 border-[#B48328]/40 p-3.5 rounded-2xl flex flex-col gap-2 text-xs text-[#5F1E1E]">
              <div className="flex justify-between items-center border-b border-[#B48328]/20 pb-1.5">
                <span className="font-extrabold uppercase text-[10px] text-[#B48328] flex items-center gap-1">
                  <span>💡</span> PETUNJUK IMPOR BERKAS EXCEL / CSV:
                </span>
                <button
                  type="button"
                  onClick={onDownloadTemplate}
                  className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-bold px-2 py-1 rounded-lg text-[9px] transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>📥</span> Unduh Contoh Template
                </button>
              </div>

              <p className="text-[11px] leading-relaxed font-semibold text-slate-700">
                Pastikan berkas Excel/CSV kamu memiliki setidaknya 3 informasi utama:
                <strong className="text-[#5F1E1E]"> Nama Produk</strong>,
                <strong className="text-[#5F1E1E]"> Jumlah Terjual (Qty)</strong>, dan
                <strong className="text-[#5F1E1E]"> Harga Satuan</strong>.
              </p>

              <p className="text-[10px] text-slate-500 italic">
                *Catatan: Jika berkas tidak memiliki kolom harga, sistem otomatis menggunakan harga dari katalog inventaris yang cocok.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-extrabold text-[#5F1E1E] uppercase">TANGGAL REKAP</label>
              <input
                type="date"
                required
                className="border-2 border-[#B48328] rounded-2xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9]"
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-extrabold text-[#5F1E1E] uppercase">PILIH SALURAN ASAL BERKAS</label>
              <select
                className="border-2 border-[#B48328] rounded-2xl p-2.5 font-bold text-[#5F1E1E] bg-[#FFFDF9] focus:outline-none cursor-pointer"
                value={importSource}
                onChange={(e) => setImportSource(e.target.value)}
              >
                <option value="Shopee">Shopee Seller Center</option>
                <option value="TikTok Shop">TikTok Shop Seller Center</option>
                <option value="Tokopedia">Tokopedia Seller Center</option>
                <option value="Custom">➕ Lainnya / Tambah Custom...</option>
              </select>

              {importSource === 'Custom' && (
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lazada, WhatsApp, atau Bazar"
                  className="border-2 border-[#B48328] rounded-2xl p-2.5 font-bold text-[#5F1E1E] focus:outline-none bg-[#FFFDF9] animate-scaleUp mt-1"
                  value={customImportSource}
                  onChange={(e) => setCustomImportSource(e.target.value)}
                />
              )}
            </div>

            {/* FILE UPLOAD BOX */}
            <div className="border-2 border-dashed border-[#B48328] hover:bg-[#E8D3A7]/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#FFFDF9] relative transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onFileChange(e.target.files[0]);
                  }
                }}
              />
              <span className="font-bold text-[#5F1E1E] truncate max-w-full text-center">
                {importFile ? importFile.name : 'Pilih file ekspor laporan marketplace (.xlsx / .csv)'}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">Sistem akan otomatis mendeteksi kolom file</span>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: PENYESUAIAN MAPPING KOLOM & PRATINJAU HASIL BACA */
          <div className="flex flex-col gap-3.5 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-800 font-bold">
              ✓ Berhasil membaca {parsedRawRows.length} baris dari file: <span className="underline">{importFile?.name}</span>
            </div>

            <div className="bg-[#FFFDF9] border-2 border-[#B48328]/40 p-3 rounded-2xl flex flex-col gap-2">
              <span className="font-black text-[#5F1E1E] text-[10px] uppercase">
                SAMAKAN KOLOM FILE EXCEL KAMU DENGAN SISTEM:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-600">Kolom Nama Produk:</label>
                  <select
                    className="border border-[#B48328] rounded-lg p-1.5 text-[10px] font-bold text-[#5F1E1E] bg-white cursor-pointer truncate"
                    value={selectedNameHeader}
                    onChange={(e) => setSelectedNameHeader(e.target.value)}
                  >
                    {availableHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-600">Kolom Jumlah (Qty):</label>
                  <select
                    className="border border-[#B48328] rounded-lg p-1.5 text-[10px] font-bold text-[#5F1E1E] bg-white cursor-pointer truncate"
                    value={selectedQtyHeader}
                    onChange={(e) => setSelectedQtyHeader(e.target.value)}
                  >
                    {availableHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-600">Kolom Harga Jual:</label>
                  <select
                    className="border border-[#B48328] rounded-lg p-1.5 text-[10px] font-bold text-[#5F1E1E] bg-white cursor-pointer truncate"
                    value={selectedPriceHeader}
                    onChange={(e) => setSelectedPriceHeader(e.target.value)}
                  >
                    {availableHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* PRATINJAU 3 BARIS DATA PERTAMA */}
            <div className="flex flex-col gap-1">
              <span className="font-extrabold text-[10px] text-[#5F1E1E] uppercase">
                PRATINJAU CONTOH DATA HASIL MEMBACA:
              </span>
              <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50 p-2 max-h-32">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#5F1E1E] font-black">
                      <th className="p-1">Produk</th>
                      <th className="p-1 text-center">Qty</th>
                      <th className="p-1 text-right">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold">
                    {parsedRawRows.slice(0, 3).map((r, i) => {
                      const pName = r[selectedNameHeader] ? String(r[selectedNameHeader]).trim() : '-';
                      const pQty = Number(String(r[selectedQtyHeader] || 1).replace(/\D/g, '')) || 1;

                      const matchedProduct = products.find(
                        (p) => p.name.toLowerCase().trim() === pName.toLowerCase()
                      );

                      const rawPrice = r[selectedPriceHeader] !== undefined && r[selectedPriceHeader] !== ''
                        ? Number(String(r[selectedPriceHeader]).replace(/\D/g, ''))
                        : NaN;

                      const pPrice = !isNaN(rawPrice) && rawPrice > 0
                        ? rawPrice
                        : (matchedProduct?.sellPrice || 0);

                      return (
                        <tr key={i}>
                          <td className="p-1 truncate max-w-[150px]">{pName}</td>
                          <td className="p-1 text-center">{pQty}</td>
                          <td className={`p-1 text-right ${pPrice === 0 ? 'text-amber-600 font-bold' : ''}`}>
                            {formatRupiah(pPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 mt-2">
              <button
                type="button"
                onClick={onBackToStep1}
                className="px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 text-xs"
              >
                ← Pilih File Lain
              </button>

              <button
                type="button"
                disabled={isImporting}
                onClick={onConfirm}
                className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-black px-5 py-2.5 rounded-xl shadow-md text-xs flex items-center gap-1.5 active:scale-95 transition-all"
              >
                {isImporting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  '✓ Konfirmasi & Impor Data'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}