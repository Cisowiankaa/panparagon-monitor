(()=>{
  const api=window.PanParagonStoreYearDetail;if(!api)return;
  const baseRowsForStore=typeof api.rowsForStore==='function'?api.rowsForStore.bind(api):null;
  const baseRowsForYear=typeof api.rowsForYear==='function'?api.rowsForYear.bind(api):null;
  const INTERACTIVE_CHUNK=2500;
  const cache=new Map(),yearCache=new Map(),statsCache=new Map(),interactivePending=new Map();
  let source=null,sourceLen=-1,sourceStoreCol='',sourceDateCol='',generation=0,prewarmed=false;

  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const currentSignature=()=>({src:Array.isArray(rows)?rows:[],sc:String(typeof storeCol!=='undefined'?storeCol:''),dc:String(typeof dateCol!=='undefined'?dateCol:'')});
  const resetTo=(src,sc,dc)=>{
    source=src;sourceLen=src.length;sourceStoreCol=sc;sourceDateCol=dc;
    cache.clear();yearCache.clear();statsCache.clear();interactivePending.clear();generation++;prewarmed=false;
  };
  const ensureSource=()=>{
    const {src,sc,dc}=currentSignature();
    if(src!==source||src.length!==sourceLen||sc!==sourceStoreCol||dc!==sourceDateCol)resetTo(src,sc,dc);
    return src;
  };
  const makeStats=()=>({months:{},years:{},total:0});
  const addStats=(stats,r)=>{
    stats.total++;
    const d=cachedDate(r);if(!d)return;
    const k=mk(d),y=String(d.getFullYear());
    stats.months[k]=(stats.months[k]||0)+1;
    stats.years[y]=(stats.years[y]||0)+1;
  };
  const statsFromList=list=>{const stats=makeStats();for(const r of list||[])addStats(stats,r);return stats};
  const statsFromMainIndex=name=>{
    try{
      const data=window.PanParagonMainIndex?.get?.();
      if(!data?.allStores||!data?.monthStores)return null;
      const key=String(name||''),stats=makeStats();
      stats.total=Number(data.allStores[key]||0);
      for(const [month,bucket] of Object.entries(data.monthStores)){
        const n=Number(bucket?.[key]||0);if(!n)continue;
        stats.months[month]=n;
        const year=month.slice(0,4);stats.years[year]=(stats.years[year]||0)+n;
      }
      return stats;
    }catch{return null}
  };
  const cacheStats=(key,list)=>{
    if(statsCache.has(key))return statsCache.get(key);
    const stats=statsFromMainIndex(key)||statsFromList(list);
    statsCache.set(key,stats);return stats;
  };
  const cachedBaseStore=key=>{
    if(!baseRowsForStore)return null;
    try{const out=baseRowsForStore(key);return Array.isArray(out)?out:null}catch{return null}
  };
  const indexedStore=key=>{
    try{
      const out=window.PanParagonStoreRowIndex?.rowsForStore?.(key);
      return Array.isArray(out)?out:null;
    }catch{return null}
  };

  const rowsForStore=name=>{
    const src=ensureSource(),key=String(name||'');
    if(cache.has(key))return cache.get(key);
    const indexed=indexedStore(key);
    if(indexed){cache.set(key,indexed);cacheStats(key,indexed);return indexed}
    const base=cachedBaseStore(key);
    if(base){cache.set(key,base);cacheStats(key,base);return base}
    const out=[];
    for(const r of src)if(storeName(r)===key)out.push(r);
    cache.set(key,out);cacheStats(key,out);return out;
  };
  const rowsForStoreAsync=name=>{
    const src=ensureSource(),key=String(name||'');
    if(cache.has(key))return Promise.resolve(cache.get(key));
    const indexed=indexedStore(key);
    if(indexed){cache.set(key,indexed);cacheStats(key,indexed);return Promise.resolve(indexed)}
    if(interactivePending.has(key))return interactivePending.get(key);
    const gen=generation,out=[];let i=0;
    const promise=new Promise(resolve=>{
      const step=()=>{
        if(gen!==generation||src!==source){interactivePending.delete(key);resolve([]);return}
        const end=Math.min(i+INTERACTIVE_CHUNK,src.length);
        for(;i<end;i++){const r=src[i];if(storeName(r)===key)out.push(r)}
        if(i<src.length){if('requestAnimationFrame'in window)requestAnimationFrame(step);else setTimeout(step,0);return}
        if(!cache.has(key))cache.set(key,out);
        cacheStats(key,cache.get(key)||out);
        interactivePending.delete(key);resolve(cache.get(key)||out);
      };
      step();
    });
    interactivePending.set(key,promise);return promise;
  };
  const rowsForYear=(year,name)=>{
    ensureSource();
    const n=String(name||''),y=String(year||''),key=`${n}|${y}`;
    if(yearCache.has(key))return yearCache.get(key);
    if(baseRowsForYear){
      try{const base=baseRowsForYear(y,n);if(Array.isArray(base)){yearCache.set(key,base);return base}}catch{}
    }
    const out=[];
    for(const r of rowsForStore(n)){const d=cachedDate(r);if(d&&String(d.getFullYear())===y)out.push(r)}
    yearCache.set(key,out);return out;
  };
  const statsForStore=name=>{
    ensureSource();
    const key=String(name||'');
    if(statsCache.has(key))return statsCache.get(key);
    const indexed=statsFromMainIndex(key);
    if(indexed){statsCache.set(key,indexed);return indexed}
    const list=rowsForStore(key);
    return cacheStats(key,list);
  };

  const prewarm=()=>{
    ensureSource();
    prewarmed=!!window.PanParagonMainIndex?.get?.();
    return prewarmed;
  };
  const whenReady=()=>Promise.resolve(prewarm());
  const clear=()=>{const {src,sc,dc}=currentSignature();resetTo(src,sc,dc)};

  api.rowsForStore=rowsForStore;
  api.rowsForYear=rowsForYear;
  const baseInvalidate=typeof api.invalidate==='function'?api.invalidate.bind(api):null;
  api.invalidate=()=>{clear();baseInvalidate?.();prewarm()};

  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    clear();prewarm();
  });

  window.PanParagonStoreClickFast={clear,rowsForStore,rowsForStoreAsync,rowsForYear,statsForStore,prewarm,whenReady,isPrewarmed:()=>prewarmed,isIndexed:()=>prewarmed,__baseRowsForStore:cachedBaseStore};
  let tries=0;
  const ready=()=>{
    tries++;ensureSource();
    if(prewarm())return;
    if(tries<100)setTimeout(ready,50);
  };
  setTimeout(ready,0);
})();
