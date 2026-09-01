(()=>{
  if(typeof rowHash!=='function'||typeof getUnsyncedRows!=='function'||typeof getCloudOnlyCount!=='function')return;
  const originalRowHash=rowHash;
  let hashCache=new WeakMap();
  let localRowsRef=null,localLen=-1,localHashes=null,localEntries=null;
  let pendingRowsRef=null,pendingLen=-1,pendingCloudRef=null,pendingCloudSize=-1,pendingRows=null;

  const cachedRowHash=row=>{
    if(!row||typeof row!=='object')return originalRowHash(row);
    if(hashCache.has(row))return hashCache.get(row);
    const h=originalRowHash(row);hashCache.set(row,h);return h;
  };

  const ensureLocal=()=>{
    const src=Array.isArray(rows)?rows:[];
    if(src===localRowsRef&&src.length===localLen&&localHashes&&localEntries)return;
    localRowsRef=src;localLen=src.length;localHashes=new Set();localEntries=new Array(src.length);
    for(let i=0;i<src.length;i++){
      const r=src[i],h=cachedRowHash(r);localHashes.add(h);localEntries[i]=[r,h];
    }
    pendingRowsRef=null;pendingRows=null;
  };

  rowHash=cachedRowHash;
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
    const cloud=cloudHashes instanceof Set?cloudHashes:new Set();let n=0;
    for(const h of cloud)if(!localHashes.has(h))n++;
    return n;
  };

  window.PanParagonHashCache={
    get:cachedRowHash,
    invalidate:()=>{hashCache=new WeakMap();localRowsRef=null;localLen=-1;localHashes=null;localEntries=null;pendingRowsRef=null;pendingRows=null;pendingCloudRef=null;pendingCloudSize=-1},
    invalidatePending:()=>{pendingRowsRef=null;pendingRows=null;pendingCloudRef=null;pendingCloudSize=-1}
  };
  document.addEventListener('panparagon:data-changed',()=>window.PanParagonHashCache.invalidate());
})();
