const User = require('../models/user.model');
const logger = require('../utils/logger');
const { verifyToken, extractBearerToken } = require('../utils/jwt');

/**
 * 인증·권한 미들웨어.
 *
 * ⚠️ 예전 이 파일의 checkDbAuth 는 이름만 인증이고 실제로는 mongoose 연결
 *    상태만 확인했다. 그래서 /api/shipments 이하 모든 엔드포인트(상태 변경 PATCH 포함)가
 *    사실상 공개 상태였다. 그 함수는 db.middleware.js 의 checkDbConnection 으로
 *    옮기고, 이 파일은 진짜 인증만 담당한다.
 *
 * 응답 코드는 인증 실패/권한 부족 모두 403 을 쓴다.
 * (401 은 WWW-Authenticate 헤더를 동반한 브라우저 기본 인증 흐름을 의미하는데,
 *  여기서는 브라우저 팝업이 아니라 자체 로그인 화면으로 유도하기 때문이다.)
 */

const forbidden = (res, error, code) =>
  res.status(403).json({ success: false, error, code });

/**
 * 로그인 필수. 통과하면 req.user 에 { id, email, name, role } 이 담긴다.
 *
 * 토큰 payload 의 role 을 그대로 믿지 않고 DB 를 다시 읽는다.
 * 발급 후 권한이 내려갔거나 계정이 비활성화된 경우를 바로 반영하기 위해서다.
 */
exports.requireAuth = async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    return forbidden(res, '로그인이 필요한 요청입니다.', 'AUTH_REQUIRED');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    // 만료와 위조를 구분해 안내한다 (만료면 다시 로그인하면 되는 상황이므로)
    const expired = error.name === 'TokenExpiredError';
    logger.warn(`토큰 검증 실패 (${error.name}): ${req.method} ${req.originalUrl}`);
    return forbidden(
      res,
      expired ? '로그인이 만료되었습니다. 다시 로그인해 주세요.' : '유효하지 않은 인증 정보입니다.',
      expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
    );
  }

  try {
    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      return forbidden(res, '사용할 수 없는 계정입니다. 관리자에게 문의해 주세요.', 'ACCOUNT_DISABLED');
    }

    req.user = user.toSafeJSON();
    next();
  } catch (error) {
    logger.error('인증 처리 중 오류:', error);
    res.status(500).json({
      success: false,
      error: '인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
};

/**
 * 역할 제한. requireAuth 다음에 붙여 쓴다.
 *   router.patch('/x', requireAuth, requireRole('admin', 'operations'), handler)
 */
exports.requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    // 라우터 조립 실수를 조용히 넘기지 않는다
    logger.error('requireRole 이 requireAuth 없이 사용되었습니다.');
    return forbidden(res, '로그인이 필요한 요청입니다.', 'AUTH_REQUIRED');
  }

  if (!allowedRoles.includes(req.user.role)) {
    logger.warn(
      `권한 부족: ${req.user.email}(${req.user.role}) → ${req.method} ${req.originalUrl}`
    );
    return forbidden(res, '이 작업을 수행할 권한이 없습니다.', 'ROLE_FORBIDDEN');
  }

  next();
};
