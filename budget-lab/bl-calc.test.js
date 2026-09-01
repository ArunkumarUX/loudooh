/* bl-calc.test.js — spec conformance checks for the Budget Lab calculation layer.
   Run from this folder with:  node bl-calc.test.js
   Exits non-zero on any failure, so it can go straight into CI.
   Covers: §7 non-linear long cycles, §9 impacts-only audience, §10 cycle
   respect / geography / minimum buy / volume discount / reserve / exclusion
   disclosure, §14 QC budgets, and the pricing matrix vs the 2026 blueprint. */
const fs=require('fs'),vm=require('vm');
const BL=__dirname+'/';
const html=fs.readFileSync(BL+'index.html','utf8');
const DATA=JSON.parse(html.match(/window\.__BL_DATA__ = (\[.*?\]);<\/script>/s)[1]);
const ctx={window:{__BL_DATA__:DATA},console};ctx.window.window=ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(BL+'bl-calc.js','utf8'),ctx);
const C=ctx.window.BLCalc;
let fails=0;
const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++;};
const f=id=>DATA.find(x=>x.id===id);
const O=(o)=>Object.assign({geo:'regional',named:'',days:14,mode:'mid',includeProduction:true,budget:50000},o);

console.log('\n§10 CYCLE RESPECT');
const bs=f('billboards-6-sheet-static');
ok(C.cycles(bs,14)===1,'2-week basis, 14 days = 1 cycle');
ok(C.cycles(bs,28)===2,'2-week basis, 28 days = 2 cycles (not pro-rata)');
ok(C.cycles(bs,15)===2,'15 days rounds UP to 2 cycles');
ok(C.quote(bs,O({days:28})).mediaUnit===450*2,'28d media = 2 x regional mid (450 -> 900)');

console.log('\n§7 TAXI NOT EXTRAPOLATED LINEARLY');
const tx=f('taxi-superside-panel');
const t1=C.cycleFactor(tx,28),t2=C.cycleFactor(tx,56),t3=C.cycleFactor(tx,84);
ok(t1.factor===1&&!t1.tapered,'taxi 1 cycle = factor 1, no taper flag');
ok(t2.cycles===2&&t2.factor===1.9&&t2.tapered,'taxi 2 cycles = factor 1.9, flagged (not 2.0)');
ok(t3.factor===2.8,'taxi 3 cycles = factor 2.8 (not 3.0)');
ok(C.quote(tx,O({days:56})).taperNote!==null,'taper carries an explanatory note');
ok(!C.cycleFactor(bs,28).tapered,'2-week formats still multiply linearly');

console.log('\n§10 GEOGRAPHY ENFORCED');
const lu=f('london-underground-4-sheet-platform-poster');
ok(C.isGeoEligible(lu,'london')===true,'LU allowed in London');
ok(C.isGeoEligible(lu,'regional')===false,'LU BLOCKED for Regional UK');
ok(C.isGeoEligible(lu,'named','Manchester')===false,'LU BLOCKED for Manchester');
ok(C.isGeoEligible(lu,'named','London')===true,'LU allowed for named London');
ok(C.isGeoEligible(lu,'uk')===true,'LU allowed on a UK-wide plan');
ok(C.quote(lu,O({geo:'regional'}))===null,'LU cannot even be quoted regionally');
ok(C.quote(bs,O({geo:'london'})).mediaUnit===650,'London geo uses London band (400-900 -> 650)');
ok(C.quote(bs,O({geo:'regional'})).mediaUnit===450,'Regional geo uses regional band (300-600 -> 450)');
ok(C.quote(bs,O({geo:'london'})).mediaUnit!==C.quote(bs,O({geo:'regional'})).mediaUnit,'geography actually changes the price');

