(()=>{
  const original=window.rowDate;
  if(typeof original!=='function')return;
  let cache=new WeakMap();
  let lastCol=String(dateCol||'');
  const invalidate=()=>{cache=new WeakMap();lastCol=String(dateCol||'')};
  const get=r=>{
    const col=String(dateCol||'');
    if(col!==lastCol)invalidate();
    if(!r||typeof r!=='object')return original(r);
    const hit=cache.get(r);
    if(hit)return hit;
    const date=original(r);
    cache.set(r,date);
    return date;
  };
  window.rowDate=get;
  window.PanParagonDateCache={get,invalidate};
})();