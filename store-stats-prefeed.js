(()=>{
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const build=name=>{
    const idx=window.PanParagonStoreYearDetail;
    if(!name||!idx?.rowsForStore)return null;
    const src=idx.rowsForStore(name);
    if(!Array.isArray(src))return null;
    const months={},years={};let total=0;
    for(const r of src){
      total++;
      const d=cachedDate(r);if(!d)continue;
      const k=mk(d),y=String(d.getFullYear());
      months[k]=(months[k]||0)+1;
      years[y]=(years[y]||0)+1;
    }
    return{store:name,months,allMonths:months,years,total};
  };
  const feed=()=>{
    const detail=document.getElementById('storeDetail');
    if(!detail?.classList.contains('on'))return;
    const name=(document.getElementById('storeDetailTitle')?.textContent||'').replace(/\s—\s\d{4}$/,'').trim();
    const data=build(name);if(!data)return;
    document.dispatchEvent(new CustomEvent('panparagon:store-fast-data',{detail:data}));
  };
  const install=()=>{
    const detail=document.getElementById('storeDetail');if(!detail)return;
    new MutationObserver(feed).observe(detail,{attributes:true,attributeFilter:['class']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
