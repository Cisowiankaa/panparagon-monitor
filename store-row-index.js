(()=>{
  const dateCache=window.PanParagonDateCache;
  if(!dateCache||typeof dateCache.get!=='function')return;

  const baseGet=dateCache.get.bind(dateCache);
  let source=null,sourceLen=-1,storeColKey='',seen=new WeakSet(),seenCount=0,byStore=new Map();

  const currentRows=()=>Array.isArray(rows)?rows:[];
  const currentStoreCol=()=>String(typeof storeCol!=='undefined'?storeCol:'');
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const reset=()=>{
    source=currentRows();sourceLen=source.length;storeColKey=currentStoreCol();
    seen=new WeakSet();seenCount=0;byStore=new Map();
  };
  const ensureSource=()=>{
    const src=currentRows(),sc=currentStoreCol();
    if(src!==source||src.length!==sourceLen||sc!==storeColKey)reset();
    return src;
  };
  const capture=r=>{
    if(!r||typeof r!=='object'||seen.has(r))return;
    if(seenCount>=sourceLen){
      const src=currentRows(),sc=currentStoreCol();
      if(src!==source||src.length!==sourceLen||sc!==storeColKey)reset();
    }
    seen.add(r);seenCount++;
    const name=storeName(r);
    let bucket=byStore.get(name);
    if(!bucket){bucket=[];byStore.set(name,bucket)}
    bucket.push(r);
  };

  dateCache.get=r=>{
    const out=baseGet(r);
    capture(r);
    return out;
  };
  // Main renderer calls window.rowDate directly. Point it at the indexed cache
  // wrapper so the store->rows index is populated during the existing date pass
  // instead of forcing a separate 35k-row scan on the first store click.
  window.rowDate=dateCache.get;

  const ready=()=>{const src=ensureSource();return src.length===0||seenCount>=src.length};
  const rowsForStore=name=>{ensureSource();return ready()?(byStore.get(String(name||''))||[]):null};
  const invalidate=()=>reset();
  reset();

  window.PanParagonStoreRowIndex={rowsForStore,isReady:ready,invalidate,size:()=>byStore.size,seen:()=>seenCount};

  const bridge=()=>{
    const fast=window.PanParagonStoreClickFast;
    if(!fast){setTimeout(bridge,100);return}
    if(fast.__rowIndexBridge)return;
    fast.__rowIndexBridge=true;
    const baseAsync=typeof fast.rowsForStoreAsync==='function'?fast.rowsForStoreAsync.bind(fast):null;
    const baseSync=typeof fast.rowsForStore==='function'?fast.rowsForStore.bind(fast):null;
    fast.rowsForStoreAsync=async name=>{
      const indexed=rowsForStore(name);
      if(Array.isArray(indexed))return indexed;
      return baseAsync?baseAsync(name):(baseSync?baseSync(name):[]);
    };
    fast.rowsForStore=name=>{
      const indexed=rowsForStore(name);
      if(Array.isArray(indexed))return indexed;
      return baseSync?baseSync(name):[];
    };
  };
  setTimeout(bridge,100);

  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    invalidate();
  });
})();
