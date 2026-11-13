const fs=require('fs');
const {chromium}=require('D:/Caches/npm/_npx/31e32ef8478fbf80/node_modules/playwright');
const out='D:/jsl-validation/release-20261105/theme-width';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Users/mimin/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});const results=[];try{
const c=await b.newContext();let p=await c.newPage();await p.goto(process.env.JSL_REVIEW_URL,{waitUntil:'domcontentloaded'});const origin=new URL(p.url()).origin;await p.close();
for(const [width,height] of [[600,900],[740,360],[320,640],[390,844],[768,1024],[1440,900]]){
p=await c.newPage();await p.setViewportSize({width,height});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/vi/landing',{waitUntil:'domcontentloaded'});
await p.locator('#features').scrollIntoViewIfNeeded();await p.waitForSelector('#jsl-marine-native .uc-service-nav',{state:'attached',timeout:30000});await p.waitForFunction(()=>!!document.querySelector('.pin-spacer'),undefined,{timeout:30000});
await p.waitForTimeout(5000);
await p.evaluate(()=>Promise.all([...document.querySelectorAll('#jsl-marine-native img')].map(i=>i.decode().catch(()=>{}))));
for(const phase of [.08,.15,.22,.3,.5,.08]){
let settled=false;
for(let attempt=0;attempt<12;attempt++){
await p.evaluate(f=>{const e=document.querySelector('#features');scrollTo({top:e.getBoundingClientRect().top+scrollY+innerHeight*14*f,behavior:'instant'})},phase);await p.waitForTimeout(1000);
if(await p.evaluate(f=>Math.abs(Number(document.querySelector('.uc-screen')?.dataset.progress)-f)<.001,phase)){settled=true;break}
}
if(!settled)throw Error(`Engine did not reach ${phase} at ${width}`);
const state=await p.evaluate(()=>{const trigger=document.querySelector('[data-landing-theme-trigger]'),r=trigger.getBoundingClientRect();const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};const old=trigger.style.pointerEvents;trigger.style.pointerEvents='none';let hits=[];for(let x=r.left+2;x<r.right;x+=6)for(let y=r.top+2;y<r.bottom;y+=6){const el=document.elementFromPoint(x,y);if(el?.closest('.uc-service-nav button,.mm-mode-nav button,.uc-description,.uc-information h2,.journey-track-form'))hits.push(el.closest('button')?.textContent||el.textContent?.slice(0,60))}trigger.style.pointerEvents=old;return {trigger:rect(trigger),progress:document.querySelector('.uc-screen')?.dataset.progress,visible:r.top>=0&&r.bottom<=innerHeight,hits:[...new Set(hits)]}});
results.push({width,height,phase,...state,errors:[...errors]});fs.writeFileSync(`${out}/${process.env.JSL_VARIANT}.json`,JSON.stringify(results,null,2));if(phase===.08||phase===.15)await p.screenshot({path:`${out}/${process.env.JSL_VARIANT}-${width}-${height}-${phase}.png`});
}
await p.locator('[data-landing-theme-trigger]').click();await p.getByRole('dialog').waitFor();await p.keyboard.press('Escape');await p.waitForTimeout(400);results.push({width,height,focusRestored:await p.locator('[data-landing-theme-trigger]').evaluate(e=>document.activeElement===e)});
if(width===600){await p.locator('[data-landing-theme-trigger]').click();await p.getByRole('dialog').getByRole('button',{name:'Dark',exact:true}).click();await p.keyboard.press('Escape');await p.waitForTimeout(800);await p.screenshot({path:`${out}/${process.env.JSL_VARIANT}-600-dark.png`});results.push({width,height,darkClass:await p.locator('html').getAttribute('class')});await p.locator('[data-landing-theme-trigger]').click();await p.getByRole('dialog').getByRole('button',{name:'Light',exact:true}).click();await p.keyboard.press('Escape');}
await p.close();fs.writeFileSync(`${out}/${process.env.JSL_VARIANT}.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results.filter(x=>x.width===width)));
}await c.close();}finally{await b.close()}})().catch(e=>{console.error(e.message.replace(/https:\/\/\S+/g,'[url]'));process.exitCode=1});
