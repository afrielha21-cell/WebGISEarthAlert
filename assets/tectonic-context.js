/* EarthAlert V26: tectonic context & integrated zone interpretation.
  Data sources: USGS/Esri plate boundary features; BNPB InaRISK megathrust polygons;
  BIG volcano points; Esri Ocean Relief. Context overlays do NOT affect K-Means.
*/
(function(){
'use strict';
const PLATES='https://services.arcgis.com/ue9rwulIoeLEI9bj/arcgis/rest/services/Tectonic_Plate_Boundaries/FeatureServer/0/query';
const MEGA='https://gis.bnpb.go.id/server/rest/services/inarisk/Faults/MapServer/0/query';
const VOLC='https://geoservices.big.go.id/gis/rest/services/PTRA/Atlas_250K_GunungApi/MapServer/7/query';
const FAULT='https://gis.bnpb.go.id/server/rest/services/inarisk/Faults_new/MapServer/0/query';
const GEOLOGY='https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/8/query';
const OCEAN='https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';
const ctx={plates:null,mega:null,volcano:null,errors:{},ready:false,selected:null,faults:{},geology:{},contextLoading:{}};
const pmap={plates:null,mega:null,volcano:null,relief:null};
const id=x=>document.getElementById(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtNum=(v,d=0)=>Number(v).toLocaleString('id-ID',{maximumFractionDigits:d,minimumFractionDigits:d});
const km=(a,b,c,d)=>{const ra=Math.PI/180,p1=a*ra,p2=c*ra,dp=(c-a)*ra,dl=(d-b)*ra,h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(h)))};
function distLine(lat,lon,path){
 let best=Infinity;
 for(let i=1;i<path.length;i++){
  const p=path[i-1],q=path[i],u=Math.cos(lat*Math.PI/180)*111.2;
  const ax=(p[0]-lon)*u,ay=(p[1]-lat)*111.2,bx=(q[0]-lon)*u,by=(q[1]-lat)*111.2;
  const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/Math.max(1e-12,dx*dx+dy*dy)));
  best=Math.min(best,Math.hypot(ax+t*dx,ay+t*dy));
 }
 return best;
}
function pathsOf(g){
 if(!g)return[];
 if(g.type==='LineString')return [g.coordinates];
 if(g.type==='MultiLineString')return g.coordinates;
 if(g.type==='Polygon')return g.coordinates;
 if(g.type==='MultiPolygon')return g.coordinates.flat();
 return [];
}
function inRing(lat,lon,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const p=ring[i],q=ring[j];if(((p[1]>lat)!=(q[1]>lat))&&(lon<(q[0]-p[0])*(lat-p[1])/(q[1]-p[1]+1e-16)+p[0]))inside=!inside;}return inside;}
function insideGeo(lat,lon,geometry){
 if(!geometry)return false;
 const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
 return polys.some(poly=>poly.length&&inRing(lat,lon,poly[0])&&!poly.slice(1).some(hole=>inRing(lat,lon,hole)));
}
async function geoFetch(url,params){
 const u=new URL(url);for(const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));
 const response=await fetch(u.toString(),{mode:'cors'});
 if(!response.ok)throw Error('HTTP '+response.status);
 const js=await response.json();
 if(js.error)throw Error(js.error.message||'ArcGIS query gagal');
 if(!Array.isArray(js.features))throw Error('Format spasial tidak dikenali');
 return js;
}
const bbox={geometry:'90,-15,145,12',geometryType:'esriGeometryEnvelope',spatialRel:'esriSpatialRelIntersects',inSR:4326,outSR:4326,returnGeometry:true,f:'geojson'};
async function loadData(){
 const configs=[
 ['plates',PLATES,{...bbox,where:'1=1',outFields:'TYPE'}],
 ['mega',MEGA,{...bbox,where:'1=1',outFields:'Name'}],
 ['volcano',VOLC,{...bbox,where:'1=1',outFields:'NAMA_OBJEK,TIPE,KETINGGIAN'}]
 ];
 await Promise.all(configs.map(async ([key,url,params])=>{try{
  ctx[key]=await geoFetch(url,params);
  if(key==='volcano')ctx[key].features=ctx[key].features.filter(f=>/\btipe\s*a\b/i.test(String(f.properties?.TIPE||'')));
  if(key==='plates'&&ctx[key].features.length>=999)ctx.errors[key]='Sumber mungkin mengembalikan hasil terbatas; gunakan untuk konteks regional.';
 }catch(err){ctx.errors[key]=err.message;ctx[key]=null;}}));
 ctx.ready=true;drawLayers();if(ctx.selected)renderIntegrated(ctx.selected);
}
function layerValue(key){return !!id('tect-'+key)?.checked;}
function drawLayers(){
 if(typeof atlasMap==='undefined'||!atlasMap||typeof L==='undefined')return;
 for(const key of ['plates','mega','volcano','relief'])if(pmap[key]){atlasMap.removeLayer(pmap[key]);pmap[key]=null;}
 if(layerValue('plates')&&ctx.plates){
  pmap.plates=L.geoJSON(ctx.plates,{style:f=>({color:String(f.properties?.TYPE||'').toLowerCase().includes('converg')?'#e25148':'#8b4ec9',weight:2.6,opacity:.9,dashArray:'7 4',interactive:false}),onEachFeature:(f,l)=>l.bindPopup('<strong>Batas lempeng tektonik</strong><p>Jenis: '+esc(f.properties?.TYPE||'belum diklasifikasi')+'</p><small>Sumber: USGS / Esri (peta regional)</small>')}).addTo(atlasMap);
 }
 if(layerValue('mega')&&ctx.mega){
  pmap.mega=L.geoJSON(ctx.mega,{style:{color:'#ff9365',weight:1.6,fillColor:'#fdb18b',fillOpacity:.18,dashArray:'4 4',interactive:false},onEachFeature:(f,l)=>l.bindPopup('<strong>Zona megathrust terpetakan</strong><p>'+esc(f.properties?.Name||'Referensi BNPB')+'</p><small>InaRISK / BNPB</small>')}).addTo(atlasMap);
 }
 if(layerValue('volcano')&&ctx.volcano){
  pmap.volcano=L.geoJSON(ctx.volcano,{pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:5,color:'#a94425',weight:1.4,fillColor:'#ff8d4a',fillOpacity:.89}),onEachFeature:(f,l)=>l.bindPopup('<strong>'+esc(f.properties?.NAMA_OBJEK||'Gunung api')+'</strong><p>'+esc(f.properties?.TIPE||'')+'</p><small>Sumber: Atlas Gunung Api BIG; bukan status aktivitas langsung</small>')}).addTo(atlasMap);
 }
 if(layerValue('relief')&&state.basemap==='satellite'){
  pmap.relief=L.tileLayer(OCEAN,{opacity:.83,maxNativeZoom:13,maxZoom:19,attribution:'Ocean Relief © Esri, GEBCO, NOAA'}).addTo(atlasMap);
 }
 const on= ['plates','mega','volcano'].filter(layerValue);
 const missing=on.filter(k=>!ctx[k]);
 const msg=!ctx.ready?'Menghubungkan sumber spasial resmi…':missing.length?'Sebagian sumber belum dapat dimuat: '+missing.join(', ')+'. Statistik BMKG tetap tersedia.':on.length?'Lapisan tektonik aktif · '+on.length+' sumber terbaca.':'Aktifkan lapisan untuk mengeksplorasi konteks tektonik.';
 if(id('tect-status'))id('tect-status').textContent=msg+(layerValue('relief')&&state.basemap==='ocean'?' Relief dasar laut sudah tampak pada Ocean Relief.':'');
}
function nearest(featureCollection,lat,lon){
 if(!featureCollection?.features?.length)return null;
 let best=null;
 for(const f of featureCollection.features){
  const paths=pathsOf(f.geometry);
  const distance=paths.reduce((d,p)=>Math.min(d,distLine(lat,lon,p)),Infinity);
  if(Number.isFinite(distance)&&(!best||distance<best.km))best={f,km:distance};
 }
 return best;
}
function spatialFor(g){
 const lat=Number(g.lat),lon=Number(g.lon),res={plate:null,mega:null,volcano:null};
 if(ctx.plates)res.plate=nearest(ctx.plates,lat,lon);
 if(ctx.mega){
  const inside=ctx.mega.features.filter(f=>insideGeo(lat,lon,f.geometry));
  res.mega=inside.length?{f:inside[0],within:true,km:0}:nearest(ctx.mega,lat,lon);
 }
 if(ctx.volcano?.features?.length){
  const arr=ctx.volcano.features.filter(f=>f.geometry?.type==='Point').map(f=>({f,km:km(lat,lon,f.geometry.coordinates[1],f.geometry.coordinates[0])})).sort((a,b)=>a.km-b.km);
  res.volcano=arr[0]||null;
 }
 return res;
}
async function enrichLocal(g){
 if(ctx.contextLoading[g.id])return;
 ctx.contextLoading[g.id]=true;
 const lat=Number(g.lat),lon=Number(g.lon);
 const b=[lon-1.5,lat-1.5,lon+1.5,lat+1.5].join(',');
 const requests=[
  (async()=>{try{const geof=await geoFetch(FAULT,{...bbox,geometry:b,outFields:'namobj,klspthn,geologi',where:'1=1'});ctx.faults[g.id]=nearest(geof,lat,lon);}catch(e){ctx.faults[g.id]=null;}})(),
  (async()=>{try{
   const params=new URLSearchParams({where:'1=1',geometry:lon+','+lat,geometryType:'esriGeometryPoint',spatialRel:'esriSpatialRelIntersects',inSR:'4326',outFields:'namobj,umurobj,remark',returnGeometry:'false',f:'json'});
   const response=await fetch(GEOLOGY+'?'+params.toString(),{mode:'cors'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const result=await response.json();
   if(result.error)throw Error(result.error.message||'Layanan geologi gagal');
   ctx.geology[g.id]=result.features?.[0]?.attributes||null;
  }catch(e){ctx.geology[g.id]=null;}})()
 ];
 await Promise.all(requests);
 ctx.contextLoading[g.id]=false;
 if(ctx.selected?.id===g.id)renderIntegrated(g);
}
function historyFor(g){
 if(!DS.cases?.length)return null;
 const lat=Number(g.lat),lon=Number(g.lon);
 return DS.cases.map(c=>({c,km:km(lat,lon,Number(c.lat),Number(c.lon))})).sort((a,b)=>a.km-b.km)[0]||null;
}
const clusterName={A:'kedalaman gempa relatif lebih dangkal',B:'magnitudo P90 relatif lebih tinggi',C:'kedalaman sumber gempa relatif lebih besar',D:'frekuensi kejadian relatif lebih tinggi'};
function interpretation(g){
 const sp=spatialFor(g),historical=historyFor(g),s=[];
 const annual=Number(g.annual),freq=Number(g.n),p90=Number(g.m),depth=Number(g.depth);
 s.push('Selama 2016–2025, zona ini memiliki <strong>'+fmtNum(freq)+' gempa M≥4</strong>, sekitar <strong>'+fmtNum(annual,1)+' kejadian per tahun</strong>. Nilai P90 magnitudonya <strong>M'+fmtNum(p90,2)+'</strong>, dengan median kedalaman <strong>'+fmtNum(depth,1)+' km</strong>. Ketiganya membentuk profil <strong>Klaster '+esc(g.c)+'</strong>, yang dicirikan oleh '+(clusterName[g.c]||'kemiripan statistik antarwilayah')+'.');
 if(sp.plate){
  const typ=String(sp.plate.f.properties?.TYPE||'').trim();s.push('Peta batas lempeng regional menunjukkan jalur lempeng terpetakan sekitar <strong>'+fmtNum(sp.plate.km,0)+' km</strong> dari titik pusat heksagon'+(typ?', dengan tipe <strong>'+esc(typ)+'</strong>':'')+'. Informasi ini membantu memperlihatkan konteks tektonik wilayah di sekitar zona.');
 }else if(!ctx.plates)s.push('Informasi batas lempeng belum tersedia dari layanan spasial saat ini. Statistik gempa pada zona tetap dapat dibaca.');
 const fault=ctx.faults[g.id];
 if(fault&&fault.km<=185){
   const name=fault.f.properties?.namobj||'patahan regional';
   const cls=fault.f.properties?.klspthn||'';
   s.push('Pada peta patahan PVMBG/InaRISK, <strong>'+esc(name)+'</strong> merupakan garis patahan terpetakan di sekitar '+fmtNum(fault.km,0)+' km dari pusat zona'+(cls?' dengan kategori '+esc(cls):'')+'. Perbandingan ini memberi konteks lokasi struktur geologi setempat.');
 }
 const geology=ctx.geology[g.id];
 if(geology&&(geology.namobj||geology.umurobj)){
  s.push('Peta geologi BIG pada <strong>titik pusat heksagon</strong> mengidentifikasi '+(geology.namobj?'<strong>'+esc(geology.namobj)+'</strong>':'satuan batuan terpetakan')+(geology.umurobj?' dengan umur geologi '+esc(geology.umurobj):'')+'. Informasi ini menggambarkan latar batuan permukaan yang melengkapi pembacaan kegempaan.');
 }
 if(sp.mega){
  s.push(sp.mega.within?'Titik pusat heksagon berada pada <strong>zona megathrust yang terpetakan</strong> pada lapisan InaRISK.':'Lapisan InaRISK menunjukkan batas zona megathrust terdekat sekitar <strong>'+fmtNum(sp.mega.km,0)+' km</strong> dari titik pusat heksagon.');
 }
 if(sp.volcano){
  const label=String(sp.volcano.f.properties?.NAMA_OBJEK||'gunung api yang terpetakan');s.push('Dalam atlas gunung api BIG, <strong>'+esc(label)+'</strong> merupakan titik gunung api terpetakan terdekat dari pusat zona, sekitar <strong>'+fmtNum(sp.volcano.km,0)+' km</strong>. Ini membantu mengenali lanskap vulkanik regional yang melengkapi informasi tektonik.');
 }
 if(historical&&historical.km<=280){
  const c=historical.c;
  s.push('Sebagai pembanding historis, katalog BMKG memuat kejadian di <strong>'+esc(c.bmkg_place)+'</strong> pada '+esc(c.bmkg_date)+', sekitar '+fmtNum(historical.km,0)+' km dari pusat zona. Catatan katalog menyebut: '+esc(c.impact_summary)+'.');
 }
 return '<section class="integrated-summary" aria-label="Hasil analisis terpadu"><div class="integrated-heading"><span>INTERPRETASI TERPADU · EARTHALERT</span><h3>Membaca aktivitas dan kondisi wilayah</h3><p>Menghubungkan pola statistik BMKG dengan konteks tektonik, gunung api, dan kejadian historis.</p></div><div class="integrated-story">'+s.map(x=>'<p>'+x+'</p>').join('')+'</div><div class="integrated-sources">Sumber: RepoGempa dan katalog BMKG 2016–2025; '+(ctx.plates?'USGS/Esri batas lempeng; ':'')+(ctx.mega?'InaRISK/BNPB megathrust; ':'')+(ctx.volcano?'BIG atlas gunung api.':'')+' Jarak dihitung dari pusat heksagon terhadap fitur pada peta regional.</div></section>';
}
function renderIntegrated(g){
 ctx.selected=g;
 if(!Object.prototype.hasOwnProperty.call(ctx.faults,g.id)&&!ctx.contextLoading[g.id])enrichLocal(g);
 const container=id('atlasDetail');
 if(!container||!container.querySelector('.location-chip'))return;
 const old=container.querySelector('#integrated-result');
 if(old)old.remove();
 const node=document.createElement('div');node.id='integrated-result';node.innerHTML=interpretation(g);
 const actions=container.querySelector('.small-actions');
 if(actions)actions.before(node);else container.append(node);
}
function zoneLabel(g){
 const p=g.place_info;
 return (p?.title?String(p.title):('Zona '+g.id))+' · Klaster '+g.c+' · '+g.n+' kejadian';
}
function compareText(a,b){
 const nf=Number(a.n)-Number(b.n),dp=Number(a.depth)-Number(b.depth),mm=Number(a.m)-Number(b.m);
 const freq=nf===0?'Jumlah kejadian sama pada kedua zona.':(nf>0?'Zona A':'Zona B')+' mencatat '+fmtNum(Math.abs(nf))+' kejadian M≥4 lebih banyak dalam sepuluh tahun.';
 const mag=Math.abs(mm)<.005?'Kedua zona memiliki nilai P90 magnitudo yang hampir sama.':(mm>0?'Zona A':'Zona B')+' mempunyai P90 magnitudo sekitar '+fmtNum(Math.abs(mm),2)+' lebih tinggi.';
 const dep=Math.abs(dp)<.05?'Median kedalaman kedua zona hampir sama.':(dp>0?'Zona A':'Zona B')+' mempunyai median sumber gempa sekitar '+fmtNum(Math.abs(dp),1)+' km lebih dalam.';
 const tect=[['A',a],['B',b]].map(([label,g])=>{
   const z=spatialFor(g);
   return z.plate?'Zona '+label+' berada sekitar '+fmtNum(z.plate.km,0)+' km dari garis batas lempeng regional terdekat.':null;
 }).filter(Boolean);
 return '<p>'+freq+' '+mag+' '+dep+'</p>'+(tect.length?'<p>'+tect.join(' ')+'</p>':'')+'<p>Perbandingan ini menunjukkan perbedaan pola kejadian historis kedua zona dan dapat dipelajari bersama kondisi tektonik yang terpetakan.</p>';
}
function compare(){
 const a=DS.grids.find(g=>g.id===id('compare-a')?.value),b=DS.grids.find(g=>g.id===id('compare-b')?.value),out=id('compare-result');
 if(!out)return;
 if(!a||!b||a.id===b.id){out.innerHTML='<p class="muted">Pilih dua zona yang berbeda untuk membandingkan karakteristiknya.</p>';return;}
 const card=(g,name)=>'<div class="compare-zone"><span>'+name+' · '+esc(g.id)+'</span><h4>'+esc(zoneLabel(g))+'</h4><div class="compare-numbers"><div><small>GEMPA M≥4</small><b>'+fmtNum(g.n)+'</b></div><div><small>P90 MAGNITUDO</small><b>M '+fmtNum(g.m,2)+'</b></div><div><small>MEDIAN KEDALAMAN</small><b>'+fmtNum(g.depth,1)+' km</b></div><div><small>KLASTER</small><b>'+esc(g.c)+'</b></div></div></div>';
 out.innerHTML='<div class="compare-pair">'+card(a,'ZONA A')+card(b,'ZONA B')+'</div><div class="compare-interpret"><h4>Apa yang berbeda dari dua wilayah ini?</h4>'+compareText(a,b)+'</div>';
}
function initCompare(){
 const opts=DS.grids.map(g=>'<option value="'+esc(g.id)+'">'+esc(zoneLabel(g))+'</option>').join('');
 for(const k of ['compare-a','compare-b'])if(id(k))id(k).innerHTML='<option value="">Pilih zona analisis…</option>'+opts;
 id('compare-run')?.addEventListener('click',compare);
 id('compare-select-current')?.addEventListener('click',()=>{
  if(!ctx.selected)return;
  id('compare-a').value=ctx.selected.id;
  id('compare-feedback').textContent='Zona terakhir yang dipilih pada peta sudah dimasukkan sebagai Zona A.';
 });
 if(id('compare-feedback'))id('compare-feedback').textContent='Pilih dua zona pada menu. Kamu juga bisa memakai zona terakhir dari peta sebagai Zona A.';
}
function bootTectonics(){
 if(!Array.isArray(DS?.grids)||!DS.grids.length){setTimeout(bootTectonics,650);return;}
 initCompare();
 const initial=DS.grids.find(g=>g.c==='B'&&g.n>=30)||DS.grids[0];
 if(initial){ctx.selected=initial;renderIntegrated(initial);}
 for(const key of ['plates','mega','volcano','relief'])id('tect-'+key)?.addEventListener('change',drawLayers);
 const timer=setInterval(()=>{if(typeof atlasMap!=='undefined'&&atlasMap){clearInterval(timer);atlasMap.on('moveend',()=>{ /* GeoJSON features remain georeferenced */});drawLayers();}},450);
 setTimeout(()=>clearInterval(timer),24000);
 loadData();
}
const previousBasemap=window.setBasemap;
if(typeof previousBasemap==='function')window.setBasemap=function(){const out=previousBasemap();setTimeout(drawLayers,150);return out;};
const previousGrid=window.gridDetail;
window.gridDetail=function(g){ctx.selected=g;const v=previousGrid(g).replace(/<section class="zone-insights"[\s\S]*?<\/section>/,'');requestAnimationFrame(()=>{if(ctx.selected?.id===g.id)renderIntegrated(g);});return v;};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bootTectonics,950),{once:true});else setTimeout(bootTectonics,950);
if(typeof module!=='undefined'&&module.exports)module.exports={km,distLine,insideGeo,spatialFor,interpretation,compareText};
})();