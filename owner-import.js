(()=>{
  if(typeof importFile!=='function'||typeof parseCSV!=='function'||typeof mergeRows!=='function')return;
  const OWNER_KEY='__ppm_owner';
  const SOURCE_KEY='__ppm_owner_source';
  const MIGRATION_KEY='ppm_owner_migration_v8_existing_all_ja';
  const CLOUD_MIGRATION_KEY='ppm_owner_cloud_v8_existing_all_ja';
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

  let ownerIndexDirty=true,ownerIndexSize=-1,ownerIndexDateCol='',ownerIndex={all:{ja:0,mama:0},months:new Map()};
  const invalidateOwnerIndex=()=>{ownerIndexDirty=true};
  const sharedOwnerIndex=()=>{
    try{
      const shared=window.PanParagonMainIndex?.get?.()?.owners;
      return shared?.all&&shared?.months instanceof Map?shared:null;
    }catch{return null}
  };
  const rebuildOwnerIndex=()=>{
    const all={ja:0,mama:0},months=new Map();
    for(const r of Array.isArray(rows)?rows:[]){
      const owner=getOwner(r);all[owner]++;
      let d=null;try{d=typeof rowDate==='function'?rowDate(r):null}catch{}
      if(!d||typeof mk!=='function')continue;
      const key=mk(d);if(!key)continue;
      let c=months.get(key);if(!c){c={ja:0,mama:0};months.set(key,c)}c[owner]++;
    }
    ownerIndex={all,months};ownerIndexDirty=false;ownerIndexSize=Array.isArray(rows)?rows.length:0;ownerIndexDateCol=String(typeof dateCol!=='undefined'?dateCol:'');
    return ownerIndex;
  };
  const getOwnerIndex=()=>{
    const shared=sharedOwnerIndex();if(shared)return shared;
    const size=Array.isArray(rows)?rows.length:0,dc=String(typeof dateCol!=='undefined'?dateCol:'');
    return ownerIndexDirty||size!==ownerIndexSize||dc!==ownerIndexDateCol?rebuildOwnerIndex():ownerIndex;
  };
  const countsForMonth=(month,index=getOwnerIndex())=>month?(index.months.get(month)||{ja:0,mama:0}):index.all;
  const countsText=c=>`Ja: ${c.ja} · Mama: ${c.mama}`;

  const mergeRowsWithOwner=incoming=>{
    const existing=new Map();
    for(const r of Array.isArray(rows)?rows:[]){try{existing.set(rowKey(r),r)}catch{}}
    let added=0,dup=0,ownerUpdated=0;const ownerChangedRows=[];
    for(const r of incoming||[]){
      let key='';try{key=rowKey(r)}catch{continue}
      const old=existing.get(key);
      if(old){
        dup++;
        const nextOwner=getOwner(r),nextSource=String(r?.[SOURCE_KEY]||'');
        if(old[OWNER_KEY]!==nextOwner||String(old[SOURCE_KEY]||'')!==nextSource){old[OWNER_KEY]=nextOwner;old[SOURCE_KEY]=nextSource;ownerUpdated++;ownerChangedRows.push(old)}
        continue;
      }
      existing.set(key,r);rows.push(r);added++;
    }
    if(added||ownerUpdated)invalidateOwnerIndex();
    if(ownerUpdated){window.PanParagonHashCache?.invalidate?.();window.PanParagonDateCache?.invalidate?.();window.PanParagonMainIndex?.invalidate?.();document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'owner-duplicate-reassign',changed:ownerUpdated}}))}
    return{added,dup,ownerUpdated,ownerChangedRows};
  };

  const syncOwnerSelects=value=>{const v=normalizeOwner(value);localStorage.setItem('ppm_import_owner',v);for(const id of ['importOwner','importOwnerQuick']){const el=document.getElementById(id);if(el&&el.value!==v)el.value=v}};
  const makeSelect=id=>{const s=document.createElement('select');s.id=id;s.title='Właściciel paragonów od 1 września 2026';s.innerHTML='<option value="ja">Moje CSV</option><option value="mama">CSV Mamy</option>';s.value=selectedOwner();s.addEventListener('change',()=>syncOwnerSelects(s.value));return s};
  const ensureUI=()=>{
    const dashFile=document.getElementById('file')?.closest('label.file'),dashActions=dashFile?.parentElement;
    if(dashActions&&!document.getElementById('importOwnerQuick')){const wrap=document.createElement('div');wrap.className='actions';wrap.style.alignItems='center';const label=document.createElement('span');label.className='small';label.textContent='CSV:';wrap.append(label,makeSelect('importOwnerQuick'));dashActions.insertBefore(wrap,dashFile)}
    const importFileEl=document.getElementById('file2')?.closest('label.file'),importActions=importFileEl?.parentElement;
    if(importActions&&!document.getElementById('importOwner')){const label=document.createElement('span');label.className='small';label.textContent='Właściciel od 1 września:';importActions.insertBefore(label,importFileEl);importActions.insertBefore(makeSelect('importOwner'),importFileEl);const note=document.createElement('div');note.id='ownerImportNote';note.className='notice';note.textContent='Obecne dane są przypisane do Ciebie. Przy kolejnych importach wybierz Moje CSV albo CSV Mamy; rekordy sprzed 1 września są automatycznie przypisywane Mamie. Ponowny import tego samego CSV zmienia właściciela bez tworzenia duplikatów.';document.getElementById('fn')?.insertAdjacentElement('afterend',note)}
    syncOwnerSelects(selectedOwner());
  };

  const updateMonthSummary=index=>{const month=document.getElementById('month');if(!month)return;let el=document.getElementById('ownerMonthSummary');if(!el){el=document.createElement('span');el.id='ownerMonthSummary';el.className='pill';month.insertAdjacentElement('afterend',el)}const key=month.value||'',c=countsForMonth(key,index);el.textContent=(key&&typeof ml==='function'?`${ml(key)} · `:'Wszystkie · ')+countsText(c)};
  const annotateMonthsTable=index=>{const table=document.querySelector('#monthsTable table');if(!table)return;const head=table.querySelector('tr');if(head&&!head.querySelector('[data-owner-head]')){const th=document.createElement('th');th.dataset.ownerHead='1';th.textContent='Właściciel';head.appendChild(th)}let year='';for(const tr of [...table.querySelectorAll('tr')].slice(1)){const cells=tr.querySelectorAll('td');if(!cells.length)continue;if(cells.length===1&&cells[0].hasAttribute('colspan')){year=(cells[0].textContent||'').trim();cells[0].colSpan=3;continue}const name=(cells[0]?.textContent||'').trim();let td=tr.querySelector('[data-owner-cell]');if(!td){td=document.createElement('td');td.dataset.ownerCell='1';td.className='small';tr.appendChild(td)}if(name==='Nie rozpoznano daty'){td.textContent='—';continue}let key='';if(year&&typeof monthName==='function'){for(let m=1;m<=12;m++){const candidate=`${year}-${String(m).padStart(2,'0')}`;if(monthName(candidate)===name){key=candidate;break}}}td.textContent=key?countsText(countsForMonth(key,index)):'—'}};
  const annotateHistory=index=>{const hist=document.getElementById('hist');if(!hist)return;let year='';for(const node of [...hist.children]){if(node.classList?.contains('year-head')){year=(node.textContent||'').trim();continue}const old=node.querySelector?.('[data-owner-breakdown]');if(old)old.remove();const name=(node.querySelector?.('span')?.textContent||'').trim();if(!name||!year)continue;let key='';for(let m=1;m<=12;m++){const candidate=`${year}-${String(m).padStart(2,'0')}`;if(typeof monthName==='function'&&monthName(candidate)===name){key=candidate;break}}if(!key)continue;const info=document.createElement('div');info.dataset.ownerBreakdown='1';info.className='small';info.style.marginTop='4px';info.textContent=countsText(countsForMonth(key,index));node.appendChild(info)}};

  let scheduled=false,cloudOwnerSyncing=false;
  const refreshViews=()=>{try{const index=getOwnerIndex();updateMonthSummary(index);if(document.getElementById('months')?.classList.contains('on'))annotateMonthsTable(index);if(document.getElementById('dash')?.classList.contains('on'))annotateHistory(index)}catch(e){console.warn('Owner view fallback',e)}};
  const scheduleViews=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;refreshViews()})};

  const isMigratedExisting=r=>/^existing-all-ja-v(?:7|8)$/.test(String(r?.[SOURCE_KEY]||''));
  const migrateExisting=async()=>{
    if(!Array.isArray(rows)||!rows.length)return{changed:0,ja:0,mama:0,persisted:true};
    if(localStorage.getItem(MIGRATION_KEY)==='done'){
      const shared=sharedOwnerIndex(),counts=shared?.all||{ja:0,mama:0};
      return{changed:0,ja:Number(counts.ja||0),mama:Number(counts.mama||0),persisted:true};
    }
    const force=true;
    let changed=0;
    for(const r of rows){
      if(!r||typeof r!=='object')continue;
      if(r[OWNER_KEY]!=='ja'){r[OWNER_KEY]='ja';changed++}
      if(r[SOURCE_KEY]!=='existing-all-ja-v8'){r[SOURCE_KEY]='existing-all-ja-v8';changed++}
    }
    if(changed){
      invalidateOwnerIndex();window.PanParagonHashCache?.invalidate?.();window.PanParagonDateCache?.invalidate?.();window.PanParagonMainIndex?.invalidate?.();document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'owner-migration-v8',changed}}));
      try{
        if(!db||typeof persistRows!=='function')throw new Error('Brak trwałego magazynu');
        await persistRows();
        localStorage.setItem(MIGRATION_KEY,'done');
        localStorage.removeItem(CLOUD_MIGRATION_KEY);
      }catch(e){
        localStorage.removeItem(MIGRATION_KEY);
        console.warn('Owner migration persist fallback',e);
        refreshViews();
        return{changed,ja:getOwnerIndex().all.ja,mama:getOwnerIndex().all.mama,persisted:false};
      }
    }else if(force){
      localStorage.setItem(MIGRATION_KEY,'done');
      localStorage.removeItem(CLOUD_MIGRATION_KEY);
    }
    refreshViews();
    const counts=getOwnerIndex().all;
    return{changed,ja:counts.ja,mama:counts.mama,persisted:true};
  };

  const cloudUpsertOwnerRows=async list=>{
    if(!navigator.onLine||!Array.isArray(list)||!list.length||!user)return false;
    const session=typeof getSession==='function'?getSession():null;
    if(!session?.access_token||typeof authHeaders!=='function'||typeof rowHash!=='function')return false;
    const now=new Date().toISOString(),batchSize=300;
    for(let i=0;i<list.length;i+=batchSize){const items=list.slice(i,i+batchSize).map(r=>({user_id:user.id,row_hash:rowHash(r),data:r,updated_at:now}));const response=await fetch(SUPABASE_URL+'/rest/v1/panparagon_receipts?on_conflict=user_id,row_hash',{method:'POST',headers:{...authHeaders(session.access_token),Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(items)});if(!response.ok)throw new Error('Synchronizacja właściciela '+response.status)}
    return true;
  };
  const syncExistingOwnersToCloud=async()=>{if(cloudOwnerSyncing||localStorage.getItem(CLOUD_MIGRATION_KEY)==='done'||!navigator.onLine||!Array.isArray(rows)||!rows.length||!user)return false;cloudOwnerSyncing=true;try{await cloudUpsertOwnerRows(rows);localStorage.setItem(CLOUD_MIGRATION_KEY,'done');if(typeof fetchCloudHashes==='function')try{await fetchCloudHashes()}catch{}return true}catch(e){console.warn('Owner cloud sync fallback',e);return false}finally{cloudOwnerSyncing=false}};
  const syncChangedOwnersToCloud=async list=>{if(!Array.isArray(list)||!list.length||!user)return false;try{await cloudUpsertOwnerRows(list);return true}catch(e){console.warn('Owner duplicate cloud sync fallback',e);return false}};

  const migrateWhenStorageReady=()=>{if(localStorage.getItem(MIGRATION_KEY)==='done')return;let tries=0;const tick=async()=>{tries++;if((!Array.isArray(rows)||!rows.length)&&tries<100){setTimeout(tick,50);return}if(!Array.isArray(rows)||!rows.length)return;if(headers?.length&&typeof guess==='function')guess();const r=await migrateExisting();if(r.changed&&typeof render==='function')render(false);refreshViews();if(r.persisted&&user)syncExistingOwnersToCloud().catch(()=>{})};setTimeout(tick,0)};

  importFile=function(file){if(!file)return;const chosen=selectedOwner(),reader=new FileReader();reader.onload=async()=>{try{const p=parseCSV(reader.result),union=[...headers];p.h.forEach(h=>{if(!union.includes(h))union.push(h)});headers=union.length?union:p.h;if(typeof guess==='function')guess();const counts=classifyRows(p.rs,chosen),x=mergeRowsWithOwner(p.rs);if(typeof render==='function')render(false);refreshViews();try{await persistRows();const fn=document.getElementById('fn');if(fn)fn.textContent=`${file.name} — dodano ${x.added}, duplikaty: ${x.dup}${x.ownerUpdated?`, zmieniono właściciela: ${x.ownerUpdated}`:''}. W pliku: ${counts.ja} moje, ${counts.mama} Mamy. ZAPISANO trwale. Łącznie: ${rows.length}`;if(typeof updateUnsyncedPanel==='function')updateUnsyncedPanel();if(navigator.onLine&&typeof refreshUser==='function')try{await refreshUser()}catch{}if(x.ownerChangedRows.length&&user)await syncChangedOwnersToCloud(x.ownerChangedRows);if(typeof autoSync==='function')await autoSync('po imporcie CSV');refreshViews()}catch(e){const fn=document.getElementById('fn');if(fn)fn.textContent=`Błąd trwałego zapisu: ${e.message}`}}catch(e){const fn=document.getElementById('fn');if(fn)fn.textContent='Błąd importu CSV: '+(e?.message||String(e))}};reader.readAsText(file,'utf-8')};

  window.PanParagonOwners={key:OWNER_KEY,sourceKey:SOURCE_KEY,cutoff:'2026-09-01',get:getOwner,label:r=>ownerLabel(getOwner(r)),selectedOwner,classifyRows,countsForMonth,migrateExisting,syncExistingOwnersToCloud,syncChangedOwnersToCloud,ensureUI,refreshViews,invalidate:invalidateOwnerIndex};
  const install=()=>{ensureUI();document.getElementById('month')?.addEventListener('change',refreshViews);document.addEventListener('panparagon:data-changed',e=>{if(e.detail?.source==='main-render-fast')return;invalidateOwnerIndex();scheduleViews()});const baseRender=typeof render==='function'?render:null;if(baseRender){render=function(...args){const out=baseRender.apply(this,args);refreshViews();return out}}const baseAuto=typeof autoSync==='function'?autoSync:null;if(baseAuto){autoSync=async function(...args){const out=await baseAuto.apply(this,args);if(user)await syncExistingOwnersToCloud();refreshViews();return out}}refreshViews();migrateWhenStorageReady()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();