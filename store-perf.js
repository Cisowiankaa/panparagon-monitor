(()=>{
  const KEY='ppm_store_perf_last';
  const state={};
  const now=()=>performance.now();
  const round=n=>Math.round(n*10)/10;
  let saveTimer=0;

  const ensurePanel=()=>{
    const sec=document.getElementById('stores');if(!sec)return null;
    let el=document.getElementById('storePerfMini');
    if(el)return el;
    el=document.createElement('div');el.id='storePerfMini';el.className='small';el.style.cssText='margin:0 0 10px;opacity:.72';
    const table=document.getElementById('storesTable');if(table)table.before(el);else sec.appendChild(el);
    return el;
  };
  const renderPanel=()=>{
    const el=ensurePanel();if(!el)return;
    const parts=[];
    if(Number.isFinite(state.storesNavPaintMs))parts.push(`lista ${state.storesNavPaintMs} ms`);
    if(Number.isFinite(state.rowsForStoreMs))parts.push(`rekordy ${state.rowsForStoreMs} ms`);
    if(Number.isFinite(state.refreshStoreMs))parts.push(`render ${state.refreshStoreMs} ms`);
    if(Number.isFinite(state.detailStablePaintMs))parts.push(`paint ${state.detailStablePaintMs} ms`);
    el.textContent=parts.length?'Sklepy · wydajność: '+parts.join(' · '):'Sklepy · wydajność: gotowe do pomiaru';
  };
  const save=()=>{
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{
      try{localStorage.setItem(KEY,JSON.stringify({...state,at:new Date().toISOString()}))}catch{}
      renderPanel();
    },120);
  };
  const paint=(label,start)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{state[label]=round(now()-start);save()}));

  const wrap=()=>{
    const idx=window.PanParagonStoreYearDetail;
    if(idx?.rowsForStore&&!idx.rowsForStore.__ppmPerf){
      const base=idx.rowsForStore;
      const fn=function(...args){const t=now(),out=base.apply(this,args);state.rowsForStoreMs=round(now()-t);state.storeRows=Array.isArray(out)?out.length:0;return out};
      fn.__ppmPerf=true;idx.rowsForStore=fn;
    }
    const api=window.PanParagonStoreDetails;
    if(api?.refreshStore&&!api.refreshStore.__ppmPerf){
      const base=api.refreshStore;
      const fn=function(...args){const t=now(),out=base.apply(this,args);state.refreshStoreMs=round(now()-t);return out};
      fn.__ppmPerf=true;api.refreshStore=fn;
    }
  };

  const install=()=>{
    ensurePanel();renderPanel();wrap();setTimeout(wrap,250);
    document.addEventListener('click',e=>{
      const nav=e.target.closest?.('#nav button[data-v="stores"]');
      if(nav){const t=now();for(const k of Object.keys(state))delete state[k];paint('storesNavPaintMs',t);return}
      const table=document.getElementById('storesTable'),tr=e.target.closest?.('#storesTable tr');
      if(tr&&table?.contains(tr)&&tr.rowIndex!==0){
        const t=now();for(const k of Object.keys(state))delete state[k];
        state.store=(tr.querySelectorAll('td')[1]?.textContent||'').trim();state.storeClickStartRaw=t;
        setTimeout(wrap,0);
      }
    },true);
    document.addEventListener('panparagon:store-detail-updated',()=>{
      if(!Number.isFinite(state.storeClickStartRaw))return;
      paint('detailStablePaintMs',state.storeClickStartRaw);
    });
    window.PanParagonStorePerf={
      getLast:()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}},
      clear:()=>{try{localStorage.removeItem(KEY)}catch{};for(const k of Object.keys(state))delete state[k];renderPanel()},
      getCurrent:()=>({...state})
    };
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
