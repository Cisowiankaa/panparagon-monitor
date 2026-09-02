(()=>{
  if(typeof restoreFile!=='function'||typeof rowKey!=='function')return;
  const OWNER_KEY='__ppm_owner',SOURCE_KEY='__ppm_owner_source';
  const validOwner=v=>v==='ja'||v==='mama';
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
      if(!validOwner(r[OWNER_KEY])){r[OWNER_KEY]='ja';r[SOURCE_KEY]='backup-legacy-ja-v1'}
      existing.set(key,r);rows.push(r);added++;
    }
    markChanged(added+ownerUpdated);
    return{added,dup,ownerUpdated,ownerChangedRows};
  };
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
        if(typeof render==='function')render(false);
        await persistRows();
        if(fn)fn.textContent=`Przywrócono — dodano ${x.added}, duplikaty ${x.dup}${x.ownerUpdated?`, przywrócono właściciela: ${x.ownerUpdated}`:''}.`;
        if(typeof updateUnsyncedPanel==='function')updateUnsyncedPanel();
        if(navigator.onLine&&typeof refreshUser==='function')try{await refreshUser()}catch{}
        if(x.ownerChangedRows.length&&user)await window.PanParagonOwners?.syncChangedOwnersToCloud?.(x.ownerChangedRows);
        if(typeof autoSync==='function')await autoSync('po przywróceniu kopii');
        window.PanParagonOwners?.refreshViews?.();
      }catch(e){if(fn)fn.textContent='Błąd kopii: '+(e?.message||String(e))}
    };
    reader.readAsText(file,'utf-8');
  };
  window.PanParagonBackupRestore={mergeBackupRows};
})();
