(()=>{
  if(typeof autoSync!=='function'||typeof fetchCloudRows!=='function'||typeof fetchCloudHashes!=='function')return;
  const baseAutoSync=autoSync;
  const baseFetchRows=fetchCloudRows;
  const baseFetchHashes=fetchCloudHashes;
  const baseLogSync=typeof logSync==='function'?logSync:null;
  const baseMergeRows=typeof mergeRows==='function'?mergeRows:null;
  const baseRender=typeof render==='function'?render:null;
  let autoDepth=0,freshHashReads=0,autoAdded=0;

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

  autoSync=async function(...args){
    autoDepth++;
    if(autoDepth===1){freshHashReads=0;autoAdded=0}
    try{return await baseAutoSync(...args)}
    finally{
      autoDepth=Math.max(0,autoDepth-1);
      if(autoDepth===0){freshHashReads=0;autoAdded=0}
    }
  };

  window.PanParagonSyncFetchReuse={
    isAutoSync:()=>autoDepth>0,
    hasFreshCloudRows:()=>freshHashReads>0,
    remainingFreshHashReads:()=>freshHashReads,
    autoAdded:()=>autoAdded
  };
})();
