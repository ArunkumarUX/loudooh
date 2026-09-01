/* Planning mode: hide nav when exploring results — layout is CSS-only on desktop */
(function () {
  "use strict";

  var heroBand = document.querySelector(".bl-ref-hero-band");
  var searchWrap = document.querySelector(".bl-ref-search-wrap:not(.bl-ref-search-wrap--source)");
  var mobileStrip = document.getElementById("hl-mobile-campaign-strip");
  var labWrap = document.querySelector(".bl-ref-lab-wrap");
  var results = document.getElementById("hl-results");
  var planning = false;
  var ticking = false;
  var anchor = null;

  function navEl() {
    return document.querySelector(".lo-amenu");
  }

  function ensureAnchor() {
    if (!labWrap || anchor) return;
    anchor = document.createElement("div");
    anchor.className = "bl-sticky-anchor";
    anchor.setAttribute("aria-hidden", "true");
    labWrap.parentNode.insertBefore(anchor, labWrap);
  }

  function unlockScroll() {
    var mobile = document.querySelector(".lo-amenu-mobile.is-open");
    if (!mobile) document.body.style.overflow = "";
  }

  function syncAnchor() {
    ensureAnchor();
    if (!anchor) return;
    anchor.style.height = "0";
    anchor.classList.remove("is-active");
  }

  function setPlanning(on) {
    if (planning === on) return;

    planning = on;
    document.body.classList.toggle("is-planning", on);
    if (heroBand) heroBand.classList.toggle("is-compact", on);
    if (window.innerWidth <= 1024) {
      if (mobileStrip) mobileStrip.classList.toggle("is-sticky", on);
    } else if (searchWrap) {
      searchWrap.classList.toggle("is-sticky", on);
    }
    if (labWrap) labWrap.classList.toggle("is-explore", on);

    var nav = navEl();
    if (nav) nav.classList.toggle("is-hidden-planning", on);
    syncAnchor();
    unlockScroll();

    if (window.__BL_HERO__ && window.__BL_HERO__.onSync) {
      window.__BL_HERO__.onSync();
    }
    if (window.__BL_MAP__ && window.__BL_MAP__.invalidate) {
      requestAnimationFrame(function () {
        window.__BL_MAP__.invalidate();
      });
    }
  }

  function readScroll() {
    ticking = false;

    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var desktop = window.innerWidth > 1024;

    if (desktop) {
      /* Desktop split layout — keep nav clearance; sidebar is always visible */
      if (planning) setPlanning(false);
      if (labWrap) labWrap.classList.add("is-explore");
      var nav = navEl();
      if (nav) nav.classList.remove("is-hidden-planning");
      return;
    }

    /* Mobile: enter explore when scrolled past hero */
    if (!planning && y > 120) setPlanning(true);
    else if (planning && y < 16) setPlanning(false);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(readScroll);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    syncAnchor();
    readScroll();
    if (window.__BL_MAP__ && window.__BL_MAP__.invalidate) {
      window.__BL_MAP__.invalidate();
    }
  });

  document.addEventListener("bl-campaign-open", function () {
    if (labWrap && window.innerWidth <= 1024) labWrap.classList.add("is-dimmed");
  });
  document.addEventListener("bl-campaign-close", function () {
    if (labWrap) labWrap.classList.remove("is-dimmed");
    unlockScroll();
  });
  ensureAnchor();
  readScroll();
  unlockScroll();
})();
