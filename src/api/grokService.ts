export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function askGrokAI(
  userInput: string,
  chatHistory: { sender: 'user' | 'bot'; text: string }[],
  context: { products: any[]; recaps: any[] }
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  if (!apiKey) {
    return 'Maaf, API Key Grok belum dikonfigurasi. Silakan tambahkan VITE_GROK_API_KEY di file .env Anda.';
  }

  const isGroq = apiKey.startsWith('gsk_');
  const apiUrl = isGroq ? '/groq-api/v1/chat/completions' : '/grok-api/v1/chat/completions';
  const apiModel = isGroq ? 'groq/compound-mini' : 'grok-2';

  const { products = [], recaps = [] } = context;
  
  const totalSKU = products.length;
  const lowStockProducts = products.filter(p => p.stockCount <= (p.minStock || 10));
  const deadstockProducts = products.filter(p => p.isDeadstock === true);
  
  const totalOmzet = recaps.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalUnits = recaps.reduce((sum, r) => sum + (r.unitsSold || 0), 0);
  
  // Format ringkasan inventaris untuk AI (maksimal 20 produk pertama agar tidak over token)
  const inventorySummary = products.slice(0, 20).map(p => 
    `- SKU: ${p.sku}, Nama: ${p.name}, Stok: ${p.stockCount} unit, Harga Jual: Rp ${p.sellPrice.toLocaleString('id-ID')}, Kategori: ${p.category || 'Lainnya'}`
  ).join('\n') || 'Belum ada produk di inventaris.';
  
  const lowStockSummary = lowStockProducts.map(p => 
    `- SKU: ${p.sku}, Nama: ${p.name} (Stok: ${p.stockCount}, Batas Minimum: ${p.minStock || 10})`
  ).join('\n') || 'Tidak ada produk dengan stok kritis.';

  const systemPrompt = `Anda adalah Zura AI, asisten virtual cerdas untuk pemilik toko UMKM (Zura-UMKM). 
Tugas Anda adalah membantu pengguna mengelola toko, memberikan saran manajemen stok, analisis omzet, strategi promosi, dan menjawab pertanyaan operasional ritel.

Berikut adalah data riil toko pengguna saat ini dari database Firestore:
- Total Jenis Produk (SKU): ${totalSKU}
- Produk dengan Stok Kritis/Menipis:
${lowStockSummary}
- Jumlah Produk Mengendap (Deadstock): ${deadstockProducts.length} SKU
- Total Penjualan (Omzet) dari Rekap: Rp ${totalOmzet.toLocaleString('id-ID')}
- Total Unit Terjual dari Rekap: ${totalUnits} unit

Daftar Beberapa Produk Inventaris Toko:
${inventorySummary}

Aturan Penting:
1. Berikan jawaban dalam Bahasa Indonesia yang ramah, profesional, ringkas, dan solutif.
2. JANGAN PERNAH menggunakan format tabel Markdown (seperti | SKU | Nama |). Sebagai gantinya, jika ingin menampilkan daftar data, gunakan format poin-poin yang dipisahkan baris baru secara rapi (contoh: "- SKU: ..., Nama: ...").
3. Fokus pada membantu UMKM dan operasional perdagangan retail. 
4. Jangan memberikan jawaban di luar topik perdagangan, bisnis, keuangan, atau UMKM. Jika pertanyaan di luar konteks, tolak dengan sopan bahwa Anda adalah asisten Zura AI khusus UMKM.
5. Gunakan data riil toko di atas untuk menjawab pertanyaan yang menanyakan kondisi toko pengguna secara spesifik. Jika pengguna bertanya tentang barang tertentu atau stok barang, cocokkan dengan data inventaris di atas.
6. Bila memberikan saran promosi atau restock, sesuaikan dengan produk riil yang dimiliki pengguna.`;

  const formattedMessages: Message[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Tambahkan histori chat
  chatHistory.forEach(msg => {
    formattedMessages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  });

  // Tambahkan input terbaru dari user
  formattedMessages.push({ role: 'user', content: userInput });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: formattedMessages,
        model: apiModel,
        stream: false,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Grok API Error:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Maaf, saya tidak menerima respon dari Grok AI.';
  } catch (error) {
    console.error('Error calling Grok AI:', error);
    return 'Maaf, terjadi kesalahan saat menghubungi Zura AI. Pastikan API Key Grok Anda benar dan koneksi internet Anda aktif.';
  }
}

