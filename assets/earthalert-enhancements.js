/* EarthAlert V23 | perubahan terbatas: arsip gabungan, peta geologi, wawasan mitigasi.
   Semua angka model yang ada di app.js tetap dipertahankan. */
(function(){
'use strict';
const RISK12=[
 ['Gempa bumi','Geologi','Lindungi kepala saat guncangan, jauhi benda jatuh, dan evaluasi bangunan setelah kejadian.'],
 ['Tsunami','Geologi','Di pantai, setelah guncangan kuat atau lama segera menuju tempat tinggi melalui jalur evakuasi.'],
 ['Letusan gunung api','Geologi','Ikuti peta KRB dan instruksi PVMBG; siapkan masker serta perlindungan dari abu.'],
 ['Gerakan tanah / longsor','Geologi','Kenali rekahan dan lereng tidak stabil; hindari jalur rawan serta patuhi arahan petugas.'],
 ['Banjir','Hidrometeorologi basah','Pantau tinggi air dan peringatan resmi; hindari arus dan instalasi listrik yang tergenang.'],
 ['Banjir bandang','Hidrometeorologi basah','Jauhi alur sungai saat hujan lebat dan siapkan jalur ke tempat yang lebih tinggi.'],
 ['Kekeringan','Hidrometeorologi kering','Hemat air, lindungi sumber air bersih, dan ikuti informasi iklim serta distribusi air.'],
 ['Cuaca ekstrem / puting beliung','Hidrometeorologi kering','Berlindung di bangunan kuat dan jauhi pohon serta benda yang mudah terbang.'],
 ['Gelombang ekstrem dan abrasi','Hidrometeorologi kering','Hindari tepi pantai saat peringatan gelombang tinggi dan ikuti arahan petugas.'],
 ['Kebakaran hutan dan lahan','Hidrometeorologi kering','Jangan membakar lahan; hindari paparan asap dan ikuti informasi kualitas udara.'],
 ['Epidemi / wabah penyakit','Nonalam','Ikuti informasi dinas kesehatan, jaga kebersihan, dan periksa gejala bila diperlukan.'],
 ['Gagal teknologi','Nonalam','Kenali jalur evakuasi fasilitas, patuhi prosedur keselamatan, dan laporkan insiden.']
];
const EXTRA=[
 {bmkg_catalog_id:'BMKG-EX-20170116-DELI',bmkg_date:'2017-01-16',bmkg_place:'Deli Serdang, Sumatra Utara',lat:3.33,lon:98.49,bmkg_magnitude:5.6,bmkg_depth_km:2,category:'Rumah tinggal',impact_summary:'Gempa dangkal dirasakan hingga VI MMI di Sibolangit; katalog BMKG mencatat tujuh rumah rusak di wilayah Desa Kebayaken dan Ujung Payung.',detail_extra:'Data katalog mencatat pusat gempa di darat dan laporan kerusakan tujuh unit rumah, tanpa korban meninggal yang dicatat.',context_tags:['hunian'],impact_scope:'single',bmkg_page:239},
 {bmkg_catalog_id:'BMKG-EX-20170529-POSO',bmkg_date:'2017-05-29',bmkg_place:'Poso, Sulawesi Tengah',lat:-1.25,lon:120.41,bmkg_magnitude:6.6,bmkg_depth_km:16,category:'Rumah dan fasilitas publik',impact_summary:'Katalog BMKG mencatat guncangan hingga V MMI di Poso/Toroe, korban luka, serta kerusakan bangunan di sejumlah kecamatan; Lore Utara dilaporkan memiliki 209 bangunan rusak berat dan 153 rusak ringan.',detail_extra:'Parameter diperbarui dalam katalog: pusat gempa sekitar 1,28 LS, 120,48 BT, kedalaman 11 km; angka tabel dan pembaruan dicantumkan untuk transparansi.',context_tags:['hunian','fasilitas publik'],impact_scope:'single',bmkg_page:242},
 {bmkg_catalog_id:'BMKG-EX-20250318-TAPANULI',bmkg_date:'2025-03-18',bmkg_place:'Tapanuli Utara, Sumatra Utara',lat:1.91,lon:99.10,bmkg_magnitude:5.5,bmkg_depth_km:10,category:'Rumah dan fasilitas publik',impact_summary:'Dua gempa berdekatan (M5,5 dan M5,6) dilaporkan dalam rangkaian yang menyebabkan 1 korban meninggal, 1 luka, kerusakan rumah dan fasilitas pendidikan/ibadah, serta longsor di sejumlah lokasi.',detail_extra:'Katalog mencatat gempa kedua M5,6 pada 05.23.34 WIB; penanganan dampak merujuk rangkaian kejadian.',context_tags:['hunian','sekolah','lereng'],impact_scope:'sequence',bmkg_page:29},
 {bmkg_catalog_id:'BMKG-EX-20250511-ACEH',bmkg_date:'2025-05-11',bmkg_place:'Aceh Barat Daya, Aceh',lat:-3.67,lon:96.83,bmkg_magnitude:5.9,bmkg_depth_km:83,category:'Hunian dan jalan',impact_summary:'Katalog mencatat intensitas hingga V MMI, dua orang luka, kerusakan sejumlah rumah, serta talud jalan yang ambruk sepanjang sekitar 50 meter.',detail_extra:'Lokasi dan kerusakan dirinci untuk beberapa desa di Kecamatan Manggeng dan Tangan-Tangan.',context_tags:['hunian','infrastruktur'],impact_scope:'single',bmkg_page:31},
 {bmkg_catalog_id:'BMKG-EX-20250607-SERAM',bmkg_date:'2025-06-07',bmkg_place:'Seram Bagian Barat, Maluku',lat:-3.47,lon:128.65,bmkg_magnitude:4.3,bmkg_depth_km:10,category:'Rumah tinggal',impact_summary:'Katalog mencatat rumah terdampak pada Desa Latu (159 unit), Tomalehu (17 unit), dan Hualoy (139 unit), serta pengungsian 3 keluarga atau 13 jiwa.',detail_extra:'Intensitas teramati antara II hingga III MMI; laporan dampak berasal dari BMKG Stasiun Geofisika Ambon dan BPBD.',context_tags:['hunian','pengungsian'],impact_scope:'single',bmkg_page:35},
 {bmkg_catalog_id:'BMKG-EX-20250613-BONDOWOSO',bmkg_date:'2025-06-13',bmkg_place:'Bondowoso / Situbondo, Jawa Timur',lat:-7.85,lon:113.72,bmkg_magnitude:3.7,bmkg_depth_km:5,category:'Rumah tinggal',impact_summary:'Guncangan III–IV MMI di Situbondo; satu rumah di Kecamatan Besuki mengalami kerusakan ringan berupa retakan dinding dan genteng jatuh.',detail_extra:'Contoh bahwa dampak yang terdokumentasi tidak dapat dinilai hanya dari besarnya magnitudo.',context_tags:['hunian'],impact_scope:'single',bmkg_page:36},
 {bmkg_catalog_id:'BMKG-EX-20250919-NABIRE',bmkg_date:'2025-09-19',bmkg_place:'Nabire, Papua Tengah',lat:-3.47,lon:135.49,bmkg_magnitude:6.6,bmkg_depth_km:24,category:'Fasilitas publik dan infrastruktur',impact_summary:'Katalog mencatat 13 korban luka dan kerusakan fasilitas umum, termasuk bandara, kantor pemerintahan, jembatan, serta gangguan listrik dan komunikasi.',detail_extra:'Intensitas tercatat hingga V MMI di Nabire; rincian dampak bersumber dari laporan yang dirujuk katalog BMKG.',context_tags:['infrastruktur','kesehatan','fasilitas publik'],impact_scope:'single',bmkg_page:42},
 {bmkg_catalog_id:'BMKG-EX-20250925-BANYUWANGI',bmkg_date:'2025-09-25',bmkg_place:'Banyuwangi / Situbondo, Jawa Timur',lat:-7.87,lon:114.45,bmkg_magnitude:5.7,bmkg_depth_km:12,category:'Rumah dan tempat ibadah',impact_summary:'Katalog mencatat kerusakan rumah serta tempat ibadah di Banyuwangi dan Situbondo, termasuk kerusakan berat, sedang, dan ringan.',detail_extra:'Situbondo: 21 rumah rusak berat, 11 sedang, 16 ringan, dan satu masjid rusak; Banyuwangi: satu rumah rusak berat dan satu tempat ibadah.',context_tags:['hunian','fasilitas publik'],impact_scope:'single',bmkg_page:45}
].map(c=>Object.assign(c,{bmkg_pdf_url:'https://content.bmkg.go.id/wp-content/uploads/Katalog-Gempabumi-Signifikan-Merusak-1821-2025_BMKG.pdf#page='+c.bmkg_page}));
const TSDETAIL={
 '2018-12-22':{h:'Pengamatan tinggi tsunami berbeda-beda antarlokasi; lihat rincian survei dan tide gauge dalam katalog BMKG',victims:'431 korban meninggal tercatat',extra:'Catatan BMKG: aktivitas Gunung Anak Krakatau dan longsoran material vulkanik; pengamatan BIG dan survei lapangan menunjukkan tinggi gelombang sangat bervariasi.'},
 '2023-04-24':{h:'0,11 m tercatat di Pulau Nias',extra:'Gelombang kecil dalam catatan pengamatan tsunami 2023, bukan status peringatan saat ini.'},
 '2022-11-18':{h:'0,25 m pada rekaman tide gauge',extra:'Tinggi yang disebut merupakan pengamatan pada instrumen, bukan proyeksi genangan.'},
 '2021-12-14':{h:'Sekitar 0,07 m di Marapokot dan Reo'},
 '2018-09-28':{extra:'Tsunami Palu–Donggala terjadi dalam rangkaian bencana yang kompleks; informasi kerusakan dan korban tidak boleh dinisbatkan kepada satu parameter gempa.'}
};
const S= v=>safe(v);
function unifiedDetail(entry){
 if(entry.kind==='tsunami'){
  const c=entry.data,extra=TSDETAIL[c.date_iso]||{};
  const grid='<div class="fact-grid"><div class="fact"><label>TANGGAL</label><strong>'+S(c.date_iso)+'</strong></div><div class="fact"><label>PENYEBAB</label><strong>'+S(c.cause_catalog)+'</strong></div><div class="fact"><label>MAGNITUDO PEMICU</label><strong>'+(c.magnitude_catalog!=null?'M '+fmt(c.magnitude_catalog,1):'Tidak tersedia')+'</strong></div><div class="fact"><label>SUMBER TSUNAMI</label><strong>'+S(c.source_name)+'</strong></div></div>';
  return '<div class="overline">KATALOG TSUNAMI BMKG · '+S(c.year)+'</div><h2>'+S(c.source_name)+'</h2><span class="pill">Tsunami '+S(c.cause_catalog)+'</span>'+grid+'<div class="pale-label">CATATAN PENGAMATAN</div><p>'+S(c.impact_note||'Tidak dirinci dalam cuplikan katalog.')+'</p>'+(extra.h?'<p><strong>Pengukuran:</strong> '+S(extra.h)+'</p>':'')+(extra.victims?'<p><strong>Dampak:</strong> '+S(extra.victims)+'</p>':'')+(extra.extra?'<p>'+S(extra.extra)+'</p>':'')+'<p class="case-source">Sumber: Katalog Tsunami Indonesia 416–2025, BMKG. Data historis; bukan peringatan.</p><div class="small-actions"><a class="action-link" href="'+S(c.bmkg_pdf_page_link)+'" target="_blank" rel="noopener noreferrer">Halaman katalog BMKG ↗</a></div>';
 }
 const c=entry.data;
 return '<div class="overline">KATALOG GEMPA SIGNIFIKAN & MERUSAK · BMKG</div><h2>'+S(c.bmkg_place)+'</h2><span class="pill">'+S(c.category)+'</span><div class="fact-grid"><div class="fact"><label>TANGGAL</label><strong>'+S(c.bmkg_date)+'</strong></div><div class="fact"><label>MAGNITUDO</label><strong>M '+fmt(c.bmkg_magnitude,1)+'</strong></div><div class="fact"><label>KEDALAMAN</label><strong>'+fmt(c.bmkg_depth_km,1)+' km</strong></div><div class="fact"><label>SUMBER</label><strong>BMKG · katalog 1821–2025</strong></div></div><div class="pale-label">DAMPAK TERDOKUMENTASI</div><p>'+S(c.impact_summary)+'</p>'+(c.detail_extra?'<p>'+S(c.detail_extra)+'</p>':'')+'<div class="small-actions"><a class="action-link" href="'+S(c.bmkg_pdf_url)+'" target="_blank" rel="noopener noreferrer">Halaman katalog BMKG ↗</a></div>';
}
function makeTimeline(){
 if(!DS.cases.some(c=>c.bmkg_catalog_id===EXTRA[0].bmkg_catalog_id))DS.cases.push(...EXTRA);
 return [...DS.cases.map(c=>({kind:'gempa',key:'g|'+c.bmkg_catalog_id,date:c.bmkg_date,title:c.bmkg_place,category:c.category,summary:c.impact_summary,mag:c.bmkg_magnitude,data:c})),
 ...DS.tsunami.filter(c=>Number(c.year)>=2016&&Number(c.year)<=2025).map(c=>({kind:'tsunami',key:'t|'+c.date_iso+'|'+c.source_name,date:c.date_iso,title:c.source_name,category:'Tsunami · '+c.cause_catalog,summary:c.impact_note,mag:c.magnitude_catalog,data:c}))].sort((a,b)=>b.date.localeCompare(a.date));
}
window.showImpactDetail=function(c){
 const row=DS.timeline.find(x=>x.data===c)||DS.timeline.find(x=>x.data.bmkg_catalog_id&&x.data.bmkg_catalog_id===c.bmkg_catalog_id);
 if(row)document.querySelector('#impact-detail').innerHTML=unifiedDetail(row);
};
window.renderImpact=function(){
 const q=(document.querySelector('#impact-search')?.value||'').toLowerCase().trim();
 const year=document.querySelector('#impact-year')?.value||'all',cat=document.querySelector('#impact-category')?.value||'all';
 const kind=document.querySelector('#impact-kind')?.value||'all';
 const arr=DS.timeline.filter(x=>(year==='all'||x.date.startsWith(year))&&(cat==='all'||x.category===cat)&&(kind==='all'||x.kind===kind)&&(!q||[x.title,x.summary,x.category,x.date].join(' ').toLowerCase().includes(q)));
 document.querySelector('#impact-count').textContent=arr.length+' dari '+DS.timeline.length+' catatan katalog BMKG';
 document.querySelector('#impact-list').innerHTML=arr.length?arr.map(x=>'<button class="case-row '+(state.unifiedCase===x.key?'chosen':'')+'" data-unified-id="'+S(x.key)+'"><span class="case-date">'+S(x.date)+'</span><span><strong>'+S(x.title)+'</strong><small>'+S(x.category)+' · '+S((x.summary||'').slice(0,88))+'</small></span><span class="case-mag">'+(x.mag!=null?'M'+fmt(x.mag,1):'—')+'</span></button>').join(''):'<p class="muted">Tidak ada kejadian yang cocok dengan pencarian.</p>';
};
window.initImpact=function(){
 DS.timeline=makeTimeline();
 const years=[...new Set(DS.timeline.map(c=>c.date.slice(0,4)))].sort((a,b)=>b.localeCompare(a));
 const cats=[...new Set(DS.timeline.map(c=>c.category))].sort();
 document.querySelector('#impact-year').insertAdjacentHTML('beforeend',years.map(y=>'<option value="'+S(y)+'">'+S(y)+'</option>').join(''));
 document.querySelector('#impact-category').insertAdjacentHTML('beforeend',cats.map(y=>'<option value="'+S(y)+'">'+S(y)+'</option>').join(''));
 for(const id of ['impact-search','impact-year','impact-category','impact-kind'])document.getElementById(id)?.addEventListener(id==='impact-search'?'input':'change',()=>window.renderImpact());
 document.getElementById('impact-list').addEventListener('click',e=>{
  const k=e.target.closest('[data-unified-id]')?.dataset.unifiedId;if(!k)return;
  const item=DS.timeline.find(x=>x.key===k);if(!item)return;
  state.unifiedCase=k;document.querySelector('#impact-detail').innerHTML=unifiedDetail(item);window.renderImpact();
 });
 const first=DS.timeline.find(x=>x.title.toLowerCase().includes('palu'))||DS.timeline[0];
 state.unifiedCase=first.key;document.querySelector('#impact-detail').innerHTML=unifiedDetail(first);window.renderImpact();
};
window.initTsunami=function(){}; // Arsip tsunami sekarang dirender melalui Dampak Gempa.
const originalInitMitigation=window.initMitigation;
window.initMitigation=function(){
 const grid=document.getElementById('disaster-grid');
 if(grid)grid.innerHTML=RISK12.map((r,i)=>'<article class="disaster-card"><div class="disaster-n"><span>'+String(i+1).padStart(2,'0')+'</span><small>'+S(r[1])+'</small></div><h3>'+S(r[0])+'</h3><p>'+S(r[2])+'</p></article>').join('');
 return originalInitMitigation();
};
const originalRenderMitigation=window.renderMitigation;
window.renderMitigation=function(){
 originalRenderMitigation();
 const root=document.getElementById('scenario-content');
 if(!root)return;
 root.insertAdjacentHTML('beforeend','<div class="mitigation-learning"><h3>Langkah umum sebelum, saat, dan sesudah</h3><div class="learning-grid"><div><b>Sebelum</b><p>Kenali ancaman dan jalur evakuasi, amankan benda berat, siapkan kontak keluarga dan tas siaga.</p></div><div><b>Saat</b><p>Utamakan keselamatan diri; saat gempa lindungi kepala dan hindari kaca serta benda yang dapat jatuh. Ikuti petugas di lokasi.</p></div><div><b>Sesudah</b><p>Periksa kondisi diri, hindari bangunan rusak, bantu orang rentan, dan pantau informasi resmi BMKG/BPBD.</p></div></div><p class="muted small">Saran edukasi, bukan pengganti arahan kedaruratan pemerintah atau pemeriksaan keselamatan setempat.</p></div>');
};
const MAPS=[
 {id:'geo-faults',label:'Sesar aktif · InaRISK / PuSGeN 2024',url:'https://gis.bnpb.go.id/server/rest/services/inarisk/Faults_new/MapServer/export',layers:'show:0,1',opacity:.90},
 {id:'geo-geology',label:'Geologi regional · BIG',url:'https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/export',layers:'show:8',opacity:.47}
];
const overlays=new Map();
let updateGeoTicket=0;
function repaintGeo(){
 if(!atlasMap||typeof L==='undefined')return;
 const b=atlasMap.getBounds(),sw=L.CRS.EPSG3857.project(b.getSouthWest()),ne=L.CRS.EPSG3857.project(b.getNorthEast());
 const sz=atlasMap.getSize(),w=Math.min(1800,Math.max(500,Math.round(sz.x*1.5))),h=Math.min(1500,Math.max(400,Math.round(sz.y*1.5)));
 const st=document.getElementById('geo-status');const ticket=++updateGeoTicket;
 for(const m of MAPS){
  if(overlays.has(m.id)){atlasMap.removeLayer(overlays.get(m.id));overlays.delete(m.id)}
  if(!document.getElementById(m.id)?.checked)continue;
  const params=new URLSearchParams({bbox:[sw.x,sw.y,ne.x,ne.y].join(','),bboxSR:'3857',imageSR:'3857',size:w+','+h,format:'png32',transparent:'true',layers:m.layers,f:'image'});
  const overlay=L.imageOverlay(m.url+'?'+params.toString(),b,{opacity:m.opacity,interactive:false});
  overlay.on('load',()=>{if(st&&ticket===updateGeoTicket)st.textContent='Layer resmi aktif · gunakan sebagai konteks, bukan penentu risiko.'});
  overlay.on('error',()=>{if(st&&ticket===updateGeoTicket)st.textContent='Layanan peta eksternal tidak dapat dimuat; coba kembali nanti.'});
  overlay.addTo(atlasMap).bringToBack();overlays.set(m.id,overlay);
 }
 if(st&&!MAPS.some(m=>document.getElementById(m.id)?.checked))st.textContent='Lapisan geologi opsional; tidak mengubah hasil K-Means.';
}
/* Ringkas panel detail Atlas: hapus pesan berulang yang tidak menjadi hasil utama. */

function explainZone(g){
 const n=Number(g.n),p=Number(g.m),d=Number(g.depth),a=Number(g.annual);
 const all=DS.grids||[];
 const values=all.map(x=>Number(x.n)).filter(Number.isFinite).sort((x,y)=>x-y);
 const percentile=values.length?Math.round(100*values.filter(x=>x<=n).length/values.length):null;
 const freq=percentile!==null?(percentile>=75?'termasuk kelompok dengan jumlah catatan relatif tinggi':percentile<=25?'termasuk kelompok dengan jumlah catatan relatif rendah':'berada di kisaran tengah dibanding zona lain yang dianalisis'):'menggambarkan banyaknya gempa tercatat dalam zona ini';
 const depth=d<=60?'Nilai tengahnya termasuk kelompok gempa dangkal (hingga 60 km).':d<=300?'Nilai tengahnya termasuk kelompok gempa menengah (lebih dari 60 hingga 300 km).':'Nilai tengahnya termasuk kelompok gempa dalam (lebih dari 300 km).';
 const cluster={A:'cenderung memiliki median kedalaman yang lebih dangkal dibanding kelompok lain',B:'cenderung memiliki nilai magnitudo P90 lebih tinggi dibanding kelompok lain',C:'cenderung memiliki median kedalaman lebih besar dibanding kelompok lain',D:'cenderung memiliki jumlah kejadian tercatat lebih banyak dibanding kelompok lain'}[g.c]||'memiliki kemiripan pola statistik dengan zona lain dalam kelompoknya';
 const row=(icon,title,body)=>'<div class="zone-insight-item"><div class="zone-insight-icon">'+icon+'</div><div><h4>'+title+'</h4><p>'+body+'</p></div></div>';
 return '<section class="zone-insights" aria-label="Penjelasan hasil analisis wilayah"><div class="zone-insights-heading"><span>MEMAHAMI HASIL ANALISIS</span><h3>Apa arti data di wilayah ini?</h3><p>Penjelasan berdasarkan catatan BMKG periode 2016–2025 pada zona yang dipilih.</p></div>'+
 row('01','Seberapa sering gempa tercatat?', 'Terdapat <strong>'+fmt(n)+' gempa M≥4</strong> selama sepuluh tahun, rata-rata <strong>'+fmt(a,1)+' kejadian per tahun</strong>. Dibandingkan zona analisis lainnya, jumlah ini '+freq+'.')+
 row('02','Bagaimana besarnya gempa?', 'Magnitudo P90 sebesar <strong>M '+fmt(p,2)+'</strong> berarti sekitar 90% gempa dalam zona ini memiliki magnitudo tidak melebihi nilai tersebut.')+
 row('03','Seberapa dalam sumber gempanya?', 'Median kedalaman <strong>'+fmt(d,1)+' km</strong> adalah nilai tengah dari seluruh kedalaman gempa yang dianalisis. '+depth+'')+
 row('04','Apa kesimpulan untuk zona ini?', 'Zona ini termasuk <strong>Klaster '+safe(g.c)+'</strong>, yang '+cluster+'. Pengelompokan mempertimbangkan frekuensi, P90 magnitudo, dan median kedalaman secara bersamaan.')+
 '</section>';
}
const previousGridDetail=window.gridDetail;
window.gridDetail=function(g){
 const holder=document.createElement('div');holder.innerHTML=previousGridDetail(g);
 holder.querySelectorAll('.note,.pale-label,.example-item,.muted.small').forEach(x=>x.remove());
 const actions=holder.querySelector('.small-actions');
 if(actions)actions.insertAdjacentHTML('beforebegin',explainZone(g));
 else holder.insertAdjacentHTML('beforeend',explainZone(g));
 return holder.innerHTML;
};
const previousEventDetail=window.eventDetail;
window.eventDetail=function(e){
 const holder=document.createElement('div');holder.innerHTML=previousEventDetail(e);
 holder.querySelectorAll('.note,.pale-label,.example-item,.muted.small').forEach(x=>x.remove());
 return holder.innerHTML;
};
window.caseDetails=function(c,mini=false){
 return unifiedDetail({kind:'gempa',data:c})+(mini?caseAdviceHtml(c,{compact:true}):'');
};
const originalSetupMap=window.setupMap;
window.setupMap=async function(){
 await originalSetupMap();
 if(!atlasMap)return;
 for(const m of MAPS)document.getElementById(m.id)?.addEventListener('change',repaintGeo);
 atlasMap.on('moveend',repaintGeo);repaintGeo();
};
window.addEventListener('hashchange',()=>{if(location.hash==='#tsunami')navTo('dampak')});
})();