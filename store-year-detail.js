(()=>{
  let lastStore='',fullRowsCache=[];
  const selectedYear=()=>document.getElementById('storeYear')?.value||'';
  const storesTable=()=>document.getElementById('storesTable');
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const rememberFullRows=(src)=>{if(Array.isArray(src)&&src.length>=fullRowsCache.length)fullRowsCache=src.slice()};
  const rowsForYear=(all,year)=>all.filter(r=>{try{const d=rowDate(r);return d&&String(d.getFullYear())===String(year)}catch{return false}});
  const availableYears=()=>{
    const src=fullRowsCache.length?fullRowsCache:(Array.isArray(rows)?rows:[]),name=lastStore||baseStoreName();
    const set=new Set();
    src.forEach(r=>{try{if(name&&storeName(r)!==name)return;const y=rowDate(r)?.getFullYear();if(y)set.add(y)}catch{}});
    return [...set].sort((a,b)=>b-a);
  };
  const baseStoreName=()=>{const title=document.getElementById('storeDetailTitle');return (title?.textContent||'').replace(/\s—\s\d{4}$/,'').trim()};
  const markDetailYear=year=>{
    const title=document.getElementById('storeDetailTitle');
    const sub=title?.parentElement?.querySelector('.sub');
    if(title){const base=title.textContent.replace(/\s—\s\d{4}$/,'');title.textContent=year?base+' — '+year:base;title.dataset.yearTagged=year?'1':''}
    if(sub)sub.textContent=year?`Widok ograniczony do roku ${year}. Kliknij miesiąc, aby zobaczyć paragony z tego okresu.`:'Kliknij miesiąc, aby zobaczyć wszystkie paragony z tego okresu.';
    const yearTable=document.getElementById('storeYearTable');
    const yearCard=yearTable?.closest('.card');
    if(yearCard){const label=yearCard.querySelector('b');if(label)label.textContent=year?`Podsumowanie roczne — ${year}`:'Podsumowanie roczne'}
    syncDetailSelector(year);wireYearRows();
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
    const sel=document.getElementById('storeDetailYear'),current=sel.value,ys=availableYears();
    sel.innerHTML='<option value="">Wszystkie lata</option>'+ys.map(y=>`<option value="${y}">${y}</option>`).join('');
    if([...sel.options].some(o=>o.value===current))sel.value=current;
    return sel;
  };
  const syncDetailSelector=year=>{const sel=ensureDetailSelector();if(sel&&[...sel.options].some(o=>o.value===String(year)))sel.value=String(year);else if(sel&&!year)sel.value=''};
  const findStoreRow=name=>[...document.querySelectorAll('#storesTable table tr')].find((tr,i)=>i>0&&(tr.querySelectorAll('td')[1]?.textContent||'').trim()===name);
  const switchDetailYear=year=>{
    const name=lastStore||baseStoreName();if(!name)return;lastStore=name;
    const src=fullRowsCache.length?fullRowsCache:(Array.isArray(rows)?rows.slice():[]);rememberFullRows(src);
    const mainYear=document.getElementById('storeYear');
    if(mainYear){mainYear.value=year;mainYear.dispatchEvent(new Event('change',{bubbles:true}))}
    const tr=findStoreRow(name),open=tr?.onclick;
    if(typeof open==='function'){
      const original=rows;
      rows=year?rowsForYear(src,year):src;
      try{open.call(tr)}finally{rows=original}
      markDetailYear(year);ensureDetailSelector();wireYearRows();
      return;
    }
    markDetailYear(year);ensureDetailSelector();wireYearRows();
  };
  const wireYearRows=()=>{
    const box=document.getElementById('storeYearTable');if(!box)return;
    box.querySelectorAll('table tr').forEach((tr,i)=>{
      if(i===0||tr.dataset.yearWired)return;
      const first=tr.querySelector('td'),year=(first?.textContent||'').trim();if(!/^\d{4}$/.test(year))return;
      tr.dataset.yearWired='1';tr.dataset.year=year;tr.style.cursor='pointer';tr.title=`Pokaż tylko rok ${year}`;
      if(first)first.innerHTML=`<button type="button" style="padding:0;border:0;background:transparent;color:var(--a);font-weight:800;cursor:pointer">${year}</button>`;
      tr.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();switchDetailYear(year)});
    });
  };
  const onCapture=e=>{
    const table=storesTable();if(!table||!table.contains(e.target))return;
    const tr=e.target.closest('tr');if(!tr||!table.contains(tr)||tr.rowIndex===0)return;
    const name=(tr.querySelectorAll('td')[1]?.textContent||'').trim();if(name)lastStore=name;
    if(Array.isArray(rows))rememberFullRows(rows);
    const year=selectedYear();
    if(!year){setTimeout(()=>{clearYearMark();ensureDetailSelector();wireYearRows()},0);return}
    if(!Array.isArray(rows))return;
    const original=rows,filtered=rowsForYear(original,year);rememberFullRows(original);rows=filtered;
    setTimeout(()=>{rows=original;markDetailYear(year);ensureDetailSelector();wireYearRows()},0);
  };
  const install=()=>{
    if(Array.isArray(rows))rememberFullRows(rows);
    const table=storesTable();if(table)table.addEventListener('click',onCapture,true);
    const year=document.getElementById('storeYear');if(year)year.addEventListener('change',()=>{if(Array.isArray(rows))rememberFullRows(rows);if(!year.value)clearYearMark()});
    const detail=document.getElementById('storeDetail');if(detail)new MutationObserver(()=>{if(detail.classList.contains('on')){if(Array.isArray(rows))rememberFullRows(rows);ensureDetailSelector();wireYearRows()}}).observe(detail,{attributes:true,attributeFilter:['class'],subtree:false});
    const yearTable=document.getElementById('storeYearTable');if(yearTable)new MutationObserver(wireYearRows).observe(yearTable,{childList:true,subtree:true});
    ensureDetailSelector();wireYearRows();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
