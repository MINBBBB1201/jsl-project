const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { chromium } = require(
  path.join(process.env.JSL_REVIEW_DEPENDENCIES, "node_modules/playwright"),
);
const axe = fs.readFileSync(
  path.join(
    process.env.JSL_REVIEW_DEPENDENCIES,
    "node_modules/axe-core/axe.min.js",
  ),
  "utf8",
);
const Contact = require("../../backend/src/models/contact.model");
const {
  createContactInquiryRouter,
} = require("../../backend/src/routes/contact-inquiry.router");
const output = path.resolve(process.argv[2]);
const languages = ["ko", "en", "zh", "vi"];
const policy = {
  kind: "fixture",
  approved: true,
  approvedBy: "synthetic-browser-test",
  noticeId: "browser-v1",
  effectiveDate: "2026-10-13",
  purpose: "Synthetic contact component test",
  items: ["companyName", "contactName", "email", "subject", "message"],
  retentionDescription: "Deleted with disposable test database",
  refusalConsequence: "No synthetic inquiry without consent",
  privacyContact: "Synthetic test only",
};
const configured = (value) =>
  Object.fromEntries(languages.map((language) => [language, value]));
let router;
function configure(value = policy) {
  router = createContactInquiryRouter({
    policies: configured(value),
    ContactModel: Contact,
    allowFixture: true,
  });
}
async function main() {
  let mongod, server, browser;
  const summary = {
    scope:
      "Actual ContactSection component + real Express router + disposable MongoDB; Next routing, server rendering and production fonts excluded",
    states: [],
    flows: [],
  };
  try {
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: "jsl_contact_browser_test",
        args:
          process.env.JSL_TEST_SMALL_JOURNAL === "1"
            ? [
                "--wiredTigerEngineConfigString",
                "log=(prealloc=false,file_max=10MB)",
              ]
            : [],
      },
    });
    await mongoose.connect(mongod.getUri());
    await Contact.createIndexes();
    configure();
    const app = express();
    app.use("/api/contact", (req, res, next) => router(req, res, next));
    app.use(express.static(output));
    app.use(express.static(path.resolve(__dirname, "../../frontend/public")));
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({
      executablePath: process.env.JSL_CHROME_PATH,
      headless: true,
    });
    async function open(language = "ko", theme = "light", mobile = false) {
      const page = await browser.newPage({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
      });
      page.on("pageerror", (error) => {
        throw error;
      });
      await page.goto(`${base}/?language=${language}&theme=${theme}`);
      await page.locator("input:not([type=checkbox])").nth(1).waitFor();
      await page.waitForFunction(
        () =>
          !document.querySelectorAll("input:not([type=checkbox])")[1].disabled,
      );
      return page;
    }
    async function fill(page, message = "Synthetic cargo inquiry") {
      await page
        .locator("input:not([type=checkbox])")
        .nth(1)
        .fill("Synthetic Person");
      await page.locator("input[type=email]").fill("person@example.test");
      await page.locator("textarea").fill(message);
      await page.getByRole("checkbox").check();
    }
    const submit = (page) => page.locator("button[type=submit]").click();
    for (const language of languages)
      for (const theme of ["light", "dark"])
        for (const mobile of [false, true]) {
          const page = await open(language, theme, mobile);
          await page.addScriptTag({ content: axe });
          const audit = await page.evaluate(async () => {
            const result = await window.axe.run(
              document.querySelector("main"),
              {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag21aa"],
                },
              },
            );
            return result.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              targets: v.nodes.map((n) => n.target),
            }));
          });
          assert.deepEqual(
            audit,
            [],
            `${language}/${theme}/${mobile}: ${JSON.stringify(audit)}`,
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          if (language === "ko")
            await page.screenshot({
              path: path.join(
                output,
                `${language}-${theme}-${mobile ? "mobile" : "desktop"}.png`,
              ),
              fullPage: true,
            });
          summary.states.push({
            language,
            theme,
            viewport: mobile ? "mobile" : "desktop",
            accessibilityViolations: audit.length,
            horizontalOverflow: false,
          });
          await page.close();
        }
    const page = await open();
    await page.getByRole("checkbox").focus();
    await page.keyboard.press("Space");
    assert.equal(await page.getByRole("checkbox").isChecked(), true);
    await submit(page);
    assert.equal(
      await page
        .locator("input:not([type=checkbox])")
        .nth(1)
        .evaluate((node) => node === document.activeElement),
      true,
    );
    await page.keyboard.type("Synthetic Person");
    await page.keyboard.press("Tab");
    await page.keyboard.type("person@example.test");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Synthetic cargo inquiry");
    summary.flows.push("keyboard consent toggle and required-field focus");
    await fill(page);
    await submit(page);
    await page
      .getByRole("status")
      .filter({ hasText: "문의 접수 번호" })
      .waitFor();
    const receiptText = await page.getByRole("status").textContent();
    await submit(page);
    await page.waitForFunction((previous) => {
      const status = document.querySelector("[role=status]");
      return (
        status &&
        status.textContent.includes("문의 접수 번호") &&
        status.textContent !== previous
      );
    }, receiptText);
    assert.notEqual(await page.getByRole("status").textContent(), receiptText);
    assert.equal(await Contact.countDocuments(), 2);
    summary.flows.push("submit after a receipt creates a new inquiry");
    await page.locator("textarea").fill("Lost response synthetic cargo");
    let first = true;
    let lostReceipt;
    await page.route("**/api/contact", async (route) => {
      if (first) {
        first = false;
        const savedResponse = await route.fetch();
        assert.equal(savedResponse.status(), 201);
        lostReceipt = await savedResponse.json();
        assert.equal(lostReceipt.replayed, false);
        await route.abort();
      } else await route.continue();
    });
    await submit(page);
    await page.getByRole("alert").waitFor();
    assert.equal(await page.locator("button[type=submit]").isEnabled(), true);
    const countBeforeReload = await Contact.countDocuments();
    assert.equal(countBeforeReload, 3);
    assert.equal(typeof lostReceipt?.data?.id, 'string');
    const pendingMetadata = await page.evaluate(() => JSON.parse(sessionStorage.getItem('jsl.contact.retry.v1')));
    assert.deepEqual(Object.keys(pendingMetadata).sort(), ['expiresAt', 'identityHash', 'key', 'version']);
    assert(!JSON.stringify(pendingMetadata).includes('person@example.test'));
    await page.reload();
    await page.waitForFunction(() => !document.querySelectorAll('input:not([type=checkbox])')[1].disabled);
    assert.equal(await page.getByRole('checkbox').isChecked(), false);
    assert.equal(await page.locator('input[type=email]').inputValue(), '');
    await fill(page, 'Lost response synthetic cargo');
    const replayResponsePromise = page.waitForResponse(response => response.url() === `${base}/api/contact` && response.request().method() === 'POST');
    await submit(page);
    const replayResponse = await replayResponsePromise;
    assert.equal(replayResponse.status(), 200);
    const replayedReceipt = await replayResponse.json();
    assert.equal(replayedReceipt.replayed, true);
    assert.equal(replayedReceipt.data.id, lostReceipt.data.id);
    await page
      .getByRole("status")
      .filter({ hasText: "문의 접수 번호" })
      .waitFor();
    const countAfterRetry = await Contact.countDocuments();
    assert.equal(countAfterRetry, 3);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('jsl.contact.retry.v1')), null);
    summary.reloadRetryProof = {
      initialStatus: 201,
      countBeforeReload,
      retryStatus: replayResponse.status(),
      replayed: replayedReceipt.replayed,
      sameReceipt: replayedReceipt.data.id === lostReceipt.data.id,
      countAfterRetry,
      emailRestored: false,
      consentRestored: false,
      metadataCleared: true,
    };
    summary.flows.push("lost response survives reload and renewed consent without duplicate");
    await page.unroute("**/api/contact");
    configure({
      ...policy,
      noticeId: "browser-v2",
      purpose: "Updated synthetic notice",
    });
    await page.locator("textarea").fill("Renewed consent synthetic cargo");
    await submit(page);
    await page.getByRole("alert").filter({ hasText: "변경" }).waitFor();
    await page.waitForFunction(
      () => !document.querySelector("button[role=checkbox]").disabled,
    );
    assert.equal(await page.getByRole("checkbox").isChecked(), false);
    await page.getByRole("checkbox").check();
    await submit(page);
    await page
      .getByRole("status")
      .filter({ hasText: "문의 접수 번호" })
      .waitFor();
    assert.equal(await Contact.countDocuments(), 4);
    summary.flows.push("changed notice requires renewed consent");
    await Contact.collection.dropIndex("contact_inquiry_request_unique");
    await page.locator("textarea").fill("No index synthetic inquiry");
    await submit(page);
    await page.getByRole("alert").waitFor();
    assert.equal(await page.getByRole("status").count(), 0);
    assert.equal(await Contact.countDocuments(), 4);
    await Contact.createIndexes();
    summary.flows.push("database save failure never displays a receipt");
    configure(null);
    await page.reload();
    await page.getByRole("status").filter({ hasText: "준비 중" }).waitFor();
    assert.equal(await page.locator("button[type=submit]").isDisabled(), true);
    summary.flows.push("unapproved policy disables online intake");
    await page.close();
    fs.writeFileSync(
      path.join(output, "browser-summary.json"),
      JSON.stringify(summary, null, 2),
    );
    console.log(
      JSON.stringify({
        states: summary.states.length,
        flows: summary.flows,
        accessibilityViolations: 0,
      }),
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
}
main().catch((error) => {
  console.error(error.stack);
  process.exitCode = 1;
});
