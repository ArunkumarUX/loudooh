(function(){
"use strict";
var DATA = window.__BL_DATA__ || [];

var SCENARIOS = {
  reach:     {label:"Reach", desc:"Maximise useful audience breadth", favouredCategories:["Billboards","Bus Stops","Bus","Rail"], favouredRoles:["reach"], anchorPct:.68, reinforcePct:.17, tradeoff:"Fewer repeat impressions in any single location. If you'd rather own one area or build repetition, try Local Dominance or Frequency instead."},
  local:     {label:"Local Dominance", desc:"Own a defined area or catchment", favouredCategories:["Bus Stops","Billboards","Bus"], favouredRoles:["local-visibility","frequency"], anchorPct:.62, reinforcePct:.25, tradeoff:"National reach is deliberately sacrificed. This plan won't build awareness outside the chosen area — that's the trade you're making for depth."},
  frequency: {label:"Frequency", desc:"Build repeated exposure", favouredCategories:["Bus","Rail","London Underground","Bus Stops"], favouredRoles:["frequency"], anchorPct:.60, reinforcePct:.25, tradeoff:"Geographic breadth is limited in favour of repeat exposure. If broad awareness matters more than repetition, Reach will spread further."},
  premium:   {label:"Premium Impact", desc:"Stature, launch, fame or visual impact", favouredCategories:["Airport","London Underground","Billboards"], favouredRoles:["stature","premium-audience"], anchorPct:.72, reinforcePct:.14, allowSpecialist:true, tradeoff:"Scale is traded for stature — fewer sites, bigger moments. Cost per impact is typically higher than a Reach or Balanced plan."},
  balanced:  {label:"Balanced", desc:"Balanced reach and reinforcement", favouredCategories:["Billboards","Bus","Bus Stops"], favouredRoles:["reach","frequency"], anchorPct:.52, reinforcePct:.28, tradeoff:"Neither pure breadth nor pure depth — a blend of both, which means it won't maximise either one on its own."}
};
var SCENARIO_ORDER = ["reach","local","frequency","premium","balanced"];
var ALT_MAP = {reach:["balanced","frequency"], local:["frequency","balanced"], frequency:["local","reach"], premium:["balanced","reach"], balanced:["reach","local"]};

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

var FORMAT_PREFS = [
  {id:"none", label:"No preference"},
  {id:"static", label:"Static first"},
  {id:"digital", label:"Digital first"},
  {id:"transport", label:"Transport first"},
  {id:"advan", label:"Mobile AdVan first"},
  {id:"premium", label:"Premium formats"}
];

var PLANNING_MODES = [
  {id:"indicative", label:"Indicative (mid-point)"},
  {id:"conservative", label:"Conservative (upper range)"}
];

var TRANSPORT_CATS = ["Bus","Bus Stops","Rail","London Underground","Taxi"];

var FAQS = [
  {q:"What is the OOH Budget Lab actually trying to solve?", a:"We built the Budget Lab around a simple frustration: people are given a budget but aren't shown what it can realistically buy. A £5,000, £10,000 and £50,000 budget aren't just different sizes of the same campaign — they lead to different strategies, footprints, formats and frequency. So instead of another 'get a quote' form, the Budget Lab asks what you're trying to achieve and shows you a real planning answer: what you could buy, what it might deliver, and what you'd be trading off."},
  {q:"Why shouldn't I just buy the cheapest OOH media available?", a:"Because cheap and efficient aren't the same thing. A £1,000 placement in a genuinely relevant location can outperform a £500 placement that barely touches your objective — and a premium format can be entirely justified if the goal is stature or fame. That's why the Budget Lab shows the trade-off between cost, scale, geography, audience relevance, frequency and format rather than just ranking by price."},
  {q:"How should I think about a £5,000, £10,000 or £25,000 budget?", a:"We wouldn't start by saying '£10,000 buys this exact thing' — we'd start with the objective. At the lower end, concentration usually beats spreading thin: own one location, route or catchment. Around £10,000 it becomes a real trade-off between reach and concentration. At £25,000 and above, we start thinking in terms of a media system — combining formats so the campaign has both reach and reinforcement."},
  {q:"Should the Budget Lab optimise for reach or frequency?", a:"Neither, by default — they solve different problems. Reach is the unique number of people who see your campaign; frequency is how often those people see it. A launch usually wants reach; owning a message or location usually wants frequency. The Budget Lab asks what you're trying to achieve first, then makes that trade-off visible rather than assuming one answer fits every brief."},
  {q:"Why does the Budget Lab distinguish impressions from impacts?", a:"Because a screen playing an advert isn't the same as a person seeing it. Route measures OOH impacts based on the likelihood of an advert actually being seen — factoring in location, movement, visibility and time — which is a meaningfully different, more honest number than a raw digital 'impressions' count. Where we only have planning benchmarks rather than Route-measured data, we label them clearly as indicative ranges, not guaranteed delivery."},
  {q:"Is DOOH automatically better than classic OOH?", a:"No — that's an easy trap. Digital OOH offers dynamic creative, scheduling and increasingly programmatic buying, and IAB UK expects DOOH to reach 76% of UK OOH spend by 2031. But a static 48-sheet in exactly the right spot can outperform a screen, and buses and rail work because of movement and dwell time. We treat format as a strategic decision, not a technology hierarchy."},
  {q:"Does programmatic OOH make the Budget Lab more complicated?", a:"Technically, yes — the buying ecosystem behind OOH has become genuinely sophisticated. But from your side of the screen it should be simpler, not harder. The Budget Lab solves the strategy first — objective, audience, geography and budget — before the buying mechanism ever needs to come into it."},
  {q:"How should production costs be treated in an OOH budget?", a:"Separately, always. 'Campaign cost' can quietly bundle media, print, installation, special builds and motion design into one number, which makes budgets hard to compare. The Budget Lab shows an indicative media allocation, then adds sensible production and installation allowances based on the formats you've actually selected — never hidden inside the headline rate."},
  {q:"What makes a good OOH budget allocation?", a:"Balance. Not spread so thin that nothing has real presence, and not so concentrated that a campaign needing genuine reach ends up in one spectacular site. We weigh three things: where the audience actually moves, what job each format is doing, and what the creative needs from the media. The Budget Lab explains why a recommendation was made rather than just listing sites."},
  {q:"How do I decide whether OOH is actually working?", a:"Decide what 'working' means before the campaign goes live. For awareness, look at reach, frequency and recall; for driving people somewhere, look at footfall; for demand generation, search behaviour alongside other signals. Impacts tell you about delivery — they don't, by themselves, tell you the business objective was hit. A strong plan starts with the outcome and works backwards to the media."},
  {q:"Can a relatively small OOH budget still have a big impact?", a:"Yes — but 'big impact' needs to mean something specific, not national reach on a local budget. A modest budget can dominate one town, postcode area or commuter route rather than being diluted across a huge geography, and sharp creative can make a small footprint feel much bigger. That's why the Budget Lab shows different scenarios for the same budget rather than one 'correct' answer."},
  {q:"What's the biggest mistake the Budget Lab is built to stop?", a:"Starting with the format. 'How much is a billboard?' is a fair question, but it's the second one. The first is: what are you actually trying to achieve? Once that's answered, audience, geography, reach, frequency, format and creative all follow logically — and the recommendation should never simply be whichever format has the biggest headline reach number."}
];

function gbp(n){ return "£" + Math.round(n).toLocaleString("en-GB"); }
function track(name, payload){
  try{ window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({event:name}, payload||{})); }catch(e){}
}

/* ---------- engine ---------- */
function basisDays(basis){
  var m = {"1 day":1,"3 days":3,"5 days":5,"1 week":7,"2 weeks":14,"4 weeks":28};
  return m[basis] || null;
}
function isMultipliable(basis){ return basisDays(basis) !== null; }

function priceBand(f, geo){
  if(geo === "london") return {lo:f.londonLow, hi:f.londonHigh};
  if(geo === "regional" || geo === "named") return {lo:f.regionalLow, hi:f.regionalHigh};
  return {lo:Math.min(f.londonLow,f.regionalLow), hi:Math.max(f.londonHigh,f.regionalHigh)};
}
function unitMediaPrice(f, geo, mode){
  var band = priceBand(f, geo);
  if(mode === "conservative") return band.hi;
  return geo === "uk" ? f.mid : (band.lo + band.hi) / 2;
}
function durationMultiplier(f, userDays){
  var bd = basisDays(f.campaignBasis);
  if(bd === null) return null;
  return Math.max(1, Math.ceil(userDays / bd));
}

function scoreCandidate(f, scenarioKey, state){
  var sc = SCENARIOS[scenarioKey];
  var score = 0;
  score += sc.favouredCategories.indexOf(f.category) > -1 ? 30 : (intersects(f.roles, sc.favouredRoles) ? 18 : 8);
  var aud = AUDIENCES.filter(function(a){return a.id === state.audience;})[0] || AUDIENCES[0];
  var audCtx = (f.audienceContext || "").toLowerCase();
  var audMatch = aud.kw.length && aud.kw.some(function(k){ return audCtx.indexOf(k) > -1; });
  score += aud.kw.length === 0 ? 12 : (audMatch ? 20 : 6);
  score += state.geo === "named" ? 12 : 15;
  var unit = quote1(f, state);
  var eff = unit ? Math.max(0, Math.min(1, 1 - (unit.unitTotal / Math.max(state.budget, 1)))) : 0;
  score += 15 * eff;
  score += intersects(f.roles, ["reach","frequency"]) ? 10 : 5;
  var creative = 3;
  if(scenarioKey === "premium" && f.technology === "DOOH") creative = 5;
  if((scenarioKey === "local" || scenarioKey === "frequency") && f.technology === "Static") creative = 5;
  score += creative;
  score += 5; // operational baseline
  score += techAdjustment(f, state.formatPref);
  var allowSpecialist = scenarioKey === "premium" || state.formatPref === "premium";
  if(f.specialist) score += allowSpecialist ? 5 : -25;
  if(f.impactConfidence === "Low-Medium") score -= 4;
  return Math.max(0, Math.min(100, score));
}
function intersects(a,b){ return a.some(function(x){ return b.indexOf(x) > -1; }); }
function techAdjustment(f, pref){
  if(pref === "static") return f.technology === "DOOH" ? -12 : 10;
  if(pref === "digital") return f.technology === "Static" ? -12 : 10;
  if(pref === "transport") return TRANSPORT_CATS.indexOf(f.category) > -1 ? 12 : -8;
  if(pref === "advan") return f.category === "Digital AdVans" ? 15 : -10;
  if(pref === "premium") return (f.specialist || f.mid >= 1500) ? 15 : -8;
  return 0;
}

function quote1(f, state){
  var bd = durationMultiplier(f, state.durationDays);
  if(bd === null) return null;
  var media = unitMediaPrice(f, state.geo, state.planningMode) * bd;
  var unitTotal = state.basis === "all-in" ? (media + f.production + f.installation) : media;
  return {media:media, production:f.production, installation:f.installation, unitTotal:unitTotal, multiplier:bd};
}

function eligibleCandidates(state){
  return DATA.filter(function(f){ return isMultipliable(f.campaignBasis); });
}

function runScenario(scenarioKey, state){
  var candidates = eligibleCandidates(state);
  var scored = candidates.map(function(f){
    var q = quote1(f, state);
    return {f:f, q:q, score: q ? scoreCandidate(f, scenarioKey, state) : -1};
  }).filter(function(c){ return c.q && c.q.unitTotal <= state.budget; })
    .sort(function(a,b){ return b.score - a.score; });

  if(!scored.length){
    var cheapest = candidates.map(function(f){ return {f:f, q:quote1(f, state)}; })
      .filter(function(c){ return c.q; }).sort(function(a,b){ return a.q.unitTotal - b.q.unitTotal; })[0];
    return {infeasible:true, minBudget: cheapest ? cheapest.q.unitTotal : null, minFormat: cheapest ? cheapest.f : null};
  }

  var anchor = scored[0];
  var reinforcement = scored.filter(function(c){ return c.f.category !== anchor.f.category; })[0] || null;

  var sc = SCENARIOS[scenarioKey];
  var result = {scenarioKey:scenarioKey, scenario:sc, anchor:anchor, reinforcement:reinforcement, state:state};

  if(state.basis === "all-in"){
    var usable = state.budget;
    var aAlloc = usable * sc.anchorPct;
    var aQty = Math.max(1, Math.floor(aAlloc / anchor.q.unitTotal));
    var aSpend = aQty * anchor.q.unitTotal;
    var rem1 = usable - aSpend;

    var rQty = 0, rSpend = 0;
    if(reinforcement){
      var rAlloc = Math.min(usable * sc.reinforcePct, rem1);
      rQty = Math.floor(rAlloc / reinforcement.q.unitTotal);
      rSpend = rQty * reinforcement.q.unitTotal;
    }
    var rem2 = rem1 - rSpend;

    var guard = 0;
    while(rem2 >= anchor.q.unitTotal && guard < 500){ aQty++; aSpend += anchor.q.unitTotal; rem2 -= anchor.q.unitTotal; guard++; }

    result.anchorQty = aQty; result.reinforceQty = rQty;
    result.media = aQty*anchor.q.media + rQty*(reinforcement?reinforcement.q.media:0);
    result.production = aQty*anchor.f.production + rQty*(reinforcement?reinforcement.f.production:0);
    result.installation = aQty*anchor.f.installation + rQty*(reinforcement?reinforcement.f.installation:0);
    result.spend = result.media + result.production + result.installation;
    result.remaining = usable - result.spend;
    result.mediaOnly = false;
  } else {
    var usableMedia = state.budget;
    var aAllocM = usableMedia * sc.anchorPct;
    var aQtyM = Math.max(1, Math.floor(aAllocM / anchor.q.media));
    var aSpendM = aQtyM * anchor.q.media;
    var rem1M = usableMedia - aSpendM;

    var rQtyM = 0, rSpendM = 0;
    if(reinforcement){
      var rAllocM = Math.min(usableMedia * sc.reinforcePct, rem1M);
      rQtyM = Math.floor(rAllocM / reinforcement.q.media);
      rSpendM = rQtyM * reinforcement.q.media;
    }
    var rem2M = rem1M - rSpendM;
    var guardM = 0;
    while(rem2M >= anchor.q.media && guardM < 500){ aQtyM++; aSpendM += anchor.q.media; rem2M -= anchor.q.media; guardM++; }

    result.anchorQty = aQtyM; result.reinforceQty = rQtyM;
    result.media = aQtyM*anchor.q.media + rQtyM*(reinforcement?reinforcement.q.media:0);
    result.production = aQtyM*anchor.f.production + rQtyM*(reinforcement?reinforcement.f.production:0);
    result.installation = aQtyM*anchor.f.installation + rQtyM*(reinforcement?reinforcement.f.installation:0);
    result.spend = result.media; // spend against the stated media budget
    result.remaining = usableMedia - result.media;
    result.mediaOnly = true;
    result.extraCost = result.production + result.installation;
  }

  // audience delivery
  var lo = 0, hi = 0, haveData = false, confidences = [];
  [ [anchor, result.anchorQty], reinforcement ? [reinforcement, result.reinforceQty] : null ].forEach(function(pair){
    if(!pair || pair[1] <= 0) return;
    var f = pair[0].f, qty = pair[1], mult = pair[0].q.multiplier;
    if(f.impactsCampaignLow != null){
      lo += f.impactsCampaignLow * mult * qty;
      hi += f.impactsCampaignHigh * mult * qty;
      haveData = true;
      confidences.push(f.impactConfidence);
    }
  });
  result.audienceLow = haveData ? lo : null;
  result.audienceHigh = haveData ? hi : null;
  result.confidence = confidences.indexOf("Low-Medium") > -1 ? "Low-Medium" : (confidences[0] || null);

  return result;
}

/* ---------- state ---------- */
var state = {
  step: 1,
  budget: 10000,
  basis: "all-in",
  objective: "balanced",
  geo: "regional",
  named: "",
  audience: "broad",
  durationDays: 14,
  formatPref: "none",
  planningMode: "indicative",
  started: false,
  completed: false
};

/* ---------- UI: build static pieces ---------- */
var STEP_LABELS = ["Budget","Objective","Audience","Strategy","Results"];
function renderSteps(){
  var el = document.getElementById("bl-steps");
  el.innerHTML = STEP_LABELS.map(function(label, i){
    var n = i+1;
    var cls = "bl-step-tab" + (n < state.step ? " is-done" : "") + (n === state.step ? " is-active" : "");
    return '<button type="button" class="'+cls+'" data-goto="'+n+'" '+(n>state.step?'disabled':'')+'>' +
      '<span class="bl-step-dot">'+n+'</span>' + label + '</button>';
  }).join("");
  el.querySelectorAll("[data-goto]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var n = parseInt(btn.getAttribute("data-goto"),10);
      if(n < state.step) goToStep(n);
    });
  });
}

