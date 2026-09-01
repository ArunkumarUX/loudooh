(function(){
"use strict";
var DATA = window.__BL_DATA__ || [];

/* Category weights and cost-efficiency appetite are shared verbatim with
   hero.js so the console and the wizard rank formats the same way. */
var SCENARIOS = {
  reach:     {label:"Reach", desc:"Maximise useful audience breadth", effWeight:20, favouredRoles:["reach"], anchorPct:.68, reinforcePct:.17,
              weights:{"Billboards":30,"Bus Stops":22,"Rail":18,"Bus":14,"London Underground":12,"Airport":8,"Taxi":6,"Digital AdVans":6},
              tradeoff:"Fewer repeat impressions in any single location. If you'd rather own one area or build repetition, try Local Dominance or Frequency instead."},
  local:     {label:"Local Dominance", desc:"Own a defined area or catchment", effWeight:10, favouredRoles:["local-visibility","local-targeting","proximity"], anchorPct:.62, reinforcePct:.25,
              weights:{"Bus Stops":30,"Bus":22,"Billboards":16,"Taxi":14,"Digital AdVans":12,"Rail":8,"London Underground":6,"Airport":4},
              tradeoff:"National reach is deliberately sacrificed. This plan won't build awareness outside the chosen area — that's the trade you're making for depth."},
  frequency: {label:"Frequency", desc:"Build repeated exposure", effWeight:12, favouredRoles:["frequency","commuter-reach"], anchorPct:.60, reinforcePct:.25,
              weights:{"Bus":28,"London Underground":26,"Rail":22,"Taxi":16,"Bus Stops":16,"Billboards":10,"Airport":6,"Digital AdVans":4},
              tradeoff:"Geographic breadth is limited in favour of repeat exposure. If broad awareness matters more than repetition, Reach will spread further."},
  premium:   {label:"Premium Impact", desc:"Stature, launch, fame or visual impact", effWeight:4, favouredRoles:["stature","premium-audience","dwell"], anchorPct:.72, reinforcePct:.14, allowSpecialist:true,
              weights:{"Airport":30,"London Underground":24,"Billboards":22,"Rail":14,"Digital AdVans":10,"Taxi":8,"Bus":6,"Bus Stops":6},
              tradeoff:"Scale is traded for stature — fewer sites, bigger moments. Cost per impact is typically higher than a Reach or Balanced plan."},
  balanced:  {label:"Balanced", desc:"Balanced reach and reinforcement", effWeight:14, favouredRoles:["reach","frequency"], anchorPct:.52, reinforcePct:.28,
              weights:{"Billboards":24,"Bus Stops":22,"Bus":20,"Rail":18,"London Underground":14,"Taxi":12,"Airport":10,"Digital AdVans":10},
              tradeoff:"Neither pure breadth nor pure depth — a blend of both, which means it won't maximise either one on its own."}
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
  {id:"none",      label:"No preference",   desc:"Chosen purely on fit and cost per 1,000 impacts"},
  {id:"static",    label:"Static first",    desc:"Classic posters and panels. Print and posting apply."},
  {id:"digital",   label:"Digital first",   desc:"Screens with no print cost and flexible messaging"},
  {id:"transport", label:"Transport first", desc:"Bus, rail, Underground and taxi environments"},
  {id:"advan",     label:"Mobile AdVan",    desc:"Route-led vans for launches, events and match days"},
  {id:"premium",   label:"Premium formats", desc:"Landmark sites and larger canvases, for stature"}
];

var PLANNING_MODES = [
  {id:"indicative",   label:"Indicative", desc:"Mid-point of each published price band. The usual planning basis."},
  {id:"conservative", label:"Conservative", desc:"Upper end of each band, so the budget has headroom"}
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

/* ---------- engine ----------
   Pricing, cycles, geography, minimum buy, volume discounts and the
   contingency reserve all come from bl-calc.js — the same module hero.js
   uses, so the two can no longer produce different answers. */
var C = window.BLCalc;
var P = window.BLPlanCore;

function calcOpts(st){
  return P.calcOpts(st);
}

function scoreCandidate(f, q, scenarioKey, state){
  return P.scoreFormat(f, q, scenarioKey, state, SCENARIOS);
}

/* §10 — geography, POA status, cycle compatibility and minimum-buy
   affordability are all enforced here, not just displayed. */
function eligibleCandidates(state){
  var opts = calcOpts(state);
  return DATA.map(function(f){ return {f:f, q:C.quote(f, opts)}; })
             .filter(function(c){ return c.q && c.q.entryCost <= state.budget; });
}

function runScenario(scenarioKey, state){
  var opts = calcOpts(state);
  var sc = SCENARIOS[scenarioKey];
  /* Identical allocator to the live console — see BLCalc.buildPlan. */
  var plan = C.buildPlan(DATA, opts, sc, function(f, q){
    return scoreCandidate(f, q, scenarioKey, state);
  });

  if(plan.infeasible){
    var cheapest = plan.minBuy ? {q: plan.minBuy, f: plan.minBuy.f}
      : DATA.map(function(f){ return {f:f, q:C.quote(f, opts)}; })
            .filter(function(c){ return c.q; })
            .sort(function(a,b){ return a.q.entryCost - b.q.entryCost; })[0];
    return {
      infeasible:true,
      minBudget: cheapest ? cheapest.q.entryCost : null,
      minFormat: cheapest ? cheapest.f : null,
      minQty: cheapest ? cheapest.q.minQty : null,
      exclusions: C.exclusions(DATA, opts)
    };
  }

  var result = {
    scenarioKey:scenarioKey, scenario:sc, state:state,
    anchor:plan.anchor, reinforcement:plan.reinforcement,
    reserve:plan.reserve, usable:plan.usable,
    lines:plan.lines,
    anchorLine:plan.lines[0],
    reinforceLine:plan.lines[1] || null,
    anchorQty:plan.lines[0].qty,
    reinforceQty:plan.lines[1] ? plan.lines[1].qty : 0,
    media:plan.media, mediaGross:plan.mediaGross, discount:plan.discount,
    production:plan.production, installation:plan.installation,
    sites:plan.sites,
    /* How many formats survived to be costed. Carried through so the reveal
       can state what the calculator actually did instead of guessing. */
    considered:plan.candidates ? plan.candidates.length : null,
    priced:DATA.length
  };

  if(state.basis === "all-in"){
    result.spend = plan.media + plan.production + plan.installation;
    result.mediaOnly = false;
    result.extraCost = 0;
  } else {
    result.spend = plan.media;
    result.mediaOnly = true;
    result.extraCost = plan.lines.reduce(function(t,l){ return t + l.extraCost; }, 0);
  }
  result.remaining = state.budget - result.spend - plan.reserve;
  result.unallocated = Math.max(0, result.remaining);

  /* §9 — impacts only, as a range, with confidence carried through. */
  result.audienceLow  = plan.impacts ? plan.impacts.low  : null;
  result.audienceHigh = plan.impacts ? plan.impacts.high : null;
  result.confidence   = plan.impacts ? plan.impacts.confidence : null;
  result.cpm = C.costPerThousand(result.spend, plan.impacts);

  result.discountLines = plan.lines.filter(function(l){ return l.discountRate > 0; });
  result.taperNotes = plan.taperNotes;
  result.exclusions = C.exclusions(DATA, opts);
  return result;
}

/* ---------- state ---------- */
/* Same pattern as hero.js: `state` is a live view onto the one store, so the
   wizard and the console can no longer hold different answers. `step` is the
   only genuinely local value — it is which panel is on screen, not a plan input. */
var Store = window.BLState;
var state = {step: 1};
["budget","basis","objective","geo","named","audience","durationDays",
 "formatPref","planningMode","reservePct","started","completed"].forEach(function(k){
  Object.defineProperty(state, k, {
    enumerable: true,
    get: function(){ return Store.get()[k]; },
    set: function(v){ var patch = {}; patch[k] = v; Store.set(patch, "engine"); }
  });
});

/* Re-render when the plan changes from anywhere else on the page. */
var renderTimer = null;
/* The fields that actually change the plan. `started` and `completed` are
   flags about where the reader is, not inputs to the calculation — re-rendering
   the whole summary for those was doing real damage: a second full render 140ms
   after every "View Plan Summary" click, which threw away anything transient in
   the container and cost a rebuild for a plan that had not changed. */
var PLAN_KEYS = ["budget","basis","objective","geo","named","audience",
                 "durationDays","formatPref","planningMode","reservePct"];
function affectsPlan(changed){
  if(!changed) return true;                    /* unknown - be safe, re-render */
  return PLAN_KEYS.some(function(k){ return k in changed; });
}

Store.subscribe(function(snapshot, changed, source){
  try{
    syncFormFromState();
    if(!affectsPlan(changed)) return;
    /* The summary is live: it re-renders on every change that alters the plan,
       debounced so dragging the budget slider stays smooth. */
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function(){
      if(document.getElementById("bl-results")) renderResults();
    }, 140);
  }catch(e){}
});

/* ---------- UI: build static pieces ---------- */
/* Two panels, not five. Budget, objective, audience, geography and duration
   are set once in the planner rail; what is left here genuinely is fine-tuning. */
var STEP_LABELS = [];   /* no steps — nothing renders these any more */
var RESULTS_STEP = 5;   /* kept at 5 so existing goToStep(5) callers still work */
/* The step tracker is gone. There is no wizard: the plan is live from the
   first paint, and the advanced settings sit in the rail beside every other
   control. renderSteps stays as a no-op for the handful of legacy callers. */
function renderSteps(){}

/* Renders using the same row component as the audience picker in the rail:
   title, one line of explanation, and a circular check. Consistency matters
   more than novelty here — a setting should look like every other setting. */
function syncRadioRow(btn, on){
  btn.classList.toggle("is-on", on);
  btn.setAttribute("aria-checked", on ? "true" : "false");
  btn.setAttribute("tabindex", on ? "0" : "-1");
}

function wireRadioGroup(container){
  if(!container || container.getAttribute("role") !== "radiogroup") return;
  if(container.dataset.radioWired === "1") return;
  container.dataset.radioWired = "1";
  container.addEventListener("keydown", function(e){
    var radios = Array.prototype.slice.call(container.querySelectorAll('[role="radio"]'));
    if(!radios.length) return;
    var current = document.activeElement;
    if(!container.contains(current) || current.getAttribute("role") !== "radio") return;
    var idx = radios.indexOf(current);
    if(idx < 0) return;
    var target = null;
    if(e.key === "ArrowDown" || e.key === "ArrowRight") target = radios[(idx + 1) % radios.length];
    else if(e.key === "ArrowUp" || e.key === "ArrowLeft") target = radios[(idx - 1 + radios.length) % radios.length];
    else if(e.key === "Home") target = radios[0];
    else if(e.key === "End") target = radios[radios.length - 1];
    else return;
    e.preventDefault();
    target.focus({ preventScroll: true });
    target.click();
  });
}

function renderChipRow(containerId, options, stateKey, eventName){
  var el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = options.map(function(o){
    var on = state[stateKey] === o.id;
    return '<button type="button" class="bl-campaign-aud-row' + (on ? " is-on" : "") +
      '" data-val="' + o.id + '" role="radio" aria-checked="' + (on ? "true" : "false") +
      '" tabindex="' + (on ? "0" : "-1") + '">' +
      '<span><strong class="bl-campaign-option-name">' + o.label + '</strong>' +
      (o.desc ? '<span class="bl-campaign-option-meta">' + o.desc + '</span>' : '') + '</span>' +
      '<span class="bl-campaign-aud-check" aria-hidden="true"></span></button>';
  }).join("");
  wireRadioGroup(el);
  el.querySelectorAll("[data-val]").forEach(function(btn){
    btn.addEventListener("click", function(){
      state[stateKey] = btn.getAttribute("data-val");
      var payload = {}; payload[eventName] = state[stateKey];
      track(eventName, payload);
      renderChipRow(containerId, options, stateKey, eventName);
      syncAdvancedLabel();
    });
  });
}


function renderBudgetQuick(){}   /* budget presets live in the rail */

function wireStep1(){
  /* Cost basis. Uses the same row component as every other picker in the rail. */
  var list = document.getElementById("bl-basis-toggle");
  if(!list) return;
  wireRadioGroup(list);
  list.querySelectorAll("[data-basis]").forEach(function(btn){
    btn.addEventListener("click", function(){
      state.basis = btn.getAttribute("data-basis");
      track("budget_basis_selected", {budget_basis_selected: state.basis});
      syncBasisRows();
      syncAdvancedLabel();
    });
  });
}

function syncBasisRows(){
  var list = document.getElementById("bl-basis-toggle");
  if(!list) return;
  list.querySelectorAll("[data-basis]").forEach(function(b){
    syncRadioRow(b, b.getAttribute("data-basis") === state.basis);
  });
}
function budgetBand(n){
  if(n < 2500) return "under-2.5k";
  if(n < 10000) return "2.5k-10k";
  if(n < 25000) return "10k-25k";
  if(n < 50000) return "25k-50k";
  return "50k-plus";
}

function wireAdvanced(){
  renderChipRow("bl-format-pref-row", FORMAT_PREFS, "formatPref", "strategy_preference_selected");
  renderChipRow("bl-planning-mode-row", PLANNING_MODES, "planningMode", "planning_mode_selected");

  /* Advanced is the last block in the rail, so opening it expands content
     below the fold. Bring it into view inside the rail's own scroller. */
  var adv = document.getElementById("hl-advanced");
  if(!adv) return;
  adv.addEventListener("toggle", function(){
    if(!adv.open) return;
    track("advanced_opened", {});
    setTimeout(function(){
      try{ adv.scrollIntoView({behavior:"smooth", block:"nearest"}); }catch(e){}
    }, 80);
  });
}

/* ---------- navigation ----------
   Nothing to navigate any more. goToStep is kept because several call sites
   (and the summary's own CTA) still ask for step 5 meaning "show me the plan". */
function goToStep(n, skipScroll){
  state.step = n;
  if(n === RESULTS_STEP){
    track("calculator_completed", {});
    state.completed = true;
    renderResults();
    var res = document.getElementById("bl-results");
    if(res && !skipScroll) res.scrollIntoView({behavior:"smooth", block:"start"});
  }
}

function wireNav(){}

/* "Advanced settings" from anywhere on the page opens the rail's disclosure
   and puts it in front of the reader — one destination, one name. */
window.blGoToStep = function(){
  var adv = document.getElementById("hl-advanced");
  if(!adv) return;
  adv.open = true;
  adv.scrollIntoView({behavior:"smooth", block:"center"});
  adv.classList.add("is-flash");
  setTimeout(function(){ adv.classList.remove("is-flash"); }, 1400);
};

/* ---------- action panel ----------
   The summary's job is not just to report a plan but to tell the reader what
   they can do about it. Every card here is generated from the costed plan by
   bl-actions.js, and every one previews its real effect before applying. */
var ACTION_ICONS = {"money": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2v20\"/><path d=\"M17 6.5A3.5 3.5 0 0 0 13.5 3h-2a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2A3.5 3.5 0 0 1 8 13.5\"/></svg>", "discount": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20.6 12.6 12 21.2 3.4 12.6A5 5 0 0 1 12 7.5a5 5 0 0 1 8.6 5.1z\"/></svg>", "unlock": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"10\" width=\"16\" height=\"11\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 7.5-2\"/></svg>", "confirm": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 11.5 11.5 14 16 9\"/><circle cx=\"12\" cy=\"12\" r=\"9\"/></svg>"};

function actionPanelMarkup(result){
  if(!window.BLActions) return "";
  var actions = window.BLActions.build({
    result: result, state: state, DATA: DATA,
    opts: calcOpts(state),
    replan: function(o){ return window.blReplan(o); }
  });
  if(!actions.length) return "";
  ACTION_CACHE = actions;

  var cards = actions.map(function(a, i){
    var body = '<div class="bl-act-body"><h4>' + a.title + '</h4><p>' + a.detail + '</p>';
    if(a.checklist){
      body += '<ul class="bl-act-check">' + a.checklist.map(function(c, ci){
        var id = 'bl-act-chk-' + i + '-' + ci;
        return '<li><input type="checkbox" id="' + id + '"><label for="' + id + '">' +
               '<b>' + c.label + '</b><span>' + c.text + '</span></label></li>';
      }).join("") + '</ul>';
    }
    if(a.note) body += '<p class="bl-act-note">' + a.note + '</p>';
    body += '</div>';

    var foot = '';
    if(a.apply && a.preview && a.preview.ok && a.preview.rows.length){
      foot = '<div class="bl-act-foot">' +
        '<button type="button" class="bl-act-cta" data-act="' + i + '">' + a.cta +
        '<i aria-hidden="true">\u2192</i></button>' +
        '<span class="bl-act-hint">See the effect before it changes anything</span></div>' +
        '<div class="bl-act-preview" id="bl-act-prev-' + i + '" hidden>' +
          '<p class="bl-act-preview-head">If you apply this</p>' +
          '<dl class="bl-act-delta">' + a.preview.rows.map(function(r){
            return '<div class="is-' + r.dir + '"><dt>' + r.label + '</dt>' +
                   '<dd><s>' + r.from + '</s><i aria-hidden="true">\u2192</i><b>' + r.to + '</b></dd></div>';
          }).join("") + '</dl>' +
          '<div class="bl-act-confirm">' +
            '<button type="button" class="bl-btn bl-btn-primary bl-act-apply" data-act="' + i + '">Apply this change</button>' +
            '<button type="button" class="bl-btn bl-btn-ghost bl-act-cancel" data-act="' + i + '">Cancel</button>' +
          '</div></div>';
    } else if(a.step){
      foot = '<div class="bl-act-foot"><button type="button" class="bl-act-cta" data-step-to="' + a.step + '">' +
             a.cta + '<i aria-hidden="true">\u2192</i></button></div>';
    } else if(a.ctaEmail || a.ctaHref){
      foot = '<div class="bl-act-foot"><a class="bl-act-cta" href="' + (a.ctaHref || "#bl-plan-email") + '">' + a.cta +
             '<i aria-hidden="true">\u2192</i></a></div>';
    }

    return '<article class="bl-act-card is-' + a.tone + '" data-kind="' + a.kind + '">' +
      '<span class="bl-act-icon" aria-hidden="true">' + (ACTION_ICONS[a.kind] || "") + '</span>' +
      body + foot + '</article>';
  }).join("");

  var doable = actions.filter(function(a){ return a.apply || a.step; }).length;
  return '<section class="bl-act-panel" aria-label="Recommended next steps">' +
    '<header class="bl-act-head"><h3>Your next moves</h3>' +
    '<p>' + (doable ? doable + ' change' + (doable === 1 ? '' : 's') + ' you can make right now, each priced before you commit to it.'
                    : 'Everything worth checking before this plan is bookable.') + '</p></header>' +
    '<div class="bl-act-grid">' + cards + '</div></section>';
}
var ACTION_CACHE = [];

function wireActionPanel(){
  var root = document.getElementById("hl-drawer-plan-content");
  if(!root) return;
  root.querySelectorAll("[data-step-to]").forEach(function(btn){
    if(btn.dataset.actWired === "1") return;
    btn.dataset.actWired = "1";
    btn.addEventListener("click", function(){ window.blGoToStep(parseInt(btn.getAttribute("data-step-to"), 10)); });
  });
  root.querySelectorAll(".bl-act-cta[data-act]").forEach(function(btn){
    if(btn.dataset.actWired === "1") return;
    btn.dataset.actWired = "1";
    btn.addEventListener("click", function(){
      var i = btn.getAttribute("data-act");
      root.querySelectorAll(".bl-act-preview").forEach(function(p){
        if(p.id !== "bl-act-prev-" + i){ p.hidden = true; p.closest(".bl-act-card").classList.remove("is-previewing"); }
      });
      var panel = document.getElementById("bl-act-prev-" + i);
      var card = btn.closest(".bl-act-card");
      var open = panel.hidden;
      panel.hidden = !open;
      card.classList.toggle("is-previewing", open);
      if(open) track("action_previewed", {action_previewed: ACTION_CACHE[i] && ACTION_CACHE[i].id});
    });
  });
  root.querySelectorAll(".bl-act-cancel").forEach(function(btn){
    if(btn.dataset.actWired === "1") return;
    btn.dataset.actWired = "1";
    btn.addEventListener("click", function(){
      var i = btn.getAttribute("data-act");
      document.getElementById("bl-act-prev-" + i).hidden = true;
      btn.closest(".bl-act-card").classList.remove("is-previewing");
    });
  });
  root.querySelectorAll(".bl-act-apply").forEach(function(btn){
    if(btn.dataset.actWired === "1") return;
    btn.dataset.actWired = "1";
    btn.addEventListener("click", function(){
      var a = ACTION_CACHE[parseInt(btn.getAttribute("data-act"), 10)];
      if(!a || !a.apply) return;
      track("action_applied", {action_applied: a.id});
      window.blApplyChange(a.apply);
      root.classList.add("is-refreshed");
      setTimeout(function(){ root.classList.remove("is-refreshed"); }, 900);
      if(window.BLPlanDrawer && window.BLPlanDrawer.isOpen && window.BLPlanDrawer.isOpen()){
        root.scrollTop = 0;
      }
    });
  });
}

function renderResults(){
  var el = document.getElementById("bl-results");
  var result = runScenario(state.objective, state);
  track("scenario_recommended", {scenario_recommended: state.objective});
  /* The plan the summary was actually built from, so the reveal narrates this
     plan's real numbers rather than recomputing and risking a second answer. */
  window.__BL_LAST_RESULT__ = result;

  if(result.infeasible){
    var infeasHtml = loudAIMarkup(result) + '<div class="bl-infeasible"><h3>This budget doesn’t yet cover a feasible plan</h3>' +
      '<p>' + (result.minFormat ?
        'The smallest realistic buy we could find for this geography and campaign length is ' + result.minQty + ' × ' +
        result.minFormat.category + ' — ' + result.minFormat.format + ', at roughly ' + gbp(result.minBudget) + '. ' +
        'Media owners will not sell below that quantity, so we would rather tell you than return a plan nobody can book. ' +
        'Increase your budget, shorten the campaign length, or widen the geography and try again.' :
        'We couldn’t find a compatible format for the campaign length and geography selected. Try a different duration or area.') +
      '</p><button type="button" class="bl-btn bl-btn-ghost" id="bl-retry">Adjust your inputs</button></div>' +
      actionPanelMarkup(result);
    if(el){
      el.innerHTML = infeasHtml;
      el.classList.remove("is-active");
    }
    var infeasPlan = loudAIMarkup(result) + '<div class="bl-infeasible"><h3>This budget doesn’t yet cover a feasible plan</h3><p>Increase your budget, shorten the campaign, or widen geography and try again.</p></div>';
    if(window.BLPlanDrawer && window.BLPlanDrawer.refresh){
      window.BLPlanDrawer.refresh(infeasPlan, result);
    }
    wireLoudAI(result);
    wireActionPanel();
    var retry = document.getElementById("bl-retry");
    if(retry) retry.addEventListener("click", function(){ goToStep(1); });
    return;
  }

  var geoLabel = state.geo === "london" ? "London" : state.geo === "regional" ? "Regional UK" : state.geo === "named" ? (state.named || "Named city") : "UK-wide";
  /* Describe the plan that was actually costed, not the one the scenario
     intended — a reinforcement that couldn't reach its minimum buy is not
     claimed in the copy. */
  var anchorShare = Math.round((result.anchorLine.total / Math.max(1, result.spend)) * 100);
  var recSentence = "We’ve put " + anchorShare + "% of planned spend into " + result.anchor.f.category.toLowerCase() +
    " (" + result.anchorLine.qty + " × " + result.anchor.f.format + ") because " + result.scenario.desc.toLowerCase() + " — " + result.anchor.f.strength.toLowerCase() + "." +
    (result.reinforceLine
      ? " Reinforcement sits in " + result.reinforcement.f.category.toLowerCase() + " (" + result.reinforceLine.qty + " × " + result.reinforcement.f.format + ") to add " + result.reinforcement.f.strength.toLowerCase() + "."
      : " There is no second format in this plan: nothing else reaches a realistic minimum buy at this budget, so concentrating is the honest answer.");

  /* ---------- structured summary, built on the insight-guide design system:
     eyebrow + Montserrat display heading + lead, a stat band, a navy pull
     quote for the reasoning, then numbered sections. ---------- */
  function statCard(value, label, note, mod){
    return '<div class="bl-sum-stat' + (mod ? ' is-' + mod : '') + '">' +
      '<b class="bl-sum-stat-value">' + value + '</b>' +
      '<span class="bl-sum-stat-label">' + label + '</span>' +
      (note ? '<span class="bl-sum-stat-note">' + note + '</span>' : '') + '</div>';
  }
  function priceRow(label, value, mod){
    return '<div class="bl-sum-row' + (mod ? ' is-' + mod : '') + '">' +
      '<span class="bl-sum-row-label">' + label + '</span>' +
      '<span class="bl-sum-row-value">' + value + '</span></div>';
  }
  function section(num, title, lead, body, mod){
    return '<section class="bl-sum-section' + (mod ? ' ' + mod : '') + '">' +
      '<header class="bl-sum-section-head">' +
        '<span class="bl-sum-section-num" aria-hidden="true">' + num + '</span>' +
        '<div><h3 class="bl-sum-section-title">' + title + '</h3>' +
        (lead ? '<p class="bl-sum-section-lead">' + lead + '</p>' : '') + '</div>' +
      '</header>' + body + '</section>';
  }

  var html = "";
  html += loudAIMarkup(result);

  /* ---- header ---- */
  html += '<header class="bl-sum-head">' +
    '<p class="bl-sum-eyebrow"><span>' + result.scenario.label + '</span>' + geoLabel +
      ' · ' + durationLabel(state.durationDays) + ' · ex-VAT</p>' +
    '<h2 class="bl-sum-title">Your OOH plan for ' + gbp(state.budget) + '</h2>' +
    '<p class="bl-sum-lead">' + result.scenario.desc + '. Below is what that budget buys, what it should deliver, ' +
      'and what you would be trading away.</p>' +
    '</header>';

  /* ---- headline numbers ---- */
  html += '<div class="bl-sum-stats">' +
    statCard(gbp(state.budget), "Total budget", durationLabel(state.durationDays) + " · " + geoLabel) +
    statCard(gbp(result.spend), "Planned spend",
      result.mediaOnly ? "Media only — " + gbp(result.extraCost) + " production on top" : "Media, production and installation", "accent") +
    statCard(String(result.sites), "Sites booked",
      result.lines.length + " format" + (result.lines.length === 1 ? "" : "s") + " in the mix") +
    (result.cpm ? statCard("£" + result.cpm.mid.toFixed(2), "Per 1,000 impacts",
      "£" + result.cpm.low.toFixed(2) + "–£" + result.cpm.high.toFixed(2) + " across the range") : "") +
    statCard(gbp(result.reserve + Math.max(0, result.unallocated)), "Held back",
      gbp(result.reserve) + " contingency · " + gbp(Math.max(0, result.unallocated)) + " unallocated") +
    '</div>';

  /* ---- the reasoning, given weight ---- */
  html += '<blockquote class="bl-sum-quote">' + recSentence + '</blockquote>';

  /* ---- actions ---- */
  html += actionPanelMarkup(result);

  /* ---- 01 the mix ---- */
  var mixCards = '<div class="bl-sum-formats">' + result.lines.map(function(line){
    var f = line.f;
    return '<article class="bl-sum-format">' +
      '<div class="bl-sum-format-body">' +
        '<p class="bl-sum-format-tag">' + f.category + (f.technology === "DOOH" ? ' · Digital' : '') + '</p>' +
        '<h4 class="bl-sum-format-title">' + line.qty + ' × ' + f.format + '</h4>' +
        '<p class="bl-sum-format-text">' + (f.whyRecommend || f.strength) + '</p>' +
      '</div>' +
      '<div class="bl-sum-format-prices">' +
        priceRow("Media", gbp(line.media), "accent") +
        priceRow("Production", line.production ? gbp(line.production) : "£0 — no print") +
        priceRow("Installation", line.installation ? gbp(line.installation) : "£0 — none") +
        priceRow("Booking", f.campaignBasis + (line.cycles > 1 ? " × " + line.cycles + " cycles" : "")) +
        (line.discountRate > 0 ? priceRow("Volume discount", "−" + Math.round(line.discountRate * 100) + "% (" + line.discountLabel + ")", "good") : "") +
        priceRow("Line total", gbp(line.total), "total") +
      '</div>' +
      (line.taperNote || f.costStatus === "Planning range"
        ? '<p class="bl-sum-format-flag">' + (line.taperNote || "Priced from a planning range rather than a published rate — treat as indicative.") + '</p>'
        : '') +
    '</article>';
  }).join("") + '</div>';

  mixCards += '<div class="bl-sum-totals">' +
    (result.discount > 0 ? priceRow("Media at rate card", gbp(result.mediaGross)) : "") +
    (result.discount > 0 ? priceRow("Volume discount", "−" + gbp(result.discount), "good") : "") +
    priceRow(result.discount > 0 ? "Net media" : "Media", gbp(result.media)) +
    priceRow("Production", gbp(result.production)) +
    priceRow("Installation", gbp(result.installation)) +
    priceRow(result.mediaOnly ? "Total media spend" : "Total campaign cost", gbp(result.spend), "total") +
    (result.mediaOnly ? priceRow("Beyond your media-only budget", gbp(result.extraCost), "warn") : "") +
    '</div>';

  html += section("01", "What the budget buys",
    "Media, production and installation are shown separately and never bundled, so you can see what is negotiable.",
    mixCards);

  /* ---- 02 audience ---- */
  var audBody = result.audienceLow != null
    ? '<div class="bl-sum-audience">' +
        '<div class="bl-sum-audience-figure">' +
          '<b>' + Math.round(result.audienceLow).toLocaleString("en-GB") + ' – ' + Math.round(result.audienceHigh).toLocaleString("en-GB") + '</b>' +
          '<span class="bl-sum-caption">Indicative total campaign impacts</span>' +
          '<p>Total exposures under OOH planning methodology — not people reached.</p>' +
          '<span class="bl-sum-tag">Confidence: ' + (result.confidence || "Medium") + '</span>' +
        '</div>' +
        (result.cpm ? '<div class="bl-sum-audience-side">' +
          priceRow("Cost per 1,000 impacts", "£" + result.cpm.mid.toFixed(2), "accent") +
          priceRow("If impacts land at the low end", "£" + result.cpm.high.toFixed(2), "warn") +
          priceRow("If impacts land at the high end", "£" + result.cpm.low.toFixed(2), "good") +
        '</div>' : '') +
      '</div>' +
      '<p class="bl-sum-note"><strong>We do not model reach or frequency.</strong> Unique people reached, and how often, require Route or site-level operator data that sits outside this planning tool. We will not manufacture them from an impacts range — speak to a planner for Route-measured figures.</p>'
    : '<p class="bl-sum-note">No reliable audience benchmark exists for this combination — we’d rather say so than invent one.</p>';

  html += section("02", "What it should deliver", "Impacts only, as a range, with the confidence attached.", audBody);

  /* ---- 03 trade-off ---- */
  html += section("03", "What you’re trading away",
    "Every plan gives something up. Here is what this one costs you.",
    '<div class="bl-sum-tradeoff"><p>' + result.scenario.tradeoff + '</p></div>' +
    '<div class="bl-sum-geo">' + priceRow("Geographic footprint", geoLabel) +
      (state.geo === "named" ? '<p class="bl-sum-note">Named-city inventory is priced against regional bands — confirm exact site availability for ' + (state.named || "this city") + '.</p>' : '') +
    '</div>');

  /* ---- 04 alternatives ---- */
  var alts = ALT_MAP[state.objective].map(function(key){ return runScenario(key, state); }).filter(function(r){ return !r.infeasible; });
  if(alts.length){
    html += section("04", "The same money, planned differently",
      "There is rarely one correct answer. These are defensible alternatives for the identical budget.",
      '<div class="bl-sum-alts">' + alts.map(function(r){
        return '<button type="button" class="bl-sum-alt" data-alt="' + r.scenarioKey + '">' +
          '<p class="bl-sum-format-tag">' + r.scenario.label + '</p>' +
          '<h4 class="bl-sum-format-title">' + r.scenario.desc + '</h4>' +
          '<div class="bl-sum-alt-meta">' +
            '<span>' + r.sites + ' sites</span>' +
            '<span>' + r.lines.length + ' format' + (r.lines.length === 1 ? '' : 's') + '</span>' +
            (r.cpm ? '<span>£' + r.cpm.mid.toFixed(2) + ' / 1,000</span>' : '') +
          '</div>' +
          '<span class="bl-sum-alt-cta">See this plan <i aria-hidden="true">→</i></span>' +
        '</button>';
      }).join("") + '</div>');
  }

  /* ---- 05 exclusions ---- */
  if(result.exclusions && result.exclusions.length){
    html += section("05", "Formats we left out — and why",
      "These sit in the pricing matrix but can’t be planned automatically for this brief. Each is still available; it just needs a conversation rather than a calculation.",
      '<ul class="bl-exclusion-list">' + result.exclusions.map(function(x){
        return '<li><b>' + x.category + ' — ' + x.format + '</b><span>' + x.reason +
          (x.alternative ? ' Closest planned alternative: <em>' + x.alternative + '</em>.' : '') + '</span></li>';
      }).join("") + '</ul>');
  }

  /* ---- 06 caveats ---- */
  html += section("06", "Assumptions and data caveats",
    "The rules this plan was built with, stated plainly.",
    '<ul class="bl-sum-caveats">' +
    '<li><b>Ex-VAT, 2026 planning data.</b> All headline media pricing is drawn from Loud! OOH’s approved 2026 planning data. Planning-range formats are marked and are not guaranteed live quotes.</li>' +
    '<li><b>Impacts are benchmarks, not measurement.</b> Figures are indicative planning benchmarks scaled to your campaign length, not Route-measured site data. Exact delivery depends on site, schedule, loop and share of voice.</li>' +
    '<li><b>Availability is never guaranteed by a rate.</b> Confirm live inventory with a planner before booking.</li>' +
    '<li><b>Nothing is force-spent.</b> A ' + Math.round((result.reserve / Math.max(1, state.budget)) * 100) + '% contingency is held before anything is allocated, and any remainder is shown as unallocated rather than pushed into a marginal extra unit.</li>' +
    '<li><b>Minimum buys are respected.</b> Every format is planned at a realistic minimum quantity. Where a budget cannot reach one, we say so rather than returning a quantity no media owner would sell.</li>' +
    '<li><b>Volume discounts are assumed, not guaranteed.</b> 5% at 25–49 units, 10% at 50–99, 15% at 100+, applied to media only — production and installation never discount.</li>' +
    '<li><b>Long runs are not extrapolated linearly.</b> Taxi and multi-cycle campaigns are quoted below a straight multiple of the rate card. Confirm the negotiated rate before booking.</li>' +
    '</ul>', "is-quiet");

  var planHtml = html;
  window.__BL_PLAN_HTML__ = planHtml;

  if(el){
    el.innerHTML = planHtml;
    el.classList.remove("is-active");
  }

  if(window.BLPlanDrawer && window.BLPlanDrawer.refresh){
    window.BLPlanDrawer.refresh(planHtml, result);
  } else {
    var drawerContent = document.getElementById("hl-drawer-plan-content");
    if(drawerContent){
      drawerContent.innerHTML = planHtml;
      drawerContent.classList.add("is-active");
    }
  }

  wireLoudAI(result);
  wireActionPanel();

  if(window.__BL_FORECAST__ && window.__BL_FORECAST__.refresh){
    window.__BL_FORECAST__.refresh(result);
  }

  var drawerRoot = document.getElementById("hl-drawer-plan-content");
  if(drawerRoot){
    drawerRoot.querySelectorAll("[data-alt]").forEach(function(btn){
      btn.addEventListener("click", function(){
        state.objective = btn.getAttribute("data-alt");
        track("alternative_scenario_viewed", {alternative_scenario_viewed: state.objective});
        renderResults();
      });
    });
  }
}
function mixRow(label, val){
  return '<div class="bl-mix-row"><div class="bl-mix-name">'+label+'</div><div class="bl-mix-cost">'+val+'</div></div>';
}
function formatMixRow(line){
  var f = line.f;
  var bookingNote = f.campaignBasis + (line.cycles > 1 ? ' × ' + line.cycles + ' cycles' : ' booking');
  var meta = f.category + ' · ' + f.buyingUnit + ' · ' + bookingNote +
    (f.costStatus === "Planning range" ? ' · planning range' : '') +
    (line.discountRate > 0 ? ' · ' + line.discountLabel + ' volume discount −' + Math.round(line.discountRate*100) + '%' : '');
  return '<div class="bl-mix-row"><div><div class="bl-mix-name">'+line.qty+' × '+f.format+'</div>' +
    '<div class="bl-mix-meta">'+meta+'</div>' +
    (line.taperNote ? '<div class="bl-mix-meta">'+line.taperNote+'</div>' : '') +
    '</div>' +
    '<div class="bl-mix-cost">'+gbp(line.media)+'<small>media</small></div></div>';
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
      var tagCls = f.costStatus === "POA" ? "bl-format-tag--planning" : (f.costStatus.indexOf("Published") > -1 ? "bl-format-tag--published" : "bl-format-tag--planning");
      function matrixPrice(lo, hi){ return f.costStatus === "POA" ? "POA" : ('£'+lo+'–'+hi); }
      return '<tr><td><div class="bl-format-title">'+f.format+'</div><div class="bl-format-desc">'+f.technology+' · '+f.buyingUnit+'</div></td>' +
        '<td><div class="bl-price-val">'+f.campaignBasis+'</div></td>' +
        '<td><div class="bl-price-val">'+matrixPrice(f.londonLow, f.londonHigh)+'</div></td>' +
        '<td><div class="bl-price-val">'+matrixPrice(f.regionalLow, f.regionalHigh)+'</div></td>' +
        '<td><div class="bl-price-val">£'+f.production+'</div><div class="bl-price-sub">production</div></td>' +
        '<td><div class="bl-price-val">£'+f.installation+'</div><div class="bl-price-sub">installation</div></td>' +
        '<td><span class="bl-format-tag '+tagCls+'">'+f.costStatus+'</span></td></tr>';
    }).join("");
    return '<div class="bl-cat-block'+(idx===0?" is-open":"")+'"><button type="button" class="bl-cat-head lo-faq-q" data-cat="'+cat+'" aria-expanded="'+(idx===0?"true":"false")+'">' +
      '<span class="bl-cat-name">'+cat+'</span><span class="bl-cat-head-meta"><span class="bl-cat-count">'+byCat[cat].length+' formats</span><span class="lo-faq-plus" aria-hidden="true">+</span></span></button>' +
      '<div class="bl-cat-body"><div class="bl-table-wrap bl-table-scroll"><table class="bl-table bl-pricing-table"><thead><tr><th>Format</th><th>Basis</th><th>London £</th><th>Regional £</th><th>Production</th><th>Installation</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div>';
  }).join("");
  el.querySelectorAll(".bl-cat-head").forEach(function(btn){
    btn.addEventListener("click", function(){
      var block = btn.closest(".bl-cat-block");
      var isOpen = block.classList.contains("is-open");
      el.querySelectorAll(".bl-cat-block.is-open").forEach(function(openBlock){
        if(openBlock !== block){
          openBlock.classList.remove("is-open");
          var openBtn = openBlock.querySelector(".bl-cat-head");
          if(openBtn) openBtn.setAttribute("aria-expanded", "false");
        }
      });
      if(isOpen){
        block.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      } else {
        block.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* ---------- faq ---------- */
function renderFaq(){
  var el = document.getElementById("bl-faq-list");
  if(!el) return;
  el.innerHTML = FAQS.map(function(f,i){
    return '<div class="lo-faq-item" data-faq="'+i+'"><button type="button" class="lo-faq-q"><span>'+f.q+'</span><span class="lo-faq-plus">+</span></button>' +
      '<div class="lo-faq-a"><p>'+f.a+'</p></div></div>';
  }).join("");
  el.querySelectorAll(".lo-faq-q").forEach(function(btn){
    btn.addEventListener("click", function(){
      var item = btn.closest(".lo-faq-item");
      var isOpen = item.classList.contains("is-open");
      el.querySelectorAll(".lo-faq-item.is-open").forEach(function(openItem){
        if(openItem !== item){
          openItem.classList.remove("is-open");
        }
      });
      if(isOpen){
        item.classList.remove("is-open");
      } else {
        item.classList.add("is-open");
      }
    });
  });
  var items = el.querySelectorAll(".lo-faq-item");
  if("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        var target = entry.target;
        var siblings = Array.prototype.slice.call(items);
        var i = siblings.indexOf(target);
        setTimeout(function(){ target.classList.add("is-in"); }, i * 80);
        io.unobserve(target);
      });
    }, {threshold: 0.12, rootMargin: "0px 0px -40px 0px"});
    items.forEach(function(item){ io.observe(item); });
  } else {
    items.forEach(function(item){ item.classList.add("is-in"); });
  }
  var schema = {"@context":"https://schema.org","@type":"FAQPage","mainEntity": FAQS.map(function(f){
    return {"@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}};
  })};
  var tag = document.getElementById("lo-faq-schema");
  if(tag) tag.textContent = JSON.stringify(schema);
}

/* ---------- Loud AI: brief → verdict → live quote ---------- */
var CITIES = {
  london:"london", manchester:"Manchester", leeds:"Leeds", birmingham:"Birmingham",
  bristol:"Bristol", glasgow:"Glasgow", liverpool:"Liverpool", edinburgh:"Edinburgh",
  newcastle:"Newcastle", sheffield:"Sheffield", cardiff:"Cardiff", nottingham:"Nottingham",
  brighton:"Brighton", oxford:"Oxford", cambridge:"Cambridge", reading:"Reading",
  belfast:"Belfast", aberdeen:"Aberdeen", southampton:"Southampton", leicester:"Leicester"
};

function parseBrief(text){
  var q = String(text || "").toLowerCase();
  var parsed = { hits: 0, budget: null, durationDays: null, geo: null, named: "", objective: null, audience: null };
  var km = q.match(/(?:£|gbp)?\s*(\d+(?:\.\d+)?)\s*k\b/);
  var pounds = q.match(/£\s*([\d,]+)/) || q.match(/\b(\d{1,3}(?:,\d{3})+)\b/) || q.match(/\b(\d{4,6})\b/);
  if(km){ parsed.budget = Math.round(parseFloat(km[1]) * 1000); parsed.hits++; }
  else if(pounds){ parsed.budget = parseInt(pounds[1].replace(/,/g,""),10); parsed.hits++; }
  if(/\b1\s*day|\bone\s*day/.test(q)){ parsed.durationDays = 1; parsed.hits++; }
  else if(/\b8\s*weeks?|\btwo\s*months/.test(q)){ parsed.durationDays = 56; parsed.hits++; }
  else if(/\b4\s*weeks?|\b1\s*month|\bone\s*month/.test(q)){ parsed.durationDays = 28; parsed.hits++; }
  else if(/\b2\s*weeks?|\bfortnight/.test(q)){ parsed.durationDays = 14; parsed.hits++; }
  else if(/\b1\s*week|\bone\s*week/.test(q)){ parsed.durationDays = 7; parsed.hits++; }
  if(/\buk[- ]?wide|\bnation(?:wide|al)\b|\bwhole\s+uk|\bacross\s+the\s+uk/.test(q)){ parsed.geo = "uk"; parsed.hits++; }
  else if(/\blondon\b/.test(q)){ parsed.geo = "london"; parsed.hits++; }
  else {
    Object.keys(CITIES).forEach(function(key){
      if(key === "london") return;
      if(q.indexOf(key) > -1){ parsed.geo = "named"; parsed.named = CITIES[key]; parsed.hits++; }
    });
    if(!parsed.geo && /\bregional\b|\bnorth\b|\bmidlands\b/.test(q)){ parsed.geo = "regional"; parsed.hits++; }
  }
  if(/\bown\b|\bdominat|\blocal\b|\bcatchment|\bcity centre|\bhigh street/.test(q)){ parsed.objective = "local"; parsed.hits++; }
  else if(/\bpremium\b|\blaunch\b|\bfame\b|\bstature\b|\bhero\b/.test(q)){ parsed.objective = "premium"; parsed.hits++; }
  else if(/\bfrequency\b|\brepeat\b|\brepetition\b/.test(q)){ parsed.objective = "frequency"; parsed.hits++; }
  else if(/\breach\b|\bawareness\b|\bbroad\b/.test(q)){ parsed.objective = "reach"; parsed.hits++; }
  if(/\bcommuter/.test(q)) parsed.audience = "commuters";
  else if(/\bairport|\btraveller|\bpassenger/.test(q)) parsed.audience = "airport";
  else if(/\bevent|\bmatch day|\bfestival/.test(q)) parsed.audience = "event";
  else if(/\bshopper|\bretail/.test(q)) parsed.audience = "retail";
  else if(/\bresident/.test(q)) parsed.audience = "local";
  else if(/\burban|\bstudent/.test(q)) parsed.audience = "urban";
  if(parsed.audience) parsed.hits++;
  return parsed;
}

var PREF_LABELS = {none:"No format preference", static:"Static first", digital:"Digital first",
  transport:"Transport first", advan:"AdVan first", premium:"Premium formats"};

/* A collapsed section that hides its values makes people open it to check.
   This puts the current settings on the label instead. */
function syncAdvancedLabel(){
  var el = document.getElementById("hl-adv-state");
  if(!el) return;
  el.textContent = [
    state.basis === "media-only" ? "Media-only budget" : "All-in budget",
    PREF_LABELS[state.formatPref] || "No format preference",
    state.planningMode === "conservative" ? "Conservative pricing" : "Indicative pricing"
  ].join(" · ");
}

function syncFormFromState(){
  syncAdvancedLabel();
  /* Only the advanced fields live in this panel now; everything else is
     rendered by the planner rail from the same store. */
  syncBasisRows();
  renderChipRow("bl-format-pref-row", FORMAT_PREFS, "formatPref", "strategy_preference_selected");
  renderChipRow("bl-planning-mode-row", PLANNING_MODES, "planningMode", "planning_mode_selected");
}

function applyBrief(parsed){
  if(parsed.budget) state.budget = parsed.budget;
  if(parsed.durationDays) state.durationDays = parsed.durationDays;
  if(parsed.geo){ state.geo = parsed.geo; state.named = parsed.named || state.named; }
  if(parsed.objective) state.objective = parsed.objective;
  if(parsed.audience) state.audience = parsed.audience;
  state.started = true;
  syncFormFromState();
  renderStateTags();
  /* No outbound push needed — the console subscribes to the same store. */
}

function renderStateTags(){
  renderBriefTags({
    budget: state.budget,
    durationDays: state.durationDays,
    geo: state.geo,
    named: state.named,
    objective: state.objective,
    audience: state.audience,
    hits: 1
  });
}

function renderBriefTags(parsed){
  var parts = [];
  if(parsed.budget) parts.push(gbp(parsed.budget));
  if(parsed.durationDays) parts.push(durationLabel(parsed.durationDays));
  if(parsed.geo === "london") parts.push("London");
  else if(parsed.geo === "uk") parts.push("UK-wide");
  else if(parsed.geo === "named") parts.push(parsed.named || "Named city");
  else if(parsed.geo === "regional") parts.push("Regional UK");
  if(parsed.objective) parts.push(SCENARIOS[parsed.objective].label);
  if(parsed.audience){
    var aud = AUDIENCES.filter(function(a){ return a.id === parsed.audience; })[0];
    if(aud) parts.push(aud.label);
  }
  var summary = parts.join(" · ");
  var hl = document.getElementById("hl-plan-summary");
  if(hl && summary) hl.textContent = summary;
  var pl = document.getElementById("bl-planner-live");
  if(pl && summary) pl.textContent = summary + " — optional cost basis & format settings";
  var el = document.getElementById("bl-ai-tags");
  if(!el) return;
  el.hidden = true;
  el.innerHTML = summary ? "<span>"+summary+"</span>" : "";
}

window.blRenderBriefTags = renderBriefTags;
/* Retained for callers outside this file; it is now just a store read. */
window.blGetPlanState = function(){
  return {budget:state.budget, durationDays:state.durationDays, objective:state.objective, geo:state.geo, named:state.named, audience:state.audience, started:state.started};
};

function placeLabel(){
  if(state.geo === "london") return "London";
  if(state.geo === "uk") return "the UK";
  if(state.geo === "named") return state.named || "one city";
  return "a regional market";
}

function loudVerdict(result){
  var place = placeLabel();
  var b = state.budget;
  if(result.infeasible){
    return { tone:"thin", title:"This budget cannot buy a feasible mix yet", body:"Raise the number or shorten the campaign. Loud AI will not invent inventory that the rate card cannot cover." };
  }
  if(state.geo === "uk" && b < 25000){
    return { tone:"tight", title:"This budget is too thin for UK-wide", body:"Spread nationally and nothing has presence. Concentrate on "+(state.named||"one city")+" and you can actually own a corridor." };
  }
  if(state.geo === "london" && b < 10000){
    return { tone:"tight", title:"London is expensive at "+gbp(b), body:"You can still make a sharp burst — fewer sites, tighter geography. A Loud! planner can confirm which sites are actually live." };
  }
  if((state.geo === "named" || state.geo === "regional") && b >= 10000){
    return { tone:"own", title:"This budget can own "+place, body:"Keep the mix concentrated. The plan below is a media system for "+place+", not a thin national sprinkle." };
  }
  if(b >= 50000){
    return { tone:"own", title:"This is a real media system", body:"Enough budget for reach and reinforcement. Next step is live availability — not another calculator pass." };
  }
  if(b < 5000){
    return { tone:"burst", title:"A sharp burst, not a campaign system", body:"At "+gbp(b)+" the honest play is one format in one place. Depth beats a handful of leftover panels." };
  }
  return { tone:"own", title:"This mix can do the job in "+place, body:"The plan below is built from verified 2026 rates. A planner still has to confirm sites, dates and Route delivery." };
}

function loudMoves(result){
  var moves = [];
  if(state.geo === "uk" && state.budget < 40000){
    moves.push({ id:"own-city", label:"Own one city instead", apply:function(){ state.geo = "named"; if(!state.named) state.named = "Manchester"; state.objective = "local"; } });
  }
  if(state.durationDays < 14){
    moves.push({ id:"two-weeks", label:"Run it for 2 weeks", apply:function(){ state.durationDays = 14; } });
  }
  if(state.objective === "reach" && (state.geo === "named" || state.geo === "regional")){
    moves.push({ id:"go-local", label:"Switch to local dominance", apply:function(){ state.objective = "local"; } });
  }
  if(state.objective !== "premium" && state.budget >= 25000){
    moves.push({ id:"premium", label:"Try a premium impact mix", apply:function(){ state.objective = "premium"; } });
  }
  if(state.geo === "london" && state.budget < 15000 && state.objective !== "local"){
    moves.push({ id:"london-local", label:"Tighten to one London catchment", apply:function(){ state.objective = "local"; } });
  }
  return moves.slice(0, 3);
}

function planSnapshot(result){
  var lines = [
    "Loud AI plan from the OOH Budget Lab",
    "Budget: "+gbp(state.budget)+" ("+state.basis+")",
    "Objective: "+SCENARIOS[state.objective].label,
    "Geography: "+placeLabel(),
    "Duration: "+durationLabel(state.durationDays),
    "Audience: "+(AUDIENCES.filter(function(a){return a.id===state.audience;})[0]||{}).label
  ];
  if(!result.infeasible){
    lines.push("Anchor: "+result.anchorQty+" × "+result.anchor.f.format+" ("+result.anchor.f.category+")");
    if(result.reinforcement && result.reinforceQty) lines.push("Reinforcement: "+result.reinforceQty+" × "+result.reinforcement.f.format);
    lines.push("Planned spend: "+gbp(result.spend));
  }
  lines.push("Indicative only — confirm live inventory.");
  return lines.join("\n");
}

function planFullExport(result){
  if(result.infeasible) return planSnapshot(result);
  var geoLabel = state.geo === "london" ? "London" : state.geo === "regional" ? "Regional UK" : state.geo === "named" ? (state.named || "Named city") : "UK-wide";
  var lines = [
    "LOUD! OOH — BUDGET LAB PLAN EXPORT",
    "Generated: " + new Date().toISOString(),
    "",
    "BRIEF",
    "Budget: " + gbp(state.budget) + " (" + (state.basis === "media-only" ? "media only" : "all-in") + ")",
    "Objective: " + SCENARIOS[state.objective].label,
    "Geography: " + geoLabel,
    "Duration: " + durationLabel(state.durationDays),
    "Audience: " + (AUDIENCES.filter(function(a){ return a.id === state.audience; })[0] || {}).label,
    "Format preference: " + (PREF_LABELS[state.formatPref] || "No preference"),
    "Planning mode: " + (state.planningMode === "conservative" ? "Conservative" : "Indicative"),
    "",
    "HEADLINE",
    "Planned spend: " + gbp(result.spend),
    "Sites: " + result.sites,
    "Formats: " + result.lines.length
  ];
  if(result.cpm) lines.push("Cost per 1,000 impacts: £" + result.cpm.mid.toFixed(2) + " (£" + result.cpm.low.toFixed(2) + "–£" + result.cpm.high.toFixed(2) + ")");
  if(result.audienceLow != null){
    lines.push("Indicative impacts: " + Math.round(result.audienceLow).toLocaleString("en-GB") + " – " + Math.round(result.audienceHigh).toLocaleString("en-GB"));
  }
  lines.push("", "MIX");
  result.lines.forEach(function(line){
    var f = line.f;
    lines.push("- " + line.qty + " × " + f.format + " (" + f.category + ")");
    lines.push("  Media: " + gbp(line.media) + " · Production: " + gbp(line.production) + " · Installation: " + gbp(line.installation));
    lines.push("  Line total: " + gbp(line.total));
  });
  lines.push("", "TRADE-OFF", result.scenario.tradeoff);
  lines.push("", "Indicative only — confirm live inventory with a Loud! OOH planner.");
  return lines.join("\n");
}

function emailBodyText(result, name, email){
  var addr = (email || "you@brand.co.uk").trim();
  var who = (name || "").trim();
  var header = who ? ("From: " + who + " <" + addr + ">") : ("From: " + addr);
  return header + "\n\n" + planFullExport(result);
}

function downloadTextFile(filename, text){
  try{
    var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }catch(e){}
}

window.blPlanFullExport = planFullExport;
window.blEmailBodyText = emailBodyText;
window.blGbp = gbp;
window.blDownloadPlan = function(result){
  var r = result || window.__BL_LAST_RESULT__;
  if(!r) return;
  downloadTextFile("loudooh-plan-" + state.budget + ".txt", planFullExport(r));
  track("plan_downloaded", {type: "plan"});
};

/* The verdict, and nothing else.

   This block used to also carry "Change the mix" buttons and the email form.
   Both were duplicates: the buttons do the same job as "Your next moves"
   below, and an email form at the TOP asks for an address before the reader
   has seen the plan. There is now one action panel and one send block, and
   the send block sits at the end where it belongs. */
function loudAIMarkup(result){
  var v = loudVerdict(result);
  var html = '<aside class="bl-ai" id="bl-ai-verdict" aria-label="Loud AI verdict">';
  html += '<div class="bl-ai-verdict is-'+v.tone+'">';
  html += '<p class="bl-ai-mark">Loud AI</p>';
  html += '<h3>'+v.title+'</h3>';
  html += '<p class="bl-ai-body">'+v.body+'</p>';
  html += "</div></aside>";
  return html;
}

/* The one place the plan can be sent. Last thing in the summary: read it,
   act on it, then take it away. */
function sendBlockMarkup(){
  var html = '<section class="bl-sum-send" id="bl-sum-send">';
  html += '<h3>Take this plan with you</h3>';
  html += '<p class="bl-sum-send-lead">Opens your mail app with the plan in it and copies in a planner. No sign-up, and no follow-up unless you ask for one.</p>';
  html += '<form class="bl-ai-lead" id="bl-ai-lead" novalidate>';
  html += '<div class="bl-ai-lead-row">';
  html += '<label class="bl-ai-field"><span>Work email</span><input id="bl-ai-email" type="email" name="email" autocomplete="email" required placeholder="you@brand.co.uk"></label>';
  html += '<label class="bl-ai-field"><span>Name <em>(optional)</em></span><input id="bl-ai-name" type="text" name="name" autocomplete="name" placeholder="Alex"></label>';
  html += '<button type="submit" class="bl-btn bl-btn-primary" id="bl-ai-send">Send me this plan</button>';
  html += "</div>";
  html += '<p class="bl-ai-error" id="bl-ai-error" hidden role="alert"></p>';
  html += "</form>";
  html += '<p class="bl-ai-done" id="bl-ai-done" hidden>Your mail app should be open with the plan in it. If it didn\u2019t open, write to hello@loudooh.co.uk.</p>';
  html += "</section>";
  return html;
}


function wireLoudAI(result){
  var moves = loudMoves(result);
  document.querySelectorAll("[data-move]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var id = btn.getAttribute("data-move");
      var move = moves.filter(function(m){ return m.id === id; })[0];
      if(!move) return;
      move.apply();
      track("loud_ai_move", {move:id});
      syncFormFromState();
      renderStateTags();
      renderResults();   /* the console updates itself through the store */
    });
  });
  var form = document.getElementById("bl-ai-lead");
  if(!form) return;
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var email = (document.getElementById("bl-ai-email").value || "").trim();
    var name = (document.getElementById("bl-ai-name").value || "").trim();
    var err = document.getElementById("bl-ai-error");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      err.hidden = false;
      err.textContent = "Enter a work email so a planner can send the live quote.";
      document.getElementById("bl-ai-email").focus();
      return;
    }
    err.hidden = true;
    var subject = "Budget Lab mix — "+gbp(state.budget)+" — "+placeLabel();
    var body = (name ? "From: "+name+" <"+email+">\n" : "From: "+email+"\n") + "\n" + planSnapshot(result);
    var href = "mailto:hello@loudooh.co.uk?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
    track("lead_cta_clicked", {source:"loud_ai", budget:state.budget, geo:state.geo});
    window.location.href = href;
    form.hidden = true;
    var done = document.getElementById("bl-ai-done");
    if(done) done.hidden = false;
  });
}

