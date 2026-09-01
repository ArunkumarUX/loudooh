/* Live OOH map — Leaflet + clustering + card sync */
(function () {
  "use strict";

  if (typeof L === "undefined") return;

  var FORMAT_COLORS = {
    digital: "#8B5CF6",
    billboards: "#3B6FE0",
    bus: "#22C55E",
    rail: "#F5A623",
    taxi: "#EC4899",
    airport: "#10B981",
    Billboards: "#3B6FE0",
    "London Underground": "#8B5CF6",
    "Bus Stops": "#4CAF7D",
    Rail: "#F5A623",
    Taxis: "#EB5757",
    Buses: "#56CCF2",
  };

  var GEO = {
    london: {
      label: "London",
      center: [51.5074, -0.1278],
      zoom: 12,
      sites: [
        /* These four carried hardcoded per-site reach and visibility scores
           (245K / 98, 210K / 91 …). No site-level audience data exists in the
           2026 blueprint, so the figures are gone; the locations remain as
           illustrative examples of where a mix like this would sit. */
        { lat: 51.5101, lng: -0.134, name: "Piccadilly Lights", format: "digital" },
        { lat: 51.5154, lng: -0.1415, name: "Oxford Circus", format: "billboards" },
        { lat: 51.5113, lng: -0.1281, name: "Route 24 Bus", format: "bus" },
        { lat: 51.5308, lng: -0.1238, name: "London Underground", format: "rail" },
        { lat: 51.5054, lng: -0.0235, name: "Canary Wharf", format: "digital" },
        { lat: 51.5033, lng: -0.1145, name: "Waterloo", format: "rail" },
        { lat: 51.4952, lng: -0.1441, name: "Victoria", format: "rail" },
        { lat: 51.5178, lng: -0.0813, name: "Liverpool Street", format: "billboards" },
        { lat: 51.5246, lng: -0.078, name: "Shoreditch", format: "bus" },
        { lat: 51.5055, lng: -0.0865, name: "London Bridge", format: "billboards" },
        { lat: 51.5165, lng: -0.131, name: "Tottenham Court Rd", format: "bus" },
        { lat: 51.5416, lng: -0.0032, name: "Stratford", format: "digital" },
        { lat: 51.4927, lng: -0.2239, name: "Hammersmith", format: "taxi" },
        { lat: 51.4642, lng: -0.1702, name: "Clapham", format: "bus" },
        { lat: 51.4214, lng: -0.2064, name: "Wimbledon", format: "billboards" },
        { lat: 51.4994, lng: -0.127, name: "Westminster", format: "billboards" },
        { lat: 51.5138, lng: -0.0984, name: "Bank", format: "digital" },
        { lat: 51.5287, lng: -0.1332, name: "Euston", format: "rail" },
      ],
    },
    manchester: {
      label: "Manchester",
      center: [53.4808, -2.2426],
      zoom: 12,
      sites: [
        { lat: 53.4808, lng: -2.2374, name: "Piccadilly Gardens", format: "digital" },
        { lat: 53.4827, lng: -2.242, name: "Market Street", format: "billboards" },
        { lat: 53.4798, lng: -2.251, name: "Spinningfields", format: "digital" },
        { lat: 53.4728, lng: -2.298, name: "MediaCityUK", format: "digital" },
        { lat: 53.4668, lng: -2.2339, name: "Oxford Road", format: "bus" },
        { lat: 53.484, lng: -2.248, name: "Arndale", format: "billboards" },
        { lat: 53.4775, lng: -2.229, name: "Piccadilly Station", format: "rail" },
        { lat: 53.4875, lng: -2.262, name: "Deansgate", format: "billboards" },
      ],
    },
    birmingham: {
      label: "Birmingham",
      center: [52.4862, -1.8904],
      zoom: 12,
      sites: [
        { lat: 52.4775, lng: -1.894, name: "Bullring", format: "digital" },
        { lat: 52.4778, lng: -1.8986, name: "New Street", format: "rail" },
        { lat: 52.4754, lng: -1.912, name: "Broad Street", format: "billboards" },
        { lat: 52.475, lng: -1.884, name: "Digbeth", format: "bus" },
        { lat: 52.4865, lng: -1.903, name: "Colmore Row", format: "billboards" },
        { lat: 52.489, lng: -1.893, name: "Snow Hill", format: "rail" },
      ],
    },
    leeds: {
      label: "Leeds",
      center: [53.8008, -1.5491],
      zoom: 12,
      sites: [
        { lat: 53.7967, lng: -1.5454, name: "City Square", format: "billboards" },
        { lat: 53.7975, lng: -1.543, name: "Briggate", format: "digital" },
        { lat: 53.7948, lng: -1.5476, name: "Leeds Station", format: "rail" },
        { lat: 53.801, lng: -1.552, name: "The Headrow", format: "bus" },
      ],
    },
    glasgow: {
      label: "Glasgow",
      center: [55.8642, -4.2518],
      zoom: 12,
      sites: [
        { lat: 55.8642, lng: -4.2518, name: "Buchanan Street", format: "digital" },
        { lat: 55.8611, lng: -4.25, name: "George Square", format: "billboards" },
        { lat: 55.8597, lng: -4.2576, name: "Glasgow Central", format: "rail" },
        { lat: 55.868, lng: -4.258, name: "Sauchiehall St", format: "bus" },
      ],
    },
    uk: { label: "UK-wide", center: [54.2, -2.8], zoom: 6, sites: [] },
    regional: { label: "Regional UK", center: [53.2, -1.8], zoom: 7, sites: [] },
    named: { label: "Named city", center: [51.5074, -0.1278], zoom: 12, sites: [] },
  };

  GEO.uk.sites = [].concat(
    GEO.london.sites.slice(0, 6),
    GEO.manchester.sites.slice(0, 4),
    GEO.birmingham.sites.slice(0, 4),
    GEO.leeds.sites.slice(0, 3),
    GEO.glasgow.sites.slice(0, 3)
  );
  GEO.regional.sites = [].concat(
    GEO.manchester.sites.slice(0, 5),
    GEO.birmingham.sites.slice(0, 5),
    GEO.leeds.sites.slice(0, 4)
  );
  GEO.named.sites = GEO.london.sites.slice();

  var map = null;
  var clusterLayer = null;
  var markerRecords = [];
  var currentGeo = "london";
  var activeFilter = "all";
  var onSiteHover = null;
  var lastEst = null;
  var lastState = null;
  var previewGeoKey = null;
  var mapUpdateTimer = null;

  function gbp(n) {
    return "£" + Math.round(n).toLocaleString("en-GB");
  }

  function formatColor(fmt) {
    return FORMAT_COLORS[fmt] || "#3B6FE0";
  }

  function markerIcon(fmt, highlighted) {
    var color = formatColor(fmt);
    return L.divIcon({
      className: "bl-map-marker-wrap bl-map-marker-wrap--" + fmt + (highlighted ? " is-highlighted" : ""),
      html:
        '<div class="bl-map-marker bl-map-marker--' +
        fmt +
        '" style="--c:' +
        color +
        '"><span class="bl-map-marker-shape"></span><span class="bl-map-marker-dot"></span></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });
  }

  function pickCategory(segments, index) {
    if (!segments || !segments.length) return "billboards";
    var total = segments.reduce(function (s, seg) {
      return s + seg.spend;
    }, 0);
    var target = ((index * 17) % 100) / 100;
    var acc = 0;
    for (var i = 0; i < segments.length; i++) {
      acc += segments[i].spend / total;
      if (acc >= target) {
        var c = segments[i].cat;
        if (c === "London Underground") return "digital";
        if (c === "Billboards") return "billboards";
        if (c === "Buses" || c === "Bus Stops") return "bus";
        if (c === "Rail") return "rail";
        if (c === "Taxis") return "taxi";
        if (c === "Airports") return "airport";
        return "billboards";
      }
    }
    return "billboards";
  }

  function siteCountForBudget(budget, maxSites) {
    var scale = Math.min(1, Math.max(0.25, budget / 50000));
    return Math.max(3, Math.round(maxSites * scale));
  }

  function getSitesForState(est, state) {
    var geoKey = (state && (state.mapGeo || state.geo)) || currentGeo || "london";
    var budget = (state && state.budget) || 50000;
    var cfg = GEO[geoKey] || GEO.london;
    var sites = cfg.sites.length ? cfg.sites : GEO.london.sites;
    var count = siteCountForBudget(budget, sites.length);
    var segments = (est && est.segments) || [];
    return sites.slice(0, count).map(function (site, i) {
      var fmt = site.format || pickCategory(segments, i);
      return {
        id: geoKey + "-" + i,
        name: site.name,
        lat: site.lat,
        lng: site.lng,
        format: fmt,
        geo: geoKey,
        allocation: site.allocation || null,
      };
    });
  }

  function passesFilter(fmt) {
    if (activeFilter === "all") return true;
    return fmt === activeFilter;
  }

  function updateCountBadge(count, geoLabel) {
    var el = document.getElementById("hl-map-count");
    if (el) el.textContent = count + " example locations in " + geoLabel;
  }

  function flyToGeo(geoKey, animate, _attempt) {
    var cfg = GEO[geoKey] || GEO.london;
    if (!map) return;
    var container = map.getContainer();
    var laidOut = container && container.clientWidth > 0 && container.clientHeight > 0;
    if (!laidOut) {
      // Canvas not laid out yet — Leaflet's flyTo math produces NaN on a
      // zero-size map. Defer until the next frame; give up after 30 tries.
      if ((_attempt || 0) < 30) {
        requestAnimationFrame(function () { flyToGeo(geoKey, animate, (_attempt || 0) + 1); });
      }
      return;
    }
    map.invalidateSize();
    if (animate === false) map.setView(cfg.center, cfg.zoom);
    else map.flyTo(cfg.center, cfg.zoom, { duration: 0.75 });
  }

  function clearMarkers() {
    markerRecords = [];
    if (clusterLayer) clusterLayer.clearLayers();
  }

  function addMarkers(est, geoKey, budget, opts) {
    var cfg = GEO[geoKey] || GEO.london;
    var sites = getSitesForState(est, { geo: geoKey, budget: budget });
    var segments = (est && est.segments) || [];

    sites.forEach(function (site, i) {
      if (!passesFilter(site.format)) return;
      var seg = segments.find(function (s) {
        var f = pickCategory([s], 0);
        return f === site.format;
      });
      var spend = seg
        ? Math.round(seg.spend / Math.max(3, sites.length))
        : Math.round(budget / Math.max(sites.length, 1));

      var marker;
      if (typeof site.lat !== "number" || typeof site.lng !== "number" || !isFinite(site.lat) || !isFinite(site.lng)) return;
      marker = L.marker([site.lat, site.lng], { icon: markerIcon(site.format, false) });
      marker.siteId = site.id;
      marker.siteFormat = site.format;
      marker.bindPopup(
        '<div class="bl-map-popup"><strong>' +
          site.name +
          "</strong><span>" +
          site.format +
          " · " +
          gbp(spend) +
          " est.</span></div>",
        { closeButton: false, className: "bl-map-popup-wrap", maxWidth: 220 }
      );
      marker.on("mouseover", function () {
        if (onSiteHover) onSiteHover(site.id);
      });
      marker.on("mouseout", function () {
        if (onSiteHover) onSiteHover(null);
      });
      marker.on("click", function () {
        var card = document.querySelector('.bl-opp-card[data-site-id="' + site.id + '"]');
        if (window.__BL_EXPLORE__ && window.__BL_EXPLORE__.focusOpportunity && card) {
          window.__BL_EXPLORE__.focusOpportunity(card);
          return;
        }
        if (window.__BL_EXPLORE__ && window.__BL_EXPLORE__.highlightCard) {
          window.__BL_EXPLORE__.highlightCard(site.id);
        }
      });
      clusterLayer.addLayer(marker);
      markerRecords.push({ id: site.id, marker: marker, site: site });
    });

    updateCountBadge(sites.length, cfg.label);

    if (opts && opts.fitBounds && sites.length > 1 && geoKey !== "uk" && geoKey !== "regional") {
      var validSites = sites.filter(function (s) {
        return typeof s.lat === "number" && typeof s.lng === "number" && isFinite(s.lat) && isFinite(s.lng);
      });
      var canvasOk = map && map.getContainer() && map.getContainer().clientWidth > 0 && map.getContainer().clientHeight > 0;
      if (canvasOk && validSites.length > 1) {
        var bounds = L.latLngBounds(
          validSites.map(function (s) {
            return [s.lat, s.lng];
          })
        );
        map.fitBounds(bounds.pad(0.15), { animate: true, maxZoom: cfg.zoom, duration: 0.65 });
      }
    }
  }

  function initLabMap() {
    var root = document.getElementById("hl-map");
    var canvas = document.getElementById("hl-map-canvas");
    if (!root || !canvas || map) return;

    map = L.map(canvas, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
    });

    L.tileLayer(
      "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, FAO, NOAA, USGS',
        maxZoom: 16,
      }
    ).addTo(map);
    L.tileLayer(
      "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 16 }
    ).addTo(map);

    clusterLayer =
      typeof L.markerClusterGroup === "function"
        ? L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            iconCreateFunction: function (cluster) {
              var n = cluster.getChildCount();
              return L.divIcon({
                html: '<div class="bl-map-cluster">' + n + "</div>",
                className: "bl-map-cluster-wrap",
                iconSize: [40, 40],
              });
            },
          })
        : L.layerGroup();
    map.addLayer(clusterLayer);

    map.setView(GEO.london.center, GEO.london.zoom);

    root.querySelector('[data-map-zoom="in"]')?.addEventListener("click", function () {
      map.zoomIn();
    });
    root.querySelector('[data-map-zoom="out"]')?.addEventListener("click", function () {
      map.zoomOut();
    });
    root.querySelector('[data-map-locate="1"]')?.addEventListener("click", function () {
      flyToGeo(currentGeo);
    });

    setTimeout(function () {
      map.invalidateSize();
    }, 120);
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(function () {
        map.invalidateSize();
      }).observe(root);
    }
  }

  function rebuildMarkers(est, state, opts) {
    var geoKey = (state && (state.mapGeo || state.geo)) || currentGeo || "london";
    var budget = (state && state.budget) || 50000;
    clearMarkers();
    addMarkers(est, geoKey, budget, opts);
  }

  function updateLabMap(est, state) {
    if (!map) initLabMap();
    if (!map) return;
    var geoKey = (state && (state.mapGeo || state.geo)) || currentGeo || "london";
    var budget = (state && state.budget) || 50000;
    var geoChanged = geoKey !== currentGeo;
    lastEst = est;
    lastState = state || { geo: currentGeo, budget: 50000 };

    clearTimeout(mapUpdateTimer);
    mapUpdateTimer = setTimeout(function () {
      if (geoChanged) {
        currentGeo = geoKey;
        previewGeoKey = null;
        flyToGeo(geoKey);
        rebuildMarkers(est, state, { fitBounds: true });
        return;
      }
      rebuildMarkers(est, state, { fitBounds: false });
    }, geoChanged ? 0 : 80);
  }

  function highlightSite(id) {
    markerRecords.forEach(function (rec) {
      var on = id && rec.id === id;
      rec.marker.setIcon(markerIcon(rec.site.format, on));
    });
  }

  function focusSite(id) {
    var rec = markerRecords.find(function (r) {
      return r.id === id;
    });
    if (!rec || !map) return;

    function centerOnMarker() {
      var zoom = Math.max(map.getZoom(), 14);
      map.flyTo([rec.site.lat, rec.site.lng], zoom, { duration: 0.55 });
      highlightSite(id);
      if (rec.marker.openPopup) rec.marker.openPopup();
      setTimeout(function () {
        map.panBy([0, 100], { animate: true, duration: 0.35 });
        map.invalidateSize();
      }, 580);
    }

    if (clusterLayer && typeof clusterLayer.zoomToShowLayer === "function") {
      clusterLayer.zoomToShowLayer(rec.marker, centerOnMarker);
      return;
    }
    centerOnMarker();
  }

  function previewGeo(geoKey) {
    if (!map || !geoKey) return;
    previewGeoKey = geoKey;
    flyToGeo(geoKey);
  }

