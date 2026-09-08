(()=>{
  const CHUNK=800;
  let storeRows=new Map(),storeStats=new Map(),done=false,building=false,version=0;
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const reset=()=>{storeRows=new Map();storeStats=new Map();done=false;building=false;version++};
  const add=r=>{
    const name=storeName(r);
    let list=storeRows.get(name);if(!list){list=[];storeRows.set(name,list)}list.push(r);
    let stats=storeStats.get(name);if(!stats){stats={months:{},years:{},total:0};storeStats.set(name,stats)}
    stats.total++;
    const d=cachedDate(r);if(!d)return;
    const k=mk(d),y=String(d.getFullYear());
    stats.months[k]=(stats.months[k]||0)+1;stats.years[y]=(stats.years[y]||0)+1;
  };
  const schedule=cb=>{
    if('requestIdleCallback'in window)return requestIdleCallback(cb,{timeout:1200});
    return setTimeout(()=>cb({timeRemaining:()=>8,didTimeout:true}),32);
  };
  const build=()=>{
    if(building||done||!Array.isArray(rows)||!rows.length)return;
    building=true;const token=version,src=rows,iRef={i:0};
    const step=deadline=>{
      if(token!==version){building=false;return}
      let n=0;
      while(iRef.i<src.length&&n<CHUNK&&(deadline.didTimeout||deadline.timeRemaining()>2)){add(src[iRef.i++]);n++}
      if(iRef.i<src.length){schedule(step);return}
      done=true;building=false;
      patchYearDetail();
      document.dispatchEvent(new CustomEvent('panparagon:store-prewarm-ready',{detail:{stores:storeRows.size,rows:src.length}}));
    };
    schedule(step);
  };
  const patchYearDetail=()=>{
    const api=window.PanParagonStoreYearDetail;if(!api||api.__ppmPrewarmPatched)return;
    const baseStore=typeof api.rowsForStore==='function'?api.rowsForStore.bind(api):null;
    const baseYear=typeof api.rowsForYear==='function'?api.rowsForYear.bind(api):null;
    api.rowsForStore=name=>done?(storeRows.get(name)||[]):(baseStore?baseStore(name):[]);
    api.rowsForYear=(year,name)=>{
      if(!done)return baseYear?baseYear(year,name):[];
      const src=storeRows.get(name)||[],target=String(year||'');
      if(!target)return src;
      const out=[];for(const r of src){const d=cachedDate(r);if(d&&String(d.getFullYear())===target)out.push(r)}return out;
    };
    api.__ppmPrewarmPatched=true;
  };
  window.PanParagonStoreClickFast={
    isPrewarmed:()=>done,
    rowsForStore:name=>done?(storeRows.get(name)||[]):null,
    statsForStore:name=>done?(storeStats.get(name)||null):null,
    rebuild:()=>{reset();build()},
    version:()=>version
  };
  const install=()=>{
    build();
    const waitPatch=()=>{patchYearDetail();if(!window.PanParagonStoreYearDetail)setTimeout(waitPatch,50)};waitPatch();
    document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.reason==='main-render-fast')return;reset();build()});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
