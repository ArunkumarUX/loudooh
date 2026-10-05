(function () {
  "use strict";

  if (window.__LO_SMOOTH_INIT__) return;
  window.__LO_SMOOTH_INIT__ = true;

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse =
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;

  document.documentElement.classList.add("lo-smooth-ready");

  function headerOffset() {
    var menu = document.querySelector(".lo-amenu");
    return menu ? menu.offsetHeight + 12 : 88;
  }

  /* Smooth in-page anchors with fixed-header offset */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href*="#"]');
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (err) {
      return;
    }
    var samePath =
      url.pathname.replace(/\/+$/, "") ===
      window.location.pathname.replace(/\/+$/, "");
    if (!samePath) return;
    var hash = url.hash.slice(1);
    if (!hash) return;
    var el = document.getElementById(hash);
    if (!el) return;
    e.preventDefault();
    var top = el.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduced ? "auto" : "smooth",
    });
    if (history.replaceState) {
      history.replaceState(null, "", "#" + hash);
    }
  });

  /* Stagger delay for grouped reveals */
  function applyRevealDelays(root) {
    (root || document)
      .querySelectorAll(
        ".reveal:not([style*='--lo-reveal-delay']), .lo-scroll-reveal:not([style*='--lo-reveal-delay'])"
      )
      .forEach(function (el, i) {
        el.style.setProperty("--lo-reveal-delay", Math.min(i % 8, 7) * 55 + "ms");
      });
  }

  /* Scroll reveal observer */
  if (!reduced && typeof IntersectionObserver === "function") {
    var revealIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in", "is-revealed", "lo-revealed");
          revealIo.unobserve(en.target);
        });
      },
      { root: null, rootMargin: "0px 0px -7% 0px", threshold: 0.1 }
    );

    function observeReveals(root) {
      applyRevealDelays(root);
      (root || document)
        .querySelectorAll(
          ".reveal:not(.is-in):not(.is-revealed):not(.lo-revealed), .lo-scroll-reveal:not(.lo-revealed)"
        )
        .forEach(function (el) {
          revealIo.observe(el);
        });
    }

    observeReveals();

    if (typeof MutationObserver === "function") {
      var mo = new MutationObserver(function () {
        observeReveals();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  } else {
    document
      .querySelectorAll(".reveal, .lo-scroll-reveal")
      .forEach(function (el) {
        el.classList.add("is-in", "is-revealed", "lo-revealed");
      });
  }

  /* Budget Lab landing entrance */
  if (document.body.classList.contains("bl-lab-asleep")) {
    requestAnimationFrame(function () {
      document.body.classList.add("lo-landing-ready");
    });
  }

  if (reduced) return;

  /* Photos only. The hero frame and the header stay still — moving those is what made the screen jump. */
  var PARALLAX_SEL = [
    "[data-lo-parallax]",
    "#home-banner .lo-mz-slide img",
    ".lob-case-media > img",
    ".lo-work-card img",
    ".lo-diff-visual img",
    ".lo-diff-vcard img",
    ".hero-stage-img",
    ".guide-list-media img",
    ".bl-lab-landing-stage img",
    ".related-grid img"
  ].join(",");

  var items = [];
  var known = new WeakMap();
  var running = false;
  var motionScale = coarse ? 0.45 : 1;
  var EASE = 0.16;
  var MAX = coarse ? 22 : 36;

  function inScrollContainer(el) {
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      var style = getComputedStyle(p);
      var scrollableY =
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        p.scrollHeight > p.clientHeight + 2;
      var scrollableX =
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        p.scrollWidth > p.clientWidth + 2;
      if (scrollableY || scrollableX) return true;
    }
    return false;
  }

  function parallaxDisabled() {
    return document.body.classList.contains("bl-lab-awake");
  }

  function defaultSpeed(el) {
    if (el.matches("#home-banner .lo-mz-slide img")) return 0.18;
    if (el.matches(".hero-stage-img")) return 0.2;
    if (el.matches(".bl-lab-landing-stage img")) return 0.22;
    if (el.matches(".lob-case-media > img")) return 0.12;
    if (el.matches(".lo-diff-visual img, .lo-diff-vcard img")) return 0.14;
    return 0.1;
  }

  function collectParallax() {
    var next = [];
    if (parallaxDisabled()) {
      items.forEach(function (item) { item.el.style.translate = "0 0"; });
      items = [];
      return;
    }
    document.querySelectorAll(PARALLAX_SEL).forEach(function (el) {
      if (inScrollContainer(el)) return;
      if (el.closest(".lob-logos, .lob-press-logos, .lo-wwd")) return;
      var raw = el.getAttribute("data-lo-parallax");
      var speed = raw !== null && raw !== "" ? parseFloat(raw) : defaultSpeed(el);
      if (!isFinite(speed)) speed = defaultSpeed(el);
      var prev = known.get(el);
      var item = prev || { el: el, y: 0 };
      item.speed = speed * motionScale;
      known.set(el, item);
      if (el.parentElement) el.parentElement.classList.add("lo-px-frame");
      next.push(item);
    });
    items = next;
  }

  function targetY(item) {
    var frame = item.el.parentElement || item.el;
    var rect = frame.getBoundingClientRect();
    if (rect.bottom < -80 || rect.top > window.innerHeight + 80) return item.y;
    var center = rect.top + rect.height * 0.5;
    var viewCenter = window.innerHeight * 0.5;
    var offset = (center - viewCenter) * item.speed * -0.35;
    if (offset > MAX) offset = MAX;
    if (offset < -MAX) offset = -MAX;
    return offset;
  }

  function frame() {
    if (parallaxDisabled()) {
      items.forEach(function (item) { item.el.style.translate = "0 0"; item.y = 0; });
      running = false;
      return;
    }
    var moving = false;
    items.forEach(function (item) {
      var goal = targetY(item);
      item.y += (goal - item.y) * EASE;
      if (Math.abs(goal - item.y) > 0.15) moving = true;
      else item.y = goal;
      item.el.style.translate = "0 " + item.y.toFixed(2) + "px";
    });
    if (moving) requestAnimationFrame(frame);
    else running = false;
  }

  function kick() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  collectParallax();
  kick();

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", function () { collectParallax(); kick(); }, { passive: true });

  if (typeof MutationObserver === "function") {
    var scanTimer = null;
    var bodyMo = new MutationObserver(function () {
      clearTimeout(scanTimer);
      scanTimer = setTimeout(function () { collectParallax(); kick(); }, 180);
    });
    bodyMo.observe(document.body, { childList: true, subtree: true });
  }
})();
