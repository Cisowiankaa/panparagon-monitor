(()=>{
  const showView=id=>{
    if(!id)return false;
    const target=document.getElementById(id);
    if(!target||!target.classList.contains('view'))return false;
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v===target));
    document.querySelectorAll('#nav button[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===id));
    try{
      if(id==='months')window.PanParagonOwners?.refreshViews?.();
    }catch(e){console.warn('View refresh fallback',e)}
    return true;
  };
  const install=()=>{
    const nav=document.getElementById('nav');
    if(!nav)return;
    nav.addEventListener('click',e=>{
      const btn=e.target.closest?.('button[data-v]');
      if(!btn||!nav.contains(btn))return;
      showView(btn.dataset.v);
    });
    nav.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const btn=e.target.closest?.('button[data-v]');
      if(!btn||!nav.contains(btn))return;
      e.preventDefault();showView(btn.dataset.v);
    });
    window.PanParagonNavigation={show:showView};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
