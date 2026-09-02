(()=>{
  const OWNER_KEY='__ppm_owner';
  const SOURCE_KEY='__ppm_owner_source';
  const LOCAL_KEY='ppm_owner_reconcile_v12_local';
  const CLOUD_KEY='ppm_owner_reconcile_v12_cloud';
  let reconciling=false;

  const owners=()=>window.PanParagonOwners;
  const refresh=()=>{try{owners()?.refreshViews?.()}catch(e){console.warn('Owner refresh fallback',e)}};
  const sourceOf=r=>String(r?.[SOURCE_KEY]||'');
  const isIntentionalMama=r=>{
    const source=sourceOf(r);
    return source==='import-mama'||source==='cutoff-auto';
  };
  const isLegacyExisting=r=>{
    const source=sourceOf(r);
    return !source||/^existing-all-ja(?:-reconciled)?-v(?:7|8|11)$/.test(source);
  };

  const reconcileLocal=async()=>{
    if(localStorage.getItem(LOCAL_KEY)==='done'||reconciling||!Array.isArray(rows)||!rows.length)return [];
    reconciling=true;
    const changed=[];
    try{
      for(const r of rows){
        if(!r||typeof r!=='object'||r[OWNER_KEY]!=='mama'||isIntentionalMama(r)||!isLegacyExisting(r))continue;
        r[OWNER_KEY]='ja';
        r[SOURCE_KEY]='existing-all-ja-reconciled-v12';
        changed.push(r);
      }
      if(changed.length){
        window.PanParagonHashCache?.invalidate?.();
        window.PanParagonDateCache?.invalidate?.();
        window.PanParagonMainIndex?.invalidate?.();
        document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'owner-postsync-reconcile-v12',changed:changed.length}}));
        try{
          if(!db||typeof persistRows!=='function')throw new Error('Brak trwałego magazynu');
          await persistRows();
        }catch(e){
          localStorage.removeItem(LOCAL_KEY);
          console.warn('Owner reconcile persist fallback',e);
          refresh();
          return changed;
        }
      }
      localStorage.setItem(LOCAL_KEY,'done');
      refresh();
      return changed;
    }finally{reconciling=false}
  };

  const reconcileCloud=async changed=>{
    if(localStorage.getItem(CLOUD_KEY)==='done'||!navigator.onLine||!user)return false;
    try{
      if(!Array.isArray(changed)||!changed.length){localStorage.setItem(CLOUD_KEY,'done');return true}
      const ok=await owners()?.syncChangedOwnersToCloud?.(changed);
      if(ok)localStorage.setItem(CLOUD_KEY,'done');
      return !!ok;
    }catch(e){console.warn('Owner reconcile cloud fallback',e);return false}
  };

  const reconcile=async()=>{
    const changed=await reconcileLocal();
    await reconcileCloud(changed);
    refresh();
  };

  const install=()=>{
    const baseRender=typeof render==='function'?render:null;
    if(baseRender){
      render=function(...args){
        const out=baseRender.apply(this,args);
        refresh();
        return out;
      };
    }

    const baseAuto=typeof autoSync==='function'?autoSync:null;
    if(baseAuto){
      autoSync=async function(...args){
        const out=await baseAuto.apply(this,args);
        await reconcile();
        refresh();
        return out;
      };
    }

    document.getElementById('month')?.addEventListener('change',refresh);
    document.addEventListener('panparagon:data-changed',()=>queueMicrotask(refresh));

    let tries=0;
    const ready=async()=>{
      tries++;
      if((!Array.isArray(rows)||!rows.length)&&tries<100){setTimeout(ready,50);return}
      if(Array.isArray(rows)&&rows.length){
        await reconcileLocal();
        refresh();
      }
    };
    setTimeout(ready,0);
  };

  window.PanParagonOwnerStabilizer={reconcile,refresh};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
