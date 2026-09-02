(()=>{
  const install=()=>{
    const table=document.getElementById('storesTable');
    if(!table)return;
    table.addEventListener('click',e=>{
      const tr=e.target.closest?.('tr');
      if(!tr||!table.contains(tr)||tr.rowIndex===0)return;
      const cells=tr.querySelectorAll('td');
      const name=(cells[1]?.textContent||'').trim();
      const api=window.PanParagonStoreDetails,idx=window.PanParagonStoreYearDetail;
      if(!name||!api?.openStore||!idx?.rowsForStore)return;
      const allStore=idx.rowsForStore(name);
      if(!Array.isArray(allStore))return;
      const year=window.PanParagonStoreFilter?.getYear?.()||'';
      const detail=year&&idx.rowsForYear?idx.rowsForYear(year,name):allStore;
      e.preventDefault();
      e.stopImmediatePropagation();
      api.openStore(name,detail,allStore);
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();