/* ==========================================================================
   bl-calc.js — Budget Lab shared calculation module
   --------------------------------------------------------------------------
   SINGLE SOURCE OF TRUTH for every number the Budget Lab shows.
   hero.js (live console) and engine.js (step wizard) both consume this so the
   two can never disagree again.

   Implements the spec rules that were previously missing or duplicated:
     §7   Taxi / long-cycle formats are not extrapolated linearly
     §9   Impacts only. Reach and frequency are NEVER manufactured here.
     §10  Cycle respect, geography, minimum buy, volume discount,
          contingency reserve, media/production split, excluded-format
          disclosure with a closest alternative
     §14  Digital formats carry no print cost

   NOTE FOR THE COMMERCIAL TEAM: the MINIMUM_BUY and VOLUME_BANDS tables below
   are business rules, not data from the pricing matrix. They are collected
   here deliberately so they can be signed off and edited in one place.
   ========================================================================== */
(function(){
"use strict";

/* ---------- campaign cycles ---------- */
var BASIS_DAYS = {"1 day":1,"3 days":3,"5 days":5,"1 week":7,"2 weeks":14,"4 weeks":28};

/* §7 — formats bought on long cycles are negotiated, not multiplied.
   Beyond the first cycle each additional cycle is taken at MULTI_CYCLE_TAPER
   of rate card, and the quote is flagged so the UI must say so. */
var NON_LINEAR_BASIS = {"4 weeks":true};
var MULTI_CYCLE_TAPER = 0.9;

/* The same principle applies to ANY format once a campaign runs long. Nobody
   sells a 12-month billboard at 27 × the fortnightly rate card. Short runs
   stay linear (the spec is explicit that 28 days on a 2-week basis is 2 full
   cycles, £450 → £900); beyond LINEAR_CYCLE_LIMIT the marginal cycle is taken
   at LONG_RUN_TAPER and the quote is flagged.
   BUSINESS RULE — both values need commercial sign-off. */
var LINEAR_CYCLE_LIMIT = 4;
var LONG_RUN_TAPER = 0.85;

/* ---------- geography ---------- */
/* London Underground inventory does not exist outside London. A Regional or
   named non-London brief must never be offered it. */
var LONDON_ONLY_CATEGORIES = ["London Underground"];
var LONDON_NAMED = {"london":1,"greater london":1,"city of london":1};

/* ---------- §10 minimum buy (BUSINESS RULE — confirm with media owners) ----
   A plan below these quantities is not a buy a media owner would sell. */
var MINIMUM_BUY = {
  "billboards-6-sheet-static":5,   "billboards-6-sheet-digital":5,
  "billboards-48-sheet-static":2,  "billboards-48-sheet-digital":2,
  "billboards-96-sheet-digital":1, "billboards-backlit-illuminated":2,
  "airport-regional-6-sheet-static":2, "airport-digital-6-sheet":2,
  "airport-large-format-digital":1,    "airport-48-sheet-approach-road":1,
  "taxi-superside-panel":5, "taxi-tip-seats-interior":10, "taxi-digital-tops":5,
  "rail-4-6-sheet-station-poster":5, "rail-digital-6-sheet-station":4,
  "rail-48-sheet-station":1, "rail-traincards-interior":20,
  "bus-rear-headliner":10, "bus-superside":10, "bus-t-side":5,
  "bus-streetliner":5, "bus-interior-panels":1,
  "bus-stops-6-sheet-static":5, "bus-stops-6-sheet-digital":4,
  "digital-advans-digital-advan-1-day":1, "digital-advans-digital-advan-3-days":1,
  "digital-advans-digital-advan-5-days":1, "digital-advans-electric-digital-advan":1,
  "digital-advans-static-advan-adbike":1,
  "london-underground-tube-car-panel":250,
  "london-underground-escalator-panel-lep-dep":4,
  "london-underground-digital-6-sheet":4,
  "london-underground-4-sheet-platform-poster":5,
  "london-underground-16-sheet-cross-track":2,
  "london-underground-48-sheet-cross-track":1,
  "london-underground-digital-escalator-ribbon":1
};
var MINIMUM_BUY_BY_CATEGORY = {
  "Billboards":2,"Airport":1,"Taxi":5,"Rail":4,"Bus":5,"Bus Stops":4,
  "Digital AdVans":1,"London Underground":4
};

/* ---------- §10 volume discount (BUSINESS RULE) ----------
   Applied to MEDIA only. Production and installation never discount. */
var VOLUME_BANDS = [
  {min:100, rate:0.15, label:"100+ units"},
  {min:50,  rate:0.10, label:"50–99 units"},
  {min:25,  rate:0.05, label:"25–49 units"}
];

/* ---------- §10 contingency reserve ----------
   Spec allows 5–10%. Held back rather than force-spent. */
var DEFAULT_RESERVE_PCT = 0.05;

/* ================= primitives ================= */
function basisDays(basis){ return BASIS_DAYS[basis] || null; }
function isMultipliable(f){ return basisDays(f.campaignBasis) !== null; }
function isPOA(f){ return f.costStatus === "POA" || !f.mid; }

/* §10 — a 28-day run on a 2-week basis is 2 cycles, never a pro-rata week. */
function cycles(f, days){
  var bd = basisDays(f.campaignBasis);
  if(bd === null) return null;
  return Math.max(1, Math.ceil(days / bd));
}
/* §7 — the billable factor, which is NOT always the cycle count. */
function cycleFactor(f, days){
  var n = cycles(f, days);
  if(n === null) return null;
  if(NON_LINEAR_BASIS[f.campaignBasis] && n >= 2){
    return {cycles:n, factor:1 + (n - 1) * MULTI_CYCLE_TAPER, tapered:true, reason:"basis"};
  }
  if(n > LINEAR_CYCLE_LIMIT){
    return {cycles:n, factor:LINEAR_CYCLE_LIMIT + (n - LINEAR_CYCLE_LIMIT) * LONG_RUN_TAPER,
            tapered:true, reason:"long-run"};
  }
  return {cycles:n, factor:n, tapered:false};
}

/* The hero passes city keys (manchester, leeds, glasgow…) as well as the
   wizard's london/regional/named/uk. Anything that is not London and not a
   UK-wide plan is priced against the regional band — never against a widened
   London+regional band, which would overstate a regional city. */
function normaliseGeo(geo, named){
  if(geo === "uk") return "uk";
  if(isLondonGeo(geo, named)) return "london";
  return "regional";
}
function priceBand(f, geo, named){
  var g = normaliseGeo(geo, named);
  if(g === "london") return {lo:f.londonLow, hi:f.londonHigh};
  if(g === "regional") return {lo:f.regionalLow, hi:f.regionalHigh};
  return {lo:Math.min(f.londonLow, f.regionalLow), hi:Math.max(f.londonHigh, f.regionalHigh)};
}
function unitMediaPrice(f, geo, mode, named){
  var g = normaliseGeo(geo, named);
  /* Master data: Planning Typical is the optimise target; use it as mid when
     available. Conservative = Planning High; optimistic = Planning Low. */
  var MD = window.BLMasterData;
  if(MD){
    var masterTy  = MD.typicalRate(f.id, g);
    var masterLo  = MD.lowRate(f.id, g);
    var masterHi  = MD.highRate(f.id, g);
    if(masterTy != null){
      if(mode === "conservative") return masterHi != null ? masterHi : masterTy;
      if(mode === "optimistic")   return masterLo != null ? masterLo : masterTy;
      return masterTy;   /* indicative / mid = Planning Typical */
    }
  }
  /* Fallback: existing band arithmetic */
  var band = priceBand(f, geo, named);
  if(mode === "conservative") return band.hi;
  if(mode === "optimistic")   return band.lo;
  return g === "uk" ? f.mid : (band.lo + band.hi) / 2;
}

/* Planning Low / High uncertainty range for display — master data sourced. */
function unitPriceRange(f, geo, named){
  var g = normaliseGeo(geo, named);
  var MD = window.BLMasterData;
  if(MD){
    var lo = MD.lowRate(f.id, g);
    var hi = MD.highRate(f.id, g);
    if(lo != null && hi != null) return {lo:lo, hi:hi};
  }
  var band = priceBand(f, geo, named);
  return {lo:band.lo, hi:band.hi};
}

function isLondonGeo(geo, named){
  if(geo === "london") return true;
  if(LONDON_NAMED[String(geo || "").toLowerCase()]) return true;
  if(geo === "named") return !!LONDON_NAMED[String(named || "").toLowerCase()];
  return false;
}
/* §10 — geography is enforced, not decorative. */
function isGeoEligible(f, geo, named){
  if(LONDON_ONLY_CATEGORIES.indexOf(f.category) === -1) return true;
  if(geo === "uk") return true;                 // national plan may include London
  return isLondonGeo(geo, named);
}

function minimumBuy(f){
  if(MINIMUM_BUY[f.id] != null) return MINIMUM_BUY[f.id];
  return MINIMUM_BUY_BY_CATEGORY[f.category] || 1;
}
function volumeBand(qty){
  for(var i=0;i<VOLUME_BANDS.length;i++){ if(qty >= VOLUME_BANDS[i].min) return VOLUME_BANDS[i]; }
  return null;
}
function volumeDiscountRate(qty){ var b = volumeBand(qty); return b ? b.rate : 0; }

/* ================= quoting ================= */
/* opts: {geo, named, days, mode, includeProduction} */
function quote(f, opts){
  if(isPOA(f) || !isMultipliable(f)) return null;
  if(!isGeoEligible(f, opts.geo, opts.named)) return null;
  var cf = cycleFactor(f, opts.days);
  if(!cf) return null;
  var g = normaliseGeo(opts.geo, opts.named);
  var rawUnit = unitMediaPrice(f, opts.geo, opts.mode, opts.named);
  /* §MD Minimum Spend enforcement: per-unit price must not go below the
     master-data floor (prevents optimistic pricing below minimum rate). */
  var MD = window.BLMasterData;
  if(MD){
    var mMin = MD.minSpend(f.id, g);
    if(mMin != null && rawUnit < mMin) rawUnit = mMin;
  }
  var mediaUnit = rawUnit * cf.factor;
  var inc = opts.includeProduction !== false;
  var unitTotal = mediaUnit + (inc ? f.production + f.installation : 0);
  var minQty = minimumBuy(f);
  /* Uncertainty range from master data (shown in UI, not used in allocation) */
  var prRange = unitPriceRange(f, opts.geo, opts.named);
  return {
    f: f,
    cycles: cf.cycles,
    factor: cf.factor,
    tapered: cf.tapered,
    taperNote: cf.tapered
      ? (cf.reason === "long-run"
          ? "A " + cf.cycles + "-cycle run is a long-term commitment, not " + cf.cycles + " separate bookings — it is quoted below a straight multiple of the " + f.campaignBasis + " rate card. Confirm the long-run rate before booking."
          : f.campaignBasis + " is bought as a negotiated cycle — additional cycles are quoted below a straight multiple, not extrapolated linearly. Confirm the multi-cycle rate before booking.")
      : null,
    mediaUnit: mediaUnit,
    mediaUnitLo: prRange.lo * cf.factor,
    mediaUnitHi: prRange.hi * cf.factor,
    plannerReview: !!(MD && MD.needsPlannerReview(f)),
    production: f.production,
    installation: f.installation,
    unitTotal: unitTotal,
    minQty: minQty,
    entryCost: unitTotal * minQty   // the real price of a buyable plan
  };
}

/* A fully costed line at a given quantity, with the volume discount applied. */
function line(q, qty, opts){
  if(!q || qty <= 0) return null;
  var inc = opts && opts.includeProduction !== false;
  var band = volumeBand(qty);
  var rate = band ? band.rate : 0;
  var mediaGross = q.mediaUnit * qty;
  var discount = mediaGross * rate;
  var media = mediaGross - discount;
  var production   = inc ? q.production * qty : 0;
  var installation = inc ? q.installation * qty : 0;
  var f = q.f;
  return {
    f: f, q: q, qty: qty, cycles: q.cycles, tapered: q.tapered, taperNote: q.taperNote,
    mediaGross: mediaGross,
    discountRate: rate, discountLabel: band ? band.label : null, discountAmount: discount,
    media: media, production: production, installation: installation,
    total: media + production + installation,
    extraCost: inc ? 0 : (q.production + q.installation) * qty,
    impactsLow:  f.impactsCampaignLow  != null ? f.impactsCampaignLow  * q.cycles * qty : null,
    impactsHigh: f.impactsCampaignHigh != null ? f.impactsCampaignHigh * q.cycles * qty : null
  };
}

/* Largest quantity of q affordable within cash, respecting the minimum buy and
   the fact that crossing a discount band can make MORE units cost less. */
function maxAffordableQty(q, cash, opts){
  if(!q) return 0;
  var best = 0;
  var ceiling = Math.floor(cash / Math.max(1, q.unitTotal * (1 - 0.15))) + 2;
  for(var n = q.minQty; n <= ceiling && n < 100000; n++){
    var l = line(q, n, opts);
    if(l.total <= cash) best = n; else if(n > q.minQty + 200) break;
  }
  return best;
}

/* ================= budget shape ================= */
function reserveFor(budget, pct){
  var p = pct == null ? DEFAULT_RESERVE_PCT : pct;
  p = Math.max(0, Math.min(0.10, p));
  return budget * p;
}
function usableBudget(budget, pct){ return budget - reserveFor(budget, pct); }

/* ================= §10 excluded-format disclosure ================= */
function exclusions(data, opts){
  var out = [];
  var eligible = data.map(function(f){ return {f:f, q:quote(f, opts)}; })
                     .filter(function(c){ return c.q; });
  function alternativeFor(f){
    var sameCat = eligible.filter(function(c){ return c.f.category === f.category; })
                          .sort(function(a,b){ return a.q.entryCost - b.q.entryCost; })[0];
    var any = eligible.slice().sort(function(a,b){ return a.q.entryCost - b.q.entryCost; })[0];
    var pick = sameCat || any;
    return pick ? pick.f : null;
  }
  var MD = window.BLMasterData;
  /* Planner-review formats: included in plan but disclosed separately */
  var plannerReview = [];
  data.forEach(function(f){
    var reason = null;
    var isPR = !!(MD && MD.needsPlannerReview(f));
    if(isPOA(f)){
      reason = "Priced on application — convoy size, routes and duration set the cost, so it can't be auto-planned.";
    } else if(!isMultipliable(f)){
      reason = "Sold as a " + f.campaignBasis + " commitment rather than in repeatable cycles, so it can't be scaled to a " +
               opts.days + "-day plan without a bespoke quote.";
    } else if(!isGeoEligible(f, opts.geo, opts.named)){
      reason = "London Underground inventory only exists in London and isn't available for this geography.";
    } else {
      var q = quote(f, opts);
      if(q && opts.budget != null && q.entryCost > opts.budget){
        reason = "Minimum buy is " + q.minQty + " × " + f.buyingUnit.replace(/^per /,"") +
                 " (about £" + Math.round(q.entryCost).toLocaleString("en-GB") + "), which is above this budget.";
      }
    }
    if(isPR && !reason){
      /* Not excluded — but needs a planner call before booking */
      plannerReview.push({format: f.format, category: f.category,
        note: f.category + " pricing varies significantly by location, season and campaign duration — confirm availability and final cost with a planner before committing."});
    }
    if(reason){
      var alt = alternativeFor(f);
      out.push({
        format: f.format, category: f.category, reason: reason, plannerReview: isPR,
        alternative: alt && alt.id !== f.id ? (alt.category + " — " + alt.format) : null
      });
    }
  });
  out.plannerReview = plannerReview;
  return out;
}

/* ================= §9 audience ================= */
/* Impacts only, always as a range. There is deliberately no reach() or
   frequency() function here: those require Route or operator data and are
   never derived from a divisor. */
function impactsRange(lines){
  var lo = 0, hi = 0, have = false, conf = [];
  lines.forEach(function(l){
    if(!l || l.impactsLow == null) return;
    lo += l.impactsLow; hi += l.impactsHigh; have = true;
    if(l.f.impactConfidence) conf.push(l.f.impactConfidence);
  });
  if(!have) return null;
  return {
    low: lo, high: hi, mid: (lo + hi) / 2,
    confidence: conf.indexOf("Low-Medium") > -1 ? "Low-Medium" : (conf[0] || null)
  };
}
/* Cost per 1,000 impacts — derived from data, not invented. */
function costPerThousand(spend, impacts){
  if(!impacts || !impacts.mid || !impacts.low || !impacts.high) return null;
  if(impacts.low <= 0 || impacts.mid <= 0 || impacts.high <= 0) return null;
  return {
    low:  spend / (impacts.high / 1000),
    high: spend / (impacts.low  / 1000),
    mid:  spend / (impacts.mid  / 1000)
  };
}

/* ================= the plan builder =================
   ONE allocator, used by both the live console and the step wizard. They used
   to have separate implementations that agreed on price but not on quantity,
   which is exactly the class of bug this module exists to prevent.

   `score` is supplied by the caller because the wizard also weighs audience
   match and format preference; everything about how money turns into a
   bookable quantity lives here. */
function buildPlan(data, opts, sc, score){
  var reserve = reserveFor(opts.budget, opts.reservePct);
  var usable = opts.budget - reserve;

  /* Best-scoring format per category, so a mix never doubles up on one line. */
  var byCat = {};
  data.forEach(function(f){
    var q = quote(f, opts);
    if(!q || q.entryCost > opts.budget) return;      // §10 minimum buy must be affordable
    var sc2 = score(f, q);
    if(!byCat[f.category] || sc2 > byCat[f.category].score){
      byCat[f.category] = {cat:f.category, f:f, q:q, score:sc2};
    }
  });
  var cands = Object.keys(byCat).map(function(c){ return byCat[c]; })
                    .sort(function(a,b){ return b.score - a.score; });
  if(!cands.length) return {infeasible:true, reserve:reserve, usable:usable, candidates:[]};

  var anchor = cands[0], reinforcement = null;
  for(var i = 1; i < cands.length; i++){
    if(cands[i].cat !== anchor.cat){ reinforcement = cands[i]; break; }
  }

  var picks = [{c:anchor, pct:sc.anchorPct}];
  if(reinforcement) picks.push({c:reinforcement, pct:sc.reinforcePct});
  var rest = 1 - (sc.anchorPct + (reinforcement ? sc.reinforcePct : 0));
  var fills = [0.5, 0.3, 0.2], wi = 0;
  for(var j = 0; j < cands.length && rest > 0.02 && wi < fills.length; j++){
    var c = cands[j];
    if(c === anchor || c === reinforcement) continue;
    var share = rest * fills[wi];
    if(c.q.entryCost > usable * share) continue;
    picks.push({c:c, pct:share});
    rest -= share; wi++;
  }

  var lines = [], planned = 0;
  picks.forEach(function(p){
    var qty = maxAffordableQty(p.c.q, usable * p.pct, opts);
    if(qty < p.c.q.minQty){
      /* The share alone can't reach a buyable quantity — take exactly the
         minimum if the rest of the budget still covers it, rather than
         dropping the format silently. */
      var minLine = line(p.c.q, p.c.q.minQty, opts);
      if(minLine.total <= usable - planned){ lines.push(minLine); planned += minLine.total; }
      return;
    }
    var l = line(p.c.q, qty, opts);
    lines.push(l); planned += l.total;
  });

  if(!lines.length){
    var n0 = maxAffordableQty(anchor.q, usable, opts);
    if(n0 < anchor.q.minQty){
      return {infeasible:true, reserve:reserve, usable:usable, minBuy:anchor.q, candidates:cands};
    }
    lines.push(line(anchor.q, n0, opts));
    planned = lines[0].total;
  }

  /* Top up with the cheapest marginal unit available anywhere in the mix.
     Crossing a volume band can make MORE units cost less, which is what this
     finds. It stops the moment nothing else fits — nothing force-spent, and
     nothing quietly left on the table. */
  var guard = 0;
  while(guard++ < 4000){
    var bestIdx = -1, bestCost = Infinity, bestLine = null;
    for(var k = 0; k < lines.length; k++){
      var trial = line(lines[k].q, lines[k].qty + 1, opts);
      var marginal = trial.total - lines[k].total;
      if(marginal < bestCost && (planned - lines[k].total) + trial.total <= usable){
        bestIdx = k; bestCost = marginal; bestLine = trial;
      }
    }
    if(bestIdx === -1) break;
    planned = (planned - lines[bestIdx].total) + bestLine.total;
    lines[bestIdx] = bestLine;
  }

  var media = 0, mediaGross = 0, production = 0, installation = 0, discount = 0, sites = 0;
  lines.forEach(function(l){
    media += l.media; mediaGross += l.mediaGross;
    production += l.production; installation += l.installation;
    discount += l.discountAmount; sites += l.qty;
  });

  return {
    infeasible:false, candidates:cands,
    anchor:anchor, reinforcement:reinforcement,
    lines:lines, planned:planned, reserve:reserve, usable:usable,
    media:media, mediaGross:mediaGross, production:production,
    installation:installation, discount:discount, sites:sites,
    impacts:impactsRange(lines),
    tapered:lines.some(function(l){ return l.tapered; }),
    taperNotes:lines.filter(function(l){ return l.taperNote; })
                    .map(function(l){ return l.f.format + ": " + l.taperNote; })
  };
}

window.BLCalc = {
  BASIS_DAYS: BASIS_DAYS,
  VOLUME_BANDS: VOLUME_BANDS,
  MULTI_CYCLE_TAPER: MULTI_CYCLE_TAPER,
  LINEAR_CYCLE_LIMIT: LINEAR_CYCLE_LIMIT,
  LONG_RUN_TAPER: LONG_RUN_TAPER,
  DEFAULT_RESERVE_PCT: DEFAULT_RESERVE_PCT,
  basisDays: basisDays,
  isMultipliable: isMultipliable,
  isPOA: isPOA,
  cycles: cycles,
  cycleFactor: cycleFactor,
  normaliseGeo: normaliseGeo,
  priceBand: priceBand,
  unitMediaPrice: unitMediaPrice,
  unitPriceRange: unitPriceRange,
  isLondonGeo: isLondonGeo,
  isGeoEligible: isGeoEligible,
  minimumBuy: minimumBuy,
  volumeBand: volumeBand,
  volumeDiscountRate: volumeDiscountRate,
  quote: quote,
  line: line,
  maxAffordableQty: maxAffordableQty,
  reserveFor: reserveFor,
  usableBudget: usableBudget,
  buildPlan: buildPlan,
  exclusions: exclusions,
  impactsRange: impactsRange,
  costPerThousand: costPerThousand
};
})();
