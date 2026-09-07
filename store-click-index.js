(()=>{
  const CHUNK=1200;
  let source=null,sourceLen=-1,sourceStoreCol='',generation=0,ready=false,building=null,index=new Map();

  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const signature=()=>({src:Array.isArray(rows)?rows:[],len:Array.isArray(rows)?rows.length:0,sc:String(typeof storeCol!=='undefined'?storeCol:'')});
  const matches=()=>{const s=signature();return s.src===source&&s.len===sourceLen&&s.sc===sourceStoreCol};
  const reset=()=>{const s=signature();source=s.src;sourceLen=s.len;sourceStoreCol=s.sc;index=new Map();ready=false;building=null;generation++};
  const yieldToBrowser=()=>new Promise(resolve=>{
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
        const end=Math.min(i+CHUNK,src.length);
        for(;i<end;i++){
          const r=src[i],name=storeName(r);
          let bucket=map.get(name);
          if(!bucket){bucket=[];map.set(name,bucket)}
          bucket.push(r);
        }
        if(i<src.length)await yieldToBrowser();
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
    await build();
    return ready?index.get(key)||[]:[];
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
    fast.rowsForStoreAsync=rowsForStoreAsync;
    fast.rowsForStore=rowsForStore;
    fast.whenIndexed=build;
    fast.isIndexed=()=>ready&&matches();
    if(idx)idx.rowsForStore=rowsForStore;
    reset();
    const start=()=>build();
    if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:1500});else setTimeout(start,300);
    document.addEventListener('panparagon:data-changed',e=>{
      if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
      reset();
      if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:1200});else setTimeout(start,200);
    });
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
