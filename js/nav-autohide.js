/* The header stays planted. Hiding it on scroll and sliding it back made the
   page jump. The translate property is cleared so an older session cannot
   leave the bar off-screen. */
(function () {
  "use strict";
  if (window.__loNavAutohide) return;
  window.__loNavAutohide = true;

  function init(nav) {
    nav.style.translate = "0 0";
    nav.removeAttribute("data-autohidden");
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
