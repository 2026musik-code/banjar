# Panduan Deploy ZONA BANJAR ke Cloudflare

Aplikasi ini dibangun menggunakan **React (Vite)** dan **Cloudflare Workers**. 

## Mengapa Cloudflare Workers?
Proyek ini menggunakan fitur terbaru **Cloudflare Workers Assets** yang memungkinkan Anda men-deploy aplikasi frontend (React/Vite) sekaligus dengan backend API dalam satu Worker yang sama.

---

## Langkah-langkah Deployment

### Opsi 1: Deploy Otomatis via GitHub (Sangat Disarankan)
Ini adalah cara paling mudah. Setiap kali Anda melakukan `git push`, Cloudflare akan otomatis membangun dan men-deploy aplikasi Anda.

1. **Ekspor Proyek:**
   Gunakan menu **Settings > Export to GitHub** di AI Studio untuk menyimpan proyek ini ke repository GitHub Anda.
2. **Buka Dashboard Cloudflare:**
   Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/), pilih menu **Workers & Pages**.
3. **Buat Aplikasi Baru:**
   Klik tombol **Create application** > Pilih tab **Workers** > Klik **Connect to Git**.
4. **Pilih Repository:**
   Pilih repository GitHub tempat Anda mengekspor proyek ini.
5. **Konfigurasi Build:**
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
6. **Tambahkan Environment Variable (SANGAT PENTING):**
   - Setelah deploy selesai, buka menu **Settings > Variables and Secrets** di pengaturan Worker Anda.
   - Tambahkan variabel baru:
     - Variable name: `GEMINI_API_KEY`
     - Value: `(Masukkan API Key Gemini Anda di sini)`
7. **Deploy Ulang:**
   Agar API Key terbaca, lakukan deploy ulang atau push perubahan kecil ke GitHub.

---

### Opsi 2: Deploy Manual via Wrangler CLI (Terminal)
Jika Anda ingin men-deploy dari komputer lokal Anda.

1. **Ekspor Proyek:**
   Unduh proyek ini sebagai file ZIP dari AI Studio dan ekstrak di komputer Anda.
2. **Install Dependencies:**
   Buka terminal di folder proyek dan jalankan:
   ```bash
   npm install
   ```
3. **Login ke Cloudflare:**
   ```bash
   npx wrangler login
   ```
4. **Deploy Aplikasi:**
   Jalankan perintah yang sudah kami siapkan di `package.json`:
   ```bash
   npm run deploy
   ```
5. **Tambahkan API Key di Dashboard:**
   Setelah berhasil di-deploy, buka Dashboard Cloudflare > Workers & Pages > `zona-banjar-ai` > Settings > Variables and Secrets. Tambahkan `GEMINI_API_KEY` dan isi dengan API Key Anda.

---

## Backend API (Cloudflare Workers)
Backend API diatur di dalam file `src/worker.ts`. File ini bertugas untuk menangani rute API (seperti `/api/keys`) dan juga menyajikan file statis React (SPA routing).
