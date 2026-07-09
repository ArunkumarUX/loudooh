(function () {
  'use strict';

  document.documentElement.classList.add('is-insight-page');

  var REVEAL_SELECTOR = [
    '.article .section-heading',
    '.article .stat-card',
    '.article .key-insight',
    '.article .audience-card',
    '.article .format-card',
    '.article .budget-tier',
    '.article .factor-card',
    '.article .tip-card',
    '.article .chart-panel',
    '.article .station-card',
    '.article .framework-card',
    '.article .verdict-card',
    '.article .split-insight-card',
    '.article .pull-quote',
    '.article .callout',
    '.article .sme-card',
    '.article .timeline-step',
    '.article .faq-item'
  ].join(', ');

  function initReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var nodes = document.querySelectorAll(REVEAL_SELECTOR);
    if (!nodes.length) return;

    nodes.forEach(function (node, index) {
      node.classList.add('reveal');
      node.style.setProperty('--reveal-delay', Math.min(index % 6, 5) * 55 + 'ms');
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.12 }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
