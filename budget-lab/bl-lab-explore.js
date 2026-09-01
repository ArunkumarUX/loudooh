/* OOH opportunity cards + filters + card↔map sync */
(function () {
  "use strict";

  var FORMAT_META = {
    digital: { label: "Digital Screen", slug: "digital", color: "#8B5CF6", tags: ["premium"] },
    billboards: { label: "48-Sheet Billboard", slug: "billboards", color: "#3B6FE0", tags: ["reach"] },
    bus: { label: "Bus Advertising", slug: "bus", color: "#22C55E", tags: ["cost-efficient"] },
    rail: { label: "Digital Rail", slug: "rail", color: "#F5A623", tags: ["frequency"] },
    taxi: { label: "Taxi Rank", slug: "taxi", color: "#EC4899", tags: ["premium"] },
    airport: { label: "Airport Screen", slug: "airport", color: "#10B981", tags: ["premium", "reach"] },
  };

  var SVG_OPEN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

  var FORMAT_ICONS = {
    digital: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M9 21h6M12 17v4"/>',
    billboards: '<rect x="2.5" y="4" width="19" height="12" rx="1.5"/><path d="M7 16v5M17 16v5"/>',
    bus: '<rect x="4" y="3" width="16" height="14" rx="2.5"/><path d="M4 10.5h16M7.5 21v-2M16.5 21v-2"/>',
    rail: '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14M9 16l-1.5 3M15 16l1.5 3"/>',
    taxi:
      '<path d="M3 13.5 5 8h14l2 5.5V18H3z"/><path d="M9 8V5h6v3"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/>',
    airport: '<path d="M3 11.5 21 5l-6.5 17-2.8-7.2z"/>',
  };

  var BOOKMARK_ICON = SVG_OPEN + '<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>';

  function formatIcon(format) {
    return SVG_OPEN + (FORMAT_ICONS[format] || FORMAT_ICONS.digital) + "</svg>";
  }

  var SITE_IMAGES = {
    "Piccadilly Lights": "../images/projects/programmatic-dooh.png",
    "Oxford Circus": "../images/projects/billboard-advertising.png",
    "Route 24 Bus": "../images/projects/bus-advertising-uk.jpg",
    "London Underground": "../images/projects/london-underground-advertising.png",
  };

  var FORMAT_IMAGES = {
    digital: "../images/projects/programmatic-dooh.png",
    billboards: "../images/projects/billboard-advertising.png",
    bus: "../images/projects/bus-advertising-uk.jpg",
    rail: "../images/projects/rail-advertising-uk.jpg",
    taxi: "../images/projects/taxi-advertising.png",
    airport: "../images/projects/airport-advertising-uk-hero.jpg",
  };

  var FORMAT_ROTATION = ["digital", "billboards", "bus", "rail", "taxi", "airport", "digital", "billboards"];

  var activeFilter = "all";
  var previewState = null;
  var listEl = document.getElementById("hl-opportunities");
  var countEl = document.getElementById("hl-opp-count");
  var geoEl = document.getElementById("hl-opp-geo");
  var filterBar = document.getElementById("hl-filter-bar");

  function compact(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return Math.round(n / 1e3) + "K";
    return Math.round(n).toString();
  }

  function gbp(n) {
    return "£" + Math.round(n).toLocaleString("en-GB");
  }

  function geoLabel(geo) {
    var labels = {
      london: "London",
      manchester: "Manchester",
      birmingham: "Birmingham",
      leeds: "Leeds",
      glasgow: "Glasgow",
      uk: "UK-wide",
      regional: "Regional UK",
    };
    return labels[geo] || "London";
  }

  function siteFormat(index, name) {
    if (/piccadilly|circus|lights|digital|screen|media/i.test(name)) return "digital";
    if (/station|cross|waterloo|victoria|euston|central|bridge/i.test(name)) return "rail";
    if (/airport|terminal/i.test(name)) return "airport";
    return FORMAT_ROTATION[index % FORMAT_ROTATION.length];
  }

  function buildOpportunities(est, state) {
    var sites =
      window.__BL_MAP__ && window.__BL_MAP__.getSites
        ? window.__BL_MAP__.getSites(est, state)
        : [];
    var budget = state.budget || 50000;
    var segments = (est && est.segments) || [];

    return sites.map(function (site, i) {
      var fmtKey = site.format || siteFormat(i, site.name);
      var meta = FORMAT_META[fmtKey] || FORMAT_META.billboards;
      var seg = segments[i % Math.max(segments.length, 1)];
      var alloc = seg ? Math.round(seg.spend / Math.max(3, sites.length)) : Math.round(budget / Math.max(sites.length, 1));
      /* §9 — a site's share of the format's PUBLISHED impacts range, not a
         number invented from its allocation. Null when the underlying format
         carries no impacts benchmark, so the card can say so. */
      var impacts = null;
      if (seg && seg.f && seg.f.impactsCampaignLow != null && seg.qty) {
        var perUnitLow = seg.f.impactsCampaignLow;
        var perUnitHigh = seg.f.impactsCampaignHigh;
        var unitsPerSite = Math.max(1, Math.round(seg.qty / Math.max(1, sites.length)));
        impacts = { low: perUnitLow * unitsPerSite, high: perUnitHigh * unitsPerSite };
      }
      /* The old "visibility score" here was invented — part of it came from the
         card's index in the loop. The blueprint carries no site-level score, so
         we show what it does carry: cost per 1,000 impacts for this line, and
         the impact confidence published with the format. */
      var cpm = null;
      if (impacts && alloc) {
        var mid = (impacts.low + impacts.high) / 2;
        if (mid > 0) cpm = alloc / (mid / 1000);
      }
      var confidence = seg && seg.f ? seg.f.impactConfidence : null;

      return {
        id: site.id || state.geo + "-" + i,
        name: site.name,
        format: fmtKey,
        formatLabel: meta.label,
        color: meta.color,
        tags: meta.tags,
        lat: site.lat,
        lng: site.lng,
        impacts: impacts,
        cpm: cpm,
        confidence: confidence,
        allocation: site.allocation || alloc,
      };
    });
  }

  function tagLabel(tag) {
    if (tag === "premium") return "Premium";
    if (tag === "reach") return "High Reach";
    if (tag === "cost-efficient") return "Cost Efficient";
    if (tag === "frequency") return "High Frequency";
    if (tag === "value") return "Best Value";
    return tag;
  }

  function cardHtml(opp, index) {
    var firstTag = (opp.tags || [])[0];
    var imgSrc =
      SITE_IMAGES[opp.name] ||
      FORMAT_IMAGES[opp.format] ||
      FORMAT_IMAGES.digital;
    var impactsLabel = opp.impacts
      ? compact(opp.impacts.low) + "–" + compact(opp.impacts.high)
      : "No benchmark";
    var impactsMid = opp.impacts ? Math.round((opp.impacts.low + opp.impacts.high) / 2) : 0;
    var visLabel = opp.cpm != null ? "£" + opp.cpm.toFixed(2) : "—";
    var tagLine = firstTag ? tagLabel(firstTag) : opp.formatLabel;
    var detailLine =
      (firstTag ? opp.formatLabel + " · " : "") +
      "Est. impacts " + impactsLabel +
      (visLabel !== "—" ? " · " + visLabel + " per 1k" : "");
    return (
      '<article class="bl-opp-card bl-opp-card-mock" role="listitem" data-site-id="' +
      opp.id +
      '" data-format="' +
      opp.format +
      '" data-tags="' +
      opp.tags.join(" ") +
      '" data-reach="' +
      impactsMid +
      '" data-name="' +
      opp.name +
      '" data-format-label="' +
      opp.formatLabel +
      '" data-reach-label="' +
      impactsLabel +
      '" data-vis-label="' +
      visLabel +
      '" data-thumb="' +
      imgSrc +
      '" style="--fmt:' +
      opp.color +
      '">' +
      '<div class="bl-opp-thumb-wrap">' +
      '<img class="bl-opp-thumb" src="' + imgSrc + '" alt="" loading="lazy" width="120" height="140">' +
      "</div>" +
      '<div class="bl-opp-mock-body">' +
      '<button type="button" class="bl-opp-bookmark" aria-label="Save opportunity" aria-pressed="false">' +
      BOOKMARK_ICON +
      "</button>" +
      '<p class="bl-opp-guide-tag">' + tagLine + "</p>" +
      "<h3>" + opp.name + "</h3>" +
      '<p class="bl-opp-guide-text">' + detailLine + "</p>" +
      '<div class="bl-opp-guide-foot">' +
      '<span class="bl-opp-guide-price"><strong>' + gbp(opp.allocation) + '</strong><span class="bl-opp-guide-price-label">est. allocation</span></span>' +
      '<button type="button" class="bl-opp-add bl-opp-add-mock" aria-pressed="false">Add to Plan →</button>' +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function passesFilter(opp) {
    if (activeFilter === "all") return true;
    if (opp.format === activeFilter) return true;
    if (activeFilter === "reach" && (opp.reach || 0) >= 150000) return true;
    if (activeFilter === "premium" && opp.tags.indexOf("premium") > -1) return true;
    if (activeFilter === "value" && opp.tags.indexOf("value") > -1) return true;
    return false;
  }

  function applyFilter(skipMap) {
    if (!listEl) return;
    var visible = 0;
    listEl.querySelectorAll(".bl-opp-card").forEach(function (card) {
      var fmt = card.getAttribute("data-format");
      var tags = (card.getAttribute("data-tags") || "").split(" ").filter(Boolean);
      var reach = parseInt(card.getAttribute("data-reach"), 10) || 0;
      var show = passesFilter({ format: fmt, tags: tags, reach: reach });
      card.classList.toggle("is-hidden", !show);
      if (show) visible++;
    });
    if (!skipMap && window.__BL_MAP__ && window.__BL_MAP__.setFilter) {
      window.__BL_MAP__.setFilter(activeFilter);
    }
    if (countEl) {
      var total = listEl.querySelectorAll(".bl-opp-card").length;
      countEl.textContent =
        visible === total ? visible + " sites" : visible + " of " + total + " sites";
    }
    updateShowingLabel(visible);
  }

  function updateShowingLabel(visible) {
    var el = document.getElementById("hl-opp-showing");
    if (!el || !listEl) return;
    var total = listEl.querySelectorAll(".bl-opp-card").length;
    if (!visible) {
      el.textContent = "No opportunities match this filter";
      return;
    }
    el.textContent =
      "Showing 1–" + visible + " of " + total + " opportunit" + (total === 1 ? "y" : "ies");
  }

  function highlightCard(id) {
    if (!listEl) return;
    var target = null;
    listEl.querySelectorAll(".bl-opp-card").forEach(function (c) {
      var on = id && c.getAttribute("data-site-id") === id;
      c.classList.toggle("is-highlight", on);
      if (on) target = c;
    });
    if (target && !isInView(target, listEl)) {
      target.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    return target;
  }

  function setActiveCard(id) {
    if (!listEl) return null;
    var target = null;
    listEl.querySelectorAll(".bl-opp-card").forEach(function (c) {
      var on = id && c.getAttribute("data-site-id") === id;
      c.classList.toggle("is-active", on);
      if (on) target = c;
    });
    return target;
  }

  function ensureExploreInView() {
    var split = document.querySelector(".bl-lab-explore-split");
    if (!split) return;
    var rect = split.getBoundingClientRect();
    var chrome = 72;
    var pad = 20;
    if (rect.top < chrome + pad || rect.bottom > window.innerHeight - pad) {
      split.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function focusOpportunity(card) {
    if (!card || card.classList.contains("is-hidden")) return;
    var id = card.getAttribute("data-site-id");
    setActiveCard(id);
    highlightCard(id);
    showMapPreview(card);
    if (window.matchMedia("(max-width: 960px)").matches) {
      document.body.classList.add("explore-map-only");
      document.body.classList.remove("explore-list-only");
      var toggle = document.getElementById("hl-mobile-view");
      if (toggle) {
        toggle.querySelectorAll("button").forEach(function (b) {
          b.classList.toggle("is-on", b.getAttribute("data-view") === "map");
        });
      }
    }
    ensureExploreInView();
    if (window.__BL_MAP__ && window.__BL_MAP__.focusSite) {
      window.__BL_MAP__.focusSite(id);
    }
    if (window.__BL_MAP__ && window.__BL_MAP__.invalidate) {
      setTimeout(function () {
        window.__BL_MAP__.invalidate();
      }, 420);
    }
  }

  function isInView(el, root) {
    var er = el.getBoundingClientRect();
    var rr = root.getBoundingClientRect();
    return er.top >= rr.top && er.bottom <= rr.bottom;
  }

  function showMapPreview(card) {
    var panel = document.getElementById("hl-map-preview");
    if (!panel || !card) return;
    var img = document.getElementById("hl-map-preview-img");
    var thumb = card.getAttribute("data-thumb");
    if (img && thumb) img.src = thumb;
    setText("hl-map-preview-name", card.getAttribute("data-name"));
    setText("hl-map-preview-fmt", card.getAttribute("data-format-label"));
    setText("hl-map-preview-reach", card.getAttribute("data-reach-label"));
    setText("hl-map-preview-vis", card.getAttribute("data-vis-label"));
    panel.dataset.siteId = card.getAttribute("data-site-id") || "";
    panel.hidden = false;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  function wireExploreChrome() {
    var viewMore = document.getElementById("hl-opp-view-more");
    if (viewMore && listEl) {
      viewMore.addEventListener("click", function () {
        if (!listEl) return;
        var atBottom = listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 8;
        if (atBottom) {
          listEl.scrollTo({ top: 0, behavior: "smooth" });
          viewMore.querySelector("span").textContent = "View more";
          viewMore.setAttribute("aria-expanded", "false");
        } else {
          listEl.scrollBy({ top: Math.round(listEl.clientHeight * 0.82), behavior: "smooth" });
          viewMore.querySelector("span").textContent = "Back to top";
          viewMore.setAttribute("aria-expanded", "true");
        }
      });
    }

    var previewCta = document.getElementById("hl-map-preview-cta");
    if (previewCta) {
      previewCta.addEventListener("click", function () {
        var panel = document.getElementById("hl-map-preview");
        var id = panel && panel.dataset.siteId;
        var card = id && listEl && listEl.querySelector('.bl-opp-card[data-site-id="' + id + '"]');
        if (card) focusOpportunity(card);
      });
    }
  }

  function render(est, state) {
    if (!listEl || !state) return;
    var opps = buildOpportunities(est, state);
    listEl.innerHTML = opps.map(function (opp, i) {
      return cardHtml(opp, i);
    }).join("");
    var geo = geoLabel(state.geo);
    if (countEl) countEl.textContent = opps.length + " sites";
    if (geoEl) geoEl.textContent = geo;
    var badge = document.getElementById("hl-map-badge");
    if (badge) badge.textContent = geo;
    applyFilter(true);
  }

  function wireCardInteractions() {
    if (!listEl || listEl._wired) return;
    listEl._wired = true;

    listEl.addEventListener("mouseover", function (e) {
      var card = e.target.closest(".bl-opp-card");
      if (!card || card.classList.contains("is-hidden")) return;
      var id = card.getAttribute("data-site-id");
      if (listEl._activeCardId === id) return;
      listEl._activeCardId = id;
      highlightCard(id);
      showMapPreview(card);
      if (window.__BL_MAP__ && window.__BL_MAP__.highlightSite) window.__BL_MAP__.highlightSite(id);
    });
    listEl.addEventListener("mouseleave", function (e) {
      if (e.relatedTarget && listEl.contains(e.relatedTarget)) return;
      listEl._activeCardId = null;
      highlightCard(null);
      if (window.__BL_MAP__ && window.__BL_MAP__.highlightSite) window.__BL_MAP__.highlightSite(null);
    });
    listEl.addEventListener("click", function (e) {
      var mark = e.target.closest(".bl-opp-bookmark");
      if (mark) {
        e.preventDefault();
        e.stopPropagation();
        var saved = mark.getAttribute("aria-pressed") !== "true";
        mark.setAttribute("aria-pressed", saved ? "true" : "false");
        return;
      }
      var addBtn = e.target.closest(".bl-opp-add");
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        var card = addBtn.closest(".bl-opp-card");
        if (!card) return;
        var selected = card.classList.toggle("is-selected");
        addBtn.classList.toggle("is-added", selected);
        addBtn.textContent = selected ? "Added ✓" : "Add to Plan →";
        addBtn.setAttribute("aria-pressed", selected ? "true" : "false");
        if (selected) {
          focusOpportunity(card);
        }
        return;
      }
      var card = e.target.closest(".bl-opp-card");
      if (!card || card.classList.contains("is-hidden")) return;
      focusOpportunity(card);
    });
  }

  function wireFilters() {
    if (!filterBar) return;
    filterBar.addEventListener("click", function (e) {
      var chip = e.target.closest(".bl-filter-chip");
      if (!chip) return;
      activeFilter = chip.getAttribute("data-filter") || "all";
      filterBar.querySelectorAll(".bl-filter-chip").forEach(function (c) {
        c.classList.toggle("is-on", c === chip);
      });
      applyFilter();
    });
  }

  function wireMobileView() {
    var toggle = document.getElementById("hl-mobile-view");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-view]");
      if (!btn) return;
      toggle.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
      });
      document.body.classList.remove("explore-map-only", "explore-list-only");
      var view = btn.getAttribute("data-view");
      if (view === "map") document.body.classList.add("explore-map-only");
      if (view === "list") document.body.classList.add("explore-list-only");
      if (window.__BL_MAP__ && window.__BL_MAP__.invalidate) window.__BL_MAP__.invalidate();
    });
  }

  function wireAiExperiment() {
    var preview = document.getElementById("hl-ai-preview");
    var sidebarPreview = document.getElementById("hl-sidebar-ai-preview");
    var keep = document.getElementById("hl-ai-keep");
    var undo = document.getElementById("hl-ai-undo");
    var sidebarKeep = document.getElementById("hl-sidebar-ai-keep");
    var sidebarUndo = document.getElementById("hl-sidebar-ai-undo");
    var idle = document.getElementById("hl-ai-cta-idle");
    var confirm = document.getElementById("hl-ai-cta-confirm");
    var sidebarIdle = document.getElementById("hl-sidebar-ai-cta-idle");
    var sidebarConfirm = document.getElementById("hl-sidebar-ai-cta-confirm");
    var tip = document.getElementById("hl-ai-tip");
    var kpiStrip = document.querySelector(".bl-lab-kpi-strip");
    var previewBanner = document.getElementById("hl-ai-preview-banner");
    var previewBannerLabel = document.getElementById("hl-ai-preview-banner-label");
    var sidebarRoot = document.getElementById("hl-sidebar-ai");
    var sidebarBadge = document.getElementById("hl-sidebar-ai-badge");
    var sidebarAi = document.getElementById("hl-sidebar-ai-text");

    if (!preview && !sidebarPreview) return false;
    if (!window.__BL_HERO__) return false;
    if (window.__BL_AI_PREVIEW__) return true;

    function updateSidebarPreviewCopy(suggestion, isPreviewing) {
      if (!sidebarAi) return;
      if (isPreviewing && suggestion) {
        sidebarAi.textContent =
          "Previewing " +
          suggestion.altLabel +
          ". Check KPIs on the right — apply to keep or cancel to revert.";
        if (sidebarBadge) sidebarBadge.textContent = "✦ Preview · " + suggestion.altLabel;
        if (sidebarRoot) sidebarRoot.classList.add("is-previewing");
      } else {
        if (sidebarRoot) sidebarRoot.classList.remove("is-previewing");
        if (sidebarBadge) sidebarBadge.textContent = "✦ Loud AI Insight";
      }
    }

    function updatePreviewBanner(suggestion, isPreviewing) {
      if (!previewBanner) return;
      if (isPreviewing && suggestion) {
        if (previewBannerLabel) previewBannerLabel.textContent = suggestion.altLabel;
        previewBanner.hidden = false;
      } else {
        previewBanner.hidden = true;
      }
    }

    function showPreviewUi(suggestion) {
      if (!suggestion) suggestion = window.__BL_AI_PREVIEW_SUGGESTION__;
      if (!suggestion) return;

      if (idle) idle.hidden = true;
      if (confirm) confirm.hidden = false;
      if (keep) keep.textContent = suggestion.applyLabel || "Apply";
      if (undo) undo.textContent = suggestion.revertLabel || "Cancel";

      if (sidebarIdle) sidebarIdle.hidden = true;
      if (sidebarConfirm) sidebarConfirm.hidden = false;
      if (sidebarKeep) sidebarKeep.textContent = suggestion.applyLabel || "Apply";
      if (sidebarUndo) sidebarUndo.textContent = suggestion.revertLabel || "Cancel";

      if (tip) tip.classList.add("is-previewing");
      if (kpiStrip) kpiStrip.classList.add("is-previewing");
      updateSidebarPreviewCopy(suggestion, true);
      updatePreviewBanner(suggestion, true);
      document.body.classList.add("bl-ai-preview-active");
    }

    function hidePreviewUi() {
      previewState = null;
      window.__BL_AI_PREVIEW_SUGGESTION__ = null;

      if (idle) idle.hidden = false;
      if (confirm) confirm.hidden = true;
      if (sidebarIdle) sidebarIdle.hidden = false;
      if (sidebarConfirm) sidebarConfirm.hidden = true;

      if (tip) tip.classList.remove("is-previewing");
      if (kpiStrip) kpiStrip.classList.remove("is-previewing");
      updateSidebarPreviewCopy(null, false);
      updatePreviewBanner(null, false);
      document.body.classList.remove("bl-ai-preview-active");
    }

    function startPreview() {
      if (previewState) return;
      var hero = window.__BL_HERO__;
      var suggestion = window.__BL_AI_SUGGESTION__;
      if (!suggestion || !suggestion.partial) return;
      previewState = hero.getState();
      window.__BL_AI_PREVIEW_SUGGESTION__ = suggestion;
      hero.setState(suggestion.partial);
      showPreviewUi(suggestion);
      requestAnimationFrame(function () {
        var banner = document.getElementById("hl-ai-preview-banner");
        var target = banner && !banner.hidden ? banner : document.querySelector(".bl-lab-kpi-strip");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }

    function applyPreview() {
      hidePreviewUi();
      if (window.__BL_HERO__) {
        if (window.__BL_HERO__.update) window.__BL_HERO__.update();
        if (window.__BL_HERO__.onSync) window.__BL_HERO__.onSync();
      }
    }

    function cancelPreview() {
      var saved = previewState;
      hidePreviewUi();
      if (saved) window.__BL_HERO__.setState(saved);
    }

    function dismissPreview() {
      if (!previewState) return;
      previewState = null;
      window.__BL_AI_PREVIEW_SUGGESTION__ = null;
      if (idle) idle.hidden = false;
      if (confirm) confirm.hidden = true;
      if (sidebarIdle) sidebarIdle.hidden = false;
      if (sidebarConfirm) sidebarConfirm.hidden = true;
      if (tip) tip.classList.remove("is-previewing");
      if (kpiStrip) kpiStrip.classList.remove("is-previewing");
      updateSidebarPreviewCopy(null, false);
      updatePreviewBanner(null, false);
      document.body.classList.remove("bl-ai-preview-active");
    }

    if (preview) preview.addEventListener("click", startPreview);
    if (sidebarPreview) sidebarPreview.addEventListener("click", startPreview);

    if (keep) keep.addEventListener("click", applyPreview);
    if (sidebarKeep) sidebarKeep.addEventListener("click", applyPreview);

    if (undo) undo.addEventListener("click", cancelPreview);
    if (sidebarUndo) sidebarUndo.addEventListener("click", cancelPreview);

    window.__BL_AI_PREVIEW__ = {
      isActive: function () {
        return !!previewState;
      },
      apply: applyPreview,
      cancel: cancelPreview,
      dismiss: dismissPreview,
    };
    return true;
  }

  window.__BL_EXPLORE__ = {
    render: render,
    highlightCard: highlightCard,
    focusOpportunity: focusOpportunity,
    focusIntelligence: focusIntelligence,
  };

  function focusIntelligence() {
    var panel = document.getElementById("hl-plan-hub") || document.getElementById("hl-ai-experiment");
    if (!panel) return;
    var pane = panel.closest(".bl-ref-lab-wrap");
    if (pane && pane.scrollHeight > pane.clientHeight + 1) {
      pane.scrollTo({
        top: Math.max(
          0,
          panel.getBoundingClientRect().top -
            pane.getBoundingClientRect().top +
            pane.scrollTop -
            16
        ),
        behavior: "smooth",
      });
    } else {
      var sticky = document.querySelector(".bl-ref-search-wrap");
      var split = document.body.classList.contains("is-planning") && window.innerWidth > 1024;
      var offset = split ? 24 : (sticky ? sticky.offsetHeight : 72) + 20;
      var top = panel.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    panel.classList.remove("is-lai-focus");
    void panel.offsetWidth;
    panel.classList.add("is-lai-focus");
    window.setTimeout(function () {
      panel.classList.remove("is-lai-focus");
    }, 2600);
    if (window.__BL_MAP__ && window.__BL_MAP__.pulse) window.__BL_MAP__.pulse();
  }

  function linkMapHover() {
    if (window.__BL_MAP__) {
      window.__BL_MAP__.onSiteHover = function (id) {
        highlightCard(id);
      };
      return true;
    }
    return false;
  }

  wireFilters();
  wireMobileView();
  if (!wireAiExperiment()) {
    var aiTries = 0;
    var aiIv = setInterval(function () {
      if (wireAiExperiment() || aiTries++ > 40) clearInterval(aiIv);
    }, 50);
  }
  wireCardInteractions();
  wireExploreChrome();


  if (!linkMapHover()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (linkMapHover() || tries++ > 40) clearInterval(iv);
    }, 50);
  }

  function bootRender() {
    if (!window.__BL_HERO__ || !listEl) return;
    var est = window.__BL_HERO__.estimate && window.__BL_HERO__.estimate();
    if (est) render(est, window.__BL_HERO__.getState());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootRender);
  } else {
    setTimeout(bootRender, 0);
  }
})();
