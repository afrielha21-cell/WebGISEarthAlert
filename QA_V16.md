# Hasil pengecekan EarthAlert BMKG V16

## Pengujian otomatis offline dalam browser Chromium

- [x] Source HTML, CSS, JavaScript asli V15 dipakai sebagai basis.
- [x] `node --check app.js` tanpa syntax error.
- [x] Atlas ML merender 333 heksagon.
- [x] Filter klaster B menghasilkan 33 heksagon.
- [x] Mode episenter M≥5,5 memuat 515 titik BMKG.
- [x] Tab Riwayat Gempa membuka data 2026 (default), tahun 2025, dan filter lokasi.
- [x] Dampak Historis menampilkan 42 catatan.
- [x] Mitigasi Kontekstual memiliki 6 kategori.
- [x] Arsip Tsunami memuat 12 catatan.
- [x] Menu Gempa Terkini BMKG menampilkan tombol `Update` dan opsi impor JSON.
- [x] Metodologi memuat 7 batang perbandingan Silhouette untuk k=2..8 dan 4 baris profil.
- [x] Tidak ada exception JavaScript selama navigasi/fungsi di atas.
- [x] Basemap Ocean lokal diuji sebagai gambar data URI dalam Chromium (aset asli tetap di `assets/ocean.jpg`).

## Yang tidak dapat diverifikasi sepenuhnya dalam pengujian offline

- [ ] Keberhasilan workflow GitHub Actions dan deployment pada repo milik pengguna.
- [ ] Respons langsung dari server data BMKG pada waktu pembaruan berikutnya.
- [ ] Ketersediaan di masa datang dari URL artikel BMKG/NOAA atau lokasi tautan pemerintah.
- [ ] Validitas ilmiah tambahan di luar eksperimen BMKG yang sudah dihitung: potensi keterbatasan magnitudo/skala, completeness katalog, hilangnya 52 tanggal.

**Keterangan:** data main K-Means menggunakan BMKG. Berita berfungsi sebagai konteks kejadian dan tidak memvalidasi besarnya risiko.
