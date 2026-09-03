(()=>{
  let depth=0,dirtyCounters=false,dirtyPanel=false,panelRuns=0;
  let baseCounters=null,basePanel=null,basePush=null,baseAuto=null;
  const batching=()=>depth>0;
  const integrationsVisible=()=>!!document.getElementById('integrations')?.classList.contains('on');
  const begin=()=>{depth++};
  const end=()=>{depth=Math.max(0,depth-1);flush()};
  const lightCounters=()=>{
    try{
      const local=document.getElementById('localCount');
      if(local)local.textContent=Array.isArray(rows)?rows.length:0;
      if(!integrationsVisible()){
        const diff=document.getElementById('diffCount');if(diff)diff.textContent='—';
        const status=document.getElementById('syncStatus');if(status){status.textContent=user?'GOTOWE':'WYLOGOWANO';status.className=user?'':'warntxt'}
        const sub=document.getElementById('syncStatusSub');if(sub)sub.textContent=user?'Otwórz Integracje, aby porównać':'Brak porównania';
        const mini=document.getElementById('syncMini');if(mini&&cloudTotal==null)mini.textContent='Zgodność: —';
      }
    }catch{}
  };
  const runPanel=()=>{if(!basePanel||!integrationsVisible())return;panelRuns++;return basePanel()};
  const runCounters=()=>{
    if(!baseCounters)return;
    if(!integrationsVisible()){lightCounters();return}
    return baseCounters();
  };
  const flush=()=>{
    if(depth>0)return;
    const needCounters=dirtyCounters,needPanel=dirtyPanel;
    dirtyCounters=false;dirtyPanel=false;
    if(needCounters&&baseCounters){
      const before=panelRuns;
      runCounters();
      if(needPanel&&integrationsVisible()&&panelRuns===before&&basePanel)runPanel();
      return;
    }
    if(needPanel&&basePanel)runPanel();
  };
  const refreshIntegrations=()=>{
    if(!integrationsVisible())return;
    try{baseCounters?.()}catch{}
    try{runPanel()}catch{}
    try{window.PanParagonSyncFilter?.render?.()}catch{}
  };
  const install=()=>{
    try{
      if(typeof updateUnsyncedPanel==='function'&&!basePanel){
        basePanel=updateUnsyncedPanel;
        updateUnsyncedPanel=function(){if(batching()){dirtyPanel=true;return}return runPanel()};
      }
      if(typeof updateSyncCounters==='function'&&!baseCounters){
        baseCounters=updateSyncCounters;
        updateSyncCounters=function(){if(batching()){dirtyCounters=true;lightCounters();return}return runCounters()};
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
      document.querySelectorAll('#nav button[data-v="integrations"]').forEach(b=>b.addEventListener('click',()=>setTimeout(refreshIntegrations,0)));
      lightCounters();
    }catch(e){console.warn('Sync UI batch fallback',e)}
  };
  window.PanParagonSyncBatch={
    isBatching:batching,
    depth:()=>depth,
    markPanel:()=>{dirtyPanel=true},
    markCounters:()=>{dirtyCounters=true},
    flush,
    refreshIntegrations
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
