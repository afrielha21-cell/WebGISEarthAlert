
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
const safe = v => String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(x,d=0)=>Number.isFinite(Number(x))?Number(x).toLocaleString('id-ID',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
const colors={A:'#EF4444',B:'#F97316',C:'#22C55E',D:'#D7A000',N:'#a8b5c0'};
const labels={A:'Kedalaman relatif rendah',B:'Magnitudo P90 relatif tinggi',C:'Kedalaman relatif besar',D:'Frekuensi tercatat relatif tinggi',N:'Data terbatas'};
const SRC_BMKG='https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi';
const SRC_BMKG_EDU='https://www.bmkg.go.id/gempabumi/mitigasi/edukasi-gempabumi-tsunami';
const dist=(a,b,c,d)=>{const r=Math.PI/180,dy=(c-a)*r,dx=(d-b)*r,x=Math.sin(dy/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dx/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,x)))};

const LOC_TRANSLATE=[[/\bSouthern\b/gi,'Selatan'],[/\bNorthern\b/gi,'Utara'],[/\bWestern\b/gi,'Barat'],[/\bEastern\b/gi,'Timur'],[/\bCentral\b/gi,'Tengah'],[/\bSouthwest\b/gi,'Barat Daya'],[/\bSoutheast\b/gi,'Tenggara'],[/\bNorthwest\b/gi,'Barat Laut'],[/\bNortheast\b/gi,'Timur Laut'],[/\bSea\b/gi,'Laut'],[/\bStrait\b/gi,'Selat'],[/\bGulf\b/gi,'Teluk'],[/\bof\b/gi,''],[/,\s*Indonesia/gi,''],[/\bMolucca\b/gi,'Maluku'],[/\bCelebes\b/gi,'Sulawesi'],[/\bBorneo\b/gi,'Kalimantan'],[/\bIrian Jaya\b/gi,'Papua']];
function normalizeLocText(s=''){
 let out=String(s||'').replace(/^Kab\.?\s*/i,'Kabupaten ').replace(/^Kota\s*/i,'Kota ');
 for(const [a,b] of LOC_TRANSLATE)out=out.replace(a,b);
 return out.replace(/\s{2,}/g,' ').replace(/\s+,/g,',').replace(/,+$/,'').trim()||'Wilayah belum teridentifikasi';
}
function broadRegionName(lat,lon){
 if(lat<-8.2&&lon>114&&lon<125)return 'Laut Selatan Bali–Nusa Tenggara';
 if(lat<-6&&lon>=105&&lon<=114)return 'Laut Selatan Jawa';
 if(lat>0.2&&lon<100.5)return 'Perairan Barat Aceh';
 if(lat>-3&&lat<6&&lon>=95&&lon<106)return 'Pesisir Barat Sumatra';
 if(lat>-5&&lat<2&&lon>=106&&lon<110)return 'Selat Sunda dan sekitarnya';
 if(lat>-3.5&&lat<3.5&&lon>=108&&lon<120)return 'Laut Jawa dan Kalimantan';
 if(lat>-6&&lat<2&&lon>=120&&lon<125)return 'Sulawesi Tenggara dan sekitarnya';
 if(lat>1&&lon>=119&&lon<127)return 'Sulawesi Utara dan Laut Maluku';
 if(lat<-2&&lon>=124&&lon<131)return 'Laut Banda dan Maluku';
 if(lon>=131)return lat<0?'Papua bagian selatan':'Papua dan sekitarnya';
 return 'Wilayah Indonesia';
}
function inferGridLocation(g){
 const byCase=(DS.cases||[]).map(c=>({d:dist(g.lat,g.lon,Number(c.lat),Number(c.lon)),name:c.bmkg_place,src:'Kasus BMKG'})).filter(c=>Number.isFinite(c.d)).sort((a,b)=>a.d-b.d)[0];
 if(byCase&&byCase.d<=180)return {title:normalizeLocText(byCase.name),subtitle:'Rujukan lokasi terdekat · '+byCase.src};
 const byEvent=(DS.events||[]).map(e=>({d:dist(g.lat,g.lon,Number(e.lat),Number(e.lon)),name:e.p,src:'Riwayat BMKG'})).filter(e=>Number.isFinite(e.d)).sort((a,b)=>a.d-b.d)[0];
 if(byEvent&&byEvent.d<=220)return {title:normalizeLocText(byEvent.name),subtitle:'Rujukan lokasi terdekat · '+byEvent.src};
 return {title:broadRegionName(g.lat,g.lon),subtitle:'Label wilayah perkiraan dari posisi heksagon'};
}
function ensureGridLocations(){
 if(!(DS.grids||[]).length)return;
 DS.grids.forEach(g=>{if(!g.place_info)g.place_info=inferGridLocation(g);});
}
function getGridTitle(g){ensureGridLocations();return g.place_info?.title||'Zona '+g.id;}
function updateMapPlaceBadge(g){
 const el=$('#mapPlaceBadge');if(!el)return;
 if(!g){el.textContent='Lokasi zona akan muncul di sini';return;}
 ensureGridLocations();
 const p=g.place_info||{};
 el.innerHTML='<strong>Lokasi zona</strong>'+safe(p.title||g.id);
}
const state={tab:'atlas',basemap:'ocean',mode:'clusters',cluster:'all',transparency:75,zones:true,markers:true,selected:null,scenario:'hunian',impactCase:null,tsCase:null,historyRow:null};
let DS={};
const HISTORY_CACHE=new Map();
let HISTORY_TICKET=0;

