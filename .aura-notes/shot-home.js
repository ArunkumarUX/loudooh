const {chromium}=require('playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:process.env.PW_CHROME});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
await p.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle',timeout:30000});
await p.waitForTimeout(3500);
await p.screenshot({path:'/tmp/home-full.png',fullPage:true});
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true});
await m.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle',timeout:30000});
await m.waitForTimeout(3000);
await m.screenshot({path:'/tmp/home-mobile.png',fullPage:true});
await b.close();console.log('shots saved');
})();
