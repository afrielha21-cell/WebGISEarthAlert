#!/usr/bin/env python3
"""Reapply UI changes to a freshly copied, complete EarthAlert-Indonesia tree.
Keeps all research JSON, archived data, scripts and media intact.
"""
from pathlib import Path
import re, html, urllib.request, urllib.parse
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
index=ROOT/'index.html'
s=index.read_text(encoding='utf-8')
s=s.replace('EarthAlert V26 —', 'EarthAlert —')
s=s.replace('>Atlas ML</button>', '>Atlas Earth</button>')
s=s.replace('ATLAS ML / INDONESIA', 'ATLAS EARTH / INDONESIA')
s=s.replace('Pilih dua zona di Atlas ML', 'Pilih dua zona di Atlas Earth')
old='''<div class="brand-partners" aria-label="Mitra dan sumber data EarthAlert">
<img src="assets/logos/mtsn17.webp" alt="Logo MTsN 17 Jakarta" title="MTsN 17 Jakarta" width="46" height="46"/>
<img src="assets/logos/bmkg.webp" alt="Logo BMKG" title="Badan Meteorologi Klimatologi dan Geofisika" width="46" height="46"/>
<img src="assets/logos/kemenag.webp" alt="Logo Kementerian Agama" title="Kementerian Agama Republik Indonesia" width="46" height="46"/>
</div>'''
new='''<div class="brand-partners" aria-label="Sekolah dan institusi sumber data EarthAlert">
<a href="https://mtsn17jkt.sch.id/" title="MTsN 17 Jakarta" target="_blank" rel="noopener noreferrer"><img src="assets/logos/mtsn17.webp" alt="Logo MTsN 17 Jakarta" width="46" height="46"/></a>
<a href="https://inarisk.bnpb.go.id/" title="InaRISK — BNPB" target="_blank" rel="noopener noreferrer"><img class="partner-inarisk" src="assets/logos/inarisk.svg" alt="Logo InaRISK BNPB" width="46" height="46"/></a>
<a href="https://www.big.go.id/" title="Badan Informasi Geospasial" target="_blank" rel="noopener noreferrer"><img src="assets/logos/big.svg" alt="Logo BIG" width="46" height="46"/></a>
<a href="https://www.bmkg.go.id/" title="Badan Meteorologi Klimatologi dan Geofisika" target="_blank" rel="noopener noreferrer"><img src="assets/logos/bmkg.webp" alt="Logo BMKG" width="46" height="46"/></a>
<a href="https://kemenag.go.id/" title="Kementerian Agama" target="_blank" rel="noopener noreferrer"><img class="partner-kemenag" src="assets/logos/kemenag.webp" alt="Logo Kementerian Agama" width="55" height="55"/></a>
</div>'''
if old not in s: raise RuntimeError('Logo header source structure changed: abort migration')
s=s.replace(old,new)
s=s.replace('<link href="styles.css?v=26.1" rel="stylesheet"/>','<link href="styles.css?v=26.1" rel="stylesheet"/>\n<link href="assets/atlas-v27.css?v=27.0" rel="stylesheet"/>')
s=s.replace('<script defer src="assets/tectonic-context.js?v=26.1"></script>','<script defer src="assets/tectonic-context.js?v=26.1"></script>\n<script defer src="assets/atlas-v27.js?v=27.0"></script>')
# Preserve existing metadata, tables, analysis, historical reports, and BMKG scripts.
index.write_text(s,encoding='utf-8')
(ROOT/'.nojekyll').write_text('',encoding='utf-8')

logos=ROOT/'assets/logos'
logos.mkdir(parents=True,exist_ok=True)
# The SVG files provide deterministic, self-hosted recognizable wordmarks.
# Avoid pretending they are reproductions of the official organizational emblems.
inarisk='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 92" role="img" aria-labelledby="title"><title id="title">inaRISK BNPB</title><rect width="180" height="92" rx="14" fill="#fff"/><path d="M7 16h32v32H7z" fill="#f28c28"/><path d="M13 40l10-18 10 18z" fill="#176b9a"/><text x="47" y="39" font-family="Arial, sans-serif" font-size="27" font-weight="bold"><tspan fill="#ed8e24">ina</tspan><tspan fill="#156d9b">RISK</tspan></text><text x="48" y="55" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#156d9b">BNPB</text><text x="10" y="77" font-family="Arial,sans-serif" font-size="9" fill="#445766">Informasi Risiko Bencana</text></svg>'''
big='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" role="img" aria-labelledby="title"><title id="title">Badan Informasi Geospasial — BIG</title><rect width="110" height="110" rx="12" fill="#fff"/><circle cx="55" cy="43" r="30" fill="none" stroke="#1871b7" stroke-width="13"/><path d="M55 42H88A33 33 0 0 1 57 76" fill="none" stroke="#1388bd" stroke-width="11"/><circle cx="55" cy="43" r="12" fill="#a4d8ed"/><text x="55" y="93" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#16436f">BIG</text><text x="55" y="103" text-anchor="middle" font-family="Arial,sans-serif" font-size="5.2" fill="#3a5365">INFORMASI GEOSPASIAL</text></svg>'''
(logos/'inarisk.svg').write_text(inarisk,encoding='utf-8')
(logos/'big.svg').write_text(big,encoding='utf-8')
readme=ROOT/'README.md'
readme.write_text(readme.read_text(encoding='utf-8')+'''
## WebGISEarthAlert — Atlas Earth
Repository ini menyimpan seluruh aset riset BMKG 2016–2025 (termasuk `data/history/`)
dan antarmuka Atlas Earth. Logo InaRISK dan BIG di header saat ini menggunakan
**wordmark SVG ilustratif** (bukan salinan lambang resmi); ganti aset tersebut
dengan file identitas resmi yang berizin bila tersedia.
Tanya Earth adalah asistensi lokal berbasis indeks data EarthAlert, bukan layanan prediksi gempa.
Publikasi: GitHub Pages melalui workflow bootstrap-earthalert.yml.
Sumber utama: https://repogempa.bmkg.go.id/eventcatalog
''',encoding='utf-8')
print('UI migration applied; research data unchanged.')
