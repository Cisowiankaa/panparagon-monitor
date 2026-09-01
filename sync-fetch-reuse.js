(()=>{
  if(typeof autoSync!=='function'||typeof fetchCloudRows!=='function'||typeof fetchCloudHashes!=='function')return;
  const baseAutoSync=autoSync;
  const baseFetchRows=fetchCloudRows;
  const baseFetchHashes=fetchCloudHashes;
  let autoDepth=0,rowsFresh=false;

  fetchCloudRows=async function(...args){
    const out=await baseFetchRows(...args);
    if(autoDepth>0)rowsFresh=true;
    return out;
  };

  fetchCloudHashes=async function(...args){
    if(autoDepth>0&&rowsFresh&&cloudHashes instanceof Set){
      rowsFresh=false;
      return cloudHashes;
    }
    return baseFetchHashes(...args);
  };

  autoSync=async function(...args){
    autoDepth++;
    if(autoDepth===1)rowsFresh=false;
    try{return await baseAutoSync(...args)}
    finally{
      autoDepth=Math.max(0,autoDepth-1);
      if(autoDepth===0)rowsFresh=false;
    }
  };

  window.PanParagonSyncFetchReuse={
    isAutoSync:()=>autoDepth>0,
    hasFreshCloudRows:()=>rowsFresh
  };
})();
