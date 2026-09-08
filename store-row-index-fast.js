(()=>{
  const CHUNK=700;
  let source=null,indexing=false,ready=false,pos=0;
  let byStore=new Map(),byStoreYear=new Map(),stats=new Map();
  const storeName=r=>{try{return (r?.[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const rowDateFast=r=>{try{return window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r)}catch{return null}};
  const idle=fn=>{'requestIdleCallback'in window?requestIdleCallback(fn,{timeout:120}):setTimeout(()=>fn({timeRemaining:()=>8,didTimeout:true}),16)};
  const reset=()=>{source=Array.isArray(rows)?rows:null;indexing=false;ready=false;pos=0;byStore=new Map();byStoreYear=new Map();stats=new Map()};
  const add=r=>{
    const name=storeName(r);
    let list=byStore.get(name);if(!list){list=[];byStore.set(name,list)}list.push(r);
    let s=stats.get(name);if(!s){s={months:{},years:{},total:0};stats.set(name,s)}s.total++;
    const d=rowDateFast(r);if(!d)return;
    const y=String(d.getFullYear()),k=typeof mk==='function'?mk(d):`${y}-${String(d.getMonth()+1).padStart(2,'0')}`;
    s.months[k]=(s.months[k]||0)+1;s.years[y]=(s.years[y]||0)+1;
    const key=name+'|'+y;let yl=byStoreYear.get(key);if(!yl){yl=[];byStoreYear.set(key,yl)}yl.push(r);
  };
  const step=deadline=>{
    if(!indexing||!source)return;
    const src=source,start=pos;
    while(pos<src.length&&(pos-start<CHUNK||deadline?.timeRemaining?.()>2)){add(src[pos++])}
    if(pos<src.length){idle(step);return}
    indexing=false;ready=true;
  };
  const start=()=>{
    const src=Array.isArray(rows)?rows:null;
    if(!src||!src.length)return false;
    if(ready&&source===src)return true;
    if(indexing&&source===src)return false;
    reset();source=src;indexing=true;idle(step);return false;
  };
  const ensureStart=()=>{if(start()||indexing)return;setTimeout(ensureStart,80)};
  const original=()=>window.PanParagonStoreYearDetail;
  const wrap=()=>{
    const api=original();if(!api||api.__fastRowIndex)return false;
    const baseStore=typeof api.rowsForStore==='function'?api.rowsForStore.bind(api):null;
    const baseYear=typeof api.rowsForYear==='function'?api.rowsForYear.bind(api):null;
    api.rowsForStore=name=>{start();return ready&&source===rows?(byStore.get(name)||[]):baseStore?baseStore(name):[]};
    api.rowsForYear=(year,name)=>{start();return ready&&source===rows?(byStoreYear.get(String(name||'')+'|'+String(year||''))||[]):baseYear?baseYear(year,name):[]};
    api.__fastRowIndex=true;return true;
  };
  window.PanParagonStoreClickFast={
    isPrewarmed:()=>ready&&source===rows,
    rowsForStore:name=>ready&&source===rows?(byStore.get(name)||[]):null,
    rowsForYear:(name,year)=>ready&&source===rows?(byStoreYear.get(String(name||'')+'|'+String(year||''))||[]):null,
    statsForStore:name=>ready&&source===rows?(stats.get(name)||{months:{},years:{},total:0}):null,
    rebuild:()=>{reset();start()},
    status:()=>({ready,indexing,position:pos,total:Array.isArray(source)?source.length:0})
  };
  document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;reset();start()});
  let tries=0;const boot=()=>{tries++;wrap();if(Array.isArray(rows)&&rows.length)start();if((!wrap()||!Array.isArray(rows)||!rows.length)&&tries<120)setTimeout(boot,50)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
