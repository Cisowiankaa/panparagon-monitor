(()=>{
  let lastStore='',source=null,sourceLen=-1,dateKey='',storeKey='';
  const yearRowsCache=new Map(),yearsCache=new Map(),fallbackStoreCache=new Map();
  const selectedYear=()=>window.PanParagonStoreFilter?.getYear?.()||document.getElementById('storeYear')?.value||'';
  const storesTable=()=>document.getElementById('storesTable');
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const cachedRowDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const currentRows=()=>Array.isArray(rows)?rows:[];
  const signatureChanged=()=>source!==rows||sourceLen!==currentRows().length||dateKey!==String(dateCol||'')||storeKey!==String(storeCol||'');
  const reset=()=>{source=rows;sourceLen=currentRows().length;dateKey=String(dateCol||'');storeKey=String(storeCol||'');yearRowsCache.clear();yearsCache.clear();fallbackStoreCache.clear()};
  const ensureSignature=()=>{if(signatureChanged())reset()};
  const sharedRows=name=>{
    try{
      const idx=window.PanParagonStoreRowIndex;
      if(idx?.isReady?.()){
        const out=idx.rowsForStore?.(name);
        if(Array.isArray(out))return out;
      }
    }catch{}
    try{
      const fast=window.PanParagonStoreClickFast;
      if(fast?.isIndexed?.()){
        const out=fast.rowsForStore?.(name);
        if(Array.isArray(out))return out;
      }
    }catch{}
    return null;
  };
  const rowsForStore=(name=lastStore||baseStoreName())=>{
    ensureSignature();const key=String(name||'');
    const shared=sharedRows(key);if(shared)return shared;
    if(fallbackStoreCache.has(key))return fallbackStoreCache.get(key);
    const out=[];for(const r of currentRows())if(storeName(r)===key)out.push(r);
    fallbackStoreCache.set(key,out);return out;
  };
  const rowsForYear=(all,year,name=lastStore||baseStoreName())=>{
    ensureSignature();const y=String(year||''),n=String(name||''),key=`${n}|${y}`;
    if(yearRowsCache.has(key))return yearRowsCache.get(key);
    const src=Array.isArray(all)?all:rowsForStore(n),out=[];
    for(const r of src){try{const d=cachedRowDate(r);if(d&&String(d.getFullYear())===y)out.push(r)}catch{}}
    yearRowsCache.set(key,out);return out;
  };
  const baseStoreName=()=>{const title=document.getElementById('storeDetailTitle');return (title?.textContent||'').replace(/\s—\s\d{4}$/,'').replace(/\s—\sładowanie…$/,'').trim()};
  const availableYears=()=>{
    const name=lastStore||baseStoreName();if(!name)return[];ensureSignature();
    if(yearsCache.has(name))return yearsCache.get(name);
    const set=new Set();for(const r of rowsForStore(name)){try{const y=cachedRowDate(r)?.getFullYear();if(y)set.add(y)}catch{}}
    const out=[...set].sort((a,b)=>b-a);yearsCache.set(name,out);return out;
  };
  const yearProgressCount=year=>{const ys=availableYears();if(!year)return ys.length;const y=Number(year);return ys.filter(v=>Number(v)<=y).length};
  const yearWord=n=>n===1?'rok':(n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'lata':'lat');
  const yearHistoryMeta=year=>{const ys=availableYears().map(Number).sort((a,b)=>a-b);if(!ys.length)return'Brak historii';const first=ys[0],last=year?Number(year):ys[ys.length-1],count=yearProgressCount(year);return year?`${count}. rok historii · ${first}–${last}`:`${count} ${yearWord(count)} historii · ${first}–${ys[ys.length-1]}`};
  const setYearHistoryLabel=year=>{const val=document.getElementById('storeYearCount'),card=val?.closest('.card'),lab=card?.querySelector('.lab');if(lab){lab.textContent=year?'Rok historii':'Lata historii';lab.title=year?'Numer roku historii sklepu do wybranego roku':'Łączna liczba lat historii sklepu'}if(card){let meta=document.getElementById('storeYearMeta');if(!meta){meta=document.createElement('div');meta.id='storeYearMeta';meta.className='small';meta.style.marginTop='4px';val?.insertAdjacentElement('afterend',meta)}if(meta)meta.textContent=yearHistoryMeta(year)}};
  const ensureDetailSelector=()=>{const detail=document.getElementById('storeDetail'),title=document.getElementById('storeDetailTitle');if(!detail||!title)return null;let box=document.getElementById('storeDetailYearBox');if(!box){box=document.createElement('div');box.id='storeDetailYearBox';box.className='actions';box.style.marginTop='14px';box.innerHTML='<label class="small" for="storeDetailYear" style="align-self:center">Rok:</label><select id="storeDetailYear"><option value="">Wszystkie lata</option></select>';const sub=title.parentElement?.querySelector('.sub');(sub||title).insertAdjacentElement('afterend',box);document.getElementById('storeDetailYear').addEventListener('change',e=>switchDetailYear(e.target.value))}const sel=document.getElementById('storeDetailYear'),current=sel.value,ys=availableYears(),sig=ys.join('|');if(sel.dataset.yearsSig!==sig){sel.innerHTML='<option value="">Wszystkie lata</option>'+ys.map(y=>`<option value="${y}">${y}</option>`).join('');sel.dataset.yearsSig=sig}if([...sel.options].some(o=>o.value===current))sel.value=current;return sel};
  const syncDetailSelector=year=>{const sel=ensureDetailSelector();if(sel&&[...sel.options].some(o=>o.value===String(year)))sel.value=String(year);else if(sel&&!year)sel.value=''};
  const syncMainYear=year=>{const api=window.PanParagonStoreFilter;if(api?.setYear){api.setYear(year,{render:false,notify:false});return}const mainYear=document.getElementById('storeYear');if(mainYear)mainYear.value=year};
  const notify=()=>document.dispatchEvent(new CustomEvent('panparagon:store-detail-updated',{detail:{store:lastStore,year:document.getElementById('storeDetailYear')?.value||''}}));
  const markDetailYear=year=>{const title=document.getElementById('storeDetailTitle'),sub=title?.parentElement?.querySelector('.sub'),yearCount=document.getElementById('storeYearCount');if(title){const base=title.textContent.replace(/\s—\s\d{4}$/,'');title.textContent=year?base+' — '+year:base}if(sub)sub.textContent=year?`Widok ograniczony do roku ${year}. Kliknij miesiąc, aby zobaczyć paragony z tego okresu.`:'Kliknij miesiąc, aby zobaczyć wszystkie paragony z tego okresu.';if(yearCount)yearCount.textContent=yearProgressCount(year);setYearHistoryLabel(year);syncDetailSelector(year);wireYearRows();notify()};
  const switchDetailYear=year=>{const name=lastStore||baseStoreName();if(!name)return;lastStore=name;const allStore=rowsForStore(name),detail=year?rowsForYear(allStore,year,name):allStore,api=window.PanParagonStoreDetails,sx=window.scrollX,sy=window.scrollY;if(api){if(typeof api.refreshStore==='function')api.refreshStore(name,detail,allStore);else if(typeof api.openStore==='function')api.openStore(name,detail,allStore);window.scrollTo({left:sx,top:sy,behavior:'auto'});markDetailYear(year)}syncMainYear(year)};
  const wireYearRows=()=>{const box=document.getElementById('storeYearTable');if(!box)return;box.querySelectorAll('table tr').forEach((tr,i)=>{if(i===0||tr.dataset.yearWired)return;const first=tr.querySelector('td'),year=(first?.textContent||'').trim();if(!/^\d{4}$/.test(year))return;tr.dataset.yearWired='1';tr.style.cursor='pointer';tr.title=`Pokaż tylko rok ${year}`;if(first)first.innerHTML=`<button type="button" style="padding:0;border:0;background:transparent;color:var(--a);font-weight:800;cursor:pointer">${year}</button>`;tr.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();switchDetailYear(year)})})};
  const onCapture=e=>{const table=storesTable();if(!table||!table.contains(e.target))return;const tr=e.target.closest('tr');if(!tr||tr.rowIndex===0)return;const name=(tr.querySelectorAll('td')[1]?.textContent||'').trim();if(name)lastStore=name;const year=selectedYear();if(!year)return;const allStore=rowsForStore(name),api=window.PanParagonStoreDetails;setTimeout(()=>{if(api){const detail=rowsForYear(allStore,year,name);if(typeof api.refreshStore==='function')api.refreshStore(name,detail,allStore);else if(typeof api.openStore==='function')api.openStore(name,detail,allStore)}markDetailYear(year)},0)};
  const refreshDetailMeta=()=>{const detail=document.getElementById('storeDetail');if(!detail?.classList.contains('on'))return;const name=baseStoreName();if(name)lastStore=name;ensureDetailSelector();wireYearRows();setYearHistoryLabel(document.getElementById('storeDetailYear')?.value||'')};
  const invalidate=()=>{reset()};
  const install=()=>{reset();const table=storesTable();if(table)table.addEventListener('click',onCapture,true);const yearTable=document.getElementById('storeYearTable');if(yearTable)new MutationObserver(wireYearRows).observe(yearTable,{childList:true,subtree:true});document.addEventListener('panparagon:store-detail-updated',()=>requestAnimationFrame(refreshDetailMeta));document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.source==='main-render-fast'||e?.detail?.reason==='main-render-fast')return;invalidate()});wireYearRows()};
  window.PanParagonStoreYearDetail={invalidate,rowsForStore,rowsForYear:(year,name)=>rowsForYear(rowsForStore(name),year,name),isReady:()=>!!window.PanParagonStoreRowIndex?.isReady?.()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
