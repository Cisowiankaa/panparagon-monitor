// deployment marker: indexed store year filters
(()=>{
  let query='',year='';
  const index=()=>window.PanParagonMainIndex?.get?.()||null;
  const availableYears=()=>{
    const data=index();
    if(data?.yearEntries)return data.yearEntries.map(([y])=>String(y));
    return [];
  };
  const ensureControls=()=>{
    const sec=document.getElementById('stores'),table=document.getElementById('storesTable');
    if(!sec||!table||document.getElementById('storeSearch'))return;
    const box=document.createElement('div');box.className='card';box.style.marginBottom='14px';box.id='storeFilterBar';
    box.innerHTML='<div class="actions"><input id="storeSearch" type="search" placeholder="Szukaj sklepu…" style="min-width:260px;flex:1"><select id="storeYear"><option value="">Wszystkie lata</option></select><button id="storeFilterClear">Wyczyść filtry</button></div><div id="storeFilterInfo" class="small" style="margin-top:9px">Wszystkie sklepy ze wszystkich lat.</div>';
    table.before(box);
    document.getElementById('storeSearch').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('pl');renderFiltered()});
    document.getElementById('storeYear').addEventListener('change',e=>{year=e.target.value;renderFiltered();document.dispatchEvent(new CustomEvent('panparagon:store-year-changed',{detail:{year}}))});
    document.getElementById('storeFilterClear').onclick=()=>{query='';year='';document.getElementById('storeSearch').value='';document.getElementById('storeYear').value='';renderFiltered();document.dispatchEvent(new CustomEvent('panparagon:store-year-changed',{detail:{year:''}}))};
    refreshYears();
  };
  const refreshYears=()=>{
    const s=document.getElementById('storeYear');if(!s)return;
    const old=year,list=availableYears();
    s.innerHTML='<option value="">Wszystkie lata</option>'+list.map(y=>`<option value="${y}">${y}</option>`).join('');
    if(old&&list.includes(old))s.value=old;else if(old)year='';
  };
  const storeCounts=()=>{
    const data=index();if(!data)return {};
    if(!year)return data.allStores||{};
    const out={};
    for(const [month,bucket] of Object.entries(data.monthStores||{})){
      if(!month.startsWith(year+'-'))continue;
      for(const [name,count] of Object.entries(bucket||{}))out[name]=(out[name]||0)+count;
    }
    return out;
  };
  const renderFiltered=()=>{
    ensureControls();refreshYears();const box=document.getElementById('storesTable');if(!box)return;
    const counts=storeCounts();
    const list=Object.entries(counts)
      .filter(([name])=>!query||name.toLocaleLowerCase('pl').includes(query))
      .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'));
    box.innerHTML=list.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony${year?' · '+year:''}</th></tr>${list.map(([n,c],i)=>`<tr><td>${i+1}</td><td>${esc(n)}</td><td><b>${c}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak sklepów pasujących do filtrów.</div>';
    const total=list.reduce((s,x)=>s+x[1],0),info=document.getElementById('storeFilterInfo');
    if(info)info.textContent=`Znaleziono sklepów: ${list.length} · paragony: ${total}${year?' · rok '+year:' · wszystkie lata'}${query?' · wyszukiwanie: „'+query+'”':''}.`;
  };
  const setYear=(value,opts={})=>{
    ensureControls();refreshYears();
    const next=String(value||''),s=document.getElementById('storeYear');
    year=s&&[...s.options].some(o=>o.value===next)?next:'';
    if(s)s.value=year;
    if(opts.render!==false)renderFiltered();
    if(opts.notify!==false)document.dispatchEvent(new CustomEvent('panparagon:store-year-changed',{detail:{year}}));
    return year;
  };
  const install=()=>{
    ensureControls();
    if(document.getElementById('stores')?.classList.contains('on'))renderFiltered();
    document.addEventListener('panparagon:data-changed',e=>{
      if(e?.detail?.reason==='main-render-fast')return;
      refreshYears();
      if(document.getElementById('stores')?.classList.contains('on'))renderFiltered();
    });
  };
  window.PanParagonStoreFilter={getYear:()=>year,setYear,render:renderFiltered,refreshYears};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
