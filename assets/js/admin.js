/* global supabaseClient */
(function () {
  const mount = document.getElementById("adminApp");
  if (!mount) return;

  const toast = (title, msg) => {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      t.innerHTML = `<div class="toastTitle"></div><div class="toastMsg"></div>`;
      document.body.appendChild(t);
    }
    t.querySelector(".toastTitle").textContent = title;
    t.querySelector(".toastMsg").textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3600);
  };

  const state = {
    session: null,
    tab: "banner"
  };

  const tabs = [
    { key: "banner", label: "Announcement Banner" },
    { key: "inquiries", label: "Inquiries" },
    { key: "jobs", label: "Jobs" },
    { key: "applications", label: "Applications" },
    { key: "team", label: "Team (About)" }
  ];

  function html(strings, ...vals) {
    return strings.map((s, i) => s + (vals[i] ?? "")).join("");
  }

  function esc(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function getSession() {
    const { data } = await supabaseClient.auth.getSession();
    state.session = data.session || null;
    return state.session;
  }

  async function login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    state.session = data.session;
    toast("Signed in", "Welcome to the AquaSmart Admin Console.");
    render();
  }

  async function logout() {
    await supabaseClient.auth.signOut();
    state.session = null;
    render();
  }

  function setTab(key) {
    state.tab = key;
    render();
  }

  function sidebar() {
    return html`
      <div class="card sidebar">
        <div class="kicker">Admin Console</div>
        <div style="font-weight:800; margin-top:6px">AquaSmart</div>
        <div class="small">Managed by BlueWave Digital</div>
        <div class="hr"></div>
        ${tabs
          .map(
            (t) => html`
              <a href="#${t.key}" class="sideLink ${state.tab === t.key ? "active" : ""}" data-tab="${t.key}">
                <span>${t.label}</span>
                <span class="muted">›</span>
              </a>
            `
          )
          .join("")}
        <div class="hr"></div>
        <button class="btn btnGhost btnTiny" id="logoutBtn" type="button">Sign out</button>
      </div>
    `;
  }

  function loginView() {
    return html`
      <div class="section">
        <div class="container">
          <div class="card" style="padding:22px; border-radius:22px; max-width:520px; margin:0 auto">
            <div class="kicker">Secure access</div>
            <div class="h2" style="margin-top:8px">Admin login</div>
            <p class="p">Sign in using your staff email and password.</p>

            <form class="form" id="loginForm">
              <div class="field">
                <label>Email</label>
                <input name="email" type="email" required placeholder="staff@aquasmart.sc">
              </div>
              <div class="field">
                <label>Password</label>
                <input name="password" type="password" required placeholder="••••••••">
              </div>
              <button class="btn" type="submit" data-submit>Sign in</button>
            </form>

            <div class="small" style="margin-top:12px">
              If you can sign in but see empty data, your user UID likely isn’t linked in <code>staff_profiles</code>.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function bannerView() {
    const { data, error } = await supabaseClient
      .from("site_settings")
      .select("value")
      .eq("key", "announcement_banner")
      .single();
    if (error) throw error;

    const v = data.value || {};
    return html`
      <div class="card content">
        <div class="h2">Announcement Banner</div>
        <p class="p">This banner appears on the homepage and selected pages.</p>

        <form class="form" id="bannerForm">
          <div class="formRow">
            <div class="field">
              <label>Enabled</label>
              <select name="enabled">
                <option value="true" ${v.enabled ? "selected" : ""}>Yes</option>
                <option value="false" ${!v.enabled ? "selected" : ""}>No</option>
              </select>
            </div>
            <div class="field">
              <label>Style</label>
              <select name="style">
                <option value="info" ${v.style === "info" ? "selected" : ""}>Info</option>
                <option value="success" ${v.style === "success" ? "selected" : ""}>Success</option>
                <option value="warning" ${v.style === "warning" ? "selected" : ""}>Warning</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Text</label>
            <input name="text" value="${esc(v.text || "")}" required>
          </div>

          <div class="formRow">
            <div class="field">
              <label>Link Text</label>
              <input name="linkText" value="${esc(v.linkText || "")}">
            </div>
            <div class="field">
              <label>Link URL</label>
              <input name="linkUrl" value="${esc(v.linkUrl || "")}">
            </div>
          </div>

          <button class="btn" type="submit" data-submit>Save banner</button>
        </form>
      </div>
    `;
  }

  async function inquiriesView() {
    const { data, error } = await supabaseClient
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const rows = (data || []).map((r) => html`
      <tr>
        <td><span class="tag">${esc(r.status)}</span></td>
        <td>${esc(r.type)}</td>
        <td>${esc(r.full_name)}<div class="small">${esc(r.email)}</div></td>
        <td>${esc(r.island || "")}</td>
        <td>${esc(r.service || "")}</td>
        <td class="small">${esc(r.message)}</td>
        <td>
          <div class="split">
            <button class="btn btnGhost btnTiny" data-action="status" data-id="${r.id}" data-status="in_progress">In progress</button>
            <button class="btn btnGhost btnTiny" data-action="status" data-id="${r.id}" data-status="resolved">Resolved</button>
            <a class="btn btnTiny" href="mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent("AquaSmart: your enquiry")}" data-action="reply">Reply</a>
            <button class="btn btnGhost btnTiny" data-action="delete-inq" data-id="${r.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");

    return html`
      <div class="card content">
        <div class="h2">Inquiries</div>
        <p class="p">View and manage contact and quote submissions. “Reply” opens your email client.</p>

        <div style="overflow:auto">
          <table class="table">
            <thead>
              <tr>
                <th>Status</th><th>Type</th><th>Client</th><th>Island</th><th>Service</th><th>Message</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows || ""}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function jobsView() {
    const { data, error } = await supabaseClient
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const rows = (data || []).map((j) => html`
      <tr>
        <td>${esc(j.title)}</td>
        <td>${esc(j.location || "")}</td>
        <td>${esc(j.employment_type || "")}</td>
        <td><span class="tag">${j.is_active ? "active" : "hidden"}</span></td>
        <td class="small">${esc(j.description)}</td>
        <td>
          <div class="split">
            <button class="btn btnGhost btnTiny" data-action="toggle-job" data-id="${j.id}" data-active="${j.is_active ? "true" : "false"}">
              ${j.is_active ? "Hide" : "Publish"}
            </button>
            <button class="btn btnGhost btnTiny" data-action="delete-job" data-id="${j.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");

    return html`
      <div class="card content">
        <div class="h2">Jobs</div>
        <p class="p">Add, publish/hide, or delete open positions displayed on Careers.</p>

        <div class="panel" style="margin:12px 0">
          <form class="form" id="newJobForm">
            <div class="formRow">
              <div class="field"><label>Job title</label><input name="title" required></div>
              <div class="field"><label>Location</label><input name="location" placeholder="Seychelles"></div>
            </div>
            <div class="formRow">
              <div class="field">
                <label>Employment type</label>
                <select name="employment_type">
                  <option value="">Select…</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Volunteer</option>
                </select>
              </div>
              <div class="field">
                <label>Publish now?</label>
                <select name="is_active">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <div class="field"><label>Description</label><textarea name="description" required></textarea></div>
            <div class="field"><label>Requirements (optional)</label><textarea name="requirements"></textarea></div>
            <div class="field"><label>How to apply (optional)</label><textarea name="how_to_apply"></textarea></div>

            <button class="btn" type="submit" data-submit>Add job</button>
          </form>
        </div>

        <div style="overflow:auto">
          <table class="table">
            <thead>
              <tr>
                <th>Title</th><th>Location</th><th>Type</th><th>Status</th><th>Description</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows || ""}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function applicationsView() {
    const { data, error } = await supabaseClient
      .from("job_applications")
      .select("*, jobs(title)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;

    const rows = (data || []).map((a) => html`
      <tr>
        <td><span class="tag">${esc(a.status)}</span></td>
        <td>${esc(a.jobs?.title || "")}</td>
        <td>${esc(a.full_name)}<div class="small">${esc(a.email)}</div></td>
        <td><a class="bluewave" href="${esc(a.cv_link)}" target="_blank" rel="noopener">Open CV</a></td>
        <td class="small">${esc(a.note || "")}</td>
        <td>
          <div class="split">
            <button class="btn btnGhost btnTiny" data-action="app-status" data-id="${a.id}" data-status="reviewed">Reviewed</button>
            <button class="btn btnGhost btnTiny" data-action="app-status" data-id="${a.id}" data-status="shortlisted">Shortlist</button>
            <button class="btn btnGhost btnTiny" data-action="app-status" data-id="${a.id}" data-status="rejected">Reject</button>
            <a class="btn btnTiny" href="mailto:${encodeURIComponent(a.email)}?subject=${encodeURIComponent("AquaSmart Application")}" data-action="reply">Email</a>
            <button class="btn btnGhost btnTiny" data-action="delete-app" data-id="${a.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");

    return html`
      <div class="card content">
        <div class="h2">Applications</div>
        <p class="p">Review applications submitted through the Careers page. CVs are links (no uploads).</p>

        <div style="overflow:auto">
          <table class="table">
            <thead>
              <tr>
                <th>Status</th><th>Job</th><th>Candidate</th><th>CV link</th><th>Note</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows || ""}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function teamView() {
    // Note: current backend policies require staff access to read staff_profiles.
    const { data, error } = await supabaseClient
      .from("staff_profiles")
      .select("id,username,full_name,whatsapp,bio,photo_url,is_active,created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;

    const rows = (data || []).map((m) => html`
      <tr>
        <td>${esc(m.full_name)}</td>
        <td>${esc(m.username)}</td>
        <td>${esc(m.whatsapp || "")}</td>
        <td><span class="tag">${m.is_active ? "active" : "inactive"}</span></td>
        <td class="small">${esc(m.bio || "")}</td>
      </tr>
    `).join("");

    return html`
      <div class="card content">
        <div class="h2">Team (About page)</div>
        <p class="p">
          Team members are pulled from <code>staff_profiles</code>. If you want the About page to show this publicly,
          add a public team table or adjust policies (see <code>ADMIN_SETUP.md</code> in the zip).
        </p>

        <div style="overflow:auto">
          <table class="table">
            <thead>
              <tr><th>Name</th><th>Username</th><th>WhatsApp</th><th>Status</th><th>Bio</th></tr>
            </thead>
            <tbody>${rows || ""}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function contentView() {
    try {
      if (state.tab === "banner") return await bannerView();
      if (state.tab === "inquiries") return await inquiriesView();
      if (state.tab === "jobs") return await jobsView();
      if (state.tab === "applications") return await applicationsView();
      if (state.tab === "team") return await teamView();
      return `<div class="card content">Unknown tab.</div>`;
    } catch (e) {
      console.error(e);
      return `<div class="card content"><div class="h2">Error</div><p class="p">Unable to load this section. Ensure your user is linked in staff_profiles and policies are applied.</p></div>`;
    }
  }

  async function render() {
    const hash = (location.hash || "#banner").replace("#", "");
    if (tabs.some((t) => t.key === hash)) state.tab = hash;

    if (!state.session) {
      mount.innerHTML = loginView();
      const form = document.getElementById("loginForm");
      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = form.email.value.trim();
        const password = form.password.value;
        const btn = form.querySelector("[data-submit]");
        if (btn) btn.disabled = true;
        try {
          await login(email, password);
        } catch (err) {
          toast("Login failed", "Check your details and try again.");
        } finally {
          if (btn) btn.disabled = false;
        }
      });
      return;
    }

    const content = await contentView();
    mount.innerHTML = html`
      <div class="section">
        <div class="container adminShell">
          ${sidebar()}
          ${content}
        </div>
      </div>
    `;

    document.querySelectorAll("[data-tab]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const key = a.getAttribute("data-tab");
        location.hash = key;
        setTab(key);
      });
    });

    document.getElementById("logoutBtn")?.addEventListener("click", logout);

    // Banner save
    document.getElementById("bannerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const payload = {
        enabled: f.enabled.value === "true",
        text: f.text.value,
        linkText: f.linkText.value,
        linkUrl: f.linkUrl.value,
        style: f.style.value
      };
      const { error } = await supabaseClient
        .from("site_settings")
        .update({ value: payload, updated_at: new Date().toISOString() })
        .eq("key", "announcement_banner");
      if (error) return toast("Save failed", "Check permissions and try again.");
      toast("Saved", "Announcement banner updated.");
    });

    // New job
    document.getElementById("newJobForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const payload = {
        title: f.title.value,
        location: f.location.value || null,
        employment_type: f.employment_type.value || null,
        description: f.description.value,
        requirements: f.requirements.value || null,
        how_to_apply: f.how_to_apply.value || null,
        is_active: f.is_active.value === "true"
      };
      const { error } = await supabaseClient.from("jobs").insert(payload);
      if (error) return toast("Add failed", "Could not add job.");
      toast("Added", "Job created.");
      render();
    });

    // Table actions (inquiries/jobs/apps)
    mount.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        if (!id) return;

        if (action === "delete-inq") {
          if (!confirm("Delete this inquiry?")) return;
          const { error } = await supabaseClient.from("inquiries").delete().eq("id", id);
          if (error) return toast("Delete failed", "Could not delete.");
          toast("Deleted", "Inquiry removed.");
          render();
        }

        if (action === "status") {
          const status = btn.getAttribute("data-status");
          const { error } = await supabaseClient.from("inquiries").update({ status }).eq("id", id);
          if (error) return toast("Update failed", "Could not update status.");
          toast("Updated", "Status changed.");
          render();
        }

        if (action === "toggle-job") {
          const active = btn.getAttribute("data-active") === "true";
          const { error } = await supabaseClient.from("jobs").update({ is_active: !active }).eq("id", id);
          if (error) return toast("Update failed", "Could not update job.");
          toast("Updated", "Job visibility changed.");
          render();
        }

        if (action === "delete-job") {
          if (!confirm("Delete this job? Applications remain only if job is deleted (cascade).")) return;
          const { error } = await supabaseClient.from("jobs").delete().eq("id", id);
          if (error) return toast("Delete failed", "Could not delete job.");
          toast("Deleted", "Job removed.");
          render();
        }

        if (action === "app-status") {
          const status = btn.getAttribute("data-status");
          const { error } = await supabaseClient.from("job_applications").update({ status }).eq("id", id);
          if (error) return toast("Update failed", "Could not update application.");
          toast("Updated", "Application status changed.");
          render();
        }

        if (action === "delete-app") {
          if (!confirm("Delete this application?")) return;
          const { error } = await supabaseClient.from("job_applications").delete().eq("id", id);
          if (error) return toast("Delete failed", "Could not delete application.");
          toast("Deleted", "Application removed.");
          render();
        }
      });
    });
  }

  // Boot
  window.addEventListener("hashchange", () => render());
  (async () => {
    await getSession();
    // Keep session in sync
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      state.session = session;
      render();
    });
    render();
  })();
})();
