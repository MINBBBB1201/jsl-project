const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const logger = require('../utils/logger');

const MAX_LIMIT = 50;

/**
 * 알림 목록 + 안읽음 개수.
 *
 * 종 아이콘은 목록과 배지 숫자를 동시에 필요로 한다. 요청을 두 번 보내면
 * 두 값이 어긋난 순간이 화면에 보이므로 한 응답에 함께 담는다.
 */
exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      MAX_LIMIT
    );
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = unreadOnly ? { read: false } : {};

    const [items, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ read: false })
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: items.map((n) => ({
          id: n._id.toString(),
          type: n.type,
          message: n.message,
          trackingNumber: n.relatedTrackingNumber ?? null,
          read: n.read,
          createdAt: n.createdAt
        })),
        unreadCount
      }
    });
  } catch (error) {
    logger.error('알림 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '알림을 불러오지 못했습니다.'
    });
  }
};

/** 알림 하나를 읽음 처리 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: '잘못된 알림 ID 입니다.' });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: '알림을 찾을 수 없습니다.' });
    }

    const unreadCount = await Notification.countDocuments({ read: false });

    res.status(200).json({ success: true, data: { id, unreadCount } });
  } catch (error) {
    logger.error('알림 읽음 처리 실패:', error);
    res.status(500).json({ success: false, error: '읽음 처리에 실패했습니다.' });
  }
};

/** 전체 읽음 처리 */
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      data: { updated: result.modifiedCount, unreadCount: 0 }
    });
  } catch (error) {
    logger.error('알림 전체 읽음 처리 실패:', error);
    res.status(500).json({ success: false, error: '읽음 처리에 실패했습니다.' });
  }
};
