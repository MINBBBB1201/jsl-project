const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Contact = require("../src/models/contact.model");
const Notification = require("../src/models/notification.model");
const {
  createContactInquiryRouter,
} = require("../src/routes/contact-inquiry.router");

// Only synthetic content and a new, disposable MongoDB instance are used.
const policy = {
  kind: "fixture",
  approved: true,
  approvedBy: "local-test-fixture",
  noticeId: "db-contact-test-v1",
  effectiveDate: "2026-10-13",
  purpose: "Synthetic database integration test",
  items: ["contactName", "email", "message", "companyName", "subject"],
  retentionDescription: "Removed with disposable test database",
  refusalConsequence: "No test inquiry without consent",
  privacyContact: "Synthetic test only",
};
function appFor(options = {}) {
  const app = express();
  app.use(
    require("../src/middleware/request-body.middleware").createRequestBodyParser(),
  );
  app.use(
    "/api/contact",
    createContactInquiryRouter({
      policy,
      ContactModel: Contact,
      allowFixture: true,
      ...options,
    }),
  );
  return app;
}
const app = appFor();
let mongod;
before(async () => {
  mongod = await MongoMemoryServer.create({
    instance: {
      dbName: "jsl_contact_readiness_test",
      // Smaller logs only for this disposable test DB on machines with little space.
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
  await Notification.createIndexes();
});
beforeEach(async () => {
  await Contact.deleteMany({});
  await Notification.deleteMany({});
});
after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
async function sample() {
  const notice = (await request(app).get("/api/contact/notice")).body;
  return {
    contactName: "Test Person",
    email: "person@example.test",
    message: "Synthetic cargo only",
    consent: {
      accepted: true,
      noticeId: notice.noticeId,
      noticeHash: notice.noticeHash,
      language: "ko",
      acceptedAt: "1900-01-01",
    },
  };
}
function send(body, key = "mongo-test-key-0001", target = app) {
  return request(target)
    .post("/api/contact")
    .set("Idempotency-Key", key)
    .send(body);
}
test("HTTP to Mongo stores server consent, snapshot and a safe receipt", async () => {
  const body = await sample();
  const response = await send(body);
  assert.equal(response.status, 201);
  const saved = await Contact.findOne().lean();
  assert.equal(saved.consent.accepted, true);
  assert.equal(
    saved.consent.noticeSnapshot.noticeHash,
    body.consent.noticeHash,
  );
  assert.notEqual(saved.consent.acceptedAt.getUTCFullYear(), 1900);
  assert(!Object.hasOwn(saved, "inquiryFingerprint"));
  assert(!Object.hasOwn(saved, "inquiryRequestKey"));
  assert.deepEqual(Object.keys(response.body.data).sort(), [
    "createdAt",
    "id",
    "status",
  ]);
  assert(!JSON.stringify(response.body).includes(body.email));
});
test("12 concurrent HTTP retries across two service instances create one Mongo record", async () => {
  const body = await sample();
  const secondApp = appFor();
  const responses = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      send(body, "parallel-mongo-key", i % 2 ? app : secondApp),
    ),
  );
  assert.equal(responses.filter((r) => r.status === 201).length, 1);
  assert.equal(responses.filter((r) => r.status === 200).length, 11);
  assert.equal(new Set(responses.map((r) => r.body.data.id)).size, 1);
  assert.equal(await Contact.countDocuments(), 1);
});
test("a new router instance can replay the stored receipt", async () => {
  const body = await sample();
  const first = await send(body);
  const replay = await send(body, "mongo-test-key-0001", appFor());
  assert.equal(replay.status, 200);
  assert.equal(replay.body.data.id, first.body.data.id);
});
test("different content cannot reuse a stored key", async () => {
  const body = await sample();
  await send(body);
  body.message = "Different synthetic cargo";
  assert.equal((await send(body)).status, 409);
  assert.equal(await Contact.countDocuments(), 1);
});
test("missing consent, old notice and extra personal data cannot save", async () => {
  const body = await sample();
  const invalid = [
    { ...body, consent: { ...body.consent, accepted: false } },
    { ...body, consent: { ...body.consent, noticeId: "old" } },
    { ...body, phone: "do-not-collect" },
  ];
  for (const item of invalid)
    assert([400, 409].includes((await send(item)).status));
  assert.equal(await Contact.countDocuments(), 0);
});
test("unapproved and fixture production policies are blocked", async () => {
  const body = await sample();
  for (const target of [
    appFor({ policy: { ...policy, approved: false } }),
    appFor({ allowFixture: false }),
  ]) {
    assert.equal(
      (await request(target).get("/api/contact/notice")).status,
      503,
    );
    assert.equal((await send(body, "mongo-test-key-0001", target)).status, 503);
  }
  assert.equal(await Contact.countDocuments(), 0);
});
test("legacy inquiries keep unknown consent and are compatible with the partial index", async () => {
  await Contact.create([
    {
      contactName: "Legacy Test",
      email: "legacy@example.test",
      message: "Old synthetic inquiry",
    },
    {
      contactName: "Legacy Test 2",
      email: "legacy2@example.test",
      message: "Another old synthetic inquiry",
    },
  ]);
  const records = await Contact.find().lean();
  assert.equal(records.length, 2);
  assert(records.every((r) => r.consent === undefined));
});
test("HTTP parser rejects malformed, oversize, non-JSON and invalid email without values in errors", async () => {
  assert.equal(
    (await request(app).post("/api/contact").type("json").send("{")).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post("/api/contact")
        .type("json")
        .send(JSON.stringify({ message: "a".repeat(33000) }))
    ).status,
    413,
  );
  assert.equal(
    (await request(app).post("/api/contact").type("text").send("text")).status,
    415,
  );
  const body = await sample();
  body.email = "private-email@invalid..example";
  const response = await send(body);
  assert.equal(response.status, 400);
  assert(!JSON.stringify(response.body).includes(body.email));
  assert.equal(await Contact.countDocuments(), 0);
});
test("contact router keeps its own errors while the shared 404 and parser handlers stay in force", async () => {
  // server.js 와 같은 순서: 전역 body parser → 문의 라우터 → notFoundHandler → errorHandler.
  // error.middleware 는 logger → config 를 불러오며 MONGO_URI 가 없으면 throw 한다.
  // 이 테스트는 500 경로를 타지 않으므로 기존 알림 테스트처럼 logger 만 대체한다.
  const loggerPath = require.resolve("../src/utils/logger");
  const previousLogger = require.cache[loggerPath];
  require.cache[loggerPath] = { exports: { error() {} } };
  let notFoundHandler, errorHandler;
  try {
    ({
      notFoundHandler,
      errorHandler,
    } = require("../src/middleware/error.middleware"));
  } finally {
    if (previousLogger) require.cache[loggerPath] = previousLogger;
    else delete require.cache[loggerPath];
  }
  const shared = appFor();
  shared.post("/api/other", (_req, res) => res.json({ ok: true }));
  shared.use(notFoundHandler);
  shared.use(errorHandler);
  // 문의 경로: 32KB 파서와 문의 전용 공개 오류 코드를 유지한다.
  const malformed = await request(shared)
    .post("/api/contact")
    .type("json")
    .send("{");
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.code, "INVALID_JSON");
  const oversize = await request(shared)
    .post("/api/contact")
    .type("json")
    .send(JSON.stringify({ message: "a".repeat(33000) }));
  assert.equal(oversize.status, 413);
  assert.equal(oversize.body.code, "BODY_TOO_LARGE");
  // 문의 라우터에 없는 하위 경로와 다른 경로는 공통 404 문구를 쓴다.
  for (const path of ["/api/contact/unknown", "/api/unregistered"]) {
    const missing = await request(shared).get(path);
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.body, { status: "fail", message: "Route not found." });
  }
  // 문의 밖 경로는 전역 10KB 파서의 고정 413/400 응답을 유지한다.
  const other = await request(shared)
    .post("/api/other")
    .type("json")
    .send(JSON.stringify({ message: "a".repeat(11000) }));
  assert.equal(other.status, 413);
  assert.deepEqual(other.body, { status: "fail", message: "Request body is too large." });
  const otherMalformed = await request(shared)
    .post("/api/other")
    .type("json")
    .send("{");
  assert.equal(otherMalformed.status, 400);
  assert.deepEqual(otherMalformed.body, { status: "fail", message: "Invalid JSON request body." });
});
test("missing unique index blocks all persistence instead of using unsafe local dedupe", async () => {
  const body = await sample();
  await send(body, "before-index-removed");
  await Contact.collection.dropIndex("contact_inquiry_request_unique");
  try {
    assert.equal((await send(body, "missing-index-key", app)).status, 503);
    assert.equal(
      (await send(body, "missing-index-new-router", appFor())).status,
      503,
    );
    assert.equal(await Contact.countDocuments(), 1);
  } finally {
    await Contact.createIndexes();
  }
});

