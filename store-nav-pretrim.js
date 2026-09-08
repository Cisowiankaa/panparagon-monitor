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
      // Hide the complete hidden stores table before navigation. store-filter owns
      // the single deferred/windowed render; do not render a second time here.
      box.style.visibility='hidden';
      requestAnimationFrame(()=>{
        if(my!==token)return;
        requestAnimationFrame(()=>{if(my===token)reveal(box)});
      });
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
