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
  const clearSynced=hashes=>{const q=load();for(const h of hashes){q[h]={status:'zsynchronizowany',attempts:0,lastError:'',nextRetry:0,updatedAt:now()}}save(q)};
  const cleanup=validHashes=>{const valid=new Set(validHashes),q=load();let changed=false;for(const h of Object.keys(q)){if(!valid.has(h)&&q[h].status!=='błąd'){delete q[h];changed=true}}if(changed)save(q)};
  window.PanParagonSyncRetry={get,set,due,failed,clearSynced,cleanup,load};

  const labelFor=s=>({oczekuje:'oczekuje',wysyłanie:'wysyłanie…',zsynchronizowany:'zsynchronizowany ✓','błąd':'błąd'}[s]||s);
  const clsFor=s=>s==='zsynchronizowany'?'oktxt':s==='błąd'?'badtxt':'warntxt';
  const pendingRows=()=>{try{return rows.filter(r=>!cloudHashes.has(rowHash(r)))}catch{return[]}};
  const refreshBadges=()=>{
    const q=load(),errors=Object.values(q).filter(x=>x.status==='błąd').length;
    const el=document.getElementById('retryErrorCount');if(el)el.textContent=errors?`Błędy: ${errors}`:'Błędy: 0';
  };
  const renderPanel=()=>{
    const panel=document.getElementById('unsyncedPanel');if(!panel)return;
    try{
      if(!user){panel.innerHTML='<div class="empty">Zaloguj się, aby sprawdzić.</div>';refreshBadges();return}
      if(cloudTotal==null){panel.innerHTML='<div class="empty">Sprawdzanie chmury…</div>';refreshBadges();return}
      const pending=pendingRows(),shown=pending.slice(0,12);
      if(!pending.length){panel.innerHTML='<div class="empty oktxt">Wszystkie lokalne rekordy są w chmurze ✓</div>';refreshBadges();return}
      panel.innerHTML=`<div class="small" style="margin-bottom:8px">Oczekuje: <b>${pending.length}</b>. Pokazuję pierwsze ${shown.length}.</div>`+shown.map(r=>{
        const h=rowHash(r),st=get(h),d=rowDate(r),shop=(r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep';
        const retry=st.status==='błąd'&&st.nextRetry?`<div class="small">próba ${st.attempts} · ponów ${new Date(st.nextRetry).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}</div>`:'';
        return `<div class="pending-item"><span>${d?ml(mk(d)):'Bez daty'}</span><b>${esc(shop)}</b><span class="${clsFor(st.status)}">${labelFor(st.status)}${retry}</span></div>`
      }).join('');refreshBadges();
    }catch(e){panel.textContent='Nie udało się odświeżyć statusów: '+e.message}
  };

  const injectUI=()=>{
    const retryMissing=document.getElementById('retryMissing');if(!retryMissing||document.getElementById('retryErrors'))return;
    const btn=document.createElement('button');btn.id='retryErrors';btn.textContent='Ponów błędy';retryMissing.insertAdjacentElement('afterend',btn);
    const counter=document.createElement('span');counter.id='retryErrorCount';counter.className='pill';counter.textContent='Błędy: 0';btn.insertAdjacentElement('afterend',counter);
    btn.onclick=()=>retryFailed(true);
    refreshBadges();
  };

  let retryBusy=false;
  const retryFailed=async(force=false)=>{
    if(retryBusy||!navigator.onLine)return;
    const items=failed().filter(([h])=>due(h,force));if(!items.length){renderPanel();return}
    retryBusy=true;
    items.forEach(([h])=>set(h,'wysyłanie'));
    renderPanel();
    try{
      const ok=await originalCloudPush(true);
      if(ok){items.forEach(([h])=>cloudHashes.has(h)?set(h,'zsynchronizowany'):set(h,'błąd','Rekord nadal nieobecny w chmurze'))}
      else items.forEach(([h])=>set(h,'błąd','Synchronizacja nieudana'));
    }catch(e){items.forEach(([h])=>set(h,'błąd',e?.message||String(e)))}
    finally{retryBusy=false;renderPanel();refreshBadges()}
  };

  let originalCloudPush=null;
  const install=()=>{
    injectUI();
    try{
      if(typeof cloudPush==='function'&&!originalCloudPush){
        originalCloudPush=cloudPush;
        cloudPush=async function(silent=false){
          const pending=pendingRows(),hashes=pending.map(rowHash);
          hashes.forEach(h=>set(h,'wysyłanie'));renderPanel();
          let ok=false;
          try{ok=await originalCloudPush(silent)}catch(e){hashes.forEach(h=>set(h,'błąd',e?.message||String(e)));renderPanel();throw e}
          if(ok){hashes.forEach(h=>cloudHashes.has(h)?set(h,'zsynchronizowany'):set(h,'błąd','Brak potwierdzenia w chmurze'))}
          else hashes.forEach(h=>set(h,'błąd','Synchronizacja nieudana'));
          renderPanel();refreshBadges();return ok;
        };
      }
      if(typeof updateUnsyncedPanel==='function'){
        const base=updateUnsyncedPanel;
        updateUnsyncedPanel=function(){base();renderPanel()};
      }
    }catch{}
    renderPanel();refreshBadges();
  };

  window.addEventListener('ppm-sync-state-change',renderPanel);
  window.addEventListener('ppm-sync-retry-tick',()=>retryFailed(false));
  window.addEventListener('online',()=>retryFailed(false));
  setInterval(()=>window.dispatchEvent(new CustomEvent('ppm-sync-retry-tick')),60000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
