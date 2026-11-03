/* Tanya Earth — asisten penelusuran data lokal EarthAlert.
   Tidak memakai API AI pihak ketiga, tidak mengarang angka, dan hanya menjawab dari
   JSON RepoGempa/Katalog BMKG yang tersedia di situs. */
(function(root){
 'use strict';
 const doc=typeof document==='undefined'?null:document;
 const source={repo:{label:'RepoGempa BMKG / Riwayat Gempa',url:'#riwayat'},atlas:{label:'Atlas ML BMKG 2016–2025',url:'#atlas'},impact:{label:'Katalog Gempabumi Signifikan dan Merusak BMKG',url:'#dampak'},tsunami:{label:'Katalog Tsunami Indonesia BMKG · tab Dampak Gempa',url:'#dampak'},method:{label:'Metodologi EarthAlert',url:'#metodologi'},latest:{label:'Gempa Terkini BMKG (snapshot)',url:'#bmkg'},mitigation:{label:'Wawasan Mitigasi',url:'#mitigasi'}};
 const qaQuestions=[
  'Wilayah mana paling sering mengalami gempa?',
  'Gempa terbesar di Indonesia dalam data EarthAlert?',
  'Di mana korban meninggal terbanyak pada arsip dampak?',
  'Apa perbedaan empat klaster EarthAlert?',
  'Kenapa dipilih empat klaster?',
  'Apa gempa terkini yang tercatat BMKG?',
  'Berapa jumlah gempa M≥4 pada 2023?',
  'Apa saja kejadian tsunami yang tercatat?',
  'Apa itu magnitudo P90 dan kedalaman?',
  'Bagaimana cara kerja K-Means di EarthAlert?'
 ];
 const fnum=(n,d=0)=>Number(n).toLocaleString('id-ID',{maximumFractionDigits:d,minimumFractionDigits:d});
 const norm=t=>String(t??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s\-]/g,' ').replace(/\s+/g,' ').trim();
 const words=t=>norm(t).split(' ').filter(Boolean);
 const regex=(s,p)=>p.test(norm(s));
 const cleanDate=(s)=>String(s||'').slice(0,10);
 const geobands=[
  {label:'Banda / Maluku',search:['banda','maluku','molucca','seram','tanimbar','ambon','halmahera','ceram','arafura']},
  {label:'Sulawesi',search:['sulawesi','celebes','minahassa','talaud','poso','palu','mamuju','gorontalo','kolaka','manado','sangihe']},
  {label:'Jawa',search:['jawa','java','yogyakarta','jogja','cianjur','bandung','jakarta','banten','semarang','sukabumi','batang','sumedang']},
  {label:'Sumatra',search:['sumatra','sumatera','aceh','nias','mentawai','padang','bengkulu','lampung','pidie','pasaman']},
  {label:'Papua',search:['papua','jayapura','sarmi','biak','sorong','manokwari']},
  {label:'Nusa Tenggara / Flores',search:['flores','lombok','bali','timor','sumbawa','kupang','ntt','ntb','bima','labuan bajo']},
  {label:'Kalimantan',search:['kalimantan','borneo','tarakan','balikpapan','samarinda']}
 ];
 const alias={jawa:['java','jawa'],sumatra:['sumatra','sumatera'],sulawesi:['sulawesi','celebes','minahassa'],maluku:['molucca','maluku'],yogyakarta:['yogyakarta','jogjakarta','jogja'],papua:['papua','irian'],flores:['flores'],bali:['bali'],aceh:['aceh','northern sumatra'],palu:['palu'],jakarta:['jakarta'],banda:['banda'],lombok:['lombok'],ntt:['flores','timor','kupang','nusa tenggara timur']};
 const exclForeign=(e)=>!/(philippine|mindanao|malaysia|papua new guinea|solomon|palau)/i.test(String(e.p||''));
 const docsTokens=t=>words(t).filter(w=>w.length>=3 && !['dari','pada','yang','dengan','atau','mana','apa','berapa','gempa','earthalert','earth','indonesia','ini','itu','untuk','oleh','adalah','bagaimana','mengenai','tolong','saya','ada','bisa','paling','sebutkan','daerah'].includes(w));
 const resp=(title,body,opts={})=>({title,body,bullets:opts.bullets||[],note:opts.note||'',sources:opts.sources||[],status:opts.status||'Terjawab dari data'});
 const idxSource=(...keys)=>keys.map(k=>source[k]).filter(Boolean);
 const includesAny=(t,...v)=>v.some(x=>t.includes(x));
 const yearFrom=q=>{const x=q.match(/(?:20(?:1[6-9]|2[0-6]))/);return x?+x[0]:null;};
 function locationTerm(q){
  const t=norm(q);
  const terms=['sulawesi','yogyakarta','jogja','sumatra','sumatera','jawa','java','papua','maluku','flores','banda','bali','lombok','aceh','kalimantan','nias','palu','mentawai','halmahera','tanimbar','cianjur','bandung','sarmi','poso','seram','timor','ntt','ntb','ternate','bengkulu','lampung','jakarta','minahassa','mamuju','jayapura','labuan bajo','pidie','ambon','talaud','sumbawa','kupang','karawang','sukabumi','sumedang','surabaya','medan','semarang','makassar','palembang','padang','pekanbaru','denpasar','manado','ternate','tarakan','bima','situbondo','bondowoso','banyuwangi','bogor','bekasi','sidoarjo','malang','probolinggo','cilegon','pangandaran','banda aceh','palu','tangerang','kendari','baubau','ternate','magelang','tegal'];
  return terms.find(tg=>new RegExp('(?:^|\\s)'+tg.replace(/ /g,'\\s+')+'(?:$|\\s)').test(t))||null;
 }
 function matchPlace(e,term){
  if(!term)return true;
  const txt=norm(e.p||e.bmkg_place||e.source_name||e.impact_summary||'');
  const variants=alias[term]||[term];
  return variants.some(a=>txt.includes(a));
 }
 function readMag(q){
  const s=String(q).toLowerCase().replace(',','.');
  let m=s.match(/\bm\s*(?:≥|>=|>|minimal|lebih dari|di atas|setidaknya|sekurang-kurangnya)?\s*(\d(?:\.\d+)?)/);
  if(!m)m=s.match(/magnitudo\s*(?:di atas|minimal|lebih dari|≥|>=|>)\s*(\d(?:\.\d+)?)/);
  return m?parseFloat(m[1]):null;
 }
 function isHistoryQuery(q){return includesAny(norm(q),'berapa gempa','jumlah gempa','jumlah kejadian','total kejadian','kejadian gempa','gempa di ','gempa pada tahun','gempa tahun','magnitudo tertinggi di','seberapa sering','magnitudo m','bermagnitudo');}
 function topEventsAnswer(top,why,selection=''){return resp(why,`Berikut kejadian yang menonjol dalam ${selection||'arsip RepoGempa EarthAlert yang tersedia'}.`,{
  bullets:top.map(e=>`M ${fnum(e.m,2)} — ${e.p||'Lokasi tak tersedia'}; ${cleanDate(e.t)} UTC; kedalaman ${fnum(e.dep,1)} km (ID ${e.id||'—'}).`),
  note:'“Terbesar” di sini berarti magnitudo tercatat dalam periode dan cakupan katalog EarthAlert, bukan rekor sepanjang sejarah dunia atau peringkat kerusakan.',sources:idxSource('repo')});}
 function deaths(row){
  const s=String(row.impact_summary||'').toLowerCase();
  const matches=[...s.matchAll(/(\d[\d.,]*)\s*(?:orang\s+|warga\s+|korban\s+)?(?:meninggal|tewas|korban jiwa)/g)];
  return matches.map(m=>parseInt(m[1].replace(/[.,]/g,''),10)).filter(Number.isFinite)[0]||null;
 }
 function retrieve(q,index){
  const list=[];
  (index.cases||[]).forEach(c=>list.push({kind:'impact',title:c.bmkg_place,body:c.impact_summary,date:c.bmkg_date,url:c.bmkg_pdf_url}));
  (index.tsunami||[]).forEach(c=>list.push({kind:'tsunami',title:c.source_name,body:`${c.cause_catalog||''}. ${c.impact_note||''}`,date:c.date_iso,url:c.bmkg_pdf_page_link}));
  (index.news||[]).forEach(c=>list.push({kind:'news',title:c.title,body:c.context,date:c.date,url:c.url}));
  (index.profiles||[]).forEach(c=>list.push({kind:'atlas',title:`Klaster ${c.c}: ${c.name}`,body:`${c.grids} heksagon; magnitudo P90 median ${c.p90_median}; kedalaman median ${c.depth_median} km.`,date:'',url:'#atlas'}));
  const qterms=docsTokens(q);
  if(!qterms.length)return [];
  return list.map(r=>{
   const title=norm(r.title),body=norm(r.body);
   const hits=qterms.filter(t=>title.includes(t)||body.includes(t)).length;
   const score=qterms.reduce((s,t)=>s+(title.includes(t)?5:0)+(body.includes(t)?2:0),0);
   return {...r,score,hits};
  }).filter(r=>r.score>0 && r.hits>=Math.max(1,Math.ceil(qterms.length*.65))).sort((a,b)=>b.score-a.score).slice(0,4);
 }
 function queryIndex(q,I){
  const n=norm(q),year=yearFrom(n),place=locationTerm(n),magn=readMag(q);
  const getTop=(arr)=>arr.filter(e=>(!year||e.yr===year)&&(!place||matchPlace(e,place)));
  if(/^(hai|halo|hello|assalamualaikum|pagi|siang|malam|tolong bantu)(\s|$)/.test(n)){
   return resp('Halo! Aku Tanya Earth','Kamu dapat menanyakan data gempa, lokasi heksagon, metode K-Means, dampak yang tercatat, tsunami, serta pembaruan BMKG. Pilih pertanyaan contoh atau tulis pertanyaanmu sendiri.',{sources:idxSource('atlas','method')});
  }
  if(includesAny(n,'prediksi','kapan akan gempa','ramalan gempa','peta bahaya','zona aman','paling rawan','zona berbahaya','gempa besok')){
   return resp('EarthAlert bukan sistem prediksi gempa','K-Means di EarthAlert mengelompokkan karakteristik gempa yang tercatat pada 2016–2025. Warna atau label klaster tidak menunjukkan tingkat bahaya resmi, peluang kejadian besok, maupun prediksi korban.',{bullets:['Untuk mitigasi, lihat panduan kontekstual dan selalu ikuti informasi serta peringatan resmi BMKG/InaTEWS.','Untuk membandingkan aktivitas yang tercatat, tanyakan “heksagon dengan frekuensi gempa tertinggi”.'],sources:idxSource('atlas','mitigation','latest')});
  }
  if(includesAny(n,'korban jiwa','meninggal','tewas','korban terbanyak','jumlah korban','korban paling')){
   const vals=(I.cases||[]).map(c=>({c,n:deaths(c)})).filter(a=>Number.isFinite(a.n)).filter(a=>!year||Number(a.c.bmkg_date.slice(0,4))===year).filter(a=>!place||matchPlace(a.c,place)).sort((a,b)=>b.n-a.n);
   if(!vals.length)return resp('Jumlah korban tidak dapat dibandingkan','Pada 50 kasus dampak pilihan, tidak ada angka korban meninggal yang tertulis secara eksplisit untuk filter ini. Aku tidak akan menebak atau menyatakan daerah dengan korban terbanyak sepanjang sejarah.',{note:'Periksa katalog dampak resmi untuk angka korban, konteks rangkaian kejadian, dan pembaruan yang mungkin berbeda.',sources:idxSource('impact')});
   return resp('Korban meninggal pada arsip dampak pilihan',`Dari ${I.total_cases} kasus pilihan, berikut kejadian yang secara eksplisit mencantumkan angka korban meninggal dalam ringkasan katalog${year?' tahun '+year:''}${place?' yang cocok dengan “'+place+'”':''}:`,{bullets:vals.slice(0,4).map(({c,n})=>`${c.bmkg_place} (${c.bmkg_date}): ${fnum(n)} korban meninggal disebut dalam ringkasan kasus.`),note:'Urutan ini hanya membandingkan entri yang memiliki angka korban eksplisit dalam 50 sampel, bukan peringkat korban terbanyak di Indonesia dan bukan dampak prediksi K-Means.',sources:idxSource('impact')});
  }
  if(includesAny(n,'kerusakan','rusak','rumah rusak','bangunan hancur','dampak terbesar','dampak terbanyak')){
   const entries=(I.cases||[]).filter(c=>(!year||c.bmkg_date.startsWith(''+year))&&(!place||matchPlace(c,place)));
   const cand=entries.filter(c=>/\d/.test(c.impact_summary||'')).sort((a,b)=>Number(b.bmkg_magnitude)-Number(a.bmkg_magnitude));
   if(!entries.length)return resp('Belum ditemukan arsip dampak yang cocok','Pada 50 kasus pilihan tidak ada entri yang cocok dengan wilayah atau tahun tersebut. Ini tidak berarti wilayah itu tidak pernah terdampak gempa.',{sources:idxSource('impact')});
   return resp('Catatan kerusakan dari katalog BMKG',`Ditemukan ${entries.length} dari ${I.total_cases} kasus dampak terkurasi yang cocok. Berikut beberapa catatan yang berisi angka atau uraian kerusakan:`,{bullets:(cand.length?cand:entries).slice(0,4).map(c=>`${c.bmkg_place} (${c.bmkg_date}) — ${c.impact_summary}`),note:'Jenis kerusakan dan unit pencatatan berbeda antar-kejadian, sehingga tidak valid menetapkan “kerusakan terbanyak nasional” hanya dari sampel ini. Dampak rangkaian kejadian tidak selalu dapat dikaitkan ke satu episenter.',sources:idxSource('impact')});
  }
  if(includesAny(n,'tsunami','gelombang laut','selat sunda','pemicu tsunami')){
   const items=(I.tsunami||[]).filter(c=>(!year||Number(c.year)===year)&&(!place||matchPlace(c,place)));
   return resp('Arsip tsunami BMKG',items.length?`EarthAlert memuat ${I.total_tsunami} catatan tsunami pilihan. ${items.length} catatan cocok dengan pertanyaanmu.`:'Tidak ada catatan yang cocok di 12 arsip pilihan.',{bullets:items.slice(0,5).map(t=>`${t.source_name} (${t.date_iso}) — pemicu ${t.cause_catalog||'belum tercatat'}, ${t.impact_note||'lihat katalog BMKG'}`),note:'Arsip tsunami merupakan sejarah, bukan peringatan tsunami langsung.',sources:idxSource('tsunami','mitigation')});
  }
  if(includesAny(n,'terkini','terbaru','hari ini','baru saja','gempa sekarang','real time','realtime','update bmkg'))return null; // fetched separately
  if(includesAny(n,'k means','kmeans','klaster','cluster','silhouette','elbow','wcss','davies','mengelompokkan','machine learning')){
   const p=I.profiles||[],m=I.metrics||[],best=m.find(x=>x.k===4)||{};
   if(includesAny(n,'mengapa','kenapa','optimal','berapa klaster','jumlah klaster','pilih k','elbow','silhouette','wcss','davies','evaluasi'))return resp('Mengapa dipilih empat klaster?',`EarthAlert menguji k=2 sampai k=8. k=4 dipilih sebagai pilihan terbaik untuk skenario 333 heksagon karena Silhouette tertinggi pada rangkaian uji (${fnum(best.s,3)}), WCSS memperlihatkan perlambatan penurunan, dan ukuran serta makna kelompok masih cukup mudah dijelaskan.`,{bullets:[`Silhouette k=4: ${fnum(best.s,3)}; Davies–Bouldin: ${fnum(best.dbi,3)}; WCSS: ${fnum(best.w,1)}.`,`k=4 bukan angka yang ditetapkan sebelumnya; model dibandingkan dengan alternatif termasuk k=6.`],note:'Hasil evaluasi berlaku untuk skenario heksagon 65 km dan indikator yang dipakai pada model, bukan pilihan optimal untuk setiap dataset lain.',sources:idxSource('method','atlas')});
   return resp('Empat profil K-Means EarthAlert','K-Means mengelompokkan 333 heksagon menurut frekuensi gempa M≥4, magnitudo P90, dan median kedalaman, setelah penyesuaian skala indikator.',{bullets:p.map(c=>`Klaster ${c.c} — ${c.name}; ${fnum(c.grids)} heksagon; median frekuensi ${fnum(c.count_median)} kejadian; P90 ${fnum(c.p90_median,2)}; kedalaman ${fnum(c.depth_median,1)} km.`),note:'Keempat klaster adalah profil seismisitas historis, bukan kategori aman–bahaya atau prediksi kerusakan.',sources:idxSource('method','atlas')});
  }
  if(includesAny(n,'p90','persentil','apa itu magnitudo','apa itu kedalaman','definisi gempa','cara hitung frekuensi','apa itu heksagon','hexagon')){
   return resp('Tiga indikator analisis EarthAlert','Pada setiap heksagon sekitar 65 km, EarthAlert menghitung tiga ciri utama:',{bullets:['Frekuensi: jumlah rekaman gempa M≥4 pada 2016–2025 yang masuk ke heksagon.','Magnitudo P90: nilai yang berada pada atau di atas sekitar 90% data magnitudo di zona tersebut; berguna membaca bagian atas kekuatan gempa, bukan satu nilai ekstrem saja.','Median kedalaman: nilai tengah kedalaman gempa; digunakan untuk membedakan ciri gempa dangkal dan dalam.'],note:'Indikator ini dipakai untuk membuat profil klaster, tidak cukup sendirian untuk menetapkan tingkat risiko gempa.',sources:idxSource('method')});
  }
  if(includesAny(n,'data dari mana','sumber data','cara memperoleh data','mengambil data','preprocessing','pra pemrosesan','130 kali','2016 sampai','periode penelitian','jumlah data keseluruhan','berapa total data')){
   return resp('Sumber dan pengolahan data EarthAlert',`EarthAlert memakai unduhan CSV RepoGempa BMKG yang diaudit. Arsip 2016 sampai 12 Oktober 2026 memuat ${fnum(I.total_history_unique)} kejadian unik; untuk model digunakan periode penuh 2016–2025 dengan ${fnum(I.model_event_count)} rekaman berbagai magnitudo.`,{bullets:[`Terdapat ${fnum(I.missing_dates)} tanggal tanpa rekaman pada audit ekspor; ini tidak serta-merta berarti tidak pernah terjadi gempa.`,`Titik M≥4 diolah menjadi ${fnum(I.total_hex)} heksagon berlabel.`,`Katalog dampak (${I.total_cases} kasus) dan tsunami (${I.total_tsunami} catatan) digunakan sebagai informasi pendukung, terpisah dari model.`,`Data gempa terkini dibaca dari feed JSON BMKG, bukan data pelatihan K-Means.`],sources:idxSource('repo','method','impact','latest')});
  }
  if(includesAny(n,'gempa paling sering','paling sering gempa','lokasi paling sering','wilayah paling sering','frekuensi tertinggi','paling banyak gempa','zona tersering')){
   const top=(I.high_frequency_hex||[]).slice(0,4);
   const labels=(I.top_exact_place_labels_M4_2016_2025||[]).slice(0,4);
   return resp('Wilayah dengan frekuensi gempa tercatat paling tinggi',`Berdasarkan unit analisis heksagon sekitar 65 km, berikut zona dengan jumlah gempa M≥4 tertinggi pada 2016–2025:`,{bullets:[...top.map((g,i)=>`${i+1}. Titik tengah ${fnum(g.lat,2)}°, ${fnum(g.lon,2)}° (ID ${g.id}) — ${fnum(g.n)} gempa; Klaster ${g.c}.`),`Menurut label lokasi katalog (bukan batas wilayah administratif), tiga label teratas: ${labels.slice(0,3).map(e=>e.name+' ('+fnum(e.count)+')').join('; ')}.`],note:'Urutan dihitung dari kejadian yang tercatat, bukan daftar daerah paling berbahaya. Terdapat tanggal tanpa rekaman dan perbedaan kelengkapan katalog.',sources:idxSource('atlas','repo')});
  }
  if(includesAny(n,'paling dalam','terdalam','paling dangkal','terdangkal')){
   const deeper=includesAny(n,'dalam','terdalam')&&!includesAny(n,'dangkal');
   const list=getTop(I[deeper?'deepest':'shallowest']||[]);
   if(list.length)return resp(deeper?'Gempa dengan kedalaman tercatat terbesar':'Gempa dengan kedalaman tercatat paling rendah',`Di dalam periode dan arsip EarthAlert yang tersedia${year?' tahun '+year:''}:`,{bullets:list.slice(0,3).map(e=>`${e.p}, ${cleanDate(e.t)} UTC; ${fnum(e.dep,1)} km; M ${fnum(e.m,2)}.`),note:'Nilai kedalaman yang sangat kecil atau nol perlu dibaca hati-hati karena berasal dari parameter katalog, bukan selalu kedalaman fisik pasti.',sources:idxSource('repo')});
   return null;
  }
  if(includesAny(n,'terbesar','magnitudo paling tinggi','magnitudo terbesar','gempa terkuat','paling kuat','kekuatan gempa maksimum')){
   const allLocations=includesAny(n,'termasuk filipina','luar indonesia','seluruh cakupan ekspor','seluruh arsip tanpa penyaringan');
   const row=getTop(allLocations?I.greatest_magnitude:I.greatest_magnitude_indonesia_label);
   if(row.length)return topEventsAnswer(row.slice(0,4),'Gempa bermagnitudo terbesar pada arsip',`periode 2016–2026 yang terunduh${year?' tahun '+year:''}`);
   return null;
  }
  if(/(berapa|jumlah|total|perbandingan|statistik)/.test(n)&&year&&!place){
   const threshold=magn===null?0:magn;
   const by=(I.history_counts||{})[String(threshold)]||{};
   if(by[year]!=null)return resp(`Rekaman gempa tahun ${year}`,`Terdapat ${fnum(by[year])} rekaman gempa ${threshold?'M≥'+fnum(threshold,1):'semua magnitudo'} untuk tahun ${year} pada arsip RepoGempa yang tersedia.`,{note:year===2026?'Data 2026 masih parsial sampai tanggal terakhir pengunduhan; tidak dapat dibandingkan begitu saja dengan tahun penuh.':'Angka adalah jumlah rekaman yang berhasil diekspor; kelengkapan katalog dapat berbeda antar-tahun.',sources:idxSource('repo')});
  }
  if(isHistoryQuery(q)&&(year||place||magn!==null))return null; // deep filtered search
  if(/(apa manfaat|berguna|fungsi|kegunaan|cara mitigasi|mitigasi bencana)/.test(n))return resp('Manfaat EarthAlert untuk pembelajaran mitigasi','EarthAlert membantu membaca karakteristik historis, melihat rekaman gempa dan dampak yang tercatat, serta mempelajari mitigasi sesuai jenis kejadian. Sistem ini bukan layanan peringatan dini.',{bullets:['Atlas ML: memahami pola M≥4 pada 333 heksagon.','Dampak Historis: menghubungkan analisis dengan kasus kerusakan nyata dari katalog BMKG.','Mitigasi Kontekstual: tindakan prioritas untuk rumah, sekolah, fasilitas umum, pesisir, dan lainnya.'],sources:idxSource('atlas','mitigation','impact')});
  const hits=retrieve(q,I);
  if(hits.length){return resp('Hasil pencarian data yang berkaitan',`Aku menemukan ${hits.length} catatan terdekat secara kata kunci. Berikut yang bisa diperiksa lebih lanjut:`,{bullets:hits.map(h=>`${h.title}${h.date?' ('+h.date+')':''} — ${h.body}`),note:'Ini adalah penelusuran dokumen berdasarkan kecocokan kata, bukan kesimpulan baru atau penilaian otomatis. Jika maksud pertanyaan lebih spesifik, tambahkan nama wilayah, tahun, atau indikator.',sources:[...new Map(hits.map(h=>[h.kind,{label:h.kind==='impact'?'Katalog dampak':h.kind==='tsunami'?'Katalog tsunami':h.kind==='news'?'Ulasan BMKG':'Atlas ML',url:h.url}])).values()]});}
  return resp('Belum ada jawaban yang cukup kuat di data','Aku belum menemukan catatan yang mendukung jawaban pasti untuk pertanyaan itu pada data EarthAlert yang tersedia. Aku tidak akan menebak.',{bullets:['Coba sertakan kata kunci lokasi, tahun, magnitudo, kedalaman, tsunami, dampak, atau K-Means.','Contoh: “Berapa gempa M≥5 di Banda tahun 2023?” atau “Kerusakan yang tercatat di Pidie Jaya?”'],note:'Tanya Earth menelusuri data lokal EarthAlert, bukan mesin AI generatif yang bisa menjawab seluruh pengetahuan di luar dataset.',sources:idxSource('repo','method')});
 }
 const historyCache=new Map();
 async function loadHistory(y){
  if(!historyCache.has(y))historyCache.set(y,fetch('data/history/'+y+'.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).catch(err=>{historyCache.delete(y);throw err}));
  return historyCache.get(y);
 }
 async function dynamicHistory(q,I,progress){
  const text=norm(q),yr=yearFrom(text),place=locationTerm(text),mag=readMag(q);
  const ys=yr?[yr]:Array.from({length:11},(_,i)=>2016+i);
  const arr=[];
  for(const y of ys){progress('Memeriksa arsip tahun '+y+'…');const rows=await loadHistory(y);for(const e of rows){if(!place||matchPlace(e,place)){if(mag===null||Number(e.m)>=mag)arr.push(e)}}}
  const descending=includesAny(text,'terbesar','terkuat','maksimum','paling besar','paling kuat','magnitudo tertinggi');
  const shallow=includesAny(text,'dangkal','terdangkal');
  const deep=includesAny(text,'terdalam','paling dalam');
  if(descending||shallow||deep){arr.sort((a,b)=>shallow?Number(a.dep)-Number(b.dep):deep?Number(b.dep)-Number(a.dep):Number(b.m)-Number(a.m));return arr.length?topEventsAnswer(arr.slice(0,5),'Kejadian yang cocok dengan filter',`data ${yr||'2016–2026'}${place?' berlabel lokasi '+place:''}`):resp('Tidak ada rekaman yang cocok','Aku tidak menemukan kejadian pada arsip sesuai filter pertanyaan.',{sources:idxSource('repo')});}
  let all=arr.length;
  if(!arr.length)return resp('Tidak ditemukan kejadian sesuai pencarian',`Tidak ada catatan yang cocok dengan filter${yr?' tahun '+yr:''}${place?' dan label '+place:''}${mag!==null?' M≥'+mag:''}. Ini tidak berarti tidak pernah ada gempa.`,{sources:idxSource('repo')});
  const magMax=arr.reduce((max,e)=>Math.max(max,Number(e.m)||0),0);
  arr.sort((a,b)=>String(b.t).localeCompare(String(a.t)));
  return resp('Hasil penyaringan katalog gempa',`Ditemukan ${fnum(all)} kejadian ${mag!==null?'M≥'+fnum(mag,1):'semua magnitudo'}${place?' dengan label wilayah terkait “'+place+'”':''} dalam arsip ${yr||'2016–2026'} yang tersedia. Magnitudo terbesar pada hasil ini adalah M ${fnum(magMax,2)}.`,{bullets:arr.slice(0,4).map(e=>`${cleanDate(e.t)} UTC · ${e.p} · M ${fnum(e.m,2)} · kedalaman ${fnum(e.dep,1)} km.`),note:'Pencarian lokasi mencocokkan nama pada label katalog BMKG, bukan batas administrasi wilayah. Karena itu, gempa dengan label umum seperti “Java” dapat mencakup wilayah luas.',sources:idxSource('repo')});
 }
 async function latestAnswer(){
  let j;
  try{const r=await fetch('data/bmkg_snapshot.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);j=await r.json();}catch(e){return resp('Snapshot gempa terkini belum bisa dibuka','Coba buka tab Gempa Terkini BMKG, pilih kategori, kemudian tekan Update. Jika akses langsung diblokir, fitur tersebut mencoba snapshot GitHub.',{status:'Perlu sumber terbaru',sources:idxSource('latest')});}
  const feeds=j.feeds||{};
  const raw=feeds.gempa_terbaru?.Infogempa?.gempa||feeds.gempa_dirasakan?.Infogempa?.gempa||null;
  const row=Array.isArray(raw)?raw[0]:raw;
  return resp('Gempa terkini dari snapshot BMKG',row?`Snapshot yang tersimpan bertanggal ${j.fetched_at_utc||'waktu tidak dicantumkan'}. Kejadian pada kategori gempa terbaru: ${row.Tanggal||''} ${row.Jam||''}, magnitudo ${row.Magnitude||'—'}, kedalaman ${row.Kedalaman||'—'}.`:'Snapshot tersedia tetapi kategori yang dipilih tidak memuat informasi gempa terbaru.',{bullets:row?[`Lokasi: ${row.Wilayah||'belum tersedia'}.`,`Potensi/dirasakan: ${row.Potensi||row.Dirasakan||'lihat informasi resmi BMKG'}.`]:[],note:'Ini adalah snapshot pada waktu pengambilan, bukan klaim live saat ini. Untuk informasi paling baru, buka tab Gempa Terkini BMKG dan tekan Update atau kunjungi BMKG resmi.',sources:[source.latest,{label:'Portal resmi BMKG',url:'https://www.bmkg.go.id/gempabumi'}]});
 }

 const typoDictionary={
  'brp':'berapa','brapa':'berapa','gmpa':'gempa','gempaah':'gempa','gampa':'gempa','gempaa':'gempa','gembpa':'gempa','gemp':'gempa','gempabumi':'gempa bumi',
  'tsunmi':'tsunami','tusnami':'tsunami','tsunamy':'tsunami','stunami':'tsunami','sunami':'tsunami',
  'magnitudo':'magnitudo','magnetudo':'magnitudo','magnitude':'magnitudo','magnitud':'magnitudo','magnitdo':'magnitudo',
  'kmeans':'k-means','kmean':'k-means','kmens':'k-means','k-meen':'k-means','kmeens':'k-means',
  'klastering':'klaster','cluster':'klaster','klasterr':'klaster','claster':'klaster','clustering':'klaster',
  'kedalman':'kedalaman','kedlaman':'kedalaman','dalamnya':'kedalaman',
  'sesear':'sesar','patahn':'patahan','ptahan':'patahan','geolgi':'geologi','geology':'geologi',
  'mitgasi':'mitigasi','mitgation':'mitigasi','mitgasii':'mitigasi','wilyah':'wilayah',
  'rawann':'rawan','kerwanan':'kerawanan','korbn':'korban','terbnyak':'terbanyak',
  'skrang':'sekarang','sekrang':'sekarang','terkni':'terkini','dimna':'dimana','gimana':'bagaimana',
  'brapa':'berapa','byk':'banyak','yg':'yang','dgn':'dengan','gak':'tidak','ga':'tidak'
 };
 const commonTerms=['gempa','tsunami','magnitudo','kedalaman','klaster','mitigasi','sesar','patahan','geologi','korban','terbesar','terkini','frekuensi','heksagon','riwayat','metodologi','rumah','kerusakan','bencana'];
 function editDistance(a,b){
  if(Math.abs(a.length-b.length)>2)return 9;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
   const row=[i];
   for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   prev=row;
  }
  return prev[b.length];
 }
 function repairQuestion(q){
  return String(q||'').replace(/\b[a-zA-Z]{2,}\b/g,w=>{
    const x=w.toLowerCase();
    if(typoDictionary[x])return typoDictionary[x];
    if(commonTerms.includes(x)||x.length<5||x.length>13)return w;
    const matches=commonTerms.filter(v=>Math.abs(v.length-x.length)<=2).map(v=>({v,d:editDistance(x,v)})).sort((a,b)=>a.d-b.d);
    if(matches.length&&matches[0].d<=1&&(matches.length===1||matches[1].d>matches[0].d))return matches[0].v;
    return w;
  }).trim();
 }
 const educational=[
  {keys:['apa itu sesar','apa itu patahan','sesar aktif','patahan aktif','geologi'],title:'Mengenal sesar aktif dan geologi',text:'Sesar merupakan rekahan batuan yang mengalami pergeseran. Sesar aktif adalah sesar yang mempunyai bukti aktivitas geologi. Peta sesar dan geologi pada Atlas ML merupakan bahan belajar dari sumber resmi, terpisah dari tiga indikator K-Means.',sources:['atlas','method']},
  {keys:['12 jenis','dua belas','ancaman bencana','jenis bencana'],title:'Dua belas jenis ancaman bencana',text:'Menurut pengelompokan pada Rencana Nasional Penanggulangan Bencana BNPB: gempa bumi, tsunami, letusan gunung api, tanah longsor, banjir, banjir bandang, kekeringan, cuaca ekstrem, gelombang ekstrem dan abrasi, kebakaran hutan/lahan, epidemi/wabah penyakit, dan gagal teknologi.',sources:['mitigation']},
  {keys:['perbedaan gempa dan tsunami','beda gempa dan tsunami','gempa vs tsunami','bedanya gempa tsunami'],title:'Perbedaan gempa dan tsunami',text:'Gempa bumi merupakan getaran tanah akibat pelepasan energi, sedangkan tsunami adalah rangkaian gelombang laut akibat perpindahan massa air. Tidak semua gempa memicu tsunami, dan tsunami juga dapat dipicu longsoran atau aktivitas gunung api. Lihat peristiwa historis di Dampak Gempa.',sources:['impact','tsunami','mitigation']},
 {keys:['apa itu tsunami','penyebab tsunami','tsunami bisa','mengapa tsunami','kenapa tsunami','tsunami itu','tsunami terjadi','beda gempa tsunami'],title:'Mengapa tsunami dapat terjadi?',text:'Tsunami adalah serangkaian gelombang laut akibat perpindahan massa air secara tiba-tiba; dapat dipicu oleh gempa bawah laut, aktivitas gunung api, atau longsoran. Tab Dampak Gempa mencatat kejadian historis dan membedakan pemicu tektonik dan vulkanik.',sources:['tsunami','mitigation']},
  {keys:['apa itu gempa','gempa bumi adalah','kenapa ada gempa','penyebab gempa'],title:'Memahami gempa bumi',text:'Gempa bumi adalah getaran akibat pelepasan energi secara tiba-tiba di dalam bumi, salah satunya karena pergeseran batuan pada sesar atau pertemuan lempeng. Parameter utama yang dipelajari EarthAlert ialah magnitudo, kedalaman, dan frekuensi.',sources:['atlas','method']},
  {keys:['kalau gempa','saat gempa','harus ngapain','apa yang dilakukan','cara selamat','apa yang harus dilakukan','tips gempa','cara mitigasi'],title:'Tindakan saat gempa',text:'Saat guncangan, lindungi kepala dan leher, berlindung di bawah meja kokoh jika aman, serta jauhi kaca dan benda yang mudah jatuh. Setelah berhenti, periksa keselamatan dan evakuasi secara tertib melalui jalur aman. Di kawasan pesisir, gempa kuat atau lama merupakan tanda alam untuk segera menuju tempat lebih tinggi.',sources:['mitigation','latest']},
  {keys:['cara kerja k-means','kenapa k-means','apa itu k-means','algoritma k-means','k-means itu apa','k-means apa','jelasin k-means','fungsi k-means'],title:'Cara kerja K-Means dalam EarthAlert',text:'K-Means mengelompokkan 333 heksagon berdasarkan kemiripan frekuensi gempa M≥4, magnitudo P90, dan median kedalaman. Empat klaster dipilih setelah mengevaluasi Silhouette, WCSS, Davies–Bouldin, ukuran kelompok, serta kestabilan. Ini bukan model prediksi gempa.',sources:['method','atlas']},
  {keys:['apa itu p90','arti p90','persentil 90','median kedalaman'],title:'Arti P90 dan median',text:'P90 magnitudo adalah nilai magnitudo persentil ke-90 pada setiap heksagon; sekitar 90% kejadian memiliki magnitudo tidak lebih besar dari nilai tersebut. Median kedalaman adalah nilai tengah kedalaman gempa di wilayah analisis, bukan kedalaman seluruh wilayah.',sources:['method']},
  {keys:['apakah aman','rumah aman','paling aman','wilayah aman','bahaya apa','rawan tidak'],title:'EarthAlert tidak menentukan suatu lokasi aman atau tidak',text:'Warna klaster hanya menggambarkan kemiripan data historis. Menilai risiko memerlukan informasi bahaya, kerentanan, dan kapasitas yang tidak dihitung oleh K-Means EarthAlert. Gunakan informasi resmi BMKG/BPBD untuk keputusan keselamatan.',sources:['atlas','method','mitigation']}
 ];
 function educationalAnswer(q){
  const n=norm(q);
  for(const row of educational){if(row.keys.some(k=>n.includes(norm(k))))return resp(row.title,row.text,{sources:idxSource(...row.sources),status:'Penjelasan berdasarkan sumber'});}
  if(/\b(kamu|aku|saya|namaku|nama saya|umurku|tinggal|alamat|cinta|lelucon|joke)\b/.test(n))return resp('Aku membantu membaca data EarthAlert','Aku tidak memiliki data identitas, alamat, atau kondisi pribadi pengguna. Aku bisa membantu pertanyaan gempa, katalog BMKG, sesar, K-Means, tsunami, dan wawasan mitigasi.',{sources:idxSource('atlas','method')});
  return null;
 }

 async function answer(q,I,progress=()=>{}){
  if(!I)throw Error('Indeks Tanya Earth belum tersedia');
  const s=repairQuestion(q);if(!s)return resp('Tulis pertanyaan dahulu','Contohnya: “Lokasi mana paling sering gempa?”');
  const lesson=educationalAnswer(s);
  if(lesson)return lesson;
  const quick=queryIndex(s,I);
  if(quick)return quick;
  const t=norm(s);
  if(includesAny(t,'terkini','terbaru','hari ini','baru saja','gempa sekarang','real time','realtime','update bmkg'))return latestAnswer();
  if(isHistoryQuery(s)||locationTerm(s)||readMag(s)!==null||includesAny(t,'terbesar','terdalam','terdangkal','paling sering','seberapa sering','gempa di ','gempa tahun','gempa pada'))return dynamicHistory(s,I,progress);
  const docs=retrieve(s,I);
  if(docs.length)return resp('Informasi terkait yang ditemukan','Pertanyaanmu belum cocok dengan satu jawaban pasti, tetapi ditemukan beberapa catatan yang relevan dalam katalog. Coba sebutkan lokasi, tahun, atau peristiwa untuk hasil lebih tepat.',{bullets:docs.slice(0,3).map(d=>d.title+' — '+String(d.body||'').slice(0,150)),sources:docs.slice(0,3).map(d=>({label:d.title,url:d.url}))});
  return resp('Informasi belum tersedia untuk pertanyaan itu','Aku belum menemukan bukti yang cocok dalam data EarthAlert. Coba tulis lokasi, tahun, magnitudo, nama klaster, kejadian tsunami, atau topik mitigasi. Aku tidak akan menebak fakta yang tidak tersedia.',{status:'Belum ditemukan',sources:idxSource('atlas','method')});
 }
 function render(result){
  const rootEl=doc.getElementById('earth-answer');
  rootEl.replaceChildren();rootEl.hidden=false;
  const top=doc.createElement('div');top.className='earth-answer-header';
  const ttl=doc.createElement('strong');ttl.textContent=result.title;
  const state=doc.createElement('span');state.className='earth-answer-state';state.textContent=result.status;
  top.append(ttl,state);rootEl.append(top);
  const p=doc.createElement('p');p.textContent=result.body;rootEl.append(p);
  if(result.bullets?.length){const ul=doc.createElement('ul');result.bullets.forEach(t=>{const li=doc.createElement('li');li.textContent=t;ul.append(li)});rootEl.append(ul)}
  if(result.note){const note=doc.createElement('p');note.className='earth-answer-note';note.textContent=result.note;rootEl.append(note)}
  if(result.sources?.length){const sources=doc.createElement('div');sources.className='earth-answer-sources';const label=doc.createElement('span');label.textContent='Sumber: ';sources.append(label);result.sources.forEach(x=>{if(!x?.url)return;const a=doc.createElement('a');a.href=x.url;if(x.url.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}a.textContent=x.label;sources.append(a)});rootEl.append(sources)}
 }
 async function init(){
  const form=doc.getElementById('earth-form');if(!form)return;
  const input=doc.getElementById('earth-question'),status=doc.getElementById('earth-status'),submit=doc.getElementById('earth-submit');
  const sugg=doc.getElementById('earth-suggestions');
  const indexPromise=fetch('data/tanya_earth_index.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()});
  const suggestions=qaQuestions.slice(0,6);
  for(const q of suggestions){const b=doc.createElement('button');b.type='button';b.className='earth-suggestion';b.textContent=q;b.addEventListener('click',()=>{input.value=q;form.requestSubmit();});sugg.append(b)}
  let busy=false;
  form.addEventListener('submit',async ev=>{
   ev.preventDefault();if(busy)return;
   const question=input.value.trim();if(!question){input.focus();return}
   busy=true;submit.disabled=true;submit.textContent='Mencari…';status.textContent='Membaca data EarthAlert…';
   try{const idx=await indexPromise;const ans=await answer(question,idx,s=>{status.textContent=s});render(ans);status.textContent='Jawaban disusun dari data sumber yang tersedia.'}
   catch(err){render(resp('Data belum berhasil dibaca','Permintaan tidak dapat diselesaikan karena berkas sumber gagal dibuka. Coba refresh halaman dan periksa koneksi.',{status:'Data tidak tersedia',sources:idxSource('repo')}));status.textContent='Gagal membuka data: '+err.message}
   finally{busy=false;submit.disabled=false;submit.textContent='Tanya Earth →'}
  });
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={answer,queryIndex,retrieve,locationTerm,readMag,deaths,qaQuestions,matchPlace};
 if(doc){if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init);else init()}
})(typeof window!=='undefined'?window:globalThis);
