(()=>{
  const fast=window.PanParagonStoreClickFast;
  if(!fast)return;

  const idx=window.PanParagonStoreYearDetail;
  const baseRowsForYear=typeof idx?.rowsForYear==='function'?idx.rowsForYear.bind(idx):null;
  const CHUNK=250;
  let source=null,sourceLen=-1,sourceStoreCol='',generation=0;
  const cache=new Map(),yearCache=new Map(),pending=new Map();

  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const rowIndexRows=name=>{
    try{
      const api=window.PanParagonStoreRowIndex;
      if(!api?.isReady?.()||typeof api.rowsForStore!=='function')return null;
      const out=api.rowsForStore(String(name||''));
      return Array.isArray(out)?out:null;
    }catch{return null}
  };
  const signature=()=>({src:Array.isArray(rows)?rows:[],len:Array.isArray(rows)?rows.length:0,sc:String(typeof storeCol!=='undefined'?storeCol:'')});
  const ensureSource=()=>{
    const s=signature();
    if(s.src!==source||s.len!==sourceLen||s.sc!==sourceStoreCol){
      source=s.src;sourceLen=s.len;sourceStoreCol=s.sc;cache.clear();yearCache.clear();pending.clear();generation++;
    }
    return source;
  };
  const yieldFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));

  const targeted=async name=>{
    const src=ensureSource(),key=String(name||'');
    const direct=rowIndexRows(key);
    if(direct){cache.set(key,direct);return direct}
    if(fast.isIndexed?.()){
      const indexed=fast.rowsForStore?.(key);
      if(Array.isArray(indexed)){cache.set(key,indexed);return indexed}
    }
    if(cache.has(key))return cache.get(key);
    if(pending.has(key))return pending.get(key);
    const gen=generation;
    const job=(async()=>{
      const out=[];
      for(let i=0;i<src.length;){
        if(gen!==generation||src!==source)return [];
        const end=Math.min(i+CHUNK,src.length);
        for(;i<end;i++){const r=src[i];if(storeName(r)===key)out.push(r)}
        if(i<src.length)await yieldFrame();
      }
      if(gen===generation&&src===source)cache.set(key,out);
      pending.delete(key);
      return out;
    })().catch(()=>{pending.delete(key);return[]});
    pending.set(key,job);return job;
  };

  const rowsForYear=(year,name)=>{
    ensureSource();
    const n=String(name||''),y=String(year||''),key=`${n}|${y}`;
    if(yearCache.has(key))return yearCache.get(key);
    let storeRows=cache.get(n);
    if(!Array.isArray(storeRows)){
      const direct=rowIndexRows(n);
      if(direct){storeRows=direct;cache.set(n,direct)}
    }
    if(Array.isArray(storeRows)){
      const out=[];
      for(const r of storeRows){const d=cachedDate(r);if(d&&String(d.getFullYear())===y)out.push(r)}
      yearCache.set(key,out);return out;
    }
    if(fast.isIndexed?.()){
      const indexed=fast.rowsForStore?.(n);
      if(Array.isArray(indexed)){
        cache.set(n,indexed);
        const out=[];
        for(const r of indexed){const d=cachedDate(r);if(d&&String(d.getFullYear())===y)out.push(r)}
        yearCache.set(key,out);return out;
      }
    }
    return baseRowsForYear?baseRowsForYear(y,n):[];
  };

  // Najpierw używamy indeksu zbudowanego przy głównym renderze. Pełny skan 35k
  // pozostaje wyłącznie fallbackiem, gdy indeks nie zdążył się jeszcze zapełnić.
  // Małe porcje chronią responsywność UI na słabszych urządzeniach.
  fast.rowsForStoreAsync=targeted;
  if(idx)idx.rowsForYear=rowsForYear;

  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    source=null;sourceLen=-1;sourceStoreCol='';cache.clear();yearCache.clear();pending.clear();generation++;
  });

  window.PanParagonStoreClickResponsive={rowsForStoreAsync:targeted,rowsForYear,chunk:CHUNK};
})();
