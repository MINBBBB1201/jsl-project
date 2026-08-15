const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const contactController = require('../controllers/contact.controller');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Submit a contact inquiry
router.post(
  '/',
  [
    body('companyName').optional().isString().trim().isLength({ max: 200 })
      .withMessage('Company name must be 200 characters or fewer'),
    body('contactName').isString().trim().notEmpty()
      .withMessage('Contact name is required')
      .isLength({ max: 100 }).withMessage('Contact name must be 100 characters or fewer'),
    // normalizeEmail은 쓰지 않음: gmail 점 제거 등으로 실제 회신 주소가 바뀔 수 있음
    body('email').isString().trim().isEmail().withMessage('Valid email is required'),
    body('subject').optional().isString().trim().isLength({ max: 200 })
      .withMessage('Subject must be 200 characters or fewer'),
    body('message').isString().trim().notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 5000 }).withMessage('Message must be 5000 characters or fewer'),
    validate
  ],
  contactController.createContact
);

module.exports = router;