export async function generateGrokInsights(
  products: any[],
  recaps: any[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  if (!apiKey) {
    return 'Maaf, API Key Grok belum dikonfigurasi. Silakan masukkan VITE_GROK_API_KEY di file .env Anda.';
  }

  const isGroq = apiKey.startsWith('gsk_');
  const apiUrl = isGroq ? '/groq-api/v1/chat/completions' : '/grok-api/v1/chat/completions';
  const apiModel = isGroq ? 'groq/compound-mini' : 'grok-2';

  const totalSKU = products.length;
  const lowStockProducts = products.filter(p => p.stockCount <= (p.minStock || 10));
  const deadstockProducts = products.filter(p => p.isDeadstock === true);
  
  const totalOmzet = recaps.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalUnits = recaps.reduce((sum, r) => sum + (r.unitsSold || 0), 0);
  
  // Format ringkasan inventaris untuk AI (maksimal 20 produk pertama agar tidak over token)
  const inventorySummary = products.slice(0, 20).map(p => 
    `- SKU: ${p.sku}, Nama: ${p.name}, Stok: ${p.stockCount} unit, Harga Jual: Rp ${p.sellPrice.toLocaleString('id-ID')}, Kategori: ${p.category || 'Lainnya'}`
  ).join('\n') || 'Belum ada produk di inventaris.';
  
  const lowStockSummary = lowStockProducts.map(p => 
    `- SKU: ${p.sku}, Nama: ${p.name} (Stok: ${p.stockCount}, Batas Minimum: ${p.minStock || 10})`
  ).join('\n') || 'Tidak ada produk dengan stok kritis.';

  const systemPrompt = `Anda adalah Zura AI Business Analyst. Tugas Anda adalah menganalisis data toko UMKM milik pengguna dan menghasilkan laporan ringkasan analisis bisnis berkala yang mendalam, solutif, dan ramah.

Aturan Penting:
1. JANGAN PERNAH menggunakan format tabel Markdown (seperti | SKU | Nama |). Sebagai gantinya, jika ingin menampilkan daftar data, gunakan format poin-poin yang dipisahkan baris baru secara rapi (contoh: "- SKU: ..., Nama: ...").
2. Gunakan pemformatan tebal Markdown (seperti **teks**) untuk menekankan angka penting, metrik, atau kesimpulan penting agar mudah dibaca.
3. Gunakan Bahasa Indonesia yang ramah, profesional, dan solutif.
4. Laporan harus dibagi menjadi 3 bagian utama menggunakan pemformatan judul teks tebal (tanpa simbol pagar #):
   **1. Evaluasi Finansial & Saluran Penjualan**
   **2. Manajemen Stok & Risiko Inventaris**
   **3. Rekomendasi Aksi Taktis Bisnis**`;

  const userMessage = `Berikut adalah data riil toko saya saat ini dari database Firestore:
- Total Jenis Produk (SKU): ${totalSKU}
- Produk dengan Stok Kritis/Menipis:
${lowStockSummary}
- Jumlah Produk Mengendap (Deadstock): ${deadstockProducts.length} SKU
- Total Penjualan (Omzet) dari Rekap: Rp ${totalOmzet.toLocaleString('id-ID')}
- Total Unit Terjual dari Rekap: ${totalUnits} unit

Daftar Beberapa Produk Inventaris Toko:
${inventorySummary}

Tolong berikan laporan analisis bisnis berkala berdasarkan data di atas sesuai dengan Aturan Penting.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages,
        model: apiModel,
        stream: false,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Grok API Error:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Maaf, gagal menghasilkan analisis bisnis saat ini.';
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Maaf, terjadi kesalahan saat menghubungi Zura AI. Pastikan API Key Grok Anda benar dan koneksi internet Anda aktif.';
  }

export async function generateFinanceInsights(
  finances: {
    totalRevenue: number;
    totalHpp: number;
    totalAdminFee: number;
    totalExpenses: number;
    netProfit: number;
    operational: number;
  }
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  if (!apiKey) {
    return 'Maaf, API Key Grok belum dikonfigurasi. Silakan masukkan VITE_GROK_API_KEY di file .env Anda.';
  }

  const isGroq = apiKey.startsWith('gsk_');
  const apiUrl = isGroq ? '/groq-api/v1/chat/completions' : '/grok-api/v1/chat/completions';
  const apiModel = isGroq ? 'groq/compound-mini' : 'grok-2';

  const systemPrompt = `Anda adalah Zura AI Financial Analyst. Tugas Anda adalah menganalisis metrik laba rugi toko UMKM pengguna dan memberikan rangkuman kesehatan finansial yang sangat ringkas, padat (maksimal 4-5 kalimat), solutif, dan ramah.

Aturan Penting:
1. JANGAN PERNAH menggunakan format tabel atau poin-poin panjang. Tulis dalam bentuk 1-2 paragraf narasi mengalir yang padat.
2. JANGAN PERNAH menggunakan format tabel Markdown.
3. Gunakan Bahasa Indonesia yang ramah, profesional, dan solutif.
4. Berikan saran praktis tentang bagaimana mereka bisa mengoptimalkan margin keuntungan (misalnya dengan menekan biaya operasional atau admin fee).
5. Gunakan pemformatan tebal Markdown (seperti **teks**) untuk menekankan angka penting atau kesimpulan utama.`;

  const userMessage = `Berikut adalah data ringkasan finansial toko saya saat ini:
- Pendapatan Penjualan (Bruto): Rp ${finances.totalRevenue.toLocaleString('id-ID')}
- Harga Pokok Penjualan (HPP): Rp ${finances.totalHpp.toLocaleString('id-ID')}
- Biaya Admin Platform Marketplace: Rp ${finances.totalAdminFee.toLocaleString('id-ID')}
- Total Beban Operasional Toko: Rp ${finances.operational.toLocaleString('id-ID')}
- Laba Bersih Riil (Net Profit): Rp ${finances.netProfit.toLocaleString('id-ID')}
- Margin Laba Bersih (NPM): ${finances.totalRevenue > 0 ? ((finances.netProfit / finances.totalRevenue) * 100).toFixed(1) : 0}%

Berikan rangkuman analisis narasi finansial singkat berdasarkan data di atas.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages,
        model: apiModel,
        stream: false,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Grok API Error:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Gagal menghasilkan rangkuman finansial.';
  } catch (error) {
    console.error('Error generating finance insights:', error);
    return 'Terjadi kesalahan saat menghubungi Zura AI. Silakan periksa koneksi internet Anda.';
  }
}
