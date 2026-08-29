/* ============================================================
   LOUD! OOH — Budget Lab hero estimator
   Lightweight instant estimator driven by window.__BL_DATA__
   (same verified 2026 rate-card data used by engine.js).
   Mirrors engine.js scoring / allocation conventions.
   ============================================================ */
(function(){
"use strict";

var DATA = window.__BL_DATA__ || [];
if(!DATA.length) return;

/* ---------- scenario table (labels mirror engine.js) ---------- */
var SCENARIOS = {
  reach:     {anchorPct:.68, reinforcePct:.17, favouredCategories:["Billboards","Bus Stops","Bus","Rail"], favouredRoles:["reach"], freq:3.4},
  local:     {anchorPct:.62, reinforcePct:.25, favouredCategories:["Bus Stops","Billboards","Bus"], favouredRoles:["local-visibility","frequency"], freq:4.2},
  frequency: {anchorPct:.60, reinforcePct:.25, favouredCategories:["Bus","Rail","London Underground","Bus Stops"], favouredRoles:["frequency"], freq:4.8},
  premium:   {anchorPct:.72, reinforcePct:.14, favouredCategories:["Airport","London Underground","Billboards"], favouredRoles:["stature","premium-audience"], freq:3.0},
  balanced:  {anchorPct:.52, reinforcePct:.28, favouredCategories:["Billboards","Bus","Bus Stops"], favouredRoles:["reach","frequency"], freq:3.7}
};
var CAT_LABEL = {"Billboards":"Billboards","London Underground":"London Underground","Bus":"Buses","Bus Stops":"Bus Stops","Rail":"Rail","Taxi":"Taxis","Airport":"Airports","Digital AdVans":"AdVans"};
var COLORS = ["#3B6FE0","#8B5CF6","#F5A623","#F2C94C","#EB5757","#56CCF2","#4CAF7D"];

var BASIS_DAYS = {"1 day":1,"3 days":3,"5 days":5,"1 week":7,"2 weeks":14,"4 weeks":28};

/* fixed hero state (full planner offers the rest) */
var state = {budget:50000, days:14, objective:"reach"};

/* ---------- pricing helpers (same approach as engine.js) ---------- */
function basisDays(b){ return BASIS_DAYS[b] || null; }
function isMultipliable(f){ return basisDays(f.campaignBasis) !== null; }
function unitMediaPrice(f){ return (f.regionalLow + f.regionalHigh) / 2; } /* regional, indicative */
function durationMultiplier(f, days){
  var bd = basisDays(f.campaignBasis);
  if(bd === null) return null;
  return Math.max(1, Math.ceil(days / bd));
}
function unitTotal(f, days){
  var m = durationMultiplier(f, days);
  if(m === null) return null;
  return unitMediaPrice(f) * m + f.production + f.installation;
}
function intersects(a,b){ return a.some(function(x){ return b.indexOf(x) > -1; }); }

/* ---------- scoring (mirrors engine.js scoreCandidate) ---------- */
function score(f, obj){
  var sc = SCENARIOS[obj], s = 0;
  s += sc.favouredCategories.indexOf(f.category) > -1 ? 30 : (intersects(f.roles, sc.favouredRoles) ? 18 : 8);
  s += 12; /* broad audience */
  s += 15; /* geography baseline */
  var ut = unitTotal(f, state.days);
  var eff = ut ? Math.max(0, Math.min(1, 1 - (ut / Math.max(state.budget, 1)))) : 0;
  s += 15 * eff;
  s += intersects(f.roles, ["reach","frequency"]) ? 10 : 5;
  var creative = 3;
  if(obj === "premium" && f.technology === "DOOH") creative = 5;
  if((obj === "local" || obj === "frequency") && f.technology === "Static") creative = 5;
  s += creative + 5;
  if(f.specialist) s += obj === "premium" ? 5 : -25;
  if(f.impactConfidence === "Low-Medium") s -= 4;
  return Math.max(0, Math.min(100, s));
}

/* best (highest scoring) feasible format per category */
function categoryCandidates(){
  var byCat = {};
  DATA.forEach(function(f){
    if(!isMultipliable(f)) return;
    var ut = unitTotal(f, state.days);
    if(ut === null || ut > state.budget) return;
    var s = score(f, state.objective);
    if(!byCat[f.category] || s > byCat[f.category].score){
      byCat[f.category] = {f:f, ut:ut, score:s};
    }
  });
  return Object.keys(byCat).map(function(c){
    return {cat:c, f:byCat[c].f, ut:byCat[c].ut, score:byCat[c].score};
  }).sort(function(a,b){ return b.score - a.score; });
}

/* ---------- allocation ---------- */
function estimate(){
  var cands = categoryCandidates();
  if(!cands.length) return null;
  var sc = SCENARIOS[state.objective];
  var budget = state.budget;

  var anchor = cands[0];
  var reinforcement = null;
  for(var i=1;i<cands.length;i++){ if(cands[i].cat !== anchor.cat){ reinforcement = cands[i]; break; } }

  /* target shares of budget */
  var shares = [{c:anchor, pct:sc.anchorPct}];
  if(reinforcement) shares.push({c:reinforcement, pct:sc.reinforcePct});
  var used = sc.anchorPct + (reinforcement ? sc.reinforcePct : 0);
  var rest = 1 - used;
  var fillWeights = [.5,.3,.2], wi = 0;
  for(var j=0;j<cands.length && rest > 0.02 && wi < fillWeights.length;j++){
    var c = cands[j];
    if(c === anchor || c === reinforcement) continue;
    if(c.ut > budget * rest * fillWeights[wi]) continue; /* can't even buy 1 unit */
    var p = rest * fillWeights[wi];
    shares.push({c:c, pct:p});
    rest -= p; wi++;
  }
  if(reinforcement) shares[1].pct += rest; else shares[0].pct += rest;

  /* units + spend per category */
  var totalImpacts = 0, planned = 0;
  var segs = shares.map(function(sh){
    var qty = Math.max(1, Math.floor((sh.pct * budget) / sh.c.ut));
    var spend = qty * sh.c.ut;
    var mult = durationMultiplier(sh.c.f, state.days) || 1;
    var impMid = sh.c.f.impactsCampaignLow != null
      ? ((sh.c.f.impactsCampaignLow + sh.c.f.impactsCampaignHigh) / 2) * mult * qty
      : 0;
    totalImpacts += impMid;
    planned += spend;
    return {cat:CAT_LABEL[sh.c.cat] || sh.c.cat, spend:spend};
  });

  /* leftover rolls to anchor (engine.js behaviour) */
  var leftover = budget - planned;
  while(leftover >= anchor.ut){ segs[0].spend += anchor.ut; leftover -= anchor.ut; planned += anchor.ut; }

  var freq = sc.freq;
  return {
    segments: segs,
    impressions: totalImpacts,
    reach: totalImpacts / freq,
    freq: freq,
    planned: planned
  };
}

/* ---------- formatting ---------- */
function gbp(n){ return "£" + Math.round(n).toLocaleString("en-GB"); }
function compact(n){
  if(n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"") + "M";
  if(n >= 1e3) return Math.round(n/1e3) + "K";
  return Math.round(n).toString();
}

/* ---------- count-up animation ---------- */
function countUp(el, target, fmt){
  var from = parseFloat(el.getAttribute("data-v") || "0");
  var start = null, dur = 750;
  el.setAttribute("data-v", target);
  function frame(ts){
    if(start === null) start = ts;
    var p = Math.min(1, (ts - start) / dur);
    var e = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
    el.textContent = fmt(from + (target - from) * e);
    if(p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------- donut ---------- */
var CIRC = 2 * Math.PI * 56;
function renderDonut(est){
  var g = document.getElementById("hl-donut");
  var legend = document.getElementById("hl-legend");
  var total = state.budget;
  g.innerHTML = ""; legend.innerHTML = "";
  var acc = 0;
  est.segments.forEach(function(seg, i){
    var pct = seg.spend / total;
    if(pct <= 0.005) return;
    var color = COLORS[i % COLORS.length];
    var c = document.createElementNS("http://www.w3.org/2000/svg","circle");
    c.setAttribute("cx","74"); c.setAttribute("cy","74"); c.setAttribute("r","56");
    c.setAttribute("fill","none"); c.setAttribute("stroke",color);
    c.setAttribute("stroke-width","17");
    c.setAttribute("stroke-linecap","butt");
    var gap = Math.min(1.6, CIRC * pct * .08);
    var dash = Math.max(0, CIRC * pct - gap);
    c.setAttribute("stroke-dasharray", dash + " " + (CIRC - dash));
    c.setAttribute("stroke-dashoffset", -acc);
    c.style.opacity = "0";
    c.style.transition = "opacity .5s ease " + (i * .09) + "s";
    g.appendChild(c);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ c.style.opacity = "1"; }); });
    acc += CIRC * pct;

    var row = document.createElement("div");
    row.className = "bl-legend-row";
    row.innerHTML = '<i style="background:' + color + '"></i><span>' + seg.cat + '</span><b>' + Math.round(pct * 100) + '%</b>';
    legend.appendChild(row);
  });
  var tot = document.createElement("div");
  tot.className = "bl-legend-total";
  tot.innerHTML = '<span>Total (excl. VAT)</span><b>' + gbp(total) + '</b>';
  legend.appendChild(tot);
  document.getElementById("hl-donut-total").textContent = gbp(total);
}

/* ---------- slider mapping (£5k–£500k, exponential feel) ---------- */
function sliderToBudget(t){
  var b = 5000 * Math.pow(100, t / 1000); /* 5k → 500k */
  var step = b < 25000 ? 500 : (b < 100000 ? 1000 : 5000);
  b = Math.round(b / step) * step;
  return Math.min(500000, Math.max(5000, b));
}
function budgetToSlider(b){
  return Math.round(1000 * Math.log(b / 5000) / Math.log(100));
}

/* ---------- render ---------- */
function update(){
  document.getElementById("hl-budget-out").textContent = gbp(state.budget);
  var est = estimate();
  if(!est){
    ["hl-reach","hl-impressions"].forEach(function(id){ document.getElementById(id).textContent = "—"; });
    return;
  }
  countUp(document.getElementById("hl-reach"), est.reach, function(v){ return compact(v); });
  countUp(document.getElementById("hl-impressions"), est.impressions, function(v){ return compact(v); });
  countUp(document.getElementById("hl-frequency"), est.freq, function(v){ return v.toFixed(1); });
  renderDonut(est);
}

/* ---------- sync hero selections into the full planner (engine.js) ---------- */
function syncEngine(){
  try{
    var budgetInput = document.getElementById("bl-budget");
    if(budgetInput){
      budgetInput.value = state.budget.toLocaleString("en-GB");
      budgetInput.dispatchEvent(new Event("blur"));
    }
    var objBtn = document.querySelector('#bl-objective-grid [data-obj="' + state.objective + '"]');
    if(objBtn) objBtn.click();
    var durSel = document.getElementById("bl-duration");
    if(durSel){
      var v = String(state.days);
      var has = Array.prototype.some.call(durSel.options, function(o){ return o.value === v; });
      if(has){ durSel.value = v; durSel.dispatchEvent(new Event("change")); }
    }
  }catch(e){}
}

/* ---------- wire inputs ---------- */
function wire(){
  var slider = document.getElementById("hl-budget");
  function paint(){ slider.style.setProperty("--fill", ((slider.value - slider.min) / (slider.max - slider.min) * 100) + "%"); }
  slider.value = budgetToSlider(state.budget);
  paint();
  slider.addEventListener("input", function(){
    state.budget = sliderToBudget(parseFloat(slider.value));
    paint();
    update();
  });

  var dur = document.getElementById("hl-duration");
  dur.addEventListener("click", function(e){
    var btn = e.target.closest("[data-days]");
    if(!btn) return;
    state.days = parseInt(btn.getAttribute("data-days"), 10);
    dur.querySelectorAll("button").forEach(function(b){ b.classList.toggle("is-on", b === btn); });
    update();
  });

  var goals = document.getElementById("hl-goals");
  goals.addEventListener("click", function(e){
    var btn = e.target.closest("[data-obj]");
    if(!btn) return;
    state.objective = btn.getAttribute("data-obj");
    goals.querySelectorAll(".bl-goal").forEach(function(b){ b.classList.toggle("is-on", b === btn); });
    update();
  });

  function scrollTo(id){
    var el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
  }
  var see = document.getElementById("hl-see-results");
  if(see) see.addEventListener("click", function(){ syncEngine(); scrollTo("planner"); });
  var start = document.getElementById("bl-hero-start");
  if(start) start.addEventListener("click", function(){ syncEngine(); scrollTo("planner"); });
  var finalCta = document.getElementById("bl-final-cta");
  if(finalCta) finalCta.addEventListener("click", function(){ syncEngine(); scrollTo("planner"); });
  var finalStart = document.getElementById("bl-final-start");
  if(finalStart) finalStart.addEventListener("click", function(){ scrollTo("lab"); });
}

/* ---------- scroll reveal ---------- */
function reveal(){
  var els = document.querySelectorAll(".reveal");
  if(typeof IntersectionObserver !== "function"){
    els.forEach(function(el){ el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, {threshold:.12, rootMargin:"0px 0px -40px 0px"});
  els.forEach(function(el){ io.observe(el); });
}

/* ---------- boot ---------- */
function boot(){
  wire();
  update();
  reveal();
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