function renderObjectiveGrid(){
  var el = document.getElementById("bl-objective-grid");
  el.innerHTML = SCENARIO_ORDER.map(function(key){
    var sc = SCENARIOS[key];
    var sel = state.objective === key ? " is-selected" : "";
    return '<button type="button" class="bl-choice-card'+sel+'" data-obj="'+key+'"><strong>'+sc.label+'</strong><span>'+sc.desc+'</span></button>';
  }).join("");
  el.querySelectorAll("[data-obj]").forEach(function(btn){
    btn.addEventListener("click", function(){
      state.objective = btn.getAttribute("data-obj");
      track("objective_selected", {objective_selected: state.objective});
      renderObjectiveGrid();
    });
  });
}

function renderChipRow(containerId, options, stateKey, eventName){
  var el = document.getElementById(containerId);
  el.innerHTML = options.map(function(o){
    var sel = state[stateKey] === o.id ? " is-selected" : "";
    return '<button type="button" class="bl-radio-chip'+sel+'" data-val="'+o.id+'">'+o.label+'</button>';
  }).join("");
  el.querySelectorAll("[data-val]").forEach(function(btn){
    btn.addEventListener("click", function(){
      state[stateKey] = btn.getAttribute("data-val");
      var payload = {}; payload[eventName] = state[stateKey];
      track(eventName, payload);
      renderChipRow(containerId, options, stateKey, eventName);
    });
  });
}

