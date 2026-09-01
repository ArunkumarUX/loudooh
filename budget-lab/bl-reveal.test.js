/* bl-reveal.test.js — plan drawer opens correctly; live updates propagate.
       python3 -m http.server 8901   (from the repo root)
       npm i -D playwright-core && node bl-reveal.test.js */
const {chromium}=require('playwright-core');
const URL = process.env.BL_URL || 'http://localhost:8901/budget-lab/index.html#planner';
(async()=>{
  const b=await chromium.launch(process.env.BL_CHROMIUM?{executablePath:process.env.BL_CHROMIUM}:{});
  const p=await b.newPage({viewport:{width:1440,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
  await p.goto(URL,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(3200);

  console.log('\nPLAN DATA ON LOAD — drawer closed');
  ok(await p.evaluate(()=>!document.getElementById('hl-view-plan-summary')),'View Plan Summary gate is gone');
  ok(await p.evaluate(()=>!document.getElementById('bl-rev')),'no build log on landing');
  const onLoad=await p.evaluate(()=>{
    const html=window.__BL_PLAN_HTML__||'';
    const drawer=document.getElementById('hl-drawer-plan-content');
    return {len:Math.max(html.length, drawer.textContent.length), closed:!document.getElementById('bl-plan-drawer-root').classList.contains('is-open')};
  });
  ok(onLoad.len>2000, `plan populated on load (${onLoad.len} chars)`);
  ok(onLoad.closed,'drawer closed until user opens it');

  console.log('\nREAL-TIME UPDATE');
  const before=await p.evaluate(()=>window.__BL_PLAN_HTML__||document.getElementById('hl-drawer-plan-content').textContent);
  await p.evaluate(()=>document.querySelector('#hl-budget-presets [data-budget="25000"]').click());
  await p.waitForTimeout(900);
  const after=await p.evaluate(()=>window.__BL_PLAN_HTML__||document.getElementById('hl-drawer-plan-content').textContent);
  ok(before!==after,'changing budget updates plan HTML');
  ok(await p.evaluate(()=>{
    const body=document.getElementById('bl-plan-drawer-email-body');
    return body && (body.textContent||'').length>80;
  }), 'email body preview stays in sync');

  console.log('\nGO TO PLAN OPENS DRAWER');
  await p.evaluate(()=>window.BLPlanDrawer.close());
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300);
  await p.evaluate(()=>window.__BL_HERO__.goToPlan());
  await p.waitForTimeout(500);
  ok(await p.evaluate(()=>document.getElementById('bl-plan-drawer-root').classList.contains('is-open')),
     'goToPlan opens the right-side drawer');
  ok(await p.evaluate(()=>{
    const el=document.getElementById('hl-drawer-plan-content');
    return el.getAttribute('aria-live')==='polite';
  }),'drawer plan has aria-live=polite');

  console.log('\nDOWNLOAD USES FINAL PLAN');
  ok(await p.evaluate(()=>typeof window.blDownloadPlan==='function'), 'blDownloadPlan exported');
  ok(await p.evaluate(()=>typeof window.blPlanFullExport==='function'), 'blPlanFullExport exported');
  const exp=await p.evaluate(()=>window.blPlanFullExport(window.__BL_LAST_RESULT__));
  ok(/£25,000|25000/.test(exp),'export reflects current budget');

  ok(errs.length===0,'no JS errors'+(errs.length?': '+errs[0]:''));
  console.log('\n'+(fails?`*** ${fails} FAILED ***`:'*** REVEAL / DRAWER PASSES ***'));
  await b.close();
  process.exit(fails?1:0);
})();
