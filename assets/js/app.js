(async function(){
  const cfg = window.AQUASMART || {};
  const $ = (s,r=document)=>r.querySelector(s);

  async function inject(part, intoId){
    const host = document.getElementById(intoId);
    if(!host) return;
    const res = await fetch(`/partials/${part}.html`, {cache:"no-store"});
    host.innerHTML = await res.text();
  }
  await inject("header","siteHeader");
  await inject("footer","siteFooter");

  const logo = $("#navLogo"); if(logo) logo.src = cfg.LOGO_URL || "";
  const bn = $("#navBrand"); if(bn) bn.textContent = cfg.BRAND_NAME || "AquaSmart";
  const sl = $("#navSlogan"); if(sl) sl.textContent = cfg.SLOGAN || "Smart Solutions For A Better Home";
  const wa = $("#whatsappBtn"); if(wa) wa.href = cfg.WHATSAPP_LINK || "https://linktr.ee/aquasmart.sc";

  const drawer = $("#drawer"), burger = $("#burgerBtn"), close = $("#drawerClose");
  if(burger && drawer){ burger.addEventListener("click", ()=>drawer.classList.add("open")); drawer.addEventListener("click",(e)=>{ if(e.target===drawer) drawer.classList.remove("open"); });}
  if(close && drawer){ close.addEventListener("click", ()=>drawer.classList.remove("open")); }

  const year = $("#year"); if(year) year.textContent = String(new Date().getFullYear());

  const supabase = window.supabase?.createClient?.(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  window.__supabase = supabase;

  async function loadBanner(){
    const banner = $("#topBanner"); if(!banner) return;
    let enabled = true, text="", linkText="", linkUrl="", style="info";
    try{
      if(supabase){
        const { data, error } = await supabase.from("site_settings").select("value").eq("key","announcement_banner").maybeSingle();
        if(!error && data?.value){
          enabled = (data.value.enabled !== false);
          text = (data.value.text||"").trim();
          linkText = (data.value.linkText||"").trim();
          linkUrl = (data.value.linkUrl||"").trim();
          style = (data.value.style||"info").trim();
        }
      }
    }catch(_){}
    if(!enabled){ banner.classList.add("hidden"); return; }

    const t = $("#bannerText"); if(t) t.textContent = (text && text.length) ? text : " ";
    const l = $("#bannerLink");
    if(l){
      if(linkText && linkUrl){ l.textContent=linkText; l.href=linkUrl; l.style.display="inline-flex"; }
      else l.style.display="none";
    }
    if(!text && t) t.innerHTML = '<span class="muted"> </span>';
    banner.style.background = style==="warn" ? "linear-gradient(90deg, rgba(245,158,11,.22), rgba(56,189,248,.12))"
      : style==="ok" ? "linear-gradient(90deg, rgba(34,197,94,.22), rgba(56,189,248,.12))"
      : "linear-gradient(90deg, rgba(56,189,248,.22), rgba(34,197,94,.18))";
  }
  await loadBanner();

  window.AquaSmartAPI = {
    supabase,
    async submitInquiry(payload){
      if(!supabase) throw new Error("Supabase not loaded");
      const { error } = await supabase.from("inquiries").insert(payload);
      if(error) throw error;
    },
    async fetchActiveJobs(){
      if(!supabase) throw new Error("Supabase not loaded");
      const { data, error } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at",{ascending:false});
      if(error) throw error;
      return data || [];
    },
    async submitApplication(payload){
      if(!supabase) throw new Error("Supabase not loaded");
      const { error } = await supabase.from("job_applications").insert(payload);
      if(error) throw error;
    }
  };

  // Dropdown menus (desktop)
  function setupDropdowns(){
    const dds = Array.from(document.querySelectorAll(".dd"));
    if(!dds.length) return;
    const closeAll = ()=> dds.forEach(d=>d.classList.remove("open"));
    dds.forEach(d=>{
      const btn = d.querySelector(".dd-toggle");
      if(!btn) return;
      btn.addEventListener("click",(e)=>{
        e.preventDefault();
        const isOpen = d.classList.contains("open");
        closeAll();
        if(!isOpen) d.classList.add("open");
      });
    });
    document.addEventListener("click",(e)=>{
      if(!e.target.closest(".dd")) closeAll();
    });
    document.addEventListener("keydown",(e)=>{
      if(e.key==="Escape") closeAll();
    });
  }
  setupDropdowns();

})();
