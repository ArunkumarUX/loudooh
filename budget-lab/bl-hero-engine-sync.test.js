/* bl-hero-engine-sync.test.js — hero live calculator vs engine summary must agree.
   Run: node bl-hero-engine-sync.test.js
   Uses the same vm harness as bl-calc.test.js; no browser required. */
const fs = require("fs"), vm = require("vm");
const BL = __dirname + "/";
const html = fs.readFileSync(BL + "index.html", "utf8");
const DATA = JSON.parse(html.match(/window\.__BL_DATA__ = (\[.*?\]);<\/script>/s)[1]);

const ctx = {window: {__BL_DATA__: DATA}, console};
ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(BL + "bl-calc.js", "utf8"), ctx);
vm.runInContext(fs.readFileSync(BL + "bl-plan-core.js", "utf8"), ctx);
vm.runInContext(fs.readFileSync(BL + "bl-state.js", "utf8"), ctx);

const C = ctx.window.BLCalc;
const P = ctx.window.BLPlanCore;
const Store = ctx.window.BLState;

const SCENARIOS = {
  reach:     {anchorPct:.68, reinforcePct:.17, effWeight:20, favouredRoles:["reach"],
              weights:{"Billboards":30,"Bus Stops":22,"Rail":18,"Bus":14,"London Underground":12,"Airport":8,"Taxi":6,"Digital AdVans":6}},
  local:     {anchorPct:.62, reinforcePct:.25, effWeight:10, favouredRoles:["local-visibility","local-targeting","proximity"],
              weights:{"Bus Stops":30,"Bus":22,"Billboards":16,"Taxi":14,"Digital AdVans":12,"Rail":8,"London Underground":6,"Airport":4}},
  frequency: {anchorPct:.60, reinforcePct:.25, effWeight:12, favouredRoles:["frequency","commuter-reach"],
              weights:{"Bus":28,"London Underground":26,"Rail":22,"Taxi":16,"Bus Stops":16,"Billboards":10,"Airport":6,"Digital AdVans":4}},
  premium:   {anchorPct:.72, reinforcePct:.14, effWeight:4,  favouredRoles:["stature","premium-audience","dwell"],
              weights:{"Airport":30,"London Underground":24,"Billboards":22,"Rail":14,"Digital AdVans":10,"Taxi":8,"Bus":6,"Bus Stops":6}},
  balanced:  {anchorPct:.52, reinforcePct:.28, effWeight:14, favouredRoles:["reach","frequency"],
              weights:{"Billboards":24,"Bus Stops":22,"Bus":20,"Rail":18,"London Underground":14,"Taxi":12,"Airport":10,"Digital AdVans":10}}
};

function engineObjective(obj){
  if(obj === "launch" || obj === "brand") return "premium";
  if(obj === "footfall") return "local";
  return obj;
}

function heroEstimate(st){
  var opts = P.calcOpts(st);
  var sc = SCENARIOS[engineObjective(st.objective)];
  var plan = C.buildPlan(DATA, opts, sc, function(f, q){
    return P.scoreFormat(f, q, engineObjective(st.objective), st, SCENARIOS);
  });
  if(plan.infeasible) return {infeasible: true};
  return {
    infeasible: false,
    sites: plan.sites,
    spend: st.basis === "media-only" ? plan.media : plan.media + plan.production + plan.installation,
    media: plan.media,
    reserve: plan.reserve,
    planned: plan.planned
  };
}

function engineResult(st){
  var opts = P.calcOpts(st);
  var sc = SCENARIOS[st.objective];
  var plan = C.buildPlan(DATA, opts, sc, function(f, q){
    return P.scoreFormat(f, q, st.objective, st, SCENARIOS);
  });
  if(plan.infeasible) return {infeasible: true};
  var spend = st.basis === "media-only" ? plan.media : plan.media + plan.production + plan.installation;
  return {infeasible: false, sites: plan.sites, spend: spend, media: plan.media, reserve: plan.reserve};
}

const CASES = [
  {budget: 500, geo: "regional", durationDays: 14, objective: "reach"},
  {budget: 1000, geo: "regional", durationDays: 14, objective: "reach"},
  {budget: 5000, geo: "london", durationDays: 14, objective: "local"},
  {budget: 10000, geo: "regional", durationDays: 14, objective: "balanced"},
  {budget: 25000, geo: "london", durationDays: 14, objective: "frequency"},
  {budget: 50000, geo: "london", durationDays: 14, objective: "reach"},
  {budget: 50000, geo: "regional", durationDays: 28, objective: "premium", basis: "media-only"},
  {budget: 100000, geo: "uk", durationDays: 14, objective: "reach", planningMode: "conservative"},
  {budget: 50000, geo: "london", durationDays: 14, objective: "reach", formatPref: "digital"}
];

let fails = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if(!c) fails++; };

console.log("\nHERO vs ENGINE — same store, same numbers");
CASES.forEach(function(c){
  Store.set(Object.assign({basis: "all-in", audience: "broad", formatPref: "none", planningMode: "indicative"}, c), "test");
  var st = Store.get();
  var h = heroEstimate(st);
  var e = engineResult(st);
  var label = "£" + c.budget + " " + c.geo + " " + c.objective;
  if(h.infeasible !== e.infeasible){
    ok(false, label + " feasibility mismatch");
    return;
  }
  if(h.infeasible) { ok(true, label + " both infeasible"); return; }
  ok(h.sites === e.sites, label + " sites match (" + h.sites + ")");
  ok(Math.abs(h.spend - e.spend) < 1, label + " spend match (£" + h.spend + " vs £" + e.spend + ")");
  ok(Math.abs(h.media - e.media) < 1, label + " media match");
  ok(Math.abs(h.reserve - e.reserve) < 1, label + " reserve match");
});

console.log("\n" + (fails ? "*** " + fails + " FAILED ***" : "*** HERO / ENGINE IN SYNC ***"));
process.exit(fails ? 1 : 0);
