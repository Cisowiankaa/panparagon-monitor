(()=>{
  let done=false,tries=0;
  const run=()=>{
    if(done)return;
    const api=window.PanParagonStoreYearDetail;
    if(!api?.rowsForStore||!Array.isArray(window.rows||rows)||!(window.rows||rows).length){
      if(++tries<120)setTimeout(run,100);
      return;
    }
    done=true;
    try{api.rowsForStore('__ppm_index_prewarm__')}catch(e){done=false;console.warn('Store index prewarm fallback',e)}
  };
  const schedule=()=>{
    if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:2200});
    else setTimeout(run,900);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
