(()=>{
  const api=window.PanParagonStoreDetails;
  if(!api||typeof api.refreshStore!=='function')return;
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const showView=id=>{
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    document.getElementById(id)?.classList.add('on');
    document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===id));
  };
  const yearCount=src=>{
    const years=new Set();
    for(const r of src||[]){const d=cachedDate(r);if(d)years.add(d.getFullYear())}
    return years.size;
  };
  api.openStore=(name,detailSrc,allSrc)=>{
    const detailRows=Array.isArray(detailSrc)?detailSrc:[];
    const allRows=Array.isArray(allSrc)?allSrc:detailRows;
    const title=document.getElementById('storeDetailTitle');
    if(title)title.textContent=name;
    api.refreshStore(name,detailRows,allRows);
    const yc=document.getElementById('storeYearCount');
    if(yc)yc.textContent=yearCount(allRows);
    showView('storeDetail');
    window.scrollTo({top:0,behavior:'auto'});
    document.dispatchEvent(new CustomEvent('panparagon:store-detail-updated',{detail:{store:name,year:''}}));
  };
})();
