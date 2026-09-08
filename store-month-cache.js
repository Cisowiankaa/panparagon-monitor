(()=>{
  const cachedDate=r=>window.PanParagonDateCache?.get?window.PanParagonDateCache.get(r):rowDate(r);
  const localDayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const CHUNK=250;
  let cacheKey='',monthRows=new Map(),sortedMonths=new Set(),renderToken=0;

  const currentStore=()=>String(window.PanParagonStoreDetails?.getCurrentStore?.()||document.getElementById('storeDetailTitle')?.textContent||'').replace(/\s—\s\d{4}$/,'').trim();
  const version=()=>window.PanParagonMainIndex?.version?.()??0;
  const invalidate=()=>{cacheKey='';monthRows=new Map();sortedMonths=new Set();renderToken++};

  const sourceRows=()=>{
    const name=currentStore(),api=window.PanParagonStoreYearDetail;
    if(!name)return [];
    const src=api?.rowsForStore?.(name);
    if(Array.isArray(src)&&src.length)return src;
    if(!Array.isArray(rows))return [];
    const col=typeof storeCol==='string'?storeCol:'';
    return rows.filter(r=>{
      try{return String(r?.[col]||'Nieznany sklep').trim()===name}catch{return false}
    });
  };

  const ensureIndex=()=>{
    const name=currentStore(),key=`${name}|${version()}`;
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

  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=String(value)};
  const renderReceiptRows=(box,list,token)=>{
    if(!box)return;
    if(!list.length){box.innerHTML='<div class="empty">Brak paragonów w tym miesiącu.</div>';return}
    box.innerHTML='<table><thead><tr><th>#</th><th>Data paragonu</th></tr></thead><tbody></tbody></table><div class="small" data-receipt-progress style="margin-top:8px"></div>';
    const body=box.querySelector('tbody'),progress=box.querySelector('[data-receipt-progress]');
    let offset=0;
    const step=()=>{
      if(token!==renderToken||!body?.isConnected)return;
      const end=Math.min(offset+CHUNK,list.length),frag=document.createDocumentFragment();
      for(let i=offset;i<end;i++){
        const tr=document.createElement('tr'),d=cachedDate(list[i]);
        tr.innerHTML=`<td>${i+1}</td><td><b>${d?d.toLocaleDateString('pl-PL'):'Brak daty'}</b></td>`;
        frag.appendChild(tr);
      }
      body.appendChild(frag);offset=end;
      if(progress)progress.textContent=offset<list.length?`Wyświetlono ${offset} z ${list.length}…`:`Wyświetlono ${list.length} paragonów.`;
      if(offset<list.length)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const showMonth=key=>{
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