test("a journaled receipt and unique index survive a MongoDB process restart", async () => {
  const body = await sample();
  const first = await send(body, "restart-mongo-key");
  assert.equal(first.status, 201);
  await mongoose.disconnect();
  await mongod.stop({ doCleanup: false });
  await mongod.start();
  await mongoose.connect(mongod.getUri());
  assert.equal(
    await Contact.countDocuments(),
    1,
    "The original database must survive restart",
  );
  const restoredIndexes = await Contact.collection.indexes();
  assert(
    restoredIndexes.some(
      (index) => index.name === "contact_inquiry_request_unique",
    ),
    `The unique index must survive restart: ${JSON.stringify(restoredIndexes)}`,
  );
  const replay = await send(body, "restart-mongo-key", appFor());
  assert.equal(replay.status, 200);
  assert.equal(replay.body.data.id, first.body.data.id);
  assert.equal(await Contact.countDocuments(), 1);
});

test("language-specific notices cannot silently fall back to Korean", async () => {
  const target = appFor({
    policies: {
      ko: policy,
      en: {
        ...policy,
        noticeId: "english-v1",
        purpose: "English synthetic notice",
      },
    },
  });
  const notice = (await request(target).get("/api/contact/notice?language=en"))
    .body;
  assert.equal(notice.language, "en");
  assert.equal(
    (await request(target).get("/api/contact/notice?language=vi")).status,
    503,
  );
  assert.equal(
    (await request(target).get("/api/contact/notice?language=unknown")).status,
    400,
  );
  const body = await sample();
  body.consent.language = "en";
  assert.equal((await send(body, "language-test-key", target)).status, 409);
  body.consent.noticeId = notice.noticeId;
  body.consent.noticeHash = notice.noticeHash;
  assert.equal((await send(body, "language-test-key", target)).status, 201);
});

