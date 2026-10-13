// This adapter uses a unique database index, not a process-local retry map.
function createContactInquiryRepository(ContactModel) {
  async function ensureIndex() {
    const indexes = await ContactModel.collection.indexes();
    const index = indexes.find(
      (item) => item.name === "contact_inquiry_request_unique",
    );
    if (
      !index?.unique ||
      index.key?.inquiryRequestKey !== 1 ||
      index.partialFilterExpression?.inquiryRequestKey?.$type !== "string"
    ) {
      throw new Error("Contact inquiry unique index is not ready");
    }
  }
  function receipt(record) {
    return {
      id: String(record._id),
      createdAt: new Date(record.createdAt).toISOString(),
      status: record.status,
    };
  }
  return {
    async saveOnce({ key, fingerprint, record }) {
      await ensureIndex();
      try {
        const document = new ContactModel({
          ...record,
          inquiryRequestKey: key,
          inquiryFingerprint: fingerprint,
        });
        // Acknowledgement must include the journal, including on a standalone DB.
        const saved = await document.save({
          writeConcern: { w: "majority", j: true, wtimeout: 10000 },
        });
        return { record: receipt(saved), replayed: false };
      } catch (error) {
        if (error.code !== 11000) throw error;
        const existing = await ContactModel.findOne({ inquiryRequestKey: key })
          .select("+inquiryFingerprint")
          .lean()
          .exec();
        if (!existing) throw error;
        if (existing.inquiryFingerprint !== fingerprint)
          return { conflict: true };
        return { record: receipt(existing), replayed: true };
      }
    },
  };
}
module.exports = { createContactInquiryRepository };