const contextTypes={
  hunian:{name:'Rumah & hunian',description:'Untuk kejadian dengan kerusakan rumah atau perpindahan tempat tinggal. Prioritasnya keselamatan penghuni, pemeriksaan bangunan, dan pemulihan bertahap.',items:[['SEGERA','Jangan masuki bangunan rusak','Apabila terlihat retak besar, struktur miring, atau komponen runtuh, batasi akses dan tunggu pemeriksaan pihak berwenang.'],['SETELAH GEMPA','Dokumentasikan dan laporkan kerusakan','Catat lokasi, foto bagian terdampak jika aman, dan sampaikan ke perangkat setempat/BPBD untuk pendataan bantuan.'],['PEMULIHAN','Pemeriksaan teknis bangunan','Minta penilaian tenaga kompeten sebelum kembali dihuni, terutama pada elemen struktur dan sambungannya.'],['PERSIAPAN','Amankan benda non-struktural','Ikat lemari/rak, jauhkan benda berat dari jalur evakuasi, dan siapkan tas siaga keluarga.']]},
  sekolah:{name:'Sekolah & fasilitas publik',description:'Untuk bangunan pendidikan, tempat ibadah, pasar dan fasilitas umum. Fokusnya pemeriksaan kelayakan serta kesinambungan pelayanan.',items:[['SEGERA','Tutup sementara area yang rusak','Hentikan aktivitas di ruang yang memperlihatkan kerusakan hingga dinilai aman oleh pengelola dan tenaga teknis.'],['TINDAKAN','Periksa rute dan titik kumpul','Pastikan pintu, tangga, jalur keluar, serta titik berkumpul tidak terhalang puing atau material berbahaya.'],['OPERASIONAL','Siapkan layanan alternatif','Tentukan ruang belajar/ibadah/layanan sementara setelah koordinasi dengan pengelola dan pemerintah daerah.'],['PERSIAPAN','Latihan evakuasi terjadwal','Latih perlindungan diri saat guncangan dan evakuasi tertib, disesuaikan kebutuhan anak serta kelompok rentan.']]},
  kesehatan:{name:'Rumah sakit & layanan kesehatan',description:'Untuk kerusakan fasilitas kesehatan atau kejadian dengan korban luka. Fokusnya keselamatan pasien dan keberlanjutan layanan darurat.',items:[['SEGERA','Lakukan triase dan pertolongan','Utamakan pertolongan sesuai kemampuan dan hubungi layanan kedaruratan setempat.'],['TINDAKAN','Amankan bangunan dan alat berat','Periksa area berisiko, peralatan medis yang dapat terguling, instalasi listrik, gas, dan pasokan air.'],['PELAYANAN','Alihkan layanan bila diperlukan','Tentukan ruang/jejaring rujukan sementara sesuai keputusan pengelola fasilitas dan dinas kesehatan.'],['PERSIAPAN','Uji prosedur keselamatan fasilitas','Lakukan simulasi pelayanan ketika pasokan listrik/akses terganggu dan pastikan jalur pasien tersedia.']]},
  infrastruktur:{name:'Jalan, jembatan & akses',description:'Untuk catatan kerusakan ruas jalan, jembatan, bandara atau fasilitas penghubung. Jangan menggunakan tingkat magnitudo saja untuk memutuskan akses aman.',items:[['SEGERA','Hindari jalur yang tampak rusak','Jangan melintasi retakan, jembatan berubah bentuk, atau area dengan potensi reruntuhan sampai diperiksa petugas.'],['KOORDINASI','Laporkan titik dan jenis kerusakan','Sampaikan foto/koordinat kepada BPBD, dinas PU, atau pengelola sarana terkait bila aman untuk dilakukan.'],['PEMULIHAN','Siapkan rute dan akses alternatif','Prioritaskan akses ambulans, logistik, dan evakuasi; keputusan pembukaan kembali dilakukan oleh pengelola resmi.'],['PERSIAPAN','Periksa elemen vital berkala','Lakukan audit kondisi prasarana, sambungan struktur, dan kebutuhan penutupan operasional berdasarkan pedoman teknis.']]},
  pesisir:{name:'Pesisir & tsunami',description:'Panduan untuk lokasi pesisir apabila terjadi guncangan kuat/lama atau terdapat arahan resmi terkait tsunami. Status tsunami tidak ditentukan dari magnitudo saja.',items:[['SAAT TANDA ALAM','Segera evakuasi dari pesisir','Jika guncangan kuat/lama terasa di pantai atau air laut menunjukkan perubahan tidak biasa, menuju dataran tinggi atau jalur aman tanpa menunggu pesan aplikasi ini.'],['RESMI','Ikuti informasi InaTEWS/BMKG','Pastikan status dan area terdampak hanya berdasarkan informasi BMKG dan BPBD; jangan simpulkan tsunami dari warna klaster.'],['PERSIAPAN','Kenali jalur evakuasi setempat','Tentukan rute dan titik evakuasi resmi bersama BPBD, termasuk kebutuhan anak, lansia, dan penyandang disabilitas.'],['PASCA','Jangan kembali sebelum dinyatakan aman','Tsunami dapat memiliki beberapa gelombang. Ikuti pencabutan peringatan dan arahan resmi.']]},
  lereng:{name:'Lereng & tanah tidak stabil',description:'Untuk lokasi yang dilaporkan mengalami rekahan, longsor atau likuefaksi. Kondisi tanah tidak dapat dinilai hanya dari koordinat atau magnitudo.',items:[['SEGERA','Jauhi rekahan dan lereng labil','Hindari tebing, bidang longsoran, timbunan, dan area tanah bergerak yang bisa membahayakan.'],['PENANGANAN','Ikuti pembatasan lokasi berbahaya','Gunakan penilaian lapangan dari BPBD, PVMBG/geologi, dan petugas teknis untuk menentukan akses.'],['PEMULIHAN','Jangan membangun kembali tanpa kajian','Perlu kajian lokasi dan fondasi sesuai kondisi tanah dan pedoman daerah setempat.'],['PERSIAPAN','Kenali jalur evakuasi alternatif','Siapkan jalur yang tidak melalui kaki lereng curam, bantaran, atau kawasan reklamasi tidak stabil.']]},
};

