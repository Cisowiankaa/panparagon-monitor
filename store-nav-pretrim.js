(()=>{
  let token=0;
  const table=()=>document.getElementById('storesTable');
  const isStoresButton=target=>!!target?.closest?.('#nav button[data-v="stores"]');
  const reveal=box=>{if(box)box.style.visibility=''};
  const install=()=>{
    document.addEventListener('click',e=>{
      if(!isStoresButton(e.target))return;
      const box=table();if(!box)return;
      const my=++token;
      // The main renderer keeps the complete stores table while the view is hidden.
      // Hide it before the nav handler makes #stores visible, so the browser never
      // has to lay out hundreds/thousands of rows for a single frame.
      box.style.visibility='hidden';
      requestAnimationFrame(()=>{
        if(my!==token)return;
        try{window.PanParagonStoreFilter?.render?.()}catch{}
        requestAnimationFrame(()=>{if(my===token)reveal(box)});
      });
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
