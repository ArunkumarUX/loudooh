(function () {
  'use strict';

  var PAGE_SIZE = 25;
  var CATALOG_URL = '../js/fortune500-catalog.json';
  var WATCHLIST = {
    amazon: true,
    microsoft: true,
    nvidia: true,
    'samsung electronics': true,
    'saudi aramco': true,
    volkswagen: true
  };

  var US_STATES = {
    AL: 1, AK: 1, AZ: 1, AR: 1, CA: 1, CO: 1, CT: 1, DE: 1, FL: 1, GA: 1, HI: 1, ID: 1, IL: 1, IN: 1, IA: 1, KS: 1,
    KY: 1, LA: 1, ME: 1, MD: 1, MA: 1, MI: 1, MN: 1, MS: 1, MO: 1, MT: 1, NE: 1, NV: 1, NH: 1, NJ: 1, NM: 1, NY: 1,
    NC: 1, ND: 1, OH: 1, OK: 1, OR: 1, PA: 1, RI: 1, SC: 1, SD: 1, TN: 1, TX: 1, UT: 1, VT: 1, VA: 1, WA: 1, WV: 1,
    WI: 1, WY: 1, DC: 1
  };

  var COUNTRY_ALIASES = {
    Britain: 'United Kingdom',
    UK: 'United Kingdom'
  };

  var table = document.getElementById('fdi-catalog-table');
  var statusEl = document.getElementById('fdi-catalog-status');
  var statusBottom = document.getElementById('fdi-catalog-status-bottom');
  var pagerTop = document.getElementById('fdi-catalog-pager-top');
  var pagerBottom = document.getElementById('fdi-catalog-pager-bottom');
  var filters = document.getElementById('fdi-catalog-filters');
  var queryInput = document.getElementById('fdi-catalog-query');
  var countrySelect = document.getElementById('fdi-catalog-country');
  if (!table || !filters) return;

  var catalog = [];
  var state = { query: '', country: 'all', page: 1 };

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeCountry(value) {
    var trimmed = String(value || '').trim();
    return COUNTRY_ALIASES[trimmed] || trimmed;
  }

  function countryFromRow(row) {
    if (row.country) return normalizeCountry(row.country);
    if (!row.hq) return '';
    var parts = row.hq.split(',').map(function (part) { return part.trim(); }).filter(Boolean);
    if (!parts.length) return '';
    var last = parts[parts.length - 1];
    if (US_STATES[last]) return 'United States';
    return normalizeCountry(last);
  }

  function isWatchlist(name) {
    return !!WATCHLIST[String(name || '').toLowerCase()];
  }

  function formatRevenue(value) {
    var num = Number(String(value || '').replace(/,/g, ''));
    if (!num) return '—';
    if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'bn';
    return '$' + num.toLocaleString('en-US') + 'm';
  }

  function rowRevenue(row) {
    return row.revenueUsdM || row.revenueUsdMillion || row.revenue || '';
  }

  function domainFromWebsite(website) {
    if (!website) return '';
    try {
      var url = website.indexOf('http') === 0 ? website : 'https://' + website;
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (err) {
      return '';
    }
  }

  function filteredRows() {
    var query = state.query.trim().toLowerCase();
    return catalog.filter(function (row) {
      if (state.country !== 'all' && row.displayCountry !== state.country) return false;
      if (!query) return true;
      return row.searchText.indexOf(query) !== -1;
    });
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
    if (statusBottom) statusBottom.textContent = text;
  }

  function renderPager(el, page, totalPages) {
    if (!el) return;
    if (totalPages <= 1) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML =
      '<button type="button" class="fdi-pager-button" data-page-delta="-1"' + (page <= 1 ? ' disabled' : '') + '>Previous</button>' +
      '<span class="fdi-pager-status">Page ' + page + ' / ' + totalPages + '</span>' +
      '<button type="button" class="fdi-pager-button" data-page-delta="1"' + (page >= totalPages ? ' disabled' : '') + '>Next</button>';
  }

  function renderTable() {
    var rows = filteredRows();
    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * PAGE_SIZE;
    var pageRows = rows.slice(start, start + PAGE_SIZE);
    var from = rows.length ? start + 1 : 0;
    var to = Math.min(start + PAGE_SIZE, rows.length);
    var statusText = rows.length
      ? 'Showing ' + from + '–' + to + ' of ' + rows.length + ' companies'
      : 'No companies match these list filters';

    setStatus(statusText);
    renderPager(pagerTop, state.page, totalPages);
    renderPager(pagerBottom, state.page, totalPages);

    if (!pageRows.length) {
      table.innerHTML = '<p class="fdi-empty-inline">No companies match these list filters.</p>';
      return;
    }

    table.innerHTML =
      '<table class="data-table" data-table-columns="false" data-table-sort="false" aria-describedby="fdi-catalog-status">' +
        '<caption class="visually-hidden">Fortune Global 500 company list</caption>' +
        '<thead><tr><th>Rank</th><th>Company</th><th>Country</th><th>Sector</th><th>HQ city</th><th>Revenue</th></tr></thead>' +
        '<tbody>' +
          pageRows.map(function (row) {
            var watch = isWatchlist(row.name);
            var website = row.website
              ? '<a href="' + escapeHTML(row.website) + '" target="_blank" rel="noreferrer noopener">' + escapeHTML(domainFromWebsite(row.website) || row.website) + '</a>'
              : '';
            return '<tr' + (watch ? ' class="fdi-catalog-row--watchlist"' : '') + '>' +
              '<td><strong>#' + escapeHTML(row.rank) + '</strong></td>' +
              '<td class="cell-format"><strong>' + escapeHTML(row.name) + '</strong>' +
                (watch ? '<span class="fdi-evidence-badge fdi-evidence-badge--confirmed">Watchlist</span>' : '') +
                (website ? '<span class="fdi-table-subtext">' + website + '</span>' : '') +
              '</td>' +
              '<td>' + escapeHTML(row.displayCountry || '—') + '</td>' +
              '<td>' + escapeHTML(row.sector || row.industry || row.subSector || '—') + '</td>' +
              '<td>' + escapeHTML(row.headquartersCity || row.hq || '—') + '</td>' +
              '<td>' + escapeHTML(formatRevenue(rowRevenue(row))) + '</td>' +
            '</tr>';
          }).join('') +
        '</tbody>' +
      '</table>';
  }

  function populateCountries() {
    var countries = {};
    catalog.forEach(function (row) {
      if (row.displayCountry) countries[row.displayCountry] = true;
    });
    Object.keys(countries).sort().forEach(function (country) {
      var option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      countrySelect.appendChild(option);
    });
  }

  function onPagerClick(event) {
    var button = event.target.closest('[data-page-delta]');
    if (!button || button.disabled) return;
    state.page += Number(button.getAttribute('data-page-delta'));
    renderTable();
    if (event.currentTarget === pagerBottom) {
      table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  filters.addEventListener('input', function (event) {
    if (event.target === queryInput) {
      state.query = queryInput.value;
      state.page = 1;
      renderTable();
    }
  });

  filters.addEventListener('change', function (event) {
    if (event.target === countrySelect) {
      state.country = countrySelect.value;
      state.page = 1;
      renderTable();
    }
  });

  filters.addEventListener('reset', function () {
    window.setTimeout(function () {
      state.query = '';
      state.country = 'all';
      state.page = 1;
      renderTable();
    }, 0);
  });

  pagerTop.addEventListener('click', onPagerClick);
  pagerBottom.addEventListener('click', onPagerClick);

  fetch(CATALOG_URL)
    .then(function (response) {
      if (!response.ok) throw new Error('Could not load Fortune Global 500 list');
      return response.json();
    })
    .then(function (rows) {
      catalog = rows.map(function (row) {
        var displayCountry = countryFromRow(row);
        return Object.assign({}, row, {
          displayCountry: displayCountry,
          searchText: [row.name, displayCountry, row.sector, row.subSector, row.industry, row.headquartersCity, row.hq].join(' ').toLowerCase()
        });
      });
      populateCountries();
      renderTable();
    })
    .catch(function () {
      setStatus('The Fortune Global 500 list could not be loaded.');
      table.innerHTML = '<p class="fdi-empty-inline">The Fortune Global 500 list could not be loaded.</p>';
    });
})();
