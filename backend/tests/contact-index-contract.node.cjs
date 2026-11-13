const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createContactInquiryRepository,
} = require("../src/services/contact-inquiry.repository");

const validIndex = () => ({
  name: "contact_inquiry_request_unique",
  key: { inquiryRequestKey: 1 },
  unique: true,
  partialFilterExpression: { inquiryRequestKey: { $type: "string" } },
});

function harness(index) {
  let saves = 0;
  let constructions = 0;
  class FakeModel {
    static collection = { indexes: async () => [index] };
    constructor(data) {
      constructions++;
      this.data = data;
    }
    async save() {
      saves++;
      return {
        ...this.data,
        _id: "synthetic-receipt",
        createdAt: new Date("2026-11-06T00:00:00Z"),
      };
    }
  }
  return {
    submit: () =>
      createContactInquiryRepository(FakeModel).saveOnce({
        key: "synthetic-key",
        fingerprint: "synthetic-fingerprint",
        record: { status: "received" },
      }),
    counts: () => ({ saves, constructions }),
  };
}

for (const [name, mutate] of [
  [
    "compound unique key",
    (index) => {
      index.key.status = 1;
    },
  ],
  [
    "extra partial filter field",
    (index) => {
      index.partialFilterExpression.status = "received";
    },
  ],
  [
    "extra nested partial constraint",
    (index) => {
      index.partialFilterExpression.inquiryRequestKey.$gt = "m";
    },
  ],
  [
    "non-unique index",
    (index) => {
      index.unique = false;
    },
  ],
]) {
  test(`${name} rejects before constructing or saving an inquiry`, async () => {
    const index = validIndex();
    mutate(index);
    const adapter = harness(index);
    await assert.rejects(adapter.submit(), /unique index is not ready/);
    assert.deepEqual(adapter.counts(), { saves: 0, constructions: 0 });
  });
}

test("the exact index contract permits a durable receipt", async () => {
  const adapter = harness(validIndex());
  const result = await adapter.submit();
  assert.equal(result.record.id, "synthetic-receipt");
  assert.equal(result.replayed, false);
  assert.deepEqual(adapter.counts(), { saves: 1, constructions: 1 });
});

test("normal Mongo index metadata does not invalidate the contract", async () => {
  const adapter = harness({ ...validIndex(), v: 2, background: true });
  assert.equal((await adapter.submit()).record.status, "received");
  assert.equal(adapter.counts().saves, 1);
});
