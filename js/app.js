(function () {
  'use strict';

  var SECTIONS = ['numbers','audience','formats','ratecard','budgets','factors','effectiveness','stations','booking','sme','faq'];
  var progressFill = document.getElementById('progress-fill');
  var backToTop = document.getElementById('back-to-top');
  var bodyGrid = document.getElementById('body-grid');
  var tocAside = document.getElementById('toc-aside');
  var mainNav = document.getElementById('main-nav');
  var tocLinks = document.querySelectorAll('.toc-link');
  var faqItems = document.querySelectorAll('.faq-item');

  function isNarrow() {
    return window.innerWidth < 920;
  }

  function updateLayout() {
    var narrow = isNarrow();
    if (bodyGrid) {
      bodyGrid.classList.toggle('is-narrow', narrow);
    }
    if (tocAside) {
      tocAside.classList.toggle('is-hidden', narrow);
    }
    if (mainNav) {
      mainNav.classList.remove('is-narrow');
    }
  }

  function scrollToSection(id, e) {
    if (e) e.preventDefault();
    var el = document.getElementById(id);
    if (el) {
      var top = el.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80) - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function updateScrollState() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var progress = max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0;

    if (progressFill) {
      progressFill.style.width = progress + '%';
    }

    if (backToTop) {
      backToTop.classList.toggle('is-visible', doc.scrollTop > 900);
    }

    var active = SECTIONS[0];
    var line = 140;
    for (var i = 0; i < SECTIONS.length; i++) {
      var section = document.getElementById(SECTIONS[i]);
      if (section && section.getBoundingClientRect().top - line <= 0) {
        active = SECTIONS[i];
      }
    }

    tocLinks.forEach(function (link) {
      var on = link.getAttribute('data-section') === active;
      link.classList.toggle('is-active', on);
    });
  }

  tocLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      scrollToSection(link.getAttribute('data-section'), e);
    });
  });

  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        var sign = other.querySelector('.faq-sign');
        var q = other.querySelector('.faq-question');
        if (sign) sign.textContent = '+';
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        var sign = item.querySelector('.faq-sign');
        if (sign) sign.textContent = '−';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('resize', updateLayout, { passive: true });
  window.addEventListener('scroll', updateScrollState, { passive: true });

  updateLayout();
  updateScrollState();
})();
