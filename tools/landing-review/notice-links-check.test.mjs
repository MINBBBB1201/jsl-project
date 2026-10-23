import assert from "node:assert/strict"
import { createServer } from "node:http"
import test from "node:test"

import { checkNoticeLinks, runNoticeLinksCli } from "./notice-links-check.mjs"

const ROUTES = new Map([
  ["/landing", { locale: "ko", noticesPath: "/notices", type: "landing" }],
  ["/notices", { locale: "ko", type: "notices" }],
  ["/en/landing", { locale: "en", noticesPath: "/en/notices", type: "landing" }],
  ["/en/notices", { locale: "en", type: "notices" }],
  ["/zh/landing", { locale: "zh", noticesPath: "/zh/notices", type: "landing" }],
  ["/zh/notices", { locale: "zh", type: "notices" }],
  ["/vi/landing", { locale: "vi", noticesPath: "/vi/notices", type: "landing" }],
  ["/vi/notices", { locale: "vi", type: "notices" }],
])

function html(locale, body) {
  return `<!doctype html><html lang="${locale}"><head><title>JSL</title></head><body>${body}</body></html>`
}

function successHandler(request, response) {
  const route = ROUTES.get(new URL(request.url, "http://fixture").pathname)
  if (!route) {
    response.writeHead(404, { "content-type": "text/html" })
    response.end(html("ko", "not found"))
    return
  }

  const body = route.type === "landing"
    ? `<main>Landing</main><footer><a href="${route.noticesPath}">Notices</a></footer>`
    : "<main>Notices</main>"
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
  response.end(html(route.locale, body))
}

async function withServer(handler, run) {
  const server = createServer(handler)
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })

  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}`
  try {
    return await run(baseUrl)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test("accepts four locale landing footers and notices documents", async () => {
  await withServer(successHandler, async (baseUrl) => {
    const results = await checkNoticeLinks(baseUrl)
    assert.deepEqual(results.map((result) => result.locale), ["ko", "en", "zh", "vi"])
  })
})

test("rejects a redirect to another origin", async () => {
  await withServer((request, response) => {
    response.writeHead(302, { location: "https://login.example.invalid/" })
    response.end()
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /redirected to another origin/)
  })
})

test("rejects a same-origin login redirect", async () => {
  await withServer((request, response) => {
    response.writeHead(302, { location: "/sign-in" })
    response.end()
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /authentication route/)
  })
})

test("rejects an HTTP authentication error", async () => {
  await withServer((request, response) => {
    response.writeHead(403, { "content-type": "text/html" })
    response.end(html("ko", "protected"))
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /requires authentication \(HTTP 403\)/)
  })
})

test("rejects a 200 login page", async () => {
  await withServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html" })
    response.end('<!doctype html><html lang="ko"><head><title>Sign in</title></head><body><input type="password"></body></html>')
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /login page instead of the app/)
  })
})

test("rejects data-lang without a real lang attribute", async () => {
  await withServer((request, response) => {
    const path = new URL(request.url, "http://fixture").pathname
    if (path === "/landing") {
      response.writeHead(200, { "content-type": "text/html" })
      response.end('<!doctype html><html data-lang="ko"><head><title>JSL</title></head><body><footer><a href="/notices">Notices</a></footer></body></html>')
      return
    }
    successHandler(request, response)
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /missing <html lang>/)
  })
})

test("rejects data-href without a real href attribute", async () => {
  await withServer((request, response) => {
    const path = new URL(request.url, "http://fixture").pathname
    if (path === "/landing") {
      response.writeHead(200, { "content-type": "text/html" })
      response.end('<!doctype html><html lang="ko"><head><title>JSL</title></head><body><footer><a data-href="/notices">Notices</a></footer></body></html>')
      return
    }
    successHandler(request, response)
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /footer is missing href=\/notices/)
  })
})

test("rejects a 200 password page with a normal title", async () => {
  await withServer((request, response) => {
    const path = new URL(request.url, "http://fixture").pathname
    if (path === "/landing") {
      response.writeHead(200, { "content-type": "text/html" })
      response.end('<!doctype html><html lang="ko"><head><title>JSL</title></head><body><input name="password" type="password"><footer><a href="/notices">Notices</a></footer></body></html>')
      return
    }
    successHandler(request, response)
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /login page instead of the app/)
  })
})

test("rejects an HTTP not-found response", async () => {
  await withServer((request, response) => {
    response.writeHead(404, { "content-type": "text/html" })
    response.end(html("ko", "not found"))
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /returned HTTP 404/)
  })
})

test("rejects a missing footer notices href", async () => {
  await withServer((request, response) => {
    const route = ROUTES.get(new URL(request.url, "http://fixture").pathname)
    response.writeHead(200, { "content-type": "text/html" })
    response.end(html(route?.locale ?? "ko", "<footer><a href=\"/tracking\">Tracking</a></footer>"))
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /footer is missing href=\/notices/)
  })
})

test("rejects the wrong document language", async () => {
  await withServer((request, response) => {
    const path = new URL(request.url, "http://fixture").pathname
    const route = ROUTES.get(path)
    const locale = path === "/en/notices" ? "ko" : route?.locale ?? "ko"
    const body = route?.type === "landing"
      ? `<footer><a href="${route.noticesPath}">Notices</a></footer>`
      : "<main>Notices</main>"
    response.writeHead(200, { "content-type": "text/html" })
    response.end(html(locale, body))
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl), /\/en\/notices has lang=ko; expected en/)
  })
})

test("rejects a request that exceeds the timeout", async () => {
  await withServer((request, response) => {
    setTimeout(() => {
      response.writeHead(200, { "content-type": "text/html" })
      response.end(html("ko", '<footer><a href="/notices">Notices</a></footer>'))
    }, 100)
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl, { timeoutMs: 20 }), /timed out after 20ms/)
  })
})

test("rejects a declared response larger than the byte limit", async () => {
  await withServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html", "content-length": "4096" })
    response.end(html("ko", '<footer><a href="/notices">Notices</a></footer>'))
  }, async (baseUrl) => {
    await assert.rejects(checkNoticeLinks(baseUrl, { maxBytes: 256 }), /exceeded the 256-byte response limit/)
  })
})

test("returns a nonzero CLI code for a meaningful failure", async () => {
  await withServer((request, response) => {
    response.writeHead(500, { "content-type": "text/html" })
    response.end(html("ko", "failed"))
  }, async (baseUrl) => {
    const output = []
    const code = await runNoticeLinksCli([baseUrl], {
      log: (message) => output.push(message),
      error: (message) => output.push(message),
    })
    assert.equal(code, 1)
    assert.match(output.join("\n"), /^FAIL \/landing returned HTTP 500$/)
  })
})
