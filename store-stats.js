(()=>{
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const currentStore=()=>{const api=window.PanParagonStoreDetails,name=api&&typeof api.getCurrentStore==='function'?api.getCurrentStore():'';if(name)return name;return (document.getElementById('storeDetailTitle')?.textContent||'').replace(/\s—\s\d{4}$/,'').trim()};
  const currentYear=()=>document.getElementById('storeDetailYear')?.value||'';
  const filteredRows=()=>{const name=currentStore(),year=currentYear();if(!name||!Array.isArray(rows))return[];return rows.filter(r=>{if(storeName(r)!==name)return false;const d=rowDate(r);return d&&(!year||String(d.getFullYear())===String(year))})};
  const monthData=()=>{const m={};filteredRows().forEach(r=>{const d=rowDate(r);if(!d)return;const k=mk(d);m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0]))};
  const ensure=()=>{
    const detail=document.getElementById('storeDetail');if(!detail)return null;
    let grid=document.getElementById('storeExtraStats');
    if(!grid){
      grid=document.createElement('div');grid.id='storeExtraStats';grid.className='grid';grid.style.marginTop='14px';
      grid.innerHTML='<div class="card"><div class="lab">Średnia miesięczna</div><div class="val" id="storeAvgMonth">0</div><div class="small" id="storeAvgMonthText">paragonów / aktywny miesiąc</div></div><div class="card"><div class="lab">Najsłabszy miesiąc</div><div class="val" style="font-size:20px" id="storeWeakMonth">—</div><div class="small" id="storeWeakMonthCount">Brak danych</div></div><div class="card"><div class="lab">Aktywne miesiące</div><div class="val" id="storeActiveMonthsStat">0</div><div class="small" id="storeActiveMonthsText">miesięcy z paragonami</div></div>';
      const grids=detail.querySelectorAll(':scope > .grid');
      if(grids.length>1)grids[1].insertAdjacentElement('afterend',grid);else if(grids.length)grids[0].insertAdjacentElement('afterend',grid);else detail.prepend(grid);
    }
    return grid;
  };
  const render=()=>{
    const detail=document.getElementById('storeDetail');if(!detail||!detail.classList.contains('on'))return;
    ensure();const entries=monthData(),active=entries.length,total=entries.reduce((s,[,n])=>s+n,0),avg=active?total/active:0,weak=entries.length?[...entries].sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]))[0]:null,year=currentYear();
    const avgEl=document.getElementById('storeAvgMonth'),weakEl=document.getElementById('storeWeakMonth'),weakCount=document.getElementById('storeWeakMonthCount'),activeEl=document.getElementById('storeActiveMonthsStat'),activeText=document.getElementById('storeActiveMonthsText'),avgText=document.getElementById('storeAvgMonthText');
    if(avgEl)avgEl.textContent=active?(Math.round(avg*10)/10).toLocaleString('pl-PL'):'0';
    if(avgText)avgText.textContent=year?`paragonów / aktywny miesiąc · ${year}`:'paragonów / aktywny miesiąc · wszystkie lata';
    if(weakEl)weakEl.textContent=weak?ml(weak[0]):'—';
    if(weakCount)weakCount.textContent=weak?`${weak[1]} paragonów`:'Brak danych';
    if(activeEl)activeEl.textContent=active;
    if(activeText)activeText.textContent=year?`miesięcy z paragonami · ${year}`:'miesięcy z paragonami · wszystkie lata';
  };
  const install=()=>{
    ensure();render();
    document.addEventListener('change',e=>{if(e.target?.id==='storeDetailYear')setTimeout(render,0)},true);
    const detail=document.getElementById('storeDetail');if(detail)new MutationObserver(()=>setTimeout(render,0)).observe(detail,{attributes:true,attributeFilter:['class']});
    const title=document.getElementById('storeDetailTitle');if(title)new MutationObserver(()=>setTimeout(render,0)).observe(title,{childList:true,characterData:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
