(()=>{
  let filter='all';
  const getRetry=()=>window.PanParagonSyncRetry;
  const statusOf=r=>{try{return getRetry()?.get(rowHash(r))?.status||'oczekuje'}catch{return'oczekuje'}};
  const rowsForFilter=()=>{try{const pending=rows.filter(r=>!cloudHashes.has(rowHash(r)));if(filter==='errors')return pending.filter(r=>statusOf(r)==='błąd');if(filter==='pending')return pending.filter(r=>statusOf(r)!=='błąd');return pending}catch{return[]}};

  const ensureFilterUI=()=>{
    const panel=document.getElementById('unsyncedPanel');if(!panel||document.getElementById('syncFilterBar'))return;
    const bar=document.createElement('div');bar.id='syncFilterBar';bar.className='actions';bar.style.margin='10px 0';
    bar.innerHTML='<button data-sync-filter="all">Wszystkie</button><button data-sync-filter="pending">Oczekujące</button><button data-sync-filter="errors">Błędy</button>';
    panel.insertAdjacentElement('beforebegin',bar);
    bar.querySelectorAll('button').forEach(b=>b.onclick=()=>{filter=b.dataset.syncFilter;paintFilter();renderFiltered()});
    paintFilter();
  };

  const paintFilter=()=>{const bar=document.getElementById('syncFilterBar');if(!bar)return;bar.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.syncFilter===filter);b.style.borderColor=b.dataset.syncFilter===filter?'var(--a)':'var(--l)'})};

  const retryOne=async hash=>{
    if(!navigator.onLine)return;
    const retry=getRetry();if(!retry)return;
    retry.set(hash,'wysyłanie');renderFiltered();
    try{
      const ok=await cloudPush(true);
      if(ok&&cloudHashes.has(hash))retry.set(hash,'zsynchronizowany');
      else retry.set(hash,'błąd','Rekord nadal nieobecny w chmurze');
    }catch(e){retry.set(hash,'błąd',e?.message||String(e))}
    renderFiltered();
  };

  const details=(h,st)=>st.status==='błąd'?`<details style="grid-column:1/-1;margin-top:4px;padding:8px 10px;border:1px solid var(--l);border-radius:8px;background:#101821"><summary class="badtxt" style="cursor:pointer">Szczegóły błędu</summary><div class="small" style="margin-top:8px"><b>Rekord:</b> ${esc(h)}<br><b>Ostatni błąd:</b> ${esc(st.lastError||'Nieznany błąd')}<br><b>Liczba prób:</b> ${st.attempts||0}<br><button class="retry-one" data-hash="${esc(h)}" style="margin-top:8px">Ponów ten rekord</button></div></details>`:'';

  const renderFiltered=()=>{
    ensureFilterUI();const panel=document.getElementById('unsyncedPanel');const retry=getRetry();if(!panel||!retry)return;
    try{
      if(!user){panel.innerHTML='<div class="empty">Zaloguj się, aby sprawdzić.</div>';return}
      if(cloudTotal==null){panel.innerHTML='<div class="empty">Sprawdzanie chmury…</div>';return}
      const list=rowsForFilter(),shown=list.slice(0,20);
      const label=filter==='errors'?'Błędy':filter==='pending'?'Oczekujące':'Wszystkie';
      if(!list.length){panel.innerHTML=`<div class="empty oktxt">${label}: brak rekordów ✓</div>`;return}
      panel.innerHTML=`<div class="small" style="margin-bottom:8px">${label}: <b>${list.length}</b>. Pokazuję pierwsze ${shown.length}.</div>`+shown.map(r=>{const h=rowHash(r),st=retry.get(h),d=rowDate(r),shop=(r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep';const cls=st.status==='błąd'?'badtxt':st.status==='zsynchronizowany'?'oktxt':'warntxt';return `<div class="pending-item"><span>${d?ml(mk(d)):'Bez daty'}</span><b>${esc(shop)}</b><span class="${cls}">${esc(st.status||'oczekuje')}</span>${details(h,st)}</div>`}).join('');
      panel.querySelectorAll('.retry-one').forEach(b=>b.onclick=()=>retryOne(b.dataset.hash));
    }catch(e){panel.textContent='Nie udało się odświeżyć filtra: '+e.message}
  };

  const install=()=>{ensureFilterUI();renderFiltered();window.addEventListener('ppm-sync-state-change',renderFiltered);window.addEventListener('online',renderFiltered);setInterval(renderFiltered,30000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
