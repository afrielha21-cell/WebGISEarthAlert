# EARTHALERT V17 · ATLAS ML LEAFLET OCEAN/SATELIT

Source integrasi BMKG V16, dengan **mesin Atlas ML diganti ke Leaflet interaktif** mengikuti prototipe Atlas BMKG. Zoom out hingga dunia dan panning tidak terkunci pada Indonesia. Tab lainnya tidak diubah.

Lihat `PERUBAHAN_V17_PETA_LEAFLET.md`, `QA_V17.md`, dan `README_DEPLOY_MASTER.md`.

---

# EarthAlert WebGIS — BMKG V16 (integrasi ke source V15)

EarthAlert adalah WebGIS pendidikan untuk menggambarkan **karakteristik kegempaan historis**, bukan peta bahaya resmi, prakiraan gempa, atau prediksi kerusakan bangunan. V16 ini merupakan **revisi langsung source EarthAlert V15 yang diberikan**, dengan mempertahankan gaya visual, Ocean Relief/Satelit, kontrol peta, Dampak Historis, Mitigasi Kontekstual, dan Arsip Tsunami.

## Apa yang berubah dari V15?

| Menu | V16 |
|---|---|
| **Atlas ML** | K-Means BMKG dengan 333 heksagon equal-area, 4 profil seismisitas dan tiga indikator: frekuensi, magnitudo P90, median kedalaman. Toggle Ocean/Satelit, klaster, transparansi, lapisan dan zoom dipertahankan. Mode episenter BMKG M≥5,5. Kajian/berita terkait BMKG dan tautan NOAA ditambahkan di bawah atlas. |
| **Riwayat Gempa** | Menggantikan Riwayat USGS. **138.229 rekaman unik RepoGempa BMKG** hingga 12 Oktober 2026, dipisah berdasarkan tahun agar tidak memperlambat Atlas. Filter tahun, magnitudo, kedalaman, wilayah, dan urutan. |
| **Dampak Historis** | 42 kasus BMKG terpilih tetap dipertahankan. Label K-Means lama dari USGS tidak digunakan dalam detail kasus. |
| **Mitigasi Kontekstual** | Rekomendasi berbasis dampak terdokumentasi tetap dipertahankan, tanpa pemeringkatan bahaya dari warna atlas. |
| **Arsip Tsunami** | 12 arsip terpilih BMKG dipertahankan. |
| **Gempa Terkini BMKG** | Menggantikan nama Informasi BMKG. Kategori: terbaru, M≥5, dirasakan. Tombol **Update** membaca ulang snapshot tersedia di hosting; impor JSON lokal tetap ada. |
| **Metodologi** | Katalog utama BMKG, seleksi magnitude, heksagon, K-Means, metrik validasi, profil empat klaster, dan keterbatasan data. |
| **NOAA** | Tidak ada tab terpisah; tautan arsip NOAA ditempatkan di bawah kajian/berita Atlas ML. |

## Statistik model yang digunakan

- **Periode model**: 1 Januari 2016–31 Desember 2025 (UTC, 10 tahun kalender penuh).
- **Riwayat website**: 1 Januari 2016–12 Oktober 2026, termasuk 2026 yang belum setahun penuh.
- **Rekaman historis**: 126.686 kejadian semua magnitudo untuk periode model; 22.422 dengan M≥4.
- **Unit analisis**: heksagon equal-area, radius heksagon ±65 km, minimal 10 kejadian M≥4/sel; 333 heksagon lolos.
- **Fitur**: ln(1+n), P90 magnitudo, ln(1+median kedalaman km), distandardisasi.
- **K-Means**: k=4 sebagai kandidat terpilih setelah perbandingan k=2..8.
- **Validasi**: Silhouette 0,3467, Davies–Bouldin 0,9458, median ARI leave-one-year-out sekitar 0,810. Nilai bukan bukti prediksi risiko.
- **Keterbatasan**: 52 tanggal tanpa rekaman ekspor; 2025 menunjukkan peningkatan tajam proporsi magnitudo kecil; tipe/skala magnitudo tidak lengkap. Kategori M≥4 menekan, tetapi tidak menghilangkan, masalah kelengkapan katalog.

## Cara menguji secara lokal

1. Ekstrak ZIP ini.
2. Buka Terminal/PowerShell pada folder yang **langsung berisi `index.html`**.
3. Jalankan:

   ```bash
   python -m http.server 8000
   ```
4. Buka `http://localhost:8000` melalui Chrome/Edge.

> Jangan langsung membuka `index.html` dengan `file://`: pemuatan JSON melalui `fetch()` sering diblokir browser.