function decideContext(caseRow){
  const t=caseRow?.context_tags||[];
  const found=[];
  if(t.includes('hunian')||t.includes('pengungsian'))found.push('hunian');
  if(t.includes('sekolah')||t.includes('fasilitas publik'))found.push('sekolah');
  if(t.includes('kesehatan')||t.includes('kedaruratan'))found.push('kesehatan');
  if(t.includes('infrastruktur'))found.push('infrastruktur');
  if(t.some(x=>x.includes('tsunami')))found.push('pesisir');
  if(t.some(x=>x.includes('likuifaksi')))found.push('lereng');
  return [...new Set(found.length?found:['hunian'])];
}
function eventContextHtml(c){
 const mag=Number(c.bmkg_magnitude),depth=Number(c.bmkg_depth_km),parts=[];
 if(Number.isFinite(mag)){
   parts.push(`Magnitudo katalog M ${fmt(mag,1)}: dipakai untuk mengenali skala kejadian, <b>bukan</b> menghitung tingkat kerusakan atau status peringatan secara otomatis.`);
 }
 if(Number.isFinite(depth)){
  if(depth<=70)parts.push(`Hiposenter sekitar ${fmt(depth,1)} km (gempa dangkal). Intensitas di permukaan tetap bergantung pada jarak, tanah, dan kerentanan bangunan.`);
  else if(depth<=300)parts.push(`Hiposenter sekitar ${fmt(depth,1)} km (kedalaman menengah). Klasifikasi ini tidak otomatis menunjukkan kerusakan lebih rendah atau lebih tinggi.`);
  else parts.push(`Hiposenter sekitar ${fmt(depth,1)} km (gempa dalam). Dampak setempat tidak dapat ditentukan hanya dari kedalaman.`);
 }
 if(c.impact_scope==='sequence')parts.push('Dampak yang tertulis berasal dari rangkaian gempa, sehingga tidak boleh dinisbatkan seluruhnya kepada satu titik/kejadian.');
 if((c.context_tags||[]).includes('kedaruratan'))parts.push('Terdapat laporan korban/luka: kesiapan pertolongan pertama dan akses layanan medis menjadi bagian dari mitigasi kontekstual.');
 return `<div class="pale-label">DASAR PEMILIHAN SARAN</div><div class="note">${parts.map(s=>`<p style="margin:0 0 5px">${s}</p>`).join('')}</div>`;
}
function caseAdviceHtml(c,{compact=false}={}){
  const contexts=decideContext(c),first=contexts[0];
  const m=Number(c.bmkg_magnitude);
  const magnitudeAction=Number.isFinite(m)?(m>=6.5?
    '<div class="note"><strong>Koordinasi dampak lintas wilayah:</strong> untuk kejadian bermagnitudo besar, cocokkan cakupan guncangan dan laporan dampak resmi sebelum menetapkan prioritas pemeriksaan fasilitas dan akses vital. Pantau informasi gempa susulan dari BMKG; bukan berarti seluruh wilayah pasti rusak.</div>':
    m>=5?'<div class="note"><strong>Pemeriksaan dampak setempat:</strong> cocokkan laporan kerusakan dan intensitas guncangan setempat dengan data BMKG/BPBD sebelum menentukan kebutuhan penutupan bangunan atau fasilitas.</div>':
    '<div class="note"><strong>Dampak aktual tetap menjadi acuan:</strong> walaupun magnitudo relatif lebih kecil, catatan kerusakan perlu ditindaklanjuti sesuai kondisi bangunan dan laporan otoritas, bukan diabaikan berdasarkan angka magnitudo.</div>') : '';

  const chunks=contexts.slice(0,compact?2:4).map(key=>{const x=contextTypes[key];return `<div class="advice-block"><h3>${safe(x.name)}</h3><ol class="case-recs">${x.items.slice(0,compact?2:3).map(item=>`<li><strong>${safe(item[1])}:</strong> ${safe(item[2])}</li>`).join('')}</ol></div>`}).join('');
  return `<div class="pale-label">ARAH MITIGASI SESUAI DAMPAK TERCATAT</div>${chunks}${magnitudeAction}<div class="note">Rekomendasi edukatif disusun dari <a href="${SRC_BMKG}" target="_blank" rel="noopener noreferrer">panduan BMKG</a>. Dampak aktual berbeda menurut jarak, intensitas guncangan, kondisi tanah, dan bangunan.</div>`;
}
function caseDetails(c,mini=false){
 const scope = c.impact_scope==='sequence'?'Dampak rangkaian gempa; bukan satu episenter':'Catatan kejadian pada katalog';
 return `<div class="overline">ARSIP BMKG · ${safe(c.bmkg_date?.slice(0,4)||'')}</div><h2>${safe(c.bmkg_place)}</h2><span class="pill">${safe(c.category)}</span>${c.impact_scope==='sequence'?'<span class="pill warning">DAMPAK RANGKAIAN</span>':''}
 <div class="fact-grid"><div class="fact"><label>MAGNITUDO BMKG</label><strong>M ${fmt(c.bmkg_magnitude,1)}</strong></div><div class="fact"><label>KEDALAMAN</label><strong>${fmt(c.bmkg_depth_km,1)} km</strong></div><div class="fact"><label>WAKTU KEJADIAN</label><strong>${safe(c.bmkg_date)}</strong></div><div class="fact"><label>JENIS CATATAN</label><strong>Arsip BMKG</strong></div></div>
 <div class="pale-label">DAMPAK YANG DICATAT</div><p>${safe(c.impact_summary)}</p>
 <div class="topic-tags">${(c.context_tags||[]).map(x=>`<span>${safe(x)}</span>`).join('')}</div><div class="note warn">${safe(scope)}. Informasi dampak bukan luaran K-Means.</div>
 ${eventContextHtml(c)} ${caseAdviceHtml(c,{compact:mini})}<div class="small-actions"><a class="action-link" target="_blank" rel="noopener noreferrer" href="${safe(c.bmkg_pdf_url)}">Katalog BMKG ↗</a></div><p class="case-source">Catatan dampak BMKG historis; kerusakan bukan hasil prediksi model atau akibat pasti dari satu episenter.</p>`;
}
function comparableCases({lat,lon,mag,depth,cluster},num=3){
 if(!Number.isFinite(lat)||!Number.isFinite(lon))return [];
 return DS.cases.map(c=>{
  const km=dist(lat,lon,Number(c.lat),Number(c.lon));
  const dm=Math.abs((mag??c.bmkg_magnitude)-c.bmkg_magnitude);
  const dd=Math.abs((depth??c.bmkg_depth_km)-c.bmkg_depth_km);
  let score=km/350+dm*1.4+Math.min(2,dd/120);
  return {c,score,km,dm};
 }).sort((a,b)=>a.score-b.score).slice(0,num);
}
function comparatorHtml(list){return `<div class="pale-label">KASUS HISTORIS PEMBANDING</div><p class="muted small">Contoh arsip dengan ciri lebih mirip menurut lokasi, magnitudo, kedalaman, dan klaster. <b>Tidak memprediksi dampak</b> pada titik terpilih.</p>${list.length?list.map(({c,km})=>`<div class="example-item"><button data-select-case="${safe(c.bmkg_catalog_id)}">${safe(c.bmkg_place)} · M ${fmt(c.bmkg_magnitude,1)} ↗</button><p>${safe(c.bmkg_date)} · ${fmt(km,0)} km jarak antar episenter</p></div>`).join(''):'<p class="muted">Belum ditemukan kasus pembanding.</p>'}`;}
function articleHTML(a,km=null){
 return `<article class="news-card"><div class="news-meta">${safe(a.site)} · ${safe(a.date)}${Number.isFinite(km)?' · ±'+fmt(km,0)+' km dari titik tengah zona':''}</div><h3>${safe(a.title)}</h3><p>${safe(a.context)}</p><a target="_blank" rel="noopener noreferrer" href="${safe(a.url)}">Baca rujukan BMKG ↗</a></article>`;
}
function renderNews(zone=null){
 const root=$('#news-grid'); if(!root)return;
 let articles=(DS.news||[]).map(a=>({...a,km:zone?dist(zone.lat,zone.lon,a.lat,a.lon):null}));
 if(zone){articles=articles.filter(a=>a.km<=500).sort((a,b)=>a.km-b.km);}
 root.innerHTML=articles.length?articles.map(a=>articleHTML(a,a.km)).join(''):'<p class="muted">Belum ada artikel BMKG terkurasi dalam radius 500 km dari pusat heksagon ini. Ini bukan berarti tidak pernah terjadi gempa atau dampak di area tersebut.</p>';
}
function gridDetail(g){
 const examples=comparableCases({lat:g.lat,lon:g.lon,mag:g.m,depth:g.depth});
 ensureGridLocations();
 const place=g.place_info||inferGridLocation(g);
 updateMapPlaceBadge(g);
 renderNews(g);
 return '<div class="overline">HASIL ANALISIS</div><div class="detail-subbrand">EarthAlert</div>'+
 '<h2>'+safe(place.title)+'</h2><div class="location-chip"><span class="dot"></span>Lokasi zona analisis</div>'+
 '<div class="minor-id">ID zona '+safe(g.id)+' · Titik pusat '+fmt(g.lat,2)+'°, '+fmt(g.lon,2)+'°</div>'+
 '<span class="pill">Klaster '+safe(g.c)+' · '+safe(labels[g.c])+'</span>'+
 '<div class="fact-grid"><div class="fact"><label>FREKUENSI GEMPA M≥4</label><strong>'+fmt(g.n)+' kejadian</strong></div>'+
 '<div class="fact"><label>MAGNITUDO P90</label><strong>M '+fmt(g.m,2)+'</strong></div>'+
 '<div class="fact"><label>MEDIAN KEDALAMAN</label><strong>'+fmt(g.depth,1)+' km</strong></div>'+
 '<div class="fact"><label>RERATA TERCATAT / TAHUN</label><strong>'+fmt(g.annual,1)+' kejadian</strong></div></div>'+
 '<div class="note">'+safe(place.subtitle||'Lokasi terdekat di sekitar heksagon analisis')+'. Sel berukuran sekitar 65 km (radius heksagon), memakai kejadian M≥4 pada 2016–2025. Warna menjelaskan pola relatif tiga indikator, <strong>bukan ranking bahaya</strong>.</div>'+
 comparatorHtml(examples)+'<div class="small-actions"><a class="action-link" href="#atlas-news" data-show-news="true">Lihat kajian BMKG terkait ↓</a><button class="plain-button" data-jump="mitigasi">Buka panduan mitigasi →</button></div>';
}
function eventDetail(e){
 const similar=comparableCases({lat:e.lat,lon:e.lon,mag:e.m,depth:e.dep});
 return `<div class="overline">EPISENTER HISTORIS BMKG · M≥5,5</div><h2>${safe(e.p)}</h2>
 <div class="fact-grid"><div class="fact"><label>MAGNITUDO</label><strong>M ${fmt(e.m,1)}</strong></div><div class="fact"><label>KEDALAMAN</label><strong>${fmt(e.dep,1)} km</strong></div><div class="fact"><label>WAKTU (UTC)</label><strong>${safe(e.t)}</strong></div><div class="fact"><label>ID REPOGEMPA</label><strong>${safe(e.id)}</strong></div></div>
 <div class="note warn">Titik ini tercatat dalam katalog BMKG, tetapi tidak otomatis memiliki catatan kerusakan terverifikasi. Magnitudo, kedalaman dan frekuensi tidak cukup untuk menilai kerusakan bangunan.</div>
 ${comparatorHtml(similar)}<div class="small-actions"><a class="action-link" href="https://repogempa.bmkg.go.id/eventcatalog" target="_blank" rel="noopener noreferrer">Buka katalog RepoGempa ↗</a></div>`;
}
// Live slippy map replaces V15/V16 fixed SVG. The 333 BMKG heksagon data remain unchanged.
let atlasMap=null, atlasTile=null, atlasOverlay=null, atlasLoadTicket=0;
const showMapStatus=(txt='')=>{const e=$('#map-status');if(!e)return;e.hidden=!txt;e.textContent=txt;};

