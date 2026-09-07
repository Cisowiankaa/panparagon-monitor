(()=>{
  const api=window.PanParagonStoreYearDetail;if(!api)return;
  const baseRowsForStore=typeof api.rowsForStore==='function'?api.rowsForStore.bind(api):null;
  const baseRowsForYear=typeof api.rowsForYear==='function'?api.rowsForYear.bind(api):null;
  const CHUNK=1000,INTERACTIVE_CHUNK=2500;
  const cache=new Map(),yearCache=new Map(),statsCache=new Map(),interactivePending=new Map();
  let source=null,sourceLen=-1,sourceStoreCol='',sourceDateCol='',generation=0,prewarming=false,prewarmed=false,waiters=[];

  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const currentSignature=()=>({src:Array.isArray(rows)?rows:[],sc:String(typeof storeCol!=='undefined'?storeCol:''),dc:String(typeof dateCol!=='undefined'?dateCol:'')});
  const settleWaiters=(gen,ok)=>{const keep=[];for(const w of waiters){if(w.gen===gen)w.resolve(ok);else keep.push(w)}waiters=keep};
  const resetTo=(src,sc,dc)=>{
    const oldGen=generation;
    source=src;sourceLen=src.length;sourceStoreCol=sc;sourceDateCol=dc;
    cache.clear();yearCache.clear();statsCache.clear();interactivePending.clear();generation++;prewarming=false;prewarmed=false;
    settleWaiters(oldGen,false);
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
  const cachedBaseStore=key=>{
    if(!baseRowsForStore)return null;
    try{
      const out=baseRowsForStore(key);
      return Array.isArray(out)?out:null;
    }catch{return null}
  };

  const rowsForStore=name=>{
    const src=ensureSource(),key=String(name||'');
    if(cache.has(key))return cache.get(key);
    const base=cachedBaseStore(key);
    if(base){cache.set(key,base);statsCache.set(key,statsFromList(base));return base}
    const out=[],stats=makeStats();
    for(const r of src){if(storeName(r)===key){out.push(r);addStats(stats,r)}}
    cache.set(key,out);statsCache.set(key,stats);
    return out;
  };
  const rowsForStoreAsync=name=>{
    const src=ensureSource(),key=String(name||'');
    if(cache.has(key))return Promise.resolve(cache.get(key));
    const base=cachedBaseStore(key);
    if(base){cache.set(key,base);statsCache.set(key,statsFromList(base));return Promise.resolve(base)}
    if(interactivePending.has(key))return interactivePending.get(key);
    const gen=generation,out=[],stats=makeStats();let i=0;
    const promise=new Promise(resolve=>{
      const step=()=>{
        if(gen!==generation||src!==source){interactivePending.delete(key);resolve([]);return}
        const end=Math.min(i+INTERACTIVE_CHUNK,src.length);
        for(;i<end;i++){
          const r=src[i];
          if(storeName(r)===key){out.push(r);addStats(stats,r)}
        }
        if(i<src.length){
          if('requestAnimationFrame'in window)requestAnimationFrame(step);else setTimeout(step,0);
          return;
        }
        if(!cache.has(key))cache.set(key,out);
        if(!statsCache.has(key))statsCache.set(key,stats);
        interactivePending.delete(key);
        resolve(cache.get(key)||out);
      };
      step();
    });
    interactivePending.set(key,promise);
    return promise;
  };
  const rowsForYear=(year,name)=>{
    ensureSource();
    const n=String(name||''),y=String(year||''),key=`${n}|${y}`;
    if(yearCache.has(key))return yearCache.get(key);
    if(baseRowsForYear){
      try{
        const base=baseRowsForYear(y,n);
        if(Array.isArray(base)){yearCache.set(key,base);return base}
      }catch{}
    }
    const out=[];
    for(const r of rowsForStore(n)){
      const d=cachedDate(r);
      if(d&&String(d.getFullYear())===y)out.push(r);
    }
    yearCache.set(key,out);
    return out;
  };
  const statsForStore=name=>{
    ensureSource();
    const key=String(name||'');
    if(statsCache.has(key))return statsCache.get(key);
    const list=rowsForStore(key);
    if(!statsCache.has(key))statsCache.set(key,statsFromList(list));
    return statsCache.get(key)||makeStats();
  };

  const schedule=fn=>{
    if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout:500});
    else setTimeout(fn,16);
  };
  const prewarm=()=>{
    const src=ensureSource();
    if(prewarming||prewarmed||!src.length)return;
    prewarming=true;
    const gen=generation,built=new Map(),builtStats=new Map();let i=0;
    const step=()=>{
      if(gen!==generation||src!==source){prewarming=false;settleWaiters(gen,false);return}
      const end=Math.min(i+CHUNK,src.length);
      for(;i<end;i++){
        const r=src[i],name=storeName(r);
        let list=built.get(name);if(!list){list=[];built.set(name,list)}
        list.push(r);
        let stats=builtStats.get(name);if(!stats){stats=makeStats();builtStats.set(name,stats)}
        addStats(stats,r);
      }
      if(i<src.length){schedule(step);return}
      for(const [name,list] of built)if(!cache.has(name))cache.set(name,list);
      for(const [name,stats] of builtStats)if(!statsCache.has(name))statsCache.set(name,stats);
      prewarming=false;prewarmed=true;settleWaiters(gen,true);
    };
    schedule(step);
  };
  const whenReady=()=>{
    ensureSource();
    if(prewarmed)return Promise.resolve(true);
    prewarm();
    const gen=generation;
    return new Promise(resolve=>waiters.push({gen,resolve}));
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

  window.PanParagonStoreClickFast={clear,rowsForStore,rowsForStoreAsync,rowsForYear,statsForStore,prewarm,whenReady,isPrewarmed:()=>prewarmed};
  let tries=0;
  const ready=()=>{
    tries++;
    const src=ensureSource();
    if(src.length){prewarm();return}
    if(tries<100)setTimeout(ready,50);
  };
  setTimeout(ready,0);
})();
