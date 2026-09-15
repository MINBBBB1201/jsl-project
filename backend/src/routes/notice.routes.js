const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

const controller = require("../controllers/notice.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { NOTICE_CATEGORIES } = require("../config/notices");

/**
 * 접근 정책
 *
 *  공개  : GET /, GET /:id → published 만.
 *  관리자: 생성/수정/삭제, 그리고 draft 포함 전체 목록(GET /all).
 */
const requireAdmin = [requireAuth, requireRole("admin")];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const writeRules = [
  body("title").optional().isString().trim().isLength({ min: 1, max: 200 }),
  body("body").optional().isString().trim().isLength({ min: 1, max: 20000 }),
  body("category").optional().isIn(NOTICE_CATEGORIES),
  body("isPinned").optional().isBoolean(),
  body("isPublished").optional().isBoolean(),
];

// 공개 목록 (published 만)
router.get("/", controller.listPublicNotices);

// 관리자용 전체 목록(draft 포함) — '/:id' 보다 먼저 선언해야 'all' 이 id 로 해석 안 됨
router.get("/all", ...requireAdmin, controller.listAllNotices);

// 공개 단건 (published 만)
router.get("/:id", controller.getPublicNotice);

// 생성 (기본 draft)
router.post(
  "/",
  ...requireAdmin,
  [
    body("title").isString().trim().isLength({ min: 1, max: 200 }),
    body("body").isString().trim().isLength({ min: 1, max: 20000 }),
    body("category").optional().isIn(NOTICE_CATEGORIES),
    body("isPinned").optional().isBoolean(),
    body("isPublished").optional().isBoolean(),
    validate,
  ],
  controller.createNotice,
);

// 수정
router.patch(
  "/:id",
  ...requireAdmin,
  [...writeRules, validate],
  controller.updateNotice,
);

// 삭제
router.delete("/:id", ...requireAdmin, controller.deleteNotice);

module.exports = router;
