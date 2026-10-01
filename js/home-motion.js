/* Homepage motion system.
   Every movement has a job: reveal the story in reading order, show scale
   (count-ups, budget bars), or show progress (the brief-to-billboard line).
   Only opacity and transform/translate are animated. Reduced-motion users get
   the final state immediately. */
(function () {
  "use strict";
  if (window.__lobMotion) return;
  window.__lobMotion = true;

  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var compact = window.matchMedia && window.matchMedia("(max-width: 719px)").matches;
  var STAGGER = compact ? 60 : 90;

  /* Elements revealed as they enter the viewport, grouped so siblings stagger in reading order. */
  var TARGETS = [
    "#lo-intro .lob-intro-grid > div:first-child > *",
    "#lo-intro .lob-intro-body > *",
    "#services .lo-gallery-head > *",
    "#services .lo-work-card",
    "#services .lob-also",
    "#lo-what-we-do .lo-wwd-head-wrap",
    "#lo-difference .lo-diff-copy > *",
    "#lo-difference .lo-diff-vcard",
    ".lob-sec .lob-head > *",
    ".lob-sec .lob-head > div > *",
    "#lo-trust .lob-logos > li",
    "#lo-process .lob-steps",
    "#lo-press .lob-press-grid > div > *",
    "#lo-press .lob-press-logos > li",
    "#lo-insights-teaser .lob-insights-head > div > *",
    "#lo-insights-teaser .lob-insights-head > a",
    "#lo-pricing .lob-pricing-copy > *",
    "#lo-pricing .lob-ledger > li",
    "#lo-pricing .lob-price-card",
    "#lo-budget-promo .lob-budget-grid > div:first-child > .lob-eyebrow",
    "#lo-budget-promo .lob-budget-grid > div:first-child > .lob-h2",
    "#lo-budget-promo .lob-budget-card",
    "#lo-final-cta .lob-final-inner > *",
    "#lo-dlu .lob-dlu-inner > *",
    "#lo-press .lob-press-grid > div > .lob-actions"
  ].join(",");

  /* Text whose figures count up when revealed. */
  var COUNT_TARGETS = ".lob-case-result p, #lo-budget-promo .lob-budgets li";
  var NUMBER = /([£+]?)(\d[\d,]*(?:\.\d+)?)(%?)/g;

  function finish(el) {
    el.classList.add("is-in");
  }

  if (reduced || !("IntersectionObserver" in window)) {
    root.classList.add("lob-motion-off");
    [0, 300, 1000, 2500].forEach(function (ms) { setTimeout(heroHeader, ms); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      io.unobserve(el);
      finish(el);
      if (el.matches(COUNT_TARGETS) || el.querySelector(COUNT_TARGETS)) countWithin(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

  function tag() {
    document.querySelectorAll(TARGETS).forEach(function (el) {
      if (el.hasAttribute("data-lob-m")) return;
      el.setAttribute("data-lob-m", "");
      el.classList.add("lob-reveal");
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(TARGETS); });
      var i = Math.max(0, siblings.indexOf(el));
      el.style.setProperty("--lob-d", Math.min(i, 7) * STAGGER + "ms");
      io.observe(el);
    });
    /* Blocks that already carried .lob-reveal (case studies, testimonials, budgets). */
    document.querySelectorAll(".lob-reveal:not([data-lob-m])").forEach(function (el) {
      el.setAttribute("data-lob-m", "");
      var i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty("--lob-d", Math.min(Math.max(i, 0), 7) * STAGGER + "ms");
      io.observe(el);
    });
    document.querySelectorAll(COUNT_TARGETS).forEach(prepareCount);
  }

  /* ---- Count-ups ---- */
  function prepareCount(el) {
    if (el.hasAttribute("data-lob-count")) return;
    el.setAttribute("data-lob-count", "");
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      if (!NUMBER.test(text)) return;
      NUMBER.lastIndex = 0;
      var frag = document.createDocumentFragment(), last = 0, m;
      while ((m = NUMBER.exec(text))) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var span = document.createElement("span");
        span.className = "lob-count";
        span.setAttribute("data-prefix", m[1]);
        span.setAttribute("data-value", m[2].replace(/,/g, ""));
        span.setAttribute("data-suffix", m[3]);
        span.setAttribute("data-decimals", (m[2].split(".")[1] || "").length);
        span.setAttribute("data-grouped", m[2].indexOf(",") > -1 ? "1" : "0");
        span.textContent = m[0];
        frag.appendChild(span);
        last = m.index + m[0].length;
      }
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
    /* Reserve each figure's real final width so surrounding text never shifts while counting. */
    el.querySelectorAll(".lob-count").forEach(function (s) {
      s.style.minWidth = Math.ceil(s.getBoundingClientRect().width) + "px";
      s.textContent = format(s, 0);
    });
    /* Count when the surrounding block reveals; observe it directly if it has no revealed parent. */
    var host = el.closest("[data-lob-m]");
    if (!host) { el.setAttribute("data-lob-m", ""); io.observe(el); }
    else if (host.classList.contains("is-in")) countWithin(el);
  }

  function format(span, v) {
    var d = +span.getAttribute("data-decimals");
    var n = d ? v.toFixed(d) : String(Math.round(v));
    if (span.getAttribute("data-grouped") === "1") n = n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return span.getAttribute("data-prefix") + n + span.getAttribute("data-suffix");
  }

  function countWithin(el) {
    var spans = el.matches(".lob-count") ? [el] : el.querySelectorAll(".lob-count");
    Array.prototype.forEach.call(spans, function (span) {
      if (span.hasAttribute("data-done")) return;
      span.setAttribute("data-done", "");
      var target = parseFloat(span.getAttribute("data-value"));
      var dur = compact ? 700 : 950, start = null;
      function step(t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        span.textContent = format(span, target * eased);
        if (p < 1) requestAnimationFrame(step);
        else span.textContent = format(span, target);
      }
      requestAnimationFrame(step);
    });
  }

  /* Full-screen hero: light logo while the header is transparent over the photo. */
  function heroHeader() {
    var nav = document.querySelector(".lo-amenu");
    var logo = nav && nav.querySelector(".lo-amenu-logo-img");
    if (!nav || !logo || nav.hasAttribute("data-lob-hero")) return;
    nav.setAttribute("data-lob-hero", "");
    root.classList.add("lob-hero-top");
    var dark = logo.getAttribute("src"), light = "images/loud-ooh-logo.png";
    function sync() {
      var over = nav.classList.contains("lo-on-light") && !nav.classList.contains("is-scrolled") && !nav.classList.contains("is-open");
      var want = over ? light : dark;
      if (logo.getAttribute("src") !== want) logo.setAttribute("src", want);
    }
    sync();
    new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ["class"] });
  }

  /* Sections are injected by other homepage scripts over the first few seconds. */
  function boot() {
    heroHeader();
    [300, 1000, 2500].forEach(function (ms) { setTimeout(heroHeader, ms); });
    tag();
    [400, 1200, 2500, 5000].forEach(function (ms) { setTimeout(tag, ms); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
