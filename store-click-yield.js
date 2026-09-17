(()=>{
  const fast=window.PanParagonStoreClickFast;
  if(!fast||typeof fast.rowsForStoreAsync!=='function'||fast.__yield250)return;
  fast.__yield250=true;

  const baseAsync=fast.rowsForStoreAsync.bind(fast);
  const CHUNK=250;
  let source=null,sourceLen=-1,storeKey='',generation=0;
  const pending=new Map();

  const currentRows=()=>Array.isArray(rows)?rows:[];
  const currentStoreCol=()=>String(typeof storeCol!=='undefined'?storeCol:'');
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const ensureSignature=()=>{
    const src=currentRows(),sc=currentStoreCol();
    if(src!==source||src.length!==sourceLen||sc!==storeKey){source=src;sourceLen=src.length;storeKey=sc;generation++;pending.clear()}
    return src;
  };
  const nextFrame=fn=>{if(typeof requestAnimationFrame==='function')requestAnimationFrame(fn);else setTimeout(fn,0)};

  fast.rowsForStoreAsync=name=>{
    const src=ensureSignature(),key=String(name||'');
    try{
      const idx=window.PanParagonStoreRowIndex;
      if(idx?.isReady?.())return baseAsync(key);
    }catch{}
    if(pending.has(key))return pending.get(key);

    const gen=generation,out=[];let i=0;
    const promise=new Promise(resolve=>{
      const step=()=>{
        if(gen!==generation||src!==source){pending.delete(key);resolve([]);return}
        const end=Math.min(i+CHUNK,src.length);
        for(;i<end;i++){const r=src[i];if(storeName(r)===key)out.push(r)}
        if(i<src.length){nextFrame(step);return}
        pending.delete(key);resolve(out);
      };
      step();
    });
    pending.set(key,promise);
    return promise;
  };

  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    source=null;sourceLen=-1;storeKey='';generation++;pending.clear();
  });

  window.PanParagonStoreClickYield={chunk:CHUNK};
})();
