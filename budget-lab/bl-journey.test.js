/* bl-journey.test.js — complete user journey with right-side plan drawer.
       python3 -m http.server 8901   (from the repo root)
       npm i -D playwright-core && node bl-journey.test.js */
const {chromium}=require('playwright-core');
const URL = process.env.BL_URL || 'http://localhost:8901/budget-lab/index.html#planner';
(async()=>{
  const b=await chromium.launch(process.env.BL_CHROMIUM?{executablePath:process.env.BL_CHROMIUM}:{});
  const p=await b.newPage({viewport:{width:1440,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
  const st=()=>p.evaluate(()=>window.BLState.get());
  const drawerPlan=()=>p.evaluate(()=>{
    const e=document.getElementById('hl-drawer-plan-content');
    return {len:e.textContent.length, html:window.__BL_PLAN_HTML__||''};
  });

  await p.goto(URL,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(3200);

  console.log('\n1. LAND — plan data exists before opening drawer');
  let s=await drawerPlan();
  ok(s.len>2000 || s.html.length>2000, `plan HTML rendered (${Math.max(s.len,s.html.length)} chars)`);

  console.log('\n2. CHANGE A CONTROL — plan follows');
  const before=await p.evaluate(()=>window.blReplan({}).sites);
  await p.evaluate(()=>document.querySelector('#hl-budget-presets [data-budget="25000"]').click());
  await p.waitForTimeout(900);
  const after=await p.evaluate(()=>window.blReplan({}).sites);
  ok((await st()).budget===25000, 'preset writes to store');
  ok(after!==before, `plan changed: ${before} sites -> ${after} sites`);
  ok(await p.evaluate(()=>(window.__BL_PLAN_HTML__||'').includes('25,000')||(window.__BL_PLAN_HTML__||'').includes('25000')),
     'plan HTML updates with new budget');

  console.log('\n3. VIEW FULL SUMMARY — right-side drawer');
  await p.evaluate(()=>document.getElementById('hl-view-full-summary').click());
  await p.waitForTimeout(500);
  s=await p.evaluate(()=>{
    const root=document.getElementById('bl-plan-drawer-root');
    const e=document.getElementById('hl-drawer-plan-content');
    const r=e.getBoundingClientRect();
    return {open:root.classList.contains('is-open'), len:e.textContent.length,
            inView:r.width>300&&r.height>200, hasBudget:/£25,000|25000/.test(e.textContent)};
  });
  ok(s.open && s.len>800, `drawer open with full plan (${s.len} chars)`);
  ok(s.hasBudget,'drawer shows updated £25,000 budget');

  console.log('\n4. NEXT MOVES — preview, then apply (inside drawer)');
  const act=await p.evaluate(()=>{const c=document.querySelector('#hl-drawer-plan-content .bl-act-cta[data-act]');
    return c?{text:c.textContent.replace('→','').trim(), i:c.dataset.act}:null;});
  ok(!!act, 'action offered in drawer: "'+(act?act.text:'none')+'"');
  if(act){
    await p.evaluate(i=>document.querySelector('#hl-drawer-plan-content .bl-act-cta[data-act="'+i+'"]').click(), act.i);
    await p.waitForTimeout(500);
    const prev=await p.evaluate(i=>{const el=document.getElementById('bl-act-prev-'+i);
      return {open:!el.hidden, rows:el.querySelectorAll('.bl-act-delta > div').length};}, act.i);
    ok(prev.open && prev.rows>0, `preview opens with ${prev.rows} rows`);
    const b0=JSON.stringify(await st());
    await p.evaluate(i=>document.querySelector('#hl-drawer-plan-content .bl-act-apply[data-act="'+i+'"]').click(), act.i);
    await p.waitForTimeout(1200);
    ok(JSON.stringify(await st())!==b0, 'apply changes plan');
    ok(await p.evaluate(()=>document.getElementById('bl-plan-drawer-root').classList.contains('is-open')),
       'drawer stays open after apply');
  }

  console.log('\n5. ADVANCED SETTINGS');
  await p.evaluate(()=>document.getElementById('hl-view-full-summary').click());
  await p.waitForTimeout(400);
  ok(await p.evaluate(()=>{
    const btn=document.getElementById('bl-cta-refine');
    return btn && btn.closest('#bl-plan-drawer-foot') && !btn.hidden;
  }),'Refine plan lives in drawer footer');
  await p.evaluate(()=>document.getElementById('bl-cta-refine').click());
  await p.waitForTimeout(1400);
  const adv=await p.evaluate(()=>{const a=document.getElementById('hl-advanced');
    const r=a.getBoundingClientRect(); return {open:a.open, inView:r.top<innerHeight&&r.bottom>0};});
  ok(adv.open, 'advanced disclosure opens');

  console.log('\n6. ALTERNATIVE SCENARIO');
  await p.evaluate(()=>document.getElementById('hl-view-full-summary').click());
  await p.waitForTimeout(400);
  const alt=await p.evaluate(()=>{const a=document.querySelector('#hl-drawer-plan-content .bl-sum-alt[data-alt]');return a?a.dataset.alt:null;});
  ok(!!alt, 'alternative offered: '+alt);
  if(alt){
    await p.evaluate(k=>document.querySelector('#hl-drawer-plan-content .bl-sum-alt[data-alt="'+k+'"]').click(), alt);
    await p.waitForTimeout(1200);
    ok((await st()).objective===alt, 'alternative switches objective to '+alt);
    ok(await p.evaluate(()=>/£/.test(document.getElementById('hl-drawer-plan-content').textContent)), 'drawer re-renders');
  }

  console.log('\nJS errors:', errs.length?errs.slice(0,3):'none');
  if(errs.length) fails++;
  console.log('\n'+(fails?`*** ${fails} FAILED ***`:'*** WHOLE JOURNEY PASSES ***'));
  await b.close();
  process.exit(fails?1:0);
})();
