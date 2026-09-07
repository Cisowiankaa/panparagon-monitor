(()=>{
  const base=window.PanParagonStoreYearDetail;if(!base)return;
  const CHUNK=700;
  let ready=false,building=false,dirty=true,source=null,size=-1,dc='',sc='',storeMap=new Map(),yearMap=new Map();
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const cachedDate=r=>{try{return window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r)}catch{return null}};
  const key=(name,year)=>`${name}|${year}`;
  const currentSig=()=>({src:Array.isArray(rows)?rows:null,n:Array.isArray(rows)?rows.length:0,dc:String(typeof dateCol==='undefined'?'':dateCol||''),sc:String(typeof storeCol==='undefined'?'':storeCol||'')});
  const sameSig=s=>s.src===source&&s.n===size&&s.dc===dc&&s.sc===sc;
  const yieldIdle=()=>new Promise(resolve=>{
    if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout:120});
    else setTimeout(resolve,0);
  });
  const build=async()=>{
    const sig=currentSig();
    if(building||!sig.src||!sig.n)return;
    if(!dirty&&ready&&sameSig(sig))return;
    building=true;ready=false;
    const nextStore=new Map(),nextYear=new Map(),src=sig.src;
    try{
      for(let i=0;i<src.length;i+=CHUNK){
        const end=Math.min(src.length,i+CHUNK);
        for(let j=i;j<end;j++){
          const r=src[j],name=storeName(r);
          let a=nextStore.get(name);if(!a){a=[];nextStore.set(name,a)}a.push(r);
          const d=cachedDate(r);if(!d)continue;
          const y=String(d.getFullYear()),k=key(name,y);
          let b=nextYear.get(k);if(!b){b=[];nextYear.set(k,b)}b.push(r);
        }
        if(end<src.length)await yieldIdle();
      }
      const now=currentSig();
      if(now.src!==src||now.n!==sig.n||now.dc!==sig.dc||now.sc!==sig.sc){dirty=true;return}
      storeMap=nextStore;yearMap=nextYear;source=src;size=sig.n;dc=sig.dc;sc=sig.sc;dirty=false;ready=true;
    }finally{
      building=false;
      if(dirty)queueBuild();
    }
  };
  let queued=false;
  const queueBuild=()=>{
    if(queued||building)return;queued=true;
    const run=()=>{queued=false;build().catch(()=>{})};
    if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:900});else setTimeout(run,120);
  };
  const originalStore=base.rowsForStore?.bind(base),originalYear=base.rowsForYear?.bind(base),originalInvalidate=base.invalidate?.bind(base);
  const rowsForStore=name=>{
    const sig=currentSig();
    if(ready&&!dirty&&sameSig(sig))return storeMap.get(name)||[];
    queueBuild();
    return originalStore?originalStore(name):[];
  };
  const rowsForYear=(year,name)=>{
    const sig=currentSig();
    if(ready&&!dirty&&sameSig(sig))return yearMap.get(key(name,String(year)))||[];
    queueBuild();
    return originalYear?originalYear(year,name):[];
  };
  const invalidate=()=>{dirty=true;ready=false;try{originalInvalidate?.()}catch{}queueBuild()};
  base.rowsForStore=rowsForStore;base.rowsForYear=rowsForYear;base.invalidate=invalidate;
  window.PanParagonStoreIndexPrewarm={isReady:()=>ready&&!dirty,rebuild:()=>{dirty=true;queueBuild()}};
  document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')return;dirty=true;ready=false;queueBuild()});
  let tries=0;
  const waitRows=()=>{tries++;if(Array.isArray(rows)&&rows.length){queueBuild();return}if(tries<120)setTimeout(waitRows,50)};
  waitRows();
})();