## Cara memasang ke GitHub Pages

Repository terhubung `afrielha21-cell/EarthAlert` pada saat pemeriksaan hanya menunjukkan file ZIP dan README pada root. Untuk mengganti website yang disajikan oleh GitHub Pages, **isi folder ZIP harus diunggah/commit sebagai file/folder, bukan hanya ZIP baru**.

1. Cadangkan ZIP source V15 sebelum mengganti berkas apa pun.
2. Pada root repository `main`, tempatkan **isi ZIP**: `index.html`, `app.js`, `styles.css`, `assets/`, `data/`, `scripts/`, `.github/workflows/deploy.yml`, `.nojekyll`, dll.
3. Di GitHub Settings → Pages, gunakan source **GitHub Actions**.
4. Jalankan workflow **Publish EarthAlert public WebGIS** atau tunggu pemicu push `main`.
5. Verifikasi menu **Atlas ML**, **Riwayat Gempa**, **Gempa Terkini BMKG**, serta **Metodologi** setelah deploy.

**Tombol Update tidak memanggil BMKG langsung dari browser.** Snapshot BMKG dibangun oleh `scripts/sync_bmkg.py` melalui GitHub Actions (best effort). Jika gagal, tanggal snapshot lama dipertahankan atau pemberitahuan kosong muncul. Tidak ada klaim pembaruan real-time.

## Berkas data

- `data/grids.json`: 333 geometri heksagon dan ringkasan tiga fitur.
- `data/events.json`: 515 episenter contoh BMKG M≥5,5 pada 2016–2025 untuk layer cepat Atlas.
- `data/history/2016.json` … `2026.json`: riwayat BMKG per tahun, total 138.229 rekaman unik.
- `data/history_counts.json`: grafik jumlah kejadian teramati per tahun menurut batas magnitudo.
- `data/profiles.json`: profil median keempat klaster.
- `data/metrics.json`: WCSS, Silhouette, DBI k=1..8 sesuai ketersediaan metrik.
- `data/news.json`: tiga artikel resmi BMKG terkurasi sebagai referensi interpretasi.
- `data/cases.json`: 42 kasus historis BMKG pilihan, dipertahankan dari V15.
- `data/tsunami.json`: 12 catatan historis BMKG pilihan, dipertahankan dari V15.
- `data/bmkg_snapshot.json`: snapshot BMKG terkini pada waktu sinkronisasi berhasil (tidak selalu tersedia).
- `data/atlas_hex_source.geojson`: layer GeoJSON dengan provenance fitur penelitian.
- `data/model_research_metadata.json`: ringkasan batasan dan asumsi analisis.

Catatan: metadata pengaitan USGS pada file arsip kasus V15 disimpan sebagai catatan lama untuk jejak dokumen, tetapi **tidak digunakan sebagai sumber data model maupun tab riwayat V16**.

## Atribusi

- BMKG RepoGempa: https://repogempa.bmkg.go.id/eventcatalog
- BMKG Open Data: https://data.bmkg.go.id/gempabumi/
- BMKG mitigasi: https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi
- NOAA ETOPO relief: https://www.ncei.noaa.gov/products/etopo-global-relief-model
- NASA imagery: https://www.nasa.gov/nasa-brand-center/images-and-media/
- NOAA referensi bahaya historis: https://www.ncei.noaa.gov/maps/hazards/

**Pengunggahan ZIP ini ke percakapan ChatGPT tidak mengubah website online secara otomatis.**

## Rekap riset yang disertakan

Folder `research/` menyimpan ringkasan metrik k=2..8 seluruh skenario, uji kestabilan tahunan ARI, profil k=4, dan daftar 52 tanggal tanpa rekaman ekspor. Script analisis lengkap dan master CSV mentah tersedia pada paket riset BMKG terpisah yang telah dihasilkan sebelumnya; ZIP deployment ini difokuskan pada berkas yang diperlukan untuk menjalankan WebGIS.

## WebGISEarthAlert — Atlas Earth
Repository ini menyimpan seluruh aset riset BMKG 2016–2025 (termasuk `data/history/`)
dan antarmuka Atlas Earth. Logo InaRISK BNPB dan BIG di header diperbarui dari gambar yang diberikan tim,\ndan disimpan sebagai aset mandiri agar tetap termuat pada GitHub Pages.\nTanya Earth menggabungkan indeks data BMKG dan pustaka edukasi kebumian terkurasi,\nbukan model AI generatif, layanan prediksi gempa, atau peringatan dini.
Publikasi: GitHub Pages melalui workflow bootstrap-earthalert.yml.
Sumber utama: https://repogempa.bmkg.go.id/eventcatalog
