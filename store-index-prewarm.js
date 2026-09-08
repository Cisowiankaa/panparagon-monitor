(()=>{
  let done=false,tries=0,running=false;

  const rowIndexReady=()=>{
    try{return !!window.PanParagonStoreRowIndex?.isReady?.()}catch{return false}
  };

  const run=async()=>{
    if(done||running)return;
    const list=Array.isArray(window.rows||rows)?(window.rows||rows):[];
    if(!list.length){
      if(++tries<120)setTimeout(schedule,100);
      return;
    }
    if(rowIndexReady()){done=true;return}

    const fast=window.PanParagonStoreClickFast;
    if(!fast||typeof fast.whenIndexed!=='function'){
      if(++tries<120)setTimeout(schedule,100);
      return;
    }

    running=true;
    try{
      const ok=await fast.whenIndexed();
      done=!!ok||rowIndexReady()||!!fast.isIndexed?.();
    }catch(e){
      console.warn('Store index prewarm fallback',e);
    }finally{
      running=false;
      if(!done&&++tries<120)setTimeout(schedule,150);
    }
  };

  const schedule=()=>{
    if(done||running)return;
    if('requestIdleCallback'in window)requestIdleCallback(()=>run(),{timeout:2200});
    else setTimeout(()=>run(),900);
  };

  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
    done=false;tries=0;schedule();
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
