/* bl-lab-gate.js — landing overview ↔ live calculator */
(function () {
  "use strict";

  var STORAGE_KEY = "bl-lab-awake";

  function els() {
    return {
      body: document.body,
      landing: document.getElementById("bl-lab-landing"),
      workspace: document.getElementById("bl-lab-workspace"),
      marketing: document.getElementById("bl-lab-marketing")
    };
  }

  function isAwake() {
    return document.body.classList.contains("bl-lab-awake");
  }

  function shouldStartAwake() {
    var hash = (location.hash || "").replace(/^#/, "");
    return hash === "planner" || hash === "calc";
  }

  function persistAwake(on) {
    try {
      if (on) sessionStorage.setItem(STORAGE_KEY, "1");
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* private mode */ }
  }

  function syncPreview() {
    var budget = document.getElementById("hl-budget-out");
    var previewBudget = document.getElementById("bl-landing-preview-budget");
    var previewTotal = document.getElementById("bl-landing-preview-total");
    if (budget && previewBudget) previewBudget.textContent = budget.textContent || "£50,000";
    if (budget && previewTotal) previewTotal.textContent = budget.textContent || "£50,000";

    var dur = document.getElementById("hl-bar-duration");
    var previewDur = document.getElementById("bl-landing-preview-duration");
    if (dur && previewDur) previewDur.textContent = dur.textContent || "2 weeks";

    var impacts = document.getElementById("hl-impacts");
    var previewReach = document.getElementById("bl-landing-preview-reach");
    if (impacts && previewReach && impacts.textContent && impacts.textContent !== "—") {
      var reachText = impacts.textContent.split(/[–—-]/)[0].trim();
      previewReach.innerHTML = reachText + ' <small>people</small>';
    }
  }

  function syncMenuBack() {
    var menuRow = document.querySelector(".lo-amenu-row");
    var backBtn = document.getElementById("bl-lab-sleep");
    var topBar = document.querySelector(".bl-lab-workspace-top");
    var breadcrumb = document.querySelector(".lo-breadcrumb");
    var labWrap = document.querySelector(".bl-ref-lab-wrap");
    if (!menuRow || !backBtn || !topBar) return;

    if (isAwake()) {
      if (backBtn.parentElement !== menuRow) {
        menuRow.insertBefore(backBtn, menuRow.firstChild);
      }
      if (breadcrumb && breadcrumb.parentElement !== menuRow) {
        menuRow.insertBefore(breadcrumb, backBtn.nextSibling);
        breadcrumb.classList.add("lo-breadcrumb--menu");
      }
      document.body.classList.add("bl-lab-menu-back");
      topBar.hidden = true;
    } else {
      if (backBtn.parentElement !== topBar) {
        topBar.insertBefore(backBtn, topBar.firstChild);
      }
      if (breadcrumb && labWrap && breadcrumb.classList.contains("lo-breadcrumb--menu")) {
        labWrap.insertBefore(breadcrumb, labWrap.firstChild);
        breadcrumb.classList.remove("lo-breadcrumb--menu");
      }
      document.body.classList.remove("bl-lab-menu-back");
      topBar.hidden = false;
    }
  }

  function wake(opts) {
    opts = opts || {};
    var e = els();
    if (!e.workspace) return;

    e.body.classList.remove("bl-lab-asleep");
    e.body.classList.add("bl-lab-awake");
    e.workspace.hidden = false;
    if (e.landing) e.landing.hidden = true;
    if (e.marketing) e.marketing.hidden = true;

    persistAwake(true);
    if (!opts.silentHash && location.hash !== "#planner") {
      history.replaceState(null, "", location.pathname + location.search + "#planner");
    }

    syncPreview();
    syncMenuBack();
    window.scrollTo(0, 0);

    if (window.__BL_MAP__ && window.__BL_MAP__.invalidate) {
      requestAnimationFrame(function () {
        window.__BL_MAP__.invalidate();
      });
      setTimeout(function () {
        if (window.__BL_MAP__ && window.__BL_MAP__.invalidate) window.__BL_MAP__.invalidate();
      }, 320);
    }
    if (window.__BL_HERO__ && window.__BL_HERO__.update) {
      window.__BL_HERO__.update();
    }
  }

  function refreshMarketingReveal() {
    var root = document.getElementById("bl-lab-marketing");
    if (!root || typeof IntersectionObserver !== "function") return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    root.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      io.observe(el);
    });
  }

  function sleep() {
    var e = els();
    if (!e.landing) return;

    e.body.classList.add("bl-lab-asleep");
    e.body.classList.remove("bl-lab-awake");
    e.workspace.hidden = true;
    e.landing.hidden = false;
    if (e.marketing) e.marketing.hidden = false;

    persistAwake(false);
    syncMenuBack();
    if (location.hash === "#planner") {
      history.replaceState(null, "", location.pathname + location.search);
    }
    window.scrollTo(0, 0);
    requestAnimationFrame(refreshMarketingReveal);
  }

  function onClick(ev) {
    var t = ev.target.closest(
      '[data-bl-lab-wake], #bl-lab-wake, #bl-lab-wake-footer, .lo-amenu-cta[href="#planner"], .lo-amenu-mobile-link[href="#planner"]'
    );
    if (t) {
      ev.preventDefault();
      wake();
      return;
    }
    if (ev.target.closest("#bl-lab-sleep")) {
      ev.preventDefault();
      sleep();
    }
  }

  function onKeydown(ev) {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    var t = ev.target.closest(".bl-lab-landing-preview[data-bl-lab-wake]");
    if (!t || isAwake()) return;
    ev.preventDefault();
    wake();
  }

  function init() {
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);

    window.addEventListener("hashchange", function () {
      if (location.hash === "#planner" && !isAwake()) wake({ silentHash: true });
      else if (!location.hash && isAwake()) sleep();
    });

    if (shouldStartAwake()) {
      wake({ silentHash: location.hash === "#planner" });
    } else {
      sleep();
      syncMenuBack();
      if (location.hash === "#formats") {
        requestAnimationFrame(function () {
          var el = document.getElementById("formats");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          refreshMarketingReveal();
        });
      } else {
        requestAnimationFrame(refreshMarketingReveal);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.BLLabGate = { wake: wake, sleep: sleep, isAwake: isAwake };
})();
