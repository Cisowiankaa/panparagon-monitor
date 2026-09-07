(()=>{
  const rank=()=>document.getElementById('rank');
  const nameFromRow=tr=>(tr?.querySelectorAll('td')?.[1]?.textContent||'').trim();

  const openStore=async name=>{
    if(!name)return;
    const detailApi=window.PanParagonStoreDetails;
    const fast=window.PanParagonStoreClickFast;
    if(!detailApi?.openStore)return;

    let storeRows=[];
    try{
      if(typeof fast?.rowsForStoreAsync==='function')storeRows=await fast.rowsForStoreAsync(name);
      else if(typeof fast?.rowsForStore==='function')storeRows=fast.rowsForStore(name);
      else if(typeof window.PanParagonStoreYearDetail?.rowsForStore==='function')storeRows=window.PanParagonStoreYearDetail.rowsForStore(name);
    }catch{}

    if(!Array.isArray(storeRows))storeRows=[];
    detailApi.openStore(name,storeRows,storeRows);
  };

  const install=()=>{
    const box=rank();if(!box||box.dataset.storeClick==='1')return;
    box.dataset.storeClick='1';

    const style=document.createElement('style');
    style.textContent='#rank table tr:has(td){cursor:pointer}#rank table tr:has(td):hover{background:rgba(110,168,255,.07)}#rank table td:nth-child(2){color:var(--a);font-weight:700}';
    document.head.appendChild(style);

    box.addEventListener('click',e=>{
      const tr=e.target.closest?.('tr');
      if(!tr||!box.contains(tr)||!tr.querySelector('td'))return;
      const name=nameFromRow(tr);if(!name)return;
      e.preventDefault();
      openStore(name);
    });
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
