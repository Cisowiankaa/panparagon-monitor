(()=>{
  const KEY='ppm_store_perf_ui_last';
  const state={};
  const now=()=>performance.now();
  const round=n=>Math.round(n*10)/10;
  const active=()=>document.getElementById('stores')?.classList.contains('on');
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({...state,at:new Date().toISOString()}))}catch{};render()};
  const ensure=()=>{
    const sec=document.getElementById('stores');if(!sec)return null;
    let el=document.getElementById('storePerfUi');
    if(el)return el;
    el=document.createElement('div');el.id='storePerfUi';el.className='small';el.style.cssText='margin:0 0 10px;opacity:.72';
    const anchor=document.getElementById('storePerfMini')||document.getElementById('storeFilterBar')||document.getElementById('storesTable');
    if(anchor)anchor.insertAdjacentElement('afterend',el);else sec.appendChild(el);
    return el;
  };
  const render=()=>{
    const el=ensure();if(!el)return;
    const p=[];
    if(Number.isFinite(state.navMs))p.push(`wejście ${state.navMs} ms`);
    if(Number.isFinite(state.filterMs))p.push(`filtr ${state.filterMs} ms`);
    if(Number.isFinite(state.clickMs))p.push(`klik ${state.clickMs} ms`);
    const vals=[['wejście',state.navMs],['filtr',state.filterMs],['klik',state.clickMs]].filter(([,v])=>Number.isFinite(v)).sort((a,b)=>b[1]-a[1]);
    const worst=vals[0];
    el.textContent=p.length?`Sklepy · interakcje: ${p.join(' · ')}${worst&&worst[1]>=50?` · najwolniej: ${worst[0]} ${worst[1]} ms`:''}`:'Sklepy · interakcje: czekam na pomiar';
  };
  const twoPaints=(start,key)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{state[key]=round(now()-start);save()}));
  let filterToken=0;
  const install=()=>{
    ensure();render();
    document.addEventListener('click',e=>{
      if(e.target.closest?.('#nav button[data-v="stores"]')){const t=now();twoPaints(t,'navMs');return}
      const tr=e.target.closest?.('#storesTable tr');
      if(tr&&!tr.querySelector('th')){const t=now();twoPaints(t,'clickMs')}
    },true);
    document.addEventListener('input',e=>{
      if(e.target?.id!=='storeSearch')return;
      const token=++filterToken,t=now();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token!==filterToken)return;state.filterMs=round(now()-t);state.filterLength=String(e.target.value||'').length;save()}));
    },true);
    try{
      const po=new PerformanceObserver(list=>{
        if(!active())return;
        let max=0,count=0;
        for(const x of list.getEntries()){const d=Number(x.duration||0);if(d>=50){count++;max=Math.max(max,d)}}
        if(count){state.longTaskMaxMs=round(Math.max(state.longTaskMaxMs||0,max));state.longTaskCount=(state.longTaskCount||0)+count;save()}
      });
      po.observe({entryTypes:['longtask']});
    }catch{}
    window.PanParagonStorePerfUI={getLast:()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}},getCurrent:()=>({...state})};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
