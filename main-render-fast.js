(()=>{
  if(typeof window.render!=='function')return;
  const original=window.render,originalReport=typeof window.buildReport==='function'?window.buildReport:null;
  const OWNER_KEY='__ppm_owner',SNAPSHOT_KEY='ppm_dashboard_snapshot_v1';
  const storeName=r=>{try{return (r[storeCol]||'Nieznany sklep').trim()||'Nieznany sklep'}catch{return'Nieznany sklep'}};
  const ownerName=r=>r?.[OWNER_KEY]==='mama'?'mama':'ja';
  const dcache=()=>window.PanParagonDateCache;
  const getDate=r=>{const c=dcache();return c&&typeof c.get==='function'?c.get(r):rowDate(r)};
  const safeMonthName=k=>{try{return monthName(k)}catch{const[y,m]=String(k||'').split('-');return new Intl.DateTimeFormat('pl-PL',{month:'long'}).format(new Date(+y,+m-1,1))}};
  const snapshotHtml=data=>{
    if(!data||!Array.isArray(data.me)||!Array.isArray(data.yearEntries)||!Array.isArray(data.ae))return false;
    const me=data.me,yearEntries=data.yearEntries,ae=data.ae,years=data.years||{},months=data.months||{},undated=Number(data.undated||0),total=Number(data.total||0);
    const rc=$('rc'),sc=$('sc'),mc=$('mc'),top=$('top'),topm=$('topm'),rank=$('rank'),yearly=$('yearly'),hist=$('hist'),monthsTable=$('monthsTable'),storesTable=$('storesTable'),month=$('month');
    if(!rc||!sc||!mc||!top||!topm||!rank||!yearly||!hist||!month)return false;
    rc.textContent=total;sc.textContent=ae.length;mc.textContent=me.length;top.textContent=ae[0]?.[0]||'—';topm.textContent=ae[0]?`${ae[0][1]} paragonów`:'Brak danych';
    rank.innerHTML=ae.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony</th></tr>${ae.map(([s,n],i)=>`<tr><td>${i+1}</td><td>${esc(s)}</td><td><b>${n}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak danych.</div>';
    yearly.innerHTML=yearEntries.length?yearEntries.map(([y,n])=>{const prev=years[String(+y-1)];let delta='Brak danych za poprzedni rok';if(prev){const pct=(n-prev)/prev*100;delta=`${pct>=0?'+':''}${pct.toFixed(1)}% vs ${+y-1}`}return `<div class="year-card"><div class="lab">${y}</div><div class="year-value">${n}</div><div class="small">paragonów</div><div class="delta">${delta}</div></div>`}).join(''):'<div class="empty">Brak danych.</div>';
    const max=Math.max(1,...me.map(x=>x[1]));let lastYear='';hist.className='months-scroll'+(me.length?'':' empty');hist.innerHTML=me.length?me.map(([k,n])=>{const y=k.slice(0,4),head=y!==lastYear?`<div class="year-head">${y}</div>`:'';lastYear=y;return `${head}<div data-month-key="${k}" style="margin:12px 0"><div style="display:flex;justify-content:space-between"><span>${safeMonthName(k)}</span><b>${n}</b></div><div class="bar"><i style="width:${Math.max(5,n/max*100)}%"></i></div></div>`}).join(''):'Brak danych.';
    let rh='',ty='';for(const[k,n]of me){const y=k.slice(0,4);if(y!==ty){rh+=`<tr><td colspan="2" style="font-size:17px;font-weight:800;padding-top:18px">${y}</td></tr>`;ty=y}rh+=`<tr data-month-key="${k}"><td>${safeMonthName(k)}</td><td><b>${n}</b></td></tr>`}if(undated)rh+=`<tr><td>Nie rozpoznano daty</td><td><b>${undated}</b></td></tr>`;
    if(monthsTable)monthsTable.innerHTML=me.length||undated?`<table><tr><th>Miesiąc</th><th>Paragony</th></tr>${rh}</table>`:'<div class="empty">Brak danych.</div>';
    if(storesTable)storesTable.innerHTML=ae.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony</th></tr>${ae.map(([s,n],i)=>`<tr><td>${i+1}</td><td>${esc(s)}</td><td><b>${n}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak danych.</div>';
    const byYear={};for(const[k]of me){const y=k.slice(0,4);(byYear[y]??=[]).push(k)}month.innerHTML='<option value="">Wszystkie miesiące</option>'+Object.keys(byYear).sort((a,b)=>b.localeCompare(a)).map(y=>`<optgroup label="${y}">${byYear[y].map(k=>`<option value="${k}">${safeMonthName(k)}</option>`).join('')}</optgroup>`).join('');
    document.documentElement.dataset.ppmSnapshot='shown';return true;
  };
  const restoreSnapshot=()=>{try{const raw=localStorage.getItem(SNAPSHOT_KEY);if(!raw)return false;const snap=JSON.parse(raw);if(!snap||snap.version!==1||Date.now()-Number(snap.savedAt||0)>30*24*60*60*1000)return false;return snapshotHtml(snap.data)}catch{return false}};
  const saveSnapshot=data=>{try{localStorage.setItem(SNAPSHOT_KEY,JSON.stringify({version:1,savedAt:Date.now(),data:{total:Array.isArray(rows)?rows.length:0,months:data.months,years:data.years,undated:data.undated,me:data.me,yearEntries:data.yearEntries,ae:data.ae}}))}catch{}};
  restoreSnapshot();
  let baseKey='',base=null,dataVersion=0,staticRenderKey='';
  const invalidate=()=>{dataVersion++;base=null;baseKey='';staticRenderKey=''};
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
    const built={months,years,allStores,monthStores,owners:{all:ownerAll,months:ownerMonths},undated,me:Object.entries(months).sort((a,b)=>b[0].localeCompare(a[0])),yearEntries:Object.entries(years).sort((a,b)=>b[0].localeCompare(a[0])),ae:Object.entries(allStores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'))};
    saveSnapshot(built);return built;
  };
  const ensureBase=()=>{const key=makeKey();if(!base||key!==baseKey){base=buildBase();baseKey=key}return base};
  const renderFilter=selected=>{
    const data=ensureBase(),stores=selected?(data.monthStores[selected]||{}):data.allStores;
    const count=selected?(data.months[selected]||0):rows.length;
    const rank=selected?Object.entries(stores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl')):data.ae;
    $('rc').textContent=count;$('sc').textContent=rank.length;$('mc').textContent=data.me.length;$('top').textContent=rank[0]?.[0]||'—';$('topm').textContent=rank[0]?`${rank[0][1]} paragonów`:'Brak danych';
    $('rank').innerHTML=rank.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony</th></tr>${rank.map(([s,n],i)=>`<tr><td>${i+1}</td><td>${esc(s)}</td><td><b>${n}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak danych.</div>';
  };
  const renderStatic=selected=>{
    const data=ensureBase(),{months,years,undated,me,yearEntries,ae}=data;
    $('yearly').innerHTML=yearEntries.length?yearEntries.map(([y,n])=>{const prev=years[String(+y-1)];let delta='Brak danych za poprzedni rok';if(prev){const pct=(n-prev)/prev*100;delta=`${pct>=0?'+':''}${pct.toFixed(1)}% vs ${+y-1}`}return `<div class="year-card"><div class="lab">${y}</div><div class="year-value">${n}</div><div class="small">paragonów</div><div class="delta">${delta}</div></div>`}).join(''):'<div class="empty">Brak danych.</div>';
    const max=Math.max(1,...me.map(x=>x[1]));let lastYear='';$('hist').className='months-scroll'+(me.length?'':' empty');$('hist').innerHTML=me.length?me.map(([k,n])=>{const y=k.slice(0,4),head=y!==lastYear?`<div class="year-head">${y}</div>`:'';lastYear=y;return `${head}<div data-month-key="${k}" style="margin:12px 0"><div style="display:flex;justify-content:space-between"><span>${monthName(k)}</span><b>${n}</b></div><div class="bar"><i style="width:${Math.max(5,n/max*100)}%"></i></div></div>`}).join(''):'Brak danych.';
    let rh='',ty='';for(const[k,n]of me){const y=k.slice(0,4);if(y!==ty){rh+=`<tr><td colspan="2" style="font-size:17px;font-weight:800;padding-top:18px">${y}</td></tr>`;ty=y}rh+=`<tr data-month-key="${k}"><td>${monthName(k)}</td><td><b>${n}</b></td></tr>`}if(undated)rh+=`<tr><td>Nie rozpoznano daty</td><td><b>${undated}</b></td></tr>`;
    $('monthsTable').innerHTML=me.length||undated?`<table><tr><th>Miesiąc</th><th>Paragony</th></tr>${rh}</table>`:'<div class="empty">Brak danych.</div>';
    $('storesTable').innerHTML=ae.length?`<table><tr><th>#</th><th>Sklep</th><th>Paragony</th></tr>${ae.map(([s,n],i)=>`<tr><td>${i+1}</td><td>${esc(s)}</td><td><b>${n}</b></td></tr>`).join('')}</table>`:'<div class="empty">Brak danych.</div>';
    const byYear={};for(const[k]of me){const y=k.slice(0,4);(byYear[y]??=[]).push(k)}$('month').innerHTML='<option value="">Wszystkie miesiące</option>'+Object.keys(byYear).sort((a,b)=>b.localeCompare(a)).map(y=>`<optgroup label="${y}">${byYear[y].map(k=>`<option value="${k}">${monthName(k)}</option>`).join('')}</optgroup>`).join('');$('month').value=selected&&months[selected]?selected:'';
  };
  const fastRender=(save=true)=>{
    try{
      dateCol=$('dc').value||dateCol;storeCol=$('stc').value||storeCol;
      const selected=$('month').value,key=makeKey(),dataChanged=!base||key!==baseKey;
      if(dataChanged){base=buildBase();baseKey=key}
      if(staticRenderKey!==key){renderStatic(selected);staticRenderKey=key}
      if(dataChanged)document.dispatchEvent(new CustomEvent('panparagon:data-changed',{detail:{reason:'main-render-fast'}}));
      renderFilter(selected&&base.months[selected]?selected:'');
      delete document.documentElement.dataset.ppmSnapshot;
      if(save&&db)persistRows().catch(()=>{});updateMode();updateSyncCounters();
    }catch(e){console.warn('Fast render fallback',e);invalidate();return original(save)}
  };
  const fastReport=()=>{
    try{
      const data=ensureBase(),sel=$('month').value,count=sel?(data.months[sel]||0):rows.length,a=sel?Object.entries(data.monthStores[sel]||{}).sort((x,y)=>y[1]-x[1]||x[0].localeCompare(y[0],'pl')):data.ae,L=['PanParagon Monitor — raport',`Okres: ${sel?ml(sel):'wszystkie miesiące'}`,`Liczba paragonów: ${count}`,'','Ranking sklepów:'];
      a.forEach(([n,c],i)=>L.push(`${i+1}. ${n} — ${c}`));
      const text=L.join('\n');$('report').value=text;
      return{type:'panparagon_monthly_report',source:'PanParagon Monitor',period:sel||'all',report:text,receiptCount:count,stores:a.map(([store,count])=>({store,count})),sentAt:new Date().toISOString()};
    }catch(e){console.warn('Fast report fallback',e);return originalReport?originalReport():null}
  };
  document.addEventListener('panparagon:data-changed',e=>{if(e?.detail?.reason!=='main-render-fast')invalidate()});
  window.render=fastRender;window.buildReport=fastReport;window.PanParagonMainIndex={get:ensureBase,invalidate,version:()=>dataVersion};
})();