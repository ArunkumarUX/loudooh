(function () {
  'use strict';

  var FORTUNE_SOURCE = 'https://fortune.com/ranking/global500/';
  var PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };
  var PRESENCE_ORDER = { Yes: 0, Partial: 1, No: 2 };

  var FDI_COMPANIES = [
    {
      id: 'amazon',
      name: 'Amazon',
      fortuneRank: 2,
      revenueUsdM: 574785,
      sector: 'Technology',
      subSector: 'Cloud computing & e-commerce',
      sectorEvidence: 'Derived classification',
      headquarters: { country: 'United States', city: 'Seattle' },
      dubai: {
        present: 'Yes',
        legalEntities: ['Not publicly disclosed in reviewed source set'],
        types: ['Fulfilment centre', 'Cloud infrastructure'],
        leadershipName: null,
        leadershipPosition: null,
        location: 'Dubai South Logistics District; AWS UAE Region site details not publicly disclosed',
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Dubai Media Office confirms a new fulfilment centre in Dubai South; AWS separately confirms the UAE cloud region.'
      },
      otherUae: {
        present: 'Yes',
        types: ['E-commerce logistics', 'Cloud services'],
        locations: ['Dubai South', 'UAE-wide AWS region'],
        evidenceStatus: 'Confirmed',
        evidenceNote: 'The public evidence confirms UAE operations, but not a complete legal-entity map.'
      },
      regional: {
        present: 'Partial',
        countries: ['UAE', 'Bahrain', 'GCC markets served from regional infrastructure'],
        types: ['Cloud infrastructure', 'E-commerce fulfilment'],
        locations: ['Dubai', 'UAE region'],
        evidenceStatus: 'Partial evidence',
        evidenceNote: 'Public sources support a Gulf infrastructure hub, not a complete country-by-country operating footprint.'
      },
      recentDevelopments: [
        'AWS launched its Middle East (UAE) Region, enabling local cloud workloads and data residency.',
        'Amazon opened a fulfilment centre in Dubai South, linked to the Jebel Ali and Al Maktoum logistics corridor.'
      ],
      strategicPriorities: ['AI and cloud infrastructure', 'Faster UAE delivery and fulfilment', 'Regional seller and logistics ecosystem'],
      opportunityType: 'Both',
      dubaiOpportunity: 'Attract additional AWS ecosystem, AI compute, managed-service and logistics suppliers into the Dubai South / Jebel Ali corridor.',
      priority: 'High',
      priorityRationale: 'Amazon already has a meaningful Dubai footprint and its cloud-plus-logistics growth agenda creates clear expansion pathways.',
      evidenceFlags: ['Dubai facility confirmed by UAE government source', 'Dubai legal entity requires registry verification', 'Fortune sector/sub-sector is a derived classification'],
      sources: [
        { label: 'Fortune Global 500', url: FORTUNE_SOURCE, type: 'Fortune' },
        { label: 'Dubai Media Office · Amazon fulfilment centre', url: 'https://www.mediaoffice.ae/en/news/2023/march/21-03/amazon-opening-a-new-fulfillment-center-in-dubai-south', type: 'UAE government' },
        { label: 'Amazon · AWS UAE Region', url: 'https://press.aboutamazon.com/2022/8/aws-launches-region-in-the-united-arab-emirates', type: 'Official company' }
      ]
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      fortuneRank: 26,
      revenueUsdM: 211915,
      sector: 'Technology',
      subSector: 'Cloud, enterprise software & cybersecurity',
      sectorEvidence: 'Derived classification',
      headquarters: { country: 'United States', city: 'Redmond' },
      dubai: {
        present: 'Yes',
        legalEntities: ['Not publicly disclosed in reviewed source set'],
        types: ['Regional office', 'Sales and partner management'],
        leadershipName: null,
        leadershipPosition: null,
        location: 'Dubai Internet City, Building 8, Sheikh Zayed Road',
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Microsoft lists a Gulf Regional Office in Dubai Internet City.'
      },
      otherUae: {
        present: 'Yes',
        types: ['Engineering development centre', 'AI and cloud technology development'],
        locations: ['Abu Dhabi'],
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Microsoft announced an expanded Global Engineering Development Center footprint in Abu Dhabi.'
      },
      regional: {
        present: 'Yes',
        countries: ['Bahrain', 'Kuwait', 'Oman', 'Qatar', 'UAE'],
        types: ['Gulf regional office coverage', 'Cloud and enterprise technology'],
        locations: ['Dubai regional office', 'GCC markets'],
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Microsoft’s worldwide office directory states that the Gulf regional office covers these markets.'
      },
      recentDevelopments: [
        'Microsoft expanded its global engineering development centre footprint to Abu Dhabi.',
        'The UAE engineering agenda is positioned around AI innovation, cloud technologies and advanced cybersecurity.'
      ],
      strategicPriorities: ['AI and cloud adoption', 'Cybersecurity capabilities', 'Regional engineering and partner ecosystem'],
      opportunityType: 'Expansion',
      dubaiOpportunity: 'Position Dubai as the commercial and partner-management base for a larger Gulf AI, cloud-security and managed-services ecosystem alongside Abu Dhabi engineering.',
      priority: 'High',
      priorityRationale: 'Microsoft has an established Dubai regional role and a visible UAE investment pattern that can support expansion-led engagement.',
      evidenceFlags: ['Dubai regional office confirmed by Microsoft', 'Dubai legal entity and leadership require registry verification', 'Fortune sector/sub-sector is a derived classification'],
      sources: [
        { label: 'Fortune Global 500', url: FORTUNE_SOURCE, type: 'Fortune' },
        { label: 'Microsoft Worldwide Sites', url: 'https://www.microsoft.com/en-us/worldwide', type: 'Official company' },
        { label: 'Microsoft · Abu Dhabi engineering centre', url: 'https://news.microsoft.com/source/2024/09/24/microsoft-expands-its-global-engineering-development-centers-footprint-to-the-uaes-capital-abu-dhabi/', type: 'Official company' }
      ]
    },
    {
      id: 'nvidia',
      name: 'Nvidia',
      fortuneRank: 222,
      revenueUsdM: 60922,
      sector: 'Technology',
      subSector: 'Semiconductors, AI accelerators & data-centre platforms',
      sectorEvidence: 'Derived classification',
      headquarters: { country: 'United States', city: 'Santa Clara' },
      dubai: {
        present: 'Partial',
        legalEntities: ['No confirmed NVIDIA corporate legal entity in the source set'],
        types: ['Channel / reseller ecosystem'],
        leadershipName: null,
        leadershipPosition: null,
        location: 'Dubai-based reseller listing; corporate office ownership is not confirmed',
        evidenceStatus: 'Partial evidence',
        evidenceNote: 'NVIDIA’s reseller directory evidences a Dubai channel address, not an NVIDIA-owned office.'
      },
      otherUae: {
        present: 'Partial',
        types: ['Systems integration and channel partners'],
        locations: ['Dubai / UAE'],
        evidenceStatus: 'Partial evidence',
        evidenceNote: 'UAE ecosystem presence is visible through channel partners; direct operating footprint requires verification.'
      },
      regional: {
        present: 'Partial',
        countries: ['UAE', 'Wider EMEA ecosystem'],
        types: ['AI infrastructure partnerships', 'Reseller and systems integration'],
        locations: ['Dubai channel ecosystem'],
        evidenceStatus: 'Partial evidence',
        evidenceNote: 'The reviewed source set does not establish a complete GCC country footprint.'
      },
      recentDevelopments: [
        'NVIDIA’s FY2026 results continue to frame accelerated computing and AI infrastructure as the core growth engine.',
        'The public EMEA reseller directory shows a Dubai-based channel point for NVIDIA networking products.'
      ],
      strategicPriorities: ['Accelerated computing', 'AI data-centre platforms', 'Partner-led ecosystem scale'],
      opportunityType: 'Attraction',
      dubaiOpportunity: 'Pursue a confirmed NVIDIA regional office, AI solutions lab or partner-led GPU / sovereign-AI hub in Dubai.',
      priority: 'High',
      priorityRationale: 'The company’s growth is strongly aligned with Dubai’s AI ambition, while the absence of a confirmed corporate office creates an attraction gap.',
      evidenceFlags: ['Dubai evidence is reseller-based, not corporate-office evidence', 'GCC footprint is partially evidenced', 'Fortune sector/sub-sector is a derived classification'],
      sources: [
        { label: 'Fortune Global 500', url: FORTUNE_SOURCE, type: 'Fortune' },
        { label: 'NVIDIA EMEA reseller directory', url: 'https://www.nvidia.com/en-eu/networking/resellers/emea/', type: 'Official company' },
        { label: 'NVIDIA FY2026 results', url: 'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Fourth-Quarter-and-Fiscal-2026/', type: 'Official company' }
      ]
    },
    {
      id: 'samsung',
      name: 'Samsung Electronics',
      fortuneRank: 31,
      revenueUsdM: 198257,
      sector: 'Technology',
      subSector: 'Semiconductors & consumer electronics',
      sectorEvidence: 'Derived classification',
      headquarters: { country: 'South Korea', city: 'Suwon' },
      dubai: {
        present: 'Yes',
        legalEntities: ['Samsung Gulf Electronics (Dubai Branch)'],
        types: ['Regional office', 'Distribution and sales'],
        leadershipName: null,
        leadershipPosition: null,
        location: 'Jebel Ali Free Zone (JAFZA), Dubai',
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Samsung Gulf terms identify a Dubai branch and Jebel Ali Free Zone address.'
      },
      otherUae: {
        present: 'Yes',
        types: ['Retail, distribution and after-sales network'],
        locations: ['Dubai and UAE market'],
        evidenceStatus: 'Confirmed',
        evidenceNote: 'UAE consumer and business channels are publicly visible; the source set does not map every operating entity.'
      },
      regional: {
        present: 'Partial',
        countries: ['GCC markets served by Samsung Gulf'],
        types: ['Regional sales and distribution'],
        locations: ['Dubai regional base', 'GCC markets'],
        evidenceStatus: 'Partial evidence',
        evidenceNote: 'The Dubai branch is confirmed, but a full country-by-country legal-entity map requires further research.'
      },
      recentDevelopments: [
        'Samsung and Broadcom expanded collaboration across memory and foundry technologies.',
        'High-bandwidth memory and AI accelerator demand reinforce the strategic importance of advanced memory supply chains.'
      ],
      strategicPriorities: ['AI memory and HBM', 'Semiconductor and foundry capability', 'Regional electronics distribution'],
      opportunityType: 'Expansion',
      dubaiOpportunity: 'Explore a JAFZA-based expansion of Samsung’s electronics, AI-memory logistics, advanced-systems and regional after-sales ecosystem.',
      priority: 'Medium',
      priorityRationale: 'Samsung already has a strong Dubai distribution base; the near-term opportunity is targeted value-chain deepening rather than first entry.',
      evidenceFlags: ['Dubai branch confirmed by Samsung Gulf terms', 'Regional legal-entity map and leadership require verification', 'Fortune sector/sub-sector is a derived classification'],
      sources: [
        { label: 'Fortune Global 500', url: FORTUNE_SOURCE, type: 'Fortune' },
        { label: 'Samsung Gulf · Terms and conditions', url: 'https://www.samsung.com/ae/info/terms-and-conditions/', type: 'Official company' },
        { label: 'Samsung · Broadcom collaboration', url: 'https://news.samsung.com/global/samsung-electronics-and-broadcom-expand-strategic-collaboration-across-memory-and-foundry-technologies', type: 'Official company' }
      ]
    },
    {
      id: 'saudi-aramco',
      name: 'Saudi Aramco',
      fortuneRank: 4,
      revenueUsdM: 494890,
      sector: 'Energy',
      subSector: 'Integrated oil & gas, trading & energy transition',
      sectorEvidence: 'Derived classification',
      headquarters: { country: 'Saudi Arabia', city: 'Dhahran' },
      dubai: {
        present: 'Yes',
        legalEntities: ['Aramco Trading Dubai (ATD)'],
        types: ['Trading and commercial office'],
        leadershipName: null,
        leadershipPosition: null,
        location: 'ICD Brookfield Plaza, DIFC, Dubai',
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Aramco Trading lists its Dubai office and ATD entity publicly.'
      },
      otherUae: {
        present: 'Yes',
        types: ['Trading and supply-chain activity'],
        locations: ['Fujairah', 'Dubai'],
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Aramco Trading has publicly announced a Fujairah office alongside its Dubai presence.'
      },
      regional: {
        present: 'Yes',
        countries: ['Saudi Arabia', 'UAE', 'GCC markets'],
        types: ['Energy trading', 'Commercial and supply-chain activity'],
        locations: ['Dhahran', 'Dubai', 'Fujairah', 'Gulf markets'],
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Aramco Trading describes its commercial activity across the Gulf and surrounding markets.'
      },
      recentDevelopments: [
        'Aramco strategy highlights selective diversification into digital, new energies, transition minerals and industrials.',
        'The company continues to develop carbon-management themes including carbon capture and direct-air-capture activity.'
      ],
      strategicPriorities: ['Trading and integrated energy value chain', 'Carbon management and CCUS', 'New energies and industrial diversification'],
      opportunityType: 'Expansion',
      dubaiOpportunity: 'Target carbon-management, low-carbon fuels, energy-services and trading suppliers around the Dubai / Fujairah corridor.',
      priority: 'High',
      priorityRationale: 'Aramco already has a Dubai trading foothold and its diversification agenda gives Dubai a credible platform for adjacent energy services.',
      evidenceFlags: ['Dubai entity and address confirmed by Aramco Trading', 'Dubai leadership is not publicly disclosed in the source set', 'Fortune sector/sub-sector is a derived classification'],
      sources: [
        { label: 'Fortune Global 500', url: FORTUNE_SOURCE, type: 'Fortune' },
        { label: 'Aramco Trading Dubai', url: 'https://www.aramcotrading.com/en/about-us/our-offices/aramco-trading-dubai/', type: 'Official company' },
        { label: 'Aramco · Strategy', url: 'https://www.aramco.com/en/investors/annual-report/strategy', type: 'Official company' },
        { label: 'Aramco · Supporting the energy transition', url: 'https://www.aramco.com/en/sustainability/climate-and-energy/supporting-the-energy-transition', type: 'Official company' }
      ]
    },
    {
      id: 'volkswagen',
      name: 'Volkswagen',
      fortuneRank: 11,
      revenueUsdM: 348408,
      sector: 'Industrials',
      subSector: 'Automotive & mobility',
      sectorEvidence: 'Derived classification',
      headquarters: { country: 'Germany', city: 'Wolfsburg' },
      dubai: {
        present: 'Yes',
        legalEntities: ['Volkswagen Group Sales Middle East FZCO'],
        types: ['Regional headquarters', 'Sales and distribution'],
        leadershipName: null,
        leadershipPosition: null,
        location: 'Dubai regional office; free-zone detail not specified in the reviewed source',
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Volkswagen Group Middle East materials and procurement terms identify the Dubai-based regional operation.'
      },
      otherUae: {
        present: 'Yes',
        types: ['Dealer, sales and after-sales network'],
        locations: ['Dubai and UAE market'],
        evidenceStatus: 'Confirmed',
        evidenceNote: 'The group’s UAE market presence is publicly visible through its regional and dealer network.'
      },
      regional: {
        present: 'Yes',
        countries: ['Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman', 'UAE'],
        types: ['Regional sales, distribution and dealer network'],
        locations: ['Dubai regional office', 'GCC markets'],
        evidenceStatus: 'Confirmed',
        evidenceNote: 'Volkswagen Group Middle East states that the Dubai regional office oversees the GCC markets listed.'
      },
      recentDevelopments: [
        'Volkswagen Group and Qualcomm signed a letter of intent to support next-generation driving experiences.',
        'The software-defined vehicle agenda increases demand for connected mobility and automotive technology partners.'
      ],
      strategicPriorities: ['Software-defined vehicles', 'EV and connected mobility', 'Regional procurement and distribution'],
      opportunityType: 'Expansion',
      dubaiOpportunity: 'Build a Dubai-based automotive software, EV infrastructure and connected-mobility supplier ecosystem around the existing regional office.',
      priority: 'Medium',
      priorityRationale: 'The Dubai regional base is established; the opportunity is to deepen the supplier and technology ecosystem around a visible mobility transition.',
      evidenceFlags: ['Dubai regional entity confirmed in procurement terms', 'Dubai leadership and free-zone detail require verification', 'Fortune sector/sub-sector is a derived classification'],
      sources: [
        { label: 'Fortune Global 500', url: FORTUNE_SOURCE, type: 'Fortune' },
        { label: 'Volkswagen Group Middle East · About', url: 'https://volkswagengroup-me.com/en/group/about', type: 'Official company' },
        { label: 'Volkswagen Group Sales Middle East FZCO · Terms', url: 'https://vwgroupsupply.com/one-kbp-pub/media/shared_media/documents_1/einkaufsbedingungen/volkswagen_group_sales_middle_east_fzco/VWGSME_Guidelines_for_Request_for_Proposal_Tender_Terms_and_Conditions_15.04.2024.pdf', type: 'Official company' },
        { label: 'Volkswagen Group · Qualcomm letter of intent', url: 'https://www.volkswagen-group.com/en/press-releases/volkswagen-group-and-qualcomm-sign-letter-of-intent-to-power-next-generation-driving-experiences-20061', type: 'Official company' }
      ]
    }
  ];

  var state = {
    query: '',
    priority: 'all',
    presence: 'all',
    opportunity: 'all',
    sort: 'priority'
  };

  var root = document.querySelector('.fdi-page');
  var companyList = document.getElementById('fdi-company-list');
  var sectorSignals = document.getElementById('fdi-sector-signals');
  var matrix = document.getElementById('fdi-matrix');
  var resultsStatus = document.getElementById('fdi-results-status');
  var filters = document.getElementById('fdi-filters');

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatRank(value) {
    return '#' + value;
  }

  function formatRevenue(value) {
    if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'bn';
    return '$' + value.toLocaleString('en-US') + 'm';
  }

  function formatRevenueDetail(value) {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: value % 1 ? 1 : 0, maximumFractionDigits: 1 }) + 'm';
  }

  function listHTML(values) {
    if (!values || !values.length) return '<span class="fdi-muted">Not publicly disclosed</span>';
    return '<ul class="fdi-inline-list">' + values.map(function (value) {
      return '<li>' + escapeHTML(value) + '</li>';
    }).join('') + '</ul>';
  }

  function statusClass(value) {
    return String(value).toLowerCase();
  }

  function statusLabel(value) {
    return value === 'Partial' ? 'Partial' : value;
  }

  function priorityClass(value) {
    return String(value).toLowerCase();
  }

  function recordSearchText(company) {
    return [
      company.name,
      company.sector,
      company.subSector,
      company.headquarters.country,
      company.headquarters.city,
      company.dubai.legalEntities.join(' '),
      company.dubai.types.join(' '),
      company.dubai.location,
      company.otherUae.types.join(' '),
      company.otherUae.locations.join(' '),
      company.regional.countries.join(' '),
      company.regional.types.join(' '),
      company.dubaiOpportunity,
      company.recentDevelopments.join(' '),
      company.strategicPriorities.join(' ')
    ].join(' ').toLowerCase();
  }

  function matchesCompany(company) {
    var query = state.query.trim().toLowerCase();
    if (query && recordSearchText(company).indexOf(query) === -1) return false;
    if (state.priority !== 'all' && company.priority.toLowerCase() !== state.priority) return false;
    if (state.presence !== 'all' && company.dubai.present.toLowerCase() !== state.presence) return false;
    if (state.opportunity !== 'all' && company.opportunityType.toLowerCase() !== state.opportunity) return false;
    return true;
  }

  function sortCompanies(companies) {
    return companies.slice().sort(function (a, b) {
      var comparison = 0;
      if (state.sort === 'rank') comparison = a.fortuneRank - b.fortuneRank;
      else if (state.sort === 'revenue') comparison = b.revenueUsdM - a.revenueUsdM;
      else comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return comparison || a.fortuneRank - b.fortuneRank;
    });
  }

  function filteredCompanies() {
    return sortCompanies(FDI_COMPANIES.filter(matchesCompany));
  }

  function setKpi(name, value) {
    document.querySelectorAll('[data-fdi-kpi="' + name + '"]').forEach(function (element) {
      element.textContent = value;
    });
  }

  function renderKpis() {
    var high = FDI_COMPANIES.filter(function (company) { return company.priority === 'High'; }).length;
    var confirmed = FDI_COMPANIES.filter(function (company) { return company.dubai.present === 'Yes'; }).length;
    var partial = FDI_COMPANIES.filter(function (company) { return company.dubai.present === 'Partial'; }).length;
    var attraction = FDI_COMPANIES.filter(function (company) { return company.opportunityType === 'Attraction' || company.opportunityType === 'Both'; }).length;
    setKpi('total', String(FDI_COMPANIES.length));
    setKpi('high', String(high));
    setKpi('footprint', confirmed + ' + ' + partial);
    setKpi('attraction', String(attraction));
  }

  function renderSectorSignals(companies) {
    var sectorMap = {};
    companies.forEach(function (company) {
      if (!sectorMap[company.sector]) sectorMap[company.sector] = { count: 0, high: 0, medium: 0, low: 0 };
      sectorMap[company.sector].count += 1;
      sectorMap[company.sector][company.priority.toLowerCase()] += 1;
    });

    var sectors = Object.keys(sectorMap).sort(function (a, b) {
      return sectorMap[b].count - sectorMap[a].count || a.localeCompare(b);
    });

    if (!sectors.length) {
      sectorSignals.innerHTML = '<p class="fdi-empty-inline">No sector signal for the current filters.</p>';
      return;
    }

    sectorSignals.innerHTML = sectors.map(function (sector) {
      var signal = sectorMap[sector];
      var score = Math.round(((signal.high * 1) + (signal.medium * 0.65) + (signal.low * 0.3)) / signal.count * 100);
      return '<div class="fdi-sector-row">' +
        '<div class="fdi-sector-row-top"><strong>' + escapeHTML(sector) + '</strong><span>' + signal.count + ' target' + (signal.count === 1 ? '' : 's') + '</span></div>' +
        '<div class="fdi-sector-bar" role="img" aria-label="' + escapeHTML(sector) + ' readiness ' + score + ' percent"><span style="width:' + score + '%"></span></div>' +
        '<div class="fdi-sector-row-meta"><span>' + signal.high + ' high</span><span>' + signal.medium + ' medium</span><span>' + score + '% readiness</span></div>' +
      '</div>';
    }).join('');
  }

  function renderMatrixTable(companies) {
    var tableRows = companies.map(function (company) {
      var opportunityLabel = company.opportunityType === 'Both' ? 'Attract + expand' : company.opportunityType;
      return '<tr data-company-id="' + escapeHTML(company.id) + '">' +
        '<td class="cell-format"><strong>' + escapeHTML(company.name) + '</strong><span class="fdi-table-subtext">' + escapeHTML(company.subSector) + '</span></td>' +
        '<td><strong>' + formatRank(company.fortuneRank) + '</strong></td>' +
        '<td>' + escapeHTML(company.sector) + '</td>' +
        '<td>' + escapeHTML(company.headquarters.city) + ', ' + escapeHTML(company.headquarters.country) + '</td>' +
        '<td>' + escapeHTML(formatRevenue(company.revenueUsdM)) + '</td>' +
        '<td><span class="fdi-presence-chip fdi-presence-chip--' + statusClass(company.dubai.present) + '">' + statusLabel(company.dubai.present) + '</span></td>' +
        '<td>' + escapeHTML(opportunityLabel) + '</td>' +
        '<td><span class="fdi-priority-badge fdi-priority-badge--' + priorityClass(company.priority) + '">' + escapeHTML(company.priority) + '</span></td>' +
      '</tr>';
    }).join('');

    matrix.innerHTML = '<table class="data-table" data-table-columns="false" data-table-sort="false" aria-describedby="fdi-results-status"><caption class="visually-hidden">Fortune Global 500 target matrix</caption><thead><tr><th>Company</th><th>Rank</th><th>Sector</th><th>HQ</th><th>Revenue</th><th>Dubai</th><th>Opportunity</th><th>Priority</th></tr></thead><tbody>' + tableRows + '</tbody></table>';
  }

  function detailItem(label, value, full) {
    return '<div class="fdi-detail-item' + (full ? ' fdi-detail-item--full' : '') + '"><dt>' + escapeHTML(label) + '</dt><dd>' + value + '</dd></div>';
  }

  function renderCompanyCard(company, index) {
    var leadership = company.dubai.leadershipName ? escapeHTML(company.dubai.leadershipName) + ' · ' + escapeHTML(company.dubai.leadershipPosition || '') : '<span class="fdi-muted">Not publicly disclosed</span>';
    var opportunityLabel = company.opportunityType === 'Both' ? 'Attraction + expansion' : company.opportunityType;
    var evidenceStatus = company.dubai.evidenceStatus;
    return '<article class="fdi-company-card" data-company-id="' + escapeHTML(company.id) + '">' +
      '<div class="fdi-company-card-header">' +
        '<div class="fdi-card-topline"><span class="fdi-rank">Fortune ' + escapeHTML(formatRank(company.fortuneRank)) + '</span><span class="fdi-priority-badge fdi-priority-badge--' + priorityClass(company.priority) + '">' + escapeHTML(company.priority) + ' priority</span></div>' +
        '<h3>' + escapeHTML(company.name) + '</h3>' +
        '<p class="fdi-company-sector">' + escapeHTML(company.sector) + ' <span aria-hidden="true">·</span> ' + escapeHTML(company.subSector) + ' <span class="fdi-evidence-badge fdi-evidence-badge--derived">' + escapeHTML(company.sectorEvidence) + '</span></p>' +
      '</div>' +
      '<dl class="fdi-company-summary">' +
        '<div><dt>Revenue</dt><dd>' + escapeHTML(formatRevenue(company.revenueUsdM)) + '</dd></div>' +
        '<div><dt>Headquarters</dt><dd>' + escapeHTML(company.headquarters.city) + '<span>' + escapeHTML(company.headquarters.country) + '</span></dd></div>' +
      '</dl>' +
      '<ul class="fdi-presence-chips" aria-label="Presence summary">' +
        '<li><span>Dubai</span><strong class="fdi-presence-chip fdi-presence-chip--' + statusClass(company.dubai.present) + '">' + statusLabel(company.dubai.present) + '</strong></li>' +
        '<li><span>Other UAE</span><strong class="fdi-presence-chip fdi-presence-chip--' + statusClass(company.otherUae.present) + '">' + statusLabel(company.otherUae.present) + '</strong></li>' +
        '<li><span>GCC</span><strong class="fdi-presence-chip fdi-presence-chip--' + statusClass(company.regional.present) + '">' + statusLabel(company.regional.present) + '</strong></li>' +
      '</ul>' +
      '<div class="fdi-opportunity-preview"><div class="fdi-opportunity-label">' + escapeHTML(opportunityLabel) + ' opportunity</div><p>' + escapeHTML(company.dubaiOpportunity) + '</p><small>' + escapeHTML(company.priorityRationale) + '</small></div>' +
      '<details class="fdi-company-disclosure"' + (index === 0 ? ' open' : '') + '>' +
        '<summary><span class="fdi-disclosure-label">View company intelligence</span><span class="guide-disclosure-chevron" aria-hidden="true"></span></summary>' +
        '<div class="fdi-disclosure-body">' +
          '<dl class="fdi-detail-grid">' +
            detailItem('Company', escapeHTML(company.name)) +
            detailItem('Fortune rank', escapeHTML(formatRank(company.fortuneRank))) +
            detailItem('Sector / sub-sector', escapeHTML(company.sector + ' · ' + company.subSector) + ' <span class="fdi-evidence-badge fdi-evidence-badge--derived">' + escapeHTML(company.sectorEvidence) + '</span>', true) +
            detailItem('Headquarters', escapeHTML(company.headquarters.city + ', ' + company.headquarters.country)) +
            detailItem('Revenue', escapeHTML(formatRevenueDetail(company.revenueUsdM))) +
            detailItem('Dubai presence', '<span class="fdi-presence-chip fdi-presence-chip--' + statusClass(company.dubai.present) + '">' + statusLabel(company.dubai.present) + '</span>') +
            detailItem('Legal entity / entities', listHTML(company.dubai.legalEntities), true) +
            detailItem('Type of Dubai presence', listHTML(company.dubai.types)) +
            detailItem('Dubai leadership', leadership) +
            detailItem('Dubai location', escapeHTML(company.dubai.location), true) +
            detailItem('Other UAE presence', '<span class="fdi-presence-chip fdi-presence-chip--' + statusClass(company.otherUae.present) + '">' + statusLabel(company.otherUae.present) + '</span>') +
            detailItem('Other UAE type / location', listHTML(company.otherUae.types.concat(company.otherUae.locations)), true) +
            detailItem('Other regional presence', '<span class="fdi-presence-chip fdi-presence-chip--' + statusClass(company.regional.present) + '">' + statusLabel(company.regional.present) + '</span>') +
            detailItem('Regional type / location', listHTML(company.regional.types.concat(company.regional.locations, company.regional.countries)), true) +
            detailItem('Recent developments', listHTML(company.recentDevelopments), true) +
            detailItem('Current strategic priorities', listHTML(company.strategicPriorities), true) +
            detailItem('Potential Dubai opportunity', '<strong class="fdi-detail-opportunity">' + escapeHTML(company.dubaiOpportunity) + '</strong>', true) +
            detailItem('Priority rationale', escapeHTML(company.priorityRationale), true) +
          '</dl>' +
          '<div class="fdi-evidence-section"><h4>Research evidence</h4><p>' + escapeHTML(company.dubai.evidenceNote) + '</p><p>' + escapeHTML(company.otherUae.evidenceNote) + ' ' + escapeHTML(company.regional.evidenceNote) + '</p><span class="fdi-evidence-badge fdi-evidence-badge--' + (evidenceStatus === 'Confirmed' ? 'confirmed' : 'partial') + '">' + escapeHTML(evidenceStatus) + '</span></div>' +
          '<div class="fdi-evidence-section"><h4>Evidence flags</h4><ul class="fdi-flag-list">' + company.evidenceFlags.map(function (flag) { return '<li>' + escapeHTML(flag) + '</li>'; }).join('') + '</ul></div>' +
          '<div class="fdi-source-section"><h4>Source links</h4><ul class="fdi-source-list">' + company.sources.map(function (source) { return '<li><span>' + escapeHTML(source.type) + '</span><a href="' + escapeHTML(source.url) + '" target="_blank" rel="noreferrer noopener">' + escapeHTML(source.label) + ' ↗</a></li>'; }).join('') + '</ul></div>' +
        '</div>' +
      '</details>' +
    '</article>';
  }

  function renderCompanyCards(companies) {
    if (!companies.length) {
      companyList.innerHTML = '<div class="fdi-empty-state"><strong>No companies match these filters.</strong><p>Try a broader search or reset the filters to return to the six-record starter set.</p><button type="button" class="fdi-reset-button" data-fdi-empty-reset>Reset filters</button></div>';
      return;
    }
    companyList.innerHTML = companies.map(renderCompanyCard).join('');
  }

  function renderResultsStatus(companies) {
    var count = companies.length;
    resultsStatus.textContent = count + ' target record' + (count === 1 ? '' : 's') + (count === FDI_COMPANIES.length ? ' · starter set' : ' · filtered view');
  }

  function dispatchTableState(companies) {
    if (!matrix) return;
    var ids = {};
    companies.forEach(function (company) { ids[company.id] = true; });
    matrix.dispatchEvent(new CustomEvent('fdi:table-filter', {
      detail: {
        predicate: function (row) {
          return !!ids[row.getAttribute('data-company-id')];
        }
      }
    }));
    matrix.dispatchEvent(new CustomEvent('fdi:table-order', {
      detail: { order: companies.map(function (company) { return company.id; }) }
    }));
  }

  function refreshView() {
    var companies = filteredCompanies();
    renderResultsStatus(companies);
    renderSectorSignals(companies);
    renderCompanyCards(companies);
    dispatchTableState(companies);
  }

  function resetFilters() {
    state.query = '';
    state.priority = 'all';
    state.presence = 'all';
    state.opportunity = 'all';
    state.sort = 'priority';
    filters.reset();
    refreshView();
  }

  function bindFilters() {
    if (!filters) return;
    filters.addEventListener('submit', function (event) { event.preventDefault(); });
    filters.addEventListener('input', function (event) {
      if (event.target.id === 'fdi-query') state.query = event.target.value;
      refreshView();
    });
    filters.addEventListener('change', function (event) {
      if (event.target.id === 'fdi-priority') state.priority = event.target.value;
      if (event.target.id === 'fdi-presence') state.presence = event.target.value;
      if (event.target.id === 'fdi-opportunity') state.opportunity = event.target.value;
      if (event.target.id === 'fdi-sort') state.sort = event.target.value;
      refreshView();
    });
    filters.addEventListener('reset', function () {
      window.setTimeout(resetFilters, 0);
    });
    document.addEventListener('click', function (event) {
      if (event.target.matches('[data-fdi-empty-reset]')) resetFilters();
    });
  }

  function init() {
    if (!root || !companyList || !matrix) return;
    renderKpis();
    renderMatrixTable(FDI_COMPANIES);
    if (window.LoudTables && typeof window.LoudTables.init === 'function') window.LoudTables.init(matrix);
    bindFilters();
    refreshView();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
