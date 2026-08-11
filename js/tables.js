(function () {
  'use strict';

  var MOBILE_BP = 768;

  function isMobile() {
    return window.innerWidth < MOBILE_BP;
  }

  function parsePrice(val) {
    if (!val) return 0;
    var raw = String(val);
    if (/POA/i.test(raw)) return -1;
    var s = raw.replace(/[^0-9.]/g, '');
    if (!s) return -1;
    return parseFloat(s) || 0;
  }

  function parseSortValue(val) {
    if (!val) return { type: 'text', value: '' };
    var raw = String(val).trim();
    if (/POA/i.test(raw)) return { type: 'poa', value: -1 };

    var millions = raw.match(/^([\d.,]+)\s*m\b/i);
    if (millions) {
      return { type: 'number', value: parseFloat(millions[1].replace(/,/g, '')) };
    }

    if (raw.match(/£/) || /^from\s+£/i.test(raw)) {
      return { type: 'number', value: parsePrice(raw) };
    }

    var range = raw.match(/£?\s*([\d.,]+)\s*k?\s*[–-]\s*£?\s*([\d.,]+)\s*k?/i);
    if (range) {
      return { type: 'number', value: parseFloat(range[1].replace(/,/g, '')) };
    }

    if (/^under\s+£/i.test(raw) || /^£?\d/i.test(raw)) {
      return { type: 'number', value: parsePrice(raw) };
    }

    return { type: 'text', value: raw };
  }

  function compareValues(av, bv) {
    if (av.type === 'poa' && bv.type === 'poa') return 0;
    if (av.type === 'poa') return 1;
    if (bv.type === 'poa') return -1;
    if (av.type === 'number' && bv.type === 'number') return av.value - bv.value;
    return String(av.value).localeCompare(String(bv.value), undefined, { sensitivity: 'base' });
  }

  function inferTableLabel(table) {
    if (table.getAttribute('data-table-label')) {
      return table.getAttribute('data-table-label');
    }

    var node = table.parentElement;
    while (node && node !== document.body) {
      var prev = node.previousElementSibling;
      while (prev) {
        if (prev.matches && prev.matches('h2, h3')) {
          return prev.textContent.trim();
        }
        var heading = prev.querySelector && prev.querySelector('h2, h3');
        if (heading) return heading.textContent.trim();
        prev = prev.previousElementSibling;
      }
      node = node.parentElement;
    }

    return 'Data table';
  }

  function ensureWrapper(table) {
    var wrap = table.closest('.interactive-table');
    if (wrap) return wrap;

    wrap = document.createElement('div');
    wrap.className = 'interactive-table';
    wrap.setAttribute('data-table-label', inferTableLabel(table));

    var parent = table.parentElement;
    if (parent) {
      parent.insertBefore(wrap, table);
      wrap.appendChild(table);
    }

    return wrap;
  }

  function initTable(wrap) {
    if (wrap.dataset.enhanced) return;
    wrap.dataset.enhanced = 'true';

    var table = wrap.querySelector('.data-table');
    if (!table) return;

    var label = wrap.getAttribute('data-table-label') || inferTableLabel(table);
    var enableSort = table.getAttribute('data-table-sort') !== 'false';
    var enableColumns = table.getAttribute('data-table-columns') !== 'false';
    var thead = table.querySelector('thead');
    var tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    var headers = Array.prototype.map.call(thead.querySelectorAll('th'), function (th, i) {
      return { el: th, label: th.textContent.trim(), index: i, visible: true, sortDir: null };
    });

    var rows = Array.prototype.map.call(tbody.querySelectorAll('tr'), function (tr) {
      var cells = Array.prototype.map.call(tr.querySelectorAll('td'), function (td, i) {
        td.setAttribute('data-label', headers[i] ? headers[i].label : '');
        return td;
      });
      return { el: tr, cells: cells };
    });

    var shell = document.createElement('div');
    shell.className = 'itable';

    var toolbar = document.createElement('div');
    toolbar.className = 'itable-toolbar';
    toolbar.innerHTML =
      '<div class="itable-toolbar-top">' +
        '<span class="itable-label">' + label + '</span>' +
        '<span class="itable-hint" aria-live="polite"></span>' +
      '</div>' +
      '<div class="itable-controls">' +
        '<div class="itable-search-wrap">' +
          '<input type="search" class="itable-search" placeholder="Filter rows…" aria-label="Filter table rows">' +
        '</div>' +
        '<p class="itable-mobile-hint">Tap a row to expand details</p>' +
        '<div class="itable-columns" role="group" aria-label="Toggle columns"></div>' +
      '</div>';

    var desktop = document.createElement('div');
    desktop.className = 'itable-desktop';
    desktop.appendChild(table);

    var mobile = document.createElement('div');
    mobile.className = 'itable-mobile';
    mobile.setAttribute('role', 'list');

    shell.appendChild(toolbar);
    shell.appendChild(desktop);
    shell.appendChild(mobile);
    wrap.appendChild(shell);

    var hint = toolbar.querySelector('.itable-hint');
    var searchInput = toolbar.querySelector('.itable-search');
    var columnsWrap = toolbar.querySelector('.itable-columns');
    var openMobileIndex = 0;
    var externalPredicate = null;

    if (enableColumns && headers.length > 3) {
      headers.forEach(function (h, i) {
        if (i === 0) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'itable-col-toggle is-on';
        btn.textContent = h.label;
        btn.setAttribute('aria-pressed', 'true');
        btn.dataset.col = String(i);
        btn.addEventListener('click', function () {
          h.visible = !h.visible;
          btn.classList.toggle('is-on', h.visible);
          btn.setAttribute('aria-pressed', h.visible ? 'true' : 'false');
          applyColumnVisibility();
          renderMobile();
          updateHint();
        });
        columnsWrap.appendChild(btn);
      });
    } else {
      columnsWrap.remove();
    }

    if (enableSort) {
      headers.forEach(function (h, i) {
        h.el.classList.add('itable-sortable');
        h.el.setAttribute('tabindex', '0');
        h.el.setAttribute('role', 'button');
        h.el.innerHTML =
          '<span class="itable-th-text">' + h.label + '</span>' +
          '<span class="itable-sort-icon" aria-hidden="true"></span>';

        function doSort() {
          sortByColumn(i);
        }

        h.el.addEventListener('click', doSort);
        h.el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            doSort();
          }
        });
      });
    }

    function applyColumnVisibility() {
      headers.forEach(function (h, i) {
        var display = h.visible ? '' : 'none';
        h.el.style.display = i === 0 ? '' : display;
        rows.forEach(function (row) {
          if (row.cells[i]) row.cells[i].style.display = i === 0 ? '' : display;
        });
      });
      table.classList.toggle(
        'has-hidden-cols',
        headers.some(function (h, i) { return i > 0 && !h.visible; })
      );
      updateScrollState();
    }

    function sortByColumn(index) {
      var h = headers[index];
      headers.forEach(function (other, i) {
        if (i !== index) other.sortDir = null;
      });
      h.sortDir = h.sortDir === 'asc' ? 'desc' : 'asc';

      headers.forEach(function (hdr) {
        hdr.el.classList.remove('is-sorted-asc', 'is-sorted-desc');
        if (hdr.sortDir === 'asc') hdr.el.classList.add('is-sorted-asc');
        if (hdr.sortDir === 'desc') hdr.el.classList.add('is-sorted-desc');
      });

      var sorted = rows.slice().sort(function (a, b) {
        var av = a.cells[index] ? parseSortValue(a.cells[index].textContent.trim()) : { type: 'text', value: '' };
        var bv = b.cells[index] ? parseSortValue(b.cells[index].textContent.trim()) : { type: 'text', value: '' };
        var cmp = compareValues(av, bv);
        return h.sortDir === 'asc' ? cmp : -cmp;
      });

      tbody.classList.add('is-reordering');
      sorted.forEach(function (row) {
        tbody.appendChild(row.el);
      });
      rows = sorted;
      setTimeout(function () { tbody.classList.remove('is-reordering'); }, 320);
      renderMobile();
      updateHint();
    }

    function filterRows(query) {
      var q = query.trim().toLowerCase();
      var visibleCount = 0;
      rows.forEach(function (row) {
        var text = row.cells.map(function (c) { return c.textContent; }).join(' ').toLowerCase();
        var matchesExternal = !externalPredicate || externalPredicate(row.el);
        var show = matchesExternal && (!q || text.indexOf(q) !== -1);
        row.el.classList.toggle('is-filtered-out', !show);
        row.el.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
      renderMobile(q);
      hint.textContent = q ? visibleCount + ' of ' + rows.length + ' rows' : rows.length + ' rows';
      return visibleCount;
    }

    function renderMobile(filterQuery) {
      mobile.innerHTML = '';
      var q = (filterQuery || '').trim().toLowerCase();
      var cardIndex = 0;

      rows.forEach(function (row, rowIndex) {
        var text = row.cells.map(function (c) { return c.textContent; }).join(' ').toLowerCase();
        if (externalPredicate && !externalPredicate(row.el)) return;
        if (q && text.indexOf(q) === -1) return;

        var primary = row.cells[0] ? row.cells[0].textContent.trim() : 'Row ' + (rowIndex + 1);
        var card = document.createElement('div');
        card.className = 'itable-card';
        card.setAttribute('role', 'listitem');

        var isOpen = cardIndex === openMobileIndex;
        if (isOpen) card.classList.add('is-open');

        var trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'itable-card-trigger';
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        trigger.innerHTML =
          '<span class="itable-card-title">' + primary + '</span>' +
          '<span class="itable-card-chevron" aria-hidden="true"></span>';

        var panel = document.createElement('div');
        panel.className = 'itable-card-panel';
        var inner = document.createElement('div');
        inner.className = 'itable-card-panel-inner';

        row.cells.forEach(function (cell, ci) {
          if (ci === 0) return;
          if (!headers[ci] || !headers[ci].visible) return;
          var field = document.createElement('div');
          field.className = 'itable-card-field';
          field.innerHTML =
            '<div class="itable-card-key">' + headers[ci].label + '</div>' +
            '<div class="itable-card-val">' + cell.innerHTML + '</div>';
          inner.appendChild(field);
        });

        panel.appendChild(inner);
        card.appendChild(trigger);
        card.appendChild(panel);
        mobile.appendChild(card);

        trigger.addEventListener('click', function () {
          var wasOpen = card.classList.contains('is-open');
          Array.prototype.forEach.call(mobile.querySelectorAll('.itable-card'), function (c) {
            c.classList.remove('is-open');
            var t = c.querySelector('.itable-card-trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
          });
          if (!wasOpen) {
            card.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            openMobileIndex = cardIndex;
          } else {
            openMobileIndex = -1;
          }
        });

        cardIndex++;
      });
    }

    function updateHint() {
      var hidden = headers.filter(function (h, i) { return i > 0 && !h.visible; }).length;
      var parts = [rows.length + ' rows'];
      if (hidden) parts.push(hidden + ' column' + (hidden > 1 ? 's' : '') + ' hidden');
      if (!searchInput.value.trim()) hint.textContent = parts.join(' · ');
    }

    function updateScrollState() {
      if (isMobile()) {
        desktop.classList.remove('is-scrollable');
        return;
      }
      desktop.classList.toggle(
        'is-scrollable',
        table.scrollWidth > desktop.clientWidth + 1
      );
    }

    function updateLayout() {
      wrap.classList.toggle('is-mobile', isMobile());
      updateScrollState();
    }

    function applyExternalFilter(predicate) {
      externalPredicate = typeof predicate === 'function' ? predicate : null;
      var q = searchInput.value.trim().toLowerCase();
      var visibleCount = 0;
      rows.forEach(function (row) {
        var text = row.cells.map(function (c) { return c.textContent; }).join(' ').toLowerCase();
        var show = (!externalPredicate || externalPredicate(row.el)) && (!q || text.indexOf(q) !== -1);
        row.el.classList.toggle('is-filtered-out', !show);
        row.el.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
      renderMobile(q);
      hint.textContent = visibleCount + ' of ' + rows.length + ' rows';
    }

    function applyExternalOrder(order) {
      if (!Array.isArray(order) || !order.length) return;
      var orderIndex = {};
      order.forEach(function (id, index) { orderIndex[id] = index; });
      rows.sort(function (a, b) {
        var aIndex = Object.prototype.hasOwnProperty.call(orderIndex, a.el.getAttribute('data-company-id')) ? orderIndex[a.el.getAttribute('data-company-id')] : order.length;
        var bIndex = Object.prototype.hasOwnProperty.call(orderIndex, b.el.getAttribute('data-company-id')) ? orderIndex[b.el.getAttribute('data-company-id')] : order.length;
        return aIndex - bIndex;
      });
      rows.forEach(function (row) { tbody.appendChild(row.el); });
      renderMobile(searchInput.value);
    }

    wrap.addEventListener('fdi:table-filter', function (event) {
      applyExternalFilter(event.detail && event.detail.predicate);
    });

    wrap.addEventListener('fdi:table-order', function (event) {
      applyExternalOrder(event.detail && event.detail.order);
    });

    searchInput.addEventListener('input', function () {
      filterRows(searchInput.value);
    });

    applyColumnVisibility();
    renderMobile();
    updateHint();
    updateLayout();

    window.addEventListener('resize', updateLayout, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(updateScrollState);
      ro.observe(desktop);
      ro.observe(table);
    }
  }

  function initAll(root) {
    var scope = root || document;
    scope.querySelectorAll('table.data-table').forEach(function (table) {
      initTable(ensureWrapper(table));
    });
  }

  window.LoudTables = { init: initAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }
})();
