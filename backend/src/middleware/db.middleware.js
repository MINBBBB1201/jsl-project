const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * DB 연결 확인.
 *
 * 원래 auth.middleware.js 의 checkDbAuth 라는 이름으로 있던 함수다.
 * 이름 때문에 인증이 걸려 있는 것으로 오해되기 쉬워 여기로 옮기고 이름을 바꿨다.
 * (실제 인증은 auth.middleware.js 의 requireAuth 가 담당한다.)
 */
exports.checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    logger.error('MongoDB 연결이 활성 상태가 아닙니다.');
    return res.status(503).json({
      success: false,
      error: '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
    });
  }

  next();
};
