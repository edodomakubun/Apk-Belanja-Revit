# Cloudflare Deployment Guide

Panduan ini membantu Anda men-deploy aplikasi Next.js `kas-app` ke Cloudflare Pages.

## 1. Prasyarat

- Node.js terbaru (disarankan 20+)
- Akun Cloudflare dengan akses Pages
- GitHub repository untuk source code atau upload manual
- Akses environment variables di Cloudflare Pages

## 2. Install dependensi yang dibutuhkan

Di root proyek, jalankan:

```bash
npm install
npm install -D next-on-pages wrangler
```

> `next-on-pages` diperlukan untuk build Next.js versi 16 pada Cloudflare Pages.
> `wrangler` berguna untuk deploy CLI dan manajemen Pages.

## 3. Konfigurasi `package.json`

Pastikan `package.json` memiliki skrip:

```json
"scripts": {
  "dev": "next dev",
  "build": "next-on-pages",
  "start": "next start",
  "lint": "eslint",
  "deploy": "wrangler pages deploy . --project-name=apk-belanja-revit"
}
```

## 4. Isi `account_id` di `wrangler.toml`

### Cara mendapatkan account_id Cloudflare

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Di URL bar, perhatikan format: `https://dash.cloudflare.com/<account_id>/...`
3. Copy nilai `<account_id>` tersebut
4. Buka `wrangler.toml` di folder root proyek
5. Ganti `account_id = "YOUR_ACCOUNT_ID"` dengan account_id Anda:

```toml
account_id = "abc123def456abc123def456"
```

### Verifikasi Cloudflare account

Setelah isi account_id, jalankan:

```bash
npx wrangler whoami
```

Jika berhasil, akan tampil email akun Cloudflare Anda.

## 5. Perhatikan kode aplikasi

Aplikasi sudah dipersiapkan untuk Cloudflare dengan catatan:

- `src/db/index.ts` mendukung:
  - D1 binding global `kas_sekolah_db` (jika di Cloudflare Pages)
  - Fallback `process.env.DB_URL`
  - Fallback lokal SQLite untuk development
- Endpoint backup lokal di `src/app/api/backup/route.ts` hanya berjalan di development
- Semua file app dan route sudah set `export const runtime = "edge"`
- Tidak menggunakan file sistem lokal di production

## 6. Setting Environment Variables dan D1 di Cloudflare Pages

Tambahkan environment variables berikut di dashboard Pages:

- `JWT_SECRET` : rahasia JWT untuk login
- `DB_URL` : URL koneksi LibSQL atau endpoint database lain
- `NODE_ENV` : `production`

Jika Anda sudah membuat D1 database, `wrangler.toml` kini sudah berisi binding D1:

```toml
[[d1_databases]]
binding = "kas_sekolah_db"
database_name = "kas-sekolah-db"
database_id = "860066c9-834c-4440-b361-cbb7396b7ccd"
```

Untuk D1 di Cloudflare Pages, binding `kas_sekolah_db` akan tersedia di runtime.

Kode aplikasi kini juga mendukung D1 binding global dari Cloudflare Pages. Saat binding tersedia, `src/db/index.ts` akan menggunakan objek global `kas_sekolah_db` atau `KAS_SEKOLAH_DB`.

Pastikan juga menambahkan compatibility flag `nodejs_compat` di dashboard Cloudflare:

- Workers & Pages > [your app] > Settings > Functions > Compatibility flags

Jika menggunakan CLI dan `wrangler`, set secret dengan:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put DB_URL
```

> Di Cloudflare Pages, environment variables biasanya diset pada halaman `Settings > Variables and Secrets`.

## 7. Verifikasi Build Sebelum Deploy

Sebelum deploy, pastikan build Next.js berjalan tanpa error:

```bash
npm install
npm run build
```

Jika berhasil, akan ada output folder `.vercel/output/` atau `.next/` tergantung konfigurasi.

Jika ada error, periksa:
- Syntax TypeScript di `src/`
- Import module yang hilang
- Environment variable yang diperlukan

## 8. Deploy ke Cloudflare Pages

### Pilihan A: Cloudflare Pages UI

1. Buka dashboard Cloudflare Pages
2. Buat project baru dari GitHub repository
3. Build command: `npm run build`
4. Root directory: `.`
5. Publish directory: `.`
6. Simpan dan deploy

### Pilihan B: CLI via Wrangler

```bash
npm run build
npm run deploy
```

Jika `wrangler` meminta `account_id`, ikuti instruksi login dan pilih akun Cloudflare.

> Anda juga bisa menambahkan `wrangler.toml` di root proyek untuk menyimpan nama project dan perintah build.
> Contoh file `wrangler.toml` sudah dibuat di root proyek.

## 9. Verifikasi Setelah Deploy

Cek aplikasi di URL Pages dan pastikan:

- Halaman login berjalan
- API route seperti `/api/auth/login`, `/api/transactions`, `/api/master/buildings` dapat diakses
- `DB_URL` berfungsi dan query data valid

## 10. Catatan Penting

- Endpoint backup produksi tidak lagi membaca file lokal.
- Untuk backup database di Cloudflare D1 atau LibSQL, gunakan mekanisme backup platform mereka.
- Jika Anda menggunakan D1, pastikan database URL valid dan secret tersimpan di environment.

## 11. Checklist Verifikasi Final Sebelum Deploy

Pastikan semua poin ini sudah selesai sebelum deploy:

- [ ] `wrangler.toml`:
  - [ ] `account_id` sudah diisi dengan account ID Cloudflare Anda
  - [ ] D1 binding sudah ada:
    - `binding = "kas_sekolah_db"`
    - `database_id = "860066c9-834c-4440-b361-cbb7396b7ccd"`
  - [ ] `compatibility_flags = ["nodejs_compat"]` sudah ada

- [ ] Environment & Secrets di Cloudflare Pages:
  - [ ] `JWT_SECRET` sudah diset
  - [ ] `DB_URL` sudah diset (atau akan menggunakan D1 binding)
  - [ ] `NODE_ENV` = `production` (opsional, biasanya auto)

- [ ] Build lokal:
  - [ ] `npm install` berhasil
  - [ ] `npm run build` berhasil tanpa error

- [ ] D1 Database:
  - [ ] Database `kas-sekolah-db` sudah ada di Cloudflare
  - [ ] Database binding sudah diatur di Pages (Settings > Functions > D1 Databases)

- [ ] Cloudflare Pages Settings:
  - [ ] Compatibility flags: `nodejs_compat` sudah diaktifkan
  - [ ] Build command: `npm run build`
  - [ ] Root directory: `.`
  - [ ] Publish directory: `.`

Setelah semua checklist selesai, Anda siap menjalankan `npm run deploy`.

## 12. Troubleshooting

- Build error: pastikan `next-on-pages` sudah terinstall dan `npm install` sukses.
- API error: cek environment variable `DB_URL` dan `JWT_SECRET`.
- Jika ada error `fs` atau `path`, pastikan endpoint backup tidak dipanggil di production.
- D1 connection error: pastikan D1 database binding sudah diset di Cloudflare Pages settings.
