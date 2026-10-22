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

})();