function wireBriefBar(){
  var form = document.getElementById("bl-ai-brief");
  var input = document.getElementById("bl-ai-input");
  var err = document.getElementById("bl-ai-brief-error");
  if(!form || form.getAttribute("data-wired") === "1") return;
  form.setAttribute("data-wired", "1");
  function applyOnly(text){
    var parsed = parseBrief(text);
    if(parsed.hits < 1){
      err.hidden = false;
      err.textContent = "Add a budget or a city — for example £25k, 2 weeks, Leeds.";
      input.focus();
      return false;
    }
    err.hidden = true;
    applyBrief(parsed);
    track("loud_ai_brief", {budget:state.budget, geo:state.geo, objective:state.objective});
    return true;
  }
  form.addEventListener("submit", function(e){
    e.preventDefault();
    applyOnly(input.value);
  });
  var briefTimer = null;
  input.addEventListener("input", function(){
    clearTimeout(briefTimer);
    briefTimer = setTimeout(function(){
      var text = input.value.trim();
      if(!text) return;
      var parsed = parseBrief(text);
      if(parsed.hits < 1) return;
      err.hidden = true;
      applyBrief(parsed);
      track("loud_ai_brief_live", {budget: state.budget, geo: state.geo, objective: state.objective});
    }, 280);
  });
  form.querySelectorAll("[data-brief]").forEach(function(chip){
    chip.addEventListener("click", function(){
      input.value = chip.getAttribute("data-brief");
      applyOnly(chip.getAttribute("data-brief"));
    });
  });
}

