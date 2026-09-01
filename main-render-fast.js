(()=>{
  if(typeof window.render!=='function')return;
  const original=window.render;
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const dcache=()=>window.PanParagonDateCache;
  const getDate=r=>{const c=dcache();return c&&typeof c.get==='function'?c.get(r):rowDate(r)};
  const fastRender=(save=true)=>{
    try{
      dateCol=$('dc').value||dateCol;storeCol=$('stc').value||storeCol;
      const selected=$('month').value,months={},years={},allStores={},selectedStores={};let undated=0,filteredCount=0;
      for(const r of rows){
        const d=getDate(r),k=mk(d),s=storeName(r);
        allStores[s]=(allStores[s]||0)+1;
        if(k){months[k]=(months[k]||0)+1;const y=String(d.getFullYear());years[y]=(years[y]||0)+1}else undated++;
        if(!selected||k===selected){filteredCount++;selectedStores[s]=(selectedStores[s]||0)+1}
      }
      const rank=Object.entries(selectedStores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl')),
            me=Object.entries(months).sort((a,b)=>b[0].localeCompare(a[0])),
            yearEntries=Object.entries(years).sort((a,b)=>b[0].localeCompare(a[0])),
            ae=Object.entries(allStores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'));
      $('rc').textContent=filteredCount;$('sc').textContent=rank.length;$('mc').textContent=me.length;$('top').textContent=rank[0]?.[0]||'—';$('topm').textContent=rank[0]?`${rank[0][1]} paragonów`:'Brak danych';
      $('rank').innerHTML=rank.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony</th></tr>${rank.map(([s,n],i)=>`<tr><td>${i+1}</td><td>${esc(s)}</td><td><b>${n}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak danych.</div>';
      $('yearly').innerHTML=yearEntries.length?yearEntries.map(([y,n])=>{const prev=years[String(+y-1)];let delta='Brak danych za poprzedni rok';if(prev){const pct=(n-prev)/prev*100;delta=`${pct>=0?'+':''}${pct.toFixed(1)}% vs ${+y-1}`}return `<div class="year-card"><div class="lab">${y}</div><div class="year-value">${n}</div><div class="small">paragonów</div><div class="delta">${delta}</div></div>`}).join(''):'<div class="empty">Brak danych.</div>';
      const max=Math.max(1,...me.map(x=>x[1]));let lastYear='';$('hist').className='months-scroll'+(me.length?'':' empty');$('hist').innerHTML=me.length?me.map(([k,n])=>{const y=k.slice(0,4),head=y!==lastYear?`<div class="year-head">${y}</div>`:'';lastYear=y;return `${head}<div style="margin:12px 0"><div style="display:flex;justify-content:space-between"><span>${monthName(k)}</span><b>${n}</b></div><div class="bar"><i style="width:${Math.max(5,n/max*100)}%"></i></div></div>`}).join(''):'Brak danych.';
      let rh='',ty='';for(const[k,n]of me){const y=k.slice(0,4);if(y!==ty){rh+=`<tr><td colspan="2" style="font-size:17px;font-weight:800;padding-top:18px">${y}</td></tr>`;ty=y}rh+=`<tr><td>${monthName(k)}</td><td><b>${n}</b></td></tr>`}if(undated)rh+=`<tr><td>Nie rozpoznano daty</td><td><b>${undated}</b></td></tr>`;
      $('monthsTable').innerHTML=me.length||undated?`<table><tr><th>Miesiąc</th><th>Paragony</th></tr>${rh}</table>`:'<div class="empty">Brak danych.</div>';
      $('storesTable').innerHTML=ae.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony</th></tr>${ae.map(([s,n],i)=>`<tr><td>${i+1}</td><td>${esc(s)}</td><td><b>${n}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak danych.</div>';
      const byYear={};for(const[k]of me){const y=k.slice(0,4);(byYear[y]??=[]).push(k)}$('month').innerHTML='<option value="">Wszystkie miesiące</option>'+Object.keys(byYear).sort((a,b)=>b.localeCompare(a)).map(y=>`<optgroup label="${y}">${byYear[y].map(k=>`<option value="${k}">${monthName(k)}</option>`).join('')}</optgroup>`).join('');$('month').value=selected&&months[selected]?selected:'';
      if(save&&db)persistRows().catch(()=>{});updateMode();updateSyncCounters();document.dispatchEvent(new CustomEvent('panparagon:data-changed'));
    }catch(e){console.warn('Fast render fallback',e);return original(save)}
  };
  window.render=fastRender;
})();