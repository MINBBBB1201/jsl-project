import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolRoot, '../..');
const servers = JSON.parse(await readFile(path.join(toolRoot, 'mcp-servers.json'), 'utf8'));
const expand = value => value.replaceAll('{toolRoot}', toolRoot.replaceAll('\\', '/')).replaceAll('{projectRoot}', projectRoot.replaceAll('\\', '/'));
async function verify(name, server) {
  const videoDirectory = path.join(toolRoot, 'artifacts/playwright-video');
  await mkdir(videoDirectory, { recursive: true });
  const previousVideos = new Set(await readdir(videoDirectory));
  const child = spawn(process.execPath, [path.join(toolRoot, server.entry), ...server.args.map(expand)], { cwd: projectRoot, windowsHide: true, env: { ...process.env, ...server.env }, stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = '', id = 0, diagnostic = '';
  const pending = new Map();
  const answer = { name, checkedAt: new Date().toISOString(), status: 'failed' };
  child.stderr.on('data', data => { diagnostic = (diagnostic + data.toString()).slice(-6000); });
  child.stdin.on('error', () => {});
  const fail = error => { for (const item of pending.values()) { clearTimeout(item.timer); item.reject(error); } pending.clear(); };
  child.on('error', fail);
  child.on('exit', code => fail(new Error(`Server exited (${code})`)));
  child.stdout.on('data', data => {
    buffer += data.toString();
    while (buffer.includes('\n')) {
      const boundary = buffer.indexOf('\n'), line = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 1);
      let message;
      try { message = JSON.parse(line); } catch { continue; }
      if (message.id == null || !pending.has(message.id)) continue;
      const item = pending.get(message.id); pending.delete(message.id); clearTimeout(item.timer);
      if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
    }
  });
  const send = (method, params, timeout = 45000) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`Timed out: ${method}`)); }, timeout);
    pending.set(requestId, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }) + '\n');
  });
  try {
    const init = await send('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'jsl-tooling-smoke-check', version: '1.0.0' } });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const catalog = await send('tools/list', {});
    answer.serverInfo = init.serverInfo;
    answer.protocolVersion = init.protocolVersion;
    answer.toolCount = catalog.tools.length;
    answer.tools = catalog.tools.map(tool => tool.name);
    let smoke;
    if (name === 'jsl_playwright') {
      smoke = await send('tools/call', { name: 'browser_navigate', arguments: { url: 'about:blank' } });
      if (!smoke.isError) {
        const animation = await send('tools/call', { name: 'browser_evaluate', arguments: { function: "() => { const c=document.createElement('canvas'); c.width=320; c.height=180; document.body.append(c); const ctx=c.getContext('2d'); let n=0; const paint=()=>{ctx.fillStyle=n%2?'#f47721':'#08284f'; ctx.fillRect(0,0,320,180); ctx.fillStyle='#fff'; ctx.fillRect((n*4)%300,60,20,60); if(n++<100)requestAnimationFrame(paint);};paint();return 'Isolated recording fixture started'; }" } });
        if (animation.isError) throw new Error('Isolated recording fixture failed.');
        await new Promise(resolve => setTimeout(resolve, 1200));
        await send('tools/call', { name: 'browser_close', arguments: {} });
        const recordings = (await readdir(videoDirectory)).filter(file => !previousVideos.has(file) && file.endsWith('.webm'));
        if (!recordings.length) throw new Error('Playwright session recording missing.');
        const videoPath = path.join(videoDirectory, recordings[0]);
        const recording = await stat(videoPath);
        const frameDirectory = path.join(toolRoot, 'artifacts', `recording-frames-${Date.now()}`);
        const decoded = spawnSync(process.execPath, [path.join(toolRoot, 'video-frames.mjs'), videoPath, frameDirectory], { windowsHide: true, encoding: 'utf8', timeout: 30000 });
        if (decoded.status !== 0 || !(await readdir(frameDirectory)).some(file => file.endsWith('.png'))) throw new Error('Recorded video did not decode into frames.');
        answer.recording = { file: videoPath, bytes: recording.size, decodedFrames: frameDirectory };
      }
    } else if (name === 'jsl_chrome_devtools') {
      smoke = await send('tools/call', { name: 'list_pages', arguments: {} });
    } else if (name === 'jsl_next_devtools') {
      const discovery = catalog.tools.find(tool => tool.name === 'nextjs_index');
      if (!discovery) throw new Error('Next.js discovery tool not found.');
      smoke = await send('tools/call', { name: discovery.name, arguments: {} });
    } else {
      smoke = await send('tools/call', { name: 'resolve-library-id', arguments: { libraryName: 'gsap', query: 'GSAP ScrollTrigger scrub pin API documentation' } });
    }
    const excerpt = (smoke.content ?? []).filter(item => item.type === 'text').map(item => item.text).join('\n');
    answer.smoke = { isError: !!smoke.isError, excerpt: excerpt.slice(0, 600) };
    answer.status = smoke.isError ? 'registered-service-error' : 'passed';
    if (name === 'jsl_next_devtools' && !smoke.isError) {
      try { const discovery = JSON.parse(excerpt); if (discovery.success === false && discovery.servers?.length === 0) answer.status = 'ready-waiting-devserver'; } catch {}
    }
  } catch (error) { answer.error = error.message; answer.diagnostic = diagnostic; }
  finally { child.stdin.end(); child.kill(); }
  console.log(JSON.stringify({ name, status: answer.status, toolCount: answer.toolCount, error: answer.error, smoke: answer.smoke }));
  return answer;
}
const requested = process.argv.slice(2);
const results = await Promise.all(Object.entries(servers).filter(([name]) => !requested.length || requested.includes(name)).map(([name, server]) => verify(name, server)));
await mkdir(path.join(toolRoot, 'artifacts'), { recursive: true });
await writeFile(path.join(toolRoot, 'artifacts/mcp-verification.json'), JSON.stringify(results, null, 2));
if (results.some(result => !['passed', 'ready-waiting-devserver'].includes(result.status))) process.exitCode = 1;
