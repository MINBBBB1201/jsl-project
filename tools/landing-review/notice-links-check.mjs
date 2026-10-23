const LOCALES = [
  { locale: "ko", landingPath: "/landing", noticesPath: "/notices" },
  { locale: "en", landingPath: "/en/landing", noticesPath: "/en/notices" },
  { locale: "zh", landingPath: "/zh/landing", noticesPath: "/zh/notices" },
  { locale: "vi", landingPath: "/vi/landing", noticesPath: "/vi/notices" },
]

const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024

export class NoticeLinksCheckError extends Error {
  constructor(message) {
    super(message)
    this.name = "NoticeLinksCheckError"
  }
}

function parseBaseUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new NoticeLinksCheckError("Base URL must be a valid absolute URL")
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new NoticeLinksCheckError("Base URL must use http or https")
  }
  if (url.username || url.password) {
    throw new NoticeLinksCheckError("Base URL must not contain credentials")
  }
  if (url.search || url.hash) {
    throw new NoticeLinksCheckError("Base URL must not contain a query or fragment")
  }

  url.pathname = url.pathname.replace(/\/$/, "") || "/"
  return url
}

function routeUrl(baseUrl, routePath) {
  const prefix = baseUrl.pathname === "/" ? "" : baseUrl.pathname
  const url = new URL(baseUrl)
  url.pathname = `${prefix}${routePath}`
  return url
}

function redirectDescription(location, requestUrl) {
  if (!location) return "redirected without a Location header"

  let target
  try {
    target = new URL(location, requestUrl)
  } catch {
    return "redirected to an invalid Location"
  }

  if (target.origin !== requestUrl.origin) {
    return `redirected to another origin (${target.origin})`
  }
  if (/\b(?:login|sign-in|signin|auth)\b/i.test(target.pathname)) {
    return `redirected to an authentication route (${target.pathname})`
  }
  return `redirected to ${target.pathname}`
}

async function readLimitedHtml(response, routePath, maxBytes) {
  const contentType = response.headers.get("content-type") ?? ""
  if (!/^text\/html(?:;|$)/i.test(contentType)) {
    throw new NoticeLinksCheckError(`${routePath} returned non-HTML content (${contentType || "missing Content-Type"})`)
  }

  const declaredLength = response.headers.get("content-length")
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    throw new NoticeLinksCheckError(`${routePath} exceeded the ${maxBytes}-byte response limit`)
  }
  if (!response.body) {
    throw new NoticeLinksCheckError(`${routePath} returned an empty response body`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let html = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        throw new NoticeLinksCheckError(`${routePath} exceeded the ${maxBytes}-byte response limit`)
      }
      html += decoder.decode(value, { stream: true })
    }
    html += decoder.decode()
  } finally {
    reader.releaseLock()
  }

  if (!html.trim()) {
    throw new NoticeLinksCheckError(`${routePath} returned an empty HTML document`)
  }
  return html
}

function looksLikeLoginPage(html) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""
  if (/\b(?:log[ -]?in|sign[ -]?in|authentication)\b|로그인/i.test(title)) return true
  return [...html.matchAll(/<input\b[^>]*>/gi)]
    .some(([tag]) => tagAttributeValue(tag, "type")?.toLowerCase() === "password")
}

async function fetchHtml(fetchImpl, baseUrl, routePath, { timeoutMs, maxBytes }) {
  const requestUrl = routeUrl(baseUrl, routePath)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    let response
    try {
      response = await fetchImpl(requestUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: { accept: "text/html" },
      })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new NoticeLinksCheckError(`${routePath} timed out after ${timeoutMs}ms`)
      }
      throw new NoticeLinksCheckError(`${routePath} request failed (${error instanceof Error ? error.name : "unknown error"})`)
    }

    if (response.status >= 300 && response.status < 400) {
      throw new NoticeLinksCheckError(`${routePath} ${redirectDescription(response.headers.get("location"), requestUrl)}`)
    }
    if (response.status === 401 || response.status === 403) {
      throw new NoticeLinksCheckError(`${routePath} requires authentication (HTTP ${response.status})`)
    }
    if (response.status !== 200) {
      throw new NoticeLinksCheckError(`${routePath} returned HTTP ${response.status}`)
    }
    if (response.url && new URL(response.url).origin !== requestUrl.origin) {
      throw new NoticeLinksCheckError(`${routePath} resolved to another origin`)
    }

    let html
    try {
      html = await readLimitedHtml(response, routePath, maxBytes)
    } catch (error) {
      if (controller.signal.aborted) {
        throw new NoticeLinksCheckError(`${routePath} timed out after ${timeoutMs}ms`)
      }
      throw error
    }

    if (looksLikeLoginPage(html)) {
      throw new NoticeLinksCheckError(`${routePath} returned a login page instead of the app`)
    }
    return { html, requestUrl, contentLanguage: response.headers.get("content-language") }
  } finally {
    clearTimeout(timer)
  }
}

