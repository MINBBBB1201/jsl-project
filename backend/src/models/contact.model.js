const mongoose = require("mongoose");

const noticeSnapshotSchema = new mongoose.Schema(
  {
    noticeId: { type: String, required: true },
    noticeHash: { type: String, required: true },
    effectiveDate: { type: String, required: true },
    purpose: { type: String, required: true },
    items: { type: [String], required: true },
    retentionDescription: { type: String, required: true },
    refusalConsequence: { type: String, required: true },
    privacyContact: { type: String, required: true },
  },
  { _id: false },
);

const consentSchema = new mongoose.Schema(
  {
    accepted: {
      type: Boolean,
      required: true,
      validate: (value) => value === true,
    },
    noticeId: { type: String, required: true },
    noticeHash: { type: String, required: true },
    language: { type: String, required: true, enum: ["ko", "en", "zh", "vi"] },
    acceptedAt: { type: Date, required: true },
    noticeSnapshot: { type: noticeSnapshotSchema, required: true },
  },
  { _id: false },
);

const contactSchema = new mongoose.Schema({
  companyName: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  contactName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 320,
  },
  subject: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  // Optional for historical inquiries. Never invent consent for existing records.
  consent: { type: consentSchema },
  inquiryRequestKey: { type: String, select: false, immutable: true },
  inquiryFingerprint: { type: String, select: false, immutable: true },
  status: { type: String, enum: ["received"] },
});

contactSchema.index(
  { inquiryRequestKey: 1 },
  {
    name: "contact_inquiry_request_unique",
    unique: true,
    partialFilterExpression: { inquiryRequestKey: { $type: "string" } },
  },
);

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
