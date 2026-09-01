<div align="center">

  # 🏪 ZURA — UMKM Pulse
  ### Multi-Channel Retail & Inventory Management Platform Powered by Event-Driven Sync & AI Copilot

  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-5F1E1E?style=for-the-badge&logo=vercel&logoColor=white)](https://zura-umkm.vercel.app)
  [![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Mie-Yamin/Zura-UMKM)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

  **Submission for ITECHNO CUP 2026 - Web Development**

  **By Tim Mie-Yamin (SMKN 8 Jakarta)**

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Unggulan](#-fitur-unggulan)
- [Demo & Screenshot](#-demo--screenshot)
- [Teknologi](#-teknologi)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Instalasi & Setup](#-instalasi--setup)
- [Penggunaan](#-penggunaan)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Tim Developer](#-tim-developer)
- [Lisensi](#-lisensi)

---

## 👥 Tim Developer

| Nama | Peran | GitHub |
|------|-------|--------|
| **Naurah Salsabila** | Lead Full Stack & UI/UX Engineer | [@Mie-Yamin](https://github.com/Mie-Yamin) |

---

## 🎯 Tentang Proyek

### Latar Belakang
Berdasarkan data Kementerian Koperasi dan UKM, Indonesia memiliki lebih dari 64 juta pelaku UMKM. Namun, banyak dari mereka mengalami kendala operasional saat berjualan secara **multi-channel** (Shopee, Tokopedia, TikTok Shop, dan Toko Fisik/Bazar). 

Beberapa kendala utama yang sering dihadapi UMKM meliputi:
1. **Overselling & Stok Mati (*Deadstock*)**: Ketidakselarasan stok antara toko fisik dan *marketplace* yang menyebabkan pembatalan pesanan konsumen secara sepihak.
2. **Rekap Manual yang Menguras Waktu**: Pelaku usaha menghabiskan waktu bertajak-tajak setiap malam hanya untuk mencocokkan laporan transaksi Excel/CSV dari berbagai saluran penjual.
3. **Format Laporan Berbeda-beda**: Format *export* laporan dari masing-masing *marketplace* tidak seragam, membingungkan pencatatan HPP dan Laba Rugi.

### Solusi yang Ditawarkan
**Zura (UMKM Pulse)** hadir sebagai platform manajemen ritel terintegrasi yang menyelesaikan masalah operasional UMKM melalui 3 pilar inovasi:
- ⚡ **Event-Driven Webhook Real-Time Sync**: Setiap ada transaksi masuk di *marketplace*, stok di pusat otomatis terpotong detik itu juga.
- 🧠 **Smart Column Auto-Mapping & Preview**: Membaca laporan CSV/Excel ekspor *marketplace* dengan nama kolom apa pun tanpa perlu *formatting* manual.
- 🤖 **Zura AI Copilot (xAI Grok Engine)**: Asisten bisnis cerdas berbasis AI yang memberikan analisis krisis stok, omset, dan saran aksi bisnis secara *real-time*.

### Tujuan Proyek
- 🎯 **Tujuan Utama**: Menyediakan sistem inventaris dan rekap penjualan multi-saluran terpusat yang responsif, cepat, dan mudah digunakan oleh UMKM skala mikro hingga menengah.
- 📊 **Target Pengguna**: Pemilik Usaha Kecil Menengah (UMKM Ritel, F&B, Fashion, dan Sembako) yang berjualan di *online marketplace* maupun toko fisik.
- 💡 **Value Proposition**: Bebas penataan ulang format Excel, sinkronisasi otomatis multi-saluran, dan analisis cerdas AI Copilot berdesain ramah seluler (*mobile-first*).

---

## ✨ Fitur Unggulan

### Fitur Utama

| Fitur | Deskripsi | Keunggulan |
|-------|-----------|------------|
| ⚡ **Simulasi Webhook Event-Driven** | Menguji sinkronisasi pesanan dari Shopee, TikTok Shop, dan Tokopedia secara *real-time*. | Stok fisik di pusat otomatis terpotong instan tanpa perlu transaksi *marketplace* sungguhan saat demo. |
| 📊 **Impor Excel & Smart Column Mapper** | Membaca laporan transaksi Excel/CSV dengan fitur deteksi header dan *custom column mapping*. | Pengguna bebas dari format tabel kaku. Bebas mengunggah nama header apa saja (*Barang*, *Qty*, *Harga Satuan*). |
| 🤖 **Zura AI Copilot (xAI Grok Engine)** | Asisten AI interaktif yang terhubung ke database Firestore untuk menjawab pertanyaan bisnis. | Memberikan analisis kontekstual riil berdasarkan stok kritis dan total omset toko pengguna. |
| 📦 **Manajemen Stok & Mode HPP Grosir** | Kalkulator otomatis HPP per pcs berdasarkan pembelian harga modal dus/grosir. | Mempermudah penentuan harga jual dan mendeteksi stok kritis/menipis secara presisi. |

### Fitur Tambahan

- 🔄 **SOP Checklist Operasional Harian**: Daftar tugas rutinitas toko harian yang dapat di-reset, disesuaikan, atau menggunakan *preset template* (Online/F&B).
- 🏷️ **Custom Saluran & Kategori Usaha**: Pencatatan dinamis untuk saluran jualan custom (WhatsApp, Bazar, Lazada) dan kategori produk kustom.
- 📱 **Mobile-First Responsive Design**: Tampilan antarmuka khusus seluler (Card Stack, Flex Layout) yang nyaman diakses melalui smartphone.
- 🛡️ **Pengaturan Keamanan Akun & Re-authentication**: Sistem autentikasi Firebase yang aman untuk pembaruan email, kata sandi, dan penghapusan akun.

---

## 📸 Demo & Screenshot

### Live Demo
🔗 **[Kunjungi Website Zura-UMKM](https://zura-umkm.vercel.app)**

### Screenshot Aplikasi

<div align="center">
  <img src="public/shopee.png" alt="Zura Platform Preview" width="800"/>
  <p><em>Zura Multi-Channel Retail & Inventory Dashboard</em></p>
</div>

---

## 🛠️ Teknologi

### Tech Stack

#### Frontend
