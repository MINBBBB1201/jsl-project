/* Loopback-only integration: real browser fetch + actual inquiry router + disposable Mongo. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { chromium } = require(process.env.JSL_PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "../..");
const Contact = require(path.join(root, "backend/src/models/contact.model"));
const { createContactInquiryRouter } = require(
  path.join(root, "backend/src/routes/contact-inquiry.router"),
);
const { createRequestBodyParser } = require(
  path.join(root, "backend/src/middleware/request-body.middleware"),
);
const base = new URL(process.env.JSL_REVIEW_URL || "http://localhost:4192");
assert.equal(
  base.origin,
  "http://localhost:4192",
  "This isolated test only supports the owned4192 review build",
);
assert(
  require("node:fs")
    .readFileSync(
      path.join(root, "frontend/.next/static/chunks/6856-7509bb2a29235738.js"),
      "utf8",
    )
    .includes("http://localhost:5000"),
  "Review build must use loopback API",
);
assert(
  process.env.MONGOMS_SYSTEM_BINARY,
  "Use an existing Mongo binary; downloads are prohibited",
);
const out = path.resolve(
  process.env.JSL_HTTP_MONGO_EVIDENCE ||
    path.join(require("node:os").tmpdir(), "jsl-http-mongo-browser"),
);
let db,
  server,
  browser,
  router,
  loseNext = false;
const requests = [],
  checks = [];
function recordCheck(value) {
  checks.push(value);
  console.log(JSON.stringify(value));
}
const policy = (language, version = 1) => ({
  kind: "fixture",
  approved: true,
  approvedBy: "synthetic-local-review",
  noticeId: `synthetic-${language}-${version}`,
  effectiveDate: "2026-11-06",
  purpose: "SYNTHETIC LOCAL REVIEW. Not an approved company notice.",
  items: ["companyName", "contactName", "email", "subject", "message"],
  retentionDescription:
    "Disposable test data only; removed when this local check ends.",
  refusalConsequence: "No synthetic submission without consent.",
  privacyContact: "Synthetic review only; not an operational privacy contact.",
});
function configure(available, version = 1) {
  router = createContactInquiryRouter({
    policies: Object.fromEntries(
      ["ko", "en", "zh", "vi"].map((l) => [
        l,
        available ? policy(l, version) : null,
      ]),
    ),
    ContactModel: Contact,
    allowFixture: true,
    notifyReceipt: async () => {},
  });
}
async function fill(form, message) {
  await form.locator("input[name=company]").fill("Synthetic Review Co");
  await form.locator("input[name=name]").fill("Synthetic Review Person");
  await form.locator("input[name=email]").fill("review@example.test");
  await form.locator("input[name=subject]").fill("Local integration only");
  await form.locator("textarea[name=message]").fill(message);
}
async function pageFor(locale, width = 1440) {
  const ctx = await browser.newContext({
    viewport: { width, height: width === 1440 ? 1000 : 844 },
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const p = await ctx.newPage();
  p.setDefaultTimeout(12000);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base.origin + "/" + locale + "/landing", {
    waitUntil: "domcontentloaded",
  });
  const form = p.locator("#contact form");
  await form.waitFor();
  return { ctx, p, form, errors };
}
const submit = async (p, form) => {
  const response = p.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/contact" &&
      r.request().method() === "POST",
  );
  await form.locator("button[type=submit]").click();
  return await response;
};
(async () => {
  await fs.mkdir(out, { recursive: true });
  try {
    db = await MongoMemoryServer.create({
      binary: {
        systemBinary: process.env.MONGOMS_SYSTEM_BINARY,
        version: "7.0.24",
      },
      instance: {
        ip: "127.0.0.1",
        dbName: "jsl_browser_contact_disposable",
        args: [
          "--wiredTigerEngineConfigString",
          "log=(prealloc=false,file_max=10MB)",
        ],
      },
    });
    await mongoose.connect(db.getUri());
    await Contact.createIndexes();
    configure(false);
    const app = express();
    app.use((req, res, next) => {
      const row = { method: req.method, path: req.path };
      requests.push(row);
      res.on("finish", () => (row.status = res.statusCode));
      next();
    });
    app.use(
      cors({
        origin: (origin, cb) => cb(null, !origin || origin === base.origin),
        credentials: true,
      }),
    );
    app.use(createRequestBodyParser());
    app.use("/api/contact", (req, res, next) => {
      if (loseNext && req.method === "POST") {
        const original = res.json.bind(res);
        res.json = (body) => {
          if (body.success) {
            requests.push({ event: "stored-response-lost", id: body.data.id });
            res.socket.destroy();
            return res;
          }
          return original(body);
        };
      }
      return router(req, res, next);
    });
    server = await new Promise((resolve, reject) => {
      const s = app.listen(5000, "::1", () => resolve(s));
      s.on("error", reject);
    });
    browser = await chromium.launch({
      headless: true,
      args: [
        "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
      ],
      executablePath: process.env.JSL_CHROMIUM_PATH || undefined,
    });
    // No mocked contact responses: all GET/OPTIONS/POST requests reach the local Express router.
    {
      const { ctx, p, form, errors } = await pageFor("en");
      await form
        .locator(":scope > div[role=status] button")
        .waitFor({ state: "visible" });
      await p.waitForFunction(
        () =>
          document.querySelector("#contact form")?.getAttribute("aria-busy") ===
          "false",
      );
      assert(await form.locator("input[name=name]").isDisabled());
      assert(await form.locator("button[type=submit]").isDisabled());
      assert.equal(await Contact.countDocuments(), 0);
      assert.equal(await form.locator('a[href^="mailto:"]').count(), 2);
      assert.deepEqual(errors, []);
      recordCheck({ case: "real503-blocks-intake", pass: true });
      await ctx.close();
    }
    configure(true);
    for (const locale of ["ko", "en", "zh", "vi"]) {
      await Contact.deleteMany({});
      const { ctx, p, form, errors } = await pageFor(
        locale,
        locale === "ko" || locale === "en" ? 1440 : 390,
      );
      await form.locator("input[name=name]").waitFor();
      await p.waitForFunction(
        () => !document.querySelector("#contact input[name=name]").disabled,
      );
      await fill(form, "Synthetic actual HTTP and disposable DB integration.");
      await form.locator("button[role=checkbox]").check();
      const r = await submit(p, form),
        body = await r.json();
      assert.equal(r.status(), 201);
      await form
        .locator(":scope > p[role=status]")
        .filter({ hasText: body.data.id })
        .waitFor();
      const saved = await Contact.findOne().lean();
      assert.equal(saved.consent.language, locale);
      assert.equal(await Contact.countDocuments(), 1);
      assert(saved.consent.noticeSnapshot.noticeHash);
      assert.deepEqual(errors, []);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
        0,
      );
      recordCheck({
        case: "real201-mongo-save",
        locale,
        width: locale === "ko" || locale === "en" ? 1440 : 390,
        pass: true,
      });
      if (locale === "en") {
        await form.locator(":scope > p[role=status]").scrollIntoViewIfNeeded();
        await p.screenshot({
          path: path.join(out, "synthetic-local-http-mongo-receipt-en.png"),
        });
      }
      await ctx.close();
    }
    // Lose the HTTP response after the real DB acknowledgement, reload and replay the same key.
    {
      await Contact.deleteMany({});
      const { ctx, p, form, errors } = await pageFor("en", 390);
      await p.waitForFunction(
        () => !document.querySelector("#contact input[name=name]").disabled,
      );
      const message = "Synthetic response-loss retry integration.";
      await fill(form, message);
      await form.locator("button[role=checkbox]").check();
      loseNext = true;
      await form.locator("button[type=submit]").click();
      await form.locator(":scope > p[role=alert]").waitFor({ timeout: 25000 });
      loseNext = false;
      const first = await Contact.findOne().lean();
      assert(first);
      await p.reload({ waitUntil: "domcontentloaded" });
      await p.waitForFunction(
        () => !document.querySelector("#contact input[name=name]").disabled,
      );
      await fill(form, message);
      await form.locator("button[role=checkbox]").check();
      const r = await submit(p, form),
        body = await r.json();
      assert.equal(r.status(), 200);
      assert.equal(body.replayed, true);
      assert.equal(body.data.id, String(first._id));
      assert.equal(await Contact.countDocuments(), 1);
      recordCheck({
        case: "lost-response-reload-real200-same-record",
        pass: true,
      });
      // A changed published fixture must clear consent and refuse the stale request.
      configure(true, 2);
      await form
        .locator("textarea[name=message]")
        .fill("Synthetic stale notice integration.");
      const stale = await submit(p, form);
      assert.equal(stale.status(), 409);
      await p.waitForFunction(() => {
        const c = document.querySelector("#contact button[role=checkbox]");
        return c?.getAttribute("data-state") === "unchecked" && !c.disabled;
      });
      assert.equal(await Contact.countDocuments(), 1);
      assert(await form.locator("button[type=submit]").isDisabled());
      assert.deepEqual(errors, []);
      recordCheck({ case: "real409-refreshes-notice-and-consent", pass: true });
      await ctx.close();
    }
    // Public privacy is independent from an available test consent notice.
    for (const locale of ["ko", "en", "zh", "vi"]) {
      const { ctx, p } = await pageFor(locale, 390);
      await p.goto(base.origin + "/" + locale + "/privacy", {
        waitUntil: "domcontentloaded",
      });
      const text = await p.locator("article").innerText();
      const html = await p.content();
      assert(
        !/3년|3 years|3年|3 năm|2026-08-16|August 16, 2026|2026年8月16日/.test(
          text,
        ),
      );
      assert(!/retained for 3 years|3년간 보관/.test(html));
      assert(!/name="description" content="How .* collects/.test(html));
      assert.equal(await p.locator("article section").count(), 2);
      recordCheck({
        case: "unapproved-public-privacy-hidden",
        locale,
        pass: true,
      });
      await ctx.close();
    }
    const preflights = requests.filter((r) => r.method === "OPTIONS");
    assert(
      preflights.length > 0,
      "Browser must exercise actual CORS preflight",
    );
    assert(preflights.every((r) => r.status === 204));
    recordCheck({
      case: "real-browser-cors-preflight",
      count: preflights.length,
      pass: true,
    });
    const files = [
      "frontend/src/config/legal-content.ts",
      "frontend/src/app/landing/components/cta-section.tsx",
      "frontend/src/app/landing/components/contact-section.tsx",
      "backend/src/routes/contact-inquiry.router.js",
      "backend/src/services/contact-inquiry.repository.js",
    ];
    const sourceHashes = {};
    for (const f of files)
      sourceHashes[f] = createHash("sha256")
        .update(
          (await fs.readFile(path.join(root, f), "utf8")).replace(
            /\r\n/g,
            "\n",
          ),
        )
        .digest("hex");
    await fs.writeFile(
      path.join(out, "results.json"),
      JSON.stringify(
        {
          scope:
            "Real local Next build -> HTTP Express actual inquiry router -> disposable Mongo7.0.24, synthetic policy and data only. Not full backend server or production CORS/DB/notification verification.",
          uncommittedSourceAtExecution: true,
          checks,
          requests,
          sourceHashes,
        },
        null,
        2,
      ),
    );
    console.log(JSON.stringify(checks));
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
    if (db) await db.stop();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
