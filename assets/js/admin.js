(async function(){
  const cfg = window.AQUASMART || {};
  const $ = (s,r=document)=>r.querySelector(s);
  const supabase = window.__supabase || window.supabase?.createClient?.(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  const el = {
    status: $("#status"),
    loginForm: $("#loginForm"),
    logoutBtn: $("#logoutBtn"),
    email: $("#email"),
    password: $("#password"),
    panel: $("#adminPanel"),
    bannerText: $("#bannerTextInput"),
    bannerEnabled: $("#bannerEnabledInput"),
    bannerLinkText: $("#bannerLinkTextInput"),
    bannerLinkUrl: $("#bannerLinkUrlInput"),
    bannerSave: $("#bannerSaveBtn"),
    inquiriesBody: $("#inquiriesBody"),
    jobsBody: $("#jobsBody"),
    appsBody: $("#appsBody"),
    jobTitle: $("#jobTitle"),
    jobLocation: $("#jobLocation"),
    jobType: $("#jobType"),
    jobDesc: $("#jobDesc"),
    jobReq: $("#jobReq"),
    jobApply: $("#jobApply"),
    jobActive: $("#jobActive"),
    jobCreate: $("#jobCreateBtn")
  };

  const setStatus = (m,t="") => { if(!el.status) return; el.status.className="notice "+t; el.status.textContent=m; };

  async function requireSession(){
    const { data } = await supabase.auth.getSession();
    if(data?.session){
      el.panel?.classList.remove("hide");
      el.logoutBtn?.classList.remove("hide");
      el.loginForm?.classList.add("hide");
      setStatus("Signed in. Admin Console is ready.","ok");
      await loadAll(); return true;
    }
    el.panel?.classList.add("hide");
    el.logoutBtn?.classList.add("hide");
    el.loginForm?.classList.remove("hide");
    setStatus("Please sign in with your staff email and password.","");
    return false;
  }

  async function loadBanner(){
    const { data, error } = await supabase.from("site_settings").select("value").eq("key","announcement_banner").maybeSingle();
    if(error){ setStatus("Banner load failed: "+error.message,"warn"); return; }
    const v = data?.value || {};
    if(el.bannerText) el.bannerText.value = v.text || "";
    if(el.bannerEnabled) el.bannerEnabled.checked = (v.enabled !== false);
    if(el.bannerLinkText) el.bannerLinkText.value = v.linkText || "";
    if(el.bannerLinkUrl) el.bannerLinkUrl.value = v.linkUrl || "";
  }

  async function saveBanner(){
    const value = { enabled: !!el.bannerEnabled?.checked, text:(el.bannerText?.value||"").trim(), linkText:(el.bannerLinkText?.value||"").trim(), linkUrl:(el.bannerLinkUrl?.value||"").trim(), style:"info" };
    const { error } = await supabase.from("site_settings").update({ value, updated_at:new Date().toISOString() }).eq("key","announcement_banner");
    if(error){ setStatus("Banner save failed: "+error.message,"err"); return; }
    setStatus("Announcement banner saved.","ok");
  }

  async function loadInquiries(){
    const { data, error } = await supabase.from("inquiries").select("*").order("created_at",{ascending:false}).limit(200);
    if(error){ setStatus("Inquiries load failed: "+error.message,"err"); return; }
    el.inquiriesBody.innerHTML = (data||[]).map(r=>`
      <tr>
        <td>${new Date(r.created_at).toLocaleString()}</td>
        <td>${(r.type||"").toUpperCase()}</td>
        <td>${eh(r.full_name)}<br><span class="muted">${eh(r.island||"")}</span></td>
        <td><a href="mailto:${ea(r.email)}">${eh(r.email)}</a><br><span class="muted">${eh(r.phone||"")}</span></td>
        <td>${eh(r.service||"")}</td>
        <td>${eh(r.status||"new")}</td>
        <td style="white-space:nowrap;">
          <button class="btn ghost" data-act="status" data-id="${r.id}" data-next="in_progress">In progress</button>
          <button class="btn ghost" data-act="status" data-id="${r.id}" data-next="resolved">Resolved</button>
          <button class="btn ghost" data-act="del" data-id="${r.id}">Delete</button>
        </td>
      </tr>`).join("");
  }

  async function loadJobs(){
    const { data, error } = await supabase.from("jobs").select("*").order("created_at",{ascending:false}).limit(200);
    if(error){ setStatus("Jobs load failed: "+error.message,"err"); return; }
    el.jobsBody.innerHTML = (data||[]).map(j=>`
      <tr>
        <td>${new Date(j.created_at).toLocaleDateString()}</td>
        <td>${eh(j.title)}</td>
        <td>${eh(j.location||"")}</td>
        <td>${eh(j.employment_type||"")}</td>
        <td>${j.is_active?'<span class="notice ok" style="display:inline-block;padding:6px 8px;">Active</span>':'<span class="notice" style="display:inline-block;padding:6px 8px;">Hidden</span>'}</td>
        <td style="white-space:nowrap;">
          <button class="btn ghost" data-act="toggle" data-id="${j.id}" data-active="${j.is_active?0:1}">${j.is_active?"Hide":"Publish"}</button>
          <button class="btn ghost" data-act="deljob" data-id="${j.id}">Delete</button>
        </td>
      </tr>`).join("");
  }

  async function loadApps(){
    const { data, error } = await supabase.from("job_applications").select("*, jobs(title)").order("created_at",{ascending:false}).limit(200);
    if(error){ setStatus("Applications load failed: "+error.message,"err"); return; }
    el.appsBody.innerHTML = (data||[]).map(a=>`
      <tr>
        <td>${new Date(a.created_at).toLocaleString()}</td>
        <td>${eh(a.jobs?.title||"")}</td>
        <td>${eh(a.full_name)}</td>
        <td><a href="mailto:${ea(a.email)}">${eh(a.email)}</a><br><span class="muted">${eh(a.phone||"")}</span></td>
        <td><a href="${ea(a.cv_link||"#")}" target="_blank" rel="noopener">Open CV Link</a></td>
        <td>${eh(a.status||"new")}</td>
        <td style="white-space:nowrap;">
          <button class="btn ghost" data-act="appstatus" data-id="${a.id}" data-next="reviewed">Reviewed</button>
          <button class="btn ghost" data-act="appstatus" data-id="${a.id}" data-next="shortlisted">Shortlist</button>
          <button class="btn ghost" data-act="appdel" data-id="${a.id}">Delete</button>
        </td>
      </tr>`).join("");
  }

  async function loadAll(){ await loadBanner(); await loadInquiries(); await loadJobs(); await loadApps(); }

  document.addEventListener("click", async (e)=>{
    const b = e.target.closest("button[data-act]"); if(!b) return;
    try{
      if(b.dataset.act==="del"){ await supabase.from("inquiries").delete().eq("id", b.dataset.id); await loadInquiries(); setStatus("Inquiry deleted.","ok"); }
      if(b.dataset.act==="status"){ await supabase.from("inquiries").update({status:b.dataset.next}).eq("id", b.dataset.id); await loadInquiries(); setStatus("Inquiry updated.","ok"); }
      if(b.dataset.act==="toggle"){ await supabase.from("jobs").update({is_active: b.dataset.active==="1"}).eq("id", b.dataset.id); await loadJobs(); setStatus("Job updated.","ok"); }
      if(b.dataset.act==="deljob"){ await supabase.from("jobs").delete().eq("id", b.dataset.id); await loadJobs(); setStatus("Job deleted.","ok"); }
      if(b.dataset.act==="appstatus"){ await supabase.from("job_applications").update({status:b.dataset.next}).eq("id", b.dataset.id); await loadApps(); setStatus("Application updated.","ok"); }
      if(b.dataset.act==="appdel"){ await supabase.from("job_applications").delete().eq("id", b.dataset.id); await loadApps(); setStatus("Application deleted.","ok"); }
    }catch(err){ setStatus("Action failed: "+(err?.message||err),"err"); }
  });

  el.bannerSave?.addEventListener("click", saveBanner);

  el.jobCreate?.addEventListener("click", async ()=>{
    try{
      const payload = { title:(el.jobTitle?.value||"").trim(), location:(el.jobLocation?.value||"").trim(), employment_type:(el.jobType?.value||"").trim(), description:(el.jobDesc?.value||"").trim(), requirements:(el.jobReq?.value||"").trim(), how_to_apply:(el.jobApply?.value||"").trim(), is_active: !!el.jobActive?.checked };
      if(!payload.title || !payload.description){ setStatus("Job title and description are required.","warn"); return; }
      const { error } = await supabase.from("jobs").insert(payload);
      if(error) throw error;
      setStatus("Job created.","ok");
      el.jobTitle.value=""; el.jobLocation.value=""; el.jobType.value=""; el.jobDesc.value=""; el.jobReq.value=""; el.jobApply.value=""; el.jobActive.checked=true;
      await loadJobs();
    }catch(err){ setStatus("Create failed: "+(err?.message||err),"err"); }
  });

  el.loginForm?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    try{
      setStatus("Signing in…","");
      const email = (el.email?.value||"").trim();
      const password = (el.password?.value||"");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if(error) throw error;
      await requireSession();
    }catch(err){ setStatus("Login failed: "+(err?.message||err),"err"); }
  });

  el.logoutBtn?.addEventListener("click", async ()=>{ await supabase.auth.signOut(); await requireSession(); });

  await requireSession();

  function eh(s){ return String(s||"").replace(/[&<>"]/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));}
  function ea(s){ return String(s||"").replace(/"/g,"&quot;");}
})();
