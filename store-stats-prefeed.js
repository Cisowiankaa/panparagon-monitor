(()=>{
  const cleanStoreName=()=>String(document.getElementById('storeDetailTitle')?.textContent||'')
    .replace(/\s—\sładowanie…$/,'')
    .replace(/\s—\s\d{4}$/,'')
    .trim();

  const build=name=>{
    if(!name)return null;
    const fast=window.PanParagonStoreClickFast;
    if(typeof fast?.statsForStore!=='function')return null;
    try{
      const stats=fast.statsForStore(name);
      if(!stats||typeof stats!=='object')return null;
      return{
        store:name,
        months:stats.months||{},
        allMonths:stats.months||{},
        years:stats.years||{},
        total:Number(stats.total||0)
      };
    }catch{return null}
  };

  const feed=()=>{
    const detail=document.getElementById('storeDetail');
    if(!detail?.classList.contains('on'))return;
    const data=build(cleanStoreName());
    if(!data)return;
    document.dispatchEvent(new CustomEvent('panparagon:store-fast-data',{detail:data}));
  };

  const install=()=>{
    const detail=document.getElementById('storeDetail');if(!detail)return;
    new MutationObserver(feed).observe(detail,{attributes:true,attributeFilter:['class']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
