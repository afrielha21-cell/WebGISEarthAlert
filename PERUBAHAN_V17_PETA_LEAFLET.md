# EarthAlert WebGIS V17 — Perubahan Peta Atlas ML

## Perubahan yang dilakukan

- Mengganti **peta SVG statis dengan Leaflet 1.9.4** seperti pratinjau `ATLAS_ML_BMKG_PRATINJAU.html`.
- Menggunakan Esri **Ocean/World_Ocean_Base** dan **World_Imagery** sebagai tile yang benar-benar dimuat mengikuti posisi dan zoom.
- Zoom keluar sampai seluruh dunia (minZoom 0), geser secara bebas tanpa batas kotak Indonesia; zoom masuk sampai 19 (jika melebihi resolusi native tile ocean, browser memperbesar gambar, bukan menciptakan detail baru).
- Klik zona heksagon, hover label zona, klik titik klaster, episenter, dan kasus dampak tetap menampilkan panel detail V16.
- Pengaturan PETA, MODE, KLASTER, TRANSPARANSI, Layer zona, dan Titik klaster tetap bekerja menggunakan 333 heksagon BMKG yang **tidak diubah**.
- Tombol '⌖' mengembalikan fokus ke Indonesia, tanpa membatasi panning atau zoom.
- Tidak mengubah tab Riwayat Gempa, Dampak Historis, Mitigasi Kontekstual, Arsip Tsunami, Gempa Terkini BMKG dan Metodologi.

## Persyaratan teknis

- Peta memerlukan koneksi internet untuk mengunduh `Leaflet 1.9.4` dari `unpkg.com` serta tile dari `server.arcgisonline.com`.
- Jika jaringan membatasi kedua domain tersebut, peta akan menampilkan pesan kegagalan. Situs lain tetap terbuka.
- Tidak ada layanan pencatatan atau geolokasi pengunjung yang ditambahkan.
- GitHub Pages: **ekstrak** ZIP ke root repository dan pertahankan struktur data/ serta file lain. Jangan hanya mengunggah ZIP.
- Uji sendiri di browser dengan internet setelah deploy untuk memastikan semua tile menampilkan citra.

## Batasan model

Perubahan ini **hanya mesin peta**, bukan pemodelan ulang. Model tetap BMKG 2016–2025, 333 heksagon, k=4; 52 hari tanpa rekaman ekspor tetap dicatat sebagai data tidak tersedia. Zona merupakan profil historis, bukan peta bahaya resmi.
