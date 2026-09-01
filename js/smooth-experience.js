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

  var PARALLAX_SEL = [
    "[data-lo-parallax]",
    "#home-banner .lo-mz-carousel",
    ".bl-lab-landing-stage img",
    ".lo-diff-visual img",
    "#home-banner .lo-mz-copy",
  ].join(",");

  var items = [];
  var ticking = false;
  var motionScale = coarse ? 0.5 : 1;

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
    if (el.matches("#home-banner .lo-mz-carousel")) return 0.22;
    if (el.matches(".bl-lab-landing-stage img")) return 0.28;
    if (el.matches(".lo-diff-visual img")) return 0.16;
    if (el.matches("#home-banner .lo-mz-copy")) return -0.08;
    return 0.14;
  }

  function collectParallax() {
    items = [];
    if (parallaxDisabled()) return;

    document.querySelectorAll(PARALLAX_SEL).forEach(function (el) {
      if (inScrollContainer(el)) return;
      var raw = el.getAttribute("data-lo-parallax");
      var speed = raw !== null && raw !== "" ? parseFloat(raw) : defaultSpeed(el);
      if (!isFinite(speed)) speed = defaultSpeed(el);
      items.push({ el: el, speed: speed * motionScale });
    });
  }

  function applyParallax() {
    if (parallaxDisabled()) {
      items.forEach(function (item) {
        item.el.style.removeProperty("transform");
      });
      ticking = false;
      return;
    }

    items.forEach(function (item) {
      var rect = item.el.getBoundingClientRect();
      var center = rect.top + rect.height * 0.5;
      var viewCenter = window.innerHeight * 0.5;
      var offset = (center - viewCenter) * item.speed * -0.4;
      item.el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
    });
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  }

  collectParallax();
  applyParallax();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    function () {
      collectParallax();
      applyParallax();
    },
    { passive: true }
  );

  if (typeof MutationObserver === "function") {
    var bodyMo = new MutationObserver(function () {
      collectParallax();
      applyParallax();
    });
    bodyMo.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
  }
})();
