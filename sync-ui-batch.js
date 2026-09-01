(()=>{
  let depth=0,dirtyCounters=false,dirtyPanel=false;
  let baseCounters=null,basePanel=null,basePush=null;
  const batching=()=>depth>0;
  const flush=()=>{
    if(depth>0)return;
    if(dirtyCounters&&baseCounters){dirtyCounters=false;dirtyPanel=false;baseCounters();return}
    if(dirtyPanel&&basePanel){dirtyPanel=false;basePanel()}
  };
  const install=()=>{
    try{
      if(typeof updateUnsyncedPanel==='function'&&!basePanel){
        basePanel=updateUnsyncedPanel;
        updateUnsyncedPanel=function(){if(batching()){dirtyPanel=true;return}return basePanel()};
      }
      if(typeof updateSyncCounters==='function'&&!baseCounters){
        baseCounters=updateSyncCounters;
        updateSyncCounters=function(){if(batching()){dirtyCounters=true;return}return baseCounters()};
      }
      if(typeof cloudPush==='function'&&!basePush){
        basePush=cloudPush;
        cloudPush=async function(...args){
          depth++;
          try{return await basePush(...args)}
          finally{depth=Math.max(0,depth-1);flush()}
        };
      }
    }catch(e){console.warn('Sync UI batch fallback',e)}
  };
  window.PanParagonSyncBatch={
    isBatching:batching,
    markPanel:()=>{dirtyPanel=true},
    markCounters:()=>{dirtyCounters=true},
    flush
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
