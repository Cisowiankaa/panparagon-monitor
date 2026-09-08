(()=>{
  // Compatibility module only. Do not replace or clone #storesTable:
  // other store modules attach delegated listeners to the live element.
  const install=()=>{
    const table=document.getElementById('storesTable');
    if(!table)return;
    table.dataset.fastList='1';
    window.PanParagonStoreListFast={active:true,mode:'delegated'};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
