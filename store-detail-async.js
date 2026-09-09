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
  const install=()=>{
    const old=document.getElementById('storesTable');
    if(!old||old.dataset.asyncStoreDetail==='1')return;
    const table=old.cloneNode(true);
    table.dataset.asyncStoreDetail='1';
    old.replaceWith(table);
    window.PanParagonStoreTableWindow?.install?.();
    window.PanParagonStoreTableWindow?.trim?.();
    table.addEventListener('click',async e=>{
      const tr=e.target.closest?.('tr');
      if(!tr||!table.contains(tr)||tr.rowIndex===0)return;
      const name=(tr.querySelectorAll('td')[1]?.textContent||'').trim();
      const api=window.PanParagonStoreDetails,idx=window.PanParagonStoreYearDetail,fast=window.PanParagonStoreClickFast;
      if(!name||!idx?.rowsForStore||(!api?.refreshStore&&!api?.openStore))return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const token=++openToken,year=window.PanParagonStoreFilter?.getYear?.()||'',title=document.getElementById('storeDetailTitle');
      if(title)title.textContent=`${name} — ładowanie…`;
      showDetail();
      await nextPaint();
      if(token!==openToken)return;
      let allStore;
      if(fast?.rowsForStoreAsync)allStore=await fast.rowsForStoreAsync(name);
      else allStore=idx.rowsForStore(name);
      if(token!==openToken||!Array.isArray(allStore))return;
      const detail=rowsForSelectedYear(allStore,year,name,fast,idx);
      if(title)title.textContent=year?`${name} — ${year}`:name;
      if(typeof api.refreshStore==='function')requestAnimationFrame(()=>{if(token===openToken)api.refreshStore(name,detail,allStore)});
      else api.openStore(name,detail,allStore);
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
