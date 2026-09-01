(()=>{
  const KEY='ppm_sync_retry_queue';
  const MAX_DELAY=15*60*1000;
  const BASE_DELAY=30000;
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=q=>localStorage.setItem(KEY,JSON.stringify(q));
  const now=()=>Date.now();
  const get=(hash)=>load()[hash]||{status:'oczekuje',attempts:0,lastError:'',nextRetry:0,updatedAt:0};
  const applyState=(old,status,error='')=>{
    let attempts=old?.attempts||0,nextRetry=0;
    if(status==='błąd'){
      attempts++;
      nextRetry=now()+Math.min(MAX_DELAY,BASE_DELAY*Math.pow(2,Math.min(attempts-1,5)));
    }else if(status==='zsynchronizowany') attempts=0;
    return{status,attempts,lastError:error||'',nextRetry,updatedAt:now()};
  };
  const set=(hash,status,error='')=>{
    const q=load();q[hash]=applyState(q[hash],status,error);save(q);
    window.dispatchEvent(new CustomEvent('ppm-sync-state-change',{detail:{hash,...q[hash]}}));
    return q[hash];
  };
  const setMany=(hashes,status,error='')=>{
    const list=[...new Set(hashes||[])];if(!list.length)return{};
    const q=load(),changed={};
    for(const h of list){q[h]=applyState(q[h],status,error);changed[h]=q[h]}
    save(q);
    window.dispatchEvent(new CustomEvent('ppm-sync-state-change',{detail:{batch:true,count:list.length,status}}));
    return changed;
  };
  const due=(hash,force=false)=>{const s=get(hash);return force||s.status!=='błąd'||!s.nextRetry||s.nextRetry<=now()};
  const failed=()=>Object.entries(load()).filter(([,v])=>v.status==='błąd');
  const clearSynced=hashes=>{const q=load();for(const h of hashes){q[h]={status:'zsynchronizowany',attempts:0,lastError:'',nextRetry:0,updatedAt:now()}}save(q)};
  const cleanup=validHashes=>{const valid=new Set(validHashes),q=load();let changed=false;for(const h of Object.keys(q)){if(!valid.has(h)&&q[h].status!=='błąd'){delete q[h];changed=true}}if(changed)save(q)};
  window.PanParagonSyncRetry={get,set,setMany,due,failed,clearSynced,cleanup,load};

  const labelFor=s=>({oczekuje:'oczekuje',wysyłanie:'wysyłanie…',zsynchronizowany:'zsynchronizowany ✓','błąd':'błąd'}[s]||s);
  const clsFor=s=>s==='zsynchronizowany'?'oktxt':s==='błąd'?'badtxt':'warntxt';
  const pendingRows=()=>{try{return typeof getUnsyncedRows==='function'?getUnsyncedRows():rows.filter(r=>!cloudHashes.has(rowHash(r)))}catch{return[]}};
  const fmtTime=t=>t?new Date(t).toLocaleString('pl-PL'):'—';

  const ensureSidebarCounter=()=>{
    if(document.getElementById('syncErrorMini'))return;
    const anchor=document.getElementById('pendingMini');if(!anchor)return;
    const el=document.createElement('div');el.id='syncErrorMini';el.className='small';el.style.marginTop='5px';el.textContent='Błędy synchronizacji: 0';anchor.insertAdjacentElement('afterend',el);
  };
  const refreshBadges=()=>{
    const q=load(),errors=Object.values(q).filter(x=>x.status==='błąd').length;
    const el=document.getElementById('retryErrorCount');if(el){el.textContent=`Błędy: ${errors}`;el.className='pill'+(errors?' bad':' ok')}
    const mini=document.getElementById('syncErrorMini');if(mini){mini.textContent=`Błędy synchronizacji: ${errors}`;mini.className='small '+(errors?'badtxt':'oktxt')}
  };
  const errorDetails=(h,st)=>{
    if(st.status!=='błąd')return '';
    const msg=st.lastError||'Nieznany błąd synchronizacji';
    return `<details style="grid-column:1/-1;margin-top:4px;padding:8px 10px;border:1px solid var(--l);border-radius:8px;background:#101821"><summary class="badtxt" style="cursor:pointer">Szczegóły błędu</summary><div class="small" style="margin-top:8px"><b>Rekord:</b> ${esc(h)}<br><b>Ostatni błąd:</b> ${esc(msg)}<br><b>Liczba prób:</b> ${st.attempts||0}<br><b>Ostatnia zmiana:</b> ${esc(fmtTime(st.updatedAt))}<br><b>Kolejna próba:</b> ${esc(fmtTime(st.nextRetry))}</div></details>`;
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
        return `<div class="pending-item"><span>${d?ml(mk(d)):'Bez daty'}</span><b>${esc(shop)}</b><span class="${clsFor(st.status)}">${labelFor(st.status)}${retry}</span>${errorDetails(h,st)}</div>`
      }).join('');refreshBadges();
    }catch(e){panel.textContent='Nie udało się odświeżyć statusów: '+e.message}
  };
  const injectUI=()=>{
    ensureSidebarCounter();const retryMissing=document.getElementById('retryMissing');if(!retryMissing)return;
    if(!document.getElementById('retryErrors')){
      const btn=document.createElement('button');btn.id='retryErrors';btn.textContent='Ponów błędy';retryMissing.insertAdjacentElement('afterend',btn);
      const counter=document.createElement('span');counter.id='retryErrorCount';counter.className='pill';counter.textContent='Błędy: 0';btn.insertAdjacentElement('afterend',counter);btn.onclick=()=>retryFailed(true);
    }
    refreshBadges();
  };

  let retryBusy=false;
  const retryFailed=async(force=false)=>{
    if(retryBusy||!navigator.onLine)return;
    const items=failed().filter(([h])=>due(h,force));if(!items.length){renderPanel();return}
    const hashes=items.map(([h])=>h);retryBusy=true;setMany(hashes,'wysyłanie');renderPanel();
    try{
      const ok=await originalCloudPush(true);
      if(ok){const synced=[],missing=[];for(const h of hashes)(cloudHashes.has(h)?synced:missing).push(h);setMany(synced,'zsynchronizowany');setMany(missing,'błąd','Rekord nadal nieobecny w chmurze')}
      else setMany(hashes,'błąd','Synchronizacja nieudana');
    }catch(e){setMany(hashes,'błąd',e?.message||String(e))}
    finally{retryBusy=false;renderPanel();refreshBadges()}
  };

  let originalCloudPush=null;
  const install=()=>{
    injectUI();
    try{
      if(typeof cloudPush==='function'&&!originalCloudPush){
        originalCloudPush=cloudPush;
        cloudPush=async function(silent=false){
          const pending=pendingRows(),hashes=pending.map(rowHash);setMany(hashes,'wysyłanie');renderPanel();
          let ok=false;
          try{ok=await originalCloudPush(silent)}catch(e){setMany(hashes,'błąd',e?.message||String(e));renderPanel();throw e}
          if(ok){const synced=[],missing=[];for(const h of hashes)(cloudHashes.has(h)?synced:missing).push(h);setMany(synced,'zsynchronizowany');setMany(missing,'błąd','Brak potwierdzenia w chmurze')}
          else setMany(hashes,'błąd','Synchronizacja nieudana');
          renderPanel();refreshBadges();return ok;
        };
      }
      if(typeof updateUnsyncedPanel==='function'){
        const base=updateUnsyncedPanel;updateUnsyncedPanel=function(){base();renderPanel()};
      }
    }catch{}
    renderPanel();refreshBadges();
  };

  window.addEventListener('ppm-sync-state-change',()=>{refreshBadges()});
  window.addEventListener('ppm-sync-retry-tick',()=>retryFailed(false));
  window.addEventListener('online',()=>retryFailed(false));
  setInterval(()=>window.dispatchEvent(new CustomEvent('ppm-sync-retry-tick')),60000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
