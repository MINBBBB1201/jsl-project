// A single unauthenticated GET, not a browser network or cookie-consent test.
// Never record bodies, cookie values, query parameters or authentication headers.
const fs = require('node:fs');
const { request } = require(process.env.JSL_PLAYWRIGHT_MODULE);
async function main() {
  const url = new URL(process.argv[2]);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app') || url.username || url.password || url.search || url.hash) throw new Error('Use an observed HTTPS Vercel URL without credentials or query parameters');
  const client = await request.newContext();
  try {
    const response = await client.get(url.href, { maxRedirects: 0, timeout: 20000 });
    const headers = response.headers();
    const redirect = headers.location ? new URL(headers.location, url) : null;
    const result = {
      url: url.origin + url.pathname,
      method: 'GET',
      status: response.status(),
      redirectOrigin: redirect?.origin ?? null,
      redirectedToVercelAuthentication: redirect?.hostname === 'vercel.com' && redirect.pathname === '/sso-api',
      setCookieNames: response.headersArray().filter(header => header.name.toLowerCase() === 'set-cookie').map(header => header.value.split('=', 1)[0]),
      appNetworkVerified: false,
      storageOrSubresourcesObserved: false,
      credentialsUsed: false,
      limit: 'HTTP entry probe only. No browser was launched, no redirects followed and no application tracking or storage verdict inferred.',
    };
    fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ status: result.status, redirectedToVercelAuthentication: result.redirectedToVercelAuthentication, appNetworkVerified: false }));
  } finally { await client.dispose(); }
}
main().catch(error => { console.error(error.name); process.exitCode = 1; });
