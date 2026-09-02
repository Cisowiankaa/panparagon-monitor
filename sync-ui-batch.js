(()=>{
  let depth=0,dirtyCounters=false,dirtyPanel=false,panelRuns=0;
  let baseCounters=null,basePanel=null,basePush=null,baseAuto=null;
  const batching=()=>depth>0;
  const begin=()=>{depth++};
  const end=()=>{depth=Math.max(0,depth-1);flush()};
  const runPanel=()=>{if(!basePanel)return;panelRuns++;return basePanel()};
  const flush=()=>{
    if(depth>0)return;
    const needCounters=dirtyCounters,needPanel=dirtyPanel;
    dirtyCounters=false;dirtyPanel=false;
    if(needCounters&&baseCounters){
      const before=panelRuns;
      baseCounters();
      if(needPanel&&panelRuns===before&&basePanel)runPanel();
      return;
    }
    if(needPanel&&basePanel)runPanel();
  };
  const install=()=>{
    try{
      if(typeof updateUnsyncedPanel==='function'&&!basePanel){
        basePanel=updateUnsyncedPanel;
        updateUnsyncedPanel=function(){if(batching()){dirtyPanel=true;return}return runPanel()};
      }
      if(typeof updateSyncCounters==='function'&&!baseCounters){
        baseCounters=updateSyncCounters;
        updateSyncCounters=function(){if(batching()){dirtyCounters=true;return}return baseCounters()};
      }
      if(typeof cloudPush==='function'&&!basePush){
        basePush=cloudPush;
        cloudPush=async function(...args){
          begin();
          try{return await basePush(...args)}
          finally{end()}
        };
      }
      if(typeof autoSync==='function'&&!baseAuto){
        baseAuto=autoSync;
        autoSync=async function(...args){
          begin();
          try{return await baseAuto(...args)}
          finally{end()}
        };
      }
    }catch(e){console.warn('Sync UI batch fallback',e)}
  };
  window.PanParagonSyncBatch={
    isBatching:batching,
    depth:()=>depth,
    markPanel:()=>{dirtyPanel=true},
    markCounters:()=>{dirtyCounters=true},
    flush
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
