/* bl-plan-core.js — shared plan inputs and format scoring.
   hero.js and engine.js MUST use this so the live calculator and the plan
   summary never diverge on basis, planning mode, audience or format pref. */
(function(){
"use strict";

var C = window.BLCalc;
var CPM_FLOOR = 1;
var CPM_CEIL = 40;
var TRANSPORT_CATS = ["Bus","Bus Stops","Rail","London Underground","Taxi"];

var AUDIENCES = [
  {id:"broad", label:"Broad", kw:[]},
  {id:"commuters", label:"Commuters", kw:["commuter"]},
  {id:"local", label:"Local residents", kw:["local","high-street"]},
  {id:"retail", label:"Retail catchment", kw:["high-street","local","roadside"]},
  {id:"urban", label:"Urban", kw:["urban","route frequency","roadside"]},
  {id:"airport", label:"Airport travellers", kw:["terminal","passenger"]},
  {id:"event", label:"Event audience", kw:["event","mobile route"]},
  {id:"other", label:"Other", kw:[]}
];

function intersects(a, b){
  return a.some(function(x){ return b.indexOf(x) > -1; });
}

function unitCpm(f, q){
  if(f.impactsCampaignLow == null) return null;
  var impacts = ((f.impactsCampaignLow + f.impactsCampaignHigh) / 2) * q.cycles;
  if(!impacts) return null;
  return q.unitTotal / (impacts / 1000);
}

function cpmEfficiency(f, q){
  var cpm = unitCpm(f, q);
  if(cpm === null) return 0.5;
  return Math.max(0, Math.min(1, (CPM_CEIL - cpm) / (CPM_CEIL - CPM_FLOOR)));
}

function techAdjustment(f, pref){
  if(pref === "static") return f.technology === "DOOH" ? -12 : 10;
  if(pref === "digital") return f.technology === "Static" ? -12 : 10;
  if(pref === "transport") return TRANSPORT_CATS.indexOf(f.category) > -1 ? 12 : -8;
  if(pref === "advan") return f.category === "Digital AdVans" ? 15 : -10;
  if(pref === "premium") return (f.specialist || f.mid >= 1500) ? 15 : -8;
  return 0;
}

/* Canonical calc opts from store state — honours basis, planning mode, reserve. */
function calcOpts(state, over){
  state = state || {};
  over = over || {};
  var basis = over.basis != null ? over.basis : state.basis;
  var planningMode = over.planningMode != null ? over.planningMode : state.planningMode;
  return {
    geo: over.geo != null ? over.geo : state.geo,
    named: over.named != null ? over.named : (state.named || ""),
    days: over.days || over.durationDays || state.durationDays,
    objective: over.objective != null ? over.objective : state.objective,
    mode: planningMode === "conservative" ? "conservative" : "mid",
    includeProduction: basis !== "media-only",
    reservePct: over.reservePct != null ? over.reservePct : state.reservePct,
    budget: over.budget != null ? over.budget : state.budget
  };
}

function scoreFormat(f, q, scenarioKey, state, scenarios){
  var sc = scenarios[scenarioKey];
  if(!sc) return 0;
  var score = 0;
  score += sc.weights[f.category] != null ? sc.weights[f.category] : 6;
  score += intersects(f.roles, sc.favouredRoles) ? 14 : 4;
  var aud = AUDIENCES.filter(function(a){ return a.id === state.audience; })[0] || AUDIENCES[0];
  var audCtx = (f.audienceContext || "").toLowerCase();
  var audMatch = aud.kw.length && aud.kw.some(function(k){ return audCtx.indexOf(k) > -1; });
  score += aud.kw.length === 0 ? 12 : (audMatch ? 20 : 6);
  score += sc.effWeight * cpmEfficiency(f, q);
  var creative = 3;
  if(scenarioKey === "premium" && f.technology === "DOOH") creative = 5;
  if((scenarioKey === "local" || scenarioKey === "frequency") && f.technology === "Static") creative = 5;
  score += creative + 5;
  score += techAdjustment(f, state.formatPref);
  var allowSpecialist = scenarioKey === "premium" || state.formatPref === "premium";
  if(f.specialist) score += allowSpecialist ? 5 : -25;
  if(f.impactConfidence === "Low-Medium") score -= 4;
  return Math.max(0, Math.min(100, score));
}

function reservePct(state){
  if(state && state.reservePct != null) return state.reservePct;
  return C ? C.DEFAULT_RESERVE_PCT : 0.05;
}

/* ---------- plan score (honest, breakdown-carrying) ----------
   Replaces the old "50 + impacts + formats" formula that floored every plan
   at 50 and only ever climbed: no plan could look weak, so the number meant
   nothing. This one starts at zero and has to earn every point across five
   dimensions, and it returns the breakdown so the UI can show WHY. */
var SCORE_WEIGHTS = {fit:30, utilisation:20, efficiency:20, evidence:15, shape:15};

function planScore(result, scenarios){
  if(!result || result.infeasible || !result.lines || !result.lines.length) return null;
  var sc = result.scenario || (scenarios ? scenarios[result.scenarioKey] : null);
  var budget = result.state && result.state.budget ? result.state.budget : (result.spend * 1.25);

  /* 1. Objective fit (0-30): is the spend actually sitting in the categories
     this scenario prioritises? Weighted by spend, normalised on the highest
     category weight in the scenario. */
  var maxW = 6, fitNum = 0, fitDen = 0;
  if(sc && sc.weights){
    Object.keys(sc.weights).forEach(function(k){ if(sc.weights[k] > maxW) maxW = sc.weights[k]; });
    result.lines.forEach(function(l){
      var w = sc.weights[l.f.category] != null ? sc.weights[l.f.category] : 6;
      fitNum += w * l.total; fitDen += l.total;
    });
  } else {
    fitNum = 0.5 * maxW; fitDen = 1;
  }
  var fit = fitDen ? Math.round(SCORE_WEIGHTS.fit * (fitNum / fitDen) / maxW) : 0;

  /* 2. Budget working hard (0-20): usable budget is spend + unallocated.
     Money left on the table (beyond the contingency) is a real planning miss
     at size, so utilisation below ~98% starts costing points; below 50% the
     plan is barely using the brief at all. */
  var usable = result.usable != null ? result.usable : budget * 0.95;
  var util = usable > 0 ? result.spend / usable : 0;
  var utilisation = util >= 0.98 ? SCORE_WEIGHTS.utilisation
    : Math.max(0, Math.round(SCORE_WEIGHTS.utilisation * (util - 0.5) / 0.48));

  /* 3. Delivery efficiency (0-20): cost per 1,000 impacts judged against the
     band most UK OOH actually trades in (roughly £2-£16). A £1-£40 planning
     band would make almost everything look efficient and the number would
     stop meaning anything. */
  var efficiency = 0, cpmMid = result.cpm ? result.cpm.mid : null;
  if(cpmMid != null){
    efficiency = Math.round(SCORE_WEIGHTS.efficiency *
      Math.max(0, Math.min(1, (16 - cpmMid) / (16 - 2))));
  }

  /* 4. Evidence quality (0-15): spend-weighted confidence of the impact
     benchmarks behind the plan. Even Medium-confidence planning data caps
     below full marks, because it is not Route-measured site data. */
  var evNum = 0, evDen = 0;
  result.lines.forEach(function(l){
    var c = l.f.impactConfidence === "Medium" ? 0.7 : l.f.impactConfidence === "Low-Medium" ? 0.4 : 0.2;
    evNum += c * l.total; evDen += l.total;
  });
  var evidence = evDen ? Math.round(SCORE_WEIGHTS.evidence * (evNum / evDen)) : 0;

  /* 5. Plan shape (0-15): right structure for the money. Small budgets are
     honestly concentrated and score full marks on one or two lines; bigger
     budgets should diversify, and a single-format plan at £50k+ loses points. */
  var expected = budget < 5000 ? 1 : budget < 25000 ? 2 : 3;
  var shape = Math.round(SCORE_WEIGHTS.shape * Math.min(1, result.lines.length / expected));

  var total = Math.max(0, Math.min(100, fit + utilisation + efficiency + evidence + shape));
  var gbpish = function(n){ return "£" + Math.round(n).toLocaleString("en-GB"); };
  return {
    total: total,
    label: total >= 85 ? "Excellent" : total >= 70 ? "Strong" : total >= 55 ? "Good" : total >= 40 ? "Fair" : "Weak",
    breakdown: [
      {key:"fit", label:"Objective fit", earned:fit, max:SCORE_WEIGHTS.fit,
       note:"How much of the spend sits in the formats this objective prioritises."},
      {key:"utilisation", label:"Budget working hard", earned:utilisation, max:SCORE_WEIGHTS.utilisation,
       note:util >= 0.98 ? "Almost all of the usable budget is allocated." :
             "About " + Math.round(util * 100) + "% of the usable budget is allocated; the rest is unspent."},
      {key:"efficiency", label:"Delivery efficiency", earned:efficiency, max:SCORE_WEIGHTS.efficiency,
       note:cpmMid != null ? gbpish(cpmMid) + " per 1,000 impacts, judged against the £2–£16 band most UK OOH trades in."
                           : "No impact benchmark to cost against."},
      {key:"evidence", label:"Evidence quality", earned:evidence, max:SCORE_WEIGHTS.evidence,
       note:"Weighted by how well the audience data behind each line is sourced. Planning benchmarks cap below full marks; only Route-measured data would score higher."},
      {key:"shape", label:"Plan shape", earned:shape, max:SCORE_WEIGHTS.shape,
       note:result.lines.length + " format" + (result.lines.length === 1 ? "" : "s") + " for a " + gbpish(budget) + " budget; expected around " + expected + "."}
    ]
  };
}

window.BLPlanCore = {
  AUDIENCES: AUDIENCES,
  TRANSPORT_CATS: TRANSPORT_CATS,
  CPM_FLOOR: CPM_FLOOR,
  CPM_CEIL: CPM_CEIL,
  calcOpts: calcOpts,
  scoreFormat: scoreFormat,
  planScore: planScore,
  SCORE_WEIGHTS: SCORE_WEIGHTS,
  cpmEfficiency: cpmEfficiency,
  unitCpm: unitCpm,
  techAdjustment: techAdjustment,
  reservePct: reservePct
};
})();
