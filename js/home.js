/* Loud! OOH homepage. Content is complete without this file; it only adds
   motion, the format exhibition, sharing, analytics events and the budget preview. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const desktop = matchMedia("(min-width: 901px)");
  const toggle = document.querySelector(".motion-toggle");
  let paused = false;
  try { paused = sessionStorage.getItem("loud-motion-paused") === "true"; } catch (_) {}

  const motionAllowed = () => !paused && !reduced.matches;
  function applyMotion() {
    root.classList.toggle("motion-off", !motionAllowed());
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", String(!motionAllowed()));
    toggle.textContent = motionAllowed() ? "Pause motion" : "Play motion";
    toggle.disabled = reduced.matches;
    toggle.title = reduced.matches ? "Reduced motion is on in your device settings" : "";
  }
  toggle?.addEventListener("click", () => {
    paused = !paused;
    try { sessionStorage.setItem("loud-motion-paused", String(paused)); } catch (_) {}
    applyMotion();
  });
  reduced.addEventListener("change", applyMotion);
  applyMotion();

  /* Scroll reveals. Everything is revealed after 4s in case observers never fire. */
  const revealables = document.querySelectorAll("[data-reveal], .finale, .step");
  const reveal = (el) => el.classList.add("is-in");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach(reveal);
  }
  addEventListener("load", () => setTimeout(() => {
    document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) reveal(el);
    });
  }, 4000));

  /* Format exhibition: hovering, focusing or tapping a format brings its environment on stage. */
  const items = [...document.querySelectorAll(".exhibit-item")];
  function activate(item) {
    if (!desktop.matches || item.classList.contains("is-active")) return;
    items.forEach((i) => i.classList.toggle("is-active", i === item));
  }
  items.forEach((item) => {
    item.addEventListener("pointerenter", () => activate(item));
    item.addEventListener("focusin", () => activate(item));
  });

  /* Hero loop: real Loud! placements crossfade behind the headline. Added after load
     so they never compete with the first paint; paused with the motion toggle. */
  const slideHost = document.querySelector(".hero-bg[data-slides]");
  if (slideHost) {
    addEventListener("load", () => {
      slideHost.dataset.slides.split(",").forEach((src) => {
        const img = new Image();
        img.src = src; img.alt = ""; img.className = "hero-slide"; img.decoding = "async";
        slideHost.append(img);
      });
      const slides = slideHost.querySelectorAll(".hero-slide");
      let current = 0;
      setInterval(() => {
        if (!motionAllowed() || document.hidden) return;
        slides[current].classList.remove("is-on");
        current = (current + 1) % slides.length;
        slides[current].classList.add("is-on");
      }, 6500);
    });
  }

  /* Hero depth: the city drifts against the pointer. */
  const heroBg = document.querySelector(".hero-bg");
  const hero = document.querySelector(".hero");
  if (hero && heroBg) {
    let frame = 0;
    hero.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || !motionAllowed() || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const x = (event.clientX / innerWidth - 0.5) * -24;
        const y = (event.clientY / innerHeight - 0.5) * -16;
        heroBg.style.translate = `${x}px ${y}px`;
      });
    });
    hero.addEventListener("pointerleave", () => { heroBg.style.translate = ""; });
  }

  /* Magnetic CTAs, kept subtle and pointer-only. */
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || !motionAllowed()) return;
      const box = button.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * 0.18;
      const y = (event.clientY - box.top - box.height / 2) * 0.28;
      button.style.translate = `${x}px ${y}px`;
    });
    button.addEventListener("pointerleave", () => { button.style.translate = ""; });
  });

  /* Process timeline fills as the steps pass the middle of the screen. */
  const steps = document.querySelector(".steps");
  let ticking = false;
  function updateProgress() {
    ticking = false;
    if (!steps) return;
    const box = steps.getBoundingClientRect();
    const progress = (innerHeight * 0.6 - box.top) / box.height;
    steps.style.setProperty("--progress", Math.max(0, Math.min(1, progress)).toFixed(3));
  }
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* Analytics: only pushes when the host page provides a dataLayer (GTM). */
  const track = (payload) => {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ page_path: location.pathname, ...payload });
  };
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-lo-track]");
    if (!link) return;
    track({ event: "loud_cta_click", cta_id: link.dataset.loTrack, cta_text: link.textContent.trim(), destination: link.getAttribute("href") });
  });

  /* Shareable campaigns: native share sheet where available, otherwise copy the link. */
  const toast = document.querySelector(".toast");
  let toastTimer;
  const say = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2400);
  };
  document.querySelectorAll(".share").forEach((button) => {
    button.addEventListener("click", async () => {
      const url = button.dataset.share;
      const title = button.dataset.shareTitle;
      track({ event: "loud_campaign_share", destination: url });
      try {
        if (navigator.share && !finePointer.matches) { await navigator.share({ title, url }); return; }
        await navigator.clipboard.writeText(url);
        say("Link copied. Share it with your team.");
      } catch (_) {
        say(url);
      }
    });
  });

  /* Budget preview: uses the Budget Lab's own benchmark file. No invented rates. */
  const slider = document.getElementById("campaign-budget");
  const region = document.getElementById("campaign-region");
  const output = document.getElementById("budget-output");
  const results = document.getElementById("budget-results");
  if (!slider || !region || !output || !results) return;
  const money = (value) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
  const formatSpecs = [
    { category: "Roadside", format: "Static 48-Sheet", title: "Static billboards", unit: "panels" },
    { category: "Roadside", format: "Digital 48-Sheet", title: "Digital billboards", unit: "screens" },
    { category: "Bus", format: "Superside", title: "Bus supersides", unit: "buses" },
  ];
  let rates;
  function renderBudget() {
    const budget = Number(slider.value);
    output.value = money(budget);
    slider.setAttribute("aria-valuetext", money(budget));
    const discuss = document.getElementById("budget-discuss");
    if (discuss) {
      discuss.href = "mailto:hello@loudooh.co.uk?subject=" +
        encodeURIComponent(`OOH campaign: ${money(budget)} media budget`) + "&body=" +
        encodeURIComponent(`Hello Loud! OOH,\n\nI would like to explore a campaign with a ${money(budget)} media budget in ${region.options[region.selectedIndex].text}.\n\nMy audience:\nMy preferred dates:\nMy campaign goal:\n`);
    }
    if (!rates) return;
    results.replaceChildren();
    for (const spec of formatSpecs) {
      const row = rates.find((r) => r.Category === spec.category && r.Format === spec.format && r["Market/Region"] === region.value);
      const typical = Number(row?.["Planning Typical £"]);
      if (!row || !Number.isFinite(typical) || typical <= 0) continue;
      const item = document.createElement("div");
      item.className = "budget-result";
      const title = document.createElement("p");
      title.className = "result-title";
      title.textContent = spec.title;
      const basis = document.createElement("p");
      basis.textContent = `${money(typical)} ${row["Buying Unit"]} · typical`;
      const number = document.createElement("strong");
      number.textContent = `≈ ${Math.floor(budget / typical)}`;
      const label = document.createElement("small");
      label.textContent = `${spec.unit} / 2 weeks`;
      number.append(label);
      item.append(title, basis, number);
      results.append(item);
    }
  }
  slider.addEventListener("input", renderBudget);
  region.addEventListener("change", renderBudget);
  renderBudget();
  const loading = document.createElement("p");
  loading.className = "budget-placeholder";
  loading.textContent = "Loading planning benchmarks…";
  results.replaceChildren(loading);
  results.setAttribute("aria-busy", "true");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  fetch("/budget-lab/data/master-data-v1.json", { signal: controller.signal })
    .then((response) => { if (!response.ok) throw new Error("Rates unavailable"); return response.json(); })
    .then((data) => {
      rates = data["Format Rate Benchmarks"];
      const complete = Array.isArray(rates) && formatSpecs.every((spec) => ["Regional", "London"].every((place) =>
        rates.some((r) => r.Category === spec.category && r.Format === spec.format && r["Market/Region"] === place && Number(r["Planning Typical £"]) > 0)));
      if (!complete) throw new Error("Incomplete rates");
      renderBudget();
    })
    .catch(() => {
      rates = null;
      const error = document.createElement("p");
      error.className = "budget-error";
      error.textContent = "We couldn’t load the estimates. You can still read our published rate cards or talk to the team about your budget.";
      const link = document.createElement("a");
      link.href = "/insights/pricing/";
      link.className = "link-arrow";
      link.textContent = "View published rates ↗";
      results.replaceChildren(error, link);
    })
    .finally(() => { clearTimeout(timeout); results.removeAttribute("aria-busy"); });
})();
