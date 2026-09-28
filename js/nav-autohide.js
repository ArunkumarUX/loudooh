/* Header hides while the page is scrolling and slides back once scrolling stops.
   It stays visible near the top of the page, while the mobile menu or a dropdown
   is open, and while keyboard focus is inside it. Uses the `translate` property so
   it never conflicts with other header transforms. */
(function () {
  "use strict";
  if (window.__loNavAutohide) return;
  window.__loNavAutohide = true;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SHOW_AFTER_MS = 400;
  var TOP_ZONE = 120;

  function init(nav) {
    var base = getComputedStyle(nav).transition;
    var slide = reduced ? "translate 0s" : "translate .35s cubic-bezier(.22, 1, .36, 1)";
    nav.style.transition = base && base !== "all 0s ease 0s" ? base + ", " + slide : slide;
    nav.style.willChange = "translate";

    var timer = null, hidden = false;

    function mustStay() {
      var mobile = document.querySelector(".lo-amenu-mobile");
      return (window.scrollY || 0) < TOP_ZONE ||
        (mobile && mobile.classList.contains("is-open")) ||
        nav.querySelector(".lo-amenu-item.is-open") ||
        /* Only keyboard focus keeps it pinned; a mouse click leaves focus behind too. */
        nav.contains(document.activeElement) && document.activeElement.matches(":focus-visible");
    }
    function show() {
      if (!hidden) return;
      hidden = false;
      nav.style.translate = "0 0";
      nav.removeAttribute("data-autohidden");
    }
    function hide() {
      if (hidden || mustStay()) return;
      hidden = true;
      nav.style.translate = "0 -110%";
      nav.setAttribute("data-autohidden", "");
    }
    function onScroll() {
      if (mustStay()) { show(); }
      else hide();
      clearTimeout(timer);
      timer = setTimeout(show, SHOW_AFTER_MS);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    nav.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) show(); });
  }

  function boot() {
    var nav = document.querySelector(".lo-amenu");
    if (nav) return init(nav);
    var n = 0, id = setInterval(function () {
      nav = document.querySelector(".lo-amenu");
      if (nav || ++n > 40) { clearInterval(id); if (nav) init(nav); }
    }, 150);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