const ATLAS_HOME={center:[-2.3,119],zoom:5};
const TILE_SOURCES={
  ocean:{url:'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',attribution:'Ocean Relief © Esri, GEBCO, NOAA and contributors',maxNativeZoom:13},
  satellite:{url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',attribution:'Imagery © Esri and contributors',maxNativeZoom:19}
};
function setBasemap(){
 if(!atlasMap)return;
 if(atlasTile)atlasMap.removeLayer(atlasTile);
 const spec=TILE_SOURCES[state.basemap]||TILE_SOURCES.ocean;
 let errors=0,loaded=0;
 const ticket=++atlasLoadTicket;
 showMapStatus('Memuat peta '+(state.basemap==='ocean'?'Ocean Relief':'Satelit')+'…');
 atlasTile=L.tileLayer(spec.url,{attribution:spec.attribution,minZoom:0,maxZoom:19,maxNativeZoom:spec.maxNativeZoom,keepBuffer:4,crossOrigin:false});
 atlasTile.on('tileload',()=>{loaded++;if(ticket===atlasLoadTicket&&errors<3)showMapStatus('');});
 atlasTile.on('tileerror',()=>{errors++;if(ticket===atlasLoadTicket&&errors>=3){showMapStatus('Sebagian tile peta Esri gagal dimuat. Coba Satelit/Ocean Relief, refresh, atau periksa jaringan. Lokasi heksagon tetap mengikuti koordinat.');}});
 atlasTile.on('load',()=>{if(ticket===atlasLoadTicket && loaded && errors<3)showMapStatus('');});
 atlasTile.addTo(atlasMap);atlasTile.bringToBack();
}
function showAtlasDetail(html){$('#atlasDetail').innerHTML=html;}
function drawAtlas(){
 if(!atlasMap)return;
 if(atlasOverlay)atlasMap.removeLayer(atlasOverlay);
 atlasOverlay=L.layerGroup().addTo(atlasMap);
 const zAlpha=Math.max(0,Math.min(1,(100-state.transparency)/100));
 if(state.mode==='clusters'){
  for(const g of DS.grids){
   if(state.cluster!=='all' && g.c!==state.cluster)continue;
   const col=colors[g.c];
   if(state.zones){
    const hex=L.polygon(g.poly.map(([lon,lat])=>[lat,lon]),{color:col,weight:1.3,opacity:0.85,fillColor:col,fillOpacity:zAlpha,interactive:true});
    hex.on('click',()=>showAtlasDetail(gridDetail(g)));
    hex.on('mouseover',()=>{hex.setStyle({weight:2.7,opacity:1});hex.bringToFront()});
    hex.on('mouseout',()=>hex.setStyle({weight:1.3,opacity:.85}));
    hex.bindTooltip(`${safe(getGridTitle(g))} · Klaster ${safe(g.c)}`,{sticky:true,direction:'top'});
    atlasOverlay.addLayer(hex);
   }
   if(state.markers){
    const dot=L.circleMarker([g.lat,g.lon],{radius:Math.max(3,Math.min(9,2.3+Math.sqrt(g.n)*0.35)),color:'#fff',weight:1,fillColor:col,fillOpacity:.95});
    dot.on('click',()=>showAtlasDetail(gridDetail(g)));
    dot.bindTooltip(`${safe(getGridTitle(g))} · ${fmt(g.n)} gempa`,{direction:'top'});
    atlasOverlay.addLayer(dot);
   }
  }
 } else if(state.mode==='cases'){
  for(const c of DS.cases){
   const r=6+Math.min(13,Math.max(0,(Number(c.bmkg_magnitude)-3)*2.5));
   const col=c.impact_scope==='sequence'?'#8a6479':'#d16a4e';
   const pt=L.circleMarker([Number(c.lat),Number(c.lon)],{radius:r,color:'#fff',weight:1.8,fillColor:col,fillOpacity:.84});
   pt.on('click',()=>showAtlasDetail(caseDetails(c,true)));
   pt.bindTooltip(`${safe(c.bmkg_place)} · M${fmt(c.bmkg_magnitude,1)}`,{direction:'top'});
   atlasOverlay.addLayer(pt);
  }
 }else{
  for(const e of DS.events){
   const r=Math.max(3,Math.min(10,3+(Number(e.m)-5.5)*2.5));
   const pt=L.circleMarker([Number(e.lat),Number(e.lon)],{radius:r,color:'#fff',weight:1,fillColor:'#f27a45',fillOpacity:.85});
   pt.on('click',()=>showAtlasDetail(eventDetail(e)));
   pt.bindTooltip(`Gempa M${fmt(e.m,1)} · ${safe(e.p)}`,{direction:'top'});
   atlasOverlay.addLayer(pt);
  }
 }
 const isCluster=state.mode==='clusters';
 $('#cluster-filter').disabled=!isCluster;
 $('#zone-layer').disabled=!isCluster;
 $('#markers-layer').disabled=!isCluster;
 $('#alpha-range').disabled=!isCluster;
}
async function ensureLeaflet(){
 if(typeof window.L!=='undefined')return true;
 for(const url of ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js']){
  if(typeof window.L!=='undefined')return true;
  try{await new Promise((resolve,reject)=>{
   const s=document.createElement('script');s.src=url;s.async=true;
   const timer=setTimeout(()=>{s.remove();reject(new Error('timeout'))},6500);
   s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);reject(new Error('CDN blocked'));};
   document.head.appendChild(s);
  });}catch(err){console.warn('Leaflet CDN fallback:',err.message);}
 }
 return typeof window.L!=='undefined';
}
async function setupMap(){
 const holder=$('#atlasMap');
 if(atlasMap)return;
 showMapStatus('Memuat mesin peta interaktif…');
 if(!(await ensureLeaflet())){
  showMapStatus('');
  holder.innerHTML='<div class="map-load-warning"><strong>Mesin peta belum dapat diakses.</strong><p>Leaflet diblokir jaringan atau ekstensi browser. Coba refresh, ubah koneksi, atau nonaktifkan pemblokir CDN untuk situs ini. Tab lain tetap berfungsi.</p><button type="button" id="retryMap">Coba lagi</button></div>';
  $('#retryMap')?.addEventListener('click',()=>{holder.innerHTML='';setupMap();});
  return;
 }
 holder.innerHTML='';
 try{
  atlasMap=L.map(holder,{center:ATLAS_HOME.center,zoom:ATLAS_HOME.zoom,minZoom:0,maxZoom:19,zoomControl:true,
   scrollWheelZoom:true,doubleClickZoom:true,dragging:true,touchZoom:true,worldCopyJump:true,preferCanvas:true,
   zoomSnap:0.25,zoomDelta:0.75,wheelPxPerZoomLevel:85});
  setBasemap();drawAtlas();
  $('#zoomHome').addEventListener('click',()=>atlasMap.setView(ATLAS_HOME.center,ATLAS_HOME.zoom,{animate:true}));
  atlasMap.whenReady(()=>{requestAnimationFrame(()=>atlasMap.invalidateSize());setTimeout(()=>atlasMap?.invalidateSize(),350);});
  window.addEventListener('resize',()=>{if(state.tab==='atlas')atlasMap?.invalidateSize();},{passive:true});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(state.tab==='atlas')requestAnimationFrame(()=>atlasMap?.invalidateSize());}).observe(holder);
 }catch(err){console.error('Peta gagal diinisialisasi',err);showMapStatus('Peta gagal diinisialisasi: '+err.message);}
}
function repairAtlasStructure(){
 const atlas=$('#page-atlas'),workbench=atlas?.querySelector('.workbench');
 const detail=$('#atlasDetail'),news=$('#atlas-news');
 if(workbench&&detail&&detail.parentElement!==workbench)workbench.appendChild(detail);
 if(atlas&&news&&!atlas.contains(news))atlas.appendChild(news);
}
function navTo(tab){
 repairAtlasStructure();
 if(!$('#page-'+tab))tab='atlas';
 state.tab=tab;
 $$('.page').forEach(p=>{
  const active=p.id==='page-'+tab;
  p.classList.toggle('active',active);
  p.hidden=!active;
  p.setAttribute('aria-hidden',String(!active));
  if(!active)p.style.setProperty('display','none','important');
  else p.style.removeProperty('display');
 });
 $$('[data-nav]').forEach(b=>{
  const active=b.dataset.nav===tab;
  b.classList.toggle('selected',active);
  b.setAttribute('aria-current',active?'page':'false');
 });
 history.replaceState(null,'','#'+tab);
 window.scrollTo({top:0,behavior:'instant'});
 if(tab==='atlas' && atlasMap){requestAnimationFrame(()=>atlasMap.invalidateSize({pan:false}));setTimeout(()=>atlasMap?.invalidateSize({pan:false}),320);}
}
function initAtlas(){
 $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.nav)));
 $$('[data-basemap]').forEach(b=>b.addEventListener('click',()=>{state.basemap=b.dataset.basemap;$$('[data-basemap]').forEach(x=>x.classList.toggle('on',x===b));setBasemap()}));
 $$('[data-mapmode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mapmode;$$('[data-mapmode]').forEach(x=>x.classList.toggle('on',x===b));drawAtlas();if(state.mode==='cases')showAtlasDetail('<div class="overline">STUDI KASUS DAMPAK</div><h2>Pilih titik jingga untuk melihat arsip</h2><p class="muted">Titik jingga adalah gempa yang mempunyai catatan kerusakan terpilih dari katalog BMKG.</p>');}));
 $('#cluster-filter').addEventListener('change',e=>{state.cluster=e.target.value;drawAtlas()});
 $('#alpha-range').addEventListener('input',e=>{state.transparency=+e.target.value;$('#alpha-label').textContent=e.target.value+'%';drawAtlas()});
 $('#zone-layer').addEventListener('change',e=>{state.zones=e.target.checked;drawAtlas()});
 $('#markers-layer').addEventListener('change',e=>{state.markers=e.target.checked;drawAtlas()});
 document.addEventListener('click',e=>{if(e.target.closest('[data-show-news]')){document.querySelector('#atlas-news')?.scrollIntoView({behavior:'smooth'});return;}const button=e.target.closest('[data-select-case]');if(button){const c=DS.cases.find(x=>x.bmkg_catalog_id===button.dataset.selectCase);if(c){state.impactCase=c;navTo('dampak');showImpactDetail(c);renderImpact();}return;}const jump=e.target.closest('[data-jump]');if(jump)navTo(jump.dataset.jump);});
 ensureGridLocations();const firstGrid=DS.grids.find(g=>g.c==='B'&&g.n>=30)||DS.grids[0];setupMap();showAtlasDetail(gridDetail(firstGrid));updateMapPlaceBadge(firstGrid);
}
function showImpactDetail(c){$('#impact-detail').innerHTML=caseDetails(c,false)}
function renderImpact(){const q=$('#impact-search').value.toLowerCase().trim(),year=$('#impact-year').value,cat=$('#impact-category').value;
 const arr=DS.cases.filter(c=>(year==='all'||c.bmkg_date.startsWith(year))&&(cat==='all'||cat===c.category)&&(!q||[c.bmkg_place,c.impact_summary,c.category,c.bmkg_date].join(' ').toLowerCase().includes(q)));
 $('#impact-count').textContent=`${arr.length} dari ${DS.cases.length} studi kasus yang ditampilkan`;
 $('#impact-list').innerHTML=arr.map(c=>`<button class="case-row ${state.impactCase?.bmkg_catalog_id===c.bmkg_catalog_id?'chosen':''}" data-impact-id="${safe(c.bmkg_catalog_id)}"><span class="case-date">${safe(c.bmkg_date)}</span><span><strong>${safe(c.bmkg_place)}</strong><small>${safe(c.category)} · ${safe(c.impact_scope==='sequence'?'Dampak rangkaian gempa':c.impact_summary.slice(0,68)+'…')}</small></span><span class="case-mag">${fmt(c.bmkg_magnitude,1)}</span></button>`).join('');}
