const express = require('express');
const router = express.Router();
const { query, param, validationResult } = require('express-validator');

const notificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * 알림은 운영 정보다 — 문의한 회사 이름과 화물 번호가 담기므로 전부 로그인이 필요하다.
 * 읽음 처리는 역할 구분 없이 로그인한 직원이면 할 수 있다 (조회 성격의 동작).
 */
router.use(requireAuth);

router.get(
  '/',
  [
    query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 50 })
      .withMessage('limit 은 1~50 사이여야 합니다.'),
    query('unreadOnly').optional({ values: 'falsy' }).isBoolean()
      .withMessage('unreadOnly 는 true/false 여야 합니다.'),
    validate
  ],
  notificationController.getNotifications
);

// ⚠️ '/:id/read' 보다 먼저 선언해야 한다. 아래에 두면 'read-all' 이 id 로 해석된다.
router.patch('/read-all', notificationController.markAllAsRead);

router.patch(
  '/:id/read',
  [
    param('id').isMongoId().withMessage('잘못된 알림 ID 입니다.'),
    validate
  ],
  notificationController.markAsRead
);

module.exports = router;
