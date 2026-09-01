(()=>{
  const original=window.rowDate;
  if(typeof original!=='function')return;
  const cache=new WeakMap();
  const get=r=>{
    if(!r||typeof r!=='object')return original(r);
    const col=String(dateCol||''),hit=cache.get(r);
    if(hit&&hit.col===col)return hit.date;
    const date=original(r);
    cache.set(r,{col,date});
    return date;
  };
  window.rowDate=get;
  window.PanParagonDateCache={get};
})();