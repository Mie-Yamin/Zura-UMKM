// src/api/grokService.ts
import { auth } from "../config/firebase";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Pemberitahuan privasi untuk ditampilkan di UI (Chatbot & halaman analisis AI).
export const AI_PRIVACY_NOTICE =
  "Privasi: Hanya ringkasan agregat (omzet, unit terjual, jumlah SKU) plus daftar stok terbatas yang dikirim ke layanan AI pihak ketiga (xAI/Groq) untuk menghasilkan analisis. Data pelanggan pribadi tidak dikirim.";

// ─── Konteks bisnis minimal (prinsip data minimization) ────────────────────────
// Hanya agregat + detail stok yang terbatas & tanpa field sensitif yang dikirim
// ke LLM. Tidak ada nama pelanggan, email, no. HP, atau nombor resi.

const LOW_STOCK_MAX = 10; // maks produk stok kritis yang dicantumkan
const INVENTORY_LIST_MAX = 8; // maks produk detail pada daftar umum

interface BusinessSnapshot {
  totalSKU: number;
  totalOmzet: number;
  totalUnits: number;
  lowStockSummary: string;
  deadstockCount: number;
  inventorySummary: string;
}

function buildBusinessSnapshot(
  products: any[],
  recaps: any[]
): BusinessSnapshot {
  const totalSKU = products.length;
  const lowStockProducts = products
    .filter((p) => p.stockCount <= (p.minStock || 10))
    .slice(0, LOW_STOCK_MAX);
  const deadstockCount = products.filter((p) => p.isDeadstock === true).length;

  const totalOmzet = recaps.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalUnits = recaps.reduce((sum, r) => sum + (r.unitsSold || 0), 0);

  const inventorySummary =
    products
      .slice(0, INVENTORY_LIST_MAX)
      .map(
        (p) =>
          `- Nama: ${p.name}, SKU: ${p.sku}, Stok: ${p.stockCount} unit, Kategori: ${p.category || "Lainnya"}`
      )
      .join("\n") || "Belum ada produk di inventaris.";

  let lowStockSummary =
    lowStockProducts
      .map(
        (p) =>
          `- Nama: ${p.name}, SKU: ${p.sku}, Stok: ${p.stockCount}, Batas Minimum: ${p.minStock || 10}`
      )
      .join("\n") || "Tidak ada produk dengan stok kritis.";

  if (products.filter((p) => p.stockCount <= (p.minStock || 10)).length > LOW_STOCK_MAX) {
    lowStockSummary += `\n- (masih ${products.filter((p) => p.stockCount <= (p.minStock || 10)).length - LOW_STOCK_MAX} produk stok kritis lainnya tidak dicantumkan)`;
  }

  return {
    totalSKU,
    totalOmzet,
    totalUnits,
    lowStockSummary,
    deadstockCount,
    inventorySummary,
  };
}

// Helper komunikasi ke proxy internal /api/ai
async function fetchChatCompletion(messages: Message[]): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Sesi login berakhir atau Anda belum login. Silakan login kembali.");
  }

  // Mengambil Firebase ID Token pengguna aktif
  const idToken = await currentUser.getIdToken();

  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error || `HTTP error ${response.status} dari server AI`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (content) {
    return content;
  }

  throw new Error("Respon AI kosong atau format tidak sesuai.");
}

export async function askGrokAI(
  userInput: string,
  chatHistory: { sender: "user" | "bot"; text: string }[],
  context: { products: any[]; recaps: any[] }
): Promise<string> {
  const { products = [], recaps = [] } = context;
  const snapshot = buildBusinessSnapshot(products, recaps);

  const systemPrompt = `Anda adalah Zura AI, asisten virtual cerdas untuk pemilik toko UMKM (Zura-UMKM). 
Tugas Anda adalah membantu pengguna mengelola toko, memberikan saran manajemen stok, analisis omzet, strategi promosi, dan menjawab pertanyaan operasional ritel.

Berikut adalah data riil toko pengguna saat ini dari database Firestore (ringkasan):
- Total Jenis Produk (SKU): ${snapshot.totalSKU}
- Produk dengan Stok Kritis/Menipis:
${snapshot.lowStockSummary}
- Jumlah Produk Mengendap (Deadstock): ${snapshot.deadstockCount} SKU
- Total Penjualan (Omzet) dari Rekap: Rp ${snapshot.totalOmzet.toLocaleString("id-ID")}
- Total Unit Terjual dari Rekap: ${snapshot.totalUnits} unit

Daftar Terbatas Produk Inventaris Toko (stok & nama saja, tanpa harga):
${snapshot.inventorySummary}

Aturan Penting:
1. Berikan jawaban dalam Bahasa Indonesia yang ramah, profesional, ringkas, dan solutif.
2. JANGAN PERNAH menggunakan format tabel Markdown (seperti | SKU | Nama |). Sebagai gantinya, jika ingin menampilkan daftar data, gunakan format poin-poin yang dipisahkan baris baru secara rapi (contoh: "- SKU: ..., Nama: ...").
3. Fokus pada membantu UMKM dan operasional perdagangan retail. 
4. Jangan memberikan jawaban di luar topik perdagangan, bisnis, keuangan, atau UMKM. Jika pertanyaan di luar konteks, tolak dengan sopan bahwa Anda adalah asisten Zura AI khusus UMKM.
5. Gunakan data riil toko di atas untuk menjawab pertanyaan yang menanyakan kondisi toko pengguna secara spesifik. Jika pengguna bertanya tentang barang tertentu atau stok barang, cocokkan dengan data inventaris di atas.
6. Bila memberikan saran promosi atau restock, sesuaikan dengan produk riil yang dimiliki pengguna.
7. Hanya data ringkasan yang tersedia untuk Anda; jangan mengaku mengetahui detail di luar data yang diberikan.`;

  const formattedMessages: Message[] = [
    { role: "system", content: systemPrompt },
  ];

  chatHistory.forEach((msg) => {
    formattedMessages.push({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    });
  });

  formattedMessages.push({ role: "user", content: userInput });

  try {
    return await fetchChatCompletion(formattedMessages);
  } catch (error: any) {
    console.error("Error calling Zura AI:", error);
    return `Maaf, terjadi kesalahan saat menghubungi Zura AI (${error?.message || "Koneksi gagal"}). Silakan coba lagi nanti.`;
  }
}

