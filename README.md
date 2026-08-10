# SRE UPNVJT — Website & Dashboard
**Society of Renewable Energy — UPN Veteran Jawa Timur**

---

## Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Database:** PostgreSQL via Supabase
- **ORM:** Drizzle ORM v0.45
- **Auth:** NextAuth.js v4

---

## Setup Awal

### 1. Clone Repo
```bash
git clone https://github.com/mraynar/sre-upnvjt.git
cd sre-upnvjt
npm install
```

### 2. Buat Project Supabase
1. Buka https://supabase.com → login → **New Project**
2. Isi nama project, buat password (simpan di password manager, jangan di chat)
3. Region: Northeast Asia (Tokyo)
4. Tunggu ~2 menit

> Setiap developer sebaiknya punya project Supabase **sendiri** untuk development lokal. Jangan pakai project production untuk coba-coba schema. Lihat [Staging & Production](#staging--production).

### 3. Ambil Connection String
1. Supabase dashboard → klik **Connect**
2. Pilih **Session Pooler** (bukan Direct Connection — direct connection butuh IPv6 yang sering gagal di jaringan lokal)
3. Tab **ORM** → copy `DATABASE_URL`

### 4. Setup .env
```bash
cp .env.example .env
```
Isi file `.env`:
```
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-1-xxx.pooler.supabase.com:5432/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate sendiri, jangan pakai contoh dari repo>"
```
> `SUPABASE_URL` dan `PUBLISHABLE_KEY`: Supabase → Settings → API Keys
>
> **Jangan pernah commit `.env`** dan jangan pernah kirim isinya lewat WhatsApp/Slack/chat biasa. Lihat [Keamanan Kredensial](#keamanan-kredensial).

### 5. Buat Tabel Database

**Jangan copy-paste SQL manual lagi.** Gunakan Drizzle sebagai satu-satunya sumber kebenaran schema:

```bash
npx drizzle-kit push
```

Perintah ini membaca `src/db/schema.js` dan membuat/menyesuaikan tabel di database secara otomatis. Baca preview perubahan yang ditampilkan sebelum konfirmasi — kalau ada statement `DROP COLUMN` atau `DROP TABLE` yang tidak diharapkan, batalkan dan cek dulu ke tim.

### 6. Seed Data Awal
```bash
node seed.mjs
```

Akun default (development lokal saja — **ganti sebelum deploy ke production**):

> Daftar akun default (email & password) akan diupdate di sini menyusul — cek dokumen kredensial tim atau tanya Admin sebelum itu tersedia.

> Ganti password setelah pertama login. Untuk production, akun awal dibuat oleh reviewer/manager, bukan lewat seed default.

### 7. Jalankan Project
```bash
npm run dev
```
Buka: http://localhost:3000

---

## Setiap Kali Mulai Kerja (Wajib, Sebelum Coding)

Lakukan urutan ini **setiap kali** mau mulai mengerjakan sesuatu, bukan cuma sekali di awal:

1. **Sync branch dengan `main`:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/[nama]-[modul]
   ```

2. **Cek apakah ada perubahan schema yang belum kamu apply ke database lokal.**
   Kalau `src/db/schema.js` berubah di `main` (misal ada developer lain yang menambah kolom/tabel), database lokal kamu bisa jadi tidak sinkron. Selalu jalankan:
   ```bash
   npx drizzle-kit push
   ```
   ke **database development/staging milik kamu sendiri** — bukan ke production. Baca preview perubahan sebelum konfirmasi.

   > Bagian ini masih perlu disempurnakan (alur staging per-developer belum final). Ditulis dulu sebagai baseline yang benar secara prinsip — detail teknis staging akan diupdate menyusul.

3. **Install dependency baru kalau ada:**
   ```bash
   npm install
   ```
   (kalau `package.json` berubah sejak terakhir kamu pull)

4. **Baru mulai coding.**

### Kalau Kamu Mengubah Schema (`src/db/schema.js`)

Sebelum commit, wajib jalankan:
```bash
npx drizzle-kit generate
```
lalu commit `schema.js` **bersama** file migration yang baru dibuat di folder `drizzle/`, dalam commit yang sama. Jangan commit perubahan schema tanpa migration file-nya — ini yang menyebabkan production error kolom hilang di masa lalu.

### Sebelum Push / Buka PR

- Pastikan tidak ada error koneksi database yang ke-skip pas testing lokal.
- Kalau ada perubahan schema, pastikan folder `drizzle/` ada file migration baru yang sesuai.
- Jangan push langsung `.env` atau kredensial apa pun.

---

## Database Workflow (WAJIB DIBACA)

Aturan ini ada karena pengalaman nyata: PR besar yang schema-nya berubah tanpa migration file menyebabkan production error kolom hilang satu per satu, ditemukan manual lewat trial-and-error di setiap halaman.

### 4 Aturan Utama

1. **Ubah `schema.js` → jalankan `drizzle-kit generate` → commit file migration di commit yang sama.**
   ```bash
   npx drizzle-kit generate
   git add src/db/schema.js drizzle/
   git commit -m "feat: tambah kolom X ke tabel Y"
   ```
   Jangan pernah commit perubahan `schema.js` tanpa file migration yang menyertainya.

2. **Test migration di staging dulu, bukan langsung ke production.**
   Lihat [Staging & Production](#staging--production).

3. **PR review wajib cek folder `drizzle/`.**
   Kalau ada perubahan di `schema.js` tanpa file baru yang sesuai di `drizzle/`, PR tidak di-approve sampai diperbaiki.

4. **Migration ke production hanya dijalankan oleh reviewer/manager setelah PR di-approve.**
   Bukan oleh sembarang developer secara langsung.

### Staging & Production

- Staging: 1 project Supabase terpisah, khusus untuk test migration sebelum ke production (Supabase free tier mendukung hingga 2 project gratis).
- Alur: dev lokal → staging → review → production.
- Jangan pernah jalankan migration langsung ke production tanpa lolos staging dulu.

### Kalau Menemukan Schema Production Tidak Sinkron

```bash
npx drizzle-kit push
```
Perintah ini membandingkan `schema.js` dengan database aktual dan menampilkan **semua** perbedaan sekaligus — jauh lebih cepat daripada menemukan satu per satu lewat error runtime di setiap halaman. Selalu baca preview-nya baik-baik sebelum approve, terutama statement yang destruktif (`DROP COLUMN`, `DROP TABLE`).

---

## Keamanan Kredensial

- **Jangan pernah** kirim API key, secret, token, atau password database lewat WhatsApp, Slack, atau chat biasa lainnya — termasuk ke AI assistant manapun. Begitu sebuah kredensial masuk ke riwayat chat, anggap sudah bocor dan **wajib di-rotate**, terlepas dari apakah percakapannya "private" atau tidak.
- Gunakan password manager dengan shared vault (1Password, Bitwarden) untuk berbagi kredensial dalam tim.
- Kalau belum ada budget untuk vault, minimal gunakan file terenkripsi atau transfer langsung (AirDrop), bukan chat yang tersimpan permanen di cloud backup.
- `.env.example` harus selalu up-to-date dengan komentar penjelasan tiap variable, supaya staff baru tidak bingung field mana yang wajib diisi.
- Kalau kredensial pernah ter-expose (chat, screenshot, commit tidak sengaja), rotate segera — jangan ditunda dengan alasan "nanti setelah kerjaan ini selesai".

---

## Git Workflow

### Sebelum Mulai Kerja
```bash
git checkout main
git pull origin main
```

### Buat Branch
```bash
git checkout -b feature/[nama]-[modul]
```

### Commit & Push
```bash
git add .
git commit -m "feat: deskripsi singkat"
git push origin feature/[nama]-[modul]
```

### Pull Request
1. Buka github.com/mraynar/sre-upnvjt
2. Klik **Compare & pull request**
3. Tulis deskripsi + screenshot
4. **Jangan merge sendiri — tunggu review Admin**

### Ukuran PR

Satu PR = satu fitur. Jangan gabungkan beberapa fitur berbeda ke satu PR besar — ini menyulitkan review dan membuat rollback berisiko menyeret fitur lain yang sudah benar. Kalau fitur besar, pecah jadi beberapa PR bertahap.

### Aturan
- Dilarang push langsung ke `main`
- Dilarang edit file milik staff lain tanpa konfirmasi
- Satu branch = satu fitur
- Jangan commit file `.env`
- Update Progress Tracker setiap ada perubahan
- Perubahan `schema.js` wajib disertai file migration (lihat [Database Workflow](#database-workflow-wajib-dibaca))

### Konvensi Branch
| Nama | Format |
|---|---|
| Raynar | feature/raynar-[modul] |
| Ghulam | feature/ghulam-[modul] |
| Riko | feature/riko-[modul] |
| Kaka | feature/kaka-[modul] |

### Konvensi Commit
| Prefix | Kegunaan |
|---|---|
| feat: | Fitur baru |
| fix: | Perbaikan bug |
| style: | Perubahan tampilan |
| refactor: | Refactor kode |
| docs: | Update dokumentasi |

---

## Role & Akses

| Role | Akses |
|---|---|
| SUPER_ADMIN | Semua fitur admin |
| STAFF_ACE | Bank Literatur, Quiz |
| STAFF_HR | Tugas, PPT, Quiz, Leaderboard |
| MEMBER | Materi, Quiz, Leaderboard, Absensi |
| Visitor | Halaman publik |

> Semua role yang direferensikan di kode (`middleware.js`, `KNOWN_ROLES` di NextAuth config) harus ada di tabel `role` pada database. Kalau menambah role baru di kode, pastikan juga insert row-nya ke database sebagai bagian dari migration/seed — jangan sampai kode mengasumsikan role yang belum pernah dibuat.

---

## Struktur Folder
```
src/
├── app/
│   ├── (dashboard)/    # Panel admin
│   ├── (member)/       # Halaman member
│   ├── (staff)/        # Halaman staff
│   ├── api/            # API routes
│   ├── actions/        # Server actions
│   └── [halaman publik]
├── components/         # Komponen global
├── db/schema.js        # Schema database — sumber kebenaran, selalu jalankan drizzle-kit generate setelah ubah ini
├── lib/
│   ├── db.js           # Koneksi database
│   └── permissions.js  # RBAC
└── middleware.js        # Route protection
```

---

## Panduan Konfigurasi Google Drive OAuth 2.0 (Upload File Tugas)

Aplikasi ini menggunakan **Google Drive OAuth 2.0 (Refresh Token)** untuk mengunggah file tugas secara langsung tanpa terkena limitasi kuota 0 GB milik *Service Account*. Sistem ini memanfaatkan kuota Drive pribadi / Workspace Anda yang lega (misal: 15 GB atau 5 TB).

Berikut adalah cara mendapatkan **Client ID**, **Client Secret**, dan **Refresh Token** untuk mengisi file `.env`:

### Langkah 1: Mendapatkan Client ID & Secret
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada.
3. Di menu sebelah kiri, masuk ke **APIs & Services** > **Credentials**.
4. Klik tombol **+ CREATE CREDENTIALS** > pilih **OAuth client ID**. 
   *(Jika Anda belum pernah mengatur OAuth, sistem akan meminta Anda mengatur **Consent Screen** terlebih dahulu. Pilih tipe "External", isi nama aplikasi, dan yang paling penting: **tambahkan email Anda sendiri ke bagian "Test users"**. Setelah itu kembali ke halaman Credentials).*
5. Pilih **Application type:** `Web application`.
6. Pada kolom **Authorized redirect URIs**, wajib masukkan URL ini secara persis:
   `https://developers.google.com/oauthplayground`
7. Klik **Create/Simpan**.
8. Anda akan mendapatkan **Client ID** dan **Client Secret**. Salin dan masukkan kedua kode tersebut ke dalam variabel `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di file `.env` Anda.

### Langkah 2: Mendapatkan Refresh Token
1. Buka halaman resmi [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Di pojok kanan atas layar, klik ikon **Gear (Pengaturan)**.
3. Centang kotak **Use your own OAuth credentials**.
4. Masukkan **Client ID** dan **Client Secret** Anda ke dalam kotak yang tersedia, lalu klik *Close*.
5. Di panel sebelah kiri (Step 1), cari dan klik grup **Drive API v3**.
6. Centang *scope* (izin) yang bertuliskan: `https://www.googleapis.com/auth/drive`.
7. Klik tombol biru **Authorize APIs** di bagian bawah.
8. Anda akan diarahkan ke halaman *Login* Google. Silakan *login* menggunakan akun Google (email) yang ingin Anda gunakan sebagai penampung data tugas (yang kapasitasnya lega).
9. Jika ada peringatan *"Google hasn't verified this app"*, hiraukan saja (karena ini aplikasi Anda sendiri). Klik **Continue / Lanjutkan**.
10. Setelah diarahkan kembali ke OAuth Playground, perhatikan panel **Step 2**.
11. Klik tombol biru **Exchange authorization code for tokens**.
12. Halaman akan menampilkan **Refresh token**. Salin kode *Refresh token* tersebut dan masukkan ke dalam variabel `GOOGLE_REFRESH_TOKEN` di file `.env` Anda!

**Selesai!** 
Aplikasi SRE Anda kini memiliki akses mutlak ke Google Drive Anda secara permanen. *Access Token* yang berdurasi 1 jam akan otomatis diperbarui (*auto-refresh*) oleh server Next.js di balik layar setiap kali kedaluwarsa. 

> **PENTING:** Jika aplikasi Anda di Google Cloud Console berstatus **"Testing"** (di halaman *OAuth consent screen*), maka **Refresh Token hanya akan bertahan selama 7 HARI**. Agar *Refresh Token* bersifat abadi/permanen selamanya, pastikan Anda mengeklik tombol **PUBLISH APP** (Ubah statusnya menjadi *"In production"*) di halaman *OAuth consent screen* tersebut!

---

*SRE UPNVJT Web Development Division — 2026*
