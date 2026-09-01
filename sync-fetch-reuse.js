(()=>{
  if(typeof autoSync!=='function'||typeof fetchCloudRows!=='function'||typeof fetchCloudHashes!=='function')return;
  const baseAutoSync=autoSync;
  const baseFetchRows=fetchCloudRows;
  const baseFetchHashes=fetchCloudHashes;
  const baseLogSync=typeof logSync==='function'?logSync:null;
  let autoDepth=0,freshHashReads=0;

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

  autoSync=async function(...args){
    autoDepth++;
    if(autoDepth===1)freshHashReads=0;
    try{return await baseAutoSync(...args)}
    finally{
      autoDepth=Math.max(0,autoDepth-1);
      if(autoDepth===0)freshHashReads=0;
    }
  };

  window.PanParagonSyncFetchReuse={
    isAutoSync:()=>autoDepth>0,
    hasFreshCloudRows:()=>freshHashReads>0,
    remainingFreshHashReads:()=>freshHashReads
  };
})();
