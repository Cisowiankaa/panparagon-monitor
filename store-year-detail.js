(()=>{
  let lastStore='',fullRowsCache=[],cacheSize=-1;
  const yearRowsCache=new Map(),yearsCache=new Map(),storeRowsCache=new Map();
  const selectedYear=()=>document.getElementById('storeYear')?.value||'';
  const storesTable=()=>document.getElementById('storesTable');
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const rebuildIndex=src=>{
    yearRowsCache.clear();yearsCache.clear();storeRowsCache.clear();
    for(const r of src){
      try{
        const name=storeName(r),d=rowDate(r),year=d?String(d.getFullYear()):'';
        if(!storeRowsCache.has(name))storeRowsCache.set(name,[]);
        storeRowsCache.get(name).push(r);
        if(year){
          const key=`${name}|${year}`;
          if(!yearRowsCache.has(key))yearRowsCache.set(key,[]);
          yearRowsCache.get(key).push(r);
          if(!yearsCache.has(name))yearsCache.set(name,new Set());
          yearsCache.get(name).add(Number(year));
        }
      }catch{}
    }
  };
  const rememberFullRows=src=>{if(Array.isArray(src)&&src.length>=fullRowsCache.length){if(src.length!==cacheSize){cacheSize=src.length;fullRowsCache=src.slice();rebuildIndex(fullRowsCache)}else fullRowsCache=src.slice()}};
  const fullRows=()=>fullRowsCache.length?fullRowsCache:(Array.isArray(rows)?rows:[]);
  const rowsForYear=(all,year,name=lastStore||baseStoreName())=>{
    const key=`${name}|${year}`;
    if(yearRowsCache.has(key))return yearRowsCache.get(key);
    const out=[];for(const r of all){try{if(name&&storeName(r)!==name)continue;const d=rowDate(r);if(d&&String(d.getFullYear())===String(year))out.push(r)}catch{}}
    yearRowsCache.set(key,out);return out;
  };
  const rowsForStore=(name=lastStore||baseStoreName())=>storeRowsCache.get(name)||fullRows().filter(r=>storeName(r)===name);
  const baseStoreName=()=>{const title=document.getElementById('storeDetailTitle');return (title?.textContent||'').replace(/\s—\s\d{4}$/,'').trim()};
  const availableYears=()=>{const name=lastStore||baseStoreName(),cached=yearsCache.get(name);if(cached)return [...cached].sort((a,b)=>b-a);const set=new Set();for(const r of rowsForStore(name)){try{const y=rowDate(r)?.getFullYear();if(y)set.add(y)}catch{}}const out=[...set].sort((a,b)=>b-a);yearsCache.set(name,new Set(out));return out};
  const yearProgressCount=year=>{const ys=availableYears();if(!year)return ys.length;const y=Number(year);return ys.filter(v=>Number(v)<=y).length};
  const yearHistoryMeta=year=>{const ys=availableYears().map(Number).sort((a,b)=>a-b);if(!ys.length)return 'Brak historii';const first=ys[0],last=year?Number(year):ys[ys.length-1],count=yearProgressCount(year);return year?`${count}. rok historii · ${first}–${last}`:`${count} ${count===1?'rok':'lata'} historii · ${first}–${ys[ys.length-1]}`};
  const setYearHistoryLabel=year=>{const val=document.getElementById('storeYearCount'),card=val?.closest('.card'),lab=card?.querySelector('.lab');if(lab){lab.textContent=year?'Rok historii':'Lata historii';lab.title=year?'Numer roku historii sklepu do wybranego roku':'Łączna liczba lat historii sklepu'}if(card){let meta=document.getElementById('storeYearMeta');if(!meta){meta=document.createElement('div');meta.id='storeYearMeta';meta.className='small';meta.style.marginTop='4px';val?.insertAdjacentElement('afterend',meta)}if(meta)meta.textContent=yearHistoryMeta(year)}};
  const ensureDetailSelector=()=>{const detail=document.getElementById('storeDetail'),title=document.getElementById('storeDetailTitle');if(!detail||!title)return null;let box=document.getElementById('storeDetailYearBox');if(!box){box=document.createElement('div');box.id='storeDetailYearBox';box.className='actions';box.style.marginTop='14px';box.innerHTML='<label class="small" for="storeDetailYear" style="align-self:center">Rok:</label><select id="storeDetailYear"><option value="">Wszystkie lata</option></select>';const sub=title.parentElement?.querySelector('.sub');(sub||title).insertAdjacentElement('afterend',box);document.getElementById('storeDetailYear').addEventListener('change',e=>switchDetailYear(e.target.value))}const sel=document.getElementById('storeDetailYear'),current=sel.value,ys=availableYears();sel.innerHTML='<option value="">Wszystkie lata</option>'+ys.map(y=>`<option value="${y}">${y}</option>`).join('');if([...sel.options].some(o=>o.value===current))sel.value=current;return sel};
  const syncDetailSelector=year=>{const sel=ensureDetailSelector();if(sel&&[...sel.options].some(o=>o.value===String(year)))sel.value=String(year);else if(sel&&!year)sel.value=''};
  const notify=()=>document.dispatchEvent(new CustomEvent('panparagon:store-detail-updated',{detail:{store:lastStore,year:document.getElementById('storeDetailYear')?.value||''}}));
  const markDetailYear=year=>{const title=document.getElementById('storeDetailTitle'),sub=title?.parentElement?.querySelector('.sub'),yearCount=document.getElementById('storeYearCount');if(title){const base=title.textContent.replace(/\s—\s\d{4}$/,'');title.textContent=year?base+' — '+year:base}if(sub)sub.textContent=year?`Widok ograniczony do roku ${year}. Kliknij miesiąc, aby zobaczyć paragony z tego okresu.`:'Kliknij miesiąc, aby zobaczyć wszystkie paragony z tego okresu.';if(yearCount)yearCount.textContent=yearProgressCount(year);setYearHistoryLabel(year);syncDetailSelector(year);wireYearRows();notify()};
  const switchDetailYear=year=>{const name=lastStore||baseStoreName();if(!name)return;lastStore=name;if(Array.isArray(rows))rememberFullRows(rows);const all=fullRows(),detail=year?rowsForYear(all,year,name):rowsForStore(name),api=window.PanParagonStoreDetails,sx=window.scrollX,sy=window.scrollY;if(api&&typeof api.openStore==='function'){api.openStore(name,detail,all);window.scrollTo({left:sx,top:sy,behavior:'auto'});markDetailYear(year)}const mainYear=document.getElementById('storeYear');if(mainYear)mainYear.value=year};
  const wireYearRows=()=>{const box=document.getElementById('storeYearTable');if(!box)return;box.querySelectorAll('table tr').forEach((tr,i)=>{if(i===0||tr.dataset.yearWired)return;const first=tr.querySelector('td'),year=(first?.textContent||'').trim();if(!/^\d{4}$/.test(year))return;tr.dataset.yearWired='1';tr.style.cursor='pointer';tr.title=`Pokaż tylko rok ${year}`;if(first)first.innerHTML=`<button type="button" style="padding:0;border:0;background:transparent;color:var(--a);font-weight:800;cursor:pointer">${year}</button>`;tr.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();switchDetailYear(year)})})};
  const onCapture=e=>{const table=storesTable();if(!table||!table.contains(e.target))return;const tr=e.target.closest('tr');if(!tr||tr.rowIndex===0)return;const name=(tr.querySelectorAll('td')[1]?.textContent||'').trim();if(name)lastStore=name;if(Array.isArray(rows))rememberFullRows(rows);const year=selectedYear();if(!year)return;const all=fullRows(),api=window.PanParagonStoreDetails;setTimeout(()=>{if(api&&typeof api.openStore==='function')api.openStore(name,rowsForYear(all,year,name),all);markDetailYear(year)},0)};
  const install=()=>{if(Array.isArray(rows))rememberFullRows(rows);const table=storesTable();if(table)table.addEventListener('click',onCapture,true);const detail=document.getElementById('storeDetail');if(detail)new MutationObserver(()=>{if(detail.classList.contains('on')){ensureDetailSelector();wireYearRows();setYearHistoryLabel(document.getElementById('storeDetailYear')?.value||'')}}).observe(detail,{attributes:true,attributeFilter:['class']});const yearTable=document.getElementById('storeYearTable');if(yearTable)new MutationObserver(wireYearRows).observe(yearTable,{childList:true,subtree:true});ensureDetailSelector();wireYearRows();setYearHistoryLabel('')};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
