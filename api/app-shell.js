// shell: local-first startup + synchronized store year filters + receipt owners
export default async function handler(req,res){
  try{
    const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
    const host=req.headers.host;
    const r=await fetch(`${proto}://${host}/index.html`,{headers:{'cache-control':'no-cache'}});
    if(!r.ok) return res.status(r.status).send(await r.text());
    let html=await r.text();
    const oldStartup="(async()=>{await initStorage();await consumeAuthHash();await refreshUser();$('webhook').value=webhook();$('deviceName').value=deviceName();showLastSync();if(user&&navigator.onLine)await autoSync('przy uruchomieniu');if(headers.length){guess();render(false)}else updateMode();if(user){await loadHistory();await runDiagnostics(true)}else updateSyncCounters()})();";
    const newStartup="(async()=>{await initStorage();if(headers.length)guess();await window.PanParagonOwners?.migrateExisting?.();$('webhook').value=webhook();$('deviceName').value=deviceName();showLastSync();if(headers.length)render(false);else updateMode();await new Promise(resolve=>requestAnimationFrame(resolve));await consumeAuthHash();await refreshUser();if(user&&navigator.onLine){autoSync('przy uruchomieniu').catch(()=>{})}else updateSyncCounters()})();";
    if(html.includes(oldStartup)) html=html.replace(oldStartup,newStartup);
    if(!html.includes('/sync-retry.js')) html=html.replace('</body>','<script src="/storage-batch.js?v=4"></script><script src="/sync-hash-cache.js?v=5"></script><script src="/sync-retry.js?v=6"></script><script src="/sync-ui-batch.js?v=2"></script><script src="/sync-fetch-reuse.js?v=6"></script><script src="/sync-filter.js?v=1"></script><script src="/owner-import.js?v=5"></script><script src="/store-date-cache.js?v=1"></script><script src="/main-render-fast.js?v=3"></script><script src="/store-details.js?v=4"></script><script src="/store-fast-refresh.js?v=5"></script><script src="/store-sort.js?v=2"></script><script src="/store-filter.js?v=2"></script><script src="/store-year-detail.js?v=14"></script><script src="/store-stats.js?v=4"></script></body>');
    else {
      if(!html.includes('/storage-batch.js')) html=html.replace(/(<script src="\/sync-hash-cache\.js\?v=\d+"><\/script>)/,'<script src="/storage-batch.js?v=4"></script>$1');
      else html=html.replace(/\/storage-batch\.js\?v=\d+/g,'/storage-batch.js?v=4');
      if(!html.includes('/sync-hash-cache.js')) html=html.replace(/(<script src="\/sync-retry\.js\?v=\d+"><\/script>)/,'<script src="/sync-hash-cache.js?v=5"></script>$1');
      else html=html.replace(/\/sync-hash-cache\.js\?v=\d+/g,'/sync-hash-cache.js?v=5');
      html=html.replace(/\/sync-retry\.js\?v=\d+/g,'/sync-retry.js?v=6');
      if(!html.includes('/sync-ui-batch.js')) html=html.replace(/(<script src="\/sync-retry\.js\?v=\d+"><\/script>)/,'$1<script src="/sync-ui-batch.js?v=2"></script>');
      else html=html.replace(/\/sync-ui-batch\.js\?v=\d+/g,'/sync-ui-batch.js?v=2');
      if(!html.includes('/sync-fetch-reuse.js')) html=html.replace(/(<script src="\/sync-ui-batch\.js\?v=\d+"><\/script>)/,'$1<script src="/sync-fetch-reuse.js?v=6"></script>');
      else html=html.replace(/\/sync-fetch-reuse\.js\?v=\d+/g,'/sync-fetch-reuse.js?v=6');
      if(!html.includes('/sync-filter.js')) html=html.replace('</body>','<script src="/sync-filter.js?v=1"></script></body>');
      if(!html.includes('/owner-import.js')) html=html.replace(/(<script src="\/sync-filter\.js\?v=\d+"><\/script>)/,'$1<script src="/owner-import.js?v=5"></script>');
      else html=html.replace(/\/owner-import\.js\?v=\d+/g,'/owner-import.js?v=5');
      if(!html.includes('/store-date-cache.js')) html=html.replace(/(<script src="\/owner-import\.js\?v=\d+"><\/script>)/,'$1<script src="/store-date-cache.js?v=1"></script>');
      else html=html.replace(/\/store-date-cache\.js\?v=\d+/g,'/store-date-cache.js?v=1');
      if(!html.includes('/main-render-fast.js')) html=html.replace(/(<script src="\/store-date-cache\.js\?v=\d+"><\/script>)/,'$1<script src="/main-render-fast.js?v=3"></script>');
      else html=html.replace(/\/main-render-fast\.js\?v=\d+/g,'/main-render-fast.js?v=3');
      if(!html.includes('/store-details.js')) html=html.replace('</body>','<script src="/store-details.js?v=4"></script></body>');
      else html=html.replace(/\/store-details\.js\?v=\d+/g,'/store-details.js?v=4');
      if(!html.includes('/store-fast-refresh.js')) html=html.replace(/(<script src="\/store-details\.js\?v=\d+"><\/script>)/,'$1<script src="/store-fast-refresh.js?v=5"></script>');
      else html=html.replace(/\/store-fast-refresh\.js\?v=\d+/g,'/store-fast-refresh.js?v=5');
      if(!html.includes('/store-sort.js')) html=html.replace('</body>','<script src="/store-sort.js?v=2"></script></body>');
      else html=html.replace(/\/store-sort\.js\?v=\d+/g,'/store-sort.js?v=2');
      if(!html.includes('/store-filter.js')) html=html.replace('</body>','<script src="/store-filter.js?v=2"></script></body>');
      else html=html.replace(/\/store-filter\.js\?v=\d+/g,'/store-filter.js?v=2');
      if(!html.includes('/store-year-detail.js')) html=html.replace('</body>','<script src="/store-year-detail.js?v=14"></script></body>');
      else html=html.replace(/\/store-year-detail\.js\?v=\d+/g,'/store-year-detail.js?v=14');
      if(!html.includes('/store-stats.js')) html=html.replace('</body>','<script src="/store-stats.js?v=4"></script></body>');
      else html=html.replace(/\/store-stats\.js\?v=\d+/g,'/store-stats.js?v=4');
    }
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store');
    res.status(200).send(html);
  }catch(e){
    res.status(500).send('PanParagon Monitor: '+(e?.message||String(e)));
  }
}
