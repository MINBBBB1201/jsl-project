const fs=require('fs');
const {chromium}=require(process.env.JSL_PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.JSL_CHROMIUM_EXECUTABLE});const results=[];
 try{
  for(const [width,height]of [[320,640],[390,640],[390,844],[768,900]])for(const locale of ['ko','en','zh','vi']){
   const p=await b.newPage({viewport:{width,height}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(`http://localhost:4192/${locale}/landing`,{waitUntil:'domcontentloaded'});await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>document.querySelector('.journey-track-clocks')?.children.length===3);await p.waitForFunction(()=>document.querySelector('.journey-approved-globe')?.dataset.status==='ready');await p.waitForTimeout(500);
   const result=await p.evaluate(({width,height,locale})=>{
    const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};
    const hero=document.querySelector('#hero'),form=document.querySelector('.journey-track-form'),copy=document.querySelector('.journey-hero-copy'),actions=[...document.querySelectorAll('.journey-hero .journey-actions a')];
    const label=document.querySelector('.journey-track-form small'),input=form.querySelector('input'),clock=document.querySelector('.journey-track-clocks');
    return {width,height,locale,overflow:document.documentElement.scrollWidth-innerWidth,hero:r(hero),copy:r(copy),form:{client:form.clientWidth,scroll:form.scrollWidth,input:r(input),button:r(form.querySelector('button'))},actions:actions.map(r),clock:{box:r(clock),children:[...clock.children].map(r)},placeholder:getComputedStyle(input,'::placeholder').color,label:getComputedStyle(label).color};
   },{width,height,locale});
   result.pass=result.overflow===0&&result.form.client===result.form.scroll&&result.actions.every(r=>r.bottom<=height&&r.x>=0&&r.right<=width);result.errors=errors;results.push(result);
   if(height===640)await p.screenshot({path:`${__dirname}/after-${locale}-${width}x${height}-hero.png`});
   await p.close();
  }
  const p=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark'});await p.addInitScript(()=>localStorage.setItem('theme','dark'));await p.goto('http://localhost:4192/en/landing',{waitUntil:'domcontentloaded'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${__dirname}/after-en-390-dark-hero.png`});await p.close();
 }finally{await b.close();fs.writeFileSync(`${__dirname}/responsive.json`,JSON.stringify(results,null,2));}
 if(results.some(r=>!r.pass||r.errors.length))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});

