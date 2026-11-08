const fs=require('fs');
const {chromium}=require(process.env.JSL_PLAYWRIGHT_MODULE || 'playwright');
const phase=process.argv[2]||'before';
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.JSL_CHROMIUM_EXECUTABLE});
 const results=[];
 try{
  for(const initial of ['reduce','no-preference']){
   const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:initial});
   await p.goto('http://localhost:4192/en/landing',{waitUntil:'domcontentloaded'});await p.waitForTimeout(900);
   for(const mode of [initial,initial==='reduce'?'no-preference':'reduce',initial]){
    await p.emulateMedia({reducedMotion:mode});await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(250);
    await p.evaluate(()=>{const r=document.querySelector('.journey-hero-motion');scrollTo(0,(r.offsetHeight-innerHeight)*.35)});await p.waitForTimeout(1100);
    results.push(await p.evaluate(({initial,mode})=>({initial,mode,scrollY,orbitInline:document.querySelector('.journey-orbit').style.transform,copyInline:document.querySelector('.journey-hero-copy').style.opacity,track:document.querySelector('.journey-hero-motion').offsetHeight,viewport:innerHeight}),{initial,mode}));
   }
   await p.close();
  }
 }finally{await b.close();fs.writeFileSync(`${__dirname}/${phase}-motion.json`,JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
