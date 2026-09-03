(()=>{
  const api=window.PanParagonStoreDetails;
  if(!api||typeof api.refreshStore!=='function')return;

  let currentStore='';
  const showView=id=>{
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    document.getElementById(id)?.classList.add('on');
    document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===id));
  };
  const renderYears=years=>{
    const entries=Object.entries(years||{}).sort((a,b)=>b[0].localeCompare(a[0]));
    const yc=document.getElementById('storeYearCount');
    if(yc)yc.textContent=entries.length;
    const box=document.getElementById('storeYearTable');
    if(box)box.innerHTML=entries.length?'<table><tr><th>Rok</th><th>Paragony</th></tr>'+entries.map(([y,n])=>`<tr><td>${y}</td><td><b>${n}</b></td></tr>`).join('')+'</table>':'<div class="empty">Brak danych rocznych.</div>';
  };

  api.openStore=(name,detailSrc,allSrc)=>{
    currentStore=String(name||'');
    const detailRows=Array.isArray(detailSrc)?detailSrc:[];
    const allRows=Array.isArray(allSrc)?allSrc:detailRows;
    const title=document.getElementById('storeDetailTitle');
    if(title)title.textContent=currentStore;

    let fastData=null;
    const capture=e=>{if(e?.detail?.store===currentStore)fastData=e.detail||null};
    document.addEventListener('panparagon:store-fast-data',capture,{once:true});
    api.refreshStore(currentStore,detailRows,allRows);
    if(fastData)renderYears(fastData.years);

    showView('storeDetail');
    window.scrollTo({top:0,behavior:'auto'});
    document.dispatchEvent(new CustomEvent('panparagon:store-detail-updated',{detail:{store:currentStore,year:window.PanParagonStoreFilter?.getYear?.()||''}}));
  };
  api.getCurrentStore=()=>currentStore;
})();
