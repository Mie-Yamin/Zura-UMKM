import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const formatRupiah = (val?: number) => {
  if (val === undefined || isNaN(val)) return "Rp 0";
  return `Rp ${val.toLocaleString("id-ID")}`;
};

// Warna asal TikTok Shop tetap Hitam (#000000) untuk diagram & grafik
export const CHANNEL_COLORS: Record<string, string> = {
  Shopee: "#EE4D2D",
  Tokopedia: "#00AA5B",
  "TikTok Shop": "#000000", // Grafik & Bar tetap hitam
  Lainnya: "#5F1E1E",
};

export interface TrendDatum {
  jam: string;
  monthIdx?: number;
  "Omzet Shopee": number;
  "Omzet Tokopedia": number;
  "Omzet TikTok Shop": number;
}

export interface ChannelDatum {
  name: string;
  Omzet: number;
}

interface SalesChartsProps {
  trendData: TrendDatum[];
  channelData: ChannelDatum[];
  selectedBranch: string;
}

// ─── GRAFIK KINERJA PENJUALAN ────────────────────────────────────────────────
export default function SalesCharts({
  trendData,
  channelData,
  selectedBranch,
}: SalesChartsProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
      {/* Kiri: Line chart Tren Omzet Harian */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-transparent shadow-sm p-4 sm:p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
            Tren Omzet Omnichannel ({selectedBranch})
          </h2>
          <p className="text-[10px] sm:text-xs font-medium text-[#B48328] mt-0.5">
            Kurva perbandingan performa harian Shopee, Tokopedia, dan TikTok Shop.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="jam"
                tick={{ fontSize: 10, fill: "#5F1E1E", fontWeight: 600 }}
              />

              <YAxis
                tick={{ fontSize: 10, fill: "#5F1E1E", fontWeight: 600 }}
                tickFormatter={(val: number) => {
                  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} Jt`;
                  if (val >= 1_000) return `${(val / 1_000).toFixed(0)} Rb`;
                  return `${val}`;
                }}
              />

              {/* TOOLTIP: KHUSUS TEKS TIKTOK SHOP DIUBAH KE WARNA PUTIH */}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#5F1E1E] p-3 rounded-xl shadow-xl border border-white/10 text-white text-xs">
                        <p className="font-bold text-[#E8D3A7] mb-1">Rentang Grafik {label}</p>
                        {payload.map((entry: any, index: number) => {
                          const isTiktok = entry.name === "Omzet TikTok Shop";
                          return (
                            <p
                              key={`item-${index}`}
                              className="font-semibold"
                              style={{
                                // Jika TikTok Shop, paksakan teks berwarna putih murni (#FFFFFF)
                                color: isTiktok ? "#FFFFFF" : entry.color,
                              }}
                            >
                              {entry.name}: Rp {Number(entry.value || 0).toLocaleString("id-ID")}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey="Omzet Shopee"
                stroke={CHANNEL_COLORS["Shopee"]}
                strokeWidth={3}
                dot={{ r: 4, fill: CHANNEL_COLORS["Shopee"] }}
              />
              <Line
                type="monotone"
                dataKey="Omzet Tokopedia"
                stroke={CHANNEL_COLORS["Tokopedia"]}
                strokeWidth={3}
                dot={{ r: 4, fill: CHANNEL_COLORS["Tokopedia"] }}
              />
              <Line
                type="monotone"
                dataKey="Omzet TikTok Shop"
                stroke={CHANNEL_COLORS["TikTok Shop"]} // Garis grafik tetap hitam
                strokeWidth={3}
                dot={{ r: 4, fill: CHANNEL_COLORS["TikTok Shop"] }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Kanan: Bar chart Distribusi Saluran Penjualan */}
      <div className="bg-white rounded-2xl border border-transparent shadow-sm p-4 sm:p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#5F1E1E] uppercase tracking-wide">
            KONTRIBUSI SALURAN MARKETPLACE
          </h2>
          <p className="text-[10px] sm:text-xs font-medium text-[#B48328] mt-0.5">
            Distribusi nominal omzet berdasarkan asal saluran transaksi.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={channelData}
              margin={{ top: 15, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.2}
              />

              <XAxis
                dataKey="name"
                stroke="#5F1E1E"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
              />

              <YAxis
                stroke="#5F1E1E"
                fontSize={10}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => {
                  if (value >= 1_000_000)
                    return `${(value / 1_000_000).toFixed(0)} Jt`;
                  if (value >= 1_000)
                    return `${(value / 1_000).toFixed(0)}rb`;
                  return `${value}`;
                }}
              />

              <Tooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChannelDatum;
                    const val = payload[0].value as number;
                    return (
                      <div className="bg-[#5F1E1E] p-3 rounded-xl shadow-xl border border-white/10">
                        <p className="font-bold text-xs text-[#E8D3A7] mb-1">
                          {data.name}
                        </p>
                        <p className="text-xs font-semibold text-white">
                          Omzet : {formatRupiah(val)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Bar dataKey="Omzet" radius={[8, 8, 0, 0]} maxBarSize={36}>
                {channelData.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={CHANNEL_COLORS[entry.name] || "#5F1E1E"} // Batang diagram tetap hitam
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}