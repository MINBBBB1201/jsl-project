const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');

const automationController = require('../controllers/automation.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// 내부 운영 정보다. 실행 이력에 화물 번호와 건수가 담긴다.
router.use(requireAuth);

router.get(
  '/logs',
  [
    query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 50 })
      .withMessage('limit 은 1~50 사이여야 합니다.'),
    validate
  ],
  automationController.getLogs
);

module.exports = router;