function restoreGeo(geoKey) {
    if (!map) return;
    var target = geoKey || currentGeo;
    if (previewGeoKey) {
      previewGeoKey = null;
      flyToGeo(target);
      return;
    }
    if (geoKey && geoKey !== currentGeo) flyToGeo(geoKey);
  }

  function setFilter(filter) {
    activeFilter = filter || "all";
    if (!lastState) return;
    rebuildMarkers(lastEst, lastState, { fitBounds: false });
  }

  function pulseLabMap() {
    document.querySelectorAll(".bl-map-marker").forEach(function (el) {
      el.classList.remove("is-pulse");
      void el.offsetWidth;
      el.classList.add("is-pulse");
    });
  }

  window.__BL_MAP__ = {
    init: initLabMap,
    update: updateLabMap,
    setGeo: function (geoKey) {
      currentGeo = geoKey || "london";
      if (map) flyToGeo(currentGeo);
    },
    previewGeo: previewGeo,
    restoreGeo: restoreGeo,
    pulse: pulseLabMap,
    highlightSite: highlightSite,
    focusSite: focusSite,
    setFilter: setFilter,
    getSites: getSitesForState,
    invalidate: function () {
      if (map) map.invalidateSize();
    },
    set onSiteHover(fn) {
      onSiteHover = fn;
    },
    get onSiteHover() {
      return onSiteHover;
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLabMap);
  else initLabMap();
})();
