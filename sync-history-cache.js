(()=>{
  if(typeof loadHistory!=='function')return;
  let lastFingerprint='';
  const makeFingerprint=a=>JSON.stringify((a||[]).map(x=>[x.device_id,x.direction,x.added_count,x.total_count,x.status,x.created_at]));
  const renderRows=a=>a.length?a.map(x=>`<div class="row"><div><b>${esc(x.device_id)}</b><div class="small">${new Date(x.created_at).toLocaleString('pl-PL')} · ${esc(x.direction)}</div></div><div style="text-align:right"><span class="${x.status==='ok'?'oktxt':'badtxt'}">${x.status==='ok'?'Sukces':'Błąd'}</span><div class="small">${x.total_count} rekordów${x.added_count?` · +${x.added_count}`:''}</div></div></div>`).join(''):'<div class="empty">Brak historii.</div>';
  loadHistory=async function(){
    const box=document.getElementById('syncHistory');
    if(!box)return;
    if(!user){
      const html='<div class="empty">Zaloguj się, aby zobaczyć historię.</div>';
      if(box.innerHTML!==html)box.innerHTML=html;
      lastFingerprint='';
      return;
    }
    const s=getSession();
    try{
      const r=await fetch(SUPABASE_URL+`/rest/v1/panparagon_sync_log?select=device_id,direction,added_count,total_count,status,created_at&user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc&limit=8`,{headers:authHeaders(s.access_token)});
      if(!r.ok)throw new Error(String(r.status));
      const a=await r.json(),fingerprint=makeFingerprint(a);
      if(fingerprint===lastFingerprint)return;
      lastFingerprint=fingerprint;
      box.innerHTML=renderRows(a);
    }catch(e){
      const text='Nie udało się pobrać historii: '+e.message;
      if(box.textContent!==text)box.textContent=text;
      lastFingerprint='';
    }
  };
  window.PanParagonHistoryCache={invalidate:()=>{lastFingerprint=''}};
})();
