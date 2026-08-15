const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const chatController = require('../controllers/chat.controller');
const { KNOWLEDGE_CATEGORIES } = require('../models/knowledge.model');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// 카테고리 목록 + 문서 수
router.get('/categories', chatController.getCategories);

// 사용자 메시지 → RAG 검색 → Grok 호출 → 응답
router.post(
  '/',
  [
    body('message').isString().trim().notEmpty()
      .withMessage('메시지를 입력해 주세요.')
      .isLength({ max: 2000 }).withMessage('메시지는 2000자 이하로 입력해 주세요.'),
    body('category').optional({ values: 'falsy' }).isIn(KNOWLEDGE_CATEGORIES)
      .withMessage(`category는 ${KNOWLEDGE_CATEGORIES.join(', ')} 중 하나여야 합니다.`),
    body('history').optional().isArray({ max: 20 })
      .withMessage('history는 최대 20개까지 전달할 수 있습니다.'),
    validate
  ],
  chatController.chat
);

module.exports = router;
