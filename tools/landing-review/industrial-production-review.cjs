const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'artifacts/industrial-final-20261007');
fs.mkdirSync(output, { recursive: true });
const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'artifacts/industrial-snapshot.json')));
for (const [file, hash] of Object.entries(snapshot.files)) {
  if (crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex') !== hash) throw new Error('Snapshot changed: '+file);
}
const report = { snapshotId: snapshot.snapshotId, viewports: [], locales: [], failures: [] };
let ownedBrowser;
(async () => {
  ownedBrowser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const [name, width, height] of [['desktop',1440,900],['mobile',390,844]]) {
    const context = await ownedBrowser.newContext({ viewport: {width,height} });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/landing', {waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('.industrial-journey')?.dataset.progress !== undefined);
    await page.evaluate(async()=>{await document.fonts.ready;await document.querySelector('.industrial-vehicle img').decode()});
    const start = await page.locator('.industrial-journey').evaluate(e=>e.getBoundingClientRect().top+scrollY);
    const rows=[];
    for(let i=0;i<=50;i++) {
      const p=i/50;
      await page.evaluate(({start,p})=>scrollTo({top:start+p*innerHeight*10,behavior:'instant'}),{start,p});
      await page.waitForTimeout(400);
      await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.industrial-journey').dataset.progress)-p)<.005,p);
      const row=await page.evaluate(()=>{
        const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom}};
        const transporting=Number(getComputedStyle(document.querySelector('.industrial-transport-ui')).opacity)>.5;
        const copy=document.querySelector(transporting?'.industrial-transport-copy':'.industrial-step-copy');
        const title=document.querySelector(transporting?'#industrial-service-title':'.industrial-journey-heading h2');
        const c=box(copy),t=box(document.querySelector('.industrial-vehicle'));
        const overlap=t.right>0&&t.x<innerWidth&&Math.min(c.right,t.right)-Math.max(c.x,t.x)>1&&Math.min(c.bottom,t.bottom)-Math.max(c.y,t.y)>1;
        return {p:Number(document.querySelector('.industrial-journey').dataset.progress),overflow:document.documentElement.scrollWidth>innerWidth+1,stageY:document.querySelector('.industrial-stage').getBoundingClientRect().y,loaded:document.querySelector('.industrial-vehicle img').naturalWidth>0,title:title.textContent,overlap,copy:c,truck:t};
      });
      rows.push(row);
      if(row.overflow||row.overlap||!row.loaded||!row.title.trim()||(p<1&&Math.abs(row.stageY)>2)) report.failures.push({name,p,row});
      if([0,1,2,3,4,23,24,25,26,27,45,46,47,48,49].includes(i)) await page.screenshot({path:path.join(output,`${name}-${String(i*2).padStart(3,'0')}.png`)});
    }
    report.viewports.push({name,width,height,samples:rows});
    console.log(name+': '+rows.length+' scroll samples checked');
    await context.close();
  }
  const localeContext=await ownedBrowser.newContext({viewport:{width:390,height:844}});
  const localePage=await localeContext.newPage();
  for(const locale of ['ko','en','zh','vi']) {
    await localePage.goto('http://localhost:3000/'+(locale==='ko'?'':locale+'/')+'landing',{waitUntil:'domcontentloaded'});
    await localePage.emulateMedia({reducedMotion:'reduce'});
    const expectedPrefix=locale==='ko'?'/services/':`/${locale}/services/`;
    await localePage.locator('.industrial-static-content h3').first().waitFor({state:'visible'});
    const state=await localePage.evaluate(()=>({links:[...document.querySelectorAll('.industrial-static-content a')].map(e=>e.getAttribute('href')),headings:document.querySelectorAll('.industrial-static-content h3').length,overflow:document.documentElement.scrollWidth>innerWidth+1}));
    if(state.headings!==12||state.overflow||state.links.length!==5||state.links.some(link=>!link.startsWith(expectedPrefix)))report.failures.push({locale,state});
    report.locales.push({locale,...state});
  }
  await localeContext.close();
  const filmContext=await ownedBrowser.newContext({viewport:{width:390,height:844},recordVideo:{dir:output,size:{width:390,height:844}}});
  const film=await filmContext.newPage();
  await film.goto('http://localhost:3000/landing',{waitUntil:'domcontentloaded'});
  await film.waitForFunction(()=>document.querySelector('.industrial-journey')?.dataset.progress!==undefined);
  const start=await film.locator('.industrial-journey').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await film.evaluate(y=>scrollTo({top:y,behavior:'instant'}),start);
  await film.evaluate(async y=>{const began=performance.now();await new Promise(resolve=>{const draw=()=>{const p=Math.min(1,(performance.now()-began)/18000);scrollTo({top:y+p*innerHeight*10,behavior:'instant'});if(p<1)requestAnimationFrame(draw);else resolve()};requestAnimationFrame(draw)})},start);
  const video=film.video();await film.close();await filmContext.close();
  const videoPath=path.join(output,'live-scroll-mobile.webm');await video.saveAs(videoPath);
  await ownedBrowser.close();
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  const ffmpeg=require('ffmpeg-static');
  const child=spawn(ffmpeg,['-hide_banner','-loglevel','error','-n','-i',videoPath,'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,'live-scroll-mobile.mp4')],{windowsHide:true,stdio:'inherit'});
  await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('ffmpeg '+code)))});
  console.log('Final failures: '+report.failures.length);
  if(report.failures.length)process.exitCode=1;
})().catch(async error=>{console.error(error);await ownedBrowser?.close().catch(()=>{});process.exitCode=1});
