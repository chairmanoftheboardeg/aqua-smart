(function () {
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");

  const withCacheBust = (url) => `${url}?v=${encodeURIComponent("1.0.0")}`;

  async function injectPartials() {
    try {
      if (headerMount) {
        const res = await fetch(withCacheBust("/partials/header.html"));
        headerMount.innerHTML = await res.text();
      }
      if (footerMount) {
        const res = await fetch(withCacheBust("/partials/footer.html"));
        footerMount.innerHTML = await res.text();
      }
      afterInject();
    } catch (e) {
      console.warn("Partial injection failed", e);
    }
  }

  function afterInject() {
    // Year
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    // Active link
    const path = location.pathname.replace(/\/+$/, "/");
    document.querySelectorAll(".navLink, .mobileLink").forEach((a) => {
      if (a.getAttribute("href") === path) a.classList.add("active");
    });

    // Dropdowns
    document.querySelectorAll("[data-dropdown]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const key = btn.getAttribute("data-dropdown");
        const group = btn.closest(".navGroup");
        const isOpen = group.classList.contains("open");

        document.querySelectorAll(".navGroup.open").forEach((g) => g.classList.remove("open"));
        if (!isOpen) group.classList.add("open");

        // close on outside click
        const onDoc = (ev) => {
          if (!group.contains(ev.target)) {
            group.classList.remove("open");
            document.removeEventListener("click", onDoc);
          }
        };
        document.addEventListener("click", onDoc);
      });
    });

    // Burger
    const burger = document.querySelector(".burger");
    const mobileMenu = document.getElementById("mobileMenu");
    if (burger && mobileMenu) {
      burger.addEventListener("click", () => {
        const open = burger.getAttribute("aria-expanded") === "true";
        burger.setAttribute("aria-expanded", String(!open));
        mobileMenu.hidden = open;
      });
    }

    // Scroll progress
    const fill = document.querySelector(".progressBarFill");
    if (fill) {
      const onScroll = () => {
        const h = document.documentElement;
        const sc = h.scrollTop || document.body.scrollTop;
        const max = (h.scrollHeight - h.clientHeight) || 1;
        fill.style.width = `${Math.min(100, Math.max(0, (sc / max) * 100))}%`;
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  function revealOnScroll() {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("show");
            obs.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => obs.observe(el));
  }

  function loader() {
    const el = document.getElementById("loader");
    if (!el) return;

    const hide = () => el.classList.add("hidden");
    window.addEventListener("load", () => setTimeout(hide, 280));
  }

  // Boot
  injectPartials().finally(() => {
    revealOnScroll();
    loader();
  });
})();
