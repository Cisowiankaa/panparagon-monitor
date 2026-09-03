(()=>{
  const startupText=(id,text)=>{try{const el=document.getElementById(id);if(el)el.textContent=text}catch{}};
  startupText('rc','…');
  startupText('sc','…');
  startupText('mc','…');
  startupText('localCount','…');
  startupText('topm','Ładowanie danych lokalnych…');
  for(const id of ['yearly','rank','hist','monthsTable','storesTable']){
    try{const el=document.getElementById(id);if(el)el.innerHTML='<div class="empty">Ładowanie danych lokalnych…</div>'}catch{}
  }

  if(typeof persistRows!=='function')return;
  const originalPersist=persistRows;
  const originalDbGet=typeof dbGet==='function'?dbGet:null;
  const setText=(id,text)=>{try{const el=document.getElementById(id);if(el)el.textContent=text}catch{}};
  let readPromise=null,readCache=null,firstReadPaint=null;

  const waitForFirstPaint=()=>{
    if(firstReadPaint)return firstReadPaint;
    firstReadPaint=new Promise(resolve=>{
      const afterFrame=()=>setTimeout(resolve,0);
      if(typeof requestAnimationFrame==='function')requestAnimationFrame(afterFrame);
      else setTimeout(resolve,0);
    });
    return firstReadPaint;
  };

  const requestPersistentStorage=async()=>{
    try{
      if(!navigator.storage?.persist)return false;
      const already=typeof navigator.storage.persisted==='function'&&await navigator.storage.persisted();
      if(already)return true;
      return !!(await navigator.storage.persist());
    }catch{return false}
  };

  const readState=async()=>{
    if(readPromise)return readPromise;
    await waitForFirstPaint();
    if(readPromise)return readPromise;
    if(!db||typeof db.transaction!=='function')return Promise.reject(new Error('Brak IndexedDB'));
    readPromise=new Promise((resolve,reject)=>{
      try{
        const tx=db.transaction('app','readonly');
        const store=tx.objectStore('app');
        const keys=['rows','headers','dateCol','storeCol'];
        const out={};let done=0,failed=false;
        for(const key of keys){
          const req=store.get(key);
          req.onsuccess=()=>{out[key]=req.result;if(++done===keys.length&&!failed){readCache=out;resolve(out)}};
          req.onerror=()=>{if(!failed){failed=true;reject(req.error||new Error('Błąd odczytu IndexedDB'))}};
        }
        tx.onabort=()=>{if(!failed){failed=true;reject(tx.error||new Error('Przerwano odczyt IndexedDB'))}};
        tx.onerror=()=>{if(!failed){failed=true;reject(tx.error||new Error('Błąd odczytu IndexedDB'))}};
      }catch(e){reject(e)}
    }).catch(e=>{readPromise=null;throw e});
    return readPromise;
  };

  if(originalDbGet){
    dbGet=async function(key){
      if(['rows','headers','dateCol','storeCol'].includes(key)){
        try{
          const state=readCache||await readState();
          return state[key];
        }catch(e){
          return originalDbGet(key);
        }
      }
      return originalDbGet(key);
    };
  }

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
      readCache={rows,headers,dateCol,storeCol};
      readPromise=Promise.resolve(readCache);
      setText('storageInfo','Magazyn: IndexedDB ✓');
      setText('saveStatus',`Trwały zapis aktywny — ${Array.isArray(rows)?rows.length:0} rekordów.`);
      if(typeof updateSyncCounters==='function')updateSyncCounters();
    }catch(e){
      if(db&&typeof db.transaction==='function')throw e;
      return originalPersist();
    }
  };

  window.PanParagonStorageBatch={enabled:true,readBatch:true,firstPaintGate:true,persistent:false,requestPersistentStorage};
  requestPersistentStorage().then(granted=>{
    window.PanParagonStorageBatch.persistent=granted;
  });
})();