function initImpact(){let years=[...new Set(DS.cases.map(c=>c.bmkg_date.slice(0,4)))].sort();years.forEach(y=>$('#impact-year').insertAdjacentHTML('beforeend',`<option value="${y}">${y}</option>`));let cats=[...new Set(DS.cases.map(c=>c.category))].sort();cats.forEach(x=>$('#impact-category').insertAdjacentHTML('beforeend',`<option value="${safe(x)}">${safe(x)}</option>`));['impact-search','impact-year','impact-category'].forEach(id=>$('#'+id).addEventListener(id==='impact-search'?'input':'change',renderImpact));$('#impact-list').addEventListener('click',e=>{let id=e.target.closest('[data-impact-id]')?.dataset.impactId;if(!id)return;let c=DS.cases.find(x=>x.bmkg_catalog_id===id);if(c){state.impactCase=c;showImpactDetail(c);renderImpact()}});state.impactCase=DS.cases.find(c=>c.bmkg_place.toLowerCase().includes('palu'))||DS.cases[0];showImpactDetail(state.impactCase);renderImpact();}
function renderMitigation(){const area=$('#scenario-content');const scenario=contextTypes[state.scenario];
 const examples=DS.cases.filter(c=>decideContext(c).includes(state.scenario)).slice(0,7);
 if(examples.length){const c=examples.find(x=>x.bmkg_catalog_id===state.mitigationCase?.bmkg_catalog_id)||examples[0];state.mitigationCase=c;$('#mitigation-case-detail').innerHTML=caseDetails(c,true);}
 area.innerHTML=`<div class="overline">PANDUAN BERDASARKAN KONDISI TERAMATI</div><h2 class="section-heading">${safe(scenario.name)}</h2><p class="lead">${safe(scenario.description)}</p><div class="recs-grid">${scenario.items.map(([step,title,desc])=>`<div class="rec-card"><span>${safe(step)}</span><h3>${safe(title)}</h3><p>${safe(desc)}</p></div>`).join('')}</div><div class="scenario-panel-title">STUDI KASUS BMKG YANG MEMILIKI KONTEKS SERUPA</div>${examples.length?examples.map(c=>`<div class="example-item"><button type="button" data-mit-id="${safe(c.bmkg_catalog_id)}">${safe(c.bmkg_place)} · ${safe(c.bmkg_date)} ↗</button><p>${safe(c.impact_summary).slice(0,130)}${c.impact_summary.length>130?'…':''}</p></div>`).join(''):'<p class="muted">Belum ada contoh yang cukup jelas pada sampel katalog.</p>'}`;
 }
