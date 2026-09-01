(()=>{
  let filter='all',query='';
  const getRetry=()=>window.PanParagonSyncRetry;
  const statusOf=r=>{try{return getRetry()?.get(rowHash(r))?.status||'oczekuje'}catch{return'oczekuje'}};
  const pendingAll=()=>{try{return rows.filter(r=>!cloudHashes.has(rowHash(r)))}catch{return[]}};
  const searchableText=r=>{try{const d=rowDate(r),shop=(r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep',month=d?ml(mk(d)):'';return `${shop} ${month} ${d?mk(d):''}`.toLocaleLowerCase('pl-PL')}catch{return''}};
  const counts=()=>{const all=pendingAll(),errors=all.filter(r=>statusOf(r)==='błąd').length,pending=all.length-errors;return{all:all.length,pending,errors}};
  const rowsForFilter=()=>{let list=pendingAll();if(filter==='errors')list=list.filter(r=>statusOf(r)==='błąd');else if(filter==='pending')list=list.filter(r=>statusOf(r)!=='błąd');const q=query.trim().toLocaleLowerCase('pl-PL');if(q)list=list.filter(r=>searchableText(r).includes(q));return list};

  const ensureFilterUI=()=>{
    const panel=document.getElementById('unsyncedPanel');if(!panel)return;
    let wrap=document.getElementById('syncFilterWrap');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='syncFilterWrap';wrap.style.margin='10px 0';
      wrap.innerHTML='<div id="syncFilterBar" class="actions"><button data-sync-filter="all">Wszystkie <span data-count="all"></span></button><button data-sync-filter="pending">Oczekujące <span data-count="pending"></span></button><button data-sync-filter="errors">Błędy <span data-count="errors"></span></button></div><input id="syncSearch" type="search" placeholder="Szukaj sklepu lub miesiąca…" style="width:100%;margin-top:8px">';
      panel.insertAdjacentElement('beforebegin',wrap);
      wrap.querySelectorAll('[data-sync-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.syncFilter;paintFilter();renderFiltered()});
      const s=wrap.querySelector('#syncSearch');s.oninput=()=>{query=s.value;renderFiltered()};
    }
    paintFilter();updateCounts();
  };

  const paintFilter=()=>{const bar=document.getElementById('syncFilterBar');if(!bar)return;bar.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.syncFilter===filter);b.style.borderColor=b.dataset.syncFilter===filter?'var(--a)':'var(--l)'})};
  const updateCounts=()=>{const c=counts();document.querySelectorAll('[data-count]').forEach(el=>{const k=el.dataset.count;el.textContent=`(${c[k]??0})`})};

  const retryOne=async hash=>{
    if(!navigator.onLine)return;
    const retry=getRetry();if(!retry)return;
    retry.set(hash,'wysyłanie');renderFiltered();
    try{const ok=await cloudPush(true);if(ok&&cloudHashes.has(hash))retry.set(hash,'zsynchronizowany');else retry.set(hash,'błąd','Rekord nadal nieobecny w chmurze')}catch(e){retry.set(hash,'błąd',e?.message||String(e))}
    renderFiltered();
  };

  const details=(h,st)=>st.status==='błąd'?`<details style="grid-column:1/-1;margin-top:4px;padding:8px 10px;border:1px solid var(--l);border-radius:8px;background:#101821"><summary class="badtxt" style="cursor:pointer">Szczegóły błędu</summary><div class="small" style="margin-top:8px"><b>Rekord:</b> ${esc(h)}<br><b>Ostatni błąd:</b> ${esc(st.lastError||'Nieznany błąd')}<br><b>Liczba prób:</b> ${st.attempts||0}<br><button class="retry-one" data-hash="${esc(h)}" style="margin-top:8px">Ponów ten rekord</button></div></details>`:'';

  const renderFiltered=()=>{
    ensureFilterUI();const panel=document.getElementById('unsyncedPanel'),retry=getRetry();if(!panel||!retry)return;
    try{
      updateCounts();
      if(!user){panel.innerHTML='<div class="empty">Zaloguj się, aby sprawdzić.</div>';return}
      if(cloudTotal==null){panel.innerHTML='<div class="empty">Sprawdzanie chmury…</div>';return}
      const list=rowsForFilter(),shown=list.slice(0,30),label=filter==='errors'?'Błędy':filter==='pending'?'Oczekujące':'Wszystkie';
      if(!list.length){panel.innerHTML=`<div class="empty oktxt">${query?'Brak wyników wyszukiwania':'${label}: brak rekordów ✓'}</div>`;return}
      panel.innerHTML=`<div class="small" style="margin-bottom:8px">${label}: <b>${list.length}</b>${query?` · wyszukiwanie: <b>${esc(query)}</b>`:''}. Pokazuję pierwsze ${shown.length}.</div>`+shown.map(r=>{const h=rowHash(r),st=retry.get(h),d=rowDate(r),shop=(r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep',cls=st.status==='błąd'?'badtxt':st.status==='zsynchronizowany'?'oktxt':'warntxt';return `<div class="pending-item"><span>${d?ml(mk(d)):'Bez daty'}</span><b>${esc(shop)}</b><span class="${cls}">${esc(st.status||'oczekuje')}</span>${details(h,st)}</div>`}).join('');
      panel.querySelectorAll('.retry-one').forEach(b=>b.onclick=()=>retryOne(b.dataset.hash));
    }catch(e){panel.textContent='Nie udało się odświeżyć filtra: '+e.message}
  };

  const install=()=>{ensureFilterUI();renderFiltered();window.addEventListener('ppm-sync-state-change',renderFiltered);window.addEventListener('online',renderFiltered);setInterval(renderFiltered,30000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
