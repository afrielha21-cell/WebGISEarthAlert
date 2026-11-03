# Pengujian EarthAlert V17 — Atlas Leaflet

## Hasil yang sudah diuji

- Pemeriksaan `node --check app.js`: lulus.
- Uji integrasi JavaScript menggunakan Playwright dan **stand-in Leaflet** karena akses jaringan keluar dari lingkungan pengujian tidak tersedia:
  - Atlas memuat **333 heksagon + 333 penanda titik klaster**.
  - Memilih klaster B menyisakan 33 heksagon (dan 33 penanda saat penanda aktif).
  - Checkbox Layer zona dan Titik klaster bekerja independen.
  - Tombol Peta Satelit mengganti URL layer dari Esri Ocean ke Esri World Imagery.
  - Mode Episenter menampilkan 515 titik historis M≥5,5.
  - Mode Kasus Dampak menampilkan 42 catatan BMKG.
  - Tombol `⌖` mengembalikan koordinat fokus Indonesia.
  - Tab Riwayat BMKG memuat 2.217 kejadian yang memenuhi filter bawaan 2026; Dampak Historis 42 kasus, Arsip Tsunami 12 kasus, Metodologi 4 klaster.
  - Tidak ditemukan error JavaScript dalam pengujian integrasi tersebut.
- Data JSON dan berkas penelitian tetap identik dengan V16 (tidak ada pemodelan ulang).

## Yang belum teruji penuh

- **Tile dan animasi Leaflet/Esri asli belum dapat diuji** karena lingkungan uji memblokir koneksi ke CDN dan Esri. Uji integrasi di atas menggunakan stand-in untuk memastikan kode EarthAlert terhubung dengan API Leaflet, bukan simulasi kinerja rendering tile asli.
- Uji zoom in/out, pergeseran peta dunia, dan interaksi di layar sentuh harus diperiksa langsung sesudah deploy dengan internet.
- Pengujian responsif penuh di beberapa perangkat belum dilaksanakan; breakpoint CSS dari V16 dipertahankan.

## Pemeriksaan manual setelah deploy

1. Buka Atlas ML: pastikan basemap Ocean Relief tile muncul dan heksagon berada di lokasi Indonesia.
2. Gunakan roda mouse/gesture sentuh untuk memperkecil hingga seluruh dunia terlihat, lalu geser ke luar Indonesia; tidak boleh terpotong oleh kotak tetap.
3. Tekan `⌖` untuk kembali ke Indonesia; klik `+` atau `−` kontrol Leaflet di kiri atas.
4. Ganti ke Satelit, pilih klaster B, ubah transparansi, matikan/nyalakan Layer zona serta Titik klaster.
5. Pilih mode Kasus dampak dan Episenter, klik titik dan periksa panel detail di kanan.
6. Pindah tab lalu kembali ke Atlas untuk memastikan ukuran tile/peta benar.

**Hasil ini belum diterapkan ke GitHub pengguna.**
