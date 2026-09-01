(()=>{
  let lastStore='';
  const selectedYear=()=>document.getElementById('storeYear')?.value||'';
  const storesTable=()=>document.getElementById('storesTable');
  const rowsForYear=(all,year)=>all.filter(r=>{try{const d=rowDate(r);return d&&String(d.getFullYear())===String(year)}catch{return false}});
  const availableYears=()=>[...new Set((Array.isArray(rows)?rows:[]).map(r=>{try{return rowDate(r)?.getFullYear()}catch{return null}}).filter(Boolean))].sort((a,b)=>b-a);
  const baseStoreName=()=>{const title=document.getElementById('storeDetailTitle');return (title?.textContent||'').replace(/\s—\s\d{4}$/,'').trim()};
  const markDetailYear=year=>{
    const title=document.getElementById('storeDetailTitle');
    const sub=title?.parentElement?.querySelector('.sub');
    if(title){const base=title.textContent.replace(/\s—\s\d{4}$/,'');title.textContent=year?base+' — '+year:base;title.dataset.yearTagged=year?'1':''}
    if(sub)sub.textContent=year?`Widok ograniczony do roku ${year}. Kliknij miesiąc, aby zobaczyć paragony z tego okresu.`:'Kliknij miesiąc, aby zobaczyć wszystkie paragony z tego okresu.';
    const yearTable=document.getElementById('storeYearTable');
    const yearCard=yearTable?.closest('.card');
    if(yearCard){const label=yearCard.querySelector('b');if(label)label.textContent=year?`Podsumowanie roczne — ${year}`:'Podsumowanie roczne'}
    syncDetailSelector(year);
  };
  const clearYearMark=()=>markDetailYear('');
  const ensureDetailSelector=()=>{
    const detail=document.getElementById('storeDetail'),title=document.getElementById('storeDetailTitle');
    if(!detail||!title)return null;
    let box=document.getElementById('storeDetailYearBox');
    if(!box){
      box=document.createElement('div');box.id='storeDetailYearBox';box.className='actions';box.style.marginTop='14px';
      box.innerHTML='<label class="small" for="storeDetailYear" style="align-self:center">Rok:</label><select id="storeDetailYear"><option value="">Wszystkie lata</option></select>';
      const sub=title.parentElement?.querySelector('.sub');(sub||title).insertAdjacentElement('afterend',box);
      document.getElementById('storeDetailYear').addEventListener('change',e=>switchDetailYear(e.target.value));
    }
    const sel=document.getElementById('storeDetailYear'),current=sel.value;
    sel.innerHTML='<option value="">Wszystkie lata</option>'+availableYears().map(y=>`<option value="${y}">${y}</option>`).join('');
    if([...sel.options].some(o=>o.value===current))sel.value=current;
    return sel;
  };
  const syncDetailSelector=year=>{const sel=ensureDetailSelector();if(sel&&[...sel.options].some(o=>o.value===String(year)))sel.value=String(year);else if(sel&&!year)sel.value=''};
  const findStoreRow=name=>[...document.querySelectorAll('#storesTable table tr')].find((tr,i)=>i>0&&(tr.querySelectorAll('td')[1]?.textContent||'').trim()===name);
  const switchDetailYear=year=>{
    const name=lastStore||baseStoreName();if(!name)return;
    const mainYear=document.getElementById('storeYear');if(mainYear)mainYear.value=year;
    const back=document.getElementById('backStores');if(back)back.click();
    setTimeout(()=>{
      if(mainYear){mainYear.dispatchEvent(new Event('change',{bubbles:true}))}
      setTimeout(()=>{const tr=findStoreRow(name);if(tr)tr.click()},30);
    },0);
  };
  const onCapture=e=>{
    const table=storesTable();if(!table||!table.contains(e.target))return;
    const tr=e.target.closest('tr');if(!tr||!table.contains(tr)||tr.rowIndex===0)return;
    const name=(tr.querySelectorAll('td')[1]?.textContent||'').trim();if(name)lastStore=name;
    const year=selectedYear();
    if(!year){setTimeout(()=>{clearYearMark();ensureDetailSelector()},0);return}
    if(!Array.isArray(rows))return;
    const original=rows,filtered=rowsForYear(original,year);rows=filtered;
    setTimeout(()=>{rows=original;markDetailYear(year);ensureDetailSelector()},0);
  };
  const install=()=>{
    const table=storesTable();if(table)table.addEventListener('click',onCapture,true);
    const year=document.getElementById('storeYear');if(year)year.addEventListener('change',()=>{if(!year.value)clearYearMark()});
    const detail=document.getElementById('storeDetail');if(detail)new MutationObserver(()=>{if(detail.classList.contains('on'))ensureDetailSelector()}).observe(detail,{attributes:true,attributeFilter:['class'],subtree:false});
    ensureDetailSelector();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
