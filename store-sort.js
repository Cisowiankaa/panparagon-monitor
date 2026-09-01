(()=>{
  const parseNum=t=>{const m=String(t||'').replace(/\s/g,'').match(/[+-]?\d+/);return m?Number(m[0]):-Infinity};
  const ensureControls=()=>{
    const box=document.getElementById('storeMonthTable');
    if(!box||document.getElementById('storeMonthSort'))return;
    const wrap=document.createElement('div');
    wrap.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px';
    wrap.innerHTML='<span class="small"><b>Sortuj:</b></span><select id="storeMonthSort"><option value="date-desc">Miesiąc: najnowsze</option><option value="date-asc">Miesiąc: najstarsze</option><option value="count-desc">Paragony: najwięcej</option><option value="count-asc">Paragony: najmniej</option><option value="mom-desc">Największy wzrost</option><option value="mom-asc">Największy spadek</option></select>';
    box.parentElement.insertBefore(wrap,box);
    document.getElementById('storeMonthSort').addEventListener('change',sortRows);
  };
  const sortRows=()=>{
    const table=document.querySelector('#storeMonthTable table');
    const sel=document.getElementById('storeMonthSort');
    if(!table||!sel)return;
    const body=table.tBodies[0]||table;
    const rows=[...body.querySelectorAll('tr')].filter(r=>r.querySelector('td'));
    const mode=sel.value;
    const data=rows.map(r=>({r,key:r.dataset.month||'',count:parseNum(r.cells[1]?.textContent),mom:parseNum(r.cells[2]?.textContent)}));
    data.sort((a,b)=>{
      if(mode==='date-asc')return a.key.localeCompare(b.key);
      if(mode==='date-desc')return b.key.localeCompare(a.key);
      if(mode==='count-asc')return a.count-b.count||b.key.localeCompare(a.key);
      if(mode==='count-desc')return b.count-a.count||b.key.localeCompare(a.key);
      if(mode==='mom-asc')return a.mom-b.mom||b.key.localeCompare(a.key);
      if(mode==='mom-desc')return b.mom-a.mom||b.key.localeCompare(a.key);
      return 0;
    });
    data.forEach(x=>body.appendChild(x.r));
  };
  const refresh=()=>{ensureControls();setTimeout(sortRows,0)};
  const install=()=>{
    refresh();
    const target=document.getElementById('storeMonthTable');
    if(target)new MutationObserver(refresh).observe(target,{childList:true,subtree:true});
    new MutationObserver(()=>{if(document.getElementById('storeMonthTable'))refresh()}).observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
