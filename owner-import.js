(()=>{
  if(typeof importFile!=='function'||typeof parseCSV!=='function'||typeof mergeRows!=='function')return;
  const OWNER_KEY='__ppm_owner';
  const SOURCE_KEY='__ppm_owner_source';
  const MIGRATION_KEY='ppm_owner_migration_v7_existing_all_ja';
  const CUTOFF=new Date(2026,8,1);
  const validOwner=v=>v==='mama'||v==='ja';
  const normalizeOwner=v=>v==='mama'?'mama':'ja';
  const selectedOwner=()=>normalizeOwner(document.getElementById('importOwner')?.value||document.getElementById('importOwnerQuick')?.value||localStorage.getItem('ppm_import_owner')||'ja');
  const ownerLabel=v=>v==='mama'?'Mama':'Ja';
  const getOwner=r=>validOwner(r?.[OWNER_KEY])?r[OWNER_KEY]:'ja';
  const classifyRow=(r,chosen)=>{
    if(!r||typeof r!=='object')return 'ja';
    let d=null;try{d=typeof rowDate==='function'?rowDate(r):null}catch{}
    const owner=d&&d<CUTOFF?'mama':normalizeOwner(chosen);
    r[OWNER_KEY]=owner;
    r[SOURCE_KEY]=d&&d<CUTOFF?'cutoff-auto':`import-${owner}`;
    return owner;
  };
  const classifyRows=(list,chosen)=>{const c={ja:0,mama:0};for(const r of list||[])c[classifyRow(r,chosen)]++;return c};
  const syncOwnerSelects=value=>{const v=normalizeOwner(value);localStorage.setItem('ppm_import_owner',v);for(const id of ['importOwner','importOwnerQuick']){const el=document.getElementById(id);if(el&&el.value!==v)el.value=v}};
  const makeSelect=id=>{const s=document.createElement('select');s.id=id;s.title='Właściciel paragonów od 1 września 2026';s.innerHTML='<option value="ja">Moje CSV</option><option value="mama">CSV Mamy</option>';s.value=selectedOwner();s.addEventListener('change',()=>syncOwnerSelects(s.value));return s};
  const ensureUI=()=>{
    const dashFile=document.getElementById('file')?.closest('label.file'),dashActions=dashFile?.parentElement;
    if(dashActions&&!document.getElementById('importOwnerQuick')){const wrap=document.createElement('div');wrap.className='actions';wrap.style.alignItems='center';const label=document.createElement('span');label.className='small';label.textContent='CSV:';wrap.append(label,makeSelect('importOwnerQuick'));dashActions.insertBefore(wrap,dashFile)}
    const importFileEl=document.getElementById('file2')?.closest('label.file'),importActions=importFileEl?.parentElement;
    if(importActions&&!document.getElementById('importOwner')){const label=document.createElement('span');label.className='small';label.textContent='Właściciel od 1 września:';importActions.insertBefore(label,importFileEl);importActions.insertBefore(makeSelect('importOwner'),importFileEl);const note=document.createElement('div');note.id='ownerImportNote';note.className='notice';note.textContent='Obecne dane są przypisane do Ciebie. Przy kolejnych importach wybierz Moje CSV albo CSV Mamy; rekordy sprzed 1 września są automatycznie przypisywane Mamie.';document.getElementById('fn')?.insertAdjacentElement('afterend',note)}
    syncOwnerSelects(selectedOwner());
  };
  const countsForMonth=month=>{const out={ja:0,mama:0};for(const r of Array.isArray(rows)?rows:[]){let d=null;try{d=typeof rowDate==='function'?rowDate(r):null}catch{}if(month&&(!d||typeof mk!=='function'||mk(d)!==month))continue;out[getOwner(r)]++}return out};
  const countsText=c=>`Ja: ${c.ja} · Mama: ${c.mama}`;
  const updateMonthSummary=()=>{const month=document.getElementById('month');if(!month)return;let el=document.getElementById('ownerMonthSummary');if(!el){el=document.createElement('span');el.id='ownerMonthSummary';el.className='pill';month.insertAdjacentElement('afterend',el)}const key=month.value||'';const c=countsForMonth(key);el.textContent=(key&&typeof ml==='function'?`${ml(key)} · `:'Wszystkie · ')+countsText(c)};
  const annotateMonthsTable=()=>{const table=document.querySelector('#monthsTable table');if(!table)return;const head=table.querySelector('tr');if(head&&!head.querySelector('[data-owner-head]')){const th=document.createElement('th');th.dataset.ownerHead='1';th.textContent='Właściciel';head.appendChild(th)}let year='';for(const tr of [...table.querySelectorAll('tr')].slice(1)){const cells=tr.querySelectorAll('td');if(!cells.length)continue;if(cells.length===1&&cells[0].hasAttribute('colspan')){year=(cells[0].textContent||'').trim();cells[0].colSpan=3;continue}const name=(cells[0]?.textContent||'').trim();let td=tr.querySelector('[data-owner-cell]');if(!td){td=document.createElement('td');td.dataset.ownerCell='1';td.className='small';tr.appendChild(td)}if(name==='Nie rozpoznano daty'){td.textContent='—';continue}let key='';if(year&&typeof monthName==='function'){for(let m=1;m<=12;m++){const candidate=`${year}-${String(m).padStart(2,'0')}`;if(monthName(candidate)===name){key=candidate;break}}}td.textContent=key?countsText(countsForMonth(key)):'—'}};
  const annotateHistory=()=>{const hist=document.getElementById('hist');if(!hist)return;let year='';for(const node of [...hist.children]){if(node.classList?.contains('year-head')){year=(node.textContent||'').trim();continue}const old=node.querySelector?.('[data-owner-breakdown]');if(old)old.remove();const name=(node.querySelector?.('span')?.textContent||'').trim();if(!name||!year)continue;let key='';for(let m=1;m<=12;m++){const candidate=`${year}-${String(m).padStart(2,'0')}`;if(typeof monthName==='function'&&monthName(candidate)===name){key=candidate;break}}if(!key)continue;const info=document.createElement('div');info.dataset.ownerBreakdown='1';info.className='small';info.style.marginTop='4px';info.textContent=countsText(countsForMonth(key));node.appendChild(info)}};
  let scheduled=false;
  const refreshViews=()=>{try{updateMonthSummary();annotateMonthsTable();annotateHistory()}catch(e){console.warn('Owner view fallback',e)}};
  const scheduleViews=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;refreshViews()})};
  const migrateExisting=async()=>{
    if(!Array.isArray(rows)||!rows.length)return{changed:0,ja:0,mama:0};
    const force=localStorage.getItem(MIGRATION_KEY)!=='done';let changed=0;
    if(force){for(const r of rows){if(!r||typeof r!=='object')continue;if(r[OWNER_KEY]!=='ja'){r[OWNER_KEY]='ja';changed++}if(r[SOURCE_KEY]!=='existing-all-ja-v7'){r[SOURCE_KEY]='existing-all-ja-v7';changed++}}localStorage.setItem(MIGRATION_KEY,'done')}
    if(changed){window.PanParagonHashCache?.invalidate?.();document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'owner-migration-v7',changed}}));try{if(db&&typeof persistRows==='function')await persistRows()}catch{}}
    scheduleViews();return{changed,ja:rows.length,mama:0};
  };
  const migrateWhenStorageReady=()=>{let tries=0;const tick=async()=>{tries++;if((!Array.isArray(rows)||!rows.length)&&tries<100){setTimeout(tick,50);return}if(!Array.isArray(rows)||!rows.length)return;if(headers?.length&&typeof guess==='function')guess();const r=await migrateExisting();if(r.changed&&typeof render==='function')render(false);scheduleViews()};setTimeout(tick,0)};
  importFile=function(file){if(!file)return;const chosen=selectedOwner(),reader=new FileReader();reader.onload=async()=>{try{const p=parseCSV(reader.result),union=[...headers];p.h.forEach(h=>{if(!union.includes(h))union.push(h)});headers=union.length?union:p.h;if(typeof guess==='function')guess();const counts=classifyRows(p.rs,chosen),x=mergeRows(p.rs);if(typeof render==='function')render(false);scheduleViews();try{await persistRows();const fn=document.getElementById('fn');if(fn)fn.textContent=`${file.name} — dodano ${x.added}, duplikaty: ${x.dup}. W pliku: ${counts.ja} moje, ${counts.mama} Mamy. ZAPISANO trwale. Łącznie: ${rows.length}`;if(typeof updateUnsyncedPanel==='function')updateUnsyncedPanel();if(typeof autoSync==='function')await autoSync('po imporcie CSV');scheduleViews()}catch(e){const fn=document.getElementById('fn');if(fn)fn.textContent=`Błąd trwałego zapisu: ${e.message}`}}catch(e){const fn=document.getElementById('fn');if(fn)fn.textContent='Błąd importu CSV: '+(e?.message||String(e))}};reader.readAsText(file,'utf-8')};
  window.PanParagonOwners={key:OWNER_KEY,sourceKey:SOURCE_KEY,cutoff:'2026-09-01',get:getOwner,label:r=>ownerLabel(getOwner(r)),selectedOwner,classifyRows,countsForMonth,migrateExisting,ensureUI,refreshViews};
  const install=()=>{ensureUI();document.getElementById('month')?.addEventListener('change',scheduleViews);document.addEventListener('panparagon:data-changed',scheduleViews);const baseRender=typeof render==='function'?render:null;if(baseRender){render=function(...args){const out=baseRender.apply(this,args);scheduleViews();return out}}scheduleViews();migrateWhenStorageReady()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
