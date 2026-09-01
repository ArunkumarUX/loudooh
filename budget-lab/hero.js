/* Budget Lab hero — live AI budget console + brief sync */
(function(){
"use strict";

var DATA = window.__BL_DATA__ || [];
if(!DATA.length) return;

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

var state = {budget:50000, days:14, objective:"reach", geo:"london", audience:"broad"};
var labEl = null;
var liveTimer = null;
var onSync = null;

var CITY_TO_GEO = {
  london:"london", manchester:"manchester", birmingham:"birmingham",
  leeds:"leeds", glasgow:"glasgow", uk:"uk", regional:"regional"
};

function readState(){
  if(window.BLState) return window.BLState.get();
  return {
    budget: state.budget,
    days: state.days,
    durationDays: state.days,
    objective: state.objective,
    geo: state.geo,
    audience: state.audience,
    named: ""
  };
}

function mapGeoKey(s){
  s = s || readState();
  if(s.mapGeo) return s.mapGeo;
  if(s.geo && CITY_TO_GEO[s.geo]) return s.geo;
  if(s.geo === "named" && s.named){
    var n = String(s.named).toLowerCase();
    if(CITY_TO_GEO[n]) return n;
    if(n.indexOf("manchester") > -1) return "manchester";
    if(n.indexOf("birmingham") > -1) return "birmingham";
    if(n.indexOf("leeds") > -1) return "leeds";
    if(n.indexOf("glasgow") > -1) return "glasgow";
  }
  if(s.geo === "uk" || s.geo === "regional") return s.geo;
  return "london";
}

function heroState(){
  var s = readState();
  s.mapGeo = mapGeoKey(s);
  return s;
}

function writeState(patch){
  if(window.BLState){
    window.BLState.set(patch, "hero");
    return;
  }
  if(patch.budget != null) state.budget = patch.budget;
  if(patch.days != null) state.days = patch.days;
  if(patch.durationDays != null) state.days = patch.durationDays;
  if(patch.objective != null) state.objective = patch.objective;
  if(patch.geo != null) state.geo = patch.geo;
  if(patch.audience != null) state.audience = patch.audience;
}

function basisDays(b){ return BASIS_DAYS[b] || null; }
function isMultipliable(f){ return basisDays(f.campaignBasis) !== null; }
function unitMediaPrice(f){ return (f.regionalLow + f.regionalHigh) / 2; }
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

function score(f, obj, st){
  st = st || readState();
  var sc = SCENARIOS[obj], s = 0;
  s += sc.favouredCategories.indexOf(f.category) > -1 ? 30 : (intersects(f.roles, sc.favouredRoles) ? 18 : 8);
  s += 12 + 15;
  var days = st.days || st.durationDays || 14;
  var ut = unitTotal(f, days);
  var eff = ut ? Math.max(0, Math.min(1, 1 - (ut / Math.max(st.budget, 1)))) : 0;
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

function categoryCandidates(){
  var st = readState();
  var days = st.days || st.durationDays || 14;
  var obj = st.objective || "reach";
  var byCat = {};
  DATA.forEach(function(f){
    if(!isMultipliable(f)) return;
    var ut = unitTotal(f, days);
    if(ut === null || ut > st.budget) return;
    var s = score(f, obj, st);
    if(!byCat[f.category] || s > byCat[f.category].score){
      byCat[f.category] = {f:f, ut:ut, score:s};
    }
  });
  return Object.keys(byCat).map(function(c){
    return {cat:c, f:byCat[c].f, ut:byCat[c].ut, score:byCat[c].score};
  }).sort(function(a,b){ return b.score - a.score; });
}

function estimate(){
  var st = readState();
  var days = st.days || st.durationDays || 14;
  var obj = st.objective || "reach";
  var cands = categoryCandidates();
  if(!cands.length) return null;
  var sc = SCENARIOS[obj];
  var budget = st.budget;
  var anchor = cands[0];
  var reinforcement = null;
  for(var i=1;i<cands.length;i++){ if(cands[i].cat !== anchor.cat){ reinforcement = cands[i]; break; } }

  var shares = [{c:anchor, pct:sc.anchorPct}];
  if(reinforcement) shares.push({c:reinforcement, pct:sc.reinforcePct});
  var used = sc.anchorPct + (reinforcement ? sc.reinforcePct : 0);
  var rest = 1 - used;
  var fillWeights = [.5,.3,.2], wi = 0;
  for(var j=0;j<cands.length && rest > 0.02 && wi < fillWeights.length;j++){
    var c = cands[j];
    if(c === anchor || c === reinforcement) continue;
    if(c.ut > budget * rest * fillWeights[wi]) continue;
    var p = rest * fillWeights[wi];
    shares.push({c:c, pct:p});
    rest -= p; wi++;
  }
  if(reinforcement) shares[1].pct += rest; else shares[0].pct += rest;

  var totalImpacts = 0, planned = 0, media = 0, prod = 0, install = 0;
  var segs = shares.map(function(sh){
    var qty = Math.max(1, Math.floor((sh.pct * budget) / sh.c.ut));
    var spend = qty * sh.c.ut;
    var mult = durationMultiplier(sh.c.f, days) || 1;
    var impMid = sh.c.f.impactsCampaignLow != null
      ? ((sh.c.f.impactsCampaignLow + sh.c.f.impactsCampaignHigh) / 2) * mult * qty
      : 0;
    totalImpacts += impMid;
    planned += spend;
    media += unitMediaPrice(sh.c.f) * mult * qty;
    prod += sh.c.f.production * qty;
    install += sh.c.f.installation * qty;
    return {cat:CAT_LABEL[sh.c.cat] || sh.c.cat, spend:spend, f:sh.c.f, qty:qty};
  });

  var leftover = budget - planned;
  while(leftover >= anchor.ut){
    segs[0].spend += anchor.ut;
    leftover -= anchor.ut;
    planned += anchor.ut;
    var am = durationMultiplier(anchor.f, days) || 1;
    media += unitMediaPrice(anchor.f) * am;
    prod += anchor.f.production;
    install += anchor.f.installation;
  }

  var spendTotal = media + prod + install || 1;
  return {
    segments: segs,
    impressions: totalImpacts,
    reach: totalImpacts / sc.freq,
    freq: sc.freq,
    planned: planned,
    spend: {media:media, prod:prod, install:install, total:spendTotal}
  };
}

function gbp(n){ return "£" + Math.round(n).toLocaleString("en-GB"); }
function compact(n){
  if(n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"") + "M";
  if(n >= 1e3) return Math.round(n/1e3) + "K";
  return Math.round(n).toString();
}

function countUp(el, target, fmt){
  if(!el) return;
  var from = parseFloat(el.getAttribute("data-v") || "0");
  var start = null, dur = 650;
  el.setAttribute("data-v", target);
  function frame(ts){
    if(start === null) start = ts;
    var p = Math.min(1, (ts - start) / dur);
    var e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (target - from) * e);
    if(p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

var CIRC = 2 * Math.PI * 56;
function renderDonut(est){
  var g = document.getElementById("hl-donut");
  var legend = document.getElementById("hl-legend");
  var total = readState().budget;
  if(!g || !legend) return;
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
    var gap = Math.min(1.6, CIRC * pct * .08);
    var dash = Math.max(0, CIRC * pct - gap);
    c.setAttribute("stroke-dasharray", dash + " " + (CIRC - dash));
    c.setAttribute("stroke-dashoffset", -acc);
    c.style.opacity = "0";
    c.style.transition = "opacity .45s ease " + (i * .08) + "s";
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
  var center = document.getElementById("hl-donut-total");
  if(center) center.textContent = gbp(total);
}

function renderSpendBars(spend){
  var total = spend.total;
  var rows = [
    {id:"hl-bar-media", pct:"hl-media-pct", val:spend.media, color:"#3B6FE0"},
    {id:"hl-bar-prod", pct:"hl-prod-pct", val:spend.prod, color:"#FF4A00"},
    {id:"hl-bar-install", pct:"hl-install-pct", val:spend.install, color:"#8B5CF6"}
  ];
  rows.forEach(function(r){
    var bar = document.getElementById(r.id);
    var pctEl = document.getElementById(r.pct);
    if(!bar || !pctEl) return;
    var p = Math.round((r.val / total) * 100);
    bar.style.width = p + "%";
    bar.style.background = r.color;
    pctEl.textContent = p + "%";
  });
}

function pulseLive(){
  if(!labEl) return;
  labEl.classList.add("is-recalc");
  clearTimeout(liveTimer);
  liveTimer = setTimeout(function(){ labEl.classList.remove("is-recalc"); }, 520);
}

function syncDownstream(est){
  var st = heroState();
  if(window.__BL_EXPLORE__ && window.__BL_EXPLORE__.render){
    window.__BL_EXPLORE__.render(est, st);
  }
  if(window.__BL_MAP__ && window.__BL_MAP__.update){
    window.__BL_MAP__.update(est, st);
  }
  if(window.__BL_FORECAST__ && window.__BL_FORECAST__.refresh){
    window.__BL_FORECAST__.refresh();
  }
  if(typeof onSync === "function") onSync();
}

function update(){
  var st = readState();
  var out = document.getElementById("hl-budget-out");
  if(out) out.textContent = gbp(st.budget);
  pulseLive();
  var est = estimate();
  if(!est){
    ["hl-reach","hl-impressions","hl-frequency"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.textContent = "—";
    });
    syncDownstream(null);
    return;
  }
  var reachEl = document.getElementById("hl-reach");
  var impEl = document.getElementById("hl-impressions");
  var freqEl = document.getElementById("hl-frequency");
  if(reachEl) countUp(reachEl, est.reach, function(v){ return compact(v); });
  if(impEl) countUp(impEl, est.impressions, function(v){ return compact(v); });
  if(freqEl) countUp(freqEl, est.freq, function(v){ return v.toFixed(1); });
  renderDonut(est);
  renderSpendBars(est.spend);
  syncDownstream(est);
}

function sliderToBudget(t){
  var b = 5000 * Math.pow(100, t / 1000);
  var step = b < 25000 ? 500 : (b < 100000 ? 1000 : 5000);
  b = Math.round(b / step) * step;
  return Math.min(500000, Math.max(5000, b));
}
function budgetToSlider(b){
  return Math.round(1000 * Math.log(b / 5000) / Math.log(100));
}

function syncSliderUI(){
  var slider = document.getElementById("hl-budget");
  if(!slider) return;
  slider.value = budgetToSlider(readState().budget);
  slider.style.setProperty("--fill", ((slider.value - slider.min) / (slider.max - slider.min) * 100) + "%");
}

function syncDurationUI(){
  var dur = document.getElementById("hl-duration");
  if(!dur) return;
  var days = readState().days || readState().durationDays || 14;
  dur.querySelectorAll("button").forEach(function(b){
    b.classList.toggle("is-on", parseInt(b.getAttribute("data-days"), 10) === days);
  });
}

function syncGoalsUI(){
  var goals = document.getElementById("hl-goals");
  if(!goals) return;
  var obj = readState().objective || "reach";
  goals.querySelectorAll(".bl-goal").forEach(function(b){
    b.classList.toggle("is-on", b.getAttribute("data-obj") === obj);
  });
}

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

function applyHeroParsed(parsed){
  writeState(parsed);
  syncSliderUI();
  syncDurationUI();
  syncGoalsUI();
  update();
}

function setState(partial){
  writeState(partial || {});
  syncSliderUI();
  syncDurationUI();
  syncGoalsUI();
  update();
}

window.blHeroSync = applyHeroParsed;
window.blHeroGetState = function(){ return heroState(); };

window.__BL_HERO__ = {
  estimate: estimate,
  update: update,
  gbp: gbp,
  getState: heroState,
  setState: setState,
  goToPlan: function(){
    var btn = document.getElementById("hl-view-full-summary");
    if(btn) btn.click();
    else if(window.BLPlanDrawer && window.BLPlanDrawer.open) window.BLPlanDrawer.open("review");
  },
  focusIntelligence: function(){
    if(window.__BL_EXPLORE__ && window.__BL_EXPLORE__.focusIntelligence){
      window.__BL_EXPLORE__.focusIntelligence();
    }
  },
  get onSync(){ return onSync; },
  set onSync(fn){ onSync = fn; }
};

function scrollTo(id){
  var el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
}

function wire(){
  labEl = document.getElementById("lab");
  var slider = document.getElementById("hl-budget");
  if(slider){
    syncSliderUI();
    slider.addEventListener("input", function(){
      writeState({ budget: sliderToBudget(parseFloat(slider.value)) });
      syncSliderUI();
      update();
    });
  }

  var dur = document.getElementById("hl-duration");
  if(dur) dur.addEventListener("click", function(e){
    var btn = e.target.closest("[data-days]");
    if(!btn) return;
    writeState({ days: parseInt(btn.getAttribute("data-days"), 10) });
    syncDurationUI();
    update();
  });

  var goals = document.getElementById("hl-goals");
  if(goals) goals.addEventListener("click", function(e){
    var btn = e.target.closest("[data-obj]");
    if(!btn) return;
    writeState({ objective: btn.getAttribute("data-obj") });
    syncGoalsUI();
    update();
  });

  var see = document.getElementById("hl-see-results");
  if(see) see.addEventListener("click", function(){ syncEngine(); scrollTo("planner"); });

  var fine = document.getElementById("bl-hero-fine");
  if(fine) fine.addEventListener("click", function(e){ e.preventDefault(); scrollTo("planner"); });

  var finalCta = document.getElementById("bl-final-cta");
  if(finalCta) finalCta.addEventListener("click", function(){ syncEngine(); scrollTo("planner"); });
  var finalStart = document.getElementById("bl-final-start");
  if(finalStart) finalStart.addEventListener("click", function(){ scrollTo("loud-ai"); });

  var input = document.getElementById("bl-ai-input");
  if(input){
    var debounce;
    input.addEventListener("input", function(){
      clearTimeout(debounce);
      debounce = setTimeout(function(){
        if(typeof window.blParseBrief !== "function") return;
        var parsed = window.blParseBrief(input.value);
        if(parsed.hits < 1) return;
        applyHeroParsed(parsed);
      }, 300);
    });
  }
}

function reveal(){
  var copy = document.querySelector(".bl-hero-copy");
  var lab = document.getElementById("lab");
  requestAnimationFrame(function(){
    if(copy) copy.classList.add("is-in");
    if(lab) lab.classList.add("is-in");
  });
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

function boot(){
  if(window.BLState){
    window.BLState.subscribe(function(){ update(); });
  }
  wire();
  update();
  reveal();
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
