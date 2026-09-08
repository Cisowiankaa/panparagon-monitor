(()=>{
  const LIMIT=100;
  const trim=()=>{
    const view=document.getElementById('stores'),box=document.getElementById('storesTable');
    if(!box||view?.classList.contains('on'))return;
    const table=box.querySelector('table');
    if(!table||table.dataset.ppmWindowed==='1')return;
    const rows=[...table.querySelectorAll('tr')];
    if(rows.length<=LIMIT+1){table.dataset.ppmWindowed='1';return}
    const frag=document.createDocumentFragment();
    const next=table.cloneNode(false);
    for(let i=0;i<=LIMIT&&i<rows.length;i++)frag.appendChild(rows[i]);
    next.appendChild(frag);
    next.dataset.ppmWindowed='1';
    table.replaceWith(next);
    box.dataset.ppmWindowedTotal=String(rows.length-1);
  };

  const schedule=()=>queueMicrotask(trim);
  const base=typeof window.render==='function'?window.render:null;
  if(base){
    window.render=function(...args){
      const out=base.apply(this,args);
      trim();
      return out;
    };
  }
  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')schedule();
  });
  trim();
  window.PanParagonStoreTableWindow={trim,limit:LIMIT};
})();
