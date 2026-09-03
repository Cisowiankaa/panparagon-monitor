(()=>{
  const install=()=>{
    const old=document.getElementById('storesTable');
    if(!old||old.dataset.fastList==='1')return;
    const fresh=old.cloneNode(true);
    fresh.dataset.fastList='1';
    old.replaceWith(fresh);
    window.PanParagonStoreListFast={active:true};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
