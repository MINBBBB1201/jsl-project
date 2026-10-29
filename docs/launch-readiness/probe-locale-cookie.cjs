// Synthetic NextRequest objects only. Does not start Next or contact a deployment.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const dependency = require('node:module').createRequire(path.join(root, 'frontend/package.json'));
const ts = dependency('typescript');
const { NextRequest } = dependency('next/server');
// Next's bundler normally resolves this extensionless ESM import. Adapt only this
// probe process; do not edit the installed package or the application's config.
const resolver = require('node:module').registerHooks({ resolve(specifier, context, next) { return next(specifier === 'next/server' ? 'next/server.js' : specifier, context); } });
const middlewareModule = dependency('next-intl/middleware');
resolver.deregister();
const createMiddleware = middlewareModule.default ?? middlewareModule;
const configFile = path.join(root, 'frontend/src/i18n/routing.ts');
const compiled = ts.transpileModule(fs.readFileSync(configFile, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const context = { exports: {}, require: dependency };
vm.runInNewContext(compiled.outputText, context, { filename: configFile, timeout: 1000 });
const routing = context.exports.routing;
function probe(label, pathname, config, destination = 'document') {
  const request = new NextRequest(`https://audit.example.test${pathname}`, { headers: { 'accept-language': 'ko-KR,ko;q=0.9', 'sec-fetch-dest': destination } });
  const response = createMiddleware(config)(request);
  return { label, pathname, destination, responseStatus: response.status, cookies: response.cookies.getAll().map(cookie => ({ name: cookie.name, sameSite: cookie.sameSite, maxAge: cookie.maxAge ?? null, path: cookie.path, secure: cookie.secure ?? null })) };
}
const cases = [
  probe('fresh default-language document', '/landing', routing),
  probe('fresh English document', '/en/landing', routing),
  probe('fresh Chinese document', '/zh/landing', routing),
  probe('non-document request', '/en/landing', routing, 'empty'),
  probe('disabled-cookie control only; project unchanged', '/en/landing', { ...routing, localeCookie: false }),
];
assert.equal(routing.localeDetection, false);
assert.equal(cases[0].cookies.length, 0);
assert(cases[1].cookies.some(cookie => cookie.name === 'NEXT_LOCALE'));
assert(cases[2].cookies.some(cookie => cookie.name === 'NEXT_LOCALE'));
assert.equal(cases[3].cookies.length, 0);
assert.equal(cases[4].cookies.length, 0);
const versionOf = name => JSON.parse(fs.readFileSync(path.join(root, 'frontend/node_modules', name, 'package.json'), 'utf8')).version;
const result = { scope: 'Installed next-intl middleware with the actual routing.ts configuration and synthetic requests. No browser, network, production Next server, client language switch or deployment middleware execution.', versions: { node: process.versions.node, next: versionOf('next'), nextIntl: versionOf('next-intl') }, assertionCount: 6, cases };
fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ assertionsPassed: 6, cases: cases.length, deploymentVerified: false }));
