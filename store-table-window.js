(()=>{
  const LIMIT=100;
  const innerHTMLDesc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  const nativeGet=innerHTMLDesc?.get,nativeSet=innerHTMLDesc?.set;

  const windowHtml=html=>{
    if(typeof html!=='string')return html;
    const open=html.match(/^\s*(<table\b[^>]*>)/i)?.[1];
    if(!open)return html;
    const rows=[...html.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map(m=>m[0]);
    if(rows.length<=LIMIT+1)return html;
    return `${open}${rows.slice(0,LIMIT+1).join('')}</table>`;
  };

  const installWriteWindow=()=>{
    const view=document.getElementById('stores'),box=document.getElementById('storesTable');
    if(!box||!nativeGet||!nativeSet||box.dataset.ppmWriteWindow==='1')return box;
    Object.defineProperty(box,'innerHTML',{
      configurable:true,
      get(){return nativeGet.call(this)},
      set(value){
        const hidden=!view?.classList.contains('on');
        if(hidden&&typeof value==='string'){
          const total=(value.match(/<tr\b/gi)||[]).length-1;
          const next=windowHtml(value);
          nativeSet.call(this,next);
          if(total>LIMIT)this.dataset.ppmWindowedTotal=String(total);
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
    const view=document.getElementById('stores'),box=installWriteWindow();
    if(!box||view?.classList.contains('on'))return;
    const table=box.querySelector('table');
    if(!table||table.dataset.ppmWindowed==='1')return;
    const rows=[...table.querySelectorAll('tr')];
    if(rows.length<=LIMIT+1){table.dataset.ppmWindowed='1';return}
    const frag=document.createDocumentFragment(),next=table.cloneNode(false);
    for(let i=0;i<=LIMIT&&i<rows.length;i++)frag.appendChild(rows[i]);
    next.appendChild(frag);next.dataset.ppmWindowed='1';table.replaceWith(next);
    box.dataset.ppmWindowedTotal=String(rows.length-1);
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
