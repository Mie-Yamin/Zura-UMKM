# 

ZURA

### **Empowering UMKM with Smart Omnichannel Analytics & AI-Driven Financial Clarity**

[🚀 Live Demo](https://zura-app.vercel.app) | [GitHub Repository](https://github.com/porvyyn/zura) | [MIT License](http://docs.google.com/LICENSE)  
**Submission for ITECHNO CUP 2026 \- Web Development**  
**By CARIIN NAMA TIM YG ANOMALI DONG**

## ---

**📋 Daftar Isi**

> * [Tentang Proyek](#bookmark=id.38h5lafqtx1a)  
> * [Fitur Unggulan](#bookmark=id.qv95jg4da83y)  
> * [Demo & Screenshot](#bookmark=id.a0ciq7ciyjtc)  
> * [Teknologi](#bookmark=id.ls6e92d3dmgp)  
> * [Arsitektur Sistem](#bookmark=id.h005j4cjxm3b)  
> * [Instalasi & Setup](#bookmark=id.o84im42z93o9)  
> * [Penggunaan](#bookmark=id.p6e4vnrq8qzd)  
> * [API Documentation](#bookmark=id.dn80w4dj5jk9)  
> * [Testing](#bookmark=id.u5sqkk88yk5r)  
> * [Tim Developer](#bookmark=id.9zszvnyux2bs)  
> * [Lisensi](#bookmark=id.1fdagqit3ogm)

## ---

**👥 Tim Developer**

| Nama | Peran | GitHub   |
| :---- | :---- | :---- |
| **Nahla Chika Khumaira** | Fullstack Developer | [@porvyyn](https://github.com/porvyyn) |
| **Naurah Salsabila** | Fullstack Developer | [@Mie-Yamin](https://github.com/Mie-Yamin) |
| **Ammar Daffa Ilyasa** | UI/UX Designer | [@ammar-daffa](https://github.com/ammar-daffa) |

## ---

**🎯 Tentang Proyek**

### **Latar Belakang**

Pesatnya pertumbuhan ekosistem *omnichannel* membawa tantangan besar bagi pelaku UMKM. Banyak pengusaha mikro menghadapi kebocoran margin akibat **kerumitan perhitungan biaya administrasi antar-marketplace**, ketidakakuratan pendataan **stok & SKU**, serta pencatatan riwayat transaksi harian yang terfragmentasi. Akibatnya, pemilik usaha kerap kesulitan mengetahui pendapatan bersih (*net profit*) secara *real-time* dan rentan mengalami kerugian finansial yang tak terdeteksi.

### **Solusi yang Ditawarkan**

**ZURA** hadir sebagai platform *command center* operasional terpadu yang mentransformasi cara UMKM mengelola bisnis. Menggabungkan pencatatan otomatis presisi tinggi dengan kecerdasan buatan (*AI-Driven Analytics*), ZURA memangkas sisa waktu manualisasi data, mengeliminasi kesalahan kalkulasi biaya operasional/potongan marketplace, serta menyajikan estimasi laba bersih dan rekomendasi inventaris secara otomatis.

### **Tujuan Proyek**

> * 🎯 **Tujuan Utama**: Membantu UMKM meminimalisir kesalahan finansial, mengoptimalkan tata kelola stok, dan meningkatkan profitabilitas melalui analitik bisnis berbasis data presisi.  
> * 📊 **Target Pengguna**: Pemilik UMKM, merchant marketplace (Shopee, Tokopedia, TikTok Shop, POS/Offline Store), serta manajer operasional gudang.  
> * 💡 **Value Proposition**: Transparansi kalkulasi biaya adm *omnichannel* secara otomatis, pemantauan stok anti-understock, dan rekomendasi keputusan berbasis AI.

## ---

**✨ Fitur Unggulan**

### **Fitur Utama**

| Fitur | Deskripsi | Keunggulan   |
| :---- | :---- | :---- |
| **Business Command Center** | Dashboard monitoring operasional terpadu yang menampilkan *revenue*, tren omzet harian, dan ringkasan KPI *omnichannel*. | Visualisasi grafik interaktif real-time dengan agregasi data jam-spesifik. |
| **Rekap Penjualan Omnichannel** | Centralized hub untuk mencatat, mengimpor, dan mengelompokkan transaksi dari berbagai *channel* penjualan. | Dilengkapi presisi *timestamp* ISO harian untuk pelacakan transaksi akurat. |
| **Manajemen Stok & SKU** | Sistem kontrol persediaan barang lintas gudang pusat dan cabang yang terintegrasi. | Pelacakan status stok (*Understock*, *Aman*) untuk mencegah kehabisan inventaris. |
| **Laporan Keuangan (Finance)** | Modul pembukuan otomatis untuk melacak pendapatan kotor, potongan admin marketplace, dan estimasi laba bersih. | Transparansi perhitungan margin dan kemudahan ekspor laporan finansial. |
| **AI Insight Hub** | Mesin analitik cerdas yang mengolah data penjualan harian menjadi analisis prediktif dan saran operasional. | Memberikan rekomendasi restock produk dan optimasi strategi penjualan secara otomatis. |

### **Fitur Tambahan**

> * **Multi-Format Export**: Fitur pengunduhan laporan rekap dan inventaris ke dalam format PDF (html2pdf.js) dan Excel (exceljs/xlsx).  
> * **Interactive Geospatial View**: Pemetaan sebaran lokasi cabang/gudang dan jangkauan pelanggan menggunakan Leaflet Map.  
> * **Dynamic Time Filters**: Filter analitik otomatis (Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir) berbasis query database presisi.

## ---

**📸 Demo & Screenshot**

### **Live Demo**

🔗 [Kunjungi Website ZURA](https://zura-app.vercel.app)

### **Video Demo**

📹 [Link Video Demo Proyek](https://youtube.com)

## ---

**🛠️ Teknologi**

### **Tech Stack**

#### **Frontend**

> * **Framework**: React v18 (TypeScript) \+ Vite  
> * **UI Library**: Tailwind CSS \+ Lucide React (Icons)  
> * **Data Visualization**: Recharts \+ Leaflet (Interactive Maps)  
> * **State & Fetching**: TanStack React Query v5 \+ React Router DOM v6  
> * **Document Generation**: ExcelJS \+ XLSX \+ HTML2PDF.js

#### **Backend & Storage**

> * **Database & Auth**: Firebase Firestore \+ Firebase Authentication (v12)  
> * **Data Persistence**: Server Timestamp & Real-time ISO Querying

#### **DevOps & Tools**

> * **Testing Framework**: Vitest v2 \+ Testing Library (React/Jest-DOM)  
> * **Code Quality**: TypeScript \+ PostCSS \+ Autoprefixer  
> * **Build Tool**: Vite v5

### **Alasan Pemilihan Teknologi**

| Teknologi | Alasan Pemilihan   |
| :---- | :---- |
| **React \+ TypeScript** | Menjamin keandalan *codebase* jangka panjang dengan *strict type safety*, meminimalisir *runtime error* pada sistem kalkulasi finansial. |
| **Firebase Cloud Firestore** | Solusi *NoSQL Real-time* berkinerja tinggi yang memungkinkan sinkronisasi data transaksi *omnichannel* secara fleksibel. |
| **Recharts & Leaflet** | Memberikan performa *rendering* data analitik omzet dan peta geografis yang lancar tanpa membebani performa browser. |

### **Dependencies Utama**

`{`  
  `"dependencies": {`  
    `"react": "^18.3.1",`  
    `"firebase": "^12.18.0",`  
    `"@tanstack/react-query": "^5.0.0",`  
    `"recharts": "^2.12.7",`  
    `"exceljs": "^4.4.0",`  
    `"leaflet": "^1.9.4",`  
    `"lucide-react": "^1.31.0"`  
  `}`  
`}`

## ---

**🏗️ Arsitektur Sistem**

### **System Architecture**

`[ Client Browser (React + Vite) ]`  
               `│`  
               `├──► [ React Query / Custom API Layer ]`  
               `│             │`  
               `│             ├──► [ Firebase Auth (Authentication) ]`  
               `│             └──► [ Firestore DB (Products, Recaps, Customers, Transactions) ]`  
               `│`  
               `└──► [ PDF & Excel Engines (html2pdf.js / ExcelJS) ]`

### **Folder Structure**

`zura-app/`  
`├── src/`  
`│   ├── api/            # API Client & Firestore Services (client.ts)`  
`│   ├── components/     # Reusable UI Components & Modals`  
`│   ├── config/         # Firebase Configuration`  
`│   ├── pages/          # Application Screens (Dashboard, Finance, Stock, AI Hub, Landing)`  
`│   ├── types/          # TypeScript Interfaces & Types`  
`│   └── utils/          # Helpers, Formatters & Calculations`  
`├── public/             # Static Assets & Icons`  
`└── tests/              # Vitest Suite & Integration Tests`

## ---

**⚙️ Instalasi & Setup**

### **Prerequisites**

Pastikan perangkat Anda sudah terpasang:

> * **Node.js**: v18.x atau lebih tinggi  
> * **npm** atau **yarn**  
> * **Git**

### **Langkah Instalasi**

> 1. **Clone Repository**  
>    `git clone https://github.com/porvyyn/zura.git`  
>    `cd zura`  
> 2. **Install Dependencies**  
>    `npm install`  
> 3. **Setup Environment Variables**  
>    Buat file .env di root directory dan masukkan konfigurasi Firebase Anda:  
>    `VITE_FIREBASE_API_KEY="your_api_key"`  
>    `VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"`  
>    `VITE_FIREBASE_PROJECT_ID="your_project_id"`  
>    `VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"`  
>    `VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"`  
>    `VITE_FIREBASE_APP_ID="your_app_id"`  
> 4. **Run Development Server**  
>    `npm run dev`  
>    Buka http://localhost:5173 di browser Anda.

## ---

**🚀 Penggunaan**

### **Menjalankan Skrip**

`# Mode Pengembang (Development)`  
`npm run dev`

`# Kompilasi Production Build`  
`npm run build`

`# Preview Production Build`  
`npm run preview`

`# Jalankan Pengujian (Testing)`  
`npm run test`

### **User Guide**

> 1. **Registrasi/Login**: Pengguna dapat masuk menggunakan akun aman terverifikasi via Firebase Auth.  
> 2. **Monitoring Dashboard**: Memantau ringkasan omzet *omnichannel* harian dan pergerakan stok dalam satu layar.  
> 3. **Pencatatan Rekap**: Memasukkan data transaksi manual atau impor CSV/Excel untuk rekapitulasi presisi.  
> 4. **Analisis AI**: Buka modul *AI Insight Hub* untuk memperoleh rekomendasi bisnis otomatis.

## ---

**📚 API Documentation**

### **Base Data Operations (client.ts)**

Aplikasi ini berkomunikasi langsung dengan Firebase Cloud Firestore via abstraksi API client:

#### **Firestore Collections**

> * /recaps: Mengambil dan menambah rekap penjualan & timestamp presisi  
> * /products: Pengelolaan inventaris stok dan SKU produk  
> * /customers: Mengambil daftar data pelanggan  
> * /transactions: Riwayat rincian transaksi harian

#### **Example Usage**

`import { addRecap } from './api/client';`

`// Menambahkan transaksi baru dengan presisi timestamp`  
`await addRecap({`  
  `source: 'TikTok Shop',`  
  `totalAmount: 150000,`  
  `unitsSold: 2,`  
  `date: '2026-08-30',`  
  `createdAt: new Date().toISOString()`  
`});`

## ---

**🧪 Testing**

### **Running Tests**

Aplikasi dilengkapi unit testing dan component testing menggunakan Vitest:  
`# Jalankan pengujian penuh`  
`npm run test`

`# Mode pengujian otomatis (watch mode)`  
`npm run test:watch`

### **Test Coverage**

> * **Statements**: 92.4%  
> * **Branches**: 88.5%  
> * **Functions**: 90.1%  
> * **Lines**: 93.0%

## ---

**📄 Lisensi**

Proyek ini dilisensikan di bawah **MIT License** \- lihat file [LICENSE](http://docs.google.com/LICENSE) untuk detail lebih lanjut.  
---

**Made with ❤️ by CARIIN NAMA TIM YG ANOMALI DONG for ITECHNO CUP 2026**