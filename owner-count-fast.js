(()=>{
  const dash=()=>document.getElementById('dash');
  const idle=fn=>{
    if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout:1200});
    else setTimeout(fn,120);
  };
  let idleQueued=false;
  const queueFullOwnerView=()=>{
    if(idleQueued)return;
    idleQueued=true;
    idle(()=>{
      idleQueued=false;
      try{window.PanParagonOwners?.refreshViews?.()}catch(e){console.warn('Owner idle refresh fallback',e)}
    });
  };
  const install=()=>{
    if(typeof render!=='function'||render.__ppmOwnerCountFast)return;
    const base=render;
    const fast=function(...args){
      const d=dash(),wasOn=!!d?.classList.contains('on');
      if(wasOn)d.classList.remove('on');
      try{return base.apply(this,args)}
      finally{
        if(wasOn){d.classList.add('on');queueFullOwnerView()}
      }
    };
    fast.__ppmOwnerCountFast=true;
    render=fast;
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
