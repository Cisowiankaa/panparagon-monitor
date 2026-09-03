(()=>{
  const base=window.PanParagonStoreYearDetail;
  if(!base)return;

  const CHUNK=1000;
  let source=null,sourceLen=-1,sourceStoreCol='',sourceDateCol='',generation=0,prewarmed=false,prewarming=false;
  const stores=new Map(),years=new Map();

  const nameOf=r=>{try{return (r?.[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const dateOf=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const signatureChanged=()=>source!==rows||sourceLen!==(Array.isArray(rows)?rows.length:0)||sourceStoreCol!==String(storeCol||'')||sourceDateCol!==String(dateCol||'');
  const reset=()=>{
    source=Array.isArray(rows)?rows:null;
    sourceLen=source?.length||0;
    sourceStoreCol=String(storeCol||'');
    sourceDateCol=String(dateCol||'');
    stores.clear();years.clear();prewarmed=false;prewarming=false;generation++;
  };
  const ensure=()=>{if(signatureChanged())reset()};

  const rowsForStore=name=>{
    ensure();
    const key=String(name||'');
    if(stores.has(key))return stores.get(key);
    const out=[];
    for(const r of source||[]){if(nameOf(r)===key)out.push(r)}
    stores.set(key,out);
    return out;
  };
  const rowsForYear=(year,name)=>{
    ensure();
    const store=String(name||''),y=String(year||''),key=`${store}|${y}`;
    if(years.has(key))return years.get(key);
    const out=[];
    for(const r of rowsForStore(store)){
      const d=dateOf(r);
      if(d&&String(d.getFullYear())===y)out.push(r);
    }
    years.set(key,out);
    return out;
  };

  const schedule=fn=>{
    if('requestIdleCallback'in window)requestIdleCallback(fn);
    else setTimeout(fn,16);
  };
  const prewarm=()=>{
    ensure();
    if(prewarmed||prewarming||!source?.length)return;
    prewarming=true;
    const gen=generation,src=source,built=new Map();let i=0;
    const step=()=>{
      if(gen!==generation||src!==source){prewarming=false;return}
      const end=Math.min(i+CHUNK,src.length);
      for(;i<end;i++){
        const r=src[i],name=nameOf(r);
        let list=built.get(name);if(!list){list=[];built.set(name,list)}
        list.push(r);
      }
      if(i<src.length){schedule(step);return}
      for(const [name,list] of built)if(!stores.has(name))stores.set(name,list);
      prewarming=false;prewarmed=true;
    };
    schedule(step);
  };

  base.rowsForStore=rowsForStore;
  base.rowsForYear=rowsForYear;
  base.prewarm=prewarm;
  base.isPrewarmed=()=>prewarmed;

  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    reset();prewarm();
  });

  let tries=0;
  const ready=()=>{
    tries++;
    ensure();
    if(source?.length){prewarm();return}
    if(tries<100)setTimeout(ready,50);
  };
  setTimeout(ready,0);
})();
