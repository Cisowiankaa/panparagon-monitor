(()=>{
  let openToken=0;
  const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const clearHeavyDetail=()=>{
    try{window.PanParagonStoreMonthCache?.invalidate?.()}catch{}
    const receipt=document.getElementById('storeReceiptCard');
    if(receipt)receipt.style.display='none';
    for(const id of ['storeReceiptTable','storeDayTable']){
      const el=document.getElementById(id);
      if(el&&el.childNodes.length)el.replaceChildren();
    }
  };
  const showDetail=()=>{
    const detail=document.getElementById('storeDetail');
    if(detail&&!detail.classList.contains('on'))clearHeavyDetail();
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    if(detail)detail.classList.add('on');
    document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('on'));
    window.scrollTo({top:0,behavior:'auto'});
  };
  const rowsForSelectedYear=(list,year,name,fast,idx)=>{
    if(!year)return list;
    try{
      if(typeof fast?.rowsForYear==='function'){
        const out=fast.rowsForYear(year,name);
        if(Array.isArray(out))return out;
      }
      if(typeof idx?.rowsForYear==='function'){
        const out=idx.rowsForYear(year,name);
        if(Array.isArray(out))return out;
      }
    }catch{}
    const y=String(year),out=[];
    for(const r of list||[]){const d=cachedDate(r);if(d&&String(d.getFullYear())===y)out.push(r)}
    return out;
  };
  const renderStore=(token,name,year,allStore,api,fast,idx,title)=>{
    if(token!==openToken||!Array.isArray(allStore))return false;
    const detail=rowsForSelectedYear(allStore,year,name,fast,idx);
    if(title)title.textContent=year?`${name} — ${year}`:name;
    if(typeof api.refreshStore==='function')api.refreshStore(name,detail,allStore);
    else api.openStore(name,detail,allStore);
    return true;
  };
  const syncRows=(name,fast,idx)=>{
    const rowIndex=window.PanParagonStoreRowIndex;
    if(rowIndex&&typeof rowIndex.isReady==='function'&&!rowIndex.isReady())return null;
    try{
      if(typeof fast?.rowsForStore==='function'){
        const out=fast.rowsForStore(name);
        if(Array.isArray(out))return out;
      }
      if(typeof idx?.rowsForStore==='function'){
        const out=idx.rowsForStore(name);
        if(Array.isArray(out))return out;
      }
    }catch{}
    return null;
  };
  const install=()=>{
    const table=document.getElementById('storesTable');
    if(!table||table.dataset.asyncStoreDetail==='1')return;
    table.dataset.asyncStoreDetail='1';
    window.PanParagonStoreTableWindow?.install?.();
    window.PanParagonStoreTableWindow?.trim?.();
    document.addEventListener('click',async e=>{
      const live=document.getElementById('storesTable');
      if(!live||!live.contains(e.target))return;
      const tr=e.target.closest?.('tr');
      if(!tr||!live.contains(tr)||tr.rowIndex===0)return;
      const name=(tr.querySelectorAll('td')[1]?.textContent||'').trim();
      const api=window.PanParagonStoreDetails,idx=window.PanParagonStoreYearDetail,fast=window.PanParagonStoreClickFast;
      if(!name||!idx?.rowsForStore||(!api?.refreshStore&&!api?.openStore))return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const token=++openToken,year=window.PanParagonStoreFilter?.getYear?.()||'',title=document.getElementById('storeDetailTitle');

      const readyRows=syncRows(name,fast,idx);
      if(Array.isArray(readyRows)){
        showDetail();
        renderStore(token,name,year,readyRows,api,fast,idx,title);
        return;
      }

      if(title)title.textContent=`${name} — ładowanie…`;
      showDetail();
      await nextPaint();
      if(token!==openToken)return;
      let allStore=null;
      try{
        if(typeof fast?.rowsForStoreAsync==='function')allStore=await fast.rowsForStoreAsync(name);
        else allStore=idx.rowsForStore(name);
      }catch{}
      renderStore(token,name,year,allStore,api,fast,idx,title);
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();