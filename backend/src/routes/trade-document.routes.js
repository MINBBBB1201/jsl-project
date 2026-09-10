const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const controller = require('../controllers/trade-document.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { TRADE_DOCUMENT_TYPES } = require('../config/trade-documents');

/**
 * 무역서류(상업송장·포장명세서·프로포마)는 전부 내부 업무 기능이다.
 * 고객 연락처·거래 단가가 담기므로 저장·조회 모두 로그인이 필요하다.
 * 역할 제한은 두지 않는다 — 서류 작성은 영업·운영 공통 업무다.
 * (발행 권한을 좁히려면 여기 requireRole 을 추가하면 된다)
 */
router.use(requireAuth);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * input 은 공개 생성기(Phase 1)의 TradeDocumentInput 과 같은 모양이다.
 * 사업 규칙(수량 > 0 등)은 Phase 1 의 validateInput 이 프론트에서 잡는다.
 * 여기서는 구조만 본다 — items 가 배열인지, 있으면 각 줄에 description 이 있는지.
 */
const inputRules = [
  body('input').isObject().withMessage('input 은 객체여야 합니다.'),
  body('input.items').optional().isArray().withMessage('input.items 는 배열이어야 합니다.'),
  body('input.items.*.description').optional().isString().trim().isLength({ max: 500 }),
];

// 목록
router.get('/', controller.listTradeDocuments);

// 단건 + 개정 체인
router.get('/:id', controller.getTradeDocument);

// draft 생성
router.post(
  '/',
  [
    body('type').isIn(TRADE_DOCUMENT_TYPES)
      .withMessage(`type 은 ${TRADE_DOCUMENT_TYPES.join(', ')} 중 하나여야 합니다.`),
    body('shipmentId').optional({ values: 'null' }).isString(),
    ...inputRules,
    validate,
  ],
  controller.createTradeDocument
);

// draft 편집
router.patch(
  '/:id',
  [
    body('input').optional().isObject(),
    body('input.items').optional().isArray(),
    body('shipmentId').optional({ values: 'null' }),
    validate,
  ],
  controller.updateTradeDocument
);

// 발행 (draft → issued)
router.post('/:id/issue', controller.issueTradeDocument);

// 개정 (issued → 새 draft)
router.post('/:id/revise', controller.reviseTradeDocument);

// draft 삭제
router.delete('/:id', controller.deleteTradeDocument);

module.exports = router;
