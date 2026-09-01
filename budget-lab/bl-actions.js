/* ==========================================================================
   bl-actions.js — turns a costed plan into decisions the user can act on.
   --------------------------------------------------------------------------
   Every item here is derived from the plan that bl-calc.js already produced.
   Nothing is invented: if we can't quantify the consequence of an action, we
   don't offer the action. Each item carries
     - what is true right now,
     - what would change, in numbers,
     - and the exact state change that would make it happen.
   Applying is always preview-then-confirm; this module never mutates state.
   ========================================================================== */
(function(){
"use strict";
var C = window.BLCalc;

function gbp(n){ return "£" + Math.round(n).toLocaleString("en-GB"); }
function compact(n){
  if(n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"") + "M";
  if(n >= 1e3) return Math.round(n/1e3) + "K";
  return String(Math.round(n));
}
function plural(n, w){ return n + " " + w + (n === 1 ? "" : "s"); }

/* ---------- the handful of numbers a planner actually decides on ---------- */
function snapshot(r){
  if(!r || r.infeasible) return null;
  return {
    spend: r.spend,
    sites: r.sites,
    formats: r.lines.length,
    impactsLow: r.audienceLow,
    impactsHigh: r.audienceHigh,
    cpm: r.cpm ? r.cpm.mid : null,
    discount: r.discount,
    unallocated: r.unallocated
  };
}
/* Only rows that actually moved, so a preview never pads itself out. */
function diffRows(a, b){
  if(!a || !b) return [];
  var rows = [];
  function add(label, from, to, fmt, betterIsLower){
    if(from == null || to == null) return;
    if(Math.abs(to - from) < 0.005) return;
    rows.push({
      label: label, from: fmt(from), to: fmt(to),
      dir: (betterIsLower ? to < from : to > from) ? "up" : "down"
    });
  }
  add("Planned spend", a.spend, b.spend, gbp, false);
  add("Sites booked", a.sites, b.sites, function(v){ return String(Math.round(v)); }, false);
  add("Formats in the mix", a.formats, b.formats, function(v){ return String(Math.round(v)); }, false);
  add("Estimated impacts (low)", a.impactsLow, b.impactsLow, compact, false);
  add("Estimated impacts (high)", a.impactsHigh, b.impactsHigh, compact, false);
  add("Cost per 1,000 impacts", a.cpm, b.cpm, function(v){ return "£" + v.toFixed(2); }, true);
  add("Volume discount", a.discount, b.discount, gbp, false);
  add("Unallocated", a.unallocated, b.unallocated, gbp, true);
  return rows;
}

/* ================= the actions ================= */
function build(ctx){
  var r = ctx.result, st = ctx.state, DATA = ctx.DATA, replan = ctx.replan;
  var out = [];
  if(!r) return out;

  if(r.infeasible){
    /* Even a plan we can't build should say exactly what would fix it. */
    if(r.minBudget){
      out.push(withPreview({
        kind:"money", tone:"critical", id:"raise-to-feasible",
        title:"Raise the budget to " + gbp(r.minBudget) + " to get a buildable plan",
        detail:"The smallest realistic buy for this geography and duration is " +
               plural(r.minQty, "unit") + " of " + r.minFormat.format +
               ". Below that, no media owner will take the booking.",
        cta:"Set budget to " + gbp(r.minBudget),
        apply:{budget: Math.ceil(r.minBudget / 100) * 100}
      }, r, replan));
    }
    out.push({
      kind:"unlock", tone:"neutral", id:"shorten-infeasible",
      title:"Or shorten the campaign so each cycle costs less",
      detail:"Fewer cycles means a lower entry price for the same formats. A shorter, concentrated burst is almost always a better answer than a plan spread too thin to book.",
      cta:"Adjust duration", step:1
    });
    return out;
  }

  var opts = ctx.opts;

  /* ---------- 1. money that isn't working ----------
     Both of these are verified by replanning, never by arithmetic. The
     contingency scales with the budget, so "the cost of one more unit" is
     always slightly short of what actually buys one — and an action that
     promises a unit it doesn't deliver is worse than no action at all. */
  var marginal = cheapestMarginalUnit(r, opts);

  var released = r.reserve > 0 ? replan({reservePct: 0}) : null;
  if(released && !released.infeasible && released.sites > r.sites){
    out.push(withPreview({
      kind:"money", tone:"positive", id:"release-reserve",
      title:"Release the " + gbp(r.reserve) + " contingency and the plan grows to " + plural(released.sites, "site"),
      detail:"We hold " + Math.round((r.reserve / st.budget) * 100) + "% back by default so a plan isn't spent to the last pound. " +
             "Freeing it, plus the " + gbp(r.unallocated) + " already unallocated, covers " +
             plural(released.sites - r.sites, "more unit") + ".",
      cta:"Release contingency",
      apply:{reservePct: 0},
      note:"Most planners keep one. Availability, artwork changes and posting dates all move."
    }, r, replan));
  } else if(marginal){
    var top = smallestUsefulTopUp(ctx, marginal.cost);
    if(top){
      out.push(withPreview({
        kind:"money", tone:"neutral", id:"top-up-one-more",
        title:gbp(top.delta) + " more buys " + plural(top.plan.sites - r.sites, "additional site"),
        detail:"Only " + gbp(r.unallocated) + " is unallocated — genuinely not enough for another whole unit, and the " +
               Math.round((r.reserve / st.budget) * 100) + "% contingency grows with the budget too. " +
               gbp(top.delta) + " is the smallest increase that actually adds inventory rather than just sitting there.",
        cta:"Add " + gbp(top.delta) + " to the budget",
        apply:{budget: st.budget + top.delta}
      }, r, replan));
    } else if(r.unallocated > 0){
      out.push({
        kind:"money", tone:"neutral", id:"unallocated-explained",
        title:gbp(r.unallocated) + " is unallocated, and that is the honest answer",
        detail:"The cheapest thing left to add is another " + marginal.label + " at " + gbp(marginal.cost) +
               ". Rather than force-spend the remainder on something that doesn't fit, we leave it visible. " +
               "It is yours to hold, or to put toward a longer run.",
        cta:"Adjust the budget", step:1
      });
    }
  }

  /* ---------- 2. the next volume-discount band ---------- */
  var band = nextBandOpportunity(r, opts);
  if(band){
    out.push(withPreview({
      kind:"discount", tone:"highlight", id:"reach-band",
      title:plural(band.need, "more " + band.unit) + " unlocks the " + band.label + " discount",
      detail:"At " + band.threshold + " units the media rate drops " + Math.round(band.rate * 100) +
             "% on " + band.format + ". Those " + plural(band.need, "extra " + band.unit) +
             " add " + gbp(band.extraCost) + " of spend but save " + gbp(band.saving) +
             " against rate card — an effective " + gbp(band.effectivePerUnit) + " each.",
      cta:"Add " + gbp(band.budgetDelta) + " to reach " + band.threshold,
      apply:{budget: st.budget + band.budgetDelta},
      note:"Volume bands are a planning assumption, not a guaranteed rate. Confirm before booking."
    }, r, replan));
  }

  /* ---------- 3. levers that change what's available ---------- */
  geographyUnlock(ctx, out);
  durationLever(ctx, out);
  budgetUnlock(ctx, out);

  /* ---------- 4. confirm before booking ---------- */
  var checks = confirmations(r, st);
  if(checks.length){
    out.push({
      kind:"confirm", tone:"neutral", id:"pre-booking",
      title:"Confirm " + plural(checks.length, "thing") + " before this is bookable",
      detail:"None of these stop the plan. They're the points where a planning number and a live quote can diverge.",
      checklist: checks,
      cta:"Send this plan to a planner", ctaEmail:true
    });
  }
  return out;
}

/* ---------- helpers ---------- */
/* The smallest budget increase that genuinely adds inventory. We start from
   the arithmetic estimate (which accounts for the contingency scaling with the
   budget) and confirm it by replanning, stepping up until it's real. */
function smallestUsefulTopUp(ctx, marginalCost){
  var r = ctx.result, st = ctx.state;
  var pct = r.reserve / Math.max(1, st.budget);
  var estimate = ((r.spend + marginalCost) / Math.max(0.5, 1 - pct)) - st.budget;
  var start = Math.max(50, Math.ceil(estimate / 50) * 50);
  for(var d = start; d <= start + 400; d += 50){
    var alt = ctx.replan({budget: st.budget + d});
    if(alt && !alt.infeasible && alt.sites > r.sites) return {delta: d, plan: alt};
  }
  return null;
}

function cheapestMarginalUnit(r, opts){
  var best = null;
  r.lines.forEach(function(l){
    var next = C.line(l.q, l.qty + 1, opts);
    var cost = next.total - l.total;
    if(cost > 0 && (!best || cost < best.cost)){
      best = {cost: cost, label: l.f.format, line: l};
    }
  });
  return best;
}

function nextBandOpportunity(r, opts){
  var best = null;
  r.lines.forEach(function(l){
    var current = l.discountRate;
    var target = null;
    for(var i = C.VOLUME_BANDS.length - 1; i >= 0; i--){
      if(C.VOLUME_BANDS[i].rate > current){ target = C.VOLUME_BANDS[i]; break; }
    }
    if(!target) return;
    var need = target.min - l.qty;
    if(need <= 0 || need > l.qty) return;           // only offer a realistic step
    var at = C.line(l.q, target.min, opts);
    var extraCost = at.total - l.total;
    var saving = (at.mediaGross - at.media) - (l.mediaGross - l.media);
    if(saving <= 0) return;
    var cand = {
      need: need, threshold: target.min, label: target.label, rate: target.rate,
      format: l.f.format, unit: l.f.buyingUnit.replace(/^per /, ""),
      extraCost: extraCost, saving: saving,
      effectivePerUnit: extraCost / need,
      budgetDelta: Math.max(0, Math.ceil((extraCost - r.unallocated) / 50) * 50)
    };
    if(!best || cand.saving > best.saving) best = cand;
  });
  return best;
}

function geographyUnlock(ctx, out){
  var r = ctx.result, st = ctx.state;
  if(st.geo === "london" || st.geo === "uk") return;
  var blocked = r.exclusions.filter(function(x){ return /only exists in London/.test(x.reason); });
  if(!blocked.length) return;
  out.push(withPreview({
    kind:"unlock", tone:"neutral", id:"unlock-london",
    title:"Planning London instead unlocks " + plural(blocked.length, "Underground format"),
    detail:"London Underground inventory doesn't exist outside London, so it's excluded here rather than quietly priced against regional bands. London pricing is higher — this is a trade, not a free upgrade.",
    cta:"Price this in London",
    apply:{geo:"london"}
  }, r, ctx.replan));
}

function durationLever(ctx, out){
  var r = ctx.result, st = ctx.state, replan = ctx.replan;
  var options = [7, 14, 28, 42].filter(function(d){ return d !== st.durationDays; });
  var best = null;
  options.forEach(function(d){
    var alt = replan({durationDays: d});
    if(!alt || alt.infeasible || !alt.cpm) return;
    if(!r.cpm) return;
    var delta = (alt.cpm.mid - r.cpm.mid) / r.cpm.mid;
    if(delta < -0.05 && (!best || alt.cpm.mid < best.cpm)) best = {days: d, cpm: alt.cpm.mid, delta: delta};
  });
  if(!best) return;
  out.push(withPreview({
    kind:"unlock", tone:"positive", id:"duration-lever",
    title:"A " + best.days + "-day run buys impacts " + Math.abs(Math.round(best.delta * 100)) + "% more efficiently",
    detail:"Cost per 1,000 impacts falls from £" + r.cpm.mid.toFixed(2) + " to £" + best.cpm.toFixed(2) +
           ". Shorter runs concentrate the same money into fewer cycles — worth it when the moment matters more than the duration.",
    cta:"Try " + best.days + " days",
    apply:{durationDays: best.days}
  }, r, replan));
}

function budgetUnlock(ctx, out){
  var r = ctx.result, st = ctx.state;
  var blocked = r.exclusions.filter(function(x){ return /Minimum buy is/.test(x.reason); });
  if(!blocked.length) return;
  var cheapest = null;
  blocked.forEach(function(x){
    var m = x.reason.match(/about £([\d,]+)/);
    if(!m) return;
    var cost = parseInt(m[1].replace(/,/g, ""), 10);
    if(!cheapest || cost < cheapest.cost) cheapest = {cost: cost, label: x.category + " — " + x.format};
  });
  if(!cheapest) return;
  var delta = Math.ceil((cheapest.cost - r.unallocated) / 100) * 100;
  /* Asking someone to more than half their budget again isn't an action, it's
     a different brief. Offering it as a "next move" wastes their attention. */
  if(delta <= 0 || delta > st.budget * 0.5) return;
  out.push(withPreview({
    kind:"unlock", tone:"neutral", id:"budget-unlock",
    title:gbp(delta) + " more brings " + cheapest.label + " into range",
    detail:plural(blocked.length, "format") + " sit outside this budget only because of minimum buy quantities. This is the cheapest one to reach.",
    cta:"Add " + gbp(delta),
    apply:{budget: st.budget + delta}
  }, r, ctx.replan));
}

function confirmations(r, st){
  var list = [];
  if(r.taperNotes && r.taperNotes.length){
    list.push({label:"Multi-cycle rate", text:r.taperNotes[0]});
  }
  var planning = r.lines.filter(function(l){ return /Planning range/.test(l.f.costStatus); });
  if(planning.length){
    list.push({
      label:"Planning-range pricing",
      text:planning.map(function(l){ return l.f.format; }).join(", ") +
        " " + (planning.length === 1 ? "is" : "are") + " priced from a planning range rather than a published rate. Treat it as indicative."
    });
  }
  if(r.mediaOnly && r.extraCost > 0){
    list.push({
      label:"Production sits on top",
      text:"You chose a media-only budget, so " + gbp(r.extraCost) +
        " of production and installation is additional to the figure shown."
    });
  }
  if(r.discount > 0){
    list.push({
      label:"Volume discount assumed",
      text:gbp(r.discount) + " of the saving here comes from assumed volume bands. Confirm the actual rate with a planner."
    });
  }
  list.push({
    label:"Availability",
    text:"A planning rate never guarantees a site is free. Live availability has to be confirmed before anything is held."
  });
  return list;
}

/* Attach the real before/after so a card can never promise something the
   plan wouldn't actually deliver. */
function withPreview(action, current, replan){
  if(!action.apply || typeof replan !== "function") return action;
  var after = replan(action.apply);
  action.preview = {
    ok: !!after && !after.infeasible,
    rows: diffRows(snapshot(current), snapshot(after))
  };
  if(!action.preview.ok){
    action.preview.rows = [];
    action.blocked = "That change doesn't produce a buildable plan on its own.";
  }
  return action;
}

window.BLActions = {build: build, snapshot: snapshot, diffRows: diffRows};
})();
