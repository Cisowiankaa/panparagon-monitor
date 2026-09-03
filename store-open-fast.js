(()=>{
  const api=window.PanParagonStoreDetails;
  if(!api||typeof api.refreshStore!=='function')return;

  const showView=id=>{
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    document.getElementById(id)?.classList.add('on');
    document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===id));
  };

  api.openStore=(name,detailSrc,allSrc)=>{
    const detailRows=Array.isArray(detailSrc)?detailSrc:[];
    const allRows=Array.isArray(allSrc)?allSrc:detailRows;
    const title=document.getElementById('storeDetailTitle');
    if(title)title.textContent=name;

    let years=null;
    const capture=e=>{
      if(e?.detail?.store===name)years=e.detail?.years||null;
    };
    document.addEventListener('panparagon:store-fast-data',capture,{once:true});
    api.refreshStore(name,detailRows,allRows);

    const yc=document.getElementById('storeYearCount');
    if(yc&&years)yc.textContent=Object.keys(years).length;
    showView('storeDetail');
    window.scrollTo({top:0,behavior:'auto'});
    document.dispatchEvent(new CustomEvent('panparagon:store-detail-updated',{detail:{store:name,year:window.PanParagonStoreFilter?.getYear?.()||''}}));
  };
})();
