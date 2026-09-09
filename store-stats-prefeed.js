(()=>{
  const cleanStoreName=()=>String(document.getElementById('storeDetailTitle')?.textContent||'')
    .replace(/\s—\sładowanie…$/,'')
    .replace(/\s—\s\d{4}$/,'')
    .trim();

  let token=0,lastFastAt=0;
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

  const fallbackFeed=async myToken=>{
    await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
    if(myToken!==token||performance.now()-lastFastAt<40)return;
    const detail=document.getElementById('storeDetail');
    if(!detail?.classList.contains('on'))return;
    const data=build(cleanStoreName());
    if(!data)return;
    document.dispatchEvent(new CustomEvent('panparagon:store-fast-data',{detail:{...data,prefeedFallback:true}}));
  };

  const install=()=>{
    const detail=document.getElementById('storeDetail');if(!detail)return;
    document.addEventListener('panparagon:store-fast-data',e=>{
      if(e?.detail?.prefeedFallback)return;
      lastFastAt=performance.now();
    });
    new MutationObserver(()=>{
      if(!detail.classList.contains('on'))return;
      const myToken=++token;
      fallbackFeed(myToken);
    }).observe(detail,{attributes:true,attributeFilter:['class']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
