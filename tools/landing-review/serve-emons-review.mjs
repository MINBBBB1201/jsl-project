import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'artifacts/playwright');
const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
http.createServer(async (req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'emons-review.html';
  if (!/^[a-zA-Z0-9_.-]+$/.test(name) || !types[path.extname(name)]) { res.writeHead(404).end(); return; }
  try { const body = await readFile(path.join(root, name)); res.writeHead(200, { 'Content-Type': types[path.extname(name)], 'Cache-Control': 'no-store' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(4311, '127.0.0.1', () => console.log('Review gallery: http://localhost:4311'));