function initMitigation(){const tabs=$('#scenario-tabs');Object.entries(contextTypes).forEach(([id,obj])=>{const btn=document.createElement('button');btn.textContent=obj.name;btn.dataset.scenario=id;btn.addEventListener('click',()=>{state.scenario=id;$$('[data-scenario]').forEach(b=>b.classList.toggle('on',b===btn));renderMitigation();});tabs.append(btn)});$$('[data-scenario]').forEach(b=>b.classList.toggle('on',b.dataset.scenario===state.scenario));$('#scenario-content').addEventListener('click',e=>{let id=e.target.closest('[data-mit-id]')?.dataset.mitId;if(!id)return;let c=DS.cases.find(x=>x.bmkg_catalog_id===id);state.mitigationCase=c;$('#mitigation-case-detail').innerHTML=caseDetails(c,true);});renderMitigation();}
function renderTsunami(){const f=$('#ts-filter').value,arr=DS.tsunami.filter(c=>f==='all'||c.cause_catalog===f);$('#ts-count').textContent=`${arr.length} dari ${DS.tsunami.length} catatan ditampilkan`;$('#ts-list').innerHTML=arr.map(c=>`<button class="case-row ${state.tsCase?.date_iso===c.date_iso?'chosen':''}" data-ts-id="${safe(c.date_iso+'|'+c.source_name)}"><span class="case-date">${safe(c.date_iso)}</span><span><strong>${safe(c.source_name)}</strong><small>${safe(c.cause_catalog)} · ${safe(c.impact_note||'Catatan historis')}</small></span><span class="case-mag">${c.magnitude_catalog!=null?fmt(c.magnitude_catalog,1):'—'}</span></button>`).join('');}
function tsDetail(c){return `<div class="overline">KATALOG TSUNAMI BMKG · ${c.year}</div><h2>${safe(c.source_name)}</h2><div class="fact-grid"><div class="fact"><label>PEMICU TERCATAT</label><strong>${safe(c.cause_catalog)}</strong></div><div class="fact"><label>MAGNITUDO PEMICU</label><strong>${c.magnitude_catalog!=null?'M '+fmt(c.magnitude_catalog,1):'Tidak tersedia'}</strong></div><div class="fact"><label>TANGGAL</label><strong>${safe(c.date_iso)}</strong></div><div class="fact"><label>ASAL SUMBER</label><strong>${safe(c.source_geography)}</strong></div></div><div class="pale-label">CATATAN SUMBER</div><p>${safe(c.impact_note||'Tidak ada uraian dampak pada arsip terpilih.')}</p><div class="note warn">Catatan kejadian historis; tidak menyatakan wilayah tsunami saat ini. Catatan pemicu dan dampak mengikuti katalog BMKG; jangan menyimpulkan risiko lokasi saat ini.</div><div class="pale-label">KONTEKS MITIGASI PESISIR</div><ol class="case-recs">${contextTypes.pesisir.items.map(i=>`<li><strong>${safe(i[1])}:</strong> ${safe(i[2])}</li>`).join('')}</ol><div class="small-actions"><a class="action-link" target="_blank" rel="noopener noreferrer" href="${safe(c.bmkg_pdf_page_link)}">Katalog BMKG ↗</a><a class="action-link" target="_blank" rel="noopener noreferrer" href="${SRC_BMKG_EDU}">Edukasi tsunami BMKG ↗</a></div>`;}
function initTsunami(){state.tsCase=DS.tsunami[0];$('#ts-detail').innerHTML=tsDetail(state.tsCase);$('#ts-filter').addEventListener('change',renderTsunami);$('#ts-list').addEventListener('click',e=>{const id=e.target.closest('[data-ts-id]')?.dataset.tsId;if(!id)return;const c=DS.tsunami.find(c=>c.date_iso+'|'+c.source_name===id);if(c){state.tsCase=c;$('#ts-detail').innerHTML=tsDetail(c);renderTsunami();}});renderTsunami();}
function filteredHistoryEvents(input){
 const mag=Number($('#history-mag-filter').value||0),year=$('#history-year-filter').value,dep=$('#history-depth-filter').value,
 search=$('#history-location-filter').value.toLocaleLowerCase('id').trim(),sort=$('#history-sort-filter').value;
 const filtered=input.filter(e=>Number(e.m)>=mag&&(year==='all'||String(e.yr)===year)&&
 (dep==='all'||(dep==='shallow'?e.dep<=70:dep==='medium'?e.dep>70&&e.dep<=300:e.dep>300))&&
 (!search||String(e.p).toLocaleLowerCase('id').includes(search)));
 if(sort==='latest')filtered.sort((a,b)=>b.t.localeCompare(a.t));
 else if(sort==='oldest')filtered.sort((a,b)=>a.t.localeCompare(b.t));
 else if(sort==='depth')filtered.sort((a,b)=>b.dep-a.dep||b.m-a.m);
 else filtered.sort((a,b)=>b.m-a.m||b.dep-a.dep);
 return filtered;
}
function renderHistoryYears(){
 const root=$('#history-year-bars');if(!root)return;
 const mag=$('#history-mag-filter').value,selected=$('#history-year-filter').value;
 const years=Object.keys(DS.year).sort();const counts=DS.history_counts?.[mag]||DS.year;
 const max=Math.max(1,...years.map(y=>counts[y]||0));
 root.innerHTML=years.map(y=>`<div class="year-col ${selected===y?'active':''}"><span class="year-num">${fmt(counts[y]||0)}</span><div class="year-bar" style="height:${Math.max(7,((counts[y]||0)/max)*225)}px"></div><small>${safe(y)}</small></div>`).join('');
}
async function getHistoryYear(y){
 if(HISTORY_CACHE.has(y))return HISTORY_CACHE.get(y);
 const resp=await fetch('data/history/'+y+'.json');if(!resp.ok)throw new Error('Riwayat '+y+' tidak dapat dimuat');
 const a=await resp.json();HISTORY_CACHE.set(y,a);return a;
}
async function renderHistory(){
 const ticket=++HISTORY_TICKET,year=$('#history-year-filter').value,years=year==='all'?Object.keys(DS.year):[year],count=$('#history-count');
 renderHistoryYears();count.textContent=`Memuat riwayat BMKG ${year==='all'?'semua tahun':year}…`;
 try{
  // Lazy load year-by-year; avoid large initial cost in Atlas ML.
  const parts=await Promise.all(years.map(getHistoryYear));if(ticket!==HISTORY_TICKET)return;
  const arr=filteredHistoryEvents(parts.flat());
  count.textContent=`${fmt(arr.length)} kejadian sesuai filter · menampilkan ${fmt(Math.min(150,arr.length))} pertama · BMKG RepoGempa`;
  $('#history-table-wrap').innerHTML=`<table class="history-table"><thead><tr><th>Waktu UTC</th><th>Magnitudo</th><th>Kedalaman</th><th>Lokasi</th><th>ID BMKG</th><th>Katalog</th></tr></thead><tbody>${arr.slice(0,150).map(e=>`<tr><td>${safe(e.t)}</td><td><strong>${fmt(e.m,1)}</strong></td><td>${fmt(e.dep,1)} km</td><td>${safe(e.p)}</td><td><span class="tag">${safe(e.id)}</span></td><td><a target="_blank" rel="noopener noreferrer" href="https://repogempa.bmkg.go.id/eventcatalog">RepoGempa ↗</a></td></tr>`).join('')}</tbody></table><div class="table-note">* Tabel berasal dari CSV RepoGempa BMKG. Terdapat 52 tanggal tanpa rekaman ekspor; angka tidak otomatis menggambarkan seluruh kejadian sebenarnya. Link membuka katalog pencarian, bukan halaman detail kejadian langsung.</div>`;
 }catch(err){if(ticket===HISTORY_TICKET){count.textContent='Gagal memuat riwayat: '+err.message;$('#history-table-wrap').innerHTML='<p class="muted">Pastikan seluruh berkas data/history tersedia di hosting.</p>';}}
}
function initHistory(){
 const years=Object.keys(DS.year).sort();years.forEach(y=>$('#history-year-filter').insertAdjacentHTML('beforeend',`<option value="${safe(y)}">${safe(y)}${y==='2026'?' (parsial)':''}</option>`));
 $('#history-year-filter').value='2026';
 ['history-mag-filter','history-year-filter','history-depth-filter','history-sort-filter'].forEach(id=>$('#'+id).addEventListener('change',renderHistory));
 let tm;$('#history-location-filter').addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(renderHistory,220);});
 renderHistory();
}
function normalizeBMKGEntries(obj,forcedCategory){
 const feeds=obj?.feeds||(obj?.Infogempa?{[forcedCategory||'BMKG']:obj}:obj)||{};
 const flat=[];
 const mapCategory=(key)=>({gempa_terbaru:'Gempa terbaru',gempa_dirasakan:'Gempa dirasakan',dirasakan:'Gempa dirasakan',autogempa:'Gempa terbaru',m5:'M5+',m5_plus:'M5+'}[key]||key||forcedCategory||'BMKG');
 if(Array.isArray(feeds)) return feeds.map(e=>({...e,category:forcedCategory||e.category||'BMKG'}));
 for(const [cat,v] of Object.entries(feeds)){
  let payload=v?.Infogempa?.gempa ?? v?.gempa ?? v;
  let arr=Array.isArray(payload)?payload:[payload];
  arr.filter(Boolean).forEach(e=>flat.push({...e,category:mapCategory(cat)}));
 }
 return flat;
}
function renderBMKGRows(entries){
 const tbody=$('#bmkg-tbody');
 const cat=$('#bmkg-category')?.value||'gempa_terbaru';
 const labelMap={gempa_terbaru:'Gempa terbaru',gempa_dirasakan:'Gempa dirasakan',dirasakan:'Gempa dirasakan',autogempa:'Gempa terbaru',m5:'M5+',m5_plus:'M5+'};
 let arr=entries.filter(e=>{
  const name=String(e.category||'').toLowerCase();
  if(cat==='gempa_terbaru'||cat==='autogempa')return name.includes('terbaru')||name==='autogempa';
  if(cat==='gempa_dirasakan')return name.includes('dirasakan');
  if(cat==='m5')return name.includes('m5');
  return true;
 });
 if(!arr.length){tbody.innerHTML='<tr><td colspan="5">Belum ada data untuk kategori yang dipilih.</td></tr>';return;}
 tbody.innerHTML=arr.slice(0,120).map(e=>`<tr><td>${safe([e.Tanggal,e.Jam].filter(Boolean).join(' ' )||e.tanggal||'—')}</td><td><strong>${safe(e.Magnitude||e.magnitude||'—')}</strong></td><td>${safe(e.Kedalaman||e.kedalaman||'—')}</td><td>${safe(e.Wilayah||e.wilayah||'—')}</td><td>${safe(e.Potensi||e.Dirasakan||e.potensi||e.dirasakan||e.category||'—')}</td></tr>`).join('');
}
async function initBMKG(){
 const setMsg=msg=>$('#bmkg-update').textContent=msg;
 let entries=[];
 const URLS={gempa_terbaru:'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',m5:'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',gempa_dirasakan:'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'};
 const categoryName={gempa_terbaru:'Gempa terbaru',m5:'M5+',gempa_dirasakan:'Gempa dirasakan'};
 $('#bmkg-category').addEventListener('change',()=>{renderBMKGRows(entries);$('#bmkg-update').textContent=entries.length?'Kategori dipilih; klik Update untuk memeriksa data BMKG terbaru.':'Kategori dipilih; klik Update untuk memuat data BMKG.';});
 async function loadLocalFallback(){
  const candidates=[
    'data/bmkg_snapshot.json?t='+Date.now(),
    'https://raw.githubusercontent.com/afrielha21-cell/EarthAlert-Indonesia/main/data/bmkg_snapshot.json?t='+Date.now()
  ];
  let obj=null,fresh=[],lastError='';
  for(const url of candidates){
    try{
      const resp=await fetch(url,{cache:'no-store'});
      if(!resp.ok)throw new Error('HTTP '+resp.status);
      const test=await resp.json();
      const rows=normalizeBMKGEntries(test);
      if(!rows.length)throw new Error('snapshot masih kosong');
      obj=test;fresh=rows;break;
    }catch(e){lastError=e.message;}
  }
  if(!fresh.length)throw new Error('Snapshot tidak tersedia ('+lastError+').');
  entries=fresh;renderBMKGRows(entries);
  setMsg('Data resmi BMKG dari snapshot GitHub ('+(obj.fetched_at_utc||'waktu pembaruan tidak diketahui')+' UTC). '+(obj.refresh_ok?'Sinkronisasi terakhir berhasil.':'Sinkronisasi terakhir belum berhasil; data dapat berupa cache lama.')+' Klik Update untuk mengecek versi terbaru.');
 }
 $('#bmkg-fetch-btn').addEventListener('click',async()=>{
  const cat=$('#bmkg-category').value;
  setMsg('Memeriksa '+categoryName[cat]+' dari BMKG Open Data; bila dibatasi browser, gunakan snapshot GitHub…');
  try{
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),11000);
   let r;try{r=await fetch(URLS[cat],{mode:'cors',cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}
   if(!r.ok)throw new Error('HTTP '+r.status);
   const obj=await r.json(),fresh=normalizeBMKGEntries(obj,categoryName[cat]);
   if(!fresh.length)throw new Error('Feed BMKG tidak memuat kejadian');
   entries=entries.filter(e=>String(e.category)!==categoryName[cat]).concat(fresh);
   renderBMKGRows(entries);
   setMsg('Berhasil membaca '+fresh.length+' kejadian kategori '+categoryName[cat]+' langsung dari BMKG Open Data pada '+new Date().toLocaleString('id-ID')+'. Waktu resmi kejadian mengikuti isi JSON BMKG.');
  }catch(err){
   console.warn('Akses langsung BMKG tidak tersedia:',err.message);
   try{await loadLocalFallback();setMsg($('#bmkg-update').textContent+' Akses langsung ke BMKG dibatasi ('+err.message+').');}
   catch(error){if(entries.length){renderBMKGRows(entries);setMsg('Update langsung tidak tersedia ('+err.message+'). Data sebelumnya tetap ditampilkan. '+error.message+'.');}else{renderBMKGRows([]);setMsg('Update langsung tidak tersedia ('+err.message+'). '+error.message+'. Kamu tetap dapat memilih Impor JSON resmi BMKG.');}}
  }
 });
 $('#bmkg-import').addEventListener('change',async(ev)=>{
  const f=ev.target.files?.[0];if(!f)return;
  try{
   const obj=JSON.parse(await f.text());
   const cat=$('#bmkg-category').value,name=categoryName[cat];const fresh=normalizeBMKGEntries(obj,name);
   if(!fresh.length)throw new Error('JSON tidak memiliki kejadian BMKG');
   entries=entries.filter(e=>String(e.category)!==name).concat(fresh);renderBMKGRows(entries);
   setMsg('Berhasil mengimpor '+fresh.length+' entri kategori '+name+' dari file JSON. Data tidak dikirim ke server.');
  }catch(err){setMsg('File JSON tidak dapat dibaca: '+err.message);}
 });
 try{await loadLocalFallback();}catch(err){renderBMKGRows([]);setMsg('Belum ada snapshot tersimpan. Pilih kategori dan klik Update untuk mencoba BMKG Open Data, atau impor JSON resmi.');}
}
function renderMetrics(){
 const root=$('#metric-chart');
 const all=DS.metrics.filter(r=>Number.isFinite(Number(r.w))).slice().sort((a,b)=>a.k-b.k);
 const rows=all.filter(r=>r.k>=2&&Number.isFinite(Number(r.s)));
 const maxS=Math.max(...rows.map(r=>Number(r.s)));
 root.innerHTML='<div class="metrics-board">'+rows.map(r=>'<div class="metric-bar '+(r.k===4?'active':'')+'" title="k='+r.k+'; Silhouette='+fmt(r.s,3)+'; WCSS='+fmt(r.w,1)+'; DBI='+fmt(r.dbi,3)+'"><span>'+fmt(r.s,3)+'</span><div class="bar" style="height:'+Math.max(14,Number(r.s)/maxS*113)+'px"></div><b>k='+r.k+'</b></div>').join('')+'</div>';
 const target=$('#elbow-chart');
 if(target&&all.length>=2){
  const W=360,H=200,left=45,right=14,top=20,bottom=32;
  const minW=Math.min(...all.map(r=>Number(r.w)));
  const maxW=Math.max(...all.map(r=>Number(r.w)));
  const firstK=all[0].k,lastK=all[all.length-1].k;
  const plotW=W-left-right,plotH=H-top-bottom;
  const x=k=>left+(Number(k)-firstK)/(lastK-firstK)*plotW;
  const y=w=>top+(maxW-Number(w))/(maxW-minW||1)*plotH;
  const grid=[0,0.5,1].map(t=>{
    const yy=top+t*plotH,ww=maxW-t*(maxW-minW);
    return '<line class="elbow-grid" x1="'+left+'" x2="'+(W-right)+'" y1="'+yy+'" y2="'+yy+'"/>'+
      '<text class="elbow-axis" x="'+(left-7)+'" y="'+(yy+4)+'" text-anchor="end">'+fmt(ww,0)+'</text>';
  }).join('');
  const path=all.map((r,i)=>(i?'L':'M')+x(r.k).toFixed(1)+' '+y(r.w).toFixed(1)).join(' ');
  const selected=all.find(r=>r.k===4);
  const selectedX=selected?x(4):null;
  const selection=selected?'<line class="elbow-selection" x1="'+selectedX+'" x2="'+selectedX+'" y1="'+top+'" y2="'+(H-bottom)+'"/>'+
   '<text class="elbow-number" x="'+(selectedX+5)+'" y="'+(top+9)+'">k=4</text>':'';
  const points=all.map(r=>'<circle class="elbow-point '+(r.k===4?'is-selected':'')+'" cx="'+x(r.k).toFixed(1)+'" cy="'+y(r.w).toFixed(1)+'" r="'+(r.k===4?5.5:4.1)+'"><title>k='+r.k+'; WCSS='+fmt(r.w,3)+'</title></circle>').join('');
  const labels=all.map(r=>'<text class="elbow-axis" x="'+x(r.k).toFixed(1)+'" y="'+(H-10)+'" text-anchor="middle">'+r.k+'</text>').join('');
  target.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Grafik Elbow WCSS untuk k 1 hingga 8 dari hasil K-Means BMKG 2016 hingga 2025. K empat ditandai sebagai model terpilih.">'+
   '<title>Elbow WCSS: semakin kecil WCSS semakin kompak klaster; siku dinilai bersama metrik lainnya.</title>'+
   grid+'<path class="elbow-line" d="'+path+'"/>'+selection+points+labels+
   '<text class="elbow-axis" x="'+(W-right-2)+'" y="'+(H-1)+'" text-anchor="end">Jumlah klaster (k)</text></svg>';
 }
 const body=$('#method-profiles');
 if(body)body.innerHTML=DS.profiles.map(p=>'<tr><td><strong style="color:'+colors[p.c]+'">'+p.c+'</strong> — '+safe(p.name)+'</td><td>'+fmt(p.grids)+'</td><td>'+fmt(p.count_median)+'</td><td>'+fmt(p.p90_median,2)+'</td><td>'+fmt(p.depth_median,1)+' km</td></tr>').join('');
}
async function boot(){try{
 const names=['grids','events','cases','tsunami','metrics','profiles','year','metadata','news','history_counts'];const files=await Promise.all(names.map(async n=>{const r=await fetch(`data/${n}.json`);if(!r.ok)throw new Error(`Berkas ${n}.json tidak dapat dimuat.`);return r.json()}));names.forEach((n,i)=>DS[n]=files[i]);
 ensureGridLocations();
 repairAtlasStructure();navTo(location.hash.replace('#','')==='usgs'?'riwayat':location.hash.replace('#','')||'atlas');initAtlas();initHistory();initImpact();initMitigation();initTsunami();initBMKG();renderMetrics();
 }catch(err){const s=$('#site-status');s.textContent='Data belum berhasil dimuat: '+err.message+' Jalankan situs melalui server HTTP (atau deploy), jangan membuka index.html langsung dengan file://';s.className='site-status visible error';console.error(err);}}
window.addEventListener('hashchange',()=>{
 const next=location.hash.replace('#','');
 if(['atlas','riwayat','dampak','mitigasi','tsunami','bmkg','metodologi'].includes(next)&&next!==state.tab)navTo(next);
});
boot();