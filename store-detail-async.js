(()=>{
  let openToken=0;
  const showDetail=()=>{
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    const detail=document.getElementById('storeDetail');
    if(detail)detail.classList.add('on');
    document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('on'));
    window.scrollTo({top:0,behavior:'auto'});
  };
  const install=()=>{
    const old=document.getElementById('storesTable');
    if(!old||old.dataset.asyncStoreDetail==='1')return;
    const table=old.cloneNode(true);
    table.dataset.asyncStoreDetail='1';
    old.replaceWith(table);
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
      if(fast?.whenReady&&!fast.isPrewarmed?.()){
        let ok=await fast.whenReady();
        if(!ok&&token===openToken)await fast.whenReady();
      }
      if(token!==openToken)return;
      const allStore=idx.rowsForStore(name);
      if(!Array.isArray(allStore))return;
      const detail=year&&idx.rowsForYear?idx.rowsForYear(year,name):allStore;
      if(title)title.textContent=year?`${name} — ${year}`:name;
      if(typeof api.refreshStore==='function')requestAnimationFrame(()=>{if(token===openToken)api.refreshStore(name,detail,allStore)});
      else api.openStore(name,detail,allStore);
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
