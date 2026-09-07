(()=>{
  const showDetail=()=>{
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    const detail=document.getElementById('storeDetail');
    if(detail)detail.classList.add('on');
    document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',false));
    window.scrollTo({top:0,behavior:'auto'});
  };
  let openToken=0;
  const install=()=>{
    const table=document.getElementById('storesTable');
    if(!table)return;
    table.addEventListener('click',e=>{
      const tr=e.target.closest?.('tr');
      if(!tr||!table.contains(tr)||tr.rowIndex===0)return;
      const cells=tr.querySelectorAll('td');
      const name=(cells[1]?.textContent||'').trim();
      const api=window.PanParagonStoreDetails,idx=window.PanParagonStoreYearDetail,fast=window.PanParagonStoreClickFast;
      if(!name||(!api?.refreshStore&&!api?.openStore))return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const token=++openToken,year=window.PanParagonStoreFilter?.getYear?.()||'';
      const title=document.getElementById('storeDetailTitle');
      if(title)title.textContent=year?`${name} — ${year}`:name;
      showDetail();
      const load=async()=>{
        let allStore=null;
        try{
          if(typeof fast?.rowsForStoreAsync==='function')allStore=await fast.rowsForStoreAsync(name);
          else if(typeof fast?.rowsForStore==='function')allStore=fast.rowsForStore(name);
          else if(typeof idx?.rowsForStore==='function')allStore=idx.rowsForStore(name);
        }catch{}
        if(token!==openToken||!Array.isArray(allStore))return;
        let detail=allStore;
        if(year){
          try{
            if(typeof fast?.rowsForYear==='function')detail=fast.rowsForYear(year,name);
            else if(typeof idx?.rowsForYear==='function')detail=idx.rowsForYear(year,name);
          }catch{detail=allStore}
        }
        const run=()=>{
          if(token!==openToken)return;
          if(typeof api.refreshStore==='function')api.refreshStore(name,detail,allStore);
          else api.openStore(name,detail,allStore);
        };
        if('requestAnimationFrame'in window)requestAnimationFrame(run);else setTimeout(run,0);
      };
      load();
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();