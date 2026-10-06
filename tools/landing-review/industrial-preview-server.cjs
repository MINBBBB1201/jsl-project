const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'artifacts/industrial-preview');
const sourceCss = path.join(root, 'frontend/src/app/landing/components/industrial-journey.css');
const wrapper = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JSL · Industrial motion review</title><style>@font-face{font-family:General;src:url('/fonts/GeneralSans-400.woff2');font-weight:400}@font-face{font-family:General;src:url('/fonts/GeneralSans-500.woff2');font-weight:500}@font-face{font-family:General;src:url('/fonts/GeneralSans-600.woff2');font-weight:600}:root{--font-general-sans:General}*{box-sizing:border-box}body{margin:0;background:#082039;font-family:General,sans-serif}button,a{-webkit-tap-highlight-color:transparent}#preview-controls{position:fixed;top:12px;left:12px;background:#fff;padding:10px;border-radius:4px;font-size:12px;z-index:10}#preview-controls input{width:160px}#preview-controls button{margin-left:10px}body[data-capture] #preview-controls{display:none}</style><link rel="stylesheet" href="/scene.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`;
const mime = {'.js':'application/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'};
http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/favicon.ico') {res.statusCode=204;res.end();return;}
  if (url.pathname === '/') {res.setHeader('Content-Type','text/html');res.end(wrapper);return;}
  const target = url.pathname === '/scene.css' ? sourceCss : url.pathname.startsWith('/images/') ? path.join(root,'frontend/public',url.pathname) : url.pathname.startsWith('/fonts/') ? path.join(root,'frontend/src',url.pathname) : path.join(output,url.pathname);
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {res.statusCode=404;res.end('Not found');return;}
  res.setHeader('Content-Type',mime[path.extname(target)] || 'application/octet-stream');fs.createReadStream(target).pipe(res);
}).listen(4314,'127.0.0.1',()=>console.log('Industrial motion review http://localhost:4314'));
