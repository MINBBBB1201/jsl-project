const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/config');

/**
 * JWT 발급/검증.
 *
 * 세션(express-session) 대신 JWT 를 쓴 이유:
 *  - 프론트(Vercel)와 API(Render)가 다른 도메인이라 세션 쿠키를 쓰려면
 *    SameSite=None + 크로스사이트 쿠키 설정이 필요하고, 브라우저 정책 변화에 취약하다.
 *  - 백엔드가 여러 인스턴스로 뜨는 환경에서 세션 저장소를 따로 두지 않아도 된다.
 *
 * 토큰은 Authorization: Bearer <token> 헤더로 받는다.
 */

/** 토큰 payload 는 최소한만 담는다. 권한은 요청 시점에 DB 에서 다시 확인한다. */
const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn
  });

const verifyToken = (token) => jwt.verify(token, jwtSecret);

/** Authorization 헤더에서 Bearer 토큰을 꺼낸다. 없으면 null. */
const extractBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
};

module.exports = { signToken, verifyToken, extractBearerToken, jwtExpiresIn };
