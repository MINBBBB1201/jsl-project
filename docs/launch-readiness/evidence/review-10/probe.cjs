const fs = require('node:fs');
const path = require('node:path');

const origin = 'https://jsl-logistics-backend.onrender.com';
const previewOrigin = 'https://jsl-logistics-frontend-cg29qwmas-minbbbb1201s-projects.vercel.app';
const knownErrors = {
  databaseConnection: 'Database connection error. Please try again later.',
  genericServer: 'Something went wrong!',
};

async function probe(endpoint) {
  const started = Date.now();
  const result = {method: 'GET', path: endpoint, startedAt: new Date(started).toISOString()};
  try {
    const response = await fetch(origin + endpoint, {
      headers: {Origin: previewOrigin, Accept: 'application/json'},
      redirect: 'manual',
      signal: AbortSignal.timeout(45000),
    });
    const raw = await response.text();
    let json;
    try { json = JSON.parse(raw); } catch {}
    Object.assign(result, {
      status: response.status,
      elapsedMs: Date.now() - started,
      contentType: response.headers.get('content-type'),
      allowedOriginMatches: response.headers.get('access-control-allow-origin') === previewOrigin,
      jsonObject: json !== null && typeof json === 'object' && !Array.isArray(json),
      databaseErrorMatches: json?.error === knownErrors.databaseConnection && json?.success === false,
      genericServerErrorMatches: json?.message === knownErrors.genericServer && json?.status === 'error',
      missingRouteMessageMatches: json?.message === `Can't find ${endpoint} on this server!`,
      developmentErrorShape: typeof json?.stack === 'string' && json?.error !== null && typeof json?.error === 'object',
      knownEnvelopeFields: ['status', 'success', 'message', 'error', 'stack', 'code', 'data'].filter(key => json && Object.hasOwn(json, key)),
      policyNotReady: json?.code === 'POLICY_NOT_READY' || json?.error?.code === 'POLICY_NOT_READY',
      health: endpoint === '/health' ? {
        ok: json?.status === 'ok',
        database: ['connected', 'disconnected'].includes(json?.database) ? json.database : null,
      } : undefined,
      unexpectedBodyNotRetained: true,
    });
  } catch (error) {
    Object.assign(result, {elapsedMs: Date.now() - started, failure: error.name === 'TimeoutError' ? 'timeout' : 'request-failed'});
  }
  return result;
}

(async () => {
  const diagnostic = process.argv.includes('--notice-only');
  const endpoints = diagnostic ? ['/api/contact/notice?language=ko'] : ['/health', '/api/contact/notice?language=ko'];
  const results = await Promise.all(endpoints.map(probe));
  const report = {
    apiOrigin: origin,
    requestOrigin: previewOrigin,
    timeoutMs: 45000,
    retries: 0,
    purpose: diagnostic ? 'One follow-up to classify the previously unrecognized 500 envelope; no raw error or stack retained.' : 'Health and notice contract observation.',
    results,
    limits: ['Read-only public requests; no authentication or inquiry POST.', 'Response shape is not a deployed commit identifier.', 'Raw bodies, cookie values and arbitrary headers are not retained.'],
  };
  fs.writeFileSync(path.join(__dirname, diagnostic ? 'notice-diagnostic.json' : 'public-probe.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})();
