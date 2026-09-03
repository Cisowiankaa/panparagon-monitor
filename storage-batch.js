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
  const CHUNK_SIZE=1200,META_KEY='rows_chunk_meta',CHUNK_PREFIX='rows_chunk_';
  const setText=(id,text)=>{try{const el=document.getElementById(id);if(el)el.textContent=text}catch{}};
  let readPromise=null,readCache=null,firstReadPaint=null,mirrorScheduled=false;

  const waitForFirstPaint=()=>{
    if(firstReadPaint)return firstReadPaint;
    firstReadPaint=new Promise(resolve=>{
      const afterFrame=()=>setTimeout(resolve,0);
      if(typeof requestAnimationFrame==='function')requestAnimationFrame(afterFrame);
      else setTimeout(resolve,0);
    });
    return firstReadPaint;
  };

  const yieldFrame=()=>new Promise(resolve=>{
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>setTimeout(resolve,0));
    else setTimeout(resolve,0);
  });

  const rawGet=key=>new Promise((resolve,reject)=>{
    try{
      const tx=db.transaction('app','readonly'),req=tx.objectStore('app').get(key);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Błąd odczytu IndexedDB'));
    }catch(e){reject(e)}
  });

  const writeChunkMirror=async source=>{
    if(!db||!Array.isArray(source))return false;
    const chunks=Math.ceil(source.length/CHUNK_SIZE);
    let oldMeta=null;try{oldMeta=await rawGet(META_KEY)}catch{}
    await new Promise((resolve,reject)=>{
      try{
        const tx=db.transaction('app','readwrite'),store=tx.objectStore('app');
        for(let i=0;i<chunks;i++)store.put(source.slice(i*CHUNK_SIZE,(i+1)*CHUNK_SIZE),CHUNK_PREFIX+i);
        const oldChunks=Number(oldMeta?.chunks||0);
        for(let i=chunks;i<oldChunks;i++)store.delete(CHUNK_PREFIX+i);
        store.put({version:1,chunks,total:source.length,chunkSize:CHUNK_SIZE,updatedAt:Date.now()},META_KEY);
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error||new Error('Błąd zapisu porcji IndexedDB'));
        tx.onabort=()=>reject(tx.error||new Error('Przerwano zapis porcji IndexedDB'));
      }catch(e){reject(e)}
    });
    return true;
  };

  const scheduleMirror=source=>{
    if(mirrorScheduled||!Array.isArray(source)||!source.length)return;
    mirrorScheduled=true;
    const run=()=>writeChunkMirror(source).catch(e=>console.warn('Chunk mirror fallback',e));
    if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:5000});
    else setTimeout(run,1200);
  };

  const readChunkedRows=async meta=>{
    const count=Number(meta?.chunks||0),total=Number(meta?.total||0);
    if(!Number.isFinite(count)||count<0||!Number.isFinite(total)||total<0)return null;
    if(count===0)return [];
    const out=[];
    for(let i=0;i<count;i++){
      const part=await rawGet(CHUNK_PREFIX+i);
      if(!Array.isArray(part))return null;
      out.push(...part);
      if(i<count-1)await yieldFrame();
    }
    return out.length===total?out:null;
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
    readPromise=(async()=>{
      let loadedRows=null,meta=null;
      try{meta=await rawGet(META_KEY)}catch{}
      if(meta?.version===1){
        try{loadedRows=await readChunkedRows(meta)}catch{loadedRows=null}
      }
      if(!Array.isArray(loadedRows)){
        loadedRows=await rawGet('rows');
        if(Array.isArray(loadedRows)&&loadedRows.length)scheduleMirror(loadedRows);
      }
      const [loadedHeaders,loadedDateCol,loadedStoreCol]=await Promise.all([
        rawGet('headers'),rawGet('dateCol'),rawGet('storeCol')
      ]);
      const out={rows:loadedRows,headers:loadedHeaders,dateCol:loadedDateCol,storeCol:loadedStoreCol};
      readCache=out;
      return out;
    })().catch(e=>{readPromise=null;throw e});
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
      try{await writeChunkMirror(rows)}catch(e){console.warn('Chunk mirror persist fallback',e)}
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

  window.PanParagonStorageBatch={enabled:true,readBatch:true,firstPaintGate:true,chunkedRows:true,chunkSize:CHUNK_SIZE,persistent:false,requestPersistentStorage};
  requestPersistentStorage().then(granted=>{
    window.PanParagonStorageBatch.persistent=granted;
  });
})();
