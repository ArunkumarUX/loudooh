/* ==========================================================================
   bl-state.js — the Budget Lab's single source of truth.
   --------------------------------------------------------------------------
   There is exactly ONE budget, duration, objective, geography and audience.
   Before this module the live console and the step wizard each kept their own
   state object and talked to each other through four hidden <select> elements
   used as a message bus — which is why they could drift apart, and why the
   same control appeared on the page more than once.

   Everything now reads and writes here. The store also owns the vocabulary:
   the console used to speak in city keys ("manchester") and marketing goals
   ("launch", "footfall"), the wizard in planning terms ("named" + a city name,
   "premium"). Those are reconciled on the way in, so downstream code — and
   bl-calc.js in particular — only ever sees one set of values.
   ========================================================================== */
(function(){
"use strict";

var DEFAULTS = {
  budget: 50000,
  durationDays: 14,
  objective: "reach",          // reach | local | frequency | premium | balanced
  geo: "london",               // london | regional | named | uk
  named: "",                   // city name when geo === "named"
  audience: "broad",
  basis: "all-in",             // all-in | media-only
  formatPref: "none",
  planningMode: "indicative",  // indicative | conservative
  reservePct: null,            // null = use bl-calc's default contingency
  started: false,
  completed: false
};

/* ---------- vocabulary reconciliation ---------- */

/* The console offered city buttons; the planner thinks in bands. A named city
   is priced against regional bands, so the two are the same thing said twice. */
var CITY_KEYS = {
  manchester:"Manchester", birmingham:"Birmingham", leeds:"Leeds",
  glasgow:"Glasgow", liverpool:"Liverpool", bristol:"Bristol",
  edinburgh:"Edinburgh", cardiff:"Cardiff", newcastle:"Newcastle",
  sheffield:"Sheffield", nottingham:"Nottingham", brighton:"Brighton"
};
var GEO_VALUES = {london:1, regional:1, named:1, uk:1};

/* Marketing goals map onto the five planning scenarios the engine scores. */
var OBJECTIVE_MAP = {
  reach:"reach", local:"local", frequency:"frequency",
  premium:"premium", balanced:"balanced",
  launch:"premium", brand:"premium", footfall:"local"
};

/* The console's audience labels map onto the engine's keyword-matched set. */
var AUDIENCE_MAP = {
  broad:"broad", commuters:"commuters", local:"local", retail:"retail",
  urban:"urban", airport:"airport", event:"event", other:"other",
  professionals:"urban", students:"urban", shoppers:"retail", custom:"other"
};

var BASIS = {"all-in":1, "media-only":1};
var MODES = {indicative:1, conservative:1};

var MIN_BUDGET = 500, MAX_BUDGET = 500000;

function clampBudget(n){
  n = Math.round(Number(n));
  if(!isFinite(n)) return undefined;
  return Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, n));
}

/* Expand shorthand into canonical fields BEFORE anything is compared, so that
   set({geo:"manchester"}) becomes {geo:"named", named:"Manchester"}. */
function expand(patch){
  var out = {};
  Object.keys(patch || {}).forEach(function(k){ out[k] = patch[k]; });
  if(typeof out.geo === "string"){
    var g = out.geo.toLowerCase();
    if(CITY_KEYS[g]){
      out.named = out.named || CITY_KEYS[g];
      out.geo = "named";
    } else if(g === "london" || g === "greater london"){
      out.geo = "london"; out.named = "";
    }
  }
  /* Callers that still speak in "days" rather than "durationDays". */
  if(out.days != null && out.durationDays == null) out.durationDays = out.days;
  delete out.days;
  return out;
}

function normalise(key, value){
  switch(key){
    case "budget":       return clampBudget(value);
    case "durationDays": var d = Math.round(Number(value));
                         return isFinite(d) && d > 0 ? d : undefined;
    case "objective":    return OBJECTIVE_MAP[value] || undefined;
    case "geo":          return GEO_VALUES[value] ? value : undefined;
    case "named":        return value == null ? "" : String(value);
    case "audience":     return AUDIENCE_MAP[value] || undefined;
    case "basis":        return BASIS[value] ? value : undefined;
    case "formatPref":   return value == null ? undefined : String(value);
    case "planningMode": return MODES[value] ? value : undefined;
    case "reservePct":   if(value === null) return null;
                         var p = Number(value);
                         return isFinite(p) ? Math.min(0.10, Math.max(0, p)) : undefined;
    case "started":
    case "completed":    return !!value;
    default:             return undefined;
  }
}

var state = {};
Object.keys(DEFAULTS).forEach(function(k){ state[k] = DEFAULTS[k]; });

var subscribers = [];
var notifying = false;

function get(){
  var copy = {};
  Object.keys(state).forEach(function(k){ copy[k] = state[k]; });
  /* Convenience alias for callers that still think in "days". */
  copy.days = state.durationDays;
  return copy;
}

/* Returns a map of what actually changed, or null. `source` lets a subscriber
   skip re-rendering the control the user is currently dragging. */
function set(patch, source){
  var expanded = expand(patch);
  var changed = null;
  Object.keys(expanded).forEach(function(k){
    if(!(k in DEFAULTS)) return;
    var v = normalise(k, expanded[k]);
    if(v === undefined) return;
    if(state[k] === v) return;
    (changed = changed || {})[k] = {from: state[k], to: v};
    state[k] = v;
  });
  /* Leaving a named city clears the city name, so it can't linger. */
  if(changed && changed.geo && state.geo !== "named" && state.named){
    changed.named = {from: state.named, to: ""};
    state.named = "";
  }
  if(!changed) return null;
  if(notifying) return changed;     // no re-entrant storms
  notifying = true;
  var snapshot = get();
  try{
    subscribers.forEach(function(fn){
      try{ fn(snapshot, changed, source); }
      catch(e){ if(window.console && console.warn) console.warn("BLState subscriber failed", e); }
    });
  } finally { notifying = false; }
  return changed;
}

function subscribe(fn){
  if(typeof fn !== "function") return function(){};
  subscribers.push(fn);
  return function(){ subscribers = subscribers.filter(function(x){ return x !== fn; }); };
}

/* A human label for the current geography, used in copy throughout. */
function geoLabel(s){
  s = s || state;
  if(s.geo === "london") return "London";
  if(s.geo === "uk") return "UK-wide";
  if(s.geo === "regional") return "Regional UK";
  return s.named || "Named city";
}

function reset(){ set(DEFAULTS); }

window.BLState = {
  DEFAULTS: DEFAULTS,
  MIN_BUDGET: MIN_BUDGET,
  MAX_BUDGET: MAX_BUDGET,
  CITY_KEYS: CITY_KEYS,
  get: get,
  set: set,
  subscribe: subscribe,
  geoLabel: geoLabel,
  reset: reset
};
})();
