# Budget Lab code map (~/loudooh/budget-lab) — verified 2026-09-20

## Key symbols (grep-verified line numbers)
- bl-plan-core.js: `scoreFormat(f,q,scenarioKey,state,scenarios)` @67; module exports @100. This is the scoring heart (point 2).
- engine.js (~72KB): SCENARIOS config @8-24 (reach/local/frequency/premium/balanced, effWeight, anchorPct, tradeoff copy); ALT_MAP @25 (alternative scenarios per objective, point 5); PREFS @39; FAQ content @55-80 (includes impacts-vs-impressions Q&A, point 3 source material); `scoreCandidate` @99 -> P.scoreFormat; `runScenario` @111; result mapping @163-167 (audienceLow/High, confidence, cpm); `actionPanelMarkup(result)` @370-427 ("Recommended next steps", point 7 hook); `wireActionPanel` @435; `renderResults` @499; plan narrative/reasoning block @534-591 ("the reasoning, given weight"); `f.whyRecommend || f.strength` rendered @604 (point 4); statCard "Per 1,000 impacts" @585; "Indicative total campaign impacts" caption @639.
- bl-lab-explore.js (~31KB): opportunity cards rendering @140-330 (point 1 detail lives here too).
- bl-panel.js (~20KB): results panel @150-420.
- bl-plan-drawer.js / bl-plan-drawer.css: plan drawer (point 5 comparison, point 6 polish).
- bl-plan-pdf.js (~11KB) / bl-plan-pdf.css: shareable PDF output (point 6).
- bl-brand.css: brand tokens (point 6).
- data/master-data-v1.json (34KB) + bl-master-data.js: format rate benchmarks (44 records currently).
- index.html (budget-lab's own, ~119KB): landing + mock preview blocks; "Potential reach" label @176.

## Baseline test status at HEAD (143d1ae) — 6 pass / 2 fail BEFORE any changes
- bl-blueprint.test.js: 4 FAILs — (a) "44 format records", (b) schema carries 0 of 20 Q&As (JS-injected; crawlers see none), (c) impacts-vs-impressions Q&A missing from schema, (d) un-sourced audience language: index.html:176 "Potential reach".
- bl-calc.test.js: 3 FAILs — (a) expects 45 records (has 44), (b) "Airport Regional 6-Sheet realigned to the xlsx", (c) "Electric Digital AdVan added".
These failures point at: add Electric Digital AdVan record + realign Airport Regional 6-Sheet in master data (matches xlsx rate card in ~/loudooh/uploads/LoudOOH RateCard Airport Taxi Rail AdVans.pdf), inject the 20 Q&As into static JSON-LD, and fix "Potential reach" wording. Fixing them is IN SCOPE (they align with 7-point items 2 and 3).

## Reference docs
- Master spec: ~/Desktop/Sorted_Files/Other_Docs/OOH_Budget_Lab_Master_Build_Guide_2026.pdf
- Rate card: ~/loudooh/uploads/LoudOOH RateCard Airport Taxi Rail AdVans.pdf, ~/loudooh/uploads/ratecard2.pdf

## Link targets for point 7 (verified to exist)
- Case study: /insights/leeds-billboard-costtransparency-campaign/ (York Street Leeds)
- AdVans: /insights/advan-mobile-billboards/
- Underground: /insights/london-underground-advertising-costs-uk/
- Channel comparison: /insights/ooh-channel-comparison/
- Pricing: /insights/pricing/
- Insights hub: /insights/
- Snapchat AdVans + Flood Re: NO dedicated pages in repo; insights/index.html mentions Snapchat (lines 65, 188). Use /insights/advan-mobile-billboards/ as closest target; do not invent URLs.

## House rules (from client briefs)
- British English. NO em dashes in new copy. Correct OOH terminology: impacts = OTS (Route-measured where available), reach = unique individuals, frequency = impacts / reach. Never "impressions" for OOH.
- Run tests: `cd ~/loudooh/budget-lab && node --test bl-*.test.js` (~12s).
