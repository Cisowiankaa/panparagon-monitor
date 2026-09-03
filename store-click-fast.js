(()=>{
  const api=window.PanParagonStoreYearDetail;if(!api)return;
  const cache=new Map();
  let source=null,sourceLen=-1,sourceStoreCol='';
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const ensureSource=()=>{
    const src=Array.isArray(rows)?rows:[],sc=String(typeof storeCol!=='undefined'?storeCol:'');
    if(src!==source||src.length!==sourceLen||sc!==sourceStoreCol){source=src;sourceLen=src.length;sourceStoreCol=sc;cache.clear()}
    return src;
  };
  const rowsForStore=name=>{
    const src=ensureSource(),key=String(name||'');
    if(cache.has(key))return cache.get(key);
    const out=[];
    for(const r of src){if(storeName(r)===key)out.push(r)}
    cache.set(key,out);
    return out;
  };
  const yearCache=new Map();
  const rowsForYear=(year,name)=>{
    ensureSource();
    const n=String(name||''),y=String(year||''),key=`${n}|${y}`;
    if(yearCache.has(key))return yearCache.get(key);
    const out=[];
    for(const r of rowsForStore(n)){const d=cachedDate(r);if(d&&String(d.getFullYear())===y)out.push(r)}
    yearCache.set(key,out);
    return out;
  };
  const clear=()=>{source=null;sourceLen=-1;sourceStoreCol='';cache.clear();yearCache.clear()};
  api.rowsForStore=rowsForStore;
  api.rowsForYear=rowsForYear;
  const baseInvalidate=typeof api.invalidate==='function'?api.invalidate.bind(api):null;
  api.invalidate=()=>{clear();baseInvalidate?.()};
  document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;clear()});
  window.PanParagonStoreClickFast={clear,rowsForStore,rowsForYear};
})();