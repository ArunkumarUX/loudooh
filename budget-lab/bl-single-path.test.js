/* bl-single-path.test.js — one plan, one path via the right-side drawer.
   Guards: drawer opens from Review plan CTA, email/download come after review,
   no duplicate email forms. Needs a local server and playwright:
       python3 -m http.server 8901   (from the repo root)
       npm i -D playwright-core && node bl-single-path.test.js
   Set BL_URL / BL_CHROMIUM to override. Exits non-zero on failure. */
const {chromium}=require('playwright-core');
const URL = process.env.BL_URL || 'http://localhost:8901/budget-lab/index.html#planner';
(async()=>{
  const b=await chromium.launch(process.env.BL_CHROMIUM?{executablePath:process.env.BL_CHROMIUM}:{});
  const p=await b.newPage({viewport:{width:1440,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
  await p.goto(URL,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(3200);

  console.log('\nDRAWER WORKFLOW MARKUP');
  const d=await p.evaluate(()=>({
    drawer:!!document.getElementById('bl-plan-drawer-root'),
    viewFull:!!document.getElementById('hl-view-full-summary'),
    drawerContent:!!document.getElementById('hl-drawer-plan-content'),
    emailStage:!!document.getElementById('bl-plan-drawer-stage-email'),
    emailForms:document.querySelectorAll('form.bl-ai-lead, #bl-lai-form').length,
    inlinePlan:!!document.getElementById('hl-inline-plan-summary'),
    viewSummaryGate:!!document.getElementById('hl-view-plan-summary'),
    overlay:!!document.getElementById('bl-lai-stage')
  }));
  ok(d.drawer,'right-side plan drawer exists');
  ok(!await p.evaluate(()=>!!document.getElementById('planner')),'inline planner section removed');
  ok(await p.evaluate(()=>{
    const sink=document.getElementById('bl-results-sink');
    return sink && getComputedStyle(sink).clip !== 'auto' || sink.classList.contains('visually-hidden');
  }),'plan render sink is visually hidden');
  ok(d.viewFull,'Review plan and email CTA exists');
  ok(d.drawerContent,'drawer plan content container exists');
  ok(d.emailStage,'email preview stage exists in drawer');
  ok(d.emailForms===0,'legacy duplicate email form is gone');
  ok(!d.inlinePlan,'inline plan summary panel is removed');
  ok(!d.viewSummaryGate,'old "View Plan Summary" gate is gone');
  ok(!d.overlay,'report overlay is gone');

  console.log('\nREVIEW PLAN CTA OPENS DRAWER');
  ok(await p.evaluate(()=>!document.getElementById('bl-plan-drawer-root').classList.contains('is-open')),
     'drawer closed on load');
  await p.evaluate(()=>document.getElementById('hl-view-full-summary').click());
  await p.waitForTimeout(400);
  const open=await p.evaluate(()=>{
    const root=document.getElementById('bl-plan-drawer-root');
    const content=document.getElementById('hl-drawer-plan-content');
    const r=content.getBoundingClientRect();
    return {open:root.classList.contains('is-open'), len:content.textContent.length,
            h:Math.round(r.height), scrollH:content.scrollHeight,
            reviewVisible:!document.getElementById('bl-plan-drawer-stage-email').hidden===false
              || document.getElementById('bl-plan-drawer-stage-review').classList.contains('is-active')};
  });
  ok(open.open,'drawer opens on Review plan and email');
  ok(open.len>2000,'drawer shows full plan ('+open.len+' chars)');
  ok(open.scrollH>600,'drawer content is scrollable ('+open.scrollH+'px)');

  console.log('\nEMAIL AFTER REVIEW — not immediate send');
  ok(await p.evaluate(()=>document.getElementById('bl-plan-drawer-foot').dataset.stage==='review'),
     'review actions shown first (Email + Download)');
  ok(await p.evaluate(()=>document.getElementById('bl-plan-drawer-send-btn').hidden===true),
     'Send hidden until email stage');
  await p.evaluate(()=>document.getElementById('bl-plan-drawer-email-btn').click());
  await p.waitForTimeout(300);
  const email=await p.evaluate(()=>({
    body:(document.getElementById('bl-plan-drawer-email-body').textContent||'').length,
    subject:(document.getElementById('bl-plan-drawer-email-subject').value||'').length,
    sendVisible:!document.getElementById('bl-plan-drawer-send-btn').hidden,
    footCount:document.querySelectorAll('#bl-plan-drawer .bl-plan-drawer-foot').length
  }));
  ok(email.body>200,'email body preview populated');
  ok(email.subject>10,'email subject populated');
  ok(email.sendVisible,'Send email action appears after email preview step');
  ok(email.footCount===1,'exactly one drawer footer');

  console.log('\nBUDGET CONSISTENCY — calculator = drawer = export');
  const bud=await p.evaluate(()=>{
    const budget=window.BLState.get().budget;
    const gbp=window.blGbp(budget);
    const drawer=document.getElementById('hl-drawer-plan-content').textContent;
    const exportTxt=window.blPlanFullExport(window.__BL_LAST_RESULT__);
    const kpi=document.getElementById('hl-budget-out')?.textContent||'';
    return {gbp, inDrawer:drawer.indexOf(gbp)>-1, inExport:exportTxt.indexOf(gbp)>-1, kpiMatch:kpi.indexOf(String(budget).slice(0,2))>-1||kpi===gbp};
  });
  ok(bud.inDrawer,'drawer plan shows same budget as store ('+bud.gbp+')');
  ok(bud.inExport,'export uses same budget ('+bud.gbp+')');

  console.log('\nACTION PANEL CTA OPENS DRAWER EMAIL');
  await p.evaluate(()=>window.BLPlanDrawer.close());
  await p.waitForTimeout(200);
  const cta=await p.evaluate(()=>{
    const a=document.querySelector('.bl-act-cta[href="#bl-plan-email"]');
    return a?{href:a.getAttribute('href'),text:a.textContent.replace('→','').trim()}:null;
  });
  ok(!!cta,'action panel offers email link: "'+(cta?cta.text+'" → '+cta.href:'none')+'"');
  if(cta){
    await p.evaluate(()=>document.querySelector('.bl-act-cta[href="#bl-plan-email"]').click());
    await p.waitForTimeout(400);
    ok(await p.evaluate(()=>document.getElementById('bl-plan-drawer-root').classList.contains('is-open')),
       'email link opens drawer');
    ok(await p.evaluate(()=>document.getElementById('bl-plan-drawer-stage-email').classList.contains('is-active')),
       'email link lands on email preview stage');
  }

  ok(errs.length===0,'no JS errors'+(errs.length?': '+errs[0]:''));
  console.log('\n'+(fails?`*** ${fails} FAILED ***`:'*** ONE PLAN, DRAWER PATH ***'));
  await b.close();
  process.exit(fails?1:0);
})();
