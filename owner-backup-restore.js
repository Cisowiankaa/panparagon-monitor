(()=>{
  if(typeof restoreFile!=='function'||typeof rowKey!=='function')return;
  const OWNER_KEY='__ppm_owner',SOURCE_KEY='__ppm_owner_source';
  const MIGRATION_KEY='ppm_owner_migration_v8_existing_all_ja';
  const CLOUD_MIGRATION_KEY='ppm_owner_cloud_v8_existing_all_ja';
  const RECONCILE_LOCAL_KEY='ppm_owner_reconcile_v12_local';
  const RECONCILE_CLOUD_KEY='ppm_owner_reconcile_v12_cloud';
  const BACKUP_VERSION=7;
  const validOwner=v=>v==='ja'||v==='mama';
  const importOwner=()=>{
    const v=window.PanParagonOwners?.selectedOwner?.()||localStorage.getItem('ppm_import_owner')||'ja';
    return v==='mama'?'mama':'ja';
  };
  const markChanged=changed=>{
    if(!changed)return;
    window.PanParagonOwners?.invalidate?.();
    window.PanParagonHashCache?.invalidate?.();
    window.PanParagonDateCache?.invalidate?.();
    window.PanParagonMainIndex?.invalidate?.();
    document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'owner-backup-restore',changed}}));
  };
  const mergeBackupRows=incoming=>{
    const existing=new Map();
    for(const r of Array.isArray(rows)?rows:[]){try{existing.set(rowKey(r),r)}catch{}}
    let added=0,dup=0,ownerUpdated=0;const ownerChangedRows=[];
    for(const raw of incoming||[]){
      if(!raw||typeof raw!=='object')continue;
      const r=raw;
      let key='';try{key=rowKey(r)}catch{continue}
      const old=existing.get(key);
      if(old){
        dup++;
        if(validOwner(r[OWNER_KEY])){
          const nextOwner=r[OWNER_KEY],nextSource=String(r[SOURCE_KEY]||`backup-${nextOwner}`);
          if(old[OWNER_KEY]!==nextOwner||String(old[SOURCE_KEY]||'')!==nextSource){
            old[OWNER_KEY]=nextOwner;old[SOURCE_KEY]=nextSource;ownerUpdated++;ownerChangedRows.push(old);
          }
        }
        continue;
      }
      if(!validOwner(r[OWNER_KEY])){r[OWNER_KEY]='ja';r[SOURCE_KEY]='backup-legacy-ja-v2'}
      existing.set(key,r);rows.push(r);added++;
    }
    markChanged(added+ownerUpdated);
    return{added,dup,ownerUpdated,ownerChangedRows};
  };
  const markRestoredState=()=>{
    localStorage.setItem(MIGRATION_KEY,'done');
    localStorage.setItem(RECONCILE_LOCAL_KEY,'done');
    localStorage.setItem(RECONCILE_CLOUD_KEY,'done');
    localStorage.removeItem(CLOUD_MIGRATION_KEY);
  };
  backup=function(){
    const data={
      version:BACKUP_VERSION,
      exportedAt:new Date().toISOString(),
      rows,headers,dateCol,storeCol,
      ownership:{schema:1,cutoff:window.PanParagonOwners?.cutoff||'2026-09-01',importOwner:importOwner()}
    };
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));
    a.download=`panparagon-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  const backupButton=document.getElementById('backup');if(backupButton)backupButton.onclick=backup;
  restoreFile=function(file){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=async()=>{
      const fn=document.getElementById('fn');
      try{
        const d=JSON.parse(reader.result);
        if(!Array.isArray(d.rows))throw new Error('Nieprawidłowa kopia');
        const x=mergeBackupRows(d.rows);
        for(const h of d.headers||[])if(!headers.includes(h))headers.push(h);
        if(typeof guess==='function')guess();
        if(d.dateCol&&headers.includes(d.dateCol))dateCol=d.dateCol;
        if(d.storeCol&&headers.includes(d.storeCol))storeCol=d.storeCol;
        const dc=document.getElementById('dc'),sc=document.getElementById('stc');
        if(dc&&dateCol)dc.value=dateCol;if(sc&&storeCol)sc.value=storeCol;
        const restoredImportOwner=d?.ownership?.importOwner;
        if(restoredImportOwner==='ja'||restoredImportOwner==='mama')localStorage.setItem('ppm_import_owner',restoredImportOwner);
        if(typeof render==='function')render(false);
        await persistRows();
        markRestoredState();
        window.PanParagonOwners?.ensureUI?.();
        if(fn)fn.textContent=`Przywrócono kopię v${Number(d.version)||'legacy'} — dodano ${x.added}, duplikaty ${x.dup}${x.ownerUpdated?`, przywrócono właściciela: ${x.ownerUpdated}`:''}.`;
        if(typeof updateUnsyncedPanel==='function')updateUnsyncedPanel();
        if(navigator.onLine&&typeof refreshUser==='function')try{await refreshUser()}catch{}
        if(x.ownerChangedRows.length&&user)await window.PanParagonOwners?.syncChangedOwnersToCloud?.(x.ownerChangedRows);
        if(typeof autoSync==='function')await autoSync('po przywróceniu kopii');
        window.PanParagonOwners?.refreshViews?.();
      }catch(e){if(fn)fn.textContent='Błąd kopii: '+(e?.message||String(e))}
    };
    reader.readAsText(file,'utf-8');
  };
  window.PanParagonBackupRestore={version:BACKUP_VERSION,mergeBackupRows,markRestoredState};
})();
