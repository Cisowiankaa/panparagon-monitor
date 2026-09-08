(()=>{
  const CHUNK=1200,INTERACTIVE_CHUNK=5000;
  let source=null,sourceLen=-1,sourceStoreCol='',generation=0,ready=false,building=null,index=new Map(),interactiveWaiters=0,targetedAsync=null;

  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const signature=()=>({src:Array.isArray(rows)?rows:[],len:Array.isArray(rows)?rows.length:0,sc:String(typeof storeCol!=='undefined'?storeCol:'')});
  const matches=()=>{const s=signature();return s.src===source&&s.len===sourceLen&&s.sc===sourceStoreCol};
  const reset=()=>{const s=signature();source=s.src;sourceLen=s.len;sourceStoreCol=s.sc;index=new Map();ready=false;building=null;generation++};
  const yieldToBrowser=priority=>new Promise(resolve=>{
    if(priority&&'requestAnimationFrame'in window){requestAnimationFrame(()=>resolve());return}
    if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout:80});
    else requestAnimationFrame(()=>resolve());
  });

  const build=()=>{
    if(!matches())reset();
    if(ready)return Promise.resolve(true);
    if(building)return building;
    const src=source,gen=generation,map=index;
    building=(async()=>{
      let i=0;
      while(i<src.length){
        if(gen!==generation||src!==source)return false;
        const priority=interactiveWaiters>0,chunk=priority?INTERACTIVE_CHUNK:CHUNK,end=Math.min(i+chunk,src.length);
        for(;i<end;i++){
          const r=src[i],name=storeName(r);
          let bucket=map.get(name);
          if(!bucket){bucket=[];map.set(name,bucket)}
          bucket.push(r);
        }
        if(i<src.length)await yieldToBrowser(priority);
      }
      if(gen!==generation||src!==source)return false;
      ready=true;building=null;
      return true;
    })().catch(()=>{building=null;return false});
    return building;
  };

  const rowsForStoreAsync=async name=>{
    if(!matches())reset();
    const key=String(name||'');
    if(ready)return index.get(key)||[];

    // Normalna ścieżka interaktywna: targeted scan / gotowy row-index.
    // Nie budujemy całego indeksu wszystkich sklepów tylko dlatego, że użytkownik kliknął jeden sklep.
    if(targetedAsync){
      interactiveWaiters++;
      try{
        const out=await targetedAsync(key);
        if(Array.isArray(out))return out;
      }catch{}
      finally{interactiveWaiters=Math.max(0,interactiveWaiters-1)}
    }

    // Fallback wyłącznie gdy targeted path jest niedostępny.
    interactiveWaiters++;
    try{
      await build();
      return ready?index.get(key)||[]:[];
    }finally{interactiveWaiters=Math.max(0,interactiveWaiters-1)}
  };
  const rowsForStore=name=>{
    if(!matches())reset();
    return ready?index.get(String(name||''))||[]:[];
  };

  const install=()=>{
    const fast=window.PanParagonStoreClickFast,idx=window.PanParagonStoreYearDetail;
    if(!fast)return;
    if(!fast.__baseRowsForStoreAsync)fast.__baseRowsForStoreAsync=fast.rowsForStoreAsync?.bind(fast);
    if(!fast.__baseRowsForStore)fast.__baseRowsForStore=fast.rowsForStore?.bind(fast);
    targetedAsync=fast.__baseRowsForStoreAsync||fast.rowsForStoreAsync?.bind(fast)||null;
    fast.rowsForStoreAsync=rowsForStoreAsync;
    fast.rowsForStore=rowsForStore;
    fast.whenIndexed=build;
    fast.isIndexed=()=>ready&&matches();
    if(idx)idx.rowsForStore=rowsForStore;
    reset();

    // Celowo bez automatycznego background build.
    // store-row-index jest zapełniany podczas głównego renderu, a targetedAsync obsługuje pierwszy klik.
    document.addEventListener('panparagon:data-changed',e=>{
      const main=e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast';
      if(main&&matches())return;
      reset();
    });
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