function renderBudgetQuick(){
  var el = document.getElementById("bl-budget-quick");
  [2500,5000,10000,25000,50000].forEach(function(v){
    var chip = document.createElement("button");
    chip.type = "button"; chip.className = "bl-quick-chip"; chip.textContent = gbp(v);
    chip.addEventListener("click", function(){
      state.budget = v;
      document.getElementById("bl-budget").value = v.toLocaleString("en-GB");
    });
    el.appendChild(chip);
  });
}

function wireStep1(){
  var input = document.getElementById("bl-budget");
  function commit(){
    var n = parseInt((input.value||"").replace(/[^0-9]/g,""),10);
    if(isNaN(n) || n < 0) n = 0;
    state.budget = n;
    input.value = n.toLocaleString("en-GB");
    track("budget_entered", {budget_entered:n, budget_band: budgetBand(n)});
  }
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", function(e){ if(e.key === "Enter"){ commit(); input.blur(); } });

  document.getElementById("bl-basis-toggle").querySelectorAll("[data-basis]").forEach(function(btn){
    btn.addEventListener("click", function(){
      state.basis = btn.getAttribute("data-basis");
      track("budget_basis_selected", {budget_basis_selected: state.basis});
      document.querySelectorAll("#bl-basis-toggle .bl-toggle-btn").forEach(function(b){ b.classList.toggle("is-on", b === btn); });
    });
  });
  renderBudgetQuick();
}
function budgetBand(n){
  if(n < 2500) return "under-2.5k";
  if(n < 10000) return "2.5k-10k";
  if(n < 25000) return "10k-25k";
  if(n < 50000) return "25k-50k";
  return "50k-plus";
}

