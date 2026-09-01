export default async function handler(req,res){
  try{
    const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
    const host=req.headers.host;
    const r=await fetch(`${proto}://${host}/index.html`,{headers:{'cache-control':'no-cache'}});
    if(!r.ok) return res.status(r.status).send(await r.text());
    let html=await r.text();
    if(!html.includes('/sync-retry.js')) html=html.replace('</body>','<script src="/sync-retry.js?v=4"></script><script src="/sync-filter.js?v=1"></script></body>');
    else if(!html.includes('/sync-filter.js')) html=html.replace('</body>','<script src="/sync-filter.js?v=1"></script></body>');
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store');
    res.status(200).send(html);
  }catch(e){
    res.status(500).send('PanParagon Monitor: '+(e?.message||String(e)));
  }
}
