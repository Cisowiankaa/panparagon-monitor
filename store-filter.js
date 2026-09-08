// deployment marker: indexed store year filters + windowed list + deferred nav render + DOM signature cache
(()=>{
  const PAGE=60;
  let query='',year='',shown=PAGE,lastList=[],lastTotal=0,navRaf=0,lastRowsSig='';
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
    document.getElementById('storeSearch').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('pl');shown=PAGE;lastRowsSig='';renderFiltered()});
    document.getElementById('storeYear').addEventListener('change',e=>{year=e.target.value;shown=PAGE;lastRowsSig='';renderFiltered();document.dispatchEvent(new CustomEvent('panparagon:store-year-changed',{detail:{year}}))});
    document.getElementById('storeFilterClear').onclick=()=>{query='';year='';shown=PAGE;lastRowsSig='';document.getElementById('storeSearch').value='';document.getElementById('storeYear').value='';renderFiltered();document.dispatchEvent(new CustomEvent('panparagon:store-year-changed',{detail:{year:''}}))};
    refreshYears();
  };
  const refreshYears=()=>{
    const s=document.getElementById('storeYear');if(!s)return;
    const old=year,list=availableYears(),sig=['',...list].join('|');
    if(s.dataset.yearsSig!==sig){
      s.innerHTML='<option value="">Wszystkie lata</option>'+list.map(y=>`<option value="${y}">${y}</option>`).join('');
      s.dataset.yearsSig=sig;
    }
    if(old&&list.includes(old))s.value=old;else if(old)year='';
  };
  const storeEntries=()=>{
    const data=index();if(!data)return [];
    if(!year){
      if(Array.isArray(data.ae))return data.ae;
      return Object.entries(data.allStores||{}).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'));
    }
    const out={};
    for(const [month,bucket] of Object.entries(data.monthStores||{})){
      if(!month.startsWith(year+'-'))continue;
      for(const [name,count] of Object.entries(bucket||{}))out[name]=(out[name]||0)+count;
    }
    return Object.entries(out).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'));
  };
  const wireMoreButton=()=>{
    const box=document.getElementById('storesTable');if(!box)return;
    let wrap=document.getElementById('storeLoadMoreWrap');
    const remaining=Math.max(0,lastList.length-Math.min(shown,lastList.length));
    if(!remaining){wrap?.remove();return}
    if(!wrap){
      wrap=document.createElement('div');wrap.id='storeLoadMoreWrap';wrap.style.cssText='text-align:center;padding:14px 0 2px';
      const btn=document.createElement('button');btn.id='storeLoadMore';wrap.appendChild(btn);box.appendChild(wrap);
    }
    const btn=wrap.querySelector('#storeLoadMore');
    if(btn){btn.textContent=`Pokaż więcej (${Math.min(PAGE,remaining)})`;btn.onclick=()=>{shown+=PAGE;renderRows();updateInfo()}}
  };
  const renderRows=()=>{
    const box=document.getElementById('storesTable');if(!box)return;
    if(!lastList.length){
      if(lastRowsSig!=='empty'){box.innerHTML='<div class="empty">Brak sklepów pasujących do filtrów.</div>';lastRowsSig='empty'}
      return;
    }
    const visible=lastList.slice(0,shown),more=visible.length<lastList.length;
    const sig=`${year}|${shown}|${lastList.length}|${visible.map(([n,c])=>`${n}\u0001${c}`).join('\u0002')}`;
    if(sig===lastRowsSig){wireMoreButton();return}
    lastRowsSig=sig;
    box.innerHTML=`<table><tr><th>#</th><th>Sklep</th><th>Paragony${year?' · '+year:''}</th></tr>${visible.map(([n,c],i)=>`<tr><td>${i+1}</td><td>${esc(n)}</td><td><b>${c}</b></td></tr>`).join('')}</table>`;
    if(more)wireMoreButton();
  };
  const updateInfo=()=>{
    const info=document.getElementById('storeFilterInfo');if(!info)return;
    const visible=Math.min(shown,lastList.length),text=`Znaleziono sklepów: ${lastList.length} · pokazano: ${visible} · paragony: ${lastTotal}${year?' · rok '+year:' · wszystkie lata'}${query?' · wyszukiwanie: „'+query+'”':''}.`;
    if(info.textContent!==text)info.textContent=text;
  };
  const renderFiltered=()=>{
    ensureControls();refreshYears();
    const base=storeEntries();
    lastList=query?base.filter(([name])=>name.toLocaleLowerCase('pl').includes(query)):base;
    lastTotal=lastList.reduce((s,x)=>s+x[1],0);
    renderRows();updateInfo();
  };
  const primeExistingTable=()=>{
    ensureControls();refreshYears();
    if(query||year)return false;
    const box=document.getElementById('storesTable'),table=box?.querySelector('table');
    if(!table)return false;
    lastList=storeEntries();
    lastTotal=lastList.reduce((s,x)=>s+x[1],0);
    shown=Math.min(PAGE,lastList.length);
    updateInfo();wireMoreButton();
    return true;
  };
  const setYear=(value,opts={})=>{
    ensureControls();refreshYears();
    const next=String(value||''),s=document.getElementById('storeYear');
    year=s&&[...s.options].some(o=>o.value===next)?next:'';
    if(s)s.value=year;
    if(opts.render!==false){shown=PAGE;lastRowsSig='';renderFiltered()}
    if(opts.notify!==false)document.dispatchEvent(new CustomEvent('panparagon:store-year-changed',{detail:{year}}));
    return year;
  };
  const scheduleNavRender=()=>{
    cancelAnimationFrame(navRaf);
    navRaf=requestAnimationFrame(()=>{
      navRaf=requestAnimationFrame(()=>{
        shown=PAGE;
        if(!primeExistingTable())renderFiltered();
      });
    });
  };
  const install=()=>{
    ensureControls();
    if(document.getElementById('stores')?.classList.contains('on')){if(!primeExistingTable())renderFiltered()}
    document.addEventListener('click',e=>{
      if(e.target.closest?.('#nav button[data-v="stores"]'))scheduleNavRender();
    });
    document.addEventListener('panparagon:data-changed',e=>{
      if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;
      lastRowsSig='';refreshYears();
      if(document.getElementById('stores')?.classList.contains('on')){shown=PAGE;renderFiltered()}
    });
  };
  window.PanParagonStoreFilter={getYear:()=>year,setYear,render:renderFiltered,refreshYears};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
