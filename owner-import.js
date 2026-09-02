(()=>{
  if(typeof importFile!=='function'||typeof parseCSV!=='function'||typeof mergeRows!=='function')return;
  const OWNER_KEY='__ppm_owner';
  const CUTOFF=new Date(2026,8,1);
  const baseImportFile=importFile;
  const validOwner=v=>v==='mama'||v==='ja';
  const normalizeOwner=v=>v==='mama'?'mama':'ja';
  const selectedOwner=()=>normalizeOwner(document.getElementById('importOwner')?.value||document.getElementById('importOwnerQuick')?.value||localStorage.getItem('ppm_import_owner')||'ja');
  const ownerLabel=v=>v==='mama'?'Mama':'Ja';
  const classifyRow=(r,chosen)=>{
    if(!r||typeof r!=='object')return 'ja';
    let d=null;try{d=typeof rowDate==='function'?rowDate(r):null}catch{}
    const owner=d&&d<CUTOFF?'mama':normalizeOwner(chosen);
    r[OWNER_KEY]=owner;
    return owner;
  };
  const classifyRows=(list,chosen)=>{
    const counts={ja:0,mama:0};
    for(const r of list||[])counts[classifyRow(r,chosen)]++;
    return counts;
  };
  const syncOwnerSelects=value=>{
    const v=normalizeOwner(value);localStorage.setItem('ppm_import_owner',v);
    for(const id of ['importOwner','importOwnerQuick']){const el=document.getElementById(id);if(el&&el.value!==v)el.value=v}
  };
  const makeSelect=id=>{
    const sel=document.createElement('select');sel.id=id;sel.title='Właściciel paragonów od 1 września 2026';
    sel.innerHTML='<option value="ja">Moje CSV</option><option value="mama">CSV Mamy</option>';
    sel.value=selectedOwner();sel.addEventListener('change',()=>syncOwnerSelects(sel.value));return sel;
  };
  const ensureUI=()=>{
    const dashFile=document.getElementById('file')?.closest('label.file');
    const dashActions=dashFile?.parentElement;
    if(dashActions&&!document.getElementById('importOwnerQuick')){
      const wrap=document.createElement('div');wrap.className='actions';wrap.style.alignItems='center';
      const label=document.createElement('span');label.className='small';label.textContent='CSV:';
      wrap.append(label,makeSelect('importOwnerQuick'));dashActions.insertBefore(wrap,dashFile);
    }
    const importFileEl=document.getElementById('file2')?.closest('label.file');
    const importActions=importFileEl?.parentElement;
    if(importActions&&!document.getElementById('importOwner')){
      const label=document.createElement('span');label.className='small';label.textContent='Właściciel od 1 września:';
      importActions.insertBefore(label,importFileEl);
      importActions.insertBefore(makeSelect('importOwner'),importFileEl);
      const note=document.createElement('div');note.id='ownerImportNote';note.className='notice';
      note.textContent='Reguła: paragony sprzed 1 września 2026 są zawsze przypisywane Mamie. Dla paragonów od 1 września wybierz Moje CSV albo CSV Mamy.';
      document.getElementById('fn')?.insertAdjacentElement('afterend',note);
    }
    syncOwnerSelects(selectedOwner());
  };
  const migrateExisting=async()=>{
    if(!Array.isArray(rows)||!rows.length)return{changed:0,ja:0,mama:0};
    let changed=0;const counts={ja:0,mama:0};
    for(const r of rows){
      let owner=r?.[OWNER_KEY];
      if(!validOwner(owner)){
        let d=null;try{d=typeof rowDate==='function'?rowDate(r):null}catch{}
        owner=d&&d<CUTOFF?'mama':'ja';r[OWNER_KEY]=owner;changed++;
      }
      counts[owner]++;
    }
    if(changed){
      window.PanParagonHashCache?.invalidate?.();
      document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'owner-migration',changed}}));
      try{if(db&&typeof persistRows==='function')await persistRows()}catch{}
    }
    return{changed,...counts};
  };
  importFile=function(file){
    if(!file)return;
    const chosen=selectedOwner(),reader=new FileReader();
    reader.onload=async()=>{
      try{
        const p=parseCSV(reader.result),union=[...headers];
        p.h.forEach(h=>{if(!union.includes(h))union.push(h)});headers=union.length?union:p.h;
        const counts=classifyRows(p.rs,chosen),x=mergeRows(p.rs);
        if(typeof guess==='function')guess();if(typeof render==='function')render(false);
        try{
          await persistRows();
          const fn=document.getElementById('fn');
          if(fn)fn.textContent=`${file.name} — dodano ${x.added}, duplikaty: ${x.dup}. W pliku: ${counts.ja} moje, ${counts.mama} Mamy. ZAPISANO trwale. Łącznie: ${rows.length}`;
          if(typeof updateUnsyncedPanel==='function')updateUnsyncedPanel();
          if(typeof autoSync==='function')await autoSync('po imporcie CSV');
        }catch(e){const fn=document.getElementById('fn');if(fn)fn.textContent=`Błąd trwałego zapisu: ${e.message}`}
      }catch(e){
        const fn=document.getElementById('fn');if(fn)fn.textContent='Błąd importu CSV: '+(e?.message||String(e));
      }
    };
    reader.readAsText(file,'utf-8');
  };
  window.PanParagonOwners={
    key:OWNER_KEY,
    cutoff:'2026-09-01',
    get:r=>validOwner(r?.[OWNER_KEY])?r[OWNER_KEY]:'ja',
    label:r=>ownerLabel(validOwner(r?.[OWNER_KEY])?r[OWNER_KEY]:'ja'),
    selectedOwner,
    classifyRows,
    migrateExisting,
    ensureUI
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI);else ensureUI();
})();
