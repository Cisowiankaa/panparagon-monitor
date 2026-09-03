(()=>{
  const base=document.dispatchEvent.bind(document);
  document.dispatchEvent=function(event){
    try{
      if(event?.type==='panparagon:data-changed'&&event.detail?.reason==='main-render-fast'&&!event.detail.source){
        event.detail.source='main-render-fast';
      }
    }catch{}
    return base(event);
  };
})();
