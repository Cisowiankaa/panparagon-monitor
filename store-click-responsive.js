(()=>{
  const fast=window.PanParagonStoreClickFast;
  if(!fast)return;

  const CHUNK=900;
  let source=null,sourceLen=-1,sourceStoreCol='',generation=0;
  const cache=new Map(),pending=new Map();

  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const signature=()=>({src:Array.isArray(rows)?rows:[],len:Array.isArray(rows)?rows.length:0,sc:String(typeof storeCol!=='undefined'?storeCol:'')});
  const ensureSource=()=>{
    const s=signature();
    if(s.src!==source||s.len!==sourceLen||s.sc!==sourceStoreCol){
      source=s.src;sourceLen=s.len;sourceStoreCol=s.sc;cache.clear();pending.clear();generation++;
    }
    return source;
  };
  const yieldFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));

  const targeted=async name=>{
    const src=ensureSource(),key=String(name||'');
    if(fast.isIndexed?.()){
      const indexed=fast.rowsForStore?.(key);
      if(Array.isArray(indexed))return indexed;
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

  const indexedAsync=typeof fast.rowsForStoreAsync==='function'?fast.rowsForStoreAsync.bind(fast):null;
  fast.rowsForStoreAsync=async name=>{
    ensureSource();
    if(indexedAsync){
      try{
        const indexed=await indexedAsync(name);
        if(Array.isArray(indexed))return indexed;
      }catch{}
    }
    return targeted(name);
  };

  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    source=null;sourceLen=-1;sourceStoreCol='';cache.clear();pending.clear();generation++;
  });

  window.PanParagonStoreClickResponsive={rowsForStoreAsync:targeted,chunk:CHUNK};
})();
