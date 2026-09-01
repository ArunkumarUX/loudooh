/* bl-blueprint.test.js — conformance with the 2026 Master Blueprint and the
   Budget Lab spec, for the things that are checkable without the workbook to
   hand. Run from this folder:  node bl-blueprint.test.js
   Exits non-zero on failure. Pairs with bl-calc.test.js (the maths rules). */
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const engine = fs.readFileSync(__dirname + '/engine.js', 'utf8');
const DATA = JSON.parse(html.match(/window\.__BL_DATA__ = (\[.*?\]);<\/script>/s)[1]);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };
const body = html.replace(/window\.__BL_DATA__ = \[.*?\];/s, '');

console.log('\nDATA LAYER');
ok(DATA.length === 45, DATA.length + ' format records');
ok(DATA.every(d => d.source && d.impactConfidence && d.impactCaveat),
   '§2 every record carries source, confidence and caveat');
ok(DATA.every(d => d.impactsCampaignLow != null && d.impactsCampaignHigh != null),
   '§9 every record carries an impacts RANGE, not a point value');
ok(DATA.filter(d => d.technology === 'DOOH').every(d => !d.production && !d.installation),
   '§14 no DOOH format carries a print or installation cost');
ok(DATA.every(d => d.production != null && d.installation != null),
   '§11 production and installation present on every record');

console.log('\nAEO / SCHEMA  (SEO sprint plan, phases 1-2)');
const ld = [...body.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
  .map(m => { try { return JSON.parse(m[1]); } catch (e) { return null; } });
ok(ld.every(Boolean), 'every ld+json block parses');
const types = ld.filter(Boolean).map(o => o['@type']);
ok(types.includes('WebApplication'), 'WebApplication schema present (phase 1)');
const faqSchema = ld.find(o => o && o['@type'] === 'FAQPage');
ok(!!faqSchema, 'FAQPage schema present (phase 2)');
const faqCount = (engine.match(/\{q:"/g) || []).length;
ok(faqSchema && faqSchema.mainEntity.length === faqCount,
   `schema carries all ${faqCount} Q&As (has ${faqSchema ? faqSchema.mainEntity.length : 0}) — they are JS-injected, so an empty schema means crawlers see none`);
ok(faqSchema && faqSchema.mainEntity.every(q => q.name && q.acceptedAnswer && q.acceptedAnswer.text),
   'every schema Q&A has a question and an answer');
ok(faqSchema && faqSchema.mainEntity.some(q => /impression/i.test(q.name)),
   'the impacts-vs-impressions Q&A is in the schema (blueprint keyword target)');

console.log('\n§9 NO FABRICATED AUDIENCE ANYWHERE');
const jsFiles = fs.readdirSync(__dirname).filter(f => /\.js$/.test(f) && !/\.test\.js$/.test(f));
const banned = [/People reached/i, /Potential reach/i, /Weekly Reach/i, /Avg\.? frequency/i,
                /OOH impressions/i, /Visibility Score/i];
/* A phrase is only a violation when the page ASSERTS it. Two things are not:
   an explanatory comment, and copy that explicitly denies the claim
   ("not people reached", "We do not model reach or frequency"). */
const NEGATED = /\b(no|not|never|without|rather than|instead of|do not|don't|cannot|can't|refus|won't|will not)\b/i;
let hits = [];
jsFiles.concat(['index.html']).forEach(f => {
  let t = fs.readFileSync(__dirname + '/' + f, 'utf8');
  if (f === 'index.html') t = body;
  t = t.replace(/\/\*[\s\S]*?\*\//g, '');            // strip block comments outright
  t.split('\n').forEach((l, i) => {
    if (/^\s*\/\//.test(l)) return;                   // line comments
    banned.forEach(re => {
      if (!re.test(l)) return;
      if (NEGATED.test(l)) return;                     // the page is refusing the claim
      hits.push(f + ':' + (i + 1) + '  ' + l.trim().slice(0, 70));
    });
  });
});
ok(hits.length === 0, 'no un-sourced audience language in any file' + (hits.length ? ' — ' + hits.join(', ') : ''));

console.log('\n§10 MANDATORY DISCLOSURES IN THE SUMMARY');
[['ex-VAT', /ex-VAT/], ['availability caveat', /Availability is never guaranteed/],
 ['contingency', /contingency/i], ['minimum buy', /minimum buy/i],
 ['volume discount bands', /5% at 25–49 units/], ['non-linear long runs', /not extrapolated linearly/],
 ['media/production split', /Media, production and installation are shown separately/],
 ['reach\/frequency refusal', /We do not model reach or frequency/]
].forEach(([label, re]) => ok(re.test(engine), '§10 ' + label + ' stated'));

console.log('\n§12 SCENARIOS');
const scen = (engine.match(/tradeoff:/g) || []).length;
ok(scen === 5, `5 scenarios, each with a stated trade-off (found ${scen})`);
ok(/Alternative|planned differently/i.test(engine), 'alternative scenarios offered for the same budget');

console.log('\nURL ARCHITECTURE  (blueprint phase 3)');
const hubs = ['/budget-lab/billboards/', '/budget-lab/bus-stops/', '/budget-lab/bus/',
              '/budget-lab/london-underground/', '/budget-lab/rail/', '/budget-lab/airport/',
              '/budget-lab/taxi/', '/budget-lab/advan/'];
const linked = hubs.filter(u => html.includes(u));
const exists = hubs.filter(u => fs.existsSync(__dirname + '/' + u.replace('/budget-lab/', '').replace(/\/$/, '')));
console.log(`  NOTE   ${linked.length}/8 format hubs linked · ${exists.length}/8 pages exist`);
ok(linked.length === exists.length,
   'no links point at hub pages that do not exist yet (phase 3 is unstarted, so 0/0 is correct)');

console.log('\n' + (fails ? '*** ' + fails + ' FAILED ***' : '*** ALL CHECKS PASSED ***'));
process.exit(fails ? 1 : 0);
