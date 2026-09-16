const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const chatController = require("../controllers/chat.controller");
const { KNOWLEDGE_CATEGORIES } = require("../models/knowledge.model");

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * AI 호출 비용 방어.
 * 로그인 여부와 무관하게 요청마다 Groq 호출이 그대로 비용으로 샌다 — 로그인
 * 제한만으로는 막을 방법이 없어 IP 단위로 분당 상한을 둔다(auth.routes.js
 * 의 loginLimiter와 같은 패턴). 값은 사내 다른 프로젝트(DAEMUN)의 안내
 * 챗봇 레이트리밋과 동일한 분당 10회.
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "요청이 너무 잦습니다. 1분 후 다시 시도해 주세요.",
  },
});

// 카테고리 목록 + 문서 수
router.get("/categories", chatController.getCategories);

// 사용자 메시지 → RAG 검색 → Grok 호출 → 응답
router.post(
  "/",
  chatLimiter,
  [
    body("message")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("메시지를 입력해 주세요.")
      .isLength({ max: 2000 })
      .withMessage("메시지는 2000자 이하로 입력해 주세요."),
    body("category")
      .optional({ values: "falsy" })
      .isIn(KNOWLEDGE_CATEGORIES)
      .withMessage(
        `category는 ${KNOWLEDGE_CATEGORIES.join(", ")} 중 하나여야 합니다.`,
      ),
    body("history")
      .optional()
      .isArray({ max: 20 })
      .withMessage("history는 최대 20개까지 전달할 수 있습니다."),
    validate,
  ],
  chatController.chat,
);

module.exports = router;
