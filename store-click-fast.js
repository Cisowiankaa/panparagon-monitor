(()=>{
  const api=window.PanParagonStoreYearDetail;if(!api)return;
  const CHUNK=1000;
  const cache=new Map(),yearCache=new Map();
  let source=null,sourceLen=-1,sourceStoreCol='',sourceDateCol='',generation=0,prewarming=false,prewarmed=false;

  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const currentSignature=()=>({src:Array.isArray(rows)?rows:[],sc:String(typeof storeCol!=='undefined'?storeCol:''),dc:String(typeof dateCol!=='undefined'?dateCol:'')});
  const resetTo=(src,sc,dc)=>{
    source=src;sourceLen=src.length;sourceStoreCol=sc;sourceDateCol=dc;
    cache.clear();yearCache.clear();generation++;prewarming=false;prewarmed=false;
  };
  const ensureSource=()=>{
    const {src,sc,dc}=currentSignature();
    if(src!==source||src.length!==sourceLen||sc!==sourceStoreCol||dc!==sourceDateCol)resetTo(src,sc,dc);
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
  const rowsForYear=(year,name)=>{
    ensureSource();
    const n=String(name||''),y=String(year||''),key=`${n}|${y}`;
    if(yearCache.has(key))return yearCache.get(key);
    const out=[];
    for(const r of rowsForStore(n)){
      const d=cachedDate(r);
      if(d&&String(d.getFullYear())===y)out.push(r);
    }
    yearCache.set(key,out);
    return out;
  };

  const schedule=fn=>{
    if('requestIdleCallback'in window)requestIdleCallback(fn);
    else setTimeout(fn,16);
  };
  const prewarm=()=>{
    const src=ensureSource();
    if(prewarming||prewarmed||!src.length)return;
    prewarming=true;
    const gen=generation,built=new Map();let i=0;
    const step=()=>{
      if(gen!==generation||src!==source){prewarming=false;return}
      const end=Math.min(i+CHUNK,src.length);
      for(;i<end;i++){
        const r=src[i],name=storeName(r);
        let list=built.get(name);if(!list){list=[];built.set(name,list)}
        list.push(r);
      }
      if(i<src.length){schedule(step);return}
      for(const [name,list] of built)if(!cache.has(name))cache.set(name,list);
      prewarming=false;prewarmed=true;
    };
    schedule(step);
  };

  const clear=()=>{const {src,sc,dc}=currentSignature();resetTo(src,sc,dc)};
  api.rowsForStore=rowsForStore;
  api.rowsForYear=rowsForYear;
  const baseInvalidate=typeof api.invalidate==='function'?api.invalidate.bind(api):null;
  api.invalidate=()=>{clear();baseInvalidate?.();prewarm()};

  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    clear();prewarm();
  });

  window.PanParagonStoreClickFast={clear,rowsForStore,rowsForYear,prewarm,isPrewarmed:()=>prewarmed};
  let tries=0;
  const ready=()=>{
    tries++;
    const src=ensureSource();
    if(src.length){prewarm();return}
    if(tries<100)setTimeout(ready,50);
  };
  setTimeout(ready,0);
})();
