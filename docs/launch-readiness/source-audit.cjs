// Static evidence only: an import path or URL literal does not prove a request ran.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const ts = require(require.resolve('typescript', { paths: [path.join(root, 'frontend')] }));
const tracker = /(?:google-analytics|googletagmanager|gtag|facebook\.net|fbq|hotjar|clarity|posthog|plausible|amplitude|mixpanel|segment\/analytics|@vercel\/analytics|speed-insights)/i;

function scanText(file, source) {
  const findings = [];
  const imports = [];
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const add = (node, kind, detail = {}) => findings.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, kind, ...detail });
  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (!node.importClause?.isTypeOnly) imports.push(node.moduleSpecifier.text);
      if (tracker.test(node.moduleSpecifier.text) || node.moduleSpecifier.text === 'next/script') add(node, 'script-or-tracker-import', { module: node.moduleSpecifier.text });
    }
    if (ts.isStringLiteralLike(node) && /^https?:\/\//.test(node.text)) {
      try { const url = new URL(node.text); add(node, 'url-literal', { origin: url.origin, context: ts.SyntaxKind[node.parent.kind] }); } catch { /* Not a complete static URL. */ }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      if (['iframe', 'script', 'Script'].includes(tag)) add(node, 'embed-or-script-element', { tag });
      if (node.attributes.properties.some(property => property.name?.getText(ast) === 'dangerouslySetInnerHTML')) add(node, 'inline-html-review');
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && node.left.getText(ast) === 'document.cookie') add(node, 'cookie-write');
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const callee = node.expression.getText(ast);
      if (/^(?:(?:window|globalThis)\.)?fetch$|^(?:navigator\.)?sendBeacon$|^(?:window\.)?(?:WebSocket|EventSource)$|^axios(?:\.(?:get|post|put|delete|request))?$/.test(callee)) add(node, 'network-call', { api: callee });
      if (/^(?:window\.)?open$/.test(callee)) add(node, 'window-open-call', { api: callee });
      if (/\.(?:getItem|setItem|removeItem|clear)$/.test(callee)) {
        const argument = node.arguments?.[0];
        add(node, 'storage-call', { api: callee, key: argument && ts.isStringLiteralLike(argument) ? argument.text : null });
      }
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments?.[0] && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
      if (tracker.test(callee)) add(node, 'tracker-call-review', { api: callee });
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (file.endsWith('.css')) {
    // Parse CSS separately: ignore comments and retain only request-capable URL origins.
    const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of css.matchAll(/(?:url\(\s*['"]?|@import\s+['"])(https?:\/\/[^\s'";)]+)/g)) {
      try { findings.push({ file, kind: 'css-url', origin: new URL(match[1]).origin }); } catch { /* Nonliteral CSS URL. */ }
    }
    return { findings: findings.filter(item => item.kind === 'css-url'), imports: [] };
  }
  return { findings, imports };
}

function auditRoot(repository) {
  const sourceRoot = path.join(repository, 'frontend/src');
  const files = [];
  function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, item.name);
      if (item.isDirectory()) walk(target);
      else if (/\.(?:ts|tsx|css)$/.test(item.name) && !/\.(?:test|spec)\./.test(item.name)) files.push(target);
    }
  }
  walk(sourceRoot);
  files.sort();
  const scanned = new Map();
  const hashes = [];
  for (const absolute of files) {
    const source = fs.readFileSync(absolute, 'utf8');
    const relative = path.relative(repository, absolute).replaceAll('\\', '/');
    scanned.set(absolute, scanText(relative, source));
    hashes.push({ file: relative, sha256: crypto.createHash('sha256').update(source).digest('hex') });
  }
  const entries = ['frontend/src/app/layout.tsx', 'frontend/src/app/[locale]/layout.tsx', 'frontend/src/app/[locale]/landing/page.tsx'];
  const reachable = new Set();
  function resolveLocal(from, specifier) {
    const base = specifier.startsWith('@/') ? path.join(sourceRoot, specifier.slice(2)) : specifier.startsWith('.') ? path.resolve(path.dirname(from), specifier) : null;
    if (!base) return null;
    return [base, ...['.ts', '.tsx', '.css', '/index.ts', '/index.tsx'].map(suffix => base + suffix)].find(candidate => scanned.has(candidate)) ?? null;
  }
  function traverse(absolute) {
    if (!scanned.has(absolute) || reachable.has(absolute)) return;
    reachable.add(absolute);
    for (const specifier of scanned.get(absolute).imports) { const resolved = resolveLocal(absolute, specifier); if (resolved) traverse(resolved); }
  }
  entries.forEach(entry => traverse(path.join(repository, entry)));
  const packageFile = path.join(repository, 'frontend/package.json');
  const manifest = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  return {
    scope: 'Static source inspection; import reachability is not proof of execution. URLs omit paths, queries and values. No environment files, credentials, operational data or browser state read.',
    scannedFiles: files.length,
    parserVersion: ts.version,
    manifestSha256: crypto.createHash('sha256').update(fs.readFileSync(packageFile)).digest('hex'),
    entrypoints: entries,
    reachableModules: reachable.size,
    directTrackerDependencies: Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).filter(name => tracker.test(name)),
    findings: [...scanned.entries()].flatMap(([absolute, result]) => result.findings.map(item => ({ ...item, reachableFromLandingImports: reachable.has(absolute) }))),
    hashes,
  };
}
module.exports = { scanText, auditRoot };
if (require.main === module) process.stdout.write(JSON.stringify(auditRoot(root), null, 2) + '\n');
