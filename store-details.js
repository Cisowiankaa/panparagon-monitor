(()=>{
  let currentStore='';
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const storeRows=name=>rows.filter(r=>storeName(r)===name);
  const groupStoreMonths=name=>{const months={},years={};let total=0;storeRows(name).forEach(r=>{total++;const d=rowDate(r);if(!d)return;const k=mk(d),y=String(d.getFullYear());months[k]=(months[k]||0)+1;years[y]=(years[y]||0)+1});return{months,years,total}};
  const showView=id=>{document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));const v=document.getElementById(id);if(v)v.classList.add('on');document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===id));};
  const ensureDetail=()=>{
    if(document.getElementById('storeDetail'))return;
    const stores=document.getElementById('stores');if(!stores)return;
    const sec=document.createElement('section');sec.id='storeDetail';sec.className='view';
    sec.innerHTML='<div class="top"><div><button id="backStores">← Wróć do sklepów</button><h1 id="storeDetailTitle" style="margin-top:14px">Sklep</h1><div class="sub">Kliknij miesiąc, aby zobaczyć wszystkie paragony z tego okresu.</div></div></div><div class="grid"><div class="card"><div class="lab">Wszystkie paragony</div><div class="val" id="storeTotal">0</div></div><div class="card"><div class="lab">Miesiące z danymi</div><div class="val" id="storeMonthCount">0</div></div><div class="card"><div class="lab">Najlepszy miesiąc</div><div class="val" style="font-size:20px" id="storeBestMonth">—</div><div class="small" id="storeBestCount">—</div></div><div class="card"><div class="lab">Lata</div><div class="val" id="storeYearCount">0</div></div></div><div class="card"><b>Rozpiska miesięczna</b><div class="small" style="margin-top:4px">Kliknij miesiąc, aby otworzyć listę paragonów.</div><div id="storeMonthTable" style="margin-top:12px"></div></div><div id="storeReceiptCard" class="card" style="margin-top:14px;display:none"><div class="top" style="margin-bottom:8px"><div><b id="storeReceiptTitle">Paragony</b><div class="small" id="storeReceiptMeta"></div></div><button id="closeReceiptList">Zamknij listę</button></div><div class="grid" style="margin-bottom:12px"><div class="card"><div class="lab">Dni z paragonami</div><div class="val" id="storeActiveDays">0</div></div><div class="card"><div class="lab">Najaktywniejszy dzień</div><div class="val" style="font-size:20px" id="storeBestDay">—</div><div class="small" id="storeBestDayCount">—</div></div></div><div><b>Podsumowanie dzienne</b><div id="storeDayTable" style="margin-top:10px"></div></div><div style="margin-top:14px"><b>Lista paragonów</b><div id="storeReceiptTable" style="margin-top:10px"></div></div></div><div class="card" style="margin-top:14px"><b>Podsumowanie roczne</b><div id="storeYearTable" style="margin-top:12px"></div></div>';
    stores.insertAdjacentElement('afterend',sec);
    document.getElementById('backStores').onclick=()=>showView('stores');
    document.getElementById('closeReceiptList').onclick=()=>{document.getElementById('storeReceiptCard').style.display='none'};
  };
  const openMonth=(name,key)=>{
    const list=storeRows(name).filter(r=>{const d=rowDate(r);return d&&mk(d)===key}).sort((a,b)=>(rowDate(a)?.getTime()||0)-(rowDate(b)?.getTime()||0));
    const days={};list.forEach(r=>{const d=rowDate(r);if(!d)return;const k=d.toISOString().slice(0,10);days[k]=(days[k]||0)+1});
    const de=Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0]));
    const best=[...de].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
    const card=document.getElementById('storeReceiptCard');
    document.getElementById('storeReceiptTitle').textContent=`${name} — ${ml(key)}`;
    document.getElementById('storeReceiptMeta').textContent=`Liczba paragonów: ${list.length}`;
    document.getElementById('storeActiveDays').textContent=de.length;
    document.getElementById('storeBestDay').textContent=best?new Date(best[0]+'T12:00:00').toLocaleDateString('pl-PL'):'—';
    document.getElementById('storeBestDayCount').textContent=best?best[1]+' paragonów':'Brak danych';
    document.getElementById('storeDayTable').innerHTML=de.length?'<table><tr><th>Dzień</th><th>Paragony</th></tr>'+de.map(([d,n])=>`<tr><td>${new Date(d+'T12:00:00').toLocaleDateString('pl-PL')}</td><td><b>${n}</b></td></tr>`).join('')+'</table>':'<div class="empty">Brak danych dziennych.</div>';
    document.getElementById('storeReceiptTable').innerHTML=list.length?'<table><tr><th>#</th><th>Data paragonu</th></tr>'+list.map((r,i)=>{const d=rowDate(r);return `<tr><td>${i+1}</td><td><b>${d?d.toLocaleDateString('pl-PL'):'Brak daty'}</b></td></tr>`}).join('')+'</table>':'<div class="empty">Brak paragonów w tym miesiącu.</div>';
    card.style.display='block';card.scrollIntoView({behavior:'smooth',block:'start'});
  };
  const openStore=name=>{
    currentStore=name;ensureDetail();const g=groupStoreMonths(name),me=Object.entries(g.months).sort((a,b)=>b[0].localeCompare(a[0])),ye=Object.entries(g.years).sort((a,b)=>b[0].localeCompare(a[0])),best=[...me].sort((a,b)=>b[1]-a[1])[0];
    document.getElementById('storeDetailTitle').textContent=name;document.getElementById('storeTotal').textContent=g.total;document.getElementById('storeMonthCount').textContent=me.length;document.getElementById('storeYearCount').textContent=ye.length;document.getElementById('storeBestMonth').textContent=best?ml(best[0]):'—';document.getElementById('storeBestCount').textContent=best?best[1]+' paragonów':'Brak danych';
    document.getElementById('storeMonthTable').innerHTML=me.length?'<table><tr><th>Miesiąc</th><th>Paragony</th><th></th></tr>'+me.map(([k,n])=>`<tr class="store-month-row" data-month="${esc(k)}" style="cursor:pointer"><td><button style="padding:0;border:0;background:transparent;color:var(--a);font-weight:700;cursor:pointer">${ml(k)}</button></td><td><b>${n}</b></td><td style="text-align:right"><button class="store-month-open" style="padding:6px 10px">Szczegóły →</button></td></tr>`).join('')+'</table>':'<div class="empty">Brak danych miesięcznych.</div>';
    document.querySelectorAll('.store-month-row').forEach(tr=>tr.onclick=()=>openMonth(name,tr.dataset.month));
    document.getElementById('storeYearTable').innerHTML=ye.length?'<table><tr><th>Rok</th><th>Paragony</th></tr>'+ye.map(([y,n])=>`<tr><td>${y}</td><td><b>${n}</b></td></tr>`).join('')+'</table>':'<div class="empty">Brak danych rocznych.</div>';
    document.getElementById('storeReceiptCard').style.display='none';showView('storeDetail');window.scrollTo({top:0,behavior:'smooth'});
  };
  const wireStores=()=>{const box=document.getElementById('storesTable');if(!box)return;box.querySelectorAll('table tr').forEach((tr,i)=>{if(i===0||tr.dataset.storeWired)return;const cells=tr.querySelectorAll('td');if(cells.length<2)return;const name=cells[1].textContent.trim();tr.dataset.storeWired='1';tr.style.cursor='pointer';tr.title='Kliknij, aby zobaczyć miesiące tego sklepu';tr.onclick=()=>openStore(name);cells[1].innerHTML='<button class="store-open" style="padding:0;border:0;background:transparent;color:var(--a);font-weight:700;cursor:pointer">'+esc(name)+'</button>';const action=document.createElement('td');action.style.textAlign='right';action.innerHTML='<button class="store-details-btn" style="padding:6px 10px">Szczegóły →</button>';action.querySelector('button').onclick=e=>{e.stopPropagation();openStore(name)};tr.appendChild(action);});};
  const install=()=>{ensureDetail();wireStores();const box=document.getElementById('storesTable');if(box)new MutationObserver(wireStores).observe(box,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