test("renewed consent after a lost response returns the original receipt", async () => {
  const body = await sample();
  const first = await send(body, "notice-renewal-key");
  const target = appFor({
    policy: {
      ...policy,
      noticeId: "renewed-notice",
      purpose: "Updated synthetic purpose",
    },
  });
  assert.equal((await send(body, "notice-renewal-key", target)).status, 409);
  const notice = (await request(target).get("/api/contact/notice")).body;
  body.consent.noticeId = notice.noticeId;
  body.consent.noticeHash = notice.noticeHash;
  const replay = await send(body, "notice-renewal-key", target);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.data.id, first.body.data.id);
  assert.equal(await Contact.countDocuments(), 1);
  assert.equal((await Contact.findOne()).consent.noticeId, policy.noticeId);
});

test("maximum-length Korean content fits the JSON intake limit", async () => {
  const body = await sample();
  body.message = "가".repeat(5000);
  assert.equal((await send(body)).status, 201);
});

test("operator notification failures do not undo a durable receipt", async () => {
  let calls = 0;
  const target = appFor({
    notifyReceipt: async () => {
      calls++;
      throw new Error("synthetic notification failure");
    },
  });
  const body = await sample();
  const first = await send(body, "notification-retry-key", target);
  const replay = await send(body, "notification-retry-key", target);
  assert.equal(first.status, 201);
  assert.equal(replay.status, 200);
  assert.equal(first.body.data.id, replay.body.data.id);
  assert.equal(calls, 2);
  assert.equal(await Contact.countDocuments(), 1);
});

test("policy loader fails closed without disclosing file errors", () => {
  const { loadContactPolicies } = require("../src/config/contact-policy");
  for (const content of ["{", "[]", '{"unexpected":{}}']) {
    assert(
      Object.values(
        loadContactPolicies({
          policyPath: "synthetic.json",
          readFile: () => content,
        }),
      ).every((value) => value === null),
    );
  }
  assert(
    Object.values(loadContactPolicies({ policyPath: "" })).every(
      (value) => value === null,
    ),
  );
  assert(
    Object.values(
      loadContactPolicies({
        policyPath: "synthetic.json",
        readFile: () => {
          throw new Error("private path");
        },
      }),
    ).every((value) => value === null),
  );
  assert.deepEqual(
    loadContactPolicies({
      policyPath: "synthetic.json",
      readFile: () => JSON.stringify({ ko: policy }),
    }).ko,
    policy,
  );
});

test("real operator notifications deduplicate receipts without copying customer data", async () => {
  // Isolate log/config startup; the real notification model and service are exercised.
  const loggerPath = require.resolve("../src/utils/logger");
  const previousLogger = require.cache[loggerPath];
  require.cache[loggerPath] = { exports: { error() {} } };
  try {
    const {
      notifyContactReceipt,
    } = require("../src/services/notification.service");
    const target = appFor({ notifyReceipt: notifyContactReceipt });
    const body = await sample();
    const first = await send(body, "real-notification-key", target);
    const replay = await send(body, "real-notification-key", target);
    assert.equal(first.status, 201);
    assert.equal(replay.status, 200);
    assert.equal(await Notification.countDocuments(), 1);
    const notification = await Notification.findOne().lean();
    assert.equal(notification.dedupeKey, `contact:${first.body.data.id}`);
    assert(!notification.message.includes(body.email));
    assert(!notification.message.includes(body.contactName));
  } finally {
    if (previousLogger) require.cache[loggerPath] = previousLogger;
    else delete require.cache[loggerPath];
  }
});

test("a notice with minimum fields rejects undisclosed optional data", async () => {
  const target = appFor({
    policy: { ...policy, items: ["contactName", "email", "message"] },
  });
  const notice = (await request(target).get("/api/contact/notice")).body;
  const body = await sample();
  body.consent.noticeHash = notice.noticeHash;
  body.companyName = "Undisclosed synthetic company";
  assert.equal((await send(body, "minimal-fields-key", target)).status, 400);
  delete body.companyName;
  assert.equal((await send(body, "minimal-fields-key", target)).status, 201);
});