function wireStep3(){
  var geo = document.getElementById("bl-geo");
  var namedWrap = document.getElementById("bl-named-wrap");
  var named = document.getElementById("bl-named");
  geo.addEventListener("change", function(){
    state.geo = geo.value;
    namedWrap.hidden = geo.value !== "named";
    track("geography_selected", {geography_selected: state.geo});
  });
  named.addEventListener("blur", function(){ state.named = named.value.trim(); });
  renderChipRow("bl-audience-row", AUDIENCES, "audience", "audience_selected");
}

function wireStep4(){
  var dur = document.getElementById("bl-duration");
  var customWrap = document.getElementById("bl-custom-wrap");
  var customDays = document.getElementById("bl-custom-days");
  dur.addEventListener("change", function(){
    if(dur.value === "custom"){ customWrap.hidden = false; state.durationDays = parseInt(customDays.value,10) || 21; }
    else { customWrap.hidden = true; state.durationDays = parseInt(dur.value,10); }
  });
  customDays.addEventListener("blur", function(){ state.durationDays = parseInt(customDays.value,10) || 21; });
  renderChipRow("bl-format-pref-row", FORMAT_PREFS, "formatPref", "strategy_preference_selected");
  renderChipRow("bl-planning-mode-row", PLANNING_MODES, "planningMode", "planning_mode_selected");
}