window.blFocusLoudAI = function(){
  var bar = document.getElementById("loud-ai");
  if(bar) bar.scrollIntoView({behavior:"smooth", block:"center"});
  var input = document.getElementById("bl-ai-input");
  if(input) setTimeout(function(){ input.focus(); }, 400);
};

window.blParseBrief = parseBrief;
/* Price a hypothetical change without touching live state — this is what lets
   the summary show a real before/after instead of a vague promise. */
window.blReplan = function(overrides, scenarioKey){
  /* A plain snapshot, never the live view — pricing a hypothetical must not
     touch the store or notify anybody. */
  var trial = Store.get();
  trial.step = state.step;
  Object.keys(overrides || {}).forEach(function(k){ trial[k] = overrides[k]; });
  return runScenario(scenarioKey || trial.objective, trial);
};
window.blApplyChange = function(overrides){
  /* One write. Every other surface updates through the store subscription. */
  Store.set(overrides || {}, "engine");
  syncFormFromState();
  renderResults();
};
/* blGoToStep is defined once, up in the navigation block — it opens the rail's
   Advanced settings. This second definition used to shadow it. */

/* Runs the plan and renders it. It deliberately does NOT scroll: the caller
   owns where the reader ends up, so two smooth scrolls never fight over the
   same target. */
window.blRunPlan = function(){
  state.started = true;
  renderResults();
};

/* ---------- boot ---------- */
function boot(){
  wireStep1();
  wireAdvanced();
  wireBriefBar();
  renderMatrix();
  renderFaq();
  syncAdvancedLabel();
  /* Show the plan immediately rather than waiting for a button. */
  state.completed = true;
  renderResults();
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();