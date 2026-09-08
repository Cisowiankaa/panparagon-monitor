(()=>{
  let token=0;
  const LIMIT=60;
  const table=()=>document.getElementById('storesTable');
  const isStoresButton=target=>!!target?.closest?.('#nav button[data-v="stores"]');
  const reveal=box=>{if(box)box.style.visibility=''};
  const needsPretrim=box=>{
    if(!box)return false;
    const t=box.querySelector('table');
    if(!t)return false;
    if(t.dataset.ppmWindowed==='1'||box.dataset.ppmWriteWindow==='1')return false;
    return t.querySelectorAll('tr').length>LIMIT+1;
  };
  const install=()=>{
    document.addEventListener('click',e=>{
      if(!isStoresButton(e.target))return;
      const box=table();if(!box)return;
      const my=++token;
      if(!needsPretrim(box)){
        reveal(box);
        window.PanParagonStoreTableWindow?.trim?.();
        return;
      }
      box.style.visibility='hidden';
      requestAnimationFrame(()=>{
        if(my!==token)return;
        window.PanParagonStoreTableWindow?.trim?.();
        requestAnimationFrame(()=>{if(my===token)reveal(box)});
      });
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
