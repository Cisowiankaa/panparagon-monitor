(()=>{
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const localDayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const CHUNK=250;
  let cacheKey='',monthRows=new Map(),sortedMonths=new Set(),renderToken=0,warmToken=0,amountKeyCache='';

  const currentStore=()=>String(window.PanParagonStoreDetails?.getCurrentStore?.()||document.getElementById('storeDetailTitle')?.textContent||'').replace(/\s—\s\d{4}$/,'').trim();
  const currentYear=()=>document.getElementById('storeDetailYear')?.value||'';
  const version=()=>window.PanParagonMainIndex?.version?.()??0;
  const invalidate=()=>{cacheKey='';monthRows=new Map();sortedMonths=new Set();renderToken++;warmToken++;amountKeyCache=''};

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
    monthRows=next;sortedMonths=new Set();cacheKey=key;
    return monthRows;
  };

  const normalizeKey=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pl').trim();
  const amountScore=key=>{
    const k=normalizeKey(key);
    if(/^(kwota|suma|total|amount|wartosc|value|do zaplaty|naleznosc|brutto|gross)$/.test(k))return 100;
    if(/(kwota.*paragon|suma.*paragon|total.*receipt|receipt.*total|do zaplaty|wartosc.*paragon)/.test(k))return 90;
    if(/(kwota|suma|total|amount|wartosc|brutto|gross)/.test(k)&&!/(rabat|discount|vat|podatek|tax|cena|price|unit|jednostk)/.test(k))return 60;
    return 0;
  };
  const amountKey=list=>{
    if(amountKeyCache)return amountKeyCache;
    const keys=new Set(Array.isArray(headers)?headers:[]);
    for(const r of (list||[]).slice(0,40))for(const k of Object.keys(r||{}))keys.add(k);
    let best='',score=0;
    for(const k of keys){const s=amountScore(k);if(s>score){score=s;best=k}}
    amountKeyCache=best;return best;
  };
  const amountText=(r,key)=>{
    if(!key)return '—';
    const raw=r?.[key];
    if(raw==null||String(raw).trim()==='')return '—';
    const text=String(raw).trim();
    if(/[A-Za-zŁł€$£¥]|zł/i.test(text))return text;
    const cleaned=text.replace(/\s/g,'').replace(',','.');
    if(/^-?\d+(?:\.\d+)?$/.test(cleaned)){
      const n=Number(cleaned);
      if(Number.isFinite(n))return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(n);
    }
    return text;
  };

  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=String(value)};
  const renderReceiptRows=(box,list,token)=>{
    if(!box)return;
    if(!list.length){box.innerHTML='<div class="empty">Brak paragonów w tym miesiącu.</div>';return}
    const aKey=amountKey(list);
    box.innerHTML='<table><thead><tr><th>#</th><th>Data paragonu</th><th>Kwota</th></tr></thead><tbody></tbody></table><div class="small" data-receipt-progress style="margin-top:8px"></div>';
    const body=box.querySelector('tbody'),progress=box.querySelector('[data-receipt-progress]');
    let offset=0;
    const step=()=>{
      if(token!==renderToken||!body?.isConnected)return;
      const end=Math.min(offset+CHUNK,list.length),frag=document.createDocumentFragment();
      for(let i=offset;i<end;i++){
        const tr=document.createElement('tr'),d=cachedDate(list[i]),amount=amountText(list[i],aKey);
        tr.innerHTML=`<td>${i+1}</td><td><b>${d?d.toLocaleDateString('pl-PL'):'Brak daty'}</b></td><td><b>${typeof esc==='function'?esc(amount):amount}</b></td>`;
        frag.appendChild(tr);
      }
      body.appendChild(frag);offset=end;
      if(progress)progress.textContent=offset<list.length?`Wyświetlono ${offset} z ${list.length}…`:`Wyświetlono ${list.length} paragonów.`;
      if(offset<list.length)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const showMonth=(key)=>{
    const token=++renderToken,name=currentStore(),index=ensureIndex();let list=index.get(key)||[];
    if(list.length>1&&!sortedMonths.has(key)){list.sort((a,b)=>(cachedDate(a)?.getTime()||0)-(cachedDate(b)?.getTime()||0));sortedMonths.add(key)}
    const days={};
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
    renderReceiptRows(receiptBox,list,token);
    card.style.display='block';card.scrollIntoView({behavior:'smooth',block:'start'});return true;
  };

  const warm=()=>false;
  const install=()=>{
    const detail=document.getElementById('storeDetail');
    if(detail)detail.addEventListener('click',e=>{
      const tr=e.target.closest?.('#storeMonthTable tr[data-month]');if(!tr||!detail.contains(tr))return;
      if(showMonth(tr.dataset.month)){e.preventDefault();e.stopImmediatePropagation()}
    },true);
    document.addEventListener('panparagon:store-detail-updated',invalidate);
    document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.reason==='main-render-fast')return;invalidate()});
  };
  window.PanParagonStoreMonthCache={invalidate,warm};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();