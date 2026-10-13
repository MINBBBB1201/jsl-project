const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Contact = require("../src/models/contact.model");
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
});
beforeEach(async () => {
  await Contact.deleteMany({});
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

test("an orderly MongoDB restart keeps the receipt and unique index", async () => {
  const body = await sample();
  const first = await send(body, "restart-mongo-key");
  assert.equal(first.status, 201);
  await mongoose.disconnect();
  await mongod.stop({ doCleanup: false });
  await mongod.start();
  await mongoose.connect(mongod.getUri());
  const replay = await send(body, "restart-mongo-key", appFor());
  assert.equal(replay.status, 200);
  assert.equal(replay.body.data.id, first.body.data.id);
  assert.equal(await Contact.countDocuments(), 1);
});
