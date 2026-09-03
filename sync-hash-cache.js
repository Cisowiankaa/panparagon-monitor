(()=>{
  if(typeof rowHash!=='function'||typeof rowKey!=='function'||typeof mergeRows!=='function'||typeof getUnsyncedRows!=='function'||typeof getCloudOnlyCount!=='function')return;
  const originalRowHash=rowHash,originalRowKey=rowKey;
  const PREWARM_CHUNK=500;
  let hashCache=new WeakMap(),keyCache=new WeakMap();
  let localRowsRef=null,localLen=-1,localHashes=null,localEntries=null,hashBuckets=null;
  let pendingRowsRef=null,pendingLen=-1,pendingCloudRef=null,pendingCloudSize=-1,pendingRows=null;
  let cloudOnlyRowsRef=null,cloudOnlyLen=-1,cloudOnlyCloudRef=null,cloudOnlyCloudSize=-1,cloudOnlyValue=null;
  let prewarmToken=0,prewarmScheduled=false,prewarmRunning=false;

  const isInternalKey=k=>String(k).startsWith('__ppm_');
  const canonicalRowKey=row=>JSON.stringify(Object.keys(row).filter(k=>!isInternalKey(k)).sort().reduce((o,k)=>(o[k]=String(row[k]??'').trim(),o),{}));
  const cachedRowKey=row=>{
    if(!row||typeof row!=='object')return originalRowKey(row);
    if(keyCache.has(row))return keyCache.get(row);
    const k=canonicalRowKey(row);keyCache.set(row,k);return k;
  };
  const cachedRowHash=row=>{
    if(!row||typeof row!=='object')return originalRowHash(row);
    if(hashCache.has(row))return hashCache.get(row);
    const key=cachedRowKey(row);
    const h=typeof fastHash==='function'?fastHash(key):originalRowHash(Object.keys(row).filter(k=>!isInternalKey(k)).reduce((o,k)=>(o[k]=row[k],o),{}));
    hashCache.set(row,h);return h;
  };
  const resetCloudDerived=()=>{
    pendingRowsRef=null;pendingLen=-1;pendingRows=null;pendingCloudRef=null;pendingCloudSize=-1;
    cloudOnlyRowsRef=null;cloudOnlyLen=-1;cloudOnlyCloudRef=null;cloudOnlyCloudSize=-1;cloudOnlyValue=null;
  };
  const invalidateAggregates=()=>{prewarmToken++;prewarmScheduled=false;prewarmRunning=false;localRowsRef=null;localLen=-1;localHashes=null;localEntries=null;hashBuckets=null;resetCloudDerived()};

  const commitLocal=(src,hashes,entries,buckets)=>{
    localRowsRef=src;localLen=src.length;localHashes=hashes;localEntries=entries;hashBuckets=buckets;resetCloudDerived();
  };

  const ensureLocal=()=>{
    const src=Array.isArray(rows)?rows:[];
    if(src===localRowsRef&&src.length===localLen&&localHashes&&localEntries&&hashBuckets)return;
    const hashes=new Set(),entries=new Array(src.length),buckets=new Map();
    for(let i=0;i<src.length;i++){
      const r=src[i],h=cachedRowHash(r);hashes.add(h);entries[i]=[r,h];
      const bucket=buckets.get(h);if(bucket)bucket.push(r);else buckets.set(h,[r]);
    }
    commitLocal(src,hashes,entries,buckets);
  };

  const schedulePrewarm=()=>{
    if(prewarmScheduled||prewarmRunning)return;
    const src=Array.isArray(rows)?rows:[];
    if(!src.length||src===localRowsRef&&src.length===localLen)return;
    prewarmScheduled=true;
    const token=++prewarmToken,ref=src,len=src.length;
    const start=()=>{
      prewarmScheduled=false;
      if(token!==prewarmToken||rows!==ref||ref.length!==len)return;
      prewarmRunning=true;
      const hashes=new Set(),entries=new Array(len),buckets=new Map();let offset=0;
      const step=deadline=>{
        if(token!==prewarmToken||rows!==ref||ref.length!==len){prewarmRunning=false;return}
        let processed=0;
        while(offset<len&&processed<PREWARM_CHUNK&&(!deadline||typeof deadline.timeRemaining!=='function'||deadline.timeRemaining()>1)){
          const r=ref[offset],h=cachedRowHash(r);hashes.add(h);entries[offset]=[r,h];
          const bucket=buckets.get(h);if(bucket)bucket.push(r);else buckets.set(h,[r]);
          offset++;processed++;
        }
        if(offset<len){
          if(typeof requestIdleCallback==='function')requestIdleCallback(step,{timeout:120});
          else setTimeout(()=>step(null),0);
          return;
        }
        prewarmRunning=false;
        if(token===prewarmToken&&rows===ref&&ref.length===len)commitLocal(ref,hashes,entries,buckets);
      };
      if(typeof requestIdleCallback==='function')requestIdleCallback(step,{timeout:120});
      else setTimeout(()=>step(null),0);
    };
    if(typeof requestIdleCallback==='function')requestIdleCallback(start,{timeout:800});
    else setTimeout(start,250);
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
    isInternalKey,
    prewarm:schedulePrewarm,
    invalidate:()=>{hashCache=new WeakMap();keyCache=new WeakMap();invalidateAggregates();schedulePrewarm()},
    invalidateAggregates:()=>{invalidateAggregates();schedulePrewarm()},
    invalidatePending:resetCloudDerived
  };
  document.addEventListener('panparagon:data-changed',()=>{invalidateAggregates();schedulePrewarm()});
  window.addEventListener('load',()=>setTimeout(schedulePrewarm,0),{once:true});
  setTimeout(schedulePrewarm,600);
})();
