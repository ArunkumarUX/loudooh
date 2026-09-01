/* bl-qc-cases.test.js — the spec's §14 QC budgets, driven end to end against
   the rendered page in a real browser.
   Needs a local server and playwright:
       npx serve .. -l 8080      (or: python3 -m http.server 8080 from the repo root)
       npm i -D playwright-core && node bl-qc-cases.test.js
   Checks, for every case: budget reconciles (spend + contingency + unallocated
   never exceeds the budget), no line falls below its minimum buy, London
   Underground never appears outside London, and the mandatory §10 disclosures
   are on the page. Exits non-zero on failure. */
const {chromium}=require('playwright-core');
const URL = process.env.BL_URL || 'http://localhost:8080/budget-lab/index.html#planner';
const CASES=[
  {budget:500,   geo:'regional', days:14},
  {budget:1000,  geo:'regional', days:14},
  {budget:5000,  geo:'london',   days:14},
  {budget:10000, geo:'regional', days:14},
  {budget:10000, geo:'regional', days:28},   // cycle respect
  {budget:50000, geo:'london',   days:14},
  {budget:50000, geo:'regional', days:14},
  {budget:250000,geo:'uk',       days:28},
];
(async()=>{
  const b=await chromium.launch(process.env.BL_CHROMIUM?{executablePath:process.env.BL_CHROMIUM}:{});
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(3500);
  let fails=0;
  console.log('budget    geo        days  outcome');
  console.log('-'.repeat(96));
  for(const c of CASES){
    await p.evaluate(s=>window.BLState.set(s,'qc'),{budget:c.budget,geo:c.geo,durationDays:c.days});
    await p.waitForTimeout(450);
    const r=await p.evaluate(()=>{
      const res=window.blReplan({});
      const txt=document.getElementById('bl-results').textContent.replace(/\s+/g,' ');
      if(res.infeasible) return {infeasible:true, txt};
      return {infeasible:false, sites:res.sites, spend:Math.round(res.spend),
              reserve:Math.round(res.reserve), unalloc:Math.round(res.unallocated),
              lines:res.lines.map(l=>l.qty+'x '+l.f.format+(l.discountRate?' -'+Math.round(l.discountRate*100)+'%':'')),
              cats:res.lines.map(l=>l.f.category),
              minOk:res.lines.every(l=>l.qty>=l.q.minQty),
              exVat:/ex-VAT/.test(txt), avail:/Availability is never guaranteed/.test(txt),
              split:/Production/.test(txt)&&/Installation/.test(txt),
              range:/–/.test(txt),
              /* an ASSERTED reach claim. "not people reached" is the page
                 refusing the claim, which is the opposite of a violation. */
              noReach: !/[\d,]+\s*(people reached|potential reach)/i.test(txt)
                       && !/Potential reach|Avg\.? frequency|OOH impressions/i.test(txt)};
    });
    const tag=`£${c.budget.toLocaleString()}`.padEnd(9)+c.geo.padEnd(10)+String(c.days).padEnd(6);
    if(r.infeasible){
      const named=/smallest realistic buy/.test(r.txt);
      console.log(tag+'INFEASIBLE  '+(named?'names the real minimum buy':'NO MINIMUM STATED'));
      if(!named) fails++;
      continue;
    }
    const budgetOk = r.spend + r.reserve + r.unalloc <= c.budget + 1;
    const luOk = (c.geo==='london'||c.geo==='uk') ? true : !r.cats.includes('London Underground');
    const allOk = budgetOk && luOk && r.minOk && r.exVat && r.avail && r.split && r.range && r.noReach;
    if(!allOk) fails++;
    console.log(tag+(allOk?'OK  ':'FAIL')+`  ${r.sites} sites · £${r.spend.toLocaleString()} + £${r.reserve.toLocaleString()} held + £${r.unalloc.toLocaleString()} free · ${r.lines.join(' + ')}`);
    if(!budgetOk) console.log('        x spend + contingency + unallocated exceeds the budget');
    if(!luOk)     console.log('        x London Underground in a non-London plan');
    if(!r.minOk)  console.log('        x a line is below its minimum buy');
    if(!r.exVat)  console.log('        x ex-VAT not stated');
    if(!r.avail)  console.log('        x availability caveat missing');
    if(!r.split)  console.log('        x media/production split missing');
    if(!r.noReach)console.log('        x a reach claim appeared');
  }
  console.log('\nJS errors during the run:', errs.length?errs.slice(0,3):'none');
  if(errs.length) fails++;
  console.log(fails?`*** ${fails} FAILED ***`:'*** ALL QC CASES PASSED ***');
  await b.close();
  process.exit(fails?1:0);
})();
