(()=>{
  const normalize=box=>{
    const table=box?.querySelector('table');if(!table)return;
    [...table.querySelectorAll('tr')].forEach((tr,i)=>{
      if(i===0)return;
      tr.removeAttribute('data-store-wired');
      tr.style.cursor='';
      tr.removeAttribute('title');
      const cells=tr.querySelectorAll('td');
      const name=(cells[1]?.textContent||'').trim();
      if(cells[1]&&name)cells[1].textContent=name;
      if(cells.length>3)for(let n=cells.length-1;n>=3;n--)cells[n].remove();
    });
  };
  const install=()=>{
    const old=document.getElementById('storesTable');
    if(!old||old.dataset.fastList==='2')return;
    // store-details.js attaches a MutationObserver and per-row listeners to the
    // original node. Replacing it here disconnects that legacy work before the
    // newer delegated store modules install their listeners.
    const clean=old.cloneNode(true);
    clean.dataset.fastList='2';
    normalize(clean);
    old.replaceWith(clean);
    window.PanParagonStoreListFast={active:true,mode:'clean-delegated',legacyObserverDetached:true};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
