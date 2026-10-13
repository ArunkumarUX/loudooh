/* Budget Lab, phones and tablets (plan view): keep the page still.
   The plan header used to pin to the top and then shrink by ~200px once the
   page scrolled past 120px, which threw the content up and down. Now the header
   scrolls away like normal content, and a slim fixed bar with the campaign
   settings slides in once the original "Edit budget & targeting" pill is out of
   view. The bar is position: fixed, so showing or hiding it never moves the page. */
(function () {
  "use strict";
  if (window.__blMobileStable) return;
  window.__blMobileStable = true;

  var mq = window.matchMedia("(max-width: 1024px)");
  var bar, io;

  function pill() { return document.getElementById("hl-mobile-pill"); }
  function summary() { return document.getElementById("hl-mobile-pill-summary"); }
  function awake() { return document.body.classList.contains("bl-lab-awake"); }

  function build() {
    if (bar) return bar;
    bar = document.createElement("div");
    bar.className = "bl-mini-bar";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML =
      '<button type="button" class="bl-mini-bar-btn" tabindex="-1">' +
        '<span class="bl-mini-bar-text"><span class="bl-mini-bar-label">Edit budget &amp; targeting</span>' +
        '<span class="bl-mini-bar-summary"></span></span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>' +
      "</button>";
    bar.querySelector("button").addEventListener("click", function () {
      var p = pill();
      if (p) p.click();
    });
    document.body.appendChild(bar);
    return bar;
  }

  function syncText() {
    var s = summary();
    if (bar && s) bar.querySelector(".bl-mini-bar-summary").textContent = s.textContent;
  }

  function show(on) {
    if (!bar) return;
    on = on && mq.matches && awake();
    bar.classList.toggle("is-on", on);
    bar.setAttribute("aria-hidden", on ? "false" : "true");
    bar.querySelector("button").tabIndex = on ? 0 : -1;
  }

  function watch() {
    var p = pill();
    if (!p || io) return !!io;
    build();
    syncText();
    var s = summary();
    if (s && window.MutationObserver) new MutationObserver(syncText).observe(s, { childList: true, characterData: true, subtree: true });
    io = new IntersectionObserver(function (entries) {
      var e = entries[0];
      /* Show only once the pill has scrolled up past the top bar. */
      show(!e.isIntersecting && e.boundingClientRect.top < 80);
    }, { rootMargin: "-72px 0px 0px 0px", threshold: 0 });
    io.observe(p);
    return true;
  }

  function boot() {
    if (watch()) return;
    var n = 0, id = setInterval(function () { if (watch() || ++n > 40) clearInterval(id); }, 250);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  mq.addEventListener && mq.addEventListener("change", function () { if (bar && !mq.matches) show(false); });
})();
