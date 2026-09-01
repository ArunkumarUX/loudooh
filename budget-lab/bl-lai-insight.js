/* Loud AI — live insight via DashScope (proxied). Falls back to calculator copy. */
(function () {
  "use strict";

  var debounceTimer = null;
  var inflight = null;
  var lastKey = "";
  var apiBase = window.__BL_LAI_API__ || "";

  function compact(n) {
    if (!n || !isFinite(n)) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return Math.round(n / 1e3) + "K";
    return Math.round(n).toString();
  }

  function snapshotKey(est, suggestion, state) {
    return [
      state.budget,
      state.days,
      state.objective,
      state.geo,
      suggestion && suggestion.altLabel,
      suggestion && suggestion.impactsDelta,
      suggestion && suggestion.cpmDelta,
      est && est.impacts ? est.impacts.mid : 0,
      est && est.cpm ? est.cpm.mid : 0,
    ].join("|");
  }

  function planContext(est, suggestion, state) {
    var mix = (est && est.segments ? est.segments : [])
      .slice(0, 4)
      .map(function (seg) {
        return seg.cat + " " + Math.round((seg.spend / (state.budget || 1)) * 100) + "%";
      })
      .join(", ");
    return {
      budget: state.budget,
      durationDays: state.days,
      geo: state.geo,
      objective: state.objective,
      currentGoal: suggestion.currentLabel,
      altGoal: suggestion.altLabel,
      impactsRange: est && est.impacts
        ? compact(est.impacts.low) + "–" + compact(est.impacts.high)
        : null,
      cpm: est && est.cpm ? est.cpm.mid : null,
      impactsDeltaPct: suggestion.impactsDelta,
      cpmDeltaPct: suggestion.cpmDelta,
      worthPreview: suggestion.worthPreview,
      mix: mix,
      planned: est && est.planned,
      reserve: est && est.reserve,
      fallbackCopy: suggestion.sidebarCopy,
      fallbackCta: suggestion.ctaLabel,
    };
  }

  function applyResponse(payload, suggestion) {
    var sidebarAi = document.getElementById("hl-sidebar-ai-text");
    var tipText = document.getElementById("hl-ai-tip-text");
    var sidebarPreviewBtn = document.getElementById("hl-sidebar-ai-preview");
    var mainPreviewBtn = document.getElementById("hl-ai-preview");
    if (payload.copy) {
      if (sidebarAi) sidebarAi.textContent = payload.copy;
      if (tipText) tipText.textContent = payload.copy;
    }
    if (payload.cta && suggestion && suggestion.worthPreview) {
      if (sidebarPreviewBtn) sidebarPreviewBtn.textContent = payload.cta;
      if (mainPreviewBtn) mainPreviewBtn.textContent = payload.cta;
    }
  }

  function fetchInsight(est, suggestion, state) {
    var url = (apiBase ? apiBase.replace(/\/$/, "") : "") + "/api/lai-insight";
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planContext(est, suggestion, state)),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("LAI " + res.status);
        return res.json();
      })
      .catch(function () {
        return null;
      });
  }

  function refresh(est, suggestion, state) {
    if (!est || !suggestion || !state) return;
    var key = snapshotKey(est, suggestion, state);
    if (key === lastKey) return;
    lastKey = key;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      if (inflight) inflight.abort = true;
      var token = { abort: false };
      inflight = token;
      fetchInsight(est, suggestion, state).then(function (payload) {
        if (token.abort || !payload) return;
        applyResponse(payload, suggestion);
      }).catch(function () {
        applyResponse(
          { copy: suggestion.sidebarCopy, cta: suggestion.ctaLabel },
          suggestion
        );
      });
    }, 650);
  }

  window.__BL_LAI__ = {
    refresh: refresh,
    setApiBase: function (base) {
      apiBase = base || "";
    },
  };
})();
