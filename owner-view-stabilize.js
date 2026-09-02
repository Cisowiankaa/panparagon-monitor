(()=>{
  const OWNER_KEY='__ppm_owner';
  const SOURCE_KEY='__ppm_owner_source';
  const LOCAL_KEY='ppm_owner_reconcile_v11_local';
  const CLOUD_KEY='ppm_owner_reconcile_v11_cloud';
  let reconciling=false;

  const owners=()=>window.PanParagonOwners;
  const refresh=()=>{try{owners()?.refreshViews?.()}catch(e){console.warn('Owner refresh fallback',e)}};
  const isExplicitMama=r=>String(r?.[SOURCE_KEY]||'')==='import-mama';

  const reconcileLocal=async()=>{
    if(localStorage.getItem(LOCAL_KEY)==='done'||reconciling||!Array.isArray(rows)||!rows.length)return [];
    reconciling=true;
    const changed=[];
    try{
      for(const r of rows){
        if(!r||typeof r!=='object'||r[OWNER_KEY]!=='mama'||isExplicitMama(r))continue;
        r[OWNER_KEY]='ja';
        r[SOURCE_KEY]='existing-all-ja-reconciled-v11';
        changed.push(r);
      }
      if(changed.length){
        window.PanParagonHashCache?.invalidate?.();
        window.PanParagonDateCache?.invalidate?.();
        window.PanParagonMainIndex?.invalidate?.();
        document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'owner-postsync-reconcile-v11',changed:changed.length}}));
        try{if(db&&typeof persistRows==='function')await persistRows()}catch{}
      }
      localStorage.setItem(LOCAL_KEY,'done');
      refresh();
      return changed;
    }finally{reconciling=false}
  };

  const reconcileCloud=async changed=>{
    if(localStorage.getItem(CLOUD_KEY)==='done'||!navigator.onLine||!user)return false;
    try{
      const list=Array.isArray(changed)&&changed.length?changed:(Array.isArray(rows)?rows:[]);
      if(!list.length)return false;
      const ok=await owners()?.syncChangedOwnersToCloud?.(list);
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
