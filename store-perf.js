(()=>{
  const KEY='ppm_store_perf_last';
  const state={};
  const now=()=>performance.now();
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({...state,at:new Date().toISOString()}))}catch{};try{console.table([state])}catch{}};
  const paint=(label,start)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{state[label]=Math.round((now()-start)*10)/10;save()}));

  const wrap=()=>{
    const idx=window.PanParagonStoreYearDetail;
    if(idx?.rowsForStore&&!idx.rowsForStore.__ppmPerf){
      const base=idx.rowsForStore;
      const fn=function(...args){const t=now(),out=base.apply(this,args);state.rowsForStoreMs=Math.round((now()-t)*10)/10;state.store=String(args[0]||'');state.storeRows=Array.isArray(out)?out.length:0;save();return out};
      fn.__ppmPerf=true;idx.rowsForStore=fn;
    }
    if(idx?.rowsForYear&&!idx.rowsForYear.__ppmPerf){
      const base=idx.rowsForYear;
      const fn=function(...args){const t=now(),out=base.apply(this,args);state.rowsForYearMs=Math.round((now()-t)*10)/10;state.year=String(args[0]||'');state.yearRows=Array.isArray(out)?out.length:0;save();return out};
      fn.__ppmPerf=true;idx.rowsForYear=fn;
    }
    const api=window.PanParagonStoreDetails;
    if(api?.refreshStore&&!api.refreshStore.__ppmPerf){
      const base=api.refreshStore;
      const fn=function(...args){const t=now(),out=base.apply(this,args);state.refreshStoreMs=Math.round((now()-t)*10)/10;save();return out};
      fn.__ppmPerf=true;api.refreshStore=fn;
    }
  };

  const install=()=>{
    wrap();
    setTimeout(wrap,0);
    document.addEventListener('click',e=>{
      const nav=e.target.closest?.('#nav button[data-v="stores"]');
      if(nav){const t=now();state.storesNavStart=Math.round(t);paint('storesNavPaintMs',t);return}
      const table=document.getElementById('storesTable'),tr=e.target.closest?.('#storesTable tr');
      if(tr&&table?.contains(tr)&&tr.rowIndex!==0){const t=now();state.storeClickStart=Math.round(t);state.storeClickName=(tr.querySelectorAll('td')[1]?.textContent||'').trim();paint('storeDetailPaintMs',t)}
    },true);
    window.PanParagonStorePerf={getLast:()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}},clear:()=>{try{localStorage.removeItem(KEY)}catch{}}};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
