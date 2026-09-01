/* bl-mobile.test.js — full-screen plan drawer on mobile; email/download after review.
       python3 -m http.server 8901   (from the repo root)
       npm i -D playwright-core && node bl-mobile.test.js */
const {chromium}=require('playwright-core');
const URL = process.env.BL_URL || 'http://localhost:8901/budget-lab/index.html#planner';
(async()=>{
  const b=await chromium.launch(process.env.BL_CHROMIUM?{executablePath:process.env.BL_CHROMIUM}:{});
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fails=0; const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
  await p.goto(URL,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(3500);

  await p.evaluate(()=>window.scrollTo(0,1500)); await p.waitForTimeout(900);
  ok(await p.evaluate(()=>document.body.classList.contains('is-planning')),'scrolling enters explore mode');

  console.log('\nMOBILE DRAWER — full width');
  await p.evaluate(()=>document.getElementById('hl-view-full-summary').click());
  await p.waitForTimeout(500);
  const d=await p.evaluate(()=>{
    const drawer=document.getElementById('bl-plan-drawer');
    const content=document.getElementById('hl-drawer-plan-content');
    const r=drawer.getBoundingClientRect();
    const c=content.getBoundingClientRect();
    return {drawerW:Math.round(r.width), vw:innerWidth, len:content.textContent.length,
            scrollH:content.scrollHeight, h:Math.round(c.height)};
  });
  ok(d.drawerW>=d.vw-4, `drawer is full width (${d.drawerW}px / ${d.vw}px viewport)`);
  ok(d.len>800, `full plan in drawer (${d.len} chars)`);
  ok(d.scrollH>600, `plan scrolls vertically (${d.scrollH}px)`);

  await p.evaluate(()=>{
    const el=document.getElementById('hl-drawer-plan-content');
    if(el) el.scrollTop=el.scrollHeight;
  });
  await p.waitForTimeout(300);
  ok(await p.evaluate(()=>{
    const r=document.getElementById('hl-drawer-plan-content');
    return r.scrollTop>100;
  }),'user can scroll through entire plan');

  console.log('\nMOBILE EMAIL + DOWNLOAD FOOTER');
  const foot=await p.evaluate(()=>{
    const footEl=document.getElementById('bl-plan-drawer-foot');
    const email=document.getElementById('bl-plan-drawer-email-btn');
    const dl=document.getElementById('bl-plan-drawer-download-btn');
    const er=email.getBoundingClientRect();
    const dr=dl.getBoundingClientRect();
    return {stage:footEl.dataset.stage, footCount:document.querySelectorAll('#bl-plan-drawer .bl-plan-drawer-foot').length,
            emailH:Math.round(er.height), dlH:Math.round(dr.height),
            fits:er.width<=innerWidth+1&&dr.width<=innerWidth+1};
  });
  ok(foot.stage==='review','review actions visible before email');
  ok(foot.footCount===1,'single drawer footer on mobile');
  ok(foot.emailH>=44&&foot.dlH>=44,'Email and Download are tap-sized');
  ok(foot.fits,'footer actions fit phone width');

  await p.evaluate(()=>document.getElementById('bl-plan-drawer-email-btn').click());
  await p.waitForTimeout(300);
  const send=await p.evaluate(()=>{
    const btn=document.getElementById('bl-plan-drawer-send-btn');
    const from=document.getElementById('bl-plan-drawer-email-from');
    return {sendH:Math.round(btn.getBoundingClientRect().height), bodyLen:(document.getElementById('bl-plan-drawer-email-body').textContent||'').length,
            fromVisible:from.getBoundingClientRect().width>0};
  });
  ok(send.bodyLen>100,'email preview populated on mobile');
  ok(send.sendH>=44,'Send email is a comfortable tap target');
  ok(send.fromVisible,'From field visible for editing');

  ok(errs.length===0,'no JS errors'+(errs.length?': '+errs[0]:''));
  console.log('\n'+(fails?`*** ${fails} FAILED ***`:'*** MOBILE DRAWER PASSES ***'));
  await b.close(); process.exit(fails?1:0);
})();
