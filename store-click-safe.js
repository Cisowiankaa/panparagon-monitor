(()=>{
  const fast=window.PanParagonStoreClickFast;if(!fast)return;
  const CHUNK=1800;
  let src=null,len=-1,sc='',generation=0;
  const cache=new Map(),pending=new Map();
  const storeName=r=>{try{return (r?.[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const ensure=()=>{
    const next=Array.isArray(rows)?rows:[],nextSc=String(typeof storeCol!=='undefined'?storeCol:'');
    if(next!==src||next.length!==len||nextSc!==sc){src=next;len=next.length;sc=nextSc;cache.clear();pending.clear();generation++}
    return src;
  };
  const direct=name=>{
    try{
      const idx=window.PanParagonStoreRowIndex;
      if(!idx?.isReady?.()||typeof idx.rowsForStore!=='function')return null;
      const out=idx.rowsForStore(name);return Array.isArray(out)?out:null;
    }catch{return null}
  };
  const yieldFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  const rowsForStoreAsync=name=>{
    const source=ensure(),key=String(name||'');
    const indexed=direct(key);if(indexed){cache.set(key,indexed);return Promise.resolve(indexed)}
    if(cache.has(key))return Promise.resolve(cache.get(key));
    if(pending.has(key))return pending.get(key);
    const gen=generation;
    const job=(async()=>{
      const out=[];
      for(let i=0;i<source.length;){
        if(gen!==generation||source!==src)return [];
        const end=Math.min(i+CHUNK,source.length);
        for(;i<end;i++){const r=source[i];if(storeName(r)===key)out.push(r)}
        if(i<source.length)await yieldFrame();
      }
      if(gen===generation&&source===src)cache.set(key,out);
      return out;
    })().finally(()=>pending.delete(key));
    pending.set(key,job);return job;
  };
  fast.rowsForStoreAsync=rowsForStoreAsync;
  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    src=null;len=-1;sc='';cache.clear();pending.clear();generation++;
  });
  window.PanParagonStoreClickSafe={rowsForStoreAsync,chunk:CHUNK};
})();
