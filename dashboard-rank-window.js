(()=>{
  const LIMIT=60;
  const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  const nativeGet=desc?.get,nativeSet=desc?.set;
  const rank=document.getElementById('rank');
  if(!rank||!nativeGet||!nativeSet||rank.dataset.ppmRankWindow==='1')return;

  const windowHtml=html=>{
    if(typeof html!=='string'||!/<table\b/i.test(html))return html;
    const open=html.match(/^\s*(<table\b[^>]*>)/i)?.[1];
    if(!open)return html;
    const re=/<tr\b[\s\S]*?<\/tr>/gi,rows=[];let m;
    while(rows.length<=LIMIT+1&&(m=re.exec(html)))rows.push(m[0]);
    if(rows.length<=LIMIT+1&&!re.test(html))return html;
    const head=rows[0]||'';
    const body=rows.slice(1,LIMIT+1).join('');
    return `${open}${head}${body}</table><div class="small" style="margin-top:10px">Pokazano pierwsze ${LIMIT} sklepów. Pełna lista jest w zakładce Sklepy.</div>`;
  };

  Object.defineProperty(rank,'innerHTML',{
    configurable:true,
    get(){return nativeGet.call(this)},
    set(value){nativeSet.call(this,windowHtml(value))}
  });
  rank.dataset.ppmRankWindow='1';
  window.PanParagonDashboardRankWindow={limit:LIMIT};
})();
