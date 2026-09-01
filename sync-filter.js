(()=>{
  let filter='all',query='',sortBy='date-desc',showAll=false;
  const RETRY_KEY='ppm_sync_retry_queue';
  const getRetry=()=>window.PanParagonSyncRetry;
  const statusOf=r=>{try{return getRetry()?.get(rowHash(r))?.status||'oczekuje'}catch{return'oczekuje'}};
  const pendingAll=()=>{try{return rows.filter(r=>!cloudHashes.has(rowHash(r)))}catch{return[]}};
  const searchableText=r=>{try{const d=rowDate(r),shop=(r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep',month=d?ml(mk(d)):'';return `${shop} ${month} ${d?mk(d):''} ${statusOf(r)}`.toLocaleLowerCase('pl-PL')}catch{return''}};
  const counts=()=>{const all=pendingAll(),errors=all.filter(r=>statusOf(r)==='błąd').length,pending=all.length-errors;return{all:all.length,pending,errors}};
  const shopOf=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const timeOf=r=>{try{return rowDate(r)?.getTime()||0}catch{return 0}};
  const statusRank=s=>({'błąd':0,'wysyłanie':1,'oczekuje':2,'zsynchronizowany':3}[s]??9);
  const sortRows=list=>list.sort((a,b)=>{
    if(sortBy==='date-asc')return timeOf(a)-timeOf(b);
    if(sortBy==='date-desc')return timeOf(b)-timeOf(a);
    if(sortBy==='shop-asc')return shopOf(a).localeCompare(shopOf(b),'pl',{sensitivity:'base'});
    if(sortBy==='shop-desc')return shopOf(b).localeCompare(shopOf(a),'pl',{sensitivity:'base'});
    if(sortBy==='status')return statusRank(statusOf(a))-statusRank(statusOf(b))||timeOf(b)-timeOf(a);
    return 0;
  });
  const rowsForFilter=()=>{let list=pendingAll();if(filter==='errors')list=list.filter(r=>statusOf(r)==='błąd');else if(filter==='pending')list=list.filter(r=>statusOf(r)!=='błąd');const q=query.trim().toLocaleLowerCase('pl-PL');if(q)list=list.filter(r=>searchableText(r).includes(q));return sortRows(list)};

  const csvCell=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const exportCSV=()=>{
    const retry=getRetry(),list=rowsForFilter();
    if(!list.length){const m=document.getElementById('diagMsg');if(m)m.textContent='Eksport: brak rekordów w aktualnym widoku.';return}
    const cols=['status','data','miesiąc','sklep','rekord','liczba_prób','ostatni_błąd','kolejna_próba'];
    const lines=[cols.map(csvCell).join(';')];
    list.forEach(r=>{const h=rowHash(r),st=retry?.get(h)||{},d=rowDate(r);lines.push([st.status||'oczekuje',d?d.toISOString().slice(0,10):'',d?ml(mk(d)):'',shopOf(r),h,st.attempts||0,st.lastError||'',st.nextRetry?new Date(st.nextRetry).toISOString():''].map(csvCell).join(';'))});
    const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`panparagon-${filter==='errors'?'bledy':filter==='pending'?'oczekujace':'niezsynchronizowane'}-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  const clearResolved=()=>{
    let q={};try{q=JSON.parse(localStorage.getItem(RETRY_KEY)||'{}')}catch{}
    let removed=0;for(const [h,s] of Object.entries(q)){if(s?.status==='zsynchronizowany'){delete q[h];removed++}}
    localStorage.setItem(RETRY_KEY,JSON.stringify(q));
    window.dispatchEvent(new CustomEvent('ppm-sync-state-change'));
    const m=document.getElementById('diagMsg');if(m)m.textContent=removed?`Wyczyszczono rozwiązane statusy: ${removed}.`:'Brak rozwiązanych statusów do wyczyszczenia.';
    renderFiltered();
  };

  const ensureFilterUI=()=>{
    const panel=document.getElementById('unsyncedPanel');if(!panel)return;
    let wrap=document.getElementById('syncFilterWrap');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='syncFilterWrap';wrap.style.margin='10px 0';
      wrap.innerHTML='<div id="syncFilterBar" class="actions"><button data-sync-filter="all">Wszystkie <span data-count="all"></span></button><button data-sync-filter="pending">Oczekujące <span data-count="pending"></span></button><button data-sync-filter="errors">Błędy <span data-count="errors"></span></button></div><div class="actions" style="margin-top:8px"><input id="syncSearch" type="search" placeholder="Szukaj sklepu lub miesiąca…" style="flex:1;min-width:220px"><select id="syncSort"><option value="date-desc">Data: najnowsze</option><option value="date-asc">Data: najstarsze</option><option value="shop-asc">Sklep A–Z</option><option value="shop-desc">Sklep Z–A</option><option value="status">Status</option></select></div><div class="actions" style="margin-top:8px"><button id="exportSyncCsv">Eksportuj widok CSV</button><button id="clearResolvedSync">Wyczyść rozwiązane błędy</button></div>';
      panel.insertAdjacentElement('beforebegin',wrap);
      wrap.querySelectorAll('[data-sync-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.syncFilter;showAll=false;paintFilter();renderFiltered()});
      const s=wrap.querySelector('#syncSearch');s.oninput=()=>{query=s.value;showAll=false;renderFiltered()};
      const so=wrap.querySelector('#syncSort');so.value=sortBy;so.onchange=()=>{sortBy=so.value;renderFiltered()};
      wrap.querySelector('#exportSyncCsv').onclick=exportCSV;
      wrap.querySelector('#clearResolvedSync').onclick=clearResolved;
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
      const list=rowsForFilter(),shown=showAll?list:list.slice(0,30),label=filter==='errors'?'Błędy':filter==='pending'?'Oczekujące':'Wszystkie';
      if(!list.length){panel.innerHTML=`<div class="empty oktxt">${query?'Brak wyników wyszukiwania':`${label}: brak rekordów ✓`}</div>`;return}
      const more=list.length>30?`<div class="actions" style="margin:12px 0 4px"><button id="toggleAllSync">${showAll?'Pokaż 30':'Pokaż wszystkie ('+list.length+')'}</button></div>`:'';
      panel.innerHTML=`<div class="small" style="margin-bottom:8px">${label}: <b>${list.length}</b>${query?` · wyszukiwanie: <b>${esc(query)}</b>`:''}. ${showAll?'Pokazuję wszystkie rekordy.':`Pokazuję ${shown.length}.`}</div>${more}`+shown.map(r=>{const h=rowHash(r),st=retry.get(h),d=rowDate(r),shop=shopOf(r),cls=st.status==='błąd'?'badtxt':st.status==='zsynchronizowany'?'oktxt':'warntxt';return `<div class="pending-item"><span>${d?ml(mk(d)):'Bez daty'}</span><b>${esc(shop)}</b><span class="${cls}">${esc(st.status||'oczekuje')}</span>${details(h,st)}</div>`}).join('');
      panel.querySelectorAll('.retry-one').forEach(b=>b.onclick=()=>retryOne(b.dataset.hash));
      const toggle=document.getElementById('toggleAllSync');if(toggle)toggle.onclick=()=>{showAll=!showAll;renderFiltered()};
    }catch(e){panel.textContent='Nie udało się odświeżyć filtra: '+e.message}
  };

  const install=()=>{ensureFilterUI();renderFiltered();window.addEventListener('ppm-sync-state-change',renderFiltered);window.addEventListener('online',renderFiltered);setInterval(renderFiltered,30000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
