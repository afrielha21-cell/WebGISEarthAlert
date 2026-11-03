/* EarthAlert Atlas Earth: compact layer controls + Atlas-only floating assistant. */
(function(){
 'use strict';
 function ready(){
  const atlas=document.getElementById('page-atlas');
  const mapPanel=atlas?.querySelector('.map-panel');
  if(!atlas||!mapPanel)return;
  document.querySelectorAll('[data-nav="atlas"]').forEach(n=>n.textContent='Atlas Earth');
  const eyebrow=atlas.querySelector('.page-head .eyebrow');
  if(eyebrow)eyebrow.textContent='ATLAS EARTH / ANALISIS BMKG 2016—2025';
  const compare=atlas.querySelector('.region-compare');
  const news=document.getElementById('atlas-news');
  const earth=document.getElementById('tanya-earth');
  if(news && earth)earth.before(news);
  // Move the original layer inputs, without cloning or changing their IDs,
  // so their existing Leaflet listeners keep working.
  const row=mapPanel.querySelector('.tool-row.second');
  const geo=mapPanel.querySelector('.geo-controls');
  const tect=mapPanel.querySelector('.tectonic-extra');
  const frame=mapPanel.querySelector('.map-frame');
  if(frame&&(row||geo||tect)){
   const details=document.createElement('details');
   details.className='atlas-layer-center';
   details.open=true;
   const summary=document.createElement('summary');
   summary.textContent='Pengaturan lapisan, klaster & transparansi';
   details.append(summary);
   const body=document.createElement('div');
   body.className='atlas-layer-body';
   [row,geo,tect].forEach(e=>{if(e)body.append(e)});
   details.append(body);
   frame.before(details);
  }
  if(!earth)return;
  const launcher=document.createElement('button');
  launcher.type='button'; launcher.className='earth-launcher';
  launcher.id='earth-launcher';launcher.setAttribute('aria-controls','tanya-earth');
  launcher.setAttribute('aria-expanded','false');
  launcher.innerHTML='<span aria-hidden="true">✦</span><span>Tanya Earth</span>';
  const close=document.createElement('button');
  close.type='button';close.className='earth-close';close.setAttribute('aria-label','Tutup Tanya Earth');
  close.textContent='×';
  earth.querySelector('.earth-panel-head')?.append(close);
  earth.classList.add('earth-popover');earth.hidden=true;
  document.body.append(earth);document.body.append(launcher);
  function setOpen(value){
   const allowed=atlas.classList.contains('active')&&!atlas.hidden;
   earth.hidden=!value||!allowed;
   launcher.setAttribute('aria-expanded',String(value&&allowed));
   if(value&&allowed)earth.querySelector('#earth-question')?.focus();
  }
  launcher.addEventListener('click',()=>setOpen(earth.hidden));
  close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
  const sync=()=>{
   const show=atlas.classList.contains('active')&&!atlas.hidden;
   launcher.hidden=!show;if(!show)setOpen(false);
  };
  new MutationObserver(sync).observe(atlas,{attributes:true,attributeFilter:['class','hidden','style']});
  document.querySelectorAll('[data-nav]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(sync,0)));
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
