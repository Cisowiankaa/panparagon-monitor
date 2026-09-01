(()=>{
  const selectedYear=()=>document.getElementById('storeYear')?.value||'';
  const storesTable=()=>document.getElementById('storesTable');
  const rowsForYear=(all,year)=>all.filter(r=>{try{const d=rowDate(r);return d&&String(d.getFullYear())===String(year)}catch{return false}});
  const markDetailYear=year=>{
    const title=document.getElementById('storeDetailTitle');
    const sub=title?.parentElement?.querySelector('.sub');
    if(title&&year&&!title.dataset.yearTagged){title.dataset.yearTagged='1';title.textContent=title.textContent+' — '+year}
    if(sub&&year)sub.textContent=`Widok ograniczony do roku ${year}. Kliknij miesiąc, aby zobaczyć paragony z tego okresu.`;
    const yearTable=document.getElementById('storeYearTable');
    const yearCard=yearTable?.closest('.card');
    if(yearCard&&year){const label=yearCard.querySelector('b');if(label)label.textContent=`Podsumowanie roczne — ${year}`}
  };
  const clearYearMark=()=>{
    const title=document.getElementById('storeDetailTitle');
    if(title?.dataset.yearTagged){title.textContent=title.textContent.replace(/\s—\s\d{4}$/,'');delete title.dataset.yearTagged}
    const sub=title?.parentElement?.querySelector('.sub');if(sub)sub.textContent='Kliknij miesiąc, aby zobaczyć wszystkie paragony z tego okresu.';
  };
  const onCapture=e=>{
    const table=storesTable();if(!table||!table.contains(e.target))return;
    const tr=e.target.closest('tr');if(!tr||!table.contains(tr)||tr.rowIndex===0)return;
    const year=selectedYear();
    if(!year){clearYearMark();return}
    if(!Array.isArray(rows))return;
    const original=rows;
    const filtered=rowsForYear(original,year);
    rows=filtered;
    setTimeout(()=>{rows=original;markDetailYear(year)},0);
  };
  const install=()=>{
    const table=storesTable();if(table)table.addEventListener('click',onCapture,true);
    const year=document.getElementById('storeYear');if(year)year.addEventListener('change',()=>{if(!year.value)clearYearMark()});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
