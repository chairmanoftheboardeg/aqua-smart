/* global supabaseClient */
(function () {
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

  async function loadAnnouncement() {
    const mount = document.getElementById("announcement");
    if (!mount) return;

    try {
      const { data, error } = await supabaseClient
        .from("site_settings")
        .select("value")
        .eq("key", "announcement_banner")
        .single();

      if (error) throw error;

      const v = data?.value || {};
      if (!v.enabled) return;

      mount.hidden = false;
      mount.querySelector("[data-text]").textContent = v.text || "";
      const a = mount.querySelector("[data-link]");
      a.textContent = v.linkText || "Learn more";
      a.href = v.linkUrl || "/";

      // Style chip
      mount.dataset.style = v.style || "info";
    } catch (e) {
      // Fail silently
      console.warn("Announcement load failed", e);
    }
  }

  async function submitInquiry(form) {
    const btn = form.querySelector("[data-submit]");
    if (btn) btn.disabled = true;

    const payload = {
      type: form.dataset.type || "general",
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone?.value?.trim() || null,
      island: form.island?.value || null,
      service: form.service?.value || null,
      message: form.message.value.trim()
    };

    try {
      const { error } = await supabaseClient.from("inquiries").insert(payload);
      if (error) throw error;

      form.reset();
      toast("Submitted", "Thanks. An AquaSmart team member will respond by email.");
    } catch (e) {
      console.error(e);
      toast("Couldn’t submit", "Please try again or contact us via WhatsApp.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function wireInquiryForms() {
    document.querySelectorAll("form[data-inquiry]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        submitInquiry(form);
      });
    });
  }

  async function loadJobs() {
    const mount = document.getElementById("jobsList");
    if (!mount) return;

    mount.innerHTML = `<div class="muted">Loading open positions…</div>`;
    const { data, error } = await supabaseClient
      .from("jobs")
      .select("id,title,location,employment_type,description,requirements,is_active,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      mount.innerHTML = `<div class="muted">Unable to load jobs right now.</div>`;
      return;
    }

    if (!data?.length) {
      mount.innerHTML = `<div class="panel">No open positions at the moment. Please check back soon.</div>`;
      return;
    }

    mount.innerHTML = data
      .map(
        (j) => `
      <div class="serviceCard reveal">
        <div class="serviceTitle">${escapeHtml(j.title)}</div>
        <div class="serviceMeta">${escapeHtml([j.location, j.employment_type].filter(Boolean).join(" • "))}</div>
        <div class="hr"></div>
        <div class="p">${escapeHtml(shorten(j.description, 220))}</div>
        <div class="split" style="margin-top:12px">
          <a class="btn btnGhost btnTiny" href="/careers/#apply" data-job="${j.id}" data-job-title="${escapeHtmlAttr(j.title)}">Apply</a>
          <a class="btn btnTiny" href="/careers/#jobs">View details</a>
        </div>
      </div>
    `
      )
      .join("");

    // Trigger reveal observer again (layout.js only runs once)
    document.querySelectorAll("#jobsList .reveal").forEach((el) => el.classList.add("show"));
  }

  async function submitJobApplication(form) {
    const btn = form.querySelector("[data-submit]");
    if (btn) btn.disabled = true;

    const jobId = form.job_id.value;
    const payload = {
      job_id: jobId,
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone?.value?.trim() || null,
      cv_link: form.cv_link.value.trim(),
      note: form.note?.value?.trim() || null
    };

    try {
      const { error } = await supabaseClient.from("job_applications").insert(payload);
      if (error) throw error;

      form.reset();
      toast("Application sent", "Thanks. If shortlisted, we’ll contact you by email.");
    } catch (e) {
      console.error(e);
      toast("Couldn’t submit", "Please check your CV link and try again.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function wireJobApply() {
    const form = document.querySelector("form[data-job-apply]");
    if (!form) return;

    // If user clicked apply on a specific job
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-job]");
      if (!a) return;
      const id = a.getAttribute("data-job");
      const title = a.getAttribute("data-job-title");
      const sel = form.querySelector("select[name='job_id']");
      if (sel) sel.value = id;
      const hint = document.getElementById("jobHint");
      if (hint) hint.textContent = title ? `Applying for: ${title}` : "";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitJobApplication(form);
    });
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function escapeHtmlAttr(str) {
    return escapeHtml(str).replaceAll("`", "");
  }
  function shorten(str, n) {
    const s = String(str ?? "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function wireHomeSelector() {
    const root = document.getElementById("problemSelector");
    if (!root) return;

    const cards = root.querySelectorAll("[data-problem]");
    const outTitle = document.getElementById("recTitle");
    const outText = document.getElementById("recText");
    const outLink = document.getElementById("recLink");

    const map = {
      taste: { title: "Filtration system installation", text: "Improve drinking water taste and clarity with a properly sized filtration setup.", link: "/services/#filtration" },
      chlorine: { title: "Chlorine removal (keeps essential minerals)", text: "Ideal for sensitive skin: reduce chlorine while keeping beneficial minerals.", link: "/services/#chlorine" },
      unknown: { title: "Private laboratory water testing", text: "When quality is uncertain, testing gives facts before you invest in equipment.", link: "/water-testing/" },
      pressure: { title: "Automatic backwash systems", text: "Keep flow consistent and reduce manual maintenance with an automatic backwash setup.", link: "/services/#backwash" },
      garden: { title: "Garden irrigation solutions", text: "Efficient irrigation tailored to your garden layout, water source and usage patterns.", link: "/services/#irrigation" },
      source: { title: "Water source detection & connection", text: "Locate, assess and connect water sources with a safe, professional approach.", link: "/services/#source" }
    };

    function select(key) {
      cards.forEach((c) => c.classList.toggle("active", c.dataset.problem === key));
      const r = map[key] || map.taste;
      outTitle.textContent = r.title;
      outText.textContent = r.text;
      outLink.href = r.link;
    }

    cards.forEach((c) => c.addEventListener("click", () => select(c.dataset.problem)));
    select(cards[0]?.dataset.problem || "taste");
  }

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.supabaseClient) return;
    loadAnnouncement();
    wireInquiryForms();
    loadJobs();
    wireJobApply();
    wireHomeSelector();
  });
})();
