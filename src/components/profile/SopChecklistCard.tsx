import type { SopTask, SopTemplateKey } from "./types";

interface SopChecklistCardProps {
  sopTasks: SopTask[];
  showTemplates: boolean;
  newTaskLabel: string;
  setNewTaskLabel: (v: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string, e: React.MouseEvent) => void;
  onResetChecklist: () => void;
  onAddTask: (e: React.FormEvent) => void;
  onApplyTemplate: (key: SopTemplateKey) => void;
  onToggleTemplates: () => void;
}

// ─── CHECKLIST SOP KUSTOM & REKOMENDASI ─────────────────────────────────────
export default function SopChecklistCard({
  sopTasks,
  showTemplates,
  newTaskLabel,
  setNewTaskLabel,
  onToggleTask,
  onDeleteTask,
  onResetChecklist,
  onAddTask,
  onApplyTemplate,
  onToggleTemplates,
}: SopChecklistCardProps) {
  const completedCount = sopTasks.filter((t) => t.completed).length;

  return (
    <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between gap-4 border border-slate-100">
      <div>
        {/* Header Checklist */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#5F1E1E] uppercase tracking-wide">
              Checklist Operasional Harian Toko
            </h2>
            <span className="bg-[#5F1E1E] text-[#E8D3A7] text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
              {completedCount} / {sopTasks.length}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onResetChecklist}
              className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-[#5F1E1E] bg-slate-100 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
              title="Kosongkan semua centang"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={onToggleTemplates}
              className="text-[10px] sm:text-[11px] font-bold text-[#B48328] hover:text-[#5F1E1E] bg-[#E8D3A7]/30 px-3 py-1.5 rounded-xl transition-all border border-[#B48328]/30 flex items-center gap-1 cursor-pointer"
            >
              <span>Rekomendasi SOP</span>
              <span>{showTemplates ? "▲" : "▼"}</span>
            </button>
          </div>
        </div>

        {/* Panel Pilihan Template SOP */}
        {showTemplates && (
          <div className="bg-[#FFFDF9] border-2 border-[#B48328]/40 p-3.5 rounded-2xl mb-4 flex flex-col gap-2.5 animate-scaleUp text-xs">
            <span className="font-extrabold text-[#5F1E1E] text-[10px] uppercase">
              PILIH TEMPLATE TUGAS REKOMENDASI:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onApplyTemplate("online")}
                className="p-2.5 bg-white border border-slate-200 hover:border-[#5F1E1E] rounded-xl text-left font-bold text-[#5F1E1E] transition-all hover:shadow-sm cursor-pointer"
              >
                🛒 Toko Online
                <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                  Chat, Resi & Banner
                </span>
              </button>

              <button
                type="button"
                onClick={() => onApplyTemplate("fnb")}
                className="p-2.5 bg-white border border-slate-200 hover:border-[#5F1E1E] rounded-xl text-left font-bold text-[#5F1E1E] transition-all hover:shadow-sm cursor-pointer"
              >
                🍵 F&B / Toko Fisik
                <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                  Kadaluarsa & Kasir
                </span>
              </button>

              <button
                type="button"
                onClick={() => onApplyTemplate("monthly")}
                className="p-2.5 bg-white border border-slate-200 hover:border-[#5F1E1E] rounded-xl text-left font-bold text-[#5F1E1E] transition-all hover:shadow-sm cursor-pointer"
              >
                📅 Rutin / Akhir Bulan
                <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                  Stok Opname & Tagihan
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Form Input Tambah Tugas Kustom */}
        <form onSubmit={onAddTask} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Tambah tugas operasional baru..."
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-[#B48328]"
          />
          <button
            type="submit"
            className="bg-[#5F1E1E] hover:bg-[#4a1717] text-[#E8D3A7] font-extrabold text-xs px-4 py-2.5 sm:py-2 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
          >
            + Tambah
          </button>
        </form>

        {/* List Item Checklist */}
        <div className="flex flex-col gap-2 max-h-[260px] sm:max-h-[220px] overflow-y-auto pr-1">
          {sopTasks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-semibold border border-dashed rounded-xl">
              Belum ada tugas operasional. Klik <b>Rekomendasi SOP</b> di atas untuk menambahkan tugas.
            </div>
          ) : (
            sopTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-xs font-semibold ${task.completed
                  ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                  : "bg-[#FFFDF9] border-[#B48328]/40 text-[#5F1E1E] hover:border-[#B48328]"
                  }`}
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 sm:mt-0 ${task.completed
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-[#B48328] bg-white text-transparent"
                      }`}
                  >
                    ✓
                  </span>
                  <span className="leading-snug break-words text-[11px] sm:text-xs">{task.label}</span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-center">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal">
                    {task.completed ? "Selesai" : "Pending"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => onDeleteTask(task.id, e)}
                    className="text-slate-300 hover:text-red-600 transition-colors p-1 text-sm font-bold cursor-pointer"
                    title="Hapus Tugas"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Catatan Kaki SOP */}
      <div className="bg-[#E8D3A7]/20 p-3 rounded-xl border border-[#B48328]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] mt-2">
        <span className="text-[#5F1E1E] font-bold shrink-0">SOP Usaha Mandiri</span>
        <span className="text-slate-600">Gunakan tombol "Reset" untuk mengulang daftar centang harian.</span>
      </div>
    </div>
  );
}