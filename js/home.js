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
  let stackReady = false;
  try { paused = sessionStorage.getItem("loud-motion-paused") === "true"; } catch (_) {}

  const motionAllowed = () => !paused && !reduced.matches;
  function applyMotion() {
    root.classList.toggle("motion-off", !motionAllowed());
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", String(!motionAllowed()));
    toggle.textContent = motionAllowed() ? "Pause motion" : "Play motion";
    if (typeof updateStack === "function") updateStack();
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

  /* The shared header is injected at the top of <body>; keep "Skip to content" the first tab stop. */
  const skip = document.querySelector(".skip-link");
  const keepSkipFirst = () => { if (skip && document.body.firstElementChild !== skip) document.body.prepend(skip); };
  keepSkipFirst();
  document.addEventListener("DOMContentLoaded", keepSkipFirst);
  addEventListener("load", keepSkipFirst);

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
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach(reveal);
  }
  addEventListener("load", () => setTimeout(() => {
    document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) reveal(el);
    });
  }, 4000));

  /* Sticky card stack under the manifesto. The front card opens its detail;
     the card underneath eases back as the next one covers it. */
  const stackCards = [...document.querySelectorAll(".card-stack > .stack-card")];
  function updateStack() {
    if (!stackReady || !stackCards.length) return;
    const pin = innerWidth <= 900 ? 76 : 88;
    const still = !motionAllowed();
    stackCards.forEach((card, i) => {
      const next = stackCards[i + 1];
      card.style.transformOrigin = "center top";
      if (still || !next) {
        card.style.transform = "";
        card.style.opacity = "";
      } else {
        const dist = next.getBoundingClientRect().top - pin;
        const progress = Math.min(1, Math.max(0, 1 - dist / 240));
        card.style.transform = "scale(" + (1 - progress * 0.045).toFixed(4) + ")";
        card.style.opacity = String((1 - progress * 0.12).toFixed(3));
      }
      const step = innerWidth <= 900 ? 14 : 18;
      const stickyTop = pin + i * step;
      const top = card.getBoundingClientRect().top;
      const nextTop = next ? next.getBoundingClientRect().top : Infinity;
      const arrived = top <= stickyTop + 24;
      const covered = !!next && nextTop < stickyTop + 180;
      card.classList.toggle("is-front", still || (arrived && !covered));
    });
  }
  if (stackCards.length) {
    let stackTick = false;
    const onStackScroll = () => {
      if (stackTick) return;
      stackTick = true;
      requestAnimationFrame(() => { stackTick = false; updateStack(); });
    };
    addEventListener("scroll", onStackScroll, { passive: true });
    addEventListener("resize", onStackScroll);
    stackReady = true;
    updateStack();
  }

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
        if (src.endsWith(".webp")) {
          img.srcset = `${src.replace(".webp", "-800.webp")} 800w, ${src} 1600w`;
          img.sizes = "100vw";
        }
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

  /* Campaign figures count up when they appear. The real value stays in the DOM for
     screen readers; only the visible copy animates. */
  const counters = document.querySelectorAll(".campaigns .case-facts dt, .campaigns .case-stat strong");
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  function prepareCounter(el) {
    const finalText = el.textContent.trim();
    const match = finalText.match(/\d[\d,]*(\.\d+)?/);
    if (!match) return null;
    const target = parseFloat(match[0].replace(/,/g, ""));
    const decimals = match[1] ? match[1].length - 1 : 0;
    const grouped = match[0].includes(",");
    const before = finalText.slice(0, match.index);
    const after = finalText.slice(match.index + match[0].length);
    const live = document.createElement("span");
    live.setAttribute("aria-hidden", "true");
    const hidden = document.createElement("span");
    hidden.className = "sr-only";
    hidden.textContent = finalText;
    el.replaceChildren(hidden, live);
    const format = (n) => before + (grouped ? Math.round(n).toLocaleString("en-GB") : n.toFixed(decimals)) + after;
    live.textContent = format(0);
    return { live, target, format, finalText };
  }
  function runCounter(c) {
    const start = performance.now(), duration = 1800;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      c.live.textContent = t < 1 ? c.format(c.target * easeOut(t)) : c.finalText;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (motionAllowed() && "IntersectionObserver" in window) {
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const c = entry.target._counter;
        if (c) setTimeout(() => runCounter(c), entry.target.closest(".case--lead") ? 900 : 300);
        countIo.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => { el._counter = prepareCounter(el); if (el._counter) countIo.observe(el); });
  }

  /* Campaign photos drift against the scroll and tilt toward the pointer. */
  const mediaFrames = [...document.querySelectorAll(".campaigns .case-media")];
  let parallaxQueued = false;
  function parallax() {
    parallaxQueued = false;
    if (!motionAllowed()) return;
    const mid = innerHeight / 2;
    mediaFrames.forEach((frame) => {
      const box = frame.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      const offset = (box.top + box.height / 2 - mid) * -0.06;
      frame.firstElementChild?.style.setProperty("--py", `${offset.toFixed(1)}px`);
    });
  }
  addEventListener("scroll", () => {
    if (!parallaxQueued) { parallaxQueued = true; requestAnimationFrame(parallax); }
  }, { passive: true });
  parallax();
  mediaFrames.forEach((frame) => {
    frame.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || !motionAllowed()) return;
      const box = frame.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      frame.style.transform = `perspective(1200px) rotateY(${(x * 5).toFixed(2)}deg) rotateX(${(-y * 4).toFixed(2)}deg)`;
    });
    frame.addEventListener("pointerleave", () => { frame.style.transform = ""; });
  });

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
  const regionInputs = [...document.querySelectorAll('input[name="campaign-region"]')];
  const presets = [...document.querySelectorAll(".budget-presets button")];
  const output = document.getElementById("budget-output");
  const results = document.getElementById("budget-results");
  if (!slider || !regionInputs.length || !output || !results) return;
  const currentRegion = () => regionInputs.find((input) => input.checked) || regionInputs[0];
  const money = (value) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
  const formatSpecs = [
    { category: "Roadside", format: "Static 48-Sheet", title: "Static billboards", unit: "panels" },
    { category: "Roadside", format: "Digital 48-Sheet", title: "Digital billboards", unit: "screens" },
    { category: "Bus", format: "Superside", title: "Bus supersides", unit: "buses" },
  ];
  let rates;
  const rows = new Map();
  function rowFor(spec) {
    if (rows.has(spec.format)) return rows.get(spec.format);
    const item = document.createElement("div");
    item.className = "budget-result";
    const title = document.createElement("p");
    title.className = "result-title";
    title.textContent = spec.title;
    const basis = document.createElement("p");
    const number = document.createElement("strong");
    const count = document.createElement("span");
    const label = document.createElement("small");
    label.textContent = `${spec.unit} / 2 weeks`;
    number.append(count, label);
    const bar = document.createElement("span");
    bar.className = "result-bar";
    bar.setAttribute("aria-hidden", "true");
    item.append(title, basis, number, bar);
    const row = { item, basis, count, bar };
    rows.set(spec.format, row);
    return row;
  }
  function renderBudget() {
    const budget = Number(slider.value);
    const region = currentRegion();
    output.value = money(budget);
    slider.setAttribute("aria-valuetext", money(budget));
    slider.style.setProperty("--fill", `${((budget - slider.min) / (slider.max - slider.min)) * 100}%`);
    presets.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.budget) === budget)));
    const discuss = document.getElementById("budget-discuss");
    if (discuss) {
      discuss.href = "mailto:hello@loudooh.co.uk?subject=" +
        encodeURIComponent(`OOH campaign: ${money(budget)} media budget`) + "&body=" +
        encodeURIComponent(`Hello Loud! OOH,\n\nI would like to explore a campaign with a ${money(budget)} media budget in ${region.labels[0].textContent}.\n\nMy audience:\nMy preferred dates:\nMy campaign goal:\n`);
    }
    if (!rates) return;
    const computed = [];
    for (const spec of formatSpecs) {
      const data = rates.find((r) => r.Category === spec.category && r.Format === spec.format && r["Market/Region"] === region.value);
      const typical = Number(data?.["Planning Typical £"]);
      if (!data || !Number.isFinite(typical) || typical <= 0) continue;
      computed.push({ spec, data, typical, quantity: Math.floor(budget / typical) });
    }
    const most = Math.max(1, ...computed.map((c) => c.quantity));
    const shown = computed.map(({ spec, data, typical, quantity }) => {
      const row = rowFor(spec);
      row.basis.textContent = `${money(typical)} ${data["Buying Unit"]} · typical`;
      row.count.textContent = `≈ ${quantity}`;
      row.bar.style.setProperty("--w", `${Math.max(4, (quantity / most) * 100).toFixed(1)}%`);
      return row.item;
    });
    if (shown.length !== results.children.length || shown.some((item, i) => results.children[i] !== item)) results.replaceChildren(...shown);
  }
  slider.addEventListener("input", renderBudget);
  regionInputs.forEach((input) => input.addEventListener("change", renderBudget));
  presets.forEach((button) => button.addEventListener("click", () => {
    slider.value = button.dataset.budget;
    renderBudget();
  }));
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
