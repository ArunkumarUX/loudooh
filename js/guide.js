(function () {
  'use strict';

  var KEEP_OPEN = ['ratecard', 'budgets', 'faq', 'sme'];
  var BLOCK_TAGS = 'div,table,details,blockquote,ul,ol,.interactive-table,.stats-grid,.stat-cards,.key-insights,.audience-cards,.budget-tiers,.factor-cards,.tip-cards,.station-cards,.chart-panel,.verdict-card,.timeline,.formats-grid,.format-card,.sme-grid,.faq-list,.callout,.pull-quote,.guide-disclosure,.guide-header,.read-panels,.framework-cards,.info-block';

  function scrollToId(id, e) {
    var target = document.getElementById(id);
    if (!target) return;
    if (e) e.preventDefault();
    var offset =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
        10
      ) || 80;
    var top = target.getBoundingClientRect().top + window.scrollY - offset - 12;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function initQuickJumps() {
    document.querySelectorAll('.guide-jump, .page-jump, .scan-jump').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) !== '#') return;
        scrollToId(href.slice(1), e);
      });
    });
  }

  function initDisclosures() {
    document.querySelectorAll('.guide-disclosure').forEach(function (el) {
      var summary = el.querySelector('summary');
      if (!summary) return;
      el.addEventListener('toggle', function () {
        summary.setAttribute('aria-expanded', el.open ? 'true' : 'false');
      });
      summary.setAttribute('aria-expanded', el.open ? 'true' : 'false');
    });
  }

  function shouldStop(node) {
    if (!node || node.nodeType !== 1) return true;
    if (node.matches('h2.section-heading')) return true;
    if (node.matches(BLOCK_TAGS)) return true;
    return false;
  }

  function initSectionProgressive() {
    var article = document.querySelector('.article');
    if (!article) return;

    article.querySelectorAll('h2.section-heading[id]').forEach(function (heading) {
      if (KEEP_OPEN.indexOf(heading.id) !== -1) return;

      var lead = null;
      var extras = [];
      var node = heading.nextElementSibling;

      while (node && !shouldStop(node)) {
        if (node.tagName === 'P') {
          if (!lead) {
            lead = node;
            node.classList.add('section-lead');
          } else {
            extras.push(node);
          }
        } else if (node.tagName === 'BLOCKQUOTE') {
          extras.push(node);
        }
        node = node.nextElementSibling;
      }

      if (!lead || extras.length === 0) return;

      var wrap = document.createElement('div');
      wrap.className = 'section-more is-collapsed';
      wrap.id = 'more-' + heading.id;

      extras.forEach(function (el) {
        wrap.appendChild(el);
      });

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'section-more-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', wrap.id);
      toggle.innerHTML =
        '<span class="section-more-label">Read more detail</span>' +
        '<span class="section-more-chevron" aria-hidden="true"></span>';

      toggle.addEventListener('click', function () {
        var open = wrap.classList.toggle('is-open');
        wrap.classList.toggle('is-collapsed', !open);
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.querySelector('.section-more-label').textContent =
          open ? 'Show less' : 'Read more detail';
      });

      lead.insertAdjacentElement('afterend', toggle);
      toggle.insertAdjacentElement('afterend', wrap);
    });
  }

  function initMobileJump() {
    var jump = document.getElementById('mobile-jump');
    if (!jump) return;

    var links = jump.querySelectorAll('a[data-section]');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('data-section');
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        scrollToId(id, e);
      });
    });

    function syncJump() {
      var sections = Array.prototype.map.call(links, function (l) {
        return document.getElementById(l.getAttribute('data-section'));
      }).filter(Boolean);

      var activeId = links[0] && links[0].getAttribute('data-section');
      var marker = 120;
      sections.forEach(function (section, i) {
        if (section.getBoundingClientRect().top - marker <= 0) {
          activeId = links[i].getAttribute('data-section');
        }
      });

      links.forEach(function (link) {
        var on = link.getAttribute('data-section') === activeId;
        link.classList.toggle('is-active', on);
        if (on) {
          link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        }
      });
    }

    window.addEventListener('scroll', syncJump, { passive: true });
    syncJump();
  }

  function init() {
    initDisclosures();
    initSectionProgressive();
    initQuickJumps();
    initMobileJump();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
