const LOCALES = [
  { locale: "ko", landingPath: "/landing", noticesPath: "/notices" },
  { locale: "en", landingPath: "/en/landing", noticesPath: "/en/notices" },
  { locale: "zh", landingPath: "/zh/landing", noticesPath: "/zh/notices" },
  { locale: "vi", landingPath: "/vi/landing", noticesPath: "/vi/notices" },
]

const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024
const RAW_TEXT_TAGS = new Set([
  "iframe",
  "noembed",
  "noframes",
  "noscript",
  "script",
  "style",
  "textarea",
  "title",
  "xmp",
])

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

function tagEndIndex(html, startIndex) {
  let quote = null
  for (let index = startIndex + 1; index < html.length; index += 1) {
    const character = html[index]
    if (quote) {
      if (character === quote) quote = null
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === ">") {
      return index
    }
  }
  return -1
}

function rawTextEnd(html, contentStart, tagName) {
  if (tagName === "plaintext") {
    return { contentEnd: html.length, nextIndex: html.length }
  }

  const closingTag = new RegExp(`</${tagName}(?=\\s|/?>)`, "ig")
  closingTag.lastIndex = contentStart
  const match = closingTag.exec(html)
  if (!match) {
    return { contentEnd: html.length, nextIndex: html.length }
  }

  const endIndex = tagEndIndex(html, match.index)
  if (endIndex === -1) {
    return { contentEnd: match.index, nextIndex: html.length }
  }
  return { contentEnd: match.index, nextIndex: endIndex + 1 }
}

function escapeMarkupText(value) {
  return value.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function* tagTokens(html) {
  let index = 0
  while (index < html.length) {
    const startIndex = html.indexOf("<", index)
    if (startIndex === -1) return

    const tagEnd = tagEndIndex(html, startIndex)
    if (tagEnd === -1) {
      return
    }

    const tag = html.slice(startIndex, tagEnd + 1)
    const match = tag.match(/^<(\/?)([a-z][a-z0-9:-]*)\b/i)
    if (match) {
      yield {
        tag,
        name: match[2].toLowerCase(),
        closing: match[1] === "/",
        startIndex,
        endIndex: tagEnd + 1,
      }
    }
    index = tagEnd + 1
  }
}

function elementContent(html, tagName) {
  let contentStart = -1
  let depth = 0
  for (const token of tagTokens(html)) {
    if (token.name !== tagName) continue
    if (token.closing) {
      if (depth > 0) depth -= 1
      if (depth === 0 && contentStart !== -1) {
        return html.slice(contentStart, token.startIndex)
      }
    } else {
      if (depth === 0) contentStart = token.endIndex
      depth += 1
    }
  }
  return null
}

function stripInertMarkup(html) {
  const visibleParts = []
  let index = 0
  let templateDepth = 0

  while (index < html.length) {
    if (html.startsWith("<!--", index)) {
      const commentEnd = html.indexOf("-->", index + 4)
      index = commentEnd === -1 ? html.length : commentEnd + 3
      continue
    }

    if (html[index] !== "<") {
      const nextTag = html.indexOf("<", index)
      const nextIndex = nextTag === -1 ? html.length : nextTag
      if (templateDepth === 0) visibleParts.push(html.slice(index, nextIndex))
      index = nextIndex
      continue
    }

    const endIndex = tagEndIndex(html, index)
    if (endIndex === -1) {
      if (templateDepth === 0) visibleParts.push(html.slice(index))
      break
    }

    const tag = html.slice(index, endIndex + 1)
    const match = tag.match(/^<(\/?)([a-z][a-z0-9:-]*)\b/i)
    if (!match) {
      if (templateDepth === 0) visibleParts.push(tag)
      index = endIndex + 1
      continue
    }

    const closing = match[1] === "/"
    const tagName = match[2].toLowerCase()

    if (templateDepth > 0) {
      if (!closing && (RAW_TEXT_TAGS.has(tagName) || tagName === "plaintext")) {
        index = rawTextEnd(html, endIndex + 1, tagName).nextIndex
        continue
      }
      if (tagName === "template") {
        templateDepth += closing ? -1 : 1
      }
      index = endIndex + 1
      continue
    }

    if (!closing && tagName === "template") {
      templateDepth = 1
      index = endIndex + 1
      continue
    }

    if (!closing && (RAW_TEXT_TAGS.has(tagName) || tagName === "plaintext")) {
      const rawText = rawTextEnd(html, endIndex + 1, tagName)
      if (tagName === "title") {
        visibleParts.push(`<title>${escapeMarkupText(html.slice(endIndex + 1, rawText.contentEnd))}</title>`)
      }
      index = rawText.nextIndex
      continue
    }

    visibleParts.push(tag)
    index = endIndex + 1
  }

  return visibleParts.join("")
}

function looksLikeLoginPage(html) {
  const title = elementContent(html, "title") ?? ""
  if (/\b(?:log[ -]?in|sign[ -]?in|authentication)\b|로그인/i.test(title)) return true
  return [...tagTokens(html)]
    .some((token) => !token.closing
      && token.name === "input"
      && tagAttributeValue(token.tag, "type")?.toLowerCase() === "password")
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

    const visibleHtml = stripInertMarkup(html)
    if (looksLikeLoginPage(visibleHtml)) {
      throw new NoticeLinksCheckError(`${routePath} returned a login page instead of the app`)
    }
    return { html: visibleHtml, requestUrl, contentLanguage: response.headers.get("content-language") }
  } finally {
    clearTimeout(timer)
  }
}

function decodeAttribute(value) {
  const namedReferences = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  }
  return value.replace(/&(?:amp|apos|gt|lt|quot|#(?:\d+|x[0-9a-f]+));/gi, (reference) => {
    const entity = reference.slice(1, -1).toLowerCase()
    if (Object.hasOwn(namedReferences, entity)) return namedReferences[entity]

    const codePoint = entity[1] === "x"
      ? Number.parseInt(entity.slice(2), 16)
      : Number.parseInt(entity.slice(1), 10)
    if (!Number.isInteger(codePoint) || codePoint === 0 || codePoint > 0x10ffff
      || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
      return "\uFFFD"
    }
    return String.fromCodePoint(codePoint)
  })
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
  const tag = [...tagTokens(html)].find((token) => token.name === "html" && !token.closing)?.tag ?? ""
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
  const footer = elementContent(html, "footer")
  if (footer === null) {
    throw new NoticeLinksCheckError(`${routePath} is missing a footer element`)
  }

  return [...tagTokens(footer)]
    .filter((token) => token.name === "a" && !token.closing)
    .map((token) => tagAttributeValue(token.tag, "href"))
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