export async function generateGrokInsights(
  products: any[],
  recaps: any[]
): Promise<string> {
  const snapshot = buildBusinessSnapshot(products, recaps);

  const systemPrompt = `Anda adalah Zura AI Business Analyst. Tugas Anda adalah menganalisis data toko UMKM milik pengguna dan menghasilkan laporan ringkasan analisis bisnis berkala yang mendalam, solutif, dan ramah.

Aturan Penting:
1. JANGAN PERNAH menggunakan format tabel Markdown (seperti | SKU | Nama |). Sebagai gantinya, jika ingin menampilkan daftar data, gunakan format poin-poin yang dipisahkan baris baru secara rapi (contoh: "- SKU: ..., Nama: ...").
2. Gunakan pemformatan tebal Markdown (seperti **teks**) untuk menekankan angka penting, metrik, atau kesimpulan penting agar mudah dibaca.
3. Gunakan Bahasa Indonesia yang ramah, profesional, dan solutif.
4. Laporan harus dibagi menjadi 3 bagian utama menggunakan pemformatan judul teks tebal (tanpa simbol pagar #):
   **1. Evaluasi Finansial & Saluran Penjualan**
   **2. Manajemen Stok & Risiko Inventaris**
   **3. Rekomendasi Aksi Taktis Bisnis**`;

  const userMessage = `Berikut adalah data riil toko saya saat ini dari database Firestore (ringkasan):
- Total Jenis Produk (SKU): ${snapshot.totalSKU}
- Produk dengan Stok Kritis/Menipis:
${snapshot.lowStockSummary}
- Jumlah Produk Mengendap (Deadstock): ${snapshot.deadstockCount} SKU
- Total Penjualan (Omzet) dari Rekap: Rp ${snapshot.totalOmzet.toLocaleString("id-ID")}
- Total Unit Terjual dari Rekap: ${snapshot.totalUnits} unit

Daftar Terbatas Produk Inventaris Toko:
${snapshot.inventorySummary}

Tolong berikan laporan analisis bisnis berkala berdasarkan data di atas sesuai dengan Aturan Penting.`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  try {
    return await fetchChatCompletion(messages);
  } catch (error: any) {
    console.error("Error generating insights:", error);
    return `Maaf, terjadi kesalahan saat menghubungi Zura AI (${error?.message || "Koneksi gagal"}). Silakan coba lagi nanti.`;
  }
}

export async function generateFinanceInsights(finances: {
  totalRevenue: number;
  totalHpp: number;
  totalAdminFee: number;
  totalExpenses: number;
  netProfit: number;
  operational: number;
}): Promise<string> {
  const systemPrompt = `Anda adalah Zura AI Financial Analyst. Tugas Anda adalah menganalisis metrik laba rugi toko UMKM pengguna dan memberikan rangkuman kesehatan finansial yang sangat ringkas, padat (maksimal 4-5 kalimat), solutif, dan ramah.

Aturan Penting:
1. JANGAN PERNAH menggunakan format tabel atau poin-poin panjang. Tulis dalam bentuk 1-2 paragraf narasi mengalir yang padat.
2. JANGAN PERNAH menggunakan format tabel Markdown.
3. Gunakan Bahasa Indonesia yang ramah, profesional, dan solutif.
4. Berikan saran praktis tentang bagaimana mereka bisa mengoptimalkan margin keuntungan (misalnya dengan menekan biaya operasional atau admin fee).
5. Gunakan pemformatan tebal Markdown (seperti **teks**) untuk menekankan angka penting atau kesimpulan utama.`;

  const userMessage = `Berikut adalah data ringkasan finansial toko saya saat ini:
- Pendapatan Penjualan (Bruto): Rp ${finances.totalRevenue.toLocaleString("id-ID")}
- Harga Pokok Penjualan (HPP): Rp ${finances.totalHpp.toLocaleString("id-ID")}
- Biaya Admin Platform Marketplace: Rp ${finances.totalAdminFee.toLocaleString("id-ID")}
- Total Beban Operasional Toko: Rp ${finances.operational.toLocaleString("id-ID")}
- Laba Bersih Riil (Net Profit): Rp ${finances.netProfit.toLocaleString("id-ID")}
- Margin Laba Bersih (NPM): ${finances.totalRevenue > 0 ? ((finances.netProfit / finances.totalRevenue) * 100).toFixed(1) : 0}%

Berikan rangkuman analisis narasi finansial singkat berdasarkan data di atas.`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  try {
    return await fetchChatCompletion(messages);
  } catch (error: any) {
    console.error("Error generating finance insights:", error);
    return `Terjadi kesalahan saat menghubungi Zura AI (${error?.message || "Koneksi gagal"}). Silakan periksa koneksi internet Anda.`;
  }
}