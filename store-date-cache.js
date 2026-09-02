(()=>{
  const original=window.rowDate;
  if(typeof original!=='function')return;
  let cache=new WeakMap();
  let lastCol=String(dateCol||'');
  const invalidate=()=>{cache=new WeakMap();lastCol=String(dateCol||'')};
  const directDate=r=>{
    const col=String(dateCol||'');
    if(!col||!r||typeof r!=='object'||r[col]==null||r[col]==='')return null;
    try{return typeof pd==='function'?pd(r[col]):null}catch{return null}
  };
  const get=r=>{
    const col=String(dateCol||'');
    if(col!==lastCol)invalidate();
    if(!r||typeof r!=='object')return original(r);
    if(cache.has(r))return cache.get(r);
    const direct=directDate(r);
    const date=direct||original(r);
    cache.set(r,date||null);
    return date||null;
  };
  window.rowDate=get;
  window.PanParagonDateCache={get,invalidate};
})();