function decodeAttribute(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#(?:47|x2f);/gi, "/")
}

function tagAttributeValue(tag, attributeName) {
  const attributes = tag.match(/^<[^\s/>]+([\s\S]*?)\/?>$/)?.[1]
  if (attributes === undefined) return null

  const pattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g
  let match
  while ((match = pattern.exec(attributes)) !== null) {
    if (match[1].toLowerCase() === attributeName) {
      return decodeAttribute(match[2] ?? match[3] ?? match[4] ?? "")
    }
  }
  return null
}

function documentLanguage(html, routePath) {
  const tag = html.match(/<html\b[^>]*>/i)?.[0] ?? ""
  const language = (tagAttributeValue(tag, "lang") ?? "").trim().toLowerCase()
  if (!language) {
    throw new NoticeLinksCheckError(`${routePath} is missing <html lang>`)
  }
  return language
}

function assertLanguage(document, expectedLocale, routePath) {
  const actual = documentLanguage(document.html, routePath)
  if (actual !== expectedLocale) {
    throw new NoticeLinksCheckError(`${routePath} has lang=${actual}; expected ${expectedLocale}`)
  }

  if (document.contentLanguage) {
    const headerLocale = document.contentLanguage.split(",", 1)[0].trim().toLowerCase()
    if (headerLocale !== expectedLocale) {
      throw new NoticeLinksCheckError(`${routePath} has Content-Language=${headerLocale}; expected ${expectedLocale}`)
    }
  }
}

function footerHrefs(html, routePath) {
  const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0]
  if (!footer) {
    throw new NoticeLinksCheckError(`${routePath} is missing a footer element`)
  }

  return [...footer.matchAll(/<a\b[^>]*>/gi)]
    .map(([tag]) => tagAttributeValue(tag, "href"))
    .filter((href) => href !== null)
}

function assertFooterNoticeLink(document, noticesPath, routePath) {
  const found = footerHrefs(document.html, routePath).some((href) => {
    let target
    try {
      target = new URL(href, document.requestUrl)
    } catch {
      return false
    }
    return target.origin === document.requestUrl.origin
      && target.pathname === noticesPath
      && !target.search
      && !target.hash
  })

  if (!found) {
    throw new NoticeLinksCheckError(`${routePath} footer is missing href=${noticesPath}`)
  }
}

export async function checkNoticeLinks(baseUrlValue, options = {}) {
  const baseUrl = parseBaseUrl(baseUrlValue)
  const fetchImpl = options.fetchImpl ?? fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new NoticeLinksCheckError("timeoutMs must be a positive integer")
  }
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new NoticeLinksCheckError("maxBytes must be a positive integer")
  }

  const results = []
  for (const route of LOCALES) {
    const landing = await fetchHtml(fetchImpl, baseUrl, route.landingPath, { timeoutMs, maxBytes })
    assertLanguage(landing, route.locale, route.landingPath)
    assertFooterNoticeLink(landing, route.noticesPath, route.landingPath)

    const notices = await fetchHtml(fetchImpl, baseUrl, route.noticesPath, { timeoutMs, maxBytes })
    assertLanguage(notices, route.locale, route.noticesPath)
    results.push({ locale: route.locale, landingPath: route.landingPath, noticesPath: route.noticesPath })
  }
  return results
}

export async function runNoticeLinksCli(args, io = console, options = {}) {
  if (args.length !== 1) {
    io.error("Usage: node tools/landing-review/notice-links-check.mjs <base-url>")
    return 2
  }

  try {
    const results = await checkNoticeLinks(args[0], options)
    for (const result of results) {
      io.log(`PASS ${result.locale}: ${result.landingPath} -> ${result.noticesPath}`)
    }
    return 0
  } catch (error) {
    io.error(`FAIL ${error instanceof Error ? error.message : "unknown error"}`)
    return 1
  }
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/notice-links-check.mjs")) {
  process.exitCode = await runNoticeLinksCli(process.argv.slice(2))
}
