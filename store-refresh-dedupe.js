(()=>{
  // Compatibility marker only.
  // store-fast-refresh v6 already deduplicates detail/all aggregation and can
  // reuse PanParagonStoreClickFast prewarmed stats. The old wrapper used to
  // replace refreshStore and synchronously regroup every row of a store,
  // defeating that fast path on each click.
  window.PanParagonStoreRefreshDedupe={active:false,handledBy:'store-fast-refresh-v6'};
})();
