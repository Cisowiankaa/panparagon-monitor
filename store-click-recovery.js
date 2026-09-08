(()=>{
  const storeName=r=>{try{return (r?.[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const rowsForStore=name=>{
    const idx=window.PanParagonStoreYearDetail;
    if(idx?.rowsForStore){
      try{const out=idx.rowsForStore(name);if(Array.isArray(out))return out}catch{}
    }
    const out=[];
    for(const r of Array.isArray(rows)?rows:[])if(storeName(r)===name)out.push(r);
    return out;
  };
  document.addEventListener('click',e=>{
    const table=document.getElementById('storesTable');
    // Nowa ścieżka store-detail-async przejmuje kliknięcia na aktywnej tabeli.
    // Recovery ma działać wyłącznie jako fallback, a nie blokować async paint.
    if(table?.dataset?.asyncStoreDetail==='1')return;
    const tr=e.target?.closest?.('#storesTable tr');
    if(!tr||tr.querySelector('th'))return;
    const cells=tr.querySelectorAll('td');
    const name=(cells[1]?.textContent||'').trim();
    if(!name)return;
    const api=window.PanParagonStoreDetails;
    if(!api?.openStore)return;
    const allStore=rowsForStore(name);
    const year=window.PanParagonStoreFilter?.getYear?.()||'';
    let detail=allStore;
    if(year&&window.PanParagonStoreYearDetail?.rowsForYear){
      try{const y=window.PanParagonStoreYearDetail.rowsForYear(year,name);if(Array.isArray(y))detail=y}catch{}
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    api.openStore(name,detail,allStore);
  },true);
})();
