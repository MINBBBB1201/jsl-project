const { createHash } = require("node:crypto");

const FIELDS = {
  companyName: 200,
  contactName: 100,
  email: 320,
  subject: 200,
  message: 5000,
};
const REQUIRED = ["contactName", "email", "message"];
const LANGUAGES = ["ko", "en", "zh", "vi"];
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const text = (value) => typeof value === "string" && value.trim().length > 0;
const plain = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));

function policyReadiness(policy, { allowFixture = false } = {}) {
  const missing = [];
  if (!plain(policy)) return { ready: false, missing: ["policy"] };
  if (policy.approved !== true) missing.push("approved");
  if (!text(policy.approvedBy)) missing.push("approvedBy");
  if (!text(policy.noticeId)) missing.push("noticeId");
  const effectiveDate =
    text(policy.effectiveDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(policy.effectiveDate)
      ? new Date(`${policy.effectiveDate}T00:00:00Z`)
      : null;
  if (
    !effectiveDate ||
    !Number.isFinite(effectiveDate.valueOf()) ||
    effectiveDate.toISOString().slice(0, 10) !== policy.effectiveDate
  )
    missing.push("effectiveDate");
  if (!text(policy.purpose)) missing.push("purpose");
  if (
    !Array.isArray(policy.items) ||
    !policy.items.length ||
    policy.items.some((k) => !Object.hasOwn(FIELDS, k)) ||
    REQUIRED.some((k) => !policy.items.includes(k)) ||
    new Set(policy.items).size !== policy.items.length
  )
    missing.push("items");
  if (!text(policy.retentionDescription)) missing.push("retentionDescription");
  if (!text(policy.refusalConsequence)) missing.push("refusalConsequence");
  if (!text(policy.privacyContact)) missing.push("privacyContact");
  if (!["operational", "fixture"].includes(policy.kind)) missing.push("kind");
  if (policy.kind === "fixture" && allowFixture !== true)
    missing.push("fixtureNotAllowed");
  return { ready: missing.length === 0, missing };
}

function notice(policy) {
  const view = {
    noticeId: policy.noticeId,
    effectiveDate: policy.effectiveDate,
    purpose: policy.purpose,
    items: [...policy.items],
    retentionDescription: policy.retentionDescription,
    refusalConsequence: policy.refusalConsequence,
    privacyContact: policy.privacyContact,
  };
  return { ...view, noticeHash: digest(view) };
}

function validateInquiry(body, policy) {
  if (!plain(body))
    return { errors: [{ field: "form", code: "INVALID_BODY" }] };
  const errors = [];
  for (const key of Object.keys(body)) {
    if (!Object.hasOwn(FIELDS, key) && key !== "consent")
      errors.push({ field: "form", code: "UNEXPECTED_FIELD" });
  }
  const data = {};
  for (const [field, max] of Object.entries(FIELDS)) {
    const value = body[field];
    if (value === undefined && !REQUIRED.includes(field)) continue;
    if (typeof value !== "string" || value.length > max) {
      errors.push({ field, code: "INVALID_FIELD" });
      continue;
    }
    const normalized = value.trim();
    if (REQUIRED.includes(field) && !normalized)
      errors.push({ field, code: "REQUIRED_FIELD" });
    if (normalized && !policy.items.includes(field))
      errors.push({ field, code: "UNDISCLOSED_FIELD" });
    if (!normalized && !REQUIRED.includes(field)) continue;
    data[field] = field === "email" ? normalized.toLowerCase() : normalized;
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.push({ field: "email", code: "INVALID_EMAIL" });
  const consent = body.consent;
  if (!plain(consent) || consent.accepted !== true)
    errors.push({ field: "consent", code: "CONSENT_REQUIRED" });
  const current = notice(policy);
  if (plain(consent)) {
    if (
      consent.noticeId !== current.noticeId ||
      consent.noticeHash !== current.noticeHash
    )
      errors.push({ field: "consent", code: "NOTICE_CHANGED" });
    if (!LANGUAGES.includes(consent.language))
      errors.push({ field: "consent", code: "INVALID_LANGUAGE" });
  }
  return { errors, data, current };
}

function createInquiryService({
  policy,
  repository,
  clock = () => new Date(),
  allowFixture = false,
}) {
  // Freeze the server's published notice so a caller cannot mutate it after startup.
  const configured = plain(policy) ? JSON.parse(JSON.stringify(policy)) : null;
  const readiness = policyReadiness(configured, { allowFixture });
  Object.freeze(readiness.missing);
  Object.freeze(readiness);
  if (!repository || typeof repository.saveOnce !== "function")
    throw new TypeError("repository.saveOnce is required");
  return {
    readiness,
    getNotice: () => (readiness.ready ? notice(configured) : null),
    async submit(body, idempotencyKey) {
      if (!readiness.ready)
        return {
          status: 503,
          body: { success: false, code: "POLICY_NOT_READY" },
        };
      if (
        typeof idempotencyKey !== "string" ||
        !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)
      ) {
        return {
          status: 400,
          body: { success: false, code: "INVALID_REQUEST_KEY" },
        };
      }
      const result = validateInquiry(body, configured);
      if (result.errors.length)
        return {
          status: result.errors.some((e) => e.code === "NOTICE_CHANGED")
            ? 409
            : 400,
          body: {
            success: false,
            code: "VALIDATION_FAILED",
            errors: result.errors,
          },
        };
      try {
        const acceptedAt = clock().toISOString();
        const consent = {
          accepted: true,
          noticeId: result.current.noticeId,
          noticeHash: result.current.noticeHash,
          language: body.consent.language,
          acceptedAt,
          noticeSnapshot: result.current,
        };
        // Client timestamps, IPs, user agents and extra fields are never used as evidence.
        // Notice refresh must not turn a retry of the same inquiry into a new inquiry.
        const fingerprint = digest({ ...result.data, language: consent.language });
        const saved = await repository.saveOnce({
          key: idempotencyKey,
          fingerprint,
          record: {
            ...result.data,
            consent,
            createdAt: acceptedAt,
            status: "received",
          },
        });
        if (saved.conflict)
          return {
            status: 409,
            body: { success: false, code: "REQUEST_KEY_CONFLICT" },
          };
        if (
          !plain(saved.record) ||
          !text(saved.record.id) ||
          !text(saved.record.createdAt) ||
          !Number.isFinite(Date.parse(saved.record.createdAt)) ||
          saved.record.status !== "received" ||
          typeof saved.replayed !== "boolean"
        )
          throw new TypeError("Invalid repository receipt");
        return {
          status: saved.replayed ? 200 : 201,
          body: {
            success: true,
            data: {
              id: saved.record.id,
              createdAt: saved.record.createdAt,
              status: saved.record.status,
            },
            replayed: saved.replayed,
          },
        };
      } catch {
        return { status: 503, body: { success: false, code: "SAVE_FAILED" } };
      }
    },
  };
}

module.exports = {
  policyReadiness,
  notice,
  validateInquiry,
  createInquiryService,
};
