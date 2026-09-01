(()=>{
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const groupStoreMonths=name=>{
    const months={},years={};let total=0;
    rows.forEach(r=>{if(storeName(r)!==name)return;total++;const d=rowDate(r);if(!d)return;const k=mk(d),y=String(d.getFullYear());months[k]=(months[k]||0)+1;years[y]=(years[y]||0)+1});
    return{months,years,total};
  };
  const ensureDetail=()=>{
    if(document.getElementById('storeDetail'))return;
    const stores=document.getElementById('stores');if(!stores)return;
    const sec=document.createElement('section');sec.id='storeDetail';sec.className='view';sec.innerHTML='<div class="top"><div><button id="backStores">← Wróć do sklepów</button><h1 id="storeDetailTitle" style="margin-top:14px">Sklep</h1><div class="sub">Liczba paragonów w poszczególnych miesiącach.</div></div></div><div class="grid"><div class="card"><div class="lab">Wszystkie paragony</div><div class="val" id="storeTotal">0</div></div><div class="card"><div class="lab">Miesiące z danymi</div><div class="val" id="storeMonthCount">0</div></div><div class="card"><div class="lab">Najlepszy miesiąc</div><div class="val" style="font-size:20px" id="storeBestMonth">—</div><div class="small" id="storeBestCount">—</div></div><div class="card"><div class="lab">Lata</div><div class="val" id="storeYearCount">0</div></div></div><div class="card"><b>Rozpiska miesięczna</b><div id="storeMonthTable" style="margin-top:12px"></div></div><div class="card" style="margin-top:14px"><b>Podsumowanie roczne</b><div id="storeYearTable" style="margin-top:12px"></div></div>';
    stores.insertAdjacentElement('afterend',sec);
    document.getElementById('backStores').onclick=()=>showView('stores');
  };
  const showView=id=>{document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));const v=document.getElementById(id);if(v)v.classList.add('on');document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===id));};
  const openStore=name=>{
    ensureDetail();const g=groupStoreMonths(name),me=Object.entries(g.months).sort((a,b)=>b[0].localeCompare(a[0])),ye=Object.entries(g.years).sort((a,b)=>b[0].localeCompare(a[0])),best=[...me].sort((a,b)=>b[1]-a[1])[0];
    document.getElementById('storeDetailTitle').textContent=name;document.getElementById('storeTotal').textContent=g.total;document.getElementById('storeMonthCount').textContent=me.length;document.getElementById('storeYearCount').textContent=ye.length;document.getElementById('storeBestMonth').textContent=best?ml(best[0]):'—';document.getElementById('storeBestCount').textContent=best?best[1]+' paragonów':'Brak danych';
    document.getElementById('storeMonthTable').innerHTML=me.length?'<table><tr><th>Miesiąc</th><th>Paragony</th></tr>'+me.map(([k,n])=>`<tr><td>${ml(k)}</td><td><b>${n}</b></td></tr>`).join('')+'</table>':'<div class="empty">Brak danych miesięcznych.</div>';
    document.getElementById('storeYearTable').innerHTML=ye.length?'<table><tr><th>Rok</th><th>Paragony</th></tr>'+ye.map(([y,n])=>`<tr><td>${y}</td><td><b>${n}</b></td></tr>`).join('')+'</table>':'<div class="empty">Brak danych rocznych.</div>';
    showView('storeDetail');window.scrollTo({top:0,behavior:'smooth'});
  };
  const wireStores=()=>{
    const box=document.getElementById('storesTable');if(!box)return;
    box.querySelectorAll('table tr').forEach((tr,i)=>{if(i===0)return;const cells=tr.querySelectorAll('td');if(cells.length<2)return;const name=cells[1].textContent.trim();tr.style.cursor='pointer';tr.title='Kliknij, aby zobaczyć miesiące tego sklepu';tr.onclick=()=>openStore(name);cells[1].innerHTML='<button class="store-open" style="padding:0;border:0;background:transparent;color:var(--a);font-weight:700;cursor:pointer">'+esc(name)+'</button>';});
  };
  const install=()=>{ensureDetail();wireStores();const mo=new MutationObserver(wireStores),box=document.getElementById('storesTable');if(box)mo.observe(box,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
