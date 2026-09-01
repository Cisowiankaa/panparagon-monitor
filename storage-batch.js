(()=>{
  if(typeof persistRows!=='function')return;
  const originalPersist=persistRows;
  const setText=(id,text)=>{try{const el=document.getElementById(id);if(el)el.textContent=text}catch{}};

  persistRows=async function(){
    if(!db)throw new Error('Brak IndexedDB');
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('app','readwrite');
        const store=tx.objectStore('app');
        store.put(rows,'rows');
        store.put(headers,'headers');
        store.put(dateCol,'dateCol');
        store.put(storeCol,'storeCol');
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error||new Error('Błąd zapisu IndexedDB'));
        tx.onabort=()=>reject(tx.error||new Error('Przerwano zapis IndexedDB'));
      });
      setText('storageInfo','Magazyn: IndexedDB ✓');
      setText('saveStatus',`Trwały zapis aktywny — ${Array.isArray(rows)?rows.length:0} rekordów.`);
      if(typeof updateSyncCounters==='function')updateSyncCounters();
    }catch(e){
      if(db&&typeof db.transaction==='function')throw e;
      return originalPersist();
    }
  };

  window.PanParagonStorageBatch={enabled:true};
})();