/* ---------- navigation ---------- */
function goToStep(n, skipScroll){
  state.step = n;
  document.querySelectorAll(".bl-panel[data-step]").forEach(function(p){ p.hidden = p.getAttribute("data-step") != n; });
  document.getElementById("bl-results").classList.toggle("is-active", n === 5);
  document.getElementById("bl-nav-controls").hidden = n === 5;
  document.getElementById("bl-back").hidden = n === 1;
  document.getElementById("bl-next").textContent = n === 4 ? "See what your budget could deliver →" : "Next";
  renderSteps();
  if(!skipScroll) document.getElementById("bl-calc").scrollIntoView({behavior:"smooth", block:"start"});
  if(n === 5){
    track("calculator_completed", {});
    state.completed = true;
    renderResults();
  }
}

function wireNav(){
  document.getElementById("bl-next").addEventListener("click", function(){
    if(!state.started){ state.started = true; track("calculator_started", {}); }
    if(state.step < 5) goToStep(state.step + 1);
  });
  document.getElementById("bl-back").addEventListener("click", function(){
    if(state.step > 1) goToStep(state.step - 1);
  });
}

window.addEventListener("beforeunload", function(){
  if(state.started && !state.completed) track("calculator_abandoned", {abandonment_step: state.step});
});

/* ---------- results rendering ---------- */
function renderResults(){
  var el = document.getElementById("bl-results");
  var result = runScenario(state.objective, state);
  track("scenario_recommended", {scenario_recommended: state.objective});

  if(result.infeasible){
    el.innerHTML = '<div class="bl-infeasible"><h3>This budget doesn’t yet cover a feasible plan</h3>' +
      '<p>' + (result.minFormat ?
        'The lowest-cost single unit we could find for a compatible campaign length is ' + result.minFormat.category + ' — ' + result.minFormat.format + ' at roughly ' + gbp(result.minBudget) + '. Increase your budget or shorten the campaign length and try again.' :
        'We couldn’t find a compatible format for the campaign length selected. Try a different duration.') +
      '</p><button type="button" class="bl-btn bl-btn-ghost" id="bl-retry">Adjust your inputs</button></div>';
    document.getElementById("bl-retry").addEventListener("click", function(){ goToStep(1); });
    return;
  }

  var geoLabel = state.geo === "london" ? "London" : state.geo === "regional" ? "Regional UK" : state.geo === "named" ? (state.named || "Named city") : "UK-wide";
  var recSentence = "We’ve put " + Math.round(result.scenario.anchorPct*100) + "% of usable budget into " + result.anchor.f.category.toLowerCase() +
    " (" + result.anchor.f.format + ") because " + result.scenario.desc.toLowerCase() + " — " + result.anchor.f.strength.toLowerCase() + "." +
    (result.reinforcement ? " Reinforcement sits in " + result.reinforcement.f.category.toLowerCase() + " to add " + result.reinforcement.f.strength.toLowerCase() + "." : "");

  var html = "";
  html += '<div class="bl-result-head"><span class="bl-result-strategy">'+result.scenario.label+'</span>' +
    '<h2>Your OOH plan for '+gbp(state.budget)+'</h2>' +
    '<p class="rec">'+recSentence+'</p></div>';

  html += '<div class="bl-spend-strip">' +
    '<div class="bl-spend-cell"><b>'+gbp(state.budget)+'</b><span>Total budget</span></div>' +
    '<div class="bl-spend-cell"><b>'+gbp(result.spend)+'</b><span>Planned spend</span></div>' +
    '<div class="bl-spend-cell"><b>'+gbp(Math.max(0,result.remaining))+'</b><span>Remaining budget</span></div>' +
    '<div class="bl-spend-cell"><b>'+durationLabel(state.durationDays)+'</b><span>Campaign length</span></div>' +
    '</div>';

  html += '<div class="bl-result-section"><h3>Media / production / installation</h3>' +
    mixRow("Media spend", gbp(result.media)) +
    mixRow("Production", gbp(result.production)) +
    mixRow("Installation", gbp(result.installation)) +
    mixRow(result.mediaOnly ? "Total media spend (production + installation shown as an addition below)" : "Total campaign cost", gbp(result.mediaOnly ? result.media : result.spend)) +
    (result.mediaOnly ? mixRow("Extra beyond your media-only budget", gbp(result.extraCost)) : "") +
    '</div>';

  html += '<div class="bl-result-section"><h3>Format mix</h3>' +
    formatMixRow(result.anchor.f, result.anchorQty, result.anchor.q) +
    (result.reinforcement && result.reinforceQty > 0 ? formatMixRow(result.reinforcement.f, result.reinforceQty, result.reinforcement.q) : '') +
    '</div>';

  html += '<div class="bl-result-section"><h3>Geographic footprint</h3><p style="margin:0;font-size:14.5px;color:var(--ink)">'+geoLabel+
    (state.geo === "named" ? '. Named-city inventory is priced against regional bands — confirm exact site availability for '+ (state.named||"this city") +'.' : '.') +
    '</p></div>';

  html += '<div class="bl-result-section"><h3>Indicative audience delivery</h3>' +
    (result.audienceLow != null ?
      '<div class="bl-audience-box"><div><b>'+Math.round(result.audienceLow).toLocaleString("en-GB")+' – '+Math.round(result.audienceHigh).toLocaleString("en-GB")+'</b>' +
      '<p>Indicative total campaign impacts — total exposures under OOH planning methodology, not people reached.</p>' +
      '<span class="bl-confidence-tag">Confidence: '+(result.confidence||"Medium")+'</span></div></div>' +
      '<p style="margin:12px 0 0;font-size:12.5px;color:var(--muted);line-height:1.6">Reach and frequency (unique people reached, and how often) require Route or site-level operator data, which sits outside this planning tool — we don’t manufacture them from an impacts range. Speak to a planner for Route-measured reach and frequency.</p>'
      : '<p style="margin:0;font-size:13.5px;color:var(--muted)">No reliable audience benchmark exists for this combination — we’d rather say so than invent one.</p>') +
    '</div>';

  html += '<div class="bl-result-section bl-why"><h3>Why this plan</h3><p>'+recSentence+'</p>' +
    '<div class="bl-tradeoff"><strong>What you’re trading off:</strong> '+result.scenario.tradeoff+'</div></div>';

  var alts = ALT_MAP[state.objective].map(function(key){ return runScenario(key, state); }).filter(function(r){ return !r.infeasible; });
  if(alts.length){
    html += '<div class="bl-result-section"><h3>Alternative scenarios</h3><div class="bl-alt-grid">' +
      alts.map(function(r){
        return '<button type="button" class="bl-alt-card" data-alt="'+r.scenarioKey+'" style="text-align:left;cursor:pointer;background:#fff;font-family:inherit">' +
          '<strong>'+r.scenario.label+'</strong><span>'+r.scenario.desc+'</span>' +
          '<span class="n">'+gbp(r.spend)+' · '+(r.reinforcement && r.reinforceQty>0 ? "2 formats" : "1 format")+'</span></button>';
      }).join("") + '</div></div>';
  }

  html += '<div class="bl-result-section bl-caveats"><h3>Important assumptions &amp; data caveats</h3><ul>' +
    '<li>All headline media pricing is ex-VAT and drawn from Loud! OOH’s approved 2026 planning data. Planning-range formats are clearly marked and are not guaranteed live quotes.</li>' +
    '<li>Audience figures are indicative planning benchmarks scaled to your chosen campaign length, not Route-measured site data — exact delivery depends on site, schedule, loop and share of voice.</li>' +
    '<li>Availability is never guaranteed by a planning rate. Confirm live inventory with a planner before booking.</li>' +
    '<li>Remaining budget is shown honestly rather than force-spent — spending every last pound on a marginal extra unit is rarely the right call.</li>' +
    '</ul></div>';

  html += '<div class="bl-result-cta">' +
    '<a class="bl-btn bl-btn-primary" href="https://www.loudooh.co.uk/contact/" id="bl-cta-speak">Speak to Loud! OOH about this plan</a>' +
    '<button type="button" class="bl-btn bl-btn-ghost" id="bl-cta-refine">Refine this plan</button>' +
    '</div>';

  el.innerHTML = html;
  document.getElementById("bl-cta-speak").addEventListener("click", function(){ track("lead_cta_clicked", {}); });
  document.getElementById("bl-cta-refine").addEventListener("click", function(){ goToStep(1); });
  el.querySelectorAll("[data-alt]").forEach(function(btn){
    btn.addEventListener("click", function(){
      state.objective = btn.getAttribute("data-alt");
      track("alternative_scenario_viewed", {alternative_scenario_viewed: state.objective});
      renderResults();
    });
  });
}
function mixRow(label, val){
  return '<div class="bl-mix-row"><div class="bl-mix-name">'+label+'</div><div class="bl-mix-cost">'+val+'</div></div>';
}
function formatMixRow(f, qty, q){
  var bookingNote = f.campaignBasis + (q.multiplier > 1 ? ' × ' + q.multiplier + ' bookings' : ' booking');
  return '<div class="bl-mix-row"><div><div class="bl-mix-name">'+qty+' × '+f.format+'</div>' +
    '<div class="bl-mix-meta">'+f.category+' · '+f.buyingUnit+' · '+bookingNote + (f.costStatus === "Planning range" ? ' · planning range' : '') + '</div></div>' +
    '<div class="bl-mix-cost">'+gbp(qty*q.media)+'<small>media</small></div></div>';
}
function durationLabel(days){
  if(days === 1) return "1 day";
  if(days % 7 === 0) return (days/7) + (days===7?" week":" weeks");
  return days + " days";
}

