(function(){
  function mergeImportedFile(f){
    if(!f) return;
    const fn=document.getElementById('fn');
    if(fn) fn.textContent=f.name;
    const reader=new FileReader();
    reader.onload=()=>{
      const parsed=parseCSV(reader.result);
      const incoming=parsed.rs||[];
      const previous=Array.isArray(rows)?rows:[];

      if(!headers.length) headers=parsed.h||[];
      else {
        const union=[...headers];
        (parsed.h||[]).forEach(h=>{ if(!union.includes(h)) union.push(h); });
        headers=union;
      }

      const keyOf=row=>JSON.stringify(Object.keys(row).sort().reduce((o,k)=>{o[k]=String(row[k]??'').trim();return o;},{}));
      const seen=new Set(previous.map(keyOf));
      let added=0, duplicates=0;
      for(const row of incoming){
        const k=keyOf(row);
        if(seen.has(k)){ duplicates++; continue; }
        seen.add(k);
        previous.push(row);
        added++;
      }
      rows=previous;
      guess();
      render();
      if(fn) fn.textContent=`${f.name} — dodano ${added}, pominięto duplikaty: ${duplicates}. Łącznie rekordów: ${rows.length}`;
    };
    reader.readAsText(f,'utf-8');
  }

  load=mergeImportedFile;
  const f1=document.getElementById('file');
  const f2=document.getElementById('file2');
  if(f1) f1.onchange=e=>mergeImportedFile(e.target.files[0]);
  if(f2) f2.onchange=e=>mergeImportedFile(e.target.files[0]);
})();
