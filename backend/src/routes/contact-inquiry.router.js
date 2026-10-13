const express = require("express");
const { body, validationResult } = require("express-validator");
const { createInquiryService } = require("../services/contact-inquiry.service");
const {
  createContactInquiryRepository,
} = require("../services/contact-inquiry.repository");

// Each published notice has an explicitly configured language and approval.
function createContactInquiryRouter({
  policy,
  policies,
  ContactModel,
  allowFixture = false,
  notifyReceipt = async () => {},
}) {
  const configured = policies ?? { ko: policy };
  const services = new Map(
    ["ko", "en", "zh", "vi"].map((language) => [
      language,
      createInquiryService({
        policy: configured[language],
        repository: createContactInquiryRepository(ContactModel),
        allowFixture,
      }),
    ]),
  );
  const router = express.Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  router.get("/notice", (req, res) => {
    const language = req.query.language ?? "ko";
    if (typeof language !== "string" || !services.has(language))
      return res.status(400).json({ success: false, code: "INVALID_LANGUAGE" });
    const notice = services.get(language).getNotice();
    if (!notice)
      return res.status(503).json({ success: false, code: "POLICY_NOT_READY" });
    res.json({ ...notice, language });
  });
  router.post(
    "/",
    (req, res, next) => {
      if (!req.is("application/json"))
        return res.status(415).json({ success: false, code: "JSON_REQUIRED" });
      next();
    },
    express.json({ limit: "32kb" }),
    body("email").isString().bail().trim().isEmail(),
    async (req, res) => {
      if (!validationResult(req).isEmpty())
        return res.status(400).json({
          success: false,
          code: "VALIDATION_FAILED",
          errors: [{ field: "email", code: "INVALID_EMAIL" }],
        });
      const language = req.body?.consent?.language;
      if (!services.has(language))
        return res
          .status(400)
          .json({
            success: false,
            code: "VALIDATION_FAILED",
            errors: [{ field: "consent", code: "INVALID_LANGUAGE" }],
          });
      const result = await services
        .get(language)
        .submit(req.body, req.get("Idempotency-Key"));
      // Notification failure must never change a durable inquiry receipt into an error.
      if (result.body.success) {
        try {
          await notifyReceipt(result.body.data.id);
        } catch {
          /* retry on the next receipt replay */
        }
      }
      res.status(result.status).json(result.body);
    },
  );
  router.use((error, _req, res, _next) => {
    const status =
      error.type === "entity.too.large"
        ? 413
        : error.type === "entity.parse.failed"
          ? 400
          : 503;
    res.status(status).json({
      success: false,
      code:
        status === 413
          ? "BODY_TOO_LARGE"
          : status === 400
            ? "INVALID_JSON"
            : "REQUEST_FAILED",
    });
  });
  return router;
}
module.exports = { createContactInquiryRouter };