console.log('\n§10 VOLUME DISCOUNT BANDS');
ok(C.volumeDiscountRate(24)===0,'24 units = no discount');
ok(C.volumeDiscountRate(25)===0.05,'25 units = 5%');
ok(C.volumeDiscountRate(49)===0.05,'49 units = 5%');
ok(C.volumeDiscountRate(50)===0.10,'50 units = 10%');
ok(C.volumeDiscountRate(99)===0.10,'99 units = 10%');
ok(C.volumeDiscountRate(100)===0.15,'100 units = 15%');
const q=C.quote(bs,O()),L=C.line(q,50,O());
ok(Math.abs(L.media-(450*50*0.9))<0.01,'50 panels: media discounted 10%');
ok(L.production===bs.production*50,'production NOT discounted');
ok(L.installation===bs.installation*50,'installation NOT discounted');

console.log('\n§10 MINIMUM BUY');
ok(C.minimumBuy(f('bus-rear-headliner'))===10,'bus rear minimum = 10');
ok(C.minimumBuy(f('london-underground-tube-car-panel'))===250,'tube car panel minimum = 250');
const qb=C.quote(f('bus-rear-headliner'),O({budget:500}));
ok(qb.entryCost>500,'a GBP500 budget cannot reach the bus-rear minimum ('+Math.round(qb.entryCost)+')');
ok(C.maxAffordableQty(qb,500,O())===0,'so it returns 0 units, not 2');

console.log('\n§10 RESERVE');
ok(C.reserveFor(50000)===2500,'5% of GBP50,000 = GBP2,500 held back');
ok(C.usableBudget(50000)===47500,'usable = GBP47,500');
ok(C.reserveFor(50000,0.5)===5000,'reserve is capped at 10%');

console.log('\n§9 NO FABRICATED REACH OR FREQUENCY');
ok(typeof C.reach==='undefined','module exposes no reach()');
ok(typeof C.frequency==='undefined','module exposes no frequency()');
const ir=C.impactsRange([C.line(q,10,O())]);
ok(ir.low<ir.high,'impacts come back as a RANGE');
ok(ir.confidence!=null,'confidence is carried through');
ok(!fs.readFileSync(BL+'bl-calc.js','utf8').match(/\/\s*(sc\.)?freq/),'no divisor-based frequency anywhere in the module');

console.log('\n§14 QC BUDGETS (Regional UK, 14 days, ex-VAT)');
[500,1000,10000,50000].forEach(b=>{
  const o=O({budget:b});
  const buyable=DATA.map(x=>({f:x,q:C.quote(x,o)})).filter(c=>c.q&&c.q.entryCost<=b);
  console.log('  GBP'+b+': '+buyable.length+' formats reachable at minimum buy'+
    (buyable.length?' | cheapest: '+buyable.sort((a,c)=>a.q.entryCost-c.q.entryCost)[0].f.format:''));
});

console.log('\n§10 EXCLUSION DISCLOSURE');
const ex=C.exclusions(DATA,O({geo:'regional',budget:10000}));
ok(ex.length>0,'exclusions are reported ('+ex.length+' for a GBP10k regional brief)');
ok(ex.every(x=>x.reason&&x.reason.length>20),'every exclusion states a reason');
ok(ex.filter(x=>x.alternative).length>=ex.length-1,'exclusions name a closest alternative');
ok(ex.some(x=>/London Underground inventory only exists/.test(x.reason)),'LU excluded on geography grounds');
ok(ex.some(x=>/Priced on application/.test(x.reason)),'POA convoy excluded and explained');
ok(ex.some(x=>/commitment rather than in repeatable cycles/.test(x.reason)),'campaign/annual basis excluded and explained');

console.log('\nDATA vs BLUEPRINT');
ok(DATA.length===45,'45 records ('+DATA.length+')');
const ap=f('airport-regional-6-sheet-static');
ok(ap.regionalLow===500&&ap.regionalHigh===1000&&ap.mid===1500,'Airport Regional 6-Sheet realigned to the xlsx');
ok(!!f('digital-advans-electric-digital-advan'),'Electric Digital AdVan added');
ok(DATA.every(x=>x.source&&x.impactConfidence&&x.impactCaveat),'every record still carries source + confidence + caveat');

console.log('\n'+(fails?'*** '+fails+' FAILED ***':'*** ALL CHECKS PASSED ***'));
process.exit(fails?1:0);
