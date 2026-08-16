const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { ROLES, MIN_PASSWORD_LENGTH } = require('../models/user.model');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * 로그인 시도 제한.
 * 비밀번호 대입 공격을 늦춘다. 성공한 로그인은 세지 않는다.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.'
  }
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('올바른 이메일을 입력해 주세요.').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('비밀번호를 입력해 주세요.'),
    validate
  ],
  authController.login
);

router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);

// 계정 발급은 관리자만. 공개 회원가입은 두지 않는다.
router.post(
  '/register',
  requireAuth,
  requireRole('admin'),
  [
    body('email').isEmail().withMessage('올바른 이메일을 입력해 주세요.').normalizeEmail(),
    body('password')
      .isString()
      .isLength({ min: MIN_PASSWORD_LENGTH })
      .withMessage(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`),
    body('name').isString().trim().notEmpty().withMessage('이름을 입력해 주세요.'),
    body('role').optional().isIn(ROLES).withMessage(`역할은 ${ROLES.join(', ')} 중 하나여야 합니다.`),
    validate
  ],
  authController.register
);

module.exports = router;
