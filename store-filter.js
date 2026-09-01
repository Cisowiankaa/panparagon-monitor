(()=>{
  let query='',year='';
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const years=()=>[...new Set(rows.map(r=>rowDate(r)?.getFullYear()).filter(Boolean))].sort((a,b)=>b-a);
  const ensureControls=()=>{
    const sec=document.getElementById('stores'),table=document.getElementById('storesTable');
    if(!sec||!table||document.getElementById('storeSearch'))return;
    const box=document.createElement('div');box.className='card';box.style.marginBottom='14px';box.id='storeFilterBar';
    box.innerHTML='<div class="actions"><input id="storeSearch" type="search" placeholder="Szukaj sklepu…" style="min-width:260px;flex:1"><select id="storeYear"><option value="">Wszystkie lata</option></select><button id="storeFilterClear">Wyczyść filtry</button></div><div id="storeFilterInfo" class="small" style="margin-top:9px">Wszystkie sklepy ze wszystkich lat.</div>';
    table.before(box);
    document.getElementById('storeSearch').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('pl');renderFiltered()});
    document.getElementById('storeYear').addEventListener('change',e=>{year=e.target.value;renderFiltered()});
    document.getElementById('storeFilterClear').onclick=()=>{query='';year='';document.getElementById('storeSearch').value='';document.getElementById('storeYear').value='';renderFiltered()};
    refreshYears();
  };
  const refreshYears=()=>{
    const s=document.getElementById('storeYear');if(!s)return;
    const old=year;
    s.innerHTML='<option value="">Wszystkie lata</option>'+years().map(y=>`<option value="${y}">${y}</option>`).join('');
    if(old&&[...s.options].some(o=>o.value===old))s.value=old;else year='';
  };
  const renderFiltered=()=>{
    ensureControls();refreshYears();const box=document.getElementById('storesTable');if(!box)return;
    const counts={};
    rows.forEach(r=>{const d=rowDate(r);if(year&&(!d||String(d.getFullYear())!==year))return;const n=storeName(r);if(query&&!n.toLocaleLowerCase('pl').includes(query))return;counts[n]=(counts[n]||0)+1});
    const list=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'));
    box.innerHTML=list.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony${year?' · '+year:''}</th></tr>${list.map(([n,c],i)=>`<tr><td>${i+1}</td><td>${esc(n)}</td><td><b>${c}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak sklepów pasujących do filtrów.</div>';
    const info=document.getElementById('storeFilterInfo');if(info)info.textContent=`Znaleziono sklepów: ${list.length} · paragony: ${list.reduce((s,x)=>s+x[1],0)}${year?' · rok '+year:' · wszystkie lata'}${query?' · wyszukiwanie: „'+query+'”':''}.`;
  };
  const install=()=>{
    ensureControls();
    document.querySelectorAll('#nav button').forEach(b=>{if(b.dataset.v==='stores')b.addEventListener('click',()=>setTimeout(renderFiltered,0))});
    renderFiltered();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
