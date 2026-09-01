(()=>{
  const text=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  text('rc','…');
  text('sc','…');
  text('mc','…');
  text('localCount','…');
  text('topm','Ładowanie danych lokalnych…');
  const loading=['yearly','rank','hist','monthsTable','storesTable'];
  for(const id of loading){const el=document.getElementById(id);if(el)el.innerHTML='<div class="empty">Ładowanie danych lokalnych…</div>'}
})();
