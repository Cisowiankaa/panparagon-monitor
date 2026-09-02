(()=>{
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const localDayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  let cacheKey='',monthRows=new Map();

  const currentStore=()=>String(window.PanParagonStoreDetails?.getCurrentStore?.()||document.getElementById('storeDetailTitle')?.textContent||'').replace(/\s—\s\d{4}$/,'').trim();
  const currentYear=()=>document.getElementById('storeDetailYear')?.value||'';
  const version=()=>window.PanParagonMainIndex?.version?.()??0;
  const invalidate=()=>{cacheKey='';monthRows=new Map()};

  const sourceRows=()=>{
    const name=currentStore(),year=currentYear(),api=window.PanParagonStoreYearDetail;
    if(!name||!api)return [];
    const src=year?api.rowsForYear?.(year,name):api.rowsForStore?.(name);
    return Array.isArray(src)?src:[];
  };

  const ensureIndex=()=>{
    const name=currentStore(),year=currentYear(),key=`${name}|${year}|${version()}`;
    if(key===cacheKey)return monthRows;
    const next=new Map();
    for(const r of sourceRows()){
      const d=cachedDate(r);if(!d)continue;
      const k=mk(d);if(!k)continue;
      let list=next.get(k);if(!list){list=[];next.set(k,list)}
      list.push(r);
    }
    for(const list of next.values())list.sort((a,b)=>(cachedDate(a)?.getTime()||0)-(cachedDate(b)?.getTime()||0));
    monthRows=next;cacheKey=key;
    return monthRows;
  };

  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=String(value)};
  const showMonth=(key)=>{
    const name=currentStore(),list=ensureIndex().get(key)||[],days={};
    for(const r of list){const d=cachedDate(r);if(!d)continue;const dk=localDayKey(d);days[dk]=(days[dk]||0)+1}
    const de=Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0])),best=[...de].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0],card=document.getElementById('storeReceiptCard');
    if(!card)return false;
    setText('storeReceiptTitle',`${name} — ${ml(key)}`);
    setText('storeReceiptMeta',`Liczba paragonów: ${list.length}`);
    setText('storeActiveDays',de.length);
    setText('storeBestDay',best?new Date(best[0]+'T12:00:00').toLocaleDateString('pl-PL'):'—');
    setText('storeBestDayCount',best?best[1]+' paragonów':'Brak danych');
    const dayBox=document.getElementById('storeDayTable'),receiptBox=document.getElementById('storeReceiptTable');
    if(dayBox)dayBox.innerHTML=de.length?'<table><tr><th>Dzień</th><th>Paragony</th></tr>'+de.map(([d,n])=>`<tr><td>${new Date(d+'T12:00:00').toLocaleDateString('pl-PL')}</td><td><b>${n}</b></td></tr>`).join('')+'</table>':'<div class="empty">Brak danych dziennych.</div>';
    if(receiptBox)receiptBox.innerHTML=list.length?'<table><tr><th>#</th><th>Data paragonu</th></tr>'+list.map((r,i)=>{const d=cachedDate(r);return `<tr><td>${i+1}</td><td><b>${d?d.toLocaleDateString('pl-PL'):'Brak daty'}</b></td></tr>`}).join('')+'</table>':'<div class="empty">Brak paragonów w tym miesiącu.</div>';
    card.style.display='block';card.scrollIntoView({behavior:'smooth',block:'start'});return true;
  };

  const warm=()=>{if(document.getElementById('storeDetail')?.classList.contains('on'))requestAnimationFrame(()=>{try{ensureIndex()}catch{}})};
  const install=()=>{
    const detail=document.getElementById('storeDetail');
    if(detail)detail.addEventListener('click',e=>{
      const tr=e.target.closest?.('#storeMonthTable tr[data-month]');if(!tr||!detail.contains(tr))return;
      if(showMonth(tr.dataset.month)){e.preventDefault();e.stopImmediatePropagation()}
    },true);
    document.addEventListener('panparagon:store-detail-updated',()=>{invalidate();warm()});
    document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.reason==='main-render-fast')return;invalidate()});
    if(detail)new MutationObserver(()=>{if(detail.classList.contains('on'))warm()}).observe(detail,{attributes:true,attributeFilter:['class']});
  };
  window.PanParagonStoreMonthCache={invalidate,warm};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();