const Contact = require('../models/contact.model');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');

// Create a new contact inquiry
exports.createContact = async (req, res) => {
  try {
    const { companyName, contactName, email, subject, message } = req.body;

    const contact = await Contact.create({
      companyName,
      contactName,
      email,
      subject,
      message
    });

    logger.info(`New contact inquiry received from ${contact.email}`);

    // 운영자용 인앱 알림. 실패해도 문의 접수 자체는 성공으로 응답한다
    // (알림은 부가 기능이고, 실패 시 고객이 문의를 다시 보내게 만들면 안 된다).
    await notificationService.notifyNewContact(contact);

    res.status(201).json({
      success: true,
      data: {
        id: contact._id,
        createdAt: contact.createdAt
      },
      message: 'Contact inquiry submitted successfully'
    });
  } catch (error) {
    logger.error('Error creating contact inquiry:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid contact data: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit contact inquiry',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
