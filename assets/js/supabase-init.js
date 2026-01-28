/* global supabase */
(function() {
  const cfg = window.AQUASMART_CONFIG;
  if (!cfg) {
    console.error("Missing AQUASMART_CONFIG");
    return;
  }
  window.supabaseClient = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
})();
