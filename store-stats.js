(()=>{
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const currentStore=()=>{const api=window.PanParagonStoreDetails,name=api&&typeof api.getCurrentStore==='function'?api.getCurrentStore():'';if(name)return name;return (document.getElementById('storeDetailTitle')?.textContent||'').replace(/\s—\s\d{4}$/,'').trim()};
  const currentYear=()=>document.getElementById('storeDetailYear')?.value||'';
  const storeRowsAll=()=>{const name=currentStore();if(!name||!Array.isArray(rows))return[];return rows.filter(r=>storeName(r)===name&&rowDate(r))};
  const filteredRows=()=>{const year=currentYear();return storeRowsAll().filter(r=>{const d=rowDate(r);return d&&(!year||String(d.getFullYear())===String(year))})};
  const monthDataFrom=list=>{const m={};list.forEach(r=>{const d=rowDate(r);if(!d)return;const k=mk(d);m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0]))};
  const monthData=()=>monthDataFrom(filteredRows());
  const avgForYear=year=>{const entries=monthDataFrom(storeRowsAll().filter(r=>String(rowDate(r)?.getFullYear())===String(year))),active=entries.length,total=entries.reduce((s,[,n])=>s+n,0);return{avg:active?total/active:0,active,total}};
  const availableYears=()=>[...new Set(storeRowsAll().map(r=>rowDate(r)?.getFullYear()).filter(Boolean))].sort((a,b)=>b-a);
  const ensure=()=>{
    const detail=document.getElementById('storeDetail');if(!detail)return null;
    let grid=document.getElementById('storeExtraStats');
    if(!grid){
      grid=document.createElement('div');grid.id='storeExtraStats';grid.className='grid';grid.style.marginTop='14px';
      grid.innerHTML='<div class="card"><div class="lab">Średnia miesięczna</div><div class="val" id="storeAvgMonth">0</div><div class="small" id="storeAvgMonthText">paragonów / aktywny miesiąc</div></div><div class="card"><div class="lab">Najsłabszy miesiąc</div><div class="val" style="font-size:20px" id="storeWeakMonth">—</div><div class="small" id="storeWeakMonthCount">Brak danych</div></div><div class="card"><div class="lab">Aktywne miesiące</div><div class="val" id="storeActiveMonthsStat">0</div><div class="small" id="storeActiveMonthsText">miesięcy z paragonami</div></div><div class="card"><div class="lab">Średnia r/r</div><div class="val" style="font-size:20px" id="storeAvgYoY">—</div><div class="small" id="storeAvgYoYText">Brak danych porównawczych</div></div>';
      const grids=detail.querySelectorAll(':scope > .grid');
      if(grids.length>1)grids[1].insertAdjacentElement('afterend',grid);else if(grids.length)grids[0].insertAdjacentElement('afterend',grid);else detail.prepend(grid);
    }else if(!document.getElementById('storeAvgYoY')){
      grid.insertAdjacentHTML('beforeend','<div class="card"><div class="lab">Średnia r/r</div><div class="val" style="font-size:20px" id="storeAvgYoY">—</div><div class="small" id="storeAvgYoYText">Brak danych porównawczych</div></div>');
    }
    return grid;
  };
  const render=()=>{
    const detail=document.getElementById('storeDetail');if(!detail||!detail.classList.contains('on'))return;
    ensure();const entries=monthData(),active=entries.length,total=entries.reduce((s,[,n])=>s+n,0),avg=active?total/active:0,weak=entries.length?[...entries].sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]))[0]:null,year=currentYear();
    const avgEl=document.getElementById('storeAvgMonth'),weakEl=document.getElementById('storeWeakMonth'),weakCount=document.getElementById('storeWeakMonthCount'),activeEl=document.getElementById('storeActiveMonthsStat'),activeText=document.getElementById('storeActiveMonthsText'),avgText=document.getElementById('storeAvgMonthText'),yoyEl=document.getElementById('storeAvgYoY'),yoyText=document.getElementById('storeAvgYoYText');
    if(avgEl)avgEl.textContent=active?(Math.round(avg*10)/10).toLocaleString('pl-PL'):'0';
    if(avgText)avgText.textContent=year?`paragonów / aktywny miesiąc · ${year}`:'paragonów / aktywny miesiąc · wszystkie lata';
    if(weakEl)weakEl.textContent=weak?ml(weak[0]):'—';
    if(weakCount)weakCount.textContent=weak?`${weak[1]} paragonów`:'Brak danych';
    if(activeEl)activeEl.textContent=active;
    if(activeText)activeText.textContent=year?`miesięcy z paragonami · ${year}`:'miesięcy z paragonami · wszystkie lata';
    const ys=availableYears(),target=year?Number(year):ys[0],prev=target?target-1:null,nowStats=target?avgForYear(target):null,prevStats=prev?avgForYear(prev):null;
    if(yoyEl&&yoyText){
      if(!target||!nowStats?.active||!prevStats?.active){yoyEl.textContent='—';yoyEl.className='val';yoyText.textContent=prev?`Brak pełnych danych: ${target} vs ${prev}`:'Brak danych porównawczych';}
      else{const diff=nowStats.avg-prevStats.avg,pct=prevStats.avg?diff/prevStats.avg*100:null,stable=Math.abs(pct??diff)<1,label=stable?'Stabilnie':diff>0?'Wzrost':'Spadek',cls=stable?'':diff>0?'oktxt':'badtxt';yoyEl.textContent=pct===null?`${diff>0?'+':''}${diff.toFixed(1)}`:`${pct>0?'+':''}${pct.toFixed(1)}%`;yoyEl.className='val '+cls;yoyText.textContent=`${label} · ${target}: ${nowStats.avg.toFixed(1)} vs ${prev}: ${prevStats.avg.toFixed(1)}`;}
    }
  };
  const install=()=>{
    ensure();render();
    document.addEventListener('change',e=>{if(e.target?.id==='storeDetailYear')setTimeout(render,0)},true);
    const detail=document.getElementById('storeDetail');if(detail)new MutationObserver(()=>setTimeout(render,0)).observe(detail,{attributes:true,attributeFilter:['class']});
    const title=document.getElementById('storeDetailTitle');if(title)new MutationObserver(()=>setTimeout(render,0)).observe(title,{childList:true,characterData:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
