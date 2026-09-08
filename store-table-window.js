(()=>{
  const LIMIT=30;
  const innerHTMLDesc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  const nativeGet=innerHTMLDesc?.get,nativeSet=innerHTMLDesc?.set;

  const windowHtml=html=>{
    if(typeof html!=='string')return html;
    const open=html.match(/^\s*(<table\b[^>]*>)/i)?.[1];
    if(!open)return html;
    const re=/<tr\b[\s\S]*?<\/tr>/gi,rows=[];
    let m;
    while(rows.length<=LIMIT&&(m=re.exec(html)))rows.push(m[0]);
    if(rows.length<=LIMIT+1&&!re.test(html))return html;
    return `${open}${rows.slice(0,LIMIT+1).join('')}</table>`;
  };

  const installWriteWindow=()=>{
    const box=document.getElementById('storesTable');
    if(!box||!nativeGet||!nativeSet||box.dataset.ppmWriteWindow==='1')return box;
    Object.defineProperty(box,'innerHTML',{
      configurable:true,
      get(){return nativeGet.call(this)},
      set(value){
        if(typeof value==='string'){
          const next=windowHtml(value);
          nativeSet.call(this,next);
          const table=this.querySelector('table');
          if(table)table.dataset.ppmWindowed='1';
          return;
        }
        nativeSet.call(this,value);
      }
    });
    box.dataset.ppmWriteWindow='1';
    return box;
  };

  const trim=()=>{
    const box=installWriteWindow();
    if(!box)return;
    const table=box.querySelector('table');
    if(!table)return;
    const count=table.rows?.length||0;
    if(count<=LIMIT+1){table.dataset.ppmWindowed='1';return}
    const next=table.cloneNode(false),frag=document.createDocumentFragment();
    for(let i=0;i<Math.min(count,LIMIT+1);i++)frag.appendChild(table.rows[i].cloneNode(true));
    next.appendChild(frag);next.dataset.ppmWindowed='1';table.replaceWith(next);
  };

  const schedule=()=>queueMicrotask(trim);
  const base=typeof window.render==='function'?window.render:null;
  if(base){
    window.render=function(...args){
      installWriteWindow();
      const out=base.apply(this,args);
      trim();
      return out;
    };
  }
  document.addEventListener('DOMContentLoaded',installWriteWindow,{once:true});
  document.addEventListener('panparagon:data-changed',e=>{
    if(e?.detail?.reason==='main-render-fast'||e?.detail?.source==='main-render-fast')schedule();
  });
  installWriteWindow();trim();
  window.PanParagonStoreTableWindow={trim,limit:LIMIT,install:installWriteWindow};
})();
