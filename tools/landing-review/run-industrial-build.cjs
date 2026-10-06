const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const project = path.resolve(__dirname,'../..');
const logPath = path.join(__dirname,'artifacts/industrial-build.log');
const log = fs.createWriteStream(logPath,{flags:'w'});
log.on('error',error=>console.error('Build log unavailable: '+error.message));
const started = new Date().toISOString();
console.log('Next production build --webpack; log: '+logPath);
const child = spawn(process.execPath,[path.join(project,'frontend/node_modules/next/dist/bin/next'),'build','--webpack'],{
  cwd:path.join(project,'frontend'),windowsHide:true,stdio:['ignore','pipe','pipe'],
  env:{...process.env,CIRCLE_NODE_TOTAL:'2',NODE_OPTIONS:'--max-old-space-size=1536'},
});
for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{log.write(data);process.stdout.write(data)});
child.on('error',error=>{log.write(error.stack);console.error(error);process.exitCode=1;});
child.on('close',code=>{log.end();try{fs.writeFileSync(path.join(__dirname,'artifacts/industrial-build-result.json'),JSON.stringify({started,finished:new Date().toISOString(),exitCode:code,command:'node frontend/node_modules/next/dist/bin/next build --webpack',workerEnvironment:{CIRCLE_NODE_TOTAL:'2',NODE_OPTIONS:'--max-old-space-size=1536'},logPath},null,2))}catch(error){console.error('Build result could not be saved: '+error.message)}process.exitCode=code ?? 1});
