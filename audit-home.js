const {chromium}=require('playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:process.env.PW_CHROME});const p=await b.newPage();
await p.route('**://unpkg.com/**',r=>r.abort());
await p.route('**typekit.net**',r=>r.abort());
await p.route('**googletagmanager.com**',r=>r.abort());
await p.route('**linkedin.com**',r=>r.abort());
await p.route('**facebook.com**',r=>r.abort());
await p.goto('http://127.0.0.1:8766/',{waitUntil:'domcontentloaded',timeout:20000});
await p.waitForTimeout(6000);
const out=await p.evaluate(()=>{
  const res={};
  const ids=['home-banner','lo-intro','lo-what-we-do','services','lo-trust','lo-testimonials','lo-process','lo-press','lo-pricing','lo-budget-promo','lo-difference','lo-final-cta','lo-footer'];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    if(el){
      let t=el.innerText.replace(/\n{2,}/g,'\n').trim();
      res[id]=t.slice(0,900);
      res[id+'__links']=[...el.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter((v,i,arr)=>arr.indexOf(v)===i).slice(0,25);
    } else res[id]='MISSING';
  });
  return res;
});
require('fs').writeFileSync('/tmp/audit-sections.json',JSON.stringify(out,null,1));
await b.close();
console.log('saved');
})();
