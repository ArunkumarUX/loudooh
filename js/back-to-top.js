/* Back-to-top arrow: appears after the first screen, scrolls smoothly to the top. */
(function () {
  "use strict";
  if (window.__loBackToTop) return;
  window.__loBackToTop = true;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var css = document.createElement("style");
  css.textContent =
    ".lo-top{position:fixed;right:24px;bottom:24px;z-index:190;width:48px;height:48px;border-radius:50%;" +
    "display:grid;place-items:center;border:1px solid rgba(10,31,61,.08);background:#fff;color:#0A1F3D;cursor:pointer;" +
    "box-shadow:0 10px 28px -6px rgba(6,20,40,.45);opacity:0;visibility:hidden;translate:0 12px;" +
    "transition:opacity .3s ease,translate .3s cubic-bezier(.22,1,.36,1),visibility 0s linear .3s,background-color .2s ease}" +
    ".lo-top.is-on{opacity:1;visibility:visible;translate:none;transition-delay:0s}" +
    ".lo-top:hover{background:#FF4A00;border-color:#FF4A00;color:#fff}" +
    ".lo-top:active{scale:.94}" +
    ".lo-top:focus-visible{outline:2px solid #FF4A00;outline-offset:3px}" +
    ".lo-top svg{width:20px;height:20px}" +
    "@media (max-width:900px){.lo-top{right:16px;bottom:16px}" +
    "body:has(.lo-sticky-cta.is-on) .lo-top{bottom:88px}}" +
    "@media (hover:none){.lo-top:hover{background:#fff;border-color:rgba(10,31,61,.08);color:#0A1F3D}}" +
    "@media (prefers-reduced-motion:reduce){.lo-top{transition:none;translate:none}}";
  document.head.appendChild(css);

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lo-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';

  function mount() {
    document.body.appendChild(btn);
    function sync() { btn.classList.toggle("is-on", (window.scrollY || 0) > window.innerHeight * 0.8); }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      var skip = document.querySelector(".lo-amenu-logo");
      if (skip) skip.focus({ preventScroll: true });
    });
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
