(()=>{
  if(typeof autoSync!=='function'||typeof fetchCloudRows!=='function'||typeof fetchCloudHashes!=='function')return;
  const baseAutoSync=autoSync;
  const baseFetchRows=fetchCloudRows;
  const baseFetchHashes=fetchCloudHashes;
  const baseRefreshUser=typeof refreshUser==='function'?refreshUser:null;
  const baseLogSync=typeof logSync==='function'?logSync:null;
  const baseMergeRows=typeof mergeRows==='function'?mergeRows:null;
  const baseRender=typeof render==='function'?render:null;
  const baseCloudPush=typeof cloudPush==='function'?cloudPush:null;
  const baseLoadHistory=typeof loadHistory==='function'?loadHistory:null;
  let autoDepth=0,freshHashReads=0,autoAdded=0,autoUserChecked=false,autoUserValue=null,insideCloudPush=0;

  fetchCloudRows=async function(...args){
    const out=await baseFetchRows(...args);
    if(autoDepth>0)freshHashReads=2;
    return out;
  };

  fetchCloudHashes=async function(...args){
    if(autoDepth>0&&freshHashReads>0&&cloudHashes instanceof Set){
      freshHashReads--;
      return cloudHashes;
    }
    return baseFetchHashes(...args);
  };

  if(baseRefreshUser){
    refreshUser=async function(...args){
      if(autoDepth>0&&autoUserChecked)return autoUserValue;
      const out=await baseRefreshUser(...args);
      if(autoDepth>0){autoUserChecked=true;autoUserValue=out}
      return out;
    };
  }

  if(baseLogSync){
    logSync=async function(direction,...args){
      if(autoDepth>0&&direction==='push')return;
      return baseLogSync(direction,...args);
    };
  }

  if(baseMergeRows){
    mergeRows=function(...args){
      const out=baseMergeRows(...args);
      if(autoDepth>0)autoAdded+=Number(out?.added||0);
      return out;
    };
  }

  if(baseRender){
    render=function(...args){
      if(autoDepth>0&&autoAdded===0)return;
      return baseRender(...args);
    };
  }

  if(baseCloudPush){
    cloudPush=async function(...args){
      const inAuto=autoDepth>0;
      if(inAuto)insideCloudPush++;
      try{return await baseCloudPush(...args)}
      finally{if(inAuto)insideCloudPush=Math.max(0,insideCloudPush-1)}
    };
  }

  if(baseLoadHistory){
    loadHistory=async function(...args){
      if(autoDepth>0&&insideCloudPush>0)return;
      return baseLoadHistory(...args);
    };
  }

  autoSync=async function(...args){
    autoDepth++;
    if(autoDepth===1){freshHashReads=0;autoAdded=0;autoUserChecked=false;autoUserValue=null;insideCloudPush=0}
    try{return await baseAutoSync(...args)}
    finally{
      autoDepth=Math.max(0,autoDepth-1);
      if(autoDepth===0){freshHashReads=0;autoAdded=0;autoUserChecked=false;autoUserValue=null;insideCloudPush=0}
    }
  };

  window.PanParagonSyncFetchReuse={
    isAutoSync:()=>autoDepth>0,
    hasFreshCloudRows:()=>freshHashReads>0,
    remainingFreshHashReads:()=>freshHashReads,
    hasCachedUser:()=>autoDepth>0&&autoUserChecked,
    isInsideCloudPush:()=>insideCloudPush>0,
    autoAdded:()=>autoAdded
  };
})();
