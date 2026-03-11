# Panduan Deploy ZONA BANJAR ke Cloudflare

Aplikasi ini dibangun menggunakan **React (Vite)**. Cara terbaik dan paling optimal untuk men-deploy aplikasi ini ke ekosistem Cloudflare adalah menggunakan **Cloudflare Pages** (yang secara internal berjalan di atas infrastruktur **Cloudflare Workers**).

## Mengapa Cloudflare Pages?
Cloudflare Pages dirancang khusus untuk aplikasi frontend (seperti React/Vite) dan mendukung **Functions** (Cloudflare Workers) jika Anda ingin menambahkan backend API.

---

## Langkah-langkah Deployment

### Opsi 1: Deploy Otomatis via GitHub (Sangat Disarankan)
Ini adalah cara paling mudah. Setiap kali Anda melakukan `git push`, Cloudflare akan otomatis membangun dan men-deploy aplikasi Anda.

1. **Ekspor Proyek:**
   Gunakan menu **Settings > Export to GitHub** di AI Studio untuk menyimpan proyek ini ke repository GitHub Anda.
2. **Buka Dashboard Cloudflare:**
   Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/), pilih menu **Workers & Pages**.
3. **Buat Aplikasi Baru:**
   Klik tombol **Create application** > Pilih tab **Pages** > Klik **Connect to Git**.
4. **Pilih Repository:**
   Pilih repository GitHub tempat Anda mengekspor proyek ini.
5. **Konfigurasi Build:**
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
6. **Tambahkan Environment Variable (SANGAT PENTING):**
   - Scroll ke bawah, klik **Environment variables (advanced)**.
   - Tambahkan variabel baru:
     - Variable name: `GEMINI_API_KEY`
     - Value: `(Masukkan API Key Gemini Anda di sini)`
7. **Deploy:**
   Klik **Save and Deploy**. Selesai!

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
   Setelah berhasil di-deploy, buka Dashboard Cloudflare > Pages > `zona-banjar-ai` > Settings > Environment variables. Tambahkan `GEMINI_API_KEY` dan isi dengan API Key Anda.
   *(Catatan: Anda harus melakukan deploy ulang / retry deployment agar API Key ini masuk ke dalam build).*

---

## Menambahkan Backend API (Cloudflare Workers)
Jika Anda ingin menyembunyikan API Key dari browser (untuk keamanan production), Anda bisa membuat backend API menggunakan **Cloudflare Pages Functions**.

Cukup buat folder `functions/` di root proyek ini. File di dalamnya akan otomatis menjadi endpoint API (Cloudflare Workers).

Contoh: Buat file `functions/api/hello.ts`
```typescript
export async function onRequest(context) {
  return new Response("Hello from Cloudflare Worker!");
}
```
Endpoint ini akan bisa diakses di `https://zona-banjar-ai.pages.dev/api/hello`.
