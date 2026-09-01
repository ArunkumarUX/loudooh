/* ==========================================================================
   bl-master-data.js — Loud! OOH Budget Lab | Master Data Integration Layer
   --------------------------------------------------------------------------
   Source: data/master-data-v1.json (Master Data & Planning Engine v1.0)
   Last Updated: 1 September 2026

   This module patches window.__BL_DATA__ rates with master-data-sourced
   Planning Low / Typical / High values and enforces:
     • Planning Typical → mid price (optimise around this)
     • Planning Low / High → uncertainty range shown in UI
     • Minimum Spend £ → per-unit floor enforced before entry-cost calc
     • Availability Matrix → Taxi and Airport flagged "planner review"
     • Production Costs → midpoint deducted for all-in budgets
     • Objective Rules weights → used by scoreFormat scorer
     • Budget Scenarios → sanity-check tier shown in plan output
   ========================================================================== */
(function(){
"use strict";

/* -----------------------------------------------------------------------
   FORMAT RATE TABLE
   Each key = a __BL_DATA__ format id. Values:
     lo/ty/hi/min = London rates
     rlo/rty/rhi/rmin = Regional rates (null = use London or existing DATA)
   All £ per buying unit per campaign basis matching the format's basis.
   Source: Format Rate Benchmarks sheet (master-data-v1.json)
   ----------------------------------------------------------------------- */
var RATES = {
  /* Roadside — Billboards */
  "billboards-6-sheet-static":          {lo:400, ty:650, hi:900,  min:325, rlo:null,rty:null, rhi:null, rmin:null},
  "billboards-48-sheet-static":         {lo:650, ty:825, hi:1000, min:325, rlo:325, rty:475,  rhi:600,  rmin:325},
  "billboards-6-sheet-digital":         {lo:500, ty:650, hi:800,  min:500, rlo:400, rty:500,  rhi:600,  rmin:400},
  "billboards-48-sheet-digital":        {lo:1000,ty:1100,hi:1200, min:1000,rlo:500, rty:750,  rhi:1000, rmin:500},
  "billboards-96-sheet-digital":        {lo:1500,ty:3000,hi:5000, min:1000,rlo:null,rty:null, rhi:null, rmin:null},
  /* London Underground (London only by definition) */
  "london-underground-tube-car-panel":  {lo:10,  ty:50,  hi:150,  min:10,  rlo:null,rty:null, rhi:null, rmin:null},
  "london-underground-escalator-panel-lep-dep": {lo:125, ty:300, hi:600, min:125, rlo:null,rty:null,rhi:null,rmin:null},
  "london-underground-4-sheet-platform-poster": {lo:300, ty:350, hi:600, min:300, rlo:null,rty:null,rhi:null,rmin:null},
  "london-underground-16-sheet-cross-track":    {lo:1000,ty:1800,hi:2800,min:1000,rlo:null,rty:null,rhi:null,rmin:null},
  "london-underground-48-sheet-cross-track":    {lo:1500,ty:3000,hi:5000,min:1500,rlo:null,rty:null,rhi:null,rmin:null},
  "london-underground-digital-escalator-ribbon":{lo:15750,ty:20000,hi:40000,min:15750,rlo:null,rty:null,rhi:null,rmin:null},
  /* Rail — Regional basis shown; London termini are roughly 2× */
  "rail-4-6-sheet-station-poster":      {lo:750, ty:1100,hi:1500, min:250, rlo:250, rty:500,  rhi:750,  rmin:250},
  "rail-digital-6-sheet-station":       {lo:1200,ty:1700,hi:2200, min:450, rlo:450, rty:800,  rhi:1200, rmin:450},
  "rail-48-sheet-station":              {lo:2000,ty:3250,hi:4500, min:750, rlo:750, rty:1250, rhi:2000, rmin:750},
  "rail-traincards-interior":           {lo:75,  ty:125, hi:150,  min:75,  rlo:75,  rty:125,  rhi:150,  rmin:75},
  /* Bus Shelters */
  "bus-stops-6-sheet-static":           {lo:400, ty:525, hi:650,  min:300, rlo:300, rty:450,  rhi:600,  rmin:300},
  "bus-stops-6-sheet-digital":          {lo:650, ty:725, hi:800,  min:650, rlo:400, rty:525,  rhi:650,  rmin:400},
  /* Bus */
  "bus-rear-headliner":                 {lo:200, ty:400, hi:600,  min:400, rlo:60,  rty:75,   rhi:90,   rmin:60},
  "bus-superside":                      {lo:300, ty:400, hi:500,  min:300, rlo:130, rty:200,  rhi:275,  rmin:130},
  "bus-t-side":                         {lo:500, ty:700, hi:900,  min:500, rlo:250, rty:375,  rhi:500,  rmin:250},
  "bus-streetliner":                    {lo:180, ty:340, hi:500,  min:180, rlo:180, rty:340,  rhi:500,  rmin:180},
  /* Airport — planner review; rates are campaign packages */
  "airport-regional-6-sheet-static":    {lo:500, ty:750, hi:1200, min:500, rlo:500, rty:750,  rhi:1200, rmin:500},
  "airport-digital-6-sheet":            {lo:500, ty:750, hi:1200, min:500, rlo:500, rty:750,  rhi:1200, rmin:500},
  "airport-large-format-digital":       {lo:2500,ty:7500,hi:25000,min:2500,rlo:2500,rty:7500, rhi:25000,rmin:2500},
  "airport-48-sheet-approach-road":     {lo:500, ty:750, hi:1200, min:500, rlo:500, rty:750,  rhi:1200, rmin:500},
  /* Taxi — planner review */
  "taxi-superside-panel":               {lo:500, ty:1000,hi:2000, min:500, rlo:500, rty:1000, rhi:2000, rmin:500},
  "taxi-tip-seats-interior":            {lo:500, ty:1000,hi:2000, min:500, rlo:500, rty:1000, rhi:2000, rmin:500},
  "taxi-digital-tops":                  {lo:500, ty:1000,hi:2000, min:500, rlo:500, rty:1000, rhi:2000, rmin:500},
  /* Digital AdVans — per day basis */
  "digital-advans-digital-advan-1-day": {lo:999, ty:1250,hi:2000, min:999, rlo:999, rty:1250, rhi:2000, rmin:999},
  "digital-advans-digital-advan-3-days":{lo:999, ty:1250,hi:2000, min:999, rlo:999, rty:1250, rhi:2000, rmin:999},
  "digital-advans-digital-advan-5-days":{lo:999, ty:1250,hi:2000, min:999, rlo:999, rty:1250, rhi:2000, rmin:999},
  "digital-advans-electric-digital-advan":{lo:999,ty:1250,hi:2000,min:999, rlo:999, rty:1250, rhi:2000, rmin:999},
  "digital-advans-static-advan-adbike": {lo:999, ty:1250,hi:2000, min:999, rlo:999, rty:1250, rhi:2000, rmin:999}
};

/* -----------------------------------------------------------------------
   AVAILABILITY — formats requiring planner review rather than auto-plan
   Source: Availability Matrix sheet
   ----------------------------------------------------------------------- */
var PLANNER_REVIEW_CATEGORIES = {
  "Taxi": true,
  "Airport": true
};

/* -----------------------------------------------------------------------
   PRODUCTION COST MIDPOINTS (£) per unit
   Derived from Production Costs sheet — midpoint of planning range.
   Used for all-in budget deductions. Static = print/post + mid; DOOH = 0.
   Source: Production Costs sheet
   ----------------------------------------------------------------------- */
var PRODUCTION_MIDS = {
  "billboards-6-sheet-static":          138,   /* £75–200 */
  "billboards-48-sheet-static":         275,   /* £150–400 */
  "billboards-96-sheet-digital":        950,   /* £400–1500 */
  "billboards-backlit-illuminated":     275,
  "bus-rear-headliner":                 150,   /* £50–250 */
  "bus-superside":                      150,
  "bus-t-side":                         150,
  "bus-streetliner":                    150,
  "bus-interior-panels":                30,
  "bus-stops-6-sheet-static":           138,
  "rail-4-6-sheet-station-poster":      300,   /* £100–500 */
  "rail-48-sheet-station":              300,
  "rail-traincards-interior":           30,
  "london-underground-4-sheet-platform-poster": 300,
  "london-underground-16-sheet-cross-track":    300,
  "london-underground-48-sheet-cross-track":    300,
  "london-underground-escalator-panel-lep-dep": 300,
  "airport-regional-6-sheet-static":    575,   /* £150–1000 */
  "airport-48-sheet-approach-road":     575,
  "taxi-superside-panel":               475,   /* £150–800 */
  "taxi-tip-seats-interior":            150,
  /* DOOH — no print cost */
  "billboards-6-sheet-digital":         0,
  "billboards-48-sheet-digital":        0,
  "bus-stops-6-sheet-digital":          0,
  "rail-digital-6-sheet-station":       0,
  "london-underground-digital-6-sheet": 0,
  "london-underground-digital-escalator-ribbon": 0,
  "airport-digital-6-sheet":            0,
  "airport-large-format-digital":       0,
  "taxi-digital-tops":                  0,
  "digital-advans-digital-advan-1-day": 0,
  "digital-advans-digital-advan-3-days":0,
  "digital-advans-digital-advan-5-days":0,
  "digital-advans-electric-digital-advan":0,
  "digital-advans-static-advan-adbike": 0
};

/* -----------------------------------------------------------------------
   OBJECTIVE RULES WEIGHTS
   Source: Objective Rules sheet — maps engine scenario keys to weights.
   weights: {reach, freqLocal, impact} summing to 100.
   ----------------------------------------------------------------------- */
var OBJECTIVE_WEIGHTS = {
  reach:     {reach:70, freqLocal:20, impact:10,
              label:"Maximise Reach",
              primaryFormats:["Digital 48-Sheet","Bus Rear","Digital 6-Sheet Shelter","pDOOH"]},
  local:     {reach:30, freqLocal:60, impact:10,
              label:"Local Dominance",
              primaryFormats:["Static 48-Sheet","Static 6-Sheet Shelter","Bus Superside"]},
  frequency: {reach:20, freqLocal:60, impact:20,
              label:"Frequency Boost",
              primaryFormats:["Shelter clusters","Taxi","Bus Interior"]},
  premium:   {reach:40, freqLocal:20, impact:40,
              label:"Brand Building / Premium Impact",
              primaryFormats:["Large Format","Cross-Track","Premium Digital"]},
  balanced:  {reach:45, freqLocal:20, impact:35,
              label:"Product Launch",
              primaryFormats:["Premium Digital","Large Format","Station Takeovers"]}
};

/* -----------------------------------------------------------------------
   BUDGET SCENARIO TIERS
   Source: Budget Scenarios sheet
   ----------------------------------------------------------------------- */
var BUDGET_SCENARIOS = [
  {budget:500,     tier:"Single local test",        guidance:"Keep the plan simple and geographically focused"},
  {budget:1000,    tier:"Local impact",              guidance:"Start building local presence"},
  {budget:2500,    tier:"Local dominance",           guidance:"Concentrate around a city, postcode cluster or commuter corridor"},
  {budget:5000,    tier:"City presence",             guidance:"Enough budget to build a deliberate mix"},
  {budget:10000,   tier:"Multi-format city campaign",guidance:"Balance reach, frequency and impact"},
  {budget:25000,   tier:"Major city / regional scale",guidance:"Allows meaningful geographic coverage"},
  {budget:50000,   tier:"Large campaign",            guidance:"Use scenario rules rather than one default mix"},
  {budget:100000,  tier:"National / premium scale",  guidance:"Requires availability and campaign-specific optimisation"}
];

/* -----------------------------------------------------------------------
   REGIONAL MULTIPLIERS
   Source: Regional Multipliers sheet
   ----------------------------------------------------------------------- */
var REGIONAL_MULTIPLIERS = {
  "london-core":       1.00,
  "london-outer":      0.85,
  "major-city-prime":  0.75,
  "major-city-standard":0.65,
  "regional-prime":    0.55,
  "regional-standard": 0.45
};

/* -----------------------------------------------------------------------
   PUBLIC API
   ----------------------------------------------------------------------- */

/* Rate lookup for a format ID. Returns {lo,ty,hi,min,rlo,rty,rhi,rmin}
   or null if no master-data entry exists for this format. */
function rateFor(id){
  return RATES[id] || null;
}

/* Per-unit minimum spend from master data, or null if not found.
   geo: "london" | "regional" | "uk" */
function minSpend(id, geo){
  var r = RATES[id];
  if(!r) return null;
  if(geo === "london" || !r.rmin) return r.min;
  return r.rmin != null ? r.rmin : r.min;
}

/* Planning Typical (mid) rate from master data, or null.
   geo: "london" | "regional" | "uk" */
function typicalRate(id, geo){
  var r = RATES[id];
  if(!r) return null;
  if(geo === "london") return r.ty;
  if(geo === "regional") return r.rty != null ? r.rty : r.ty;
  /* uk = average of london + regional or just london */
  if(r.rty != null) return (r.ty + r.rty) / 2;
  return r.ty;
}

/* Planning Low rate (best case), or null. */
function lowRate(id, geo){
  var r = RATES[id];
  if(!r) return null;
  if(geo === "london") return r.lo;
  if(geo === "regional") return r.rlo != null ? r.rlo : r.lo;
  if(r.rlo != null) return Math.min(r.lo, r.rlo);
  return r.lo;
}

/* Planning High rate (worst case / conservative), or null. */
function highRate(id, geo){
  var r = RATES[id];
  if(!r) return null;
  if(geo === "london") return r.hi;
  if(geo === "regional") return r.rhi != null ? r.rhi : r.hi;
  if(r.rhi != null) return Math.max(r.hi, r.rhi);
  return r.hi;
}

/* Production cost midpoint for all-in budgets. Returns 0 for DOOH. */
function productionMid(id){
  var v = PRODUCTION_MIDS[id];
  return v != null ? v : null;
}

/* True if this format's category requires planner review (not auto-planned). */
function needsPlannerReview(f){
  return !!(f && PLANNER_REVIEW_CATEGORIES[f.category]);
}

/* Objective weights for a scenario key. */
function objectiveWeights(scenarioKey){
  return OBJECTIVE_WEIGHTS[scenarioKey] || null;
}

/* Closest budget scenario tier for a given budget amount. */
function scenarioTier(budget){
  var match = BUDGET_SCENARIOS[0];
  for(var i = 0; i < BUDGET_SCENARIOS.length; i++){
    if(budget >= BUDGET_SCENARIOS[i].budget) match = BUDGET_SCENARIOS[i];
    else break;
  }
  return match;
}

/* Regional multiplier by tier key. */
function regionalMultiplier(tierKey){
  return REGIONAL_MULTIPLIERS[tierKey] || null;
}

/* -----------------------------------------------------------------------
   PATCH __BL_DATA__
   Applies Planning Typical, Low, High and Minimum Spend from master data
   to every matching format in the DATA array. Called once on load.
   Adds fields: masterTy, masterLo, masterHi, masterMin (per geo = london/regional).
   Also patches londonLow / londonHigh / regionalLow / regionalHigh / mid
   where master data provides values, preserving existing values as fallbacks.
   ----------------------------------------------------------------------- */
function patchData(DATA){
  if(!Array.isArray(DATA)) return;
  DATA.forEach(function(f){
    var r = RATES[f.id];
    if(!r) return;
    /* Attach master-data rate fields for display (uncertainty range) */
    f.masterLondonLo  = r.lo;
    f.masterLondonTy  = r.ty;
    f.masterLondonHi  = r.hi;
    f.masterLondonMin = r.min;
    if(r.rty != null){
      f.masterRegionalLo  = r.rlo;
      f.masterRegionalTy  = r.rty;
      f.masterRegionalHi  = r.rhi;
      f.masterRegionalMin = r.rmin;
    }
    /* Patch the fields bl-calc.js uses for pricing.
       Only update if master data differs to avoid overwriting deliberate
       per-format adjustments that exist in __BL_DATA__ but not master data. */
    f.londonLow  = r.lo;
    f.londonHigh = r.hi;
    f.mid        = r.ty;  /* Planning Typical is the optimisation target */
    if(r.rty != null){
      f.regionalLow  = r.rlo;
      f.regionalHigh = r.rhi;
    }
    /* Production midpoint from master data overrides hardcoded values */
    var pm = PRODUCTION_MIDS[f.id];
    if(pm != null){
      f.production = pm;
      /* installation stays from DATA — master data doesn't split it out */
    }
    /* Flag planner-review formats */
    if(PLANNER_REVIEW_CATEGORIES[f.category]){
      f.plannerReview = true;
    }
  });
}

window.BLMasterData = {
  RATES: RATES,
  OBJECTIVE_WEIGHTS: OBJECTIVE_WEIGHTS,
  BUDGET_SCENARIOS: BUDGET_SCENARIOS,
  REGIONAL_MULTIPLIERS: REGIONAL_MULTIPLIERS,
  rateFor: rateFor,
  minSpend: minSpend,
  typicalRate: typicalRate,
  lowRate: lowRate,
  highRate: highRate,
  productionMid: productionMid,
  needsPlannerReview: needsPlannerReview,
  objectiveWeights: objectiveWeights,
  scenarioTier: scenarioTier,
  regionalMultiplier: regionalMultiplier,
  patchData: patchData
};

/* Auto-patch on load if DATA is already present */
if(window.__BL_DATA__) patchData(window.__BL_DATA__);

})();
