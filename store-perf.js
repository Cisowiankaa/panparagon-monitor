(()=>{
  const KEY='ppm_store_perf_last';
  const state={};
  const now=()=>performance.now();
  const round=n=>Math.round(n*10)/10;
  let phaseStart=0,phase='';
  const ensurePanel=()=>{
    const sec=document.getElementById('stores');if(!sec)return null;
    let el=document.getElementById('storePerfMini');
    if(el)return el;
    el=document.createElement('div');el.id='storePerfMini';el.className='small';el.style.cssText='margin:0 0 10px;opacity:.72';
    const table=document.getElementById('storesTable');
    if(table)table.before(el);else sec.appendChild(el);
    return el;
  };
  const bottleneck=()=>{
    const pairs=[['lista',state.storesNavPaintMs],['rekordy',state.rowsForStoreAsyncMs??state.rowsForStoreMs],['render',state.refreshStoreMs],['paint',state.detailStablePaintMs],['CPU',state.longTaskMaxMs]]
      .filter(([,v])=>Number.isFinite(v));
    if(!pairs.length)return'';
    pairs.sort((a,b)=>b[1]-a[1]);
    return pairs[0][1]>=50?` · najwolniej: ${pairs[0][0]} ${pairs[0][1]} ms`:'';
  };
  const renderPanel=()=>{
    const el=ensurePanel();if(!el)return;
    const nav=state.storesNavPaintMs,find=state.rowsForStoreAsyncMs??state.rowsForStoreMs,render=state.refreshStoreMs,stable=state.detailStablePaintMs,long=state.longTaskMaxMs;
    const parts=[];
    if(Number.isFinite(nav))parts.push(`lista ${nav} ms`);
    if(Number.isFinite(find))parts.push(`rekordy ${find} ms`);
    if(Number.isFinite(render))parts.push(`render ${render} ms`);
    if(Number.isFinite(stable))parts.push(`paint ${stable} ms`);
    if(Number.isFinite(long)&&long>=50)parts.push(`blokada CPU ${long} ms`);
    el.textContent=parts.length?'Sklepy · wydajność: '+parts.join(' · ')+bottleneck():'Sklepy · wydajność: gotowe do pomiaru';
  };
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({...state,at:new Date().toISOString()}))}catch{};try{console.table([state])}catch{};renderPanel()};
  const sinceClick=()=>Number.isFinite(state.storeClickStartRaw)?round(now()-state.storeClickStartRaw):null;
  const paint=(label,start)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{state[label]=round(now()-start);save()}));
  const startPhase=name=>{phase=name;phaseStart=now();state.longTaskCount=0;state.longTaskTotalMs=0;state.longTaskMaxMs=0;state.longTaskPhase=name};

  const installLongTaskObserver=()=>{
    if(typeof PerformanceObserver!=='function')return;
    try{
      const po=new PerformanceObserver(list=>{
        if(!phaseStart)return;
        const cutoff=phaseStart-5;
        for(const entry of list.getEntries()){
          if(entry.startTime<cutoff)continue;
          const d=round(entry.duration||0);if(d<50)continue;
          state.longTaskCount=(state.longTaskCount||0)+1;
          state.longTaskTotalMs=round((state.longTaskTotalMs||0)+d);
          state.longTaskMaxMs=Math.max(state.longTaskMaxMs||0,d);
          state.longTaskPhase=phase;
        }
        save();
      });
      po.observe({entryTypes:['longtask']});
    }catch{}
  };

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
    startPhase('kliknięcie sklepu');
    save();
  };

  const install=()=>{
    ensurePanel();renderPanel();wrap();installLongTaskObserver();
    setTimeout(wrap,0);
    setTimeout(wrap,250);
    document.addEventListener('click',e=>{
      const nav=e.target.closest?.('#nav button[data-v="stores"]');
      if(nav){const t=now();for(const k of Object.keys(state))delete state[k];state.storesNavStart=Math.round(t);startPhase('lista sklepów');paint('storesNavPaintMs',t);save();return}
      const table=document.getElementById('storesTable'),tr=e.target.closest?.('#storesTable tr');
      if(tr&&table?.contains(tr)&&tr.rowIndex!==0){const t=now(),name=(tr.querySelectorAll('td')[1]?.textContent||'').trim();resetClick(name,t);paint('storeDetailPaintMs',t);setTimeout(wrap,0)}
    },true);
    document.addEventListener('panparagon:store-fast-data',e=>{if(!state.storeClickStartRaw)return;state.fastDataAfterClickMs=sinceClick();state.fastDataStore=String(e?.detail?.store||'');save()});
    document.addEventListener('panparagon:store-detail-updated',e=>{if(!state.storeClickStartRaw)return;state.detailUpdatedAfterClickMs=sinceClick();state.detailUpdatedStore=String(e?.detail?.store||'');paint('detailStablePaintMs',state.storeClickStartRaw);save()});
    window.PanParagonStorePerf={getLast:()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}},clear:()=>{try{localStorage.removeItem(KEY)}catch{}},getCurrent:()=>({...state})};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
