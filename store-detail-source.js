(()=>{
  const showDetail=()=>{
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    const detail=document.getElementById('storeDetail');
    if(detail)detail.classList.add('on');
    document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',false));
    window.scrollTo({top:0,behavior:'auto'});
  };
  const install=()=>{
    const table=document.getElementById('storesTable');
    if(!table)return;
    table.addEventListener('click',e=>{
      const tr=e.target.closest?.('tr');
      if(!tr||!table.contains(tr)||tr.rowIndex===0)return;
      const cells=tr.querySelectorAll('td');
      const name=(cells[1]?.textContent||'').trim();
      const api=window.PanParagonStoreDetails,idx=window.PanParagonStoreYearDetail;
      if(!name||!idx?.rowsForStore||(!api?.refreshStore&&!api?.openStore))return;
      const allStore=idx.rowsForStore(name);
      if(!Array.isArray(allStore))return;
      const year=window.PanParagonStoreFilter?.getYear?.()||'';
      const detail=year&&idx.rowsForYear?idx.rowsForYear(year,name):allStore;
      e.preventDefault();
      e.stopImmediatePropagation();
      if(typeof api.refreshStore==='function'){
        api.refreshStore(name,detail,allStore);
        const title=document.getElementById('storeDetailTitle');
        if(title)title.textContent=year?`${name} — ${year}`:name;
        showDetail();
      }else api.openStore(name,detail,allStore);
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();