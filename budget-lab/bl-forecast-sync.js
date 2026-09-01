/* Campaign forecast KPIs — engine-backed numbers + optional Loud AI insight */
(function () {
  "use strict";

  var OBJ_LABELS = {
    reach: "Maximise Reach",
    local: "Local Dominance",
    frequency: "Frequency Boost",
    launch: "Product Launch",
    footfall: "Footfall",
    premium: "Product Launch",
    brand: "Brand Building",
    balanced: "Balanced Mix",
  };

  var AUD_LABELS = {
    broad: "Mass Market",
    commuters: "Commuters",
    professionals: "Professionals",
    students: "Students",
    shoppers: "Shoppers",
    local: "Local Residents",
    custom: "Custom Audience",
  };

  var GEO_LABELS = {
    london: "London",
    manchester: "Manchester",
    birmingham: "Birmingham",
    leeds: "Leeds",
    glasgow: "Glasgow",
    uk: "UK-wide",
    regional: "Regional UK",
    named: "Named city",
  };

  function compact(n) {
    if (n == null || !isFinite(n)) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return Math.round(n / 1e3) + "K";
    return Math.round(n).toString();
  }

  function gbp(n) {
    return "£" + Math.round(n).toLocaleString("en-GB");
  }

  function durLabel(days) {
    if (days === 7) return "1 week";
    if (days === 14) return "2 weeks";
    if (days === 28) return "4 weeks";
    if (days === 56) return "8 weeks+";
    if (days % 7 === 0) return days / 7 + " weeks";
    return days + " days";
  }

  function scoreLabel(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Strong";
    if (score >= 55) return "Good";
    return "Fair";
  }

  function computeScore(result) {
    if (!result || result.infeasible) return null;
    var mid =
      result.audienceLow != null && result.audienceHigh != null
        ? (result.audienceLow + result.audienceHigh) / 2
        : 0;
    var formats = result.lines ? result.lines.length : 0;
    return Math.min(99, Math.round(50 + (mid / 900000) * 30 + formats * 4));
  }

  function countUp(el, target, fmt) {
    if (!el) return;
    var from = parseFloat(el.getAttribute("data-v") || "0");
    if (!isFinite(from)) from = 0;
    var start = null;
    var dur = 650;
    el.setAttribute("data-v", target);
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function setDash(ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.textContent = "—";
        el.removeAttribute("data-v");
      }
    });
  }

  function resolveResult(result) {
    if (result && !result.infeasible) return result;
    if (window.__BL_LAST_RESULT__ && !window.__BL_LAST_RESULT__.infeasible) {
      return window.__BL_LAST_RESULT__;
    }
    if (typeof window.blReplan === "function") {
      try {
        return window.blReplan({});
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function activeLocations(result, state) {
    var heroEst = window.__BL_HERO__ && window.__BL_HERO__.estimate ? window.__BL_HERO__.estimate() : null;
    if (window.__BL_MAP__ && window.__BL_MAP__.getSites) {
      var sites = window.__BL_MAP__.getSites(heroEst, state);
      if (sites && sites.length) return sites.length;
    }
    if (result && result.sites) return result.sites;
    return null;
  }

  function syncBrief(result, state) {
    var brief = document.getElementById("hl-results-brief");
    if (!brief) return;
    var geo =
      state.geo === "named" && state.named
        ? state.named
        : GEO_LABELS[state.geo] || "London";
    var tags = [
      geo,
      gbp(state.budget),
      durLabel(state.durationDays || state.days || 14),
      OBJ_LABELS[state.objective] || OBJ_LABELS.reach,
      AUD_LABELS[state.audience] || AUD_LABELS.broad,
    ];
    brief.innerHTML = tags
      .map(function (t) {
        return '<span class="bl-mock-results-tag">' + t + "</span>";
      })
      .join("");
  }

  function syncMix(result, state) {
    var goal = document.getElementById("hl-mix-goal");
    var summary = document.getElementById("hl-mix-summary");
    if (goal) goal.textContent = OBJ_LABELS[state.objective] || OBJ_LABELS.reach;
    if (summary && result && result.lines) {
      summary.textContent =
        result.lines.length +
        " format" +
        (result.lines.length === 1 ? "" : "s") +
        " · " +
        gbp(state.budget) +
        " allocated";
    }
  }

  function buildSuggestion(result, state) {
    var current = OBJ_LABELS[state.objective] || OBJ_LABELS.reach;
    var altKey = state.objective === "reach" ? "frequency" : "reach";
    var alt = OBJ_LABELS[altKey] || "Frequency Boost";
    return {
      currentLabel: current,
      altLabel: alt,
      impactsDelta: state.objective === "reach" ? 6 : 4,
      cpmDelta: state.objective === "frequency" ? -5 : 3,
      worthPreview: state.objective === "reach" || state.objective === "local",
      sidebarCopy:
        result && result.cpm
          ? "Digital and transport formats currently offer the strongest efficiency for " +
            (GEO_LABELS[state.geo] || "your market") +
            " at roughly £" +
            result.cpm.mid.toFixed(2) +
            " per 1,000 impacts."
          : "Adjust budget or duration to see a sharper format mix recommendation.",
      ctaLabel: "Try " + alt.replace("Maximise ", ""),
      partial: { objective: altKey },
    };
  }

  function refreshLai(result, state) {
    if (!window.__BL_LAI__ || !window.__BL_LAI__.refresh || !window.__BL_HERO__) return;
    var est = window.__BL_HERO__.estimate();
    if (!est) return;
    if (result && result.audienceLow != null) {
      est.impacts = {
        low: result.audienceLow,
        high: result.audienceHigh,
        mid: (result.audienceLow + result.audienceHigh) / 2,
      };
      est.cpm = result.cpm;
      est.sites = result.sites;
    }
    var suggestion = buildSuggestion(result, state);
    window.__BL_AI_SUGGESTION__ = suggestion;
    window.__BL_LAI__.refresh(est, suggestion, state);

    var tipText = document.getElementById("hl-ai-tip-text");
    if (tipText && suggestion.sidebarCopy) tipText.textContent = suggestion.sidebarCopy;
    var tipTitle = document.getElementById("hl-ai-tip-title");
    if (tipTitle) tipTitle.textContent = "Optimisation insight";
    var goalBadge = document.getElementById("hl-ai-goal-badge");
    if (goalBadge) goalBadge.textContent = "✦ Loud AI · " + suggestion.currentLabel;
  }

  function refresh(result) {
    var state = window.BLState ? window.BLState.get() : null;
    if (!state) return;

    result = resolveResult(result);
    syncBrief(result || { lines: [] }, state);
    syncMix(result || { lines: [] }, state);

    if (!result || result.infeasible) {
      setDash([
        "hl-impacts",
        "hl-cpm",
        "hl-sites",
        "hl-score",
        "hl-stat-locations",
        "hl-stat-formats",
        "hl-stat-visibility",
      ]);
      var label = document.getElementById("hl-score-label");
      if (label) label.textContent = "—";
      return;
    }

    var impactsEl = document.getElementById("hl-impacts");
    if (impactsEl && result.audienceLow != null) {
      impactsEl.textContent = compact(result.audienceLow) + "–" + compact(result.audienceHigh);
      impactsEl.setAttribute("data-v", (result.audienceLow + result.audienceHigh) / 2);
    }

    var cpmEl = document.getElementById("hl-cpm");
    if (cpmEl && result.cpm) {
      countUp(cpmEl, result.cpm.mid, function (v) {
        return "£" + v.toFixed(2);
      });
    }

    var sitesEl = document.getElementById("hl-sites");
    if (sitesEl) {
      countUp(sitesEl, result.sites || 0, function (v) {
        return String(Math.round(v));
      });
    }

    var score = computeScore(result);
    var scoreEl = document.getElementById("hl-score");
    if (scoreEl && score != null) {
      countUp(scoreEl, score, function (v) {
        return String(Math.round(v));
      });
    }
    var scoreLabelEl = document.getElementById("hl-score-label");
    if (scoreLabelEl && score != null) scoreLabelEl.textContent = scoreLabel(score);

    var locCount = activeLocations(result, state);
    var locEl = document.getElementById("hl-stat-locations");
    if (locEl && locCount != null) locEl.textContent = String(locCount);

    var fmtEl = document.getElementById("hl-stat-formats");
    if (fmtEl && result.lines) fmtEl.textContent = String(result.lines.length);

    var visEl = document.getElementById("hl-stat-visibility");
    if (visEl && score != null) visEl.textContent = score + "/100";

    refreshLai(result, state);
  }

  window.__BL_FORECAST__ = { refresh: refresh };

  function boot() {
    if (window.BLState) {
      window.BLState.subscribe(function () {
        refresh();
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        setTimeout(refresh, 200);
      });
    } else {
      setTimeout(refresh, 200);
    }
  }

  boot();
})();
