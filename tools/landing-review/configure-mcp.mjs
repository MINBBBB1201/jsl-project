import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolRoot, '../..');
const servers = JSON.parse(await readFile(path.join(toolRoot, 'mcp-servers.json'), 'utf8'));
const forward = value => value.replaceAll('\\', '/');
const expand = value => value.replaceAll('{toolRoot}', forward(toolRoot)).replaceAll('{projectRoot}', forward(projectRoot));
const refreshOwned = process.argv.includes('--refresh-owned');
const targets = [projectRoot, ...process.argv.slice(2).filter(arg => arg !== '--refresh-owned')].map(root => path.resolve(root));
for (const root of [...new Set(targets)]) {
  const filename = path.join(root, '.codex/config.toml');
  let previous = '';
  try { previous = await readFile(filename, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  let addition = '', updated = false;
  for (const [name, server] of Object.entries(servers)) {
    const args = [forward(path.join(toolRoot, server.entry)), ...server.args.map(expand)];
    if (previous.includes(`[mcp_servers.${name}]`)) {
      if (refreshOwned) {
        const start = previous.indexOf(`[mcp_servers.${name}]`);
        const next = previous.indexOf('\n[', start + 1);
        const end = next === -1 ? previous.length : next;
        const block = previous.slice(start, end).replace(/^args\s*=.*$/m, `args = ${JSON.stringify(args)}`);
        previous = previous.slice(0, start) + block + previous.slice(end);
        updated = true;
      }
      console.log(`Configured entry exists: ${name} in ${filename}`); continue;
    }
    addition += `\n# JSL reference/motion review tooling\n[mcp_servers.${name}]\ncommand = ${JSON.stringify(forward(process.execPath))}\nargs = ${JSON.stringify(args)}\ncwd = ${JSON.stringify(forward(projectRoot))}\nstartup_timeout_sec = 60\ntool_timeout_sec = 120\nenabled = true\n`;
    if (server.env) { addition += `\n[mcp_servers.${name}.env]\n`; for (const [key, value] of Object.entries(server.env)) addition += `${key} = ${JSON.stringify(value)}\n`; }
  }
  if (addition || updated) { await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, previous + addition); console.log(`Configured: ${filename}`); }
}
