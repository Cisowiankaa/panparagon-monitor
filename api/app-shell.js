// shell: local-first startup + canonical module order
export default async function handler(req,res){
  try{
    const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
    const host=req.headers.host;
    const r=await fetch(`${proto}://${host}/index.html`,{headers:{'cache-control':'no-cache'}});
    if(!r.ok)return res.status(r.status).send(await r.text());
    let html=await r.text();
    const oldStartup="(async()=>{await initStorage();await consumeAuthHash();await refreshUser();$('webhook').value=webhook();$('deviceName').value=deviceName();showLastSync();if(user&&navigator.onLine)await autoSync('przy uruchomieniu');if(headers.length){guess();render(false)}else updateMode();if(user){await loadHistory();await runDiagnostics(true)}else updateSyncCounters()})();";
    const newStartup="(async()=>{await initStorage();if(headers.length)guess();await window.PanParagonOwners?.migrateExisting?.();$('webhook').value=webhook();$('deviceName').value=deviceName();showLastSync();if(headers.length)render(false);else updateMode();await new Promise(resolve=>requestAnimationFrame(resolve));await consumeAuthHash();await refreshUser();if(user&&navigator.onLine){autoSync('przy uruchomieniu').catch(()=>{})}else updateSyncCounters()})();";
    if(html.includes(oldStartup))html=html.replace(oldStartup,newStartup);

    const managed=[
      ['storage-batch.js',4],
      ['sync-hash-cache.js',5],
      ['sync-retry.js',6],
      ['sync-ui-batch.js',3],
      ['sync-filter.js',1],
      ['store-date-cache.js',2],
      ['main-render-fast.js',6],
      ['owner-import.js',13],
      ['owner-backup-restore.js',2],
      ['sync-fetch-reuse.js',6],
      ['owner-view-stabilize.js',2],
      ['sync-history-cache.js',1],
      ['store-details.js',4],
      ['store-fast-refresh.js',5],
      ['store-sort.js',2],
      ['store-filter.js',3],
      ['store-detail-source.js',1],
      ['store-year-detail.js',16],
      ['store-month-cache.js',2],
      ['store-stats.js',4],
      ['nav-recovery.js',2]
    ];
    for(const [name] of managed){
      const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      html=html.replace(new RegExp(`<script\\s+src=["']\\/${escaped}(?:\\?v=\\d+)?["']\\s*><\\/script>`,`g`),'');
    }
    const scripts=managed.map(([name,v])=>`<script src="/${name}?v=${v}"></script>`).join('');
    html=html.replace('</body>',scripts+'</body>');

    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store');
    res.status(200).send(html);
  }catch(e){
    res.status(500).send('PanParagon Monitor: '+(e?.message||String(e)));
  }
}
