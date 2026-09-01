/* bl-reveal.js — how the plan arrives.
   ------------------------------------------------------------------
   The plan is computed synchronously in a few milliseconds and it lives in
   one place on the page. So this is deliberately NOT a loading animation and
   NOT an overlay: there is no second copy of the plan, nothing to dismiss,
   and nothing is withheld while it plays.

   What it is: the plan's own blocks arriving in reading order, with a short
   build log above them stating what the calculator actually did to produce
   them — formats priced, formats ruled out, minimum buys cleared, volume band
   applied, contingency held. Every line carries a real number taken from the
   result object. Nothing here is invented and nothing is a fake percentage.

   It is under a second, it never blocks reading, and any scroll or keypress
   ends it immediately. It does not play at all on first paint, while a control
   is still under a finger, under prefers-reduced-motion, or when the plan has
   not changed since the last time you looked at it. */
(function () {
  "use strict";

  var STEP_MS = 150;      /* one build-log line */
  var SETTLE_MS = 260;    /* pause on "Plan ready" before the log collapses */
  var STAGGER_MS = 70;    /* between the plan's own blocks */
  var STAGGER_CAP = 6;    /* only stagger what can actually be seen */

  var playing = false;
  var timers = [];
  var lastSignature = null;

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function gbp(n) {
    return "£" + Math.round(n).toLocaleString("en-GB");
  }
  function plural(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
  }
  function geoLabel(st) {
    if (!st) return "your area";
    if (st.geo === "london") return "London";
    if (st.geo === "regional") return "regional UK";
    if (st.geo === "uk") return "UK-wide";
    return st.named || "your area";
  }
  function runLabel(st) {
    var d = st && st.durationDays ? st.durationDays : 14;
    return d % 7 === 0 ? (d / 7) + "-week run" : d + "-day run";
  }

  /* Each line is a fact about THIS plan, read off the result object. */
  function buildLog(r) {
    var st = r.state || {};
    var out = [];
    var priced = r.priced || null;
    var excluded = r.exclusions ? r.exclusions.length : 0;

    out.push({
      label: "Priced the rate card",
      value: priced ? plural(priced, "format") + " · 2026 rates" : "2026 rates"
    });
    out.push({
      label: "Applied " + geoLabel(st) + " and a " + runLabel(st),
      value: excluded ? plural(excluded, "format") + " ruled out" : "no exclusions"
    });
    out.push({
      label: "Checked minimum buys",
      value: r.lines
        ? plural(r.lines.length, "format") + " cleared · " + plural(r.sites, "site")
        : plural(r.sites, "site")
    });
    out.push({
      label: "Applied volume bands",
      value: r.discount > 0 ? "−" + gbp(r.discount) + " off rate card" : "no band reached at this size"
    });
    out.push({
      label: "Held contingency",
      value: gbp(r.reserve) + " back" + (r.unallocated > 0 ? " · " + gbp(r.unallocated) + " unallocated" : "")
    });
    return out;
  }

  /* Changing nothing and clicking again should not replay it. */
  function signature(r) {
    var st = r.state || {};
    return [st.budget, st.durationDays, st.objective, st.geo, st.named, st.audience,
            r.sites, Math.round(r.spend || 0)].join("|");
  }

  function logMarkup(steps) {
    var html = '<div class="bl-rev" id="bl-rev" aria-hidden="true">';
    html += '<p class="bl-rev-mark">Building your plan</p>';
    html += '<ol class="bl-rev-list">';
    steps.forEach(function (s, i) {
      html += '<li class="bl-rev-step" data-i="' + i + '">' +
        '<i class="bl-rev-tick" aria-hidden="true"></i>' +
        '<span class="bl-rev-label">' + s.label + '</span>' +
        '<b class="bl-rev-value">' + s.value + '</b></li>';
    });
    html += "</ol>";
    html += '<div class="bl-rev-rule"><span id="bl-rev-fill"></span></div>';
    html += "</div>";
    return html;
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  /* Whatever happens — finished, interrupted, or never started — the panel
     ends in exactly one state: the whole plan, plainly visible. */
  function finish(el) {
    clearTimers();
    playing = false;
    var log = document.getElementById("bl-rev");
    if (log && log.parentNode) {
      /* Removing the log shortens the pane above what the reader is looking
         at. If it is still in view that shortening IS the animation; if they
         have already scrolled past it, absorb the difference in the pane's own
         scroll so nothing visible jumps. */
      var pane = document.getElementById("bl-pane-plan");
      var h = log.offsetHeight + (parseFloat(window.getComputedStyle(log).marginBottom) || 0);
      var past = pane ? pane.scrollTop >= h : false;
      log.parentNode.removeChild(log);
      if (past) pane.scrollTop = Math.max(0, pane.scrollTop - h);
    }
    if (el) el.classList.remove("is-revealing");
    document.removeEventListener("keydown", onInterrupt, true);
    window.removeEventListener("wheel", onInterrupt, { passive: true });
    window.removeEventListener("touchmove", onInterrupt, { passive: true });
  }

  function onInterrupt() {
    finish(document.getElementById("bl-results"));
  }

  /* Armed while the reveal runs, so a reader who takes over never has to wait
     for an animation to finish having its say. Scrolling the pane or pressing
     a key means "I have got this from here".

     Deliberately NOT on pointerdown: ending the reveal removes the log, which
     shortens the pane, and doing that between someone's pointerdown and their
     pointerup moves what they are clicking out from under them. Nothing is
     hidden during the reveal, so a click has no reason to cancel it. */
  function arm() {
    document.addEventListener("keydown", onInterrupt, true);
    window.addEventListener("wheel", onInterrupt, { passive: true });
    window.addEventListener("touchmove", onInterrupt, { passive: true });
  }

  function announce(r) {
    var live = document.getElementById("bl-rev-live");
    if (!live) {
      live = document.createElement("p");
      live.id = "bl-rev-live";
      live.className = "visually-hidden";
      live.setAttribute("role", "status");
      live.setAttribute("aria-live", "polite");
      document.body.appendChild(live);
    }
    live.textContent = "Plan ready. " + plural(r.sites, "site") + " across " +
      plural(r.lines ? r.lines.length : 0, "format") + ", " + gbp(r.spend) + " of " +
      gbp(r.state ? r.state.budget : r.spend) + " planned.";
  }

  /* Stagger only the blocks that could plausibly be on screen. */
  function stagger(el){
    var seen = 0;
    Array.prototype.slice.call(el.children).forEach(function (k) {
      if (k.id === "bl-rev") return;
      k.style.setProperty("--bl-rev-i", Math.min(seen++, STAGGER_CAP));
    });
  }

  /* Scroll to something and actually LAND on it.

  /* The plan now lives in a panel that is always on screen and scrolls inside
     itself, which makes this simple: there is no page to scroll, no sticky
     chrome to land clear of, and nothing to wait for. Scroll the pane to the
     top, put the log there, and narrate.

     That is also why the log is back on phones. It used to be skipped there
     because the mobile campaign control is a drawer that comes down over the
     page whenever you scroll up — but nothing scrolls the page any more.

     Returns true if it played. */
  function reveal(result, opts){
    var el = document.getElementById("bl-results");
    if(!el || !result || result.infeasible) return false;
    opts = opts || {};

    var sig = signature(result);
    var unchanged = sig === lastSignature;
    var firstEver = lastSignature === null;
    lastSignature = sig;
    announce(result);

    /* Reasons not to play, every one of which still leaves the plan on screen:
       nothing changed, this is the first paint and nobody asked for anything,
       a slider is still under a finger, less motion was requested, or a reveal
       is already running. */
    if(firstEver && !opts.force) { finish(el); return false; }
    if(window.__BL_LIVE_INPUT__ && !opts.force) { finish(el); return false; }
    if(reducedMotion() || (unchanged && !opts.force) || playing){
      finish(el);
      return false;
    }

    playing = true;
    var steps = buildLog(result);
    el.insertAdjacentHTML("afterbegin", logMarkup(steps));

    /* Read from the top of the pane, not from wherever the last plan was left. */
    var pane = document.getElementById("bl-pane-plan");
    if(pane && pane.scrollTop > 0) pane.scrollTop = 0;

    tick(el, steps);
    return true;
  }

  /* Runs the log and the stagger. The markup is already in the container and
     the page is already where it needs to be — this only animates. */
  function tick(el, steps) {
    el.classList.add("is-revealing");
    stagger(el);
    arm();

    /* No log — the phone case. The blocks arriving IS the reveal. */
    if (!steps.length) {
      timers.push(setTimeout(function () { finish(el); }, STAGGER_CAP * STAGGER_MS + 420));
      return;
    }


    steps.forEach(function (s, i) {
      timers.push(setTimeout(function () {
        /* Re-query every tick: if something re-rendered the summary under us,
           the log is gone and the only correct thing to do is stop cleanly
           rather than leave the module wedged in a playing state. */
        var li = document.querySelector('.bl-rev-step[data-i="' + i + '"]');
        if (!li) return finish(document.getElementById("bl-results"));
        li.classList.add("is-done");
        var fill = document.getElementById("bl-rev-fill");
        if (fill) fill.style.width = Math.round(((i + 1) / steps.length) * 100) + "%";
      }, i * STEP_MS));
    });

    timers.push(setTimeout(function () {
      var mark = document.querySelector(".bl-rev-mark");
      if (mark) {
        mark.textContent = "Plan ready";
        mark.classList.add("is-done");
      }
    }, steps.length * STEP_MS));

    timers.push(setTimeout(function () {
      var log = document.getElementById("bl-rev");
      if (log) log.classList.add("is-leaving");
      timers.push(setTimeout(function () { finish(el); }, 240));
    }, steps.length * STEP_MS + SETTLE_MS));
  }

  /* Reveal in place, for a caller that has already put the reader in front of
     the plan and does not want it scrolled. */
  function play(result, opts) {
    var el = document.getElementById("bl-results");
    if (!el || !result || result.infeasible) return false;
    opts = opts || {};

    var sig = signature(result);
    var unchanged = sig === lastSignature;
    lastSignature = sig;
    announce(result);

    if (reducedMotion() || (unchanged && !opts.force) || playing) {
      finish(el);
      return false;
    }

    playing = true;
    var steps = buildLog(result);
    el.insertAdjacentHTML("afterbegin", logMarkup(steps));
    tick(el, steps);
    return true;
  }

  window.BLReveal = {
    reveal: reveal,
    play: play,
    finish: function () { finish(document.getElementById("bl-results")); },
    isPlaying: function () { return playing; },
    /* exposed for the tests, so they can assert on real copy rather than mine */
    buildLog: buildLog,
    STEP_MS: STEP_MS
  };
})();