/* ---------- pricing matrix ---------- */
function renderMatrix(){
  var byCat = {};
  DATA.forEach(function(f){ (byCat[f.category] = byCat[f.category]||[]).push(f); });
  var el = document.getElementById("bl-matrix-body");
  el.innerHTML = Object.keys(byCat).map(function(cat, idx){
    var rows = byCat[cat].map(function(f){
      var statusCls = f.costStatus.indexOf("Published") > -1 ? "published" : "planning";
      return '<tr><td class="fmt">'+f.format+'<small>'+f.technology+' · '+f.buyingUnit+'</small></td>' +
        '<td>'+f.campaignBasis+'</td>' +
        '<td>£'+f.londonLow+'–'+f.londonHigh+'</td>' +
        '<td>£'+f.regionalLow+'–'+f.regionalHigh+'</td>' +
        '<td>£'+f.production+'<small>production</small></td>' +
        '<td>£'+f.installation+'<small>installation</small></td>' +
        '<td><span class="bl-status '+statusCls+'">'+f.costStatus+'</span></td></tr>';
    }).join("");
    return '<div class="bl-cat-block'+(idx===0?" is-open":"")+'"><button type="button" class="bl-cat-head" data-cat="'+cat+'">' +
      '<h3>'+cat+'</h3><span>'+byCat[cat].length+' formats <svg class="chev" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5l4 4 4-4"/></svg></span></button>' +
      '<div class="bl-cat-body"><div class="bl-table-scroll"><table class="bl-table"><thead><tr><th>Format</th><th>Basis</th><th>London £</th><th>Regional £</th><th>Production</th><th>Installation</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div>';
  }).join("");
  el.querySelectorAll(".bl-cat-head").forEach(function(btn){
    btn.addEventListener("click", function(){ btn.closest(".bl-cat-block").classList.toggle("is-open"); });
  });
}

/* ---------- faq ---------- */
function renderFaq(){
  var el = document.getElementById("bl-faq-list");
  el.innerHTML = FAQS.map(function(f,i){
    return '<div class="bl-faq-item" data-i="'+i+'"><button type="button" class="bl-faq-q"><span class="txt">'+f.q+'</span><span class="bl-faq-plus">+</span></button>' +
      '<div class="bl-faq-a"><p>'+f.a+'</p></div></div>';
  }).join("");
  el.querySelectorAll(".bl-faq-q").forEach(function(btn){
    btn.addEventListener("click", function(){ btn.closest(".bl-faq-item").classList.toggle("is-open"); });
  });
  var schema = {"@context":"https://schema.org","@type":"FAQPage","mainEntity": FAQS.map(function(f){
    return {"@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}};
  })};
  var tag = document.getElementById("lo-faq-schema");
  if(tag) tag.textContent = JSON.stringify(schema);
}

/* ---------- boot ---------- */
function boot(){
  renderSteps();
  wireStep1();
  renderObjectiveGrid();
  wireStep3();
  wireStep4();
  wireNav();
  renderMatrix();
  renderFaq();
  goToStep(1, true);
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
