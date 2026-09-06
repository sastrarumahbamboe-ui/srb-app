# Jurnal Sastra Rumah Bamboe (SRB) — dari PWA ke APK

## Kenapa tidak langsung dipasang di blogspot.com?

Blogger (blogspot.com) **tidak mengizinkan** kamu meng-upload file sendiri
(`manifest.json`, `service-worker.js`, ikon, dsb.) ke domain blog kamu.
Karena itu, PWA ini dibuat sebagai **situs terpisah** yang **mengambil
tulisan langsung dari blog Blogger kamu** (lewat feed publik Blogger,
tanpa perlu API key). Kamu tetap menulis di Blogger seperti biasa —
aplikasi ini otomatis menampilkan tulisan terbarunya.

## Langkah 1 — Host PWA ini di suatu tempat

Pilih salah satu (semuanya gratis):

**A. GitHub Pages (paling gampang & permanen)**
1. Buat akun GitHub (kalau belum ada), buat repository baru, misal `srb-pwa`.
2. Upload semua file di folder ini (`index.html`, `style.css`, `app.js`,
   `manifest.json`, `service-worker.js`, folder `icons/`) ke repository itu.
3. Buka **Settings → Pages**, pilih branch `main`, folder `/root`, simpan.
4. Setelah beberapa menit, situs kamu aktif di:
   `https://<username-github>.github.io/srb-pwa/`

**B. Netlify / Vercel**
- Daftar akun, lalu "drag and drop" folder ini ke dashboard mereka.
  Situs langsung online dengan URL seperti `https://srb-pwa.netlify.app`.

Pastikan situsnya diakses lewat **HTTPS** (semua opsi di atas otomatis HTTPS) —
ini wajib supaya PWA & service worker berfungsi.

## Langkah 2 — Uji coba PWA di HP

1. Buka URL situs kamu (hasil Langkah 1) di Chrome Android.
2. Harusnya muncul beranda koran dengan tulisan terbaru dari blog kamu.
3. Coba tombol kategori (Puisi, Cerpen, dst) dan kolom pencarian.
4. Chrome biasanya menawarkan **"Tambahkan ke layar Utama" / "Pasang aplikasi"**
   secara otomatis — atau tombol "Pasang" di pojok kanan atas aplikasi.

Kalau semua berjalan lancar di Langkah 2, PWA-nya sudah siap dibungkus jadi APK.

## Langkah 3 — Bungkus jadi APK dengan PWA Builder

1. Buka **https://www.pwabuilder.com** di browser laptop/desktop.
2. Masukkan URL situs kamu dari Langkah 1, klik **Start**.
3. PWA Builder akan memindai `manifest.json` dan service worker-nya —
   pastikan skornya hijau/baik (manifest sudah lengkap dengan `name`,
   `icons`, `start_url`, `display: standalone`, sesuai yang sudah disiapkan).
4. Klik **Package for Stores → Android**.
5. Isi Package ID dengan: `com.sastrarumahbamboe.srb`
6. Klik **Generate**, lalu unduh file `.zip` hasilnya — di dalamnya ada
   file **`.apk`** (untuk diinstal langsung/dites) dan **`.aab`**
   (untuk diunggah ke Google Play Store).

## Langkah 4 — Pasang APK di HP Android

1. Salin file `.apk` ke HP Android.
2. Buka file itu di HP (mungkin perlu mengizinkan "Instal dari sumber
   tidak dikenal" di pengaturan HP untuk sekali ini).
3. Aplikasi "Jurnal Sastra Rumah Bamboe" akan terpasang seperti aplikasi
   biasa, lengkap dengan ikon di layar utama.

## Kalau nanti ingin publish ke Google Play Store

- Perlu akun Google Play Console (biaya pendaftaran sekali ~US$25).
- Upload file `.aab` dari Langkah 3, lengkapi deskripsi, screenshot,
  kebijakan privasi, lalu ajukan untuk ditinjau Google.
- Saya bisa bantu susun draf deskripsi Play Store & kebijakan privasi
  kalau kamu sudah sampai ke tahap ini — tinggal bilang saja.

## Merawat aplikasinya ke depan

- **Tulisan baru** di Blogger otomatis muncul di aplikasi — tidak perlu
  update APK setiap kali menulis.
- **Ubah tampilan/fitur** (warna, tambah kategori, dsb.) → edit file
  `style.css` / `app.js` / `index.html` di repository (Langkah 1),
  situs otomatis ter-update. APK yang sudah terpasang di HP orang lain
  akan ikut ter-update sendiri (karena isinya dimuat dari internet),
  kecuali kamu ubah struktur besar yang perlu APK baru.
