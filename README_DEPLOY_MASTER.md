# EarthAlert V17 — Peta Leaflet Interaktif

Revisi ini **hanya mengubah mesin peta Atlas ML** dari gambar SVG menjadi Leaflet yang sama jenisnya dengan pratinjau Atlas ML BMKG. Data BMKG dan tab-tab lain tetap seperti V16. Lihat `PERUBAHAN_V17_PETA_LEAFLET.md` dan `QA_V17.md` untuk detail dan hasil pengujian.

## Deploy singkat ke GitHub Pages

1. Cadangkan dulu versi yang saat ini online.
2. Ekstrak ZIP ini; unggah **isi** folder hasil ekstrak ke root repository GitHub Pages (`index.html`, `app.js`, `styles.css`, `data/`, dll.), bukan file ZIP-nya saja.
3. Pastikan Pages sudah menggunakan branch atau GitHub Actions yang tepat. Tunggu deployment dan periksa website dengan internet, khususnya tile dari Esri dan Leaflet CDN.
4. Jika website tidak memuat peta, periksa akses jaringan ke `unpkg.com` dan `server.arcgisonline.com` lewat tab Network pada Developer Tools.

---

# Petunjuk singkat — Deploy EarthAlert BMKG V16

1. **Ekstrak ZIP**. Jangan unggah ZIP saja jika ingin situs aktif di GitHub Pages.
2. Upload/commit **semua isi folder** ke root branch `main` pada repository EarthAlert, termasuk `index.html`, `app.js`, `styles.css`, `data/history/` (11 JSON), `assets/`, `scripts/`, `.github/workflows/deploy.yml`, dan `.nojekyll`.
3. Pastikan Settings → Pages → GitHub Actions aktif; jalankan workflow `Publish EarthAlert public WebGIS` dari Actions.
4. Verifikasi Atlas 333 heksagon, riwayat BMKG, 42 kasus dampak, 12 arsip tsunami, fitur Update snapshot, dan tabel metodologi.
5. Untuk lokal, jalankan `python -m http.server 8000` dari root folder ini dan buka `http://localhost:8000`.

**Catatan ilmiah:** 52 tanggal tanpa rekaman ekspor BMKG; model 2016–2025 M≥4, 4 klaster. Profil tersebut bukan tingkat bahaya resmi. Tahun 2026 hanya tersedia sampai 12 Oktober.

**Status:** paket siap diuji/deploy, **belum di-commit atau dipublikasikan ke GitHub** melalui pembuatan berkas ini.
