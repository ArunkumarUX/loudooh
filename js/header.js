(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');

  var lastScrollY = window.scrollY;
  var ticking = false;
  var HIDE_THRESHOLD = 96;
  var DELTA = 6;

  function setHeaderState() {
    if (!header) return;

    var y = window.scrollY;
    var scrollingDown = y > lastScrollY + DELTA;
    var scrollingUp = y < lastScrollY - DELTA;
    var nearTop = y < HIDE_THRESHOLD;
    var navOpen = header.classList.contains('nav-open');

    header.classList.toggle('is-scrolled', y > 8);

    if (navOpen || nearTop) {
      header.classList.remove('is-hidden');
      document.body.classList.remove('is-reading');
    } else if (scrollingDown && y > HIDE_THRESHOLD) {
      header.classList.add('is-hidden');
      document.body.classList.add('is-reading');
    } else if (scrollingUp) {
      header.classList.remove('is-hidden');
      document.body.classList.remove('is-reading');
    }

    lastScrollY = y;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(setHeaderState);
    }
  }

  function closeNav() {
    if (!header || !navToggle) return;
    header.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-lock');
    setHeaderState();
  }

  function openNav() {
    if (!header || !navToggle) return;
    header.classList.remove('is-hidden');
    document.body.classList.remove('is-reading');
    header.classList.add('nav-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-lock');
  }

  if (navToggle && header) {
    navToggle.addEventListener('click', function () {
      if (header.classList.contains('nav-open')) closeNav();
      else openNav();
    });

    if (mainNav) {
      mainNav.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeNav();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  setHeaderState();
})();
