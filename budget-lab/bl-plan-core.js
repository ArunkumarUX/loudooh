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

window.BLPlanCore = {
  AUDIENCES: AUDIENCES,
  TRANSPORT_CATS: TRANSPORT_CATS,
  CPM_FLOOR: CPM_FLOOR,
  CPM_CEIL: CPM_CEIL,
  calcOpts: calcOpts,
  scoreFormat: scoreFormat,
  cpmEfficiency: cpmEfficiency,
  unitCpm: unitCpm,
  techAdjustment: techAdjustment,
  reservePct: reservePct
};
})();
