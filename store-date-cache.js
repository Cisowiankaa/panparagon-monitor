(()=>{
  const cache=new WeakMap();
  const get=r=>{
    if(!r||typeof r!=='object')return rowDate(r);
    const col=String(dateCol||''),hit=cache.get(r);
    if(hit&&hit.col===col)return hit.date;
    const date=rowDate(r);
    cache.set(r,{col,date});
    return date;
  };
  const clear=()=>{};
  window.PanParagonDateCache={get,clear};
})();