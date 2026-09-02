(()=>{
  if(typeof rowHash!=='function'||typeof rowKey!=='function'||typeof mergeRows!=='function'||typeof getUnsyncedRows!=='function'||typeof getCloudOnlyCount!=='function')return;
  const originalRowHash=rowHash,originalRowKey=rowKey;
  let hashCache=new WeakMap(),keyCache=new WeakMap();
  let localRowsRef=null,localLen=-1,localHashes=null,localEntries=null,hashBuckets=null;
  let pendingRowsRef=null,pendingLen=-1,pendingCloudRef=null,pendingCloudSize=-1,pendingRows=null;
  let cloudOnlyRowsRef=null,cloudOnlyLen=-1,cloudOnlyCloudRef=null,cloudOnlyCloudSize=-1,cloudOnlyValue=null;

  const cachedRowHash=row=>{
    if(!row||typeof row!=='object')return originalRowHash(row);
    if(hashCache.has(row))return hashCache.get(row);
    const h=originalRowHash(row);hashCache.set(row,h);return h;
  };
  const cachedRowKey=row=>{
    if(!row||typeof row!=='object')return originalRowKey(row);
    if(keyCache.has(row))return keyCache.get(row);
    const k=originalRowKey(row);keyCache.set(row,k);return k;
  };
  const resetCloudDerived=()=>{
    pendingRowsRef=null;pendingLen=-1;pendingRows=null;pendingCloudRef=null;pendingCloudSize=-1;
    cloudOnlyRowsRef=null;cloudOnlyLen=-1;cloudOnlyCloudRef=null;cloudOnlyCloudSize=-1;cloudOnlyValue=null;
  };
  const invalidateAggregates=()=>{localRowsRef=null;localLen=-1;localHashes=null;localEntries=null;hashBuckets=null;resetCloudDerived()};

  const ensureLocal=()=>{
    const src=Array.isArray(rows)?rows:[];
    if(src===localRowsRef&&src.length===localLen&&localHashes&&localEntries&&hashBuckets)return;
    localRowsRef=src;localLen=src.length;localHashes=new Set();localEntries=new Array(src.length);hashBuckets=new Map();
    for(let i=0;i<src.length;i++){
      const r=src[i],h=cachedRowHash(r);localHashes.add(h);localEntries[i]=[r,h];
      const bucket=hashBuckets.get(h);if(bucket)bucket.push(r);else hashBuckets.set(h,[r]);
    }
    resetCloudDerived();
  };

  rowHash=cachedRowHash;
  mergeRows=incoming=>{
    ensureLocal();let added=0,dup=0;
    for(const r of incoming||[]){
      const h=cachedRowHash(r),bucket=hashBuckets.get(h);let duplicate=false;
      if(bucket?.length){
        const k=cachedRowKey(r);
        for(const existing of bucket){if(cachedRowKey(existing)===k){duplicate=true;break}}
      }
      if(duplicate){dup++;continue}
      rows.push(r);added++;
      localHashes.add(h);localEntries.push([r,h]);
      if(bucket)bucket.push(r);else hashBuckets.set(h,[r]);
    }
    localRowsRef=rows;localLen=rows.length;resetCloudDerived();
    return{added,dup};
  };
  getUnsyncedRows=()=>{
    ensureLocal();
    const cloud=cloudHashes instanceof Set?cloudHashes:new Set();
    if(pendingRows&&pendingRowsRef===localRowsRef&&pendingLen===localLen&&pendingCloudRef===cloud&&pendingCloudSize===cloud.size)return pendingRows;
    const out=[];for(const [r,h] of localEntries)if(!cloud.has(h))out.push(r);
    pendingRowsRef=localRowsRef;pendingLen=localLen;pendingCloudRef=cloud;pendingCloudSize=cloud.size;pendingRows=out;
    return out;
  };
  getCloudOnlyCount=()=>{
    ensureLocal();
    const cloud=cloudHashes instanceof Set?cloudHashes:new Set();
    if(cloudOnlyValue!==null&&cloudOnlyRowsRef===localRowsRef&&cloudOnlyLen===localLen&&cloudOnlyCloudRef===cloud&&cloudOnlyCloudSize===cloud.size)return cloudOnlyValue;
    let n=0;for(const h of cloud)if(!localHashes.has(h))n++;
    cloudOnlyRowsRef=localRowsRef;cloudOnlyLen=localLen;cloudOnlyCloudRef=cloud;cloudOnlyCloudSize=cloud.size;cloudOnlyValue=n;
    return n;
  };

  window.PanParagonHashCache={
    get:cachedRowHash,
    key:cachedRowKey,
    invalidate:()=>{hashCache=new WeakMap();keyCache=new WeakMap();invalidateAggregates()},
    invalidateAggregates,
    invalidatePending:resetCloudDerived
  };
  document.addEventListener('panparagon:data-changed',invalidateAggregates);
})();
