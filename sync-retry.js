(()=>{
  const KEY='ppm_sync_retry_queue';
  const MAX_DELAY=15*60*1000;
  const BASE_DELAY=30000;
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=q=>localStorage.setItem(KEY,JSON.stringify(q));
  const now=()=>Date.now();
  const get=(hash)=>load()[hash]||{status:'oczekuje',attempts:0,lastError:'',nextRetry:0,updatedAt:0};
  const set=(hash,status,error='')=>{
    const q=load(),old=q[hash]||{attempts:0};
    let attempts=old.attempts||0,nextRetry=0;
    if(status==='błąd'){
      attempts++;
      nextRetry=now()+Math.min(MAX_DELAY,BASE_DELAY*Math.pow(2,Math.min(attempts-1,5)));
    }else if(status==='zsynchronizowany') attempts=0;
    q[hash]={status,attempts,lastError:error||'',nextRetry,updatedAt:now()};
    save(q);
    window.dispatchEvent(new CustomEvent('ppm-sync-state-change',{detail:{hash,...q[hash]}}));
    return q[hash];
  };
  const due=(hash,force=false)=>{const s=get(hash);return force||s.status!=='błąd'||!s.nextRetry||s.nextRetry<=now()};
  const failed=()=>Object.entries(load()).filter(([,v])=>v.status==='błąd');
  const clearSynced=hashes=>{const q=load();for(const h of hashes){if(q[h])q[h]={status:'zsynchronizowany',attempts:0,lastError:'',nextRetry:0,updatedAt:now()}}save(q)};
  const cleanup=validHashes=>{const valid=new Set(validHashes),q=load();let changed=false;for(const h of Object.keys(q)){if(!valid.has(h)&&q[h].status!=='błąd'){delete q[h];changed=true}}if(changed)save(q)};
  window.PanParagonSyncRetry={get,set,due,failed,clearSynced,cleanup,load};
  setInterval(()=>window.dispatchEvent(new CustomEvent('ppm-sync-retry-tick')),60000);
  window.addEventListener('online',()=>window.dispatchEvent(new CustomEvent('ppm-sync-retry-tick')));
})();
