(()=>{
  if(typeof window.render!=='function')return;
  const original=window.render,originalReport=typeof window.buildReport==='function'?window.buildReport:null;
  const OWNER_KEY='__ppm_owner';
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const ownerName=r=>r?.[OWNER_KEY]==='mama'?'mama':'ja';
  const dcache=()=>window.PanParagonDateCache;
  const getDate=r=>{const c=dcache();return c&&typeof c.get==='function'?c.get(r):rowDate(r)};
  let baseKey='',base=null,dataVersion=0,deferToken=0;
  const invalidate=()=>{dataVersion++;base=null;baseKey='';deferToken++};
  const makeKey=()=>`${Array.isArray(rows)?rows.length:0}|${String(dateCol||'')}|${String(storeCol||'')}|${dataVersion}`;
  const buildBase=()=>{
    const months={},years={},allStores={},monthStores={},ownerMonths=new Map(),ownerAll={ja:0,mama:0};let undated=0;
    for(const r of rows){
      const d=getDate(r),k=mk(d),s=storeName(r),owner=ownerName(r);
      ownerAll[owner]++;
      allStores[s]=(allStores[s]||0)+1;
      if(k){
        months[k]=(months[k]||0)+1;
        const y=String(d.getFullYear());years[y]=(years[y]||0)+1;
        const bucket=monthStores[k]||(monthStores[k]={});bucket[s]=(bucket[s]||0)+1;
        let owners=ownerMonths.get(k);if(!owners){owners={ja:0,mama:0};ownerMonths.set(k,owners)}owners[owner]++;
      }else undated++;
    }
    return{months,years,allStores,monthStores,owners:{all:ownerAll,months:ownerMonths},undated,me:Object.entries(months).sort((a,b)=>b[0].localeCompare(a[0])),yearEntries:Object.entries(years).sort((a,b)=>b[0].localeCompare(a[0])),ae:Object.entries(allStores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'))};
  };
  const ensureBase=()=>{const key=makeKey();if(!base||key!==baseKey){base=buildBase();baseKey=key}return base};
  const renderFilter=selected=>{
    const data=ensureBase(),stores=selected?(data.monthStores[selected]||{}):data.allStores;
    const count=selected?(data.months[selected]||0):rows.length;
    const rank=Object.entries(stores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'));
    $('rc').textContent=count;$('sc').textContent=rank.length;$('mc').textContent=data.me.length;$('top').textContent=rank[0]?.[0]||'—';$('topm').textContent=rank[0]?`${rank[0][1]} paragonów`:'Brak danych';
    $('rank').innerHTML=rank.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony</th></tr>${rank.map(([s,n],i)=>`<tr><td>${i+1}</td><td>${esc(s)}</td><td><b>${n}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak danych.</div>';
  };
  const renderMonthSelect=selected=>{
    const data=ensureBase(),byYear={};for(const[k]of data.me){const y=k.slice(0,4);(byYear[y]??=[]).push(k)}
    $('month').innerHTML='<option value="">Wszystkie miesiące</option>'+Object.keys(byYear).sort((a,b)=>b.localeCompare(a)).map(y=>`<optgroup label="${y}">${byYear[y].map(k=>`<option value="${k}">${monthName(k)}</option>`).join('')}</optgroup>`).join('');
    $('month').value=selected&&data.months[selected]?selected:'';
  };
  const renderYearly=()=>{
    const data=ensureBase(),{years,yearEntries}=data;
    $('yearly').innerHTML=yearEntries.length?yearEntries.map(([y,n])=>{const prev=years[String(+y-1)];let delta='Brak danych za poprzedni rok';if(prev){const pct=(n-prev)/prev*100;delta=`${pct>=0?'+':''}${pct.toFixed(1)}% vs ${+y-1}`}return `<div class="year-card"><div class="lab">${y}</div><div class="year-value">${n}</div><div class="small">paragonów</div><div class="delta">${delta}</div></div>`}).join(''):'<div class="empty">Brak danych.</div>';
  };
  const renderHistory=()=>{
    const data=ensureBase(),{me}=data,max=Math.max(1,...me.map(x=>x[1]));let lastYear='';
    $('hist').className='months-scroll'+(me.length?'':' empty');
    $('hist').innerHTML=me.length?me.map(([k,n])=>{const y=k.slice(0,4),head=y!==lastYear?`<div class="year-head">${y}</div>`:'';lastYear=y;return `${head}<div style="margin:12px 0"><div style="display:flex;justify-content:space-between"><span>${monthName(k)}</span><b>${n}</b></div><div class="bar"><i style="width:${Math.max(5,n/max*100)}%"></i></div></div>`}).join(''):'Brak danych.';
  };
  const renderMonthsTable=()=>{
    const data=ensureBase(),{me,undated}=data;let rh='',ty='';
    for(const[k,n]of me){const y=k.slice(0,4);if(y!==ty){rh+=`<tr><td colspan="2" style="font-size:17px;font-weight:800;padding-top:18px">${y}</td></tr>`;ty=y}rh+=`<tr><td>${monthName(k)}</td><td><b>${n}</b></td></tr>`}if(undated)rh+=`<tr><td>Nie rozpoznano daty</td><td><b>${undated}</b></td></tr>`;
    $('monthsTable').innerHTML=me.length||undated?`<table><tr><th>Miesiąc</th><th>Paragony</th></tr>${rh}</table>`:'<div class="empty">Brak danych.</div>';
  };
  const renderStoresTable=()=>{
    const {ae}=ensureBase();
    $('storesTable').innerHTML=ae.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony</th></tr>${ae.map(([s,n],i)=>`<tr><td>${i+1}</td><td>${esc(s)}</td><td><b>${n}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak danych.</div>';
  };
  const renderView=id=>{
    if(id==='months')renderMonthsTable();
    else if(id==='stores')renderStoresTable();
    else if(id==='dash'){renderYearly();renderHistory()}
  };
  const deferDashboardHistory=()=>{
    const token=++deferToken;
    requestAnimationFrame(()=>{if(token!==deferToken||!document.getElementById('dash')?.classList.contains('on'))return;renderHistory();window.PanParagonOwners?.refreshViews?.()});
  };
  const fastRender=(save=true)=>{
    try{
      dateCol=$('dc').value||dateCol;storeCol=$('stc').value||storeCol;
      const selected=$('month').value,key=makeKey(),full=!base||key!==baseKey;
      if(full){
        base=buildBase();baseKey=key;
        renderMonthSelect(selected);renderYearly();
        if(document.getElementById('months')?.classList.contains('on'))renderMonthsTable();
        if(document.getElementById('stores')?.classList.contains('on'))renderStoresTable();
        deferDashboardHistory();
        document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'main-render-fast'}}));
      }
      renderFilter(selected&&base.months[selected]?selected:'');
      if(save&&db)persistRows().catch(()=>{});updateMode();updateSyncCounters();
    }catch(e){console.warn('Fast render fallback',e);invalidate();return original(save)}
  };
  const fastReport=()=>{
    try{
      const data=ensureBase(),sel=$('month').value,stores=sel?(data.monthStores[sel]||{}):data.allStores,count=sel?(data.months[sel]||0):rows.length,a=Object.entries(stores).sort((x,y)=>y[1]-x[1]||x[0].localeCompare(y[0],'pl')),L=['PanParagon Monitor — raport',`Okres: ${sel?ml(sel):'wszystkie miesiące'}`,`Liczba paragonów: ${count}`,'','Ranking sklepów:'];
      a.forEach(([n,c],i)=>L.push(`${i+1}. ${n} — ${c}`));
      const text=L.join('\n');$('report').value=text;
      return{type:'panparagon_monthly_report',source:'PanParagon Monitor',period:sel||'all',report:text,receiptCount:count,stores:a.map(([store,count])=>({store,count})),sentAt:new Date().toISOString()};
    }catch(e){console.warn('Fast report fallback',e);return originalReport?originalReport():null}
  };
  document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.reason!=='main-render-fast')invalidate()});
  window.render=fastRender;window.buildReport=fastReport;window.PanParagonMainIndex={get:ensureBase,invalidate,version:()=>dataVersion,renderView};
})();