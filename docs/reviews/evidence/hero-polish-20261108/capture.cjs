const fs = require('fs');
const { chromium } = require(process.env.JSL_PLAYWRIGHT_MODULE || 'playwright');
const out = __dirname;
const variant = process.argv[2] || 'before';
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.JSL_CHROMIUM_EXECUTABLE});
  const results=[];
  try {
    for (const [width,height,locale] of [[1440,900,'en'],[390,844,'en'],[320,640,'vi']]) {
      const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
      const errors=[];page.on('pageerror', e=>errors.push(e.message));
      await page.goto(`http://localhost:4192/${locale}/landing`, {waitUntil:'domcontentloaded'});
      await page.evaluate(()=>document.fonts.ready); await page.waitForFunction(()=>document.querySelector('.journey-track-clocks')?.children.length===3); await page.waitForFunction(()=>document.querySelector('.journey-approved-globe')?.dataset.status==='ready'); await page.waitForTimeout(900);
      for (const [name,selector] of [['hero','#hero'],['about','.jsl-ac__scene'],['contact','#contact']]) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.evaluate(s=>scrollTo({top:document.querySelector(s).getBoundingClientRect().top+scrollY,behavior:'instant'}),selector);
        await page.waitForTimeout(900);
        await page.screenshot({path:`${out}/${variant}-${locale}-${width}-${name}.png`});
        results.push(await page.evaluate(({name,selector,width,locale})=>{
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
          const form=document.querySelector('.journey-track-form');
          return {name,width,locale,scrollY,overflow:document.documentElement.scrollWidth-innerWidth,section:rect(document.querySelector(selector)),form:form&&{client:form.clientWidth,scroll:form.scrollWidth,input:rect(form.querySelector('input')),button:rect(form.querySelector('button'))},errors:[]};
        },{name,selector,width,locale}));
      }
      results.push({width,locale,errors});await page.close();
    }
  } finally {await browser.close();fs.writeFileSync(`${out}/${variant}.json`,JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
