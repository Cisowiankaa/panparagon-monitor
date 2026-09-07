(()=>{
  const KEY='ppm_store_perf_last';
  const state={};
  const now=()=>performance.now();
  const round=n=>Math.round(n*10)/10;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({...state,at:new Date().toISOString()}))}catch{};try{console.table([state])}catch{}};
  const sinceClick=()=>Number.isFinite(state.storeClickStartRaw)?round(now()-state.storeClickStartRaw):null;
  const paint=(label,start)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{state[label]=round(now()-start);save()}));

  const wrap=()=>{
    const idx=window.PanParagonStoreYearDetail;
    if(idx?.rowsForStore&&!idx.rowsForStore.__ppmPerf){
      const base=idx.rowsForStore;
      const fn=function(...args){const t=now(),out=base.apply(this,args);state.rowsForStoreMs=round(now()-t);state.store=String(args[0]||'');state.storeRows=Array.isArray(out)?out.length:0;state.rowsForStoreAfterClickMs=sinceClick();save();return out};
      fn.__ppmPerf=true;idx.rowsForStore=fn;
    }
    if(idx?.rowsForYear&&!idx.rowsForYear.__ppmPerf){
      const base=idx.rowsForYear;
      const fn=function(...args){const t=now(),out=base.apply(this,args);state.rowsForYearMs=round(now()-t);state.year=String(args[0]||'');state.yearRows=Array.isArray(out)?out.length:0;state.rowsForYearAfterClickMs=sinceClick();save();return out};
      fn.__ppmPerf=true;idx.rowsForYear=fn;
    }
    const fast=window.PanParagonStoreClickFast;
    if(fast?.rowsForStoreAsync&&!fast.rowsForStoreAsync.__ppmPerf){
      const base=fast.rowsForStoreAsync;
      const fn=async function(...args){const t=now();const out=await base.apply(this,args);state.rowsForStoreAsyncMs=round(now()-t);state.store=String(args[0]||'');state.storeRows=Array.isArray(out)?out.length:0;state.rowsAsyncDoneAfterClickMs=sinceClick();save();return out};
      fn.__ppmPerf=true;fast.rowsForStoreAsync=fn;
    }
    const api=window.PanParagonStoreDetails;
    if(api?.refreshStore&&!api.refreshStore.__ppmPerf){
      const base=api.refreshStore;
      const fn=function(...args){const t=now(),out=base.apply(this,args);state.refreshStoreMs=round(now()-t);state.refreshDoneAfterClickMs=sinceClick();save();return out};
      fn.__ppmPerf=true;api.refreshStore=fn;
    }
  };

  const resetClick=(name,t)=>{
    for(const k of Object.keys(state))delete state[k];
    state.storeClickStartRaw=t;
    state.storeClickStart=Math.round(t);
    state.storeClickName=name;
    save();
  };

  const install=()=>{
    wrap();
    setTimeout(wrap,0);
    setTimeout(wrap,250);
    document.addEventListener('click',e=>{
      const nav=e.target.closest?.('#nav button[data-v="stores"]');
      if(nav){const t=now();state.storesNavStart=Math.round(t);paint('storesNavPaintMs',t);return}
      const table=document.getElementById('storesTable'),tr=e.target.closest?.('#storesTable tr');
      if(tr&&table?.contains(tr)&&tr.rowIndex!==0){const t=now(),name=(tr.querySelectorAll('td')[1]?.textContent||'').trim();resetClick(name,t);paint('storeDetailPaintMs',t);setTimeout(wrap,0)}
    },true);
    document.addEventListener('panparagon:store-fast-data',e=>{if(!state.storeClickStartRaw)return;state.fastDataAfterClickMs=sinceClick();state.fastDataStore=String(e?.detail?.store||'');save()});
    document.addEventListener('panparagon:store-detail-updated',e=>{if(!state.storeClickStartRaw)return;state.detailUpdatedAfterClickMs=sinceClick();state.detailUpdatedStore=String(e?.detail?.store||'');paint('detailStablePaintMs',state.storeClickStartRaw);save()});
    window.PanParagonStorePerf={getLast:()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}},clear:()=>{try{localStorage.removeItem(KEY)}catch{}},getCurrent:()=>({...state})};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
