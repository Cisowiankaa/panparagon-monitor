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
      // Keep the complete hidden table invisible through the filter's two-frame
      // windowed render. Reveal only on the following frame, after the DOM has
      // already been reduced to the first page of stores.
      box.style.visibility='hidden';
      requestAnimationFrame(()=>{
        if(my!==token)return;
        requestAnimationFrame(()=>{
          if(my!==token)return;
          requestAnimationFrame(()=>{if(my===token)reveal(box)});
        });
      });
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